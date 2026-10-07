import { describe, it, expect } from 'vitest';
import { MAX_SEGMENTS, countdownFilled, segmentStates } from './segmentStates';

describe('segmentStates', () => {
  it('progress: feitos, o atual e os pendentes', () => {
    expect(segmentStates({ total: 5, filled: 2, mode: 'progress' })).toEqual(['done', 'done', 'current', 'pending', 'pending']);
  });

  it('progress sem atual', () => {
    expect(segmentStates({ total: 4, filled: 2, mode: 'progress', withCurrent: false })).toEqual(['done', 'done', 'pending', 'pending']);
  });

  it('progress completo não tem atual', () => {
    expect(segmentStates({ total: 3, filled: 3, mode: 'progress' })).toEqual(['done', 'done', 'done']);
  });

  it('countdown: o restante fica aceso como atual', () => {
    expect(segmentStates({ total: 4, filled: 3, mode: 'countdown' })).toEqual(['current', 'current', 'current', 'pending']);
  });

  it('corta filled fora do intervalo', () => {
    expect(segmentStates({ total: 3, filled: 9, mode: 'progress' })).toEqual(['done', 'done', 'done']);
    expect(segmentStates({ total: 3, filled: -2, mode: 'progress' })).toEqual(['current', 'pending', 'pending']);
  });

  it('total inválido não desenha nada', () => {
    expect(segmentStates({ total: 0, filled: 0, mode: 'progress' })).toEqual([]);
    expect(segmentStates({ total: NaN, filled: 1, mode: 'progress' })).toEqual([]);
    expect(segmentStates({ total: -4, filled: 1, mode: 'countdown' })).toEqual([]);
  });

  it('40 séries desenham 40 segmentos', () => {
    expect(segmentStates({ total: 40, filled: 10, mode: 'progress' })).toHaveLength(40);
  });

  it('acima de MAX_SEGMENTS escala proporcionalmente', () => {
    const s = segmentStates({ total: 120, filled: 60, mode: 'progress' });
    expect(s).toHaveLength(MAX_SEGMENTS);
    expect(s.filter((x) => x === 'done')).toHaveLength(30);
    expect(s[30]).toBe('current');
  });
});

describe('countdownFilled', () => {
  it('arredonda para cima: 108 de 180 s em 18 segmentos acende 11', () => {
    expect(countdownFilled(108, 180, 18)).toBe(11);
  });

  it('tempo acabado apaga tudo', () => {
    expect(countdownFilled(0, 180, 18)).toBe(0);
    expect(countdownFilled(-5, 180, 18)).toBe(0);
  });

  it('restante acima do total (+15 s) acende todos', () => {
    expect(countdownFilled(195, 180, 18)).toBe(18);
  });

  it('total ou segmentos inválidos apagam tudo', () => {
    expect(countdownFilled(30, 0, 18)).toBe(0);
    expect(countdownFilled(30, 180, 0)).toBe(0);
    expect(countdownFilled(NaN, 180, 18)).toBe(0);
  });
});
