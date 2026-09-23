import { decodeStrengthPayload, encodeStrengthPayload, type StrengthPayload } from '@powerlifting/shared';

/**
 * Handoff da calculadora "Quão forte você é" (landing) para o cadastro (issue #318).
 *
 * A landing manda para `/registro#forca=<payload>`. No boot o app guarda o payload
 * em `sessionStorage` com `apply: false` e limpa a URL. Só o cadastro concluído
 * (e-mail, ou Google com `created: true`) vira `apply: true`; o `AppContent` então
 * consome o stash uma única vez e semeia a conta. Login de conta existente
 * descarta o stash — nunca duplicamos dados em quem já tem histórico.
 *
 * Único lugar do app que toca `sessionStorage`; tudo em try/catch (aba privada,
 * storage bloqueado) — na falha, o cadastro segue normal.
 */

export const HANDOFF_STORAGE_KEY = 'powerlifting_strength_handoff';
export const REGISTER_PATH = '/registro';

export type HandoffStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface HandoffLocation {
  pathname: string;
  search: string;
  hash: string;
}

interface Stash {
  payload: StrengthPayload;
  apply: boolean;
}

function browserStorage(): HandoffStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function browserReplaceUrl(url: string): void {
  try {
    window.history.replaceState(null, '', url);
  } catch {
    // sem history (improvável): a URL só fica suja, o fluxo segue
  }
}

function readStash(storage: HandoffStorage | null): Stash | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stash>;
    // Revalida o payload pelo mesmo decoder: o storage não é fonte confiável.
    const payload = parsed.payload ? decodeStrengthPayload(encodeStrengthPayload(parsed.payload)) : null;
    if (!payload) {
      storage.removeItem(HANDOFF_STORAGE_KEY);
      return null;
    }
    return { payload, apply: parsed.apply === true };
  } catch {
    return null;
  }
}

function writeStash(storage: HandoffStorage | null, stash: Stash): void {
  try {
    storage?.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(stash));
  } catch {
    // storage cheio/bloqueado: segue sem handoff
  }
}

function removeStash(storage: HandoffStorage | null): void {
  try {
    storage?.removeItem(HANDOFF_STORAGE_KEY);
  } catch {
    // idem
  }
}

/**
 * Lê `#forca=` da URL (uma vez, no boot), guarda o payload válido sem marcar para
 * aplicar e limpa `/registro` + fragmento da barra de endereço (mantém a query).
 * `openRegister` indica que a tela de auth deve abrir no modo cadastro.
 */
export function captureHandoffFromUrl(
  location: HandoffLocation,
  storage: HandoffStorage | null = browserStorage(),
  replaceUrl: (url: string) => void = browserReplaceUrl,
): { openRegister: boolean } {
  const hash = location.hash.replace(/^#/, '');
  const hasForca = hash.startsWith('forca=');
  const openRegister = location.pathname === REGISTER_PATH;

  if (hasForca) {
    const payload = decodeStrengthPayload(hash);
    if (payload) writeStash(storage, { payload, apply: false });
  }
  if (openRegister || hasForca) replaceUrl(`/${location.search}`);

  return { openRegister };
}

/** Há resultado da calculadora aguardando um cadastro? */
export function hasPendingHandoff(storage: HandoffStorage | null = browserStorage()): boolean {
  return readStash(storage) !== null;
}

/** Chamado quando uma conta NOVA foi criada: libera o stash para a semeadura. */
export function markHandoffForApply(storage: HandoffStorage | null = browserStorage()): void {
  const stash = readStash(storage);
  if (stash) writeStash(storage, { ...stash, apply: true });
}

/** Consome o stash (sempre o apaga). Só devolve o payload se a conta for nova. */
export function takeHandoff(storage: HandoffStorage | null = browserStorage()): StrengthPayload | null {
  const stash = readStash(storage);
  removeStash(storage);
  return stash?.apply ? stash.payload : null;
}
