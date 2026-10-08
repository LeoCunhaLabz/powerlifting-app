import { describe, it, expect } from 'vitest';
import { EMPTY_VALUE, formatCompact, formatNumber, parseDecimal } from './format';

describe('formatNumber', () => {
  it('usa vírgula decimal e casas fixas', () => {
    expect(formatNumber(522.5, 1)).toBe('522,5');
    expect(formatNumber(125, 1)).toBe('125,0');
    expect(formatNumber(5, 0)).toBe('5');
  });

  it('usa ponto de milhar pt-BR', () => {
    expect(formatNumber(1102.5, 1)).toBe('1.102,5');
    expect(formatNumber(18400, 0)).toBe('18.400');
  });

  it('nunca mostra zero negativo', () => {
    expect(formatNumber(-0, 1)).toBe('0,0');
    expect(formatNumber(-0.04, 1)).toBe('0,0');
  });

  it('mantém o sinal de valores negativos de verdade', () => {
    expect(formatNumber(-0.6, 1)).toBe('-0,6');
  });

  it('devolve "sem dado" para valores não finitos', () => {
    expect(formatNumber(NaN, 1)).toBe(EMPTY_VALUE);
    expect(formatNumber(Infinity, 1)).toBe('sem dado');
  });
});

describe('formatCompact', () => {
  it('remove zeros à direita', () => {
    expect(formatCompact(142.5)).toBe('142,5');
    expect(formatCompact(100)).toBe('100');
    expect(formatCompact(1.25)).toBe('1,25');
  });

  it('respeita o máximo de casas', () => {
    expect(formatCompact(83.456, 1)).toBe('83,5');
  });

  it('devolve "sem dado" para NaN', () => {
    expect(formatCompact(NaN)).toBe('sem dado');
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
