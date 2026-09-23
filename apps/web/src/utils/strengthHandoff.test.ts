import { describe, it, expect, beforeEach } from 'vitest';
import { encodeStrengthPayload, type StrengthPayload } from '@powerlifting/shared';
import {
  captureHandoffFromUrl,
  hasPendingHandoff,
  markHandoffForApply,
  takeHandoff,
  HANDOFF_STORAGE_KEY,
  type HandoffStorage,
} from './strengthHandoff';

const PAYLOAD: StrengthPayload = { v: 1, sex: 'M', bw: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] };

function memoryStorage(): HandoffStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function throwingStorage(): HandoffStorage {
  return {
    getItem: () => { throw new Error('bloqueado'); },
    setItem: () => { throw new Error('bloqueado'); },
    removeItem: () => { throw new Error('bloqueado'); },
  };
}

describe('strengthHandoff', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let replaced: string[];
  const replaceUrl = (url: string) => void replaced.push(url);

  beforeEach(() => {
    storage = memoryStorage();
    replaced = [];
  });

  it('captura um payload válido sem marcar para aplicar e limpa a URL', () => {
    const loc = { pathname: '/registro', search: '', hash: `#forca=${encodeStrengthPayload(PAYLOAD)}` };
    const result = captureHandoffFromUrl(loc, storage, replaceUrl);

    expect(result).toEqual({ openRegister: true });
    expect(JSON.parse(storage.data.get(HANDOFF_STORAGE_KEY)!)).toEqual({ payload: PAYLOAD, apply: false });
    expect(hasPendingHandoff(storage)).toBe(true);
    expect(replaced).toEqual(['/']);
  });

  it('preserva a query string ao limpar a URL', () => {
    const loc = { pathname: '/registro', search: '?utm=x', hash: '' };
    captureHandoffFromUrl(loc, storage, replaceUrl);
    expect(replaced).toEqual(['/?utm=x']);
  });

  it('ignora hash inválido: nada guardado, cadastro normal', () => {
    const loc = { pathname: '/registro', search: '', hash: '#forca=lixo' };
    const result = captureHandoffFromUrl(loc, storage, replaceUrl);
    expect(result).toEqual({ openRegister: true });
    expect(storage.data.size).toBe(0);
    expect(hasPendingHandoff(storage)).toBe(false);
  });

  it('ignora versão desconhecida do payload', () => {
    const v2 = encodeStrengthPayload({ ...PAYLOAD, v: 2 } as unknown as StrengthPayload);
    captureHandoffFromUrl({ pathname: '/registro', search: '', hash: `#forca=${v2}` }, storage, replaceUrl);
    expect(storage.data.size).toBe(0);
  });

  it('não mexe na URL nem abre o cadastro fora de /registro sem payload', () => {
    const result = captureHandoffFromUrl({ pathname: '/', search: '?reset_token=abc', hash: '' }, storage, replaceUrl);
    expect(result).toEqual({ openRegister: false });
    expect(replaced).toEqual([]);
  });

  it('takeHandoff sem apply devolve null e descarta o stash', () => {
    captureHandoffFromUrl({ pathname: '/registro', search: '', hash: `#forca=${encodeStrengthPayload(PAYLOAD)}` }, storage, replaceUrl);
    expect(takeHandoff(storage)).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('takeHandoff após markHandoffForApply devolve o payload uma única vez', () => {
    captureHandoffFromUrl({ pathname: '/registro', search: '', hash: `#forca=${encodeStrengthPayload(PAYLOAD)}` }, storage, replaceUrl);
    markHandoffForApply(storage);
    expect(takeHandoff(storage)).toEqual(PAYLOAD);
    expect(takeHandoff(storage)).toBeNull();
  });

  it('markHandoffForApply sem stash não cria nada', () => {
    markHandoffForApply(storage);
    expect(storage.data.size).toBe(0);
  });

  it('descarta stash corrompido', () => {
    storage.data.set(HANDOFF_STORAGE_KEY, '{"payload":{"v":9},"apply":true}');
    expect(takeHandoff(storage)).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('storage que lança erro nunca quebra o fluxo', () => {
    const s = throwingStorage();
    const loc = { pathname: '/registro', search: '', hash: `#forca=${encodeStrengthPayload(PAYLOAD)}` };
    expect(captureHandoffFromUrl(loc, s, replaceUrl)).toEqual({ openRegister: true });
    expect(() => markHandoffForApply(s)).not.toThrow();
    expect(hasPendingHandoff(s)).toBe(false);
    expect(takeHandoff(s)).toBeNull();
  });

  it('storage indisponível (null) também é tolerado', () => {
    const loc = { pathname: '/registro', search: '', hash: `#forca=${encodeStrengthPayload(PAYLOAD)}` };
    expect(captureHandoffFromUrl(loc, null, replaceUrl)).toEqual({ openRegister: true });
    expect(takeHandoff(null)).toBeNull();
  });
});
