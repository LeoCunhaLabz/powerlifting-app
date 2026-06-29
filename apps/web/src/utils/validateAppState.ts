/**
 * Type guards puros para validar o payload importado em importData().
 *
 * Sem dependências externas — segue o mesmo padrão de função pura de powerlifting.ts.
 * Retorna `false` ao primeiro campo inválido para manter O(n) e feedback rápido.
 */

import type {
  BodyweightEntry,
  CustomExercise,
  ExerciseState,
  SetState,
  Settings,
  TemplateExercise,
  WorkoutSession,
  WorkoutTemplate,
} from '@powerlifting/shared';

// ─── helpers ────────────────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isDateString(v: unknown): v is string {
  if (!isString(v) || v.trim() === '') return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

// ─── SetState ────────────────────────────────────────────────────────────────

function isValidSetState(v: unknown): v is SetState {
  if (!isObject(v)) return false;
  if (!isString(v.id) || v.id.trim() === '') return false;
  if (!isNumber(v.weight) || v.weight < 0) return false;
  if (!isNumber(v.reps) || v.reps < 0 || !Number.isInteger(v.reps)) return false;
  if (v.type !== 'W' && v.type !== 'N' && v.type !== 'D') return false;
  if (!isBoolean(v.completed)) return false;
  if (v.rpe !== undefined && (!isNumber(v.rpe) || v.rpe < 0 || v.rpe > 10)) return false;
  if (v.rir !== undefined && (!isNumber(v.rir) || v.rir < 0)) return false;
  if (v.percentage !== undefined && (!isNumber(v.percentage) || v.percentage < 0)) return false;
  if (v.isPr !== undefined && !isBoolean(v.isPr)) return false;
  return true;
}

// ─── ExerciseState ───────────────────────────────────────────────────────────

function isValidExerciseState(v: unknown): v is ExerciseState {
  if (!isObject(v)) return false;
  if (!isString(v.id) || v.id.trim() === '') return false;
  if (!isString(v.name)) return false;
  if (!isArray(v.sets)) return false;
  return v.sets.every(isValidSetState);
}

// ─── WorkoutSession ───────────────────────────────────────────────────────────

function isValidWorkoutSession(v: unknown): v is WorkoutSession {
  if (!isObject(v)) return false;
  if (!isString(v.id) || v.id.trim() === '') return false;
  if (!isString(v.name)) return false;
  if (!isDateString(v.date)) return false;
  if (!isNumber(v.duration) || v.duration < 0) return false;
  if (!isArray(v.exercises)) return false;
  if (v.notes !== undefined && !isString(v.notes)) return false;
  return v.exercises.every(isValidExerciseState);
}

// ─── TemplateExercise ─────────────────────────────────────────────────────────

function isValidTemplateExercise(v: unknown): v is TemplateExercise {
  if (!isObject(v)) return false;
  if (!isString(v.name)) return false;
  if (!isArray(v.sets)) return false;
  return v.sets.every((s) => {
    if (!isObject(s)) return false;
    if (!isNumber(s.reps) || s.reps < 0 || !Number.isInteger(s.reps)) return false;
    if (s.type !== 'W' && s.type !== 'N' && s.type !== 'D') return false;
    if (s.rpe !== undefined && (!isNumber(s.rpe) || s.rpe < 0 || s.rpe > 10)) return false;
    if (s.weightPercentage !== undefined && (!isNumber(s.weightPercentage) || s.weightPercentage < 0)) return false;
    return true;
  });
}

// ─── WorkoutTemplate ──────────────────────────────────────────────────────────

