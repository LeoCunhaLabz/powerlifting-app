import { describe, expect, it } from 'vitest';
import { trySetItem, shouldClearActiveBackup } from './persistence';

describe('trySetItem', () => {
  it('retorna true e grava quando o storage aceita', () => {
    const writes: Record<string, string> = {};
    const ok = trySetItem({ setItem: (k, v) => { writes[k] = v; } }, 'k', 'v');
    expect(ok).toBe(true);
    expect(writes.k).toBe('v');
  });

  it('retorna false quando o storage lança (cota cheia / modo privado)', () => {
    const ok = trySetItem({ setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); } }, 'k', 'v');
    expect(ok).toBe(false);
  });
});

describe('shouldClearActiveBackup (regressão #266)', () => {
  it('remove o backup quando não há treino ativo e o estado foi salvo', () => {
    expect(shouldClearActiveBackup(false, true)).toBe(true);
  });

  it('MANTÉM o backup quando o estado falhou ao salvar (evita perda do treino)', () => {
    // Cenário do bug: treino finalizado + cota cheia. O history não foi persistido,
    // então a chave de backup é a única cópia — não pode ser removida.
    expect(shouldClearActiveBackup(false, false)).toBe(false);
  });

  it('nunca remove enquanto há treino ativo', () => {
    expect(shouldClearActiveBackup(true, true)).toBe(false);
    expect(shouldClearActiveBackup(true, false)).toBe(false);
  });
});
