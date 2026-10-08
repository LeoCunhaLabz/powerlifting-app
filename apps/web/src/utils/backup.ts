/**
 * Backup e limpeza de dados em Configurações (#329). Funções puras, testadas em backup.test.ts.
 */
import type { AppState } from '@powerlifting/shared';
import { formatCompact } from './format';
import { isValidImportedState } from './validateAppState';

export interface DataCounts {
  workouts: number;
  /** Rotinas criadas pelo usuário (as prontas não contam). */
  templates: number;
  programs: number;
  customExercises: number;
  bodyweight: number;
}

type CountableState = Pick<AppState, 'history' | 'templates'> & Partial<Pick<AppState, 'programs' | 'customExercises' | 'bodyweightLog'>>;

/** Quanto há de dado do usuário, sem itens apagados (soft-delete) e sem rotinas prontas. */
export function countUserData(state: CountableState): DataCounts {
  return {
    workouts: state.history.length,
    templates: state.templates.filter((t) => !t.isBuiltIn && !t.deleted).length,
    programs: (state.programs ?? []).filter((p) => !p.deleted).length,
    customExercises: (state.customExercises ?? []).filter((e) => !e.deleted).length,
    bodyweight: (state.bodyweightLog ?? []).length,
  };
}

/** Lê o texto de um arquivo de backup. `null` quando não é um backup válido. */
export function readBackup(text: string): DataCounts | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isValidImportedState(parsed) ? countUserData(parsed) : null;
  } catch {
    return null;
  }
}

/** Palavra que o usuário digita para liberar "Apagar tudo". */
export const CLEAR_CONFIRMATION = 'APAGAR';

/** Aceita a palavra com espaços nas pontas e em qualquer caixa (o teclado do celular capitaliza). */
export function confirmsClear(input: string): boolean {
  return input.trim().toUpperCase() === CLEAR_CONFIRMATION;
}

/** "nenhum treino", "1 treino", "1.200 treinos". */
export function workoutsLabel(n: number): string {
  if (n === 0) return 'nenhum treino';
  return n === 1 ? '1 treino' : `${formatCompact(n, 0)} treinos`;
}

/** "nenhuma rotina", "1 rotina", "4 rotinas". */
export function templatesLabel(n: number): string {
  if (n === 0) return 'nenhuma rotina';
  return n === 1 ? '1 rotina' : `${formatCompact(n, 0)} rotinas`;
}
