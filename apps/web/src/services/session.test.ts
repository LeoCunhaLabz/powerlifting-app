import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authorizedFetch, refreshSession, saveTokens, getRefreshToken, getAccessToken } from './session';

// Ambiente de teste é 'node' — stub mínimo de localStorage.
function installLocalStorage(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  return store;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('session — refresh single-flight e anti-clobber (#265)', () => {
  beforeEach(() => {
    installLocalStorage({ powerlifting_token: 'A0', powerlifting_refresh_token: 'R0' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('duas chamadas concorrentes fazem UMA só requisição de refresh (single-flight)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ accessToken: 'A1', refreshToken: 'R1' }));
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([refreshSession(), refreshSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe('A1');
    expect(b).toBe('A1');
    expect(getRefreshToken()).toBe('R1');
  });

  it('refresh 401 quando o token salvo ainda é o usado: limpa a sessão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ code: 'INVALID_REFRESH_TOKEN', message: 'x' }, 401)));

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('refresh 401 mas outra aba já rotacionou: NÃO limpa, reaproveita o token novo (anti-clobber)', async () => {
    // fetch falha 401, mas durante a chamada o "storage de outra aba" trocou os tokens.
    const fetchMock = vi.fn().mockImplementation(async () => {
      saveTokens('A-outra', 'R-outra'); // simula a aba vencedora salvando antes de nós falharmos
      return json({ code: 'INVALID_REFRESH_TOKEN', message: 'x' }, 401);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await refreshSession();

    expect(result).toBe('A-outra');
    expect(getRefreshToken()).toBe('R-outra'); // preservado, não apagado
  });

  it('erro de rede no refresh não desloga (sessão pode estar viva)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(getRefreshToken()).toBe('R0'); // não limpou
  });

  it('authorizedFetch: em 401 renova o token e repete a requisição uma vez', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ message: 'expirado' }, 401)) // 1ª chamada protegida → 401
      .mockResolvedValueOnce(json({ accessToken: 'A1', refreshToken: 'R1' }))  // refresh
      .mockResolvedValueOnce(json({ ok: true })); // repetição com token novo
    vi.stubGlobal('fetch', fetchMock);

    const res = await authorizedFetch('https://api.test/sync', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // A repetição usa o Authorization com o token renovado.
    const lastCall = fetchMock.mock.calls[2];
    expect((lastCall[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer A1' });
  });

  it('authorizedFetch: 401 sem refresh recuperável devolve o 401 original', async () => {
    installLocalStorage({ powerlifting_token: 'A0' }); // sem refresh token
    const fetchMock = vi.fn().mockResolvedValue(json({ message: 'nope' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const res = await authorizedFetch('https://api.test/sync');

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1); // não tentou repetir
  });
});
