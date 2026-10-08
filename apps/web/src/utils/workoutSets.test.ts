import { describe, expect, it } from 'vitest';
import { currentSetIndex, findCurrentSet, setLabel } from './workoutSets';

const sets = (...types: Array<'N' | 'W' | 'D'>) => types.map((type) => ({ type }));
const ex = (...completed: boolean[]) => ({ sets: completed.map((c) => ({ completed: c })) });

describe('currentSetIndex', () => {
  it('começa na primeira série quando nada foi feito', () => {
    expect(currentSetIndex([false, false, false])).toBe(0);
  });

  it('segue para a série depois da última concluída', () => {
    expect(currentSetIndex([true, true, false, false])).toBe(2);
  });

  it('pula a série deixada para trás e segue depois da última concluída', () => {
    expect(currentSetIndex([true, false, true, false])).toBe(3);
  });

  it('volta para a primeira pendente quando não há pendente depois da última concluída', () => {
    expect(currentSetIndex([true, false, true, true])).toBe(1);
  });

  it('devolve -1 com tudo concluído ou lista vazia', () => {
    expect(currentSetIndex([true, true])).toBe(-1);
    expect(currentSetIndex([])).toBe(-1);
  });
});

describe('findCurrentSet', () => {
  it('atravessa os exercícios na ordem do treino', () => {
    expect(findCurrentSet([ex(true, true), ex(false, false)])).toEqual({ exIdx: 1, setIdx: 0 });
  });

  it('segue o exercício feito fora de ordem', () => {
    expect(findCurrentSet([ex(false, false), ex(true, false)])).toEqual({ exIdx: 1, setIdx: 1 });
  });

  it('volta ao exercício pulado no fim do treino', () => {
    expect(findCurrentSet([ex(false, false), ex(true, true)])).toEqual({ exIdx: 0, setIdx: 0 });
  });

  it('ignora exercício sem séries', () => {
    expect(findCurrentSet([ex(), ex(false)])).toEqual({ exIdx: 1, setIdx: 0 });
  });

  it('devolve null com o treino todo concluído ou vazio', () => {
    expect(findCurrentSet([ex(true), ex(true)])).toBeNull();
    expect(findCurrentSet([])).toBeNull();
  });
});

describe('setLabel', () => {
  it('numera só as séries normais, sem contar aquecimento nem drop', () => {
    const s = sets('W', 'W', 'N', 'N', 'D', 'N');
    expect(s.map((_, i) => setLabel(s, i))).toEqual(['Aq', 'Aq', '1', '2', 'D', '3']);
  });

  it('numera a partir de 1 sem aquecimento', () => {
    const s = sets('N', 'N');
    expect(setLabel(s, 1)).toBe('2');
  });
});
