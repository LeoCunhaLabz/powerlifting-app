import { describe, it, expect } from 'vitest';
import { buildAreaPath, valueToRatio } from './strengthCurve';

describe('valueToRatio', () => {
  it('mapeia o valor dentro da faixa do histograma', () => {
    expect(valueToRatio(100, 50, 150)).toBeCloseTo(0.5, 5);
    expect(valueToRatio(75, 50, 150)).toBeCloseTo(0.25, 5);
  });

  it('prende nas bordas: acima do máximo e abaixo do mínimo', () => {
    expect(valueToRatio(300, 50, 150)).toBe(1);
    expect(valueToRatio(10, 50, 150)).toBe(0);
  });

  it('cai no meio quando a faixa é degenerada', () => {
    expect(valueToRatio(80, 80, 80)).toBe(0.5);
  });
});

describe('buildAreaPath', () => {
  const hist = [0.1, 0.4, 0.8, 1, 0.7, 0.3, 0.1];

  it('começa e termina na linha de base e fecha a área', () => {
    const path = buildAreaPath(hist, 340, 100);
    expect(path.startsWith('M0,100')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('340,100');
  });

  it('não escapa da caixa (y entre 0 e a altura)', () => {
    const path = buildAreaPath([0, 1, 0, 1, 0], 100, 40);
    const ys = [...path.matchAll(/-?\d+(?:\.\d+)?,(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(40);
  });

  it('devolve string vazia sem dados ou sem caixa', () => {
    expect(buildAreaPath([], 340, 100)).toBe('');
    expect(buildAreaPath(hist, 0, 100)).toBe('');
    expect(buildAreaPath(hist, 340, 0)).toBe('');
  });

  it('aguenta histograma todo zerado sem dividir por zero', () => {
    expect(buildAreaPath([0, 0, 0], 100, 50)).not.toContain('NaN');
  });
});
