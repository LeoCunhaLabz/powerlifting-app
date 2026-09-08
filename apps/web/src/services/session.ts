import { refreshTokens as apiRefresh, AuthApiError } from './authApi';

// ---------------------------------------------------------------------------
// Fonte única de acesso aos tokens de sessão + refresh coordenado (issue #265).
//
// Antes: a chave do token estava literal em 3 arquivos, nada renovava o access
// token depois do mount (sync travava com 401 após 15 min), e dois refreshes
// concorrentes deslogavam o usuário (a "aba perdedora" limpava os tokens que a
// vencedora acabara de salvar).
//
// Aqui: acesso centralizado, refresh SINGLE-FLIGHT (uma requisição por vez;
// chamadas simultâneas compartilham a mesma promise) e limpeza de tokens só
// quando o refresh salvo ainda é o que falhou — se outra aba já rotacionou, a
// perdedora relê o token novo em vez de deslogar.
// ---------------------------------------------------------------------------

export const ACCESS_TOKEN_KEY = 'powerlifting_token';
export const REFRESH_TOKEN_KEY = 'powerlifting_refresh_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // ignora cota/modo privado
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignora
  }
}

/** Promise de refresh em voo — garante single-flight entre chamadas concorrentes. */
let inFlight: Promise<string | null> | null = null;

/**
 * Renova o access token usando o refresh salvo. Single-flight: chamadas
 * concorrentes (StrictMode, 2 requests 401 ao mesmo tempo) compartilham a
 * mesma requisição. Retorna o novo access token, ou null se não há sessão
 * recuperável (aí o chamador deve tratar como deslogado).
 */
export function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight;

  const used = getRefreshToken();
  if (!used) return Promise.resolve(null);

  inFlight = (async () => {
    try {
      const tokens = await apiRefresh(used);
      saveTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } catch (err) {
      // Anti-clobber: só limpa se o refresh salvo AINDA é o que usamos. Se outra
      // aba rotacionou nesse meio-tempo, o storage já tem um token novo válido —
      // não o apaga; devolve-o para o chamador reaproveitar.
      const current = getRefreshToken();
      if (current && current !== used) return getAccessToken();
      // Erro de rede não deve deslogar (sessão pode estar viva); só credenciais.
      if (err instanceof AuthApiError && err.status === 401) clearTokens();
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * fetch autenticado com refresh automático: injeta o access token; em 401,
 * tenta renovar UMA vez e repete. Resolve a causa dominante da #265 — sync que
 * travava para sempre com o mesmo token expirado após 15 min de aba aberta.
 */
export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (token: string | null): RequestInit => ({
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  let res = await fetch(input, withAuth(getAccessToken()));
  if (res.status !== 401) return res;

  const refreshed = await refreshSession();
  if (!refreshed) return res; // sem sessão recuperável: devolve o 401 original
  res = await fetch(input, withAuth(refreshed));
  return res;
}
