import { describe, expect, it } from 'vitest';
import type { SetState } from '@powerlifting/shared';
import {
  adjustRest, clampRestSeconds, formatClock, nextSetInfo, parseStoredRest, restStatus, serializeRest,
} from './restTimer';

const NOW = 1_700_000_000_000;

describe('parseStoredRest / serializeRest', () => {
  it('lê o formato novo (fim, total e exercício)', () => {
    const rest = { end: NOW + 90_000, total: 180, exercise: 'Agachamento' };
    expect(parseStoredRest(serializeRest(rest))).toEqual(rest);
  });

  it('lê o formato antigo, só com o fim, sem total conhecido', () => {
    expect(parseStoredRest(String(NOW + 60_000))).toEqual({ end: NOW + 60_000, total: 0 });
  });

  it('descarta valor ausente ou inválido', () => {
    expect(parseStoredRest(null)).toBeNull();
    expect(parseStoredRest('lixo')).toBeNull();
    expect(parseStoredRest('{"end":"x","total":3}')).toBeNull();
    expect(parseStoredRest('{"total":3}')).toBeNull();
  });
});

describe('restStatus', () => {
  it('conta o restante arredondando para cima', () => {
    expect(restStatus({ end: NOW + 107_400, total: 180 }, NOW)).toEqual({ remaining: 108, overtime: 0, ended: false, total: 180 });
  });

  it('depois do fim, conta o tempo extra', () => {
    expect(restStatus({ end: NOW - 42_500, total: 180 }, NOW)).toEqual({ remaining: 0, overtime: 42, ended: true, total: 180 });
  });

  it('sem total conhecido (formato antigo), usa o restante como total', () => {
    expect(restStatus({ end: NOW + 60_000, total: 0 }, NOW).total).toBe(60);
  });
});

describe('adjustRest', () => {
  const rest = { end: NOW + 100_000, total: 180, exercise: 'Supino' };

  it('+30 s estende o fim e o total', () => {
    expect(adjustRest(rest, 30, NOW)).toEqual({ end: NOW + 130_000, total: 210, exercise: 'Supino' });
  });

  it('−30 s encurta o fim e o total', () => {
    expect(adjustRest(rest, -30, NOW)).toEqual({ end: NOW + 70_000, total: 150, exercise: 'Supino' });
  });

  it('−30 s com menos de 30 s restantes termina agora, sem fim no passado', () => {
    expect(adjustRest({ ...rest, end: NOW + 10_000 }, -30, NOW)).toEqual({ end: NOW, total: 150, exercise: 'Supino' });
  });

  it('+30 s depois do fim recomeça a contar a partir de agora', () => {
    expect(adjustRest({ ...rest, end: NOW - 20_000 }, 30, NOW).end).toBe(NOW + 30_000);
  });
});

describe('formatClock', () => {
  it('formata minutos e segundos', () => {
    expect(formatClock(108)).toBe('1:48');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(0)).toBe('0:00');
  });

  it('nunca mostra negativo', () => {
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('clampRestSeconds', () => {
  it('limita entre 30 s e 10 min', () => {
    expect(clampRestSeconds(15)).toBe(30);
    expect(clampRestSeconds(900)).toBe(600);
    expect(clampRestSeconds(135)).toBe(135);
  });

  it('valor inválido volta ao padrão de 2 min', () => {
    expect(clampRestSeconds(NaN)).toBe(120);
  });
});

describe('nextSetInfo', () => {
  const set = (type: SetState['type'], weight: number, reps: number, completed: boolean): SetState =>
    ({ id: `${type}${weight}${reps}${completed}`, type, weight, reps, completed });

  it('descreve a série atual do treino', () => {
    const exercises = [
      { name: 'Agachamento', sets: [set('W', 60, 5, true), set('N', 150, 4, true), set('N', 152.5, 4, false)] },
    ];
    expect(nextSetInfo(exercises, 'kg')).toEqual({ exercise: 'Agachamento', set: 'série 2', load: '152,5 kg × 4' });
  });

  it('aquecimento e drop set pelo nome', () => {
    expect(nextSetInfo([{ name: 'Supino', sets: [set('W', 40, 8, false)] }], 'lbs')?.set).toBe('aquecimento');
    expect(nextSetInfo([{ name: 'Supino', sets: [set('D', 40, 8, false)] }], 'kg')?.set).toBe('drop set');
  });

  it('sem carga mostra só as repetições, sem nada mostra vazio', () => {
    expect(nextSetInfo([{ name: 'Barra fixa', sets: [set('N', 0, 8, false)] }], 'kg')?.load).toBe('8 reps');
    expect(nextSetInfo([{ name: 'Barra fixa', sets: [set('N', 0, 0, false)] }], 'kg')?.load).toBe('');
  });

  it('null com tudo concluído', () => {
    expect(nextSetInfo([{ name: 'Supino', sets: [set('N', 40, 8, true)] }], 'kg')).toBeNull();
  });
});
