import type { StrengthPayload, StrengthPayloadLift, WorkoutSession } from '@powerlifting/shared';

/**
 * Semeadura da conta nova a partir da calculadora "Quão forte você é" da landing
 * (issue #318). Puro: recebe o payload já validado, o instante e a fábrica de ids.
 */

/** Nome da sessão de referência — também serve de chave de idempotência. */
export const REFERENCE_SESSION_NAME = 'Registro da calculadora';

/** Nomes canônicos dos lifts no app (os mesmos das rotinas e das análises). */
export const STRENGTH_LIFT_NAMES: Record<StrengthPayloadLift, string> = {
  squat: 'Agachamento',
  bench: 'Supino Reto',
  deadlift: 'Levantamento Terra',
};

const LIFT_ORDER: StrengthPayloadLift[] = ['squat', 'bench', 'deadlift'];

/** Monta o treino de referência: uma série concluída por lift informado na calculadora. */
export function buildReferenceSession(
  payload: StrengthPayload,
  nowIso: string,
  idFactory: (prefix: string) => string,
): WorkoutSession {
  const lifts = [...payload.lifts].sort((a, b) => LIFT_ORDER.indexOf(a.lift) - LIFT_ORDER.indexOf(b.lift));
  return {
    id: idFactory('session'),
    name: REFERENCE_SESSION_NAME,
    date: nowIso,
    duration: 0,
    notes: 'Registrado pela calculadora de força do site.',
    updatedAt: nowIso,
    exercises: lifts.map((entry) => ({
      id: idFactory('ex'),
      name: STRENGTH_LIFT_NAMES[entry.lift],
      sets: [{ id: idFactory('set'), weight: entry.kg, reps: entry.reps, completed: true, type: 'N' }],
    })),
  };
}
