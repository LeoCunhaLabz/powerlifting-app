import { describe, expect, it } from 'vitest';
import type { WorkoutTemplate } from '@powerlifting/shared';
import { exercisesNeedingMax, parseMaxes } from './templateStart';
import { parseDecimal } from './format';

const tpl = (exercises: WorkoutTemplate['exercises']): WorkoutTemplate => ({ id: 't', name: 'Rotina', description: '', exercises });
const pct = (p: number) => ({ reps: 5, type: 'N' as const, weightPercentage: p });

describe('exercisesNeedingMax', () => {
  it('lista os exercícios por %1RM sem máximo, na ordem da rotina', () => {
    const t = tpl([
      { name: 'Agachamento', sets: [pct(80)] },
      { name: 'Supino Reto', sets: [pct(80)] },
      { name: 'Barra Fixa', sets: [{ reps: 8, type: 'N' }] }, // sem %: não precisa
    ]);
    expect(exercisesNeedingMax(t, () => 0)).toEqual(['Agachamento', 'Supino Reto']);
  });

  it('não pede o que já tem máximo estimado', () => {
    const t = tpl([{ name: 'Agachamento', sets: [pct(80)] }, { name: 'Supino Reto', sets: [pct(80)] }]);
    expect(exercisesNeedingMax(t, (n) => (n === 'Agachamento' ? 150 : 0))).toEqual(['Supino Reto']);
  });

  it('não repete o mesmo exercício', () => {
    const t = tpl([{ name: 'Agachamento', sets: [pct(80)] }, { name: 'agachamento', sets: [pct(70)] }]);
    expect(exercisesNeedingMax(t, () => 0)).toEqual(['Agachamento']);
  });
});

describe('parseMaxes', () => {
  it('guarda só os máximos válidos, por nome sem caixa', () => {
    expect(parseMaxes({ Agachamento: '150', 'Supino Reto': '102,5', 'Levantamento Terra': '', Remada: 'abc' }, parseDecimal))
      .toEqual({ agachamento: 150, 'supino reto': 102.5 });
  });
});
