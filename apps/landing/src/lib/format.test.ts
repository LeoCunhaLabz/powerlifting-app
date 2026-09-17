import { describe, it, expect } from 'vitest';
import { formatNumber, formatKg, parseDecimal } from './format';

describe('formatNumber', () => {
  it('usa vírgula decimal e casas fixas', () => {
    expect(formatNumber(347.16, 2)).toBe('347,16');
    expect(formatNumber(347.1, 2)).toBe('347,10');
    expect(formatNumber(5, 0)).toBe('5');
  });

  it('usa ponto de milhar pt-BR', () => {
    expect(formatNumber(8420, 0)).toBe('8.420');
  });

  it('devolve travessão para valores não finitos', () => {
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
  });
});

describe('formatKg', () => {
  it('remove zeros à direita desnecessários', () => {
    expect(formatKg(142.5)).toBe('142,5');
    expect(formatKg(100)).toBe('100');
    expect(formatKg(1.25)).toBe('1,25');
  });
});

describe('parseDecimal', () => {
  it('aceita vírgula e ponto como separador decimal', () => {
    expect(parseDecimal('82,5')).toBe(82.5);
    expect(parseDecimal('82.5')).toBe(82.5);
    expect(parseDecimal(' 512,5 ')).toBe(512.5);
  });

  it('devolve NaN para texto vazio ou inválido', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
  });
});
