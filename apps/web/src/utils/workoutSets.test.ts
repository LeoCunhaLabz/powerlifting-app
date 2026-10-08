import { describe, expect, it } from 'vitest';
import type { SetState, WorkoutSession } from '@powerlifting/shared';
import { appendSet, completesSet, currentSetIndex, findCurrentSet, finishSummary, firstPendingSet, patchSet, setLabel } from './workoutSets';

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

const named = (name: string, ...completed: boolean[]) => ({ name, ...ex(...completed) });

describe('finishSummary', () => {
  it('conta feitas, total e séries sem check por exercício, na ordem do treino', () => {
    expect(finishSummary([named('Agachamento', true, true, false), named('Supino', true), named('Remada', false, false)])).toEqual({
      done: 3,
      total: 6,
      pending: [{ name: 'Agachamento', count: 1 }, { name: 'Remada', count: 2 }],
    });
  });

  it('sem pendência quando tudo foi feito', () => {
    expect(finishSummary([named('Agachamento', true, true)])).toEqual({ done: 2, total: 2, pending: [] });
  });

  it('treino vazio', () => {
    expect(finishSummary([])).toEqual({ done: 0, total: 0, pending: [] });
  });
});

describe('firstPendingSet', () => {
  it('acha a primeira série sem check na ordem do treino, mesmo antes de uma concluída', () => {
    expect(firstPendingSet([ex(true, true), ex(true, false, true)])).toEqual({ exIdx: 1, setIdx: 1 });
    expect(firstPendingSet([ex(false, true)])).toEqual({ exIdx: 0, setIdx: 0 });
  });

  it('devolve null com tudo concluído', () => {
    expect(firstPendingSet([ex(true), ex(true)])).toBeNull();
  });
});

// Congela a sessão inteira: qualquer mutação do estado anterior lança TypeError (módulo ES é strict).
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const set = (fields: Partial<SetState> = {}): SetState => ({ id: 's', weight: 100, reps: 5, completed: false, type: 'N', ...fields });

const session = (...exercises: SetState[][]): WorkoutSession =>
  deepFreeze({
    id: 'w1',
    name: 'Treino A',
    date: '2026-10-07T10:00:00.000Z',
    duration: 0,
    exercises: exercises.map((sets, i) => ({ id: `ex-${i}`, name: `Exercício ${i}`, sets })),
  });

describe('appendSet', () => {
  it('copia peso, reps, RPE/RIR e tipo da última série, pendente e com o id dado', () => {
    const prev = session([set({ id: 's1', weight: 140, reps: 3, rpe: 8, rir: 2, type: 'W', completed: true })]);
    const next = appendSet(prev, 0, 'novo');
    expect(next.exercises[0].sets[1]).toEqual({ id: 'novo', weight: 140, reps: 3, rpe: 8, rir: 2, completed: false, type: 'W' });
  });

  it('usa 0 × 5 normal no exercício sem séries', () => {
    const next = appendSet(session([]), 0, 'novo');
    expect(next.exercises[0].sets).toEqual([{ id: 'novo', weight: 0, reps: 5, rpe: undefined, rir: undefined, completed: false, type: 'N' }]);
  });

  it('não muta a sessão anterior: rodar o updater duas vezes (StrictMode) adiciona uma série só', () => {
    const prev = session([set({ id: 's1' })], [set({ id: 's2' })]);
    appendSet(prev, 0, 'a');
    const next = appendSet(prev, 0, 'b');
    expect(prev.exercises[0].sets).toHaveLength(1);
    expect(next.exercises[0].sets.map((s) => s.id)).toEqual(['s1', 'b']);
    expect(next.exercises[1]).toBe(prev.exercises[1]);
  });

  it('devolve a mesma sessão com índice de exercício inválido', () => {
    const prev = session([set()]);
    expect(appendSet(prev, 3, 'x')).toBe(prev);
  });
});

describe('patchSet', () => {
  it('aplica os campos só na série alvo, sem mutar a sessão anterior', () => {
    const prev = session([set({ id: 's1' }), set({ id: 's2' })]);
    const next = patchSet(prev, 0, 1, { weight: 150, completed: true });
    expect(next.exercises[0].sets[1]).toEqual(set({ id: 's2', weight: 150, completed: true }));
    expect(next.exercises[0].sets[0]).toBe(prev.exercises[0].sets[0]);
    expect(prev.exercises[0].sets[1]).toEqual(set({ id: 's2' }));
  });

  it('devolve a mesma sessão com índice de série inválido', () => {
    const prev = session([set()]);
    expect(patchSet(prev, 0, 5, { weight: 1 })).toBe(prev);
    expect(patchSet(prev, 2, 0, { weight: 1 })).toBe(prev);
  });
});

describe('completesSet', () => {
  it('é verdadeiro só quando a edição conclui uma série pendente', () => {
    expect(completesSet(set({ completed: false }), { completed: true })).toBe(true);
    expect(completesSet(set({ completed: true }), { completed: true })).toBe(false);
    expect(completesSet(set({ completed: true }), { completed: false })).toBe(false);
    expect(completesSet(set({ completed: false }), { weight: 120 })).toBe(false);
    expect(completesSet(undefined, { completed: true })).toBe(false);
  });
});
