import { describe, expect, it } from 'vitest';
import type { WorkoutSession, WorkoutTemplate } from '@powerlifting/shared';
import { CLEAR_CONFIRMATION, confirmsClear, countUserData, readBackup, templatesLabel, workoutsLabel } from './backup';

const session = (id: string): WorkoutSession => ({ id, name: 'Treino A', date: '2026-10-01T10:00:00.000Z', duration: 3600, exercises: [] });
const template = (id: string, extra: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({ id, name: 'Rotina', description: '', exercises: [], ...extra });

describe('countUserData', () => {
  it('conta só o que é do usuário e não foi apagado', () => {
    const counts = countUserData({
      history: [session('a'), session('b')],
      templates: [template('pronta', { isBuiltIn: true }), template('minha'), template('apagada', { deleted: true })],
      programs: [
        { id: 'p1', name: 'Bloco', templateIds: [], isActive: true, createdAt: '2026-10-01T00:00:00.000Z' },
        { id: 'p2', name: 'Velho', templateIds: [], isActive: false, createdAt: '2026-09-01T00:00:00.000Z', deleted: true },
      ],
      customExercises: [{ id: 'e1', name: 'Good morning', createdAt: '2026-10-01T00:00:00.000Z' }],
      bodyweightLog: [{ date: '2026-10-01T00:00:00.000Z', weight: 82 }],
    });
    expect(counts).toEqual({ workouts: 2, templates: 1, programs: 1, customExercises: 1, bodyweight: 1 });
  });

  it('trata campos opcionais ausentes como vazios', () => {
    expect(countUserData({ history: [], templates: [] })).toEqual({
      workouts: 0, templates: 0, programs: 0, customExercises: 0, bodyweight: 0,
    });
  });
});

describe('readBackup', () => {
  it('lê um backup válido e conta o conteúdo', () => {
    const text = JSON.stringify({ history: [session('a')], templates: [template('minha')], settings: {} });
    expect(readBackup(text)).toMatchObject({ workouts: 1, templates: 1 });
  });

  it('recusa JSON quebrado', () => {
    expect(readBackup('{ "history": [')).toBeNull();
  });

  it('recusa JSON que não é um backup', () => {
    expect(readBackup(JSON.stringify({ nome: 'outra coisa' }))).toBeNull();
    expect(readBackup('[]')).toBeNull();
  });
});

describe('confirmsClear', () => {
  it('libera com a palavra exata', () => {
    expect(confirmsClear(CLEAR_CONFIRMATION)).toBe(true);
  });

  it('ignora espaços nas pontas e a caixa', () => {
    expect(confirmsClear('  apagar ')).toBe(true);
    expect(confirmsClear('Apagar')).toBe(true);
  });

  it('não libera com texto parcial ou diferente', () => {
    expect(confirmsClear('')).toBe(false);
    expect(confirmsClear('APAGA')).toBe(false);
    expect(confirmsClear('APAGAR TUDO')).toBe(false);
  });
});

describe('rótulos', () => {
  it('escreve treinos por extenso e com milhar pt-BR', () => {
    expect(workoutsLabel(0)).toBe('nenhum treino');
    expect(workoutsLabel(1)).toBe('1 treino');
    expect(workoutsLabel(1200)).toBe('1.200 treinos');
  });

  it('escreve rotinas por extenso', () => {
    expect(templatesLabel(0)).toBe('nenhuma rotina');
    expect(templatesLabel(1)).toBe('1 rotina');
    expect(templatesLabel(4)).toBe('4 rotinas');
  });
});
