import { useState, useEffect, useRef, useCallback } from 'react';
import type { WorkoutSession, WorkoutTemplate, SyncStatus } from '@powerlifting/shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'powerlifting_token';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

interface SyncPayload {
  workouts: WorkoutSession[];
  templates: WorkoutTemplate[];
}

interface UseSyncManagerOptions {
  /** Chamada quando o servidor retorna dados mais recentes após sync/pull. */
  onSyncComplete: (payload: SyncPayload) => void;
}

interface UseSyncManagerResult {
  syncStatus: SyncStatus;
  /** Dispara sync manualmente (ex.: ao completar um treino). */
  triggerSync: (payload: SyncPayload) => void;
  /** Baixa todos os dados do servidor (para novo dispositivo após login). */
  pullFromServer: () => Promise<SyncPayload | null>;
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function postSync(payload: SyncPayload, token: string): Promise<SyncPayload> {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Sync falhou: ${res.status}`);
  }

  const data = await res.json() as {
    workouts: Array<{ data: unknown }>;
    templates: Array<{ data: unknown }>;
  };

  // O servidor devolve rows com { data: WorkoutSession } e { data: WorkoutTemplate }
  return {
    workouts: data.workouts.map((r) => r.data as WorkoutSession),
    templates: data.templates.map((r) => r.data as WorkoutTemplate),
  };
}

async function fetchPull(token: string): Promise<SyncPayload> {
  const res = await fetch(`${API_BASE}/sync/pull`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Pull falhou: ${res.status}`);
  }

  const data = await res.json() as {
    workouts: Array<{ data: unknown }>;
    templates: Array<{ data: unknown }>;
  };

  return {
    workouts: data.workouts.map((r) => r.data as WorkoutSession),
    templates: data.templates.map((r) => r.data as WorkoutTemplate),
  };
}

export function useSyncManager({ onSyncComplete }: UseSyncManagerOptions): UseSyncManagerResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    navigator.onLine ? 'idle' : 'offline',
  );

  // Payload pendente de sync — armazenado em ref para evitar re-renders desnecessários
  const pendingPayload = useRef<SyncPayload | null>(null);
  const isSyncing = useRef(false);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  // Ref para auto-referência sem violar react-hooks/immutability
  const doSyncRef = useRef<((payload: SyncPayload) => Promise<void>) | null>(null);

  const doSync = useCallback(
    async (payload: SyncPayload) => {
      if (isSyncing.current) return;

      const token = getToken();
      if (!token) {
        // Sem autenticação: nada a fazer, mantém idle
        return;
      }

      isSyncing.current = true;
      setSyncStatus('syncing');

      try {
        const result = await postSync(payload, token);
        retryCount.current = 0;
        pendingPayload.current = null;
        setSyncStatus('idle');
        onSyncComplete(result);
      } catch {
        retryCount.current += 1;
        setSyncStatus('error');
        pendingPayload.current = payload;

        // Exponential backoff: 1, 2, 4 minutos (cap 4 min)
        const delayMs = Math.min(Math.pow(2, retryCount.current - 1) * 60_000, 4 * 60_000);
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
        retryTimeout.current = setTimeout(() => {
          if (pendingPayload.current && doSyncRef.current) {
            doSyncRef.current(pendingPayload.current);
          }
        }, delayMs);
      } finally {
        isSyncing.current = false;
      }
    },
    [onSyncComplete],
  );

  // Mantém o ref em sincronia com a versão atual do callback
  useEffect(() => {
    doSyncRef.current = doSync;
  }, [doSync]);

  const triggerSync = useCallback(
    (payload: SyncPayload) => {
      if (!navigator.onLine) {
        pendingPayload.current = payload;
        setSyncStatus('offline');
        return;
      }
      doSync(payload);
    },
    [doSync],
  );

  const pullFromServer = useCallback(async (): Promise<SyncPayload | null> => {
    const token = getToken();
    if (!token || !navigator.onLine) return null;

    setSyncStatus('syncing');
    try {
      const result = await fetchPull(token);
      setSyncStatus('idle');
      return result;
    } catch {
      setSyncStatus('error');
      return null;
    }
  }, []);

  // Ouve eventos online/offline do browser
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => (prev === 'offline' ? 'idle' : prev));
      if (pendingPayload.current) {
        doSync(pendingPayload.current);
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [doSync]);

  // Sync periódico a cada 5 min quando online e autenticado
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && pendingPayload.current && getToken()) {
        doSync(pendingPayload.current);
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [doSync]);

  // Limpa timeouts de retry ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  return { syncStatus, triggerSync, pullFromServer };
}
