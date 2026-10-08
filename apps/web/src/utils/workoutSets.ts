/**
 * Série atual, rótulo da série (#339), resumo para finalizar o treino (#340, #328) e as
 * transformações das séries do treino ativo usadas nos updaters do WorkoutContext.
 * Funções puras, testadas em workoutSets.test.ts.
 */
import type { SetState, WorkoutSession } from '@powerlifting/shared';

type ExerciseSets = ReadonlyArray<{ sets: ReadonlyArray<Pick<SetState, 'completed'>> }>;

/**
 * Índice da série atual: a primeira pendente depois da última concluída; sem pendente depois
 * dela, a primeira pendente (a que ficou para trás). -1 com tudo concluído ou lista vazia.
 */
export function currentSetIndex(completed: readonly boolean[]): number {
  const lastDone = completed.lastIndexOf(true);
  const after = completed.indexOf(false, lastDone + 1);
  return after !== -1 ? after : completed.indexOf(false);
}

/** Série atual do treino inteiro, na ordem dos exercícios. null com tudo concluído. */
export function findCurrentSet(exercises: ExerciseSets): { exIdx: number; setIdx: number } | null {
  const flat = exercises.flatMap((ex, exIdx) => ex.sets.map((s, setIdx) => ({ exIdx, setIdx, done: s.completed })));
  const i = currentSetIndex(flat.map((f) => f.done));
  return i === -1 ? null : { exIdx: flat[i].exIdx, setIdx: flat[i].setIdx };
}

/** Rótulo da série: "Aq" no aquecimento, "D" no drop, e as normais numeradas entre si (1, 2, 3). */
export function setLabel(sets: ReadonlyArray<Pick<SetState, 'type'>>, index: number): string {
  const type = sets[index].type;
  if (type === 'W') return 'Aq';
  if (type === 'D') return 'D';
  let n = 0;
  for (let i = 0; i <= index; i++) if (sets[i].type === 'N') n++;
  return String(n);
}

export interface FinishSummary {
  done: number;
  total: number;
  /** Exercícios com séries sem check (que não vão para o histórico), na ordem do treino. */
  pending: Array<{ name: string; count: number }>;
}

/** Quantas séries têm check e quais exercícios ficam com séries de fora ao finalizar. */
export function finishSummary(
  exercises: ReadonlyArray<{ name: string; sets: ReadonlyArray<Pick<SetState, 'completed'>> }>,
): FinishSummary {
  let done = 0;
  let total = 0;
  const pending: FinishSummary['pending'] = [];
  for (const ex of exercises) {
    const exDone = ex.sets.filter((s) => s.completed).length;
    done += exDone;
    total += ex.sets.length;
    if (exDone < ex.sets.length) pending.push({ name: ex.name, count: ex.sets.length - exDone });
  }
  return { done, total, pending };
}

/** Primeira série sem check na ordem do treino ("Revisar séries"). null com tudo concluído. */
export function firstPendingSet(exercises: ExerciseSets): { exIdx: number; setIdx: number } | null {
  for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
    const setIdx = exercises[exIdx].sets.findIndex((s) => !s.completed);
    if (setIdx !== -1) return { exIdx, setIdx };
  }
  return null;
}

// Transformações do treino ativo: nunca mutam a sessão anterior, porque o React pode rodar o
// updater do setState mais de uma vez (sempre no StrictMode do dev) e mutar dobrava o efeito.

/**
 * Acrescenta uma série pendente ao exercício copiando peso, reps, RPE/RIR e tipo da última
 * (0 × 5 normal no exercício sem séries). O id vem de fora para o updater continuar puro.
 */
export function appendSet(session: WorkoutSession, exerciseIndex: number, id: string): WorkoutSession {
  const ex = session.exercises[exerciseIndex];
  if (!ex) return session;
  const last = ex.sets[ex.sets.length - 1];
  const newSet: SetState = {
    id,
    weight: last ? last.weight : 0,
    reps: last ? last.reps : 5,
    rpe: last ? last.rpe : undefined,
    rir: last ? last.rir : undefined,
    completed: false,
    type: last ? last.type : 'N',
  };
  const exercises = [...session.exercises];
  exercises[exerciseIndex] = { ...ex, sets: [...ex.sets, newSet] };
  return { ...session, exercises };
}

/** Aplica `fields` a uma série do treino ativo. */
export function patchSet(
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
  fields: Partial<SetState>,
): WorkoutSession {
  const ex = session.exercises[exerciseIndex];
  if (!ex?.sets[setIndex]) return session;
  const exercises = [...session.exercises];
  exercises[exerciseIndex] = { ...ex, sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, ...fields } : s)) };
  return { ...session, exercises };
}

/** A edição conclui uma série que estava pendente (é o que dispara o descanso). */
export function completesSet(set: Pick<SetState, 'completed'> | undefined, fields: Partial<SetState>): boolean {
  return !!set && !set.completed && fields.completed === true;
}
