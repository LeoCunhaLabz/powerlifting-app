import { describe, expect, it } from 'vitest';
import type { AppState, WorkoutSession, WorkoutTemplate } from '@powerlifting/shared';
import { applyServerData } from './syncMerge';

const NOW = '2026-09-07T12:00:00.000Z';

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    history: [],
    templates: [],
    programs: [],
    customExercises: [],
    bodyweightLog: [],
    deletedWorkouts: [],
    settings: {
      units: 'kg',
      barWeight: 20,
      availablePlates: [25, 20, 15, 10, 5, 2.5],
      customPlates: [],
      bodyweight: 80,
      gender: 'male',
      isEquipped: false,
      theme: 'brass',
    },
    ...overrides,
  };
}

function session(id: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return { id, name: `Treino ${id}`, date: '2026-09-01T10:00:00.000Z', duration: 3600, exercises: [], ...overrides };
}

function template(id: string, overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate {
  return { id, name: `Rotina ${id}`, description: '', exercises: [], ...overrides };
}

const emptyIncoming = { workouts: [], templates: [], customExercises: [], programs: [] };

describe('applyServerData — regressões da issue #264', () => {
  it('eco do push carimba syncedAt no template pendente (mata o loop infinito de sync)', () => {
    const local = template('t1', { updatedAt: '2026-09-07T10:00:00.000Z' }); // pendente: sem syncedAt
    const prev = baseState({ templates: [local] });

    // Eco do servidor: mesma versão que acabou de ser enviada (mesmo updatedAt)
    const next = applyServerData(prev, { ...emptyIncoming, templates: [{ ...local }] }, NOW);

    expect(next.templates[0].syncedAt).toBe(NOW);
  });

  it('edição local mais nova que a cópia do servidor sobrevive ao pull (continua pendente)', () => {
    const local = template('t1', { name: 'Editada agora', updatedAt: '2026-09-07T11:00:00.000Z' });
    const serverCopy = template('t1', { name: 'Versão antiga', updatedAt: '2026-09-01T10:00:00.000Z' });
    const prev = baseState({ templates: [local] });

    const next = applyServerData(prev, { ...emptyIncoming, templates: [serverCopy] }, NOW);

    expect(next.templates[0].name).toBe('Editada agora');
    expect(next.templates[0].syncedAt).toBeUndefined();
  });

  it('edição local de WORKOUT pendente e mais nova sobrevive ao pull (antes o servidor sempre vencia)', () => {
    const local = session('w1', { name: 'Peso corrigido', updatedAt: '2026-09-07T11:00:00.000Z' });
    const serverCopy = session('w1', { name: 'Peso errado', updatedAt: '2026-09-01T10:00:00.000Z', syncedAt: undefined });
    const prev = baseState({ history: [local] });

    const next = applyServerData(prev, { ...emptyIncoming, workouts: [serverCopy] }, NOW);

    expect(next.history[0].name).toBe('Peso corrigido');
  });

  it('workout deleted vindo do servidor remove a cópia local e não entra no history', () => {
    const prev = baseState({ history: [session('w1', { syncedAt: '2026-09-01T00:00:00.000Z' })] });
    const deletedCopy = { ...session('w1'), deleted: true } as WorkoutSession;

    const next = applyServerData(prev, { ...emptyIncoming, workouts: [deletedCopy] }, NOW);

    expect(next.history).toHaveLength(0);
  });

  it('tombstone local pendente barra a ressurreição do treino via pull', () => {
    const prev = baseState({
      history: [],
      deletedWorkouts: [{ id: 'w1', deletedAt: '2026-09-06T10:00:00.000Z' }],
    });
    // Pull ainda traz a cópia viva (o push do tombstone não aconteceu)
    const next = applyServerData(prev, { ...emptyIncoming, workouts: [session('w1')] }, NOW);

    expect(next.history).toHaveLength(0);
    expect(next.deletedWorkouts?.[0].syncedAt).toBeUndefined();
  });

  it('deletedWorkoutIds do eco confirma o tombstone (carimba syncedAt)', () => {
    const prev = baseState({ deletedWorkouts: [{ id: 'w1', deletedAt: '2026-09-06T10:00:00.000Z' }] });

    const next = applyServerData(prev, { ...emptyIncoming, deletedWorkoutIds: ['w1'] }, NOW);

    expect(next.deletedWorkouts?.[0].syncedAt).toBe(NOW);
  });

  it('eco em SUBCONJUNTO preserva intactos os itens locais fora do payload', () => {
    const untouched = session('w-old', { syncedAt: '2026-09-01T00:00:00.000Z', date: '2026-08-01T10:00:00.000Z' });
    const pushed = session('w-new', { updatedAt: '2026-09-07T10:00:00.000Z', date: '2026-09-07T10:00:00.000Z' });
    const prev = baseState({ history: [untouched, pushed] });

    const next = applyServerData(prev, { ...emptyIncoming, workouts: [{ ...pushed }] }, NOW);

    expect(next.history).toHaveLength(2);
    expect(next.history.find((h) => h.id === 'w-old')).toEqual(untouched);
    expect(next.history.find((h) => h.id === 'w-new')?.syncedAt).toBe(NOW);
  });

  it('history sai ordenado por data decrescente (coluna ANT. depende disso)', () => {
    const prev = baseState({ history: [session('a', { date: '2026-01-01T10:00:00.000Z' })] });
    const next = applyServerData(
      prev,
      { ...emptyIncoming, workouts: [session('b', { date: '2026-06-01T10:00:00.000Z' })] },
      NOW,
    );
    expect(next.history.map((h) => h.id)).toEqual(['b', 'a']);
  });

  it('built-ins locais são preservados e nunca substituídos pelo servidor', () => {
    const builtIn = template('lp', { isBuiltIn: true });
    const prev = baseState({ templates: [builtIn] });

    const next = applyServerData(prev, { ...emptyIncoming, templates: [template('t1', { updatedAt: NOW })] }, NOW);

    expect(next.templates.find((t) => t.id === 'lp')).toEqual(builtIn);
    expect(next.templates).toHaveLength(2);
  });

  it('custom exercise deleted e confirmado é podado do estado', () => {
    const prev = baseState({
      customExercises: [
        { id: 'c1', name: 'Face Pull', createdAt: '2026-09-01T00:00:00.000Z', deleted: true, updatedAt: '2026-09-06T00:00:00.000Z' },
      ],
    });

    const next = applyServerData(
      prev,
      {
        ...emptyIncoming,
        customExercises: [
          { id: 'c1', name: 'Face Pull', createdAt: '2026-09-01T00:00:00.000Z', deleted: true, updatedAt: '2026-09-06T00:00:00.000Z' },
        ],
      },
      NOW,
    );

    expect(next.customExercises).toHaveLength(0);
  });
});
