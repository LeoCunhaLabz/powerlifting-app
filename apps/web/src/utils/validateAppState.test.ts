import { describe, it, expect } from 'vitest';
import { isValidImportedState } from './validateAppState';
import type { AppState } from '@powerlifting/shared';

// ─── helpers ────────────────────────────────────────────────────────────────

const validSet = {
  id: 's1',
  weight: 100,
  reps: 5,
  type: 'N' as const,
  completed: false,
};

const validExercise = {
  id: 'e1',
  name: 'Agachamento',
  sets: [validSet],
};

const validSession = {
  id: 'sess1',
  name: 'Treino A',
  date: '2024-01-01T10:00:00.000Z',
  duration: 3600,
  exercises: [validExercise],
};

const validTemplate = {
  id: 'tmpl1',
  name: 'LP Iniciante',
  description: 'Progressão linear',
  exercises: [{ name: 'Agachamento', sets: [{ reps: 5, type: 'N' as const }] }],
};

const validSettings = {
  units: 'kg' as const,
  barWeight: 20,
  availablePlates: [25, 20, 10, 5, 2.5, 1.25],
  bodyweight: 80,
  gender: 'male' as const,
  isEquipped: false,
  theme: 'brass' as const,
};

const validState: AppState = {
  history: [validSession],
  templates: [validTemplate],
  settings: validSettings,
  bodyweightLog: [],
};

// ─── casos válidos ────────────────────────────────────────────────────────────

describe('isValidImportedState — casos válidos', () => {
  it('aceita um AppState completo e válido', () => {
    expect(isValidImportedState(validState)).toBe(true);
  });

  it('aceita state sem bodyweightLog (campo opcional)', () => {
    const state = { history: validState.history, templates: validState.templates, settings: validState.settings };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita bodyweightLog com entradas válidas', () => {
    const state = {
      ...validState,
      bodyweightLog: [{ date: '2024-01-01', weight: 80 }],
    };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita settings parcial (campos ausentes serão preenchidos por merge)', () => {
    const state = { ...validState, settings: {} };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita set do tipo W (warmup)', () => {
    const state = {
      ...validState,
      history: [{ ...validSession, exercises: [{ ...validExercise, sets: [{ ...validSet, type: 'W' as const }] }] }],
    };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita set do tipo D (drop set)', () => {
    const state = {
      ...validState,
      history: [{ ...validSession, exercises: [{ ...validExercise, sets: [{ ...validSet, type: 'D' as const }] }] }],
    };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita peso zero em sets (deload)', () => {
    const state = {
      ...validState,
      history: [{ ...validSession, exercises: [{ ...validExercise, sets: [{ ...validSet, weight: 0 }] }] }],
    };
    expect(isValidImportedState(state)).toBe(true);
  });

  it('aceita histórico vazio', () => {
    expect(isValidImportedState({ ...validState, history: [] })).toBe(true);
  });

  it('aceita templates vazios', () => {
    expect(isValidImportedState({ ...validState, templates: [] })).toBe(true);
  });
});

// ─── top-level inválido ───────────────────────────────────────────────────────

describe('isValidImportedState — top-level inválido', () => {
  it('rejeita null', () => {
    expect(isValidImportedState(null)).toBe(false);
  });

  it('rejeita string', () => {
    expect(isValidImportedState('{}' )).toBe(false);
  });

  it('rejeita array', () => {
    expect(isValidImportedState([])).toBe(false);
  });

  it('rejeita sem history', () => {
    expect(isValidImportedState({ templates: validState.templates, settings: validState.settings, bodyweightLog: [] })).toBe(false);
  });

  it('rejeita sem templates', () => {
    expect(isValidImportedState({ history: validState.history, settings: validState.settings, bodyweightLog: [] })).toBe(false);
  });

  it('rejeita sem settings', () => {
    expect(isValidImportedState({ history: validState.history, templates: validState.templates, bodyweightLog: [] })).toBe(false);
  });

  it('rejeita history que não é array', () => {
    expect(isValidImportedState({ ...validState, history: {} })).toBe(false);
  });
});

// ─── WorkoutSession inválido ─────────────────────────────────────────────────

