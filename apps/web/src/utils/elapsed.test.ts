import { describe, it, expect } from 'vitest';
import { formatElapsed } from './elapsed';

const START = '2026-10-08T10:00:00.000Z';
const at = (seconds: number) => new Date(START).getTime() + seconds * 1000;

describe('formatElapsed', () => {
  it('mostra mm:ss abaixo de 1 hora', () => {
    expect(formatElapsed(START, at(0))).toBe('00:00');
    expect(formatElapsed(START, at(2292))).toBe('38:12');
  });

  it('mostra h:mm:ss a partir de 1 hora', () => {
    expect(formatElapsed(START, at(3753))).toBe('1:02:33');
  });

  it('não fica negativo quando o relógio do aparelho volta', () => {
    expect(formatElapsed(START, at(-30))).toBe('00:00');
  });

  it('data inválida vira 00:00', () => {
    expect(formatElapsed('não é data', at(10))).toBe('00:00');
    expect(formatElapsed(START, NaN)).toBe('00:00');
  });
});