function isValidWorkoutTemplate(v: unknown): v is WorkoutTemplate {
  if (!isObject(v)) return false;
  if (!isString(v.id) || v.id.trim() === '') return false;
  if (!isString(v.name)) return false;
  if (!isString(v.description)) return false;
  if (!isArray(v.exercises)) return false;
  if (v.isBuiltIn !== undefined && !isBoolean(v.isBuiltIn)) return false;
  return v.exercises.every(isValidTemplateExercise);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function isValidSettings(v: unknown): v is Settings {
  if (!isObject(v)) return false;
  if (v.units !== undefined && v.units !== 'kg' && v.units !== 'lbs') return false;
  if (v.gender !== undefined && v.gender !== 'male' && v.gender !== 'female') return false;
  if (v.theme !== undefined && v.theme !== 'onyx' && v.theme !== 'brass' && v.theme !== 'volt') return false;
  if (v.barWeight !== undefined && (!isNumber(v.barWeight) || v.barWeight <= 0)) return false;
  if (v.bodyweight !== undefined && (!isNumber(v.bodyweight) || v.bodyweight <= 0)) return false;
  if (v.isEquipped !== undefined && !isBoolean(v.isEquipped)) return false;
  if (v.availablePlates !== undefined) {
    if (!isArray(v.availablePlates)) return false;
    if (!v.availablePlates.every((p) => isNumber(p) && p > 0)) return false;
  }
  return true;
}

// ─── BodyweightEntry ─────────────────────────────────────────────────────────

function isValidBodyweightEntry(v: unknown): v is BodyweightEntry {
  if (!isObject(v)) return false;
  if (!isDateString(v.date)) return false;
  if (!isNumber(v.weight) || v.weight <= 0) return false;
  return true;
}

// ─── CustomExercise ───────────────────────────────────────────────────────────

function isValidCustomExercise(v: unknown): v is CustomExercise {
  if (!isObject(v)) return false;
  if (!isString(v.id) || v.id.trim() === '') return false;
  if (!isString(v.name) || v.name.trim() === '') return false;
  if (!isDateString(v.createdAt)) return false;
  return true;
}

// ─── AppState ─────────────────────────────────────────────────────────────────

/**
 * Forma validada de um payload importado: `settings` pode ser parcial (campos
 * ausentes são preenchidos pelo merge com DEFAULT_SETTINGS em importData) e
 * `bodyweightLog` é opcional (normalizado para `[]` quando ausente).
 *
 * Intencionalmente diferente de `AppState` para refletir com precisão o que o
 * guard garante antes da normalização.
 */
type ValidatedRawState = {
  history: WorkoutSession[];
  templates: WorkoutTemplate[];
  settings: Partial<Settings>;
  bodyweightLog?: BodyweightEntry[];
  customExercises?: CustomExercise[];
};

/**
 * Valida se `parsed` tem a estrutura mínima esperada de um payload importado.
 *
 * - `settings` pode ter campos ausentes (serão preenchidos pelo merge com DEFAULT_SETTINGS).
 * - `bodyweightLog` é opcional; se presente cada entrada é validada.
 * - Templates built-in são injetados após a importação; aqui apenas os custom precisam ser válidos.
 */
export function isValidImportedState(parsed: unknown): parsed is ValidatedRawState {
  if (!isObject(parsed)) return false;

  // Campos de topo obrigatórios
  if (!isArray(parsed.history)) return false;
  if (!isArray(parsed.templates)) return false;
  if (!isObject(parsed.settings)) return false;

  // Validar cada sessão do histórico
  if (!parsed.history.every(isValidWorkoutSession)) return false;

  // Validar templates (built-in serão substituídos, mas estrutura deve ser válida)
  if (!parsed.templates.every(isValidWorkoutTemplate)) return false;

  // Validar settings (campos opcionais — merge com DEFAULT_SETTINGS cobre ausentes)
  if (!isValidSettings(parsed.settings)) return false;

  // Validar bodyweightLog (campo opcional)
  if (parsed.bodyweightLog !== undefined) {
    if (!isArray(parsed.bodyweightLog)) return false;
    if (!parsed.bodyweightLog.every(isValidBodyweightEntry)) return false;
  }

  // Validar customExercises (campo opcional)
  if (parsed.customExercises !== undefined) {
    if (!isArray(parsed.customExercises)) return false;
    if (!parsed.customExercises.every(isValidCustomExercise)) return false;
  }

  return true;
}