describe('isValidImportedState — WorkoutSession inválido', () => {
  const withSession = (fields: Record<string, unknown>) => ({
    ...validState,
    history: [{ ...validSession, ...fields }],
  });

  it('rejeita date não-parseável ("nao-e-data")', () => {
    expect(isValidImportedState(withSession({ date: 'nao-e-data' }))).toBe(false);
  });

  it('rejeita date vazia', () => {
    expect(isValidImportedState(withSession({ date: '' }))).toBe(false);
  });

  it('rejeita duration negativa', () => {
    expect(isValidImportedState(withSession({ duration: -1 }))).toBe(false);
  });

  it('aceita date ISO completo', () => {
    expect(isValidImportedState(withSession({ date: '2024-01-15T10:30:00.000Z' }))).toBe(true);
  });

  it('aceita date YYYY-MM-DD', () => {
    expect(isValidImportedState(withSession({ date: '2024-01-15' }))).toBe(true);
  });
});

// ─── SetState inválido ────────────────────────────────────────────────────────

describe('isValidImportedState — SetState inválido', () => {
  const withSet = (fields: Record<string, unknown>) => ({
    ...validState,
    history: [{ ...validSession, exercises: [{ ...validExercise, sets: [{ ...validSet, ...fields }] }] }],
  });

  it('rejeita reps string ("abc")', () => {
    expect(isValidImportedState(withSet({ reps: 'abc' }))).toBe(false);
  });

  it('rejeita weight negativo', () => {
    expect(isValidImportedState(withSet({ weight: -5 }))).toBe(false);
  });

  it('rejeita reps negativo', () => {
    expect(isValidImportedState(withSet({ reps: -1 }))).toBe(false);
  });

  it('rejeita reps fracionário (2.5)', () => {
    expect(isValidImportedState(withSet({ reps: 2.5 }))).toBe(false);
  });

  it('rejeita type inválido ("X")', () => {
    expect(isValidImportedState(withSet({ type: 'X' }))).toBe(false);
  });

  it('rejeita completed não boolean', () => {
    expect(isValidImportedState(withSet({ completed: 1 }))).toBe(false);
  });

  it('rejeita id vazio', () => {
    expect(isValidImportedState(withSet({ id: '' }))).toBe(false);
  });

  it('rejeita rpe fora de [0,10]', () => {
    expect(isValidImportedState(withSet({ rpe: 11 }))).toBe(false);
  });
});

// ─── Settings inválido ────────────────────────────────────────────────────────

describe('isValidImportedState — Settings inválido', () => {
  it('rejeita units inválido ("pounds")', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, units: 'pounds' } })).toBe(false);
  });

  it('rejeita gender inválido ("other")', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, gender: 'other' } })).toBe(false);
  });

  it('rejeita theme inválido ("blue")', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, theme: 'blue' } })).toBe(false);
  });

  it('rejeita barWeight zero ou negativo', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, barWeight: 0 } })).toBe(false);
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, barWeight: -20 } })).toBe(false);
  });

  it('rejeita bodyweight negativo', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, bodyweight: -80 } })).toBe(false);
  });

  it('rejeita availablePlates com valor negativo', () => {
    expect(isValidImportedState({ ...validState, settings: { ...validSettings, availablePlates: [-5] } })).toBe(false);
  });
});

// ─── BodyweightEntry inválido ─────────────────────────────────────────────────

describe('isValidImportedState — BodyweightEntry inválido', () => {
  it('rejeita bodyweightLog não-array', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: {} })).toBe(false);
  });

  it('rejeita entrada com weight zero', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: [{ date: '2024-01-01', weight: 0 }] })).toBe(false);
  });

  it('rejeita entrada com weight negativo', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: [{ date: '2024-01-01', weight: -80 }] })).toBe(false);
  });

  it('rejeita entrada com date vazia', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: [{ date: '', weight: 80 }] })).toBe(false);
  });

  it('rejeita entrada com date inválida', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: [{ date: 'nao-e-data', weight: 80 }] })).toBe(false);
  });

  it('rejeita entrada com date faltando', () => {
    expect(isValidImportedState({ ...validState, bodyweightLog: [{ weight: 80 }] })).toBe(false);
  });
});
