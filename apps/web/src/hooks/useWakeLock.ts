import { useEffect } from 'react';

/**
 * Mantém a tela acesa enquanto `enabled` (treino ativo, #341). O navegador solta o bloqueio quando
 * a aba some; ele é pedido de novo ao voltar. Sem suporte ou sem permissão, segue sem bloquear.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        /* recusado (bateria fraca, aba oculta): segue sem bloquear */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [enabled]);
}
