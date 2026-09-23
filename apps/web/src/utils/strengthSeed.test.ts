import { describe, it, expect } from 'vitest';
import type { StrengthPayload } from '@powerlifting/shared';
import { buildReferenceSession, REFERENCE_SESSION_NAME, STRENGTH_LIFT_NAMES } from './strengthSeed';

const NOW = '2026-09-23T12:00:00.000Z';

function counterIds() {
  let n = 0;
  return (prefix: string) => `${prefix}-${++n}`;
}

describe('buildReferenceSession', () => {
  it('cria uma sessão com um exercício e uma série concluída para um lift', () => {
    const payload: StrengthPayload = { v: 1, sex: 'M', bw: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] };
    const session = buildReferenceSession(payload, NOW, counterIds());

    expect(session.name).toBe(REFERENCE_SESSION_NAME);
    expect(session.date).toBe(NOW);
    expect(session.updatedAt).toBe(NOW);
    expect(session.syncedAt).toBeUndefined();
    expect(session.duration).toBe(0);
    expect(session.notes).toBe('Registrado pela calculadora de força do site.');
    expect(session.exercises).toHaveLength(1);
    expect(session.exercises[0].name).toBe('Supino Reto');
    expect(session.exercises[0].sets).toEqual([
      { id: expect.any(String), weight: 110, reps: 5, completed: true, type: 'N' },
    ]);
  });

  it('usa os nomes canônicos na ordem agachamento, supino, terra', () => {
    const payload: StrengthPayload = {
      v: 1,
      sex: 'F',
      bw: 63,
      lifts: [
        { lift: 'deadlift', kg: 150, reps: 1 },
        { lift: 'squat', kg: 120, reps: 3 },
        { lift: 'bench', kg: 60, reps: 1 },
      ],
    };
    const session = buildReferenceSession(payload, NOW, counterIds());
    expect(session.exercises.map((e) => e.name)).toEqual([
      STRENGTH_LIFT_NAMES.squat,
      STRENGTH_LIFT_NAMES.bench,
      STRENGTH_LIFT_NAMES.deadlift,
    ]);
    expect(STRENGTH_LIFT_NAMES).toEqual({ squat: 'Agachamento', bench: 'Supino Reto', deadlift: 'Levantamento Terra' });
    expect(session.exercises[2].sets[0]).toMatchObject({ weight: 150, reps: 1 });
  });

  it('gera ids únicos para sessão, exercícios e séries', () => {
    const payload: StrengthPayload = {
      v: 1,
      sex: 'M',
      bw: 90,
      lifts: [
        { lift: 'squat', kg: 180, reps: 2 },
        { lift: 'deadlift', kg: 220, reps: 1 },
      ],
    };
    const session = buildReferenceSession(payload, NOW, counterIds());
    const ids = [session.id, ...session.exercises.flatMap((e) => [e.id, ...e.sets.map((s) => s.id)])];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
