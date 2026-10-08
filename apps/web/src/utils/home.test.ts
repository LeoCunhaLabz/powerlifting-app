import { describe, expect, it } from 'vitest';
import type { Program, WorkoutSession } from '@powerlifting/shared';
import {
  barHeights, bodyweightSummary, bodyweightTrendText, dayHeadline, longDate, programWeek, relativeDay,
  sessionRecordsText, startOfWeek, strengthSummary, templateMeta, tonnageText, trendText, weekSummary,
} from './home';

// Quinta, 8 de outubro de 2026, meio-dia local.
const NOW = new Date(2026, 9, 8, 12, 0, 0);
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

let seq = 0;
const lift = (name: string, weight: number, reps = 1, completed = true, isPr?: boolean) => ({
  id: `ex${seq++}`,
  name,
  sets: [{ id: `s${seq++}`, weight, reps, completed, type: 'N' as const, isPr }],
});
const session = (date: string, exercises: WorkoutSession['exercises'] = [], extra: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: `w${seq++}`, name: 'Treino', date, duration: 3120, exercises, ...extra,
});
const sbd = (date: string, s: number, b: number, d: number) =>
  session(date, [lift('Agachamento', s), lift('Supino Reto', b), lift('Levantamento Terra', d)]);

describe('startOfWeek', () => {
  it('volta para a segunda-feira à meia-noite', () => {
    const s = startOfWeek(NOW);
    expect(s.getDay()).toBe(1);
    expect(s.getDate()).toBe(5);
    expect(s.getHours()).toBe(0);
  });
});

describe('strengthSummary', () => {
  it('soma os três melhores e1RM das últimas 12 semanas e guarda o recorde de sempre', () => {
    const history = [
      sbd(daysAgo(200), 200, 140, 240), // recorde antigo, fora da janela
      sbd(daysAgo(10), 180, 120, 210),
      session(daysAgo(3), [lift('agachamento', 182.5)]),
    ];
    const s = strengthSummary(history, NOW);
    expect(s.total).toBe(512.5);
    expect(s.lifts.map((l) => [l.label, l.current, l.record])).toEqual([
      ['Agachamento', 182.5, 200],
      ['Supino', 120, 140],
      ['Terra', 210, 240],
    ]);
    expect(s.missing).toEqual([]);
  });

  it('sem os três levantamentos não há total, e diz quais faltam', () => {
    const s = strengthSummary([session(daysAgo(2), [lift('Agachamento', 150)])], NOW);
    expect(s.total).toBeNull();
    expect(s.missing).toEqual(['Supino', 'Terra']);
    expect(s.trend).toBeNull();
  });

  it('ignora séries sem check', () => {
    const s = strengthSummary([session(daysAgo(1), [lift('Agachamento', 300, 1, false)])], NOW);
    expect(s.lifts[0].current).toBe(0);
  });

  it('mede a subida desde a primeira semana com total', () => {
    const history = [sbd(daysAgo(28), 170, 110, 200), sbd(daysAgo(2), 175, 112.5, 205)];
    const s = strengthSummary(history, NOW);
    expect(s.trend).toEqual({ kind: 'up', delta: 12.5, weeks: 4 });
    expect(trendText(s.trend!, 'kg')).toBe('+12,5 kg em 4 semanas');
  });

  it('platô de 3 semanas ou mais vira "estável"', () => {
    const history = [sbd(daysAgo(60), 170, 110, 200), sbd(daysAgo(30), 180, 120, 210)];
    const s = strengthSummary(history, NOW);
    expect(s.trend?.kind).toBe('flat');
    expect(trendText(s.trend!, 'kg')).toBe(`Estável há ${s.trend!.weeks} semanas`);
  });

  it('a força cai quando o pico sai da janela de 12 semanas', () => {
    const history = [sbd(daysAgo(85), 200, 130, 230), sbd(daysAgo(60), 180, 120, 210)];
    const s = strengthSummary(history, NOW);
    expect(s.total).toBe(510);
    expect(s.trend).toMatchObject({ kind: 'down', delta: 50 });
    expect(trendText(s.trend!, 'kg')).toMatch(/^−50 kg em \d+ semanas$/);
  });

  it('12 semanas de série, a última é a atual', () => {
    const s = strengthSummary([sbd(daysAgo(1), 100, 80, 120)], NOW);
    expect(s.weekly).toHaveLength(12);
    expect(s.weekly[11]).toBe(300);
    expect(s.weekly.slice(0, 11).every((v) => v === null)).toBe(true);
  });
});

describe('barHeights', () => {
  it('platô vira barras iguais e cheias', () => {
    expect(barHeights([500, 500, 500])).toEqual([1, 1, 1]);
  });

  it('a menor barra fica na metade, a maior cheia, semana sem dado zera', () => {
    expect(barHeights([null, 400, 450, 500])).toEqual([0, 0.5, 0.75, 1]);
  });

  it('sem dado nenhum, tudo zero', () => {
    expect(barHeights([null, null])).toEqual([0, 0]);
  });
});

describe('weekSummary', () => {
  it('conta os treinos, a tonelagem e os dias desta semana', () => {
    const history = [
      session(daysAgo(3), [lift('Agachamento', 100, 5)]), // segunda
      session(daysAgo(2), [lift('Supino Reto', 80, 5)]), // terça
      session(daysAgo(8), [lift('Agachamento', 100, 5)]), // semana passada
    ];
    const w = weekSummary(history, NOW);
    expect(w.count).toBe(2);
    expect(w.tonnage).toBe(900);
    expect(w.days).toEqual([true, true, false, false, false, false, false]);
    expect(w.todayIdx).toBe(3);
    expect(w.streak).toBe(2);
  });

  it('semana atual ainda sem treino não zera a sequência', () => {
    const history = [session(daysAgo(7)), session(daysAgo(14)), session(daysAgo(28))];
    expect(weekSummary(history, NOW).streak).toBe(2);
  });

  it('sem histórico, zero', () => {
    expect(weekSummary([], NOW)).toMatchObject({ count: 0, tonnage: 0, streak: 0 });
  });
});

describe('tonnageText', () => {
  it('kg vira tonelada a partir de 1.000', () => {
    expect(tonnageText(18400, 'kg')).toBe('18,4 t');
    expect(tonnageText(850, 'kg')).toBe('850 kg');
    expect(tonnageText(40500, 'lbs')).toBe('40.500 lbs');
  });
});

describe('bodyweightSummary', () => {
  it('sem registro é null (peso não informado)', () => {
    expect(bodyweightSummary([])).toBeNull();
  });

  it('um registro só, sem variação', () => {
    const s = bodyweightSummary([{ date: daysAgo(1), weight: 82 }])!;
    expect(s).toEqual({ latest: 82, delta: null, days: 0 });
    expect(bodyweightTrendText(s, 'kg')).toBeNull();
  });

  it('variação contra o registro de 30 dias antes', () => {
    const s = bodyweightSummary([
      { date: daysAgo(60), weight: 85 },
      { date: daysAgo(31), weight: 84 },
      { date: daysAgo(10), weight: 83.8 },
      { date: daysAgo(1), weight: 83.4 },
    ])!;
    expect(s.latest).toBe(83.4);
    expect(s.delta).toBe(-0.6);
    expect(bodyweightTrendText(s, 'kg')).toBe(`−0,6 kg em ${s.days} dias`);
  });

  it('com menos de 30 dias, desde o primeiro registro', () => {
    const s = bodyweightSummary([{ date: daysAgo(12), weight: 80 }, { date: daysAgo(0), weight: 80 }])!;
    expect(s).toMatchObject({ delta: 0, days: 12 });
    expect(bodyweightTrendText(s, 'kg')).toBe('sem variação em 12 dias');
  });
});

describe('dayHeadline', () => {
  const program = (trainingDays: number[]): Program => ({
    id: 'p', name: 'Bloco', templateIds: [], isActive: true, createdAt: '2026-09-01T00:00:00.000Z', trainingDays,
  });

  it('treino ativo vence tudo', () => {
    expect(dayHeadline({ hasActiveWorkout: true, history: [], now: NOW })).toBe('Treino em andamento');
  });

  it('treinou hoje', () => {
    expect(dayHeadline({ hasActiveWorkout: false, history: [session(daysAgo(0, 8))], now: NOW })).toBe('Treino feito hoje');
  });

  it('com programa, diz se hoje é dia de treino ou de descanso', () => {
    expect(dayHeadline({ hasActiveWorkout: false, history: [], program: program([3]), now: NOW })).toBe('Dia de treino');
    expect(dayHeadline({ hasActiveWorkout: false, history: [], program: program([0, 2]), now: NOW })).toBe('Dia de descanso');
  });

  it('sem programa, conta os dias desde o último treino', () => {
    const at = (n: number) => dayHeadline({ hasActiveWorkout: false, history: [session(daysAgo(n))], now: NOW });
    expect(at(1)).toBe('Treinou ontem');
    expect(at(3)).toBe('Treinou há 3 dias');
    expect(at(21)).toBe('Treinou há 3 semanas');
  });

  it('sem histórico', () => {
    expect(dayHeadline({ hasActiveWorkout: false, history: [], now: NOW })).toBe('Seu primeiro treino');
  });
});

describe('datas', () => {
  it('data longa sem "-feira"', () => {
    expect(longDate(NOW)).toBe('Quinta, 8 de outubro');
  });

  it('dia relativo', () => {
    expect(relativeDay(new Date(daysAgo(0)), NOW)).toBe('Hoje');
    expect(relativeDay(new Date(daysAgo(1)), NOW)).toBe('Ontem');
    expect(relativeDay(new Date(daysAgo(2)), NOW)).toBe('Terça');
    expect(relativeDay(new Date(daysAgo(10)), NOW)).toMatch(/^28 de set/);
  });
});

describe('templateMeta e programWeek', () => {
  it('conta exercícios e séries', () => {
    const t = { id: 't', name: 'A', description: '', exercises: [
      { name: 'Agachamento', sets: [{ reps: 5, type: 'N' as const }, { reps: 5, type: 'N' as const }] },
      { name: 'Supino Reto', sets: [{ reps: 5, type: 'N' as const }] },
    ] };
    expect(templateMeta(t)).toBe('2 exercícios, 3 séries');
  });

  it('semana do bloco, só com mais de uma semana', () => {
    const base = { id: 'p', name: 'Bloco', templateIds: [], isActive: true, createdAt: '2026-09-01T00:00:00.000Z' };
    expect(programWeek({ ...base, weekCount: 4, startDate: '2026-09-21' }, NOW)).toEqual({ week: 3, count: 4 });
    expect(programWeek({ ...base, weekCount: 1 }, NOW)).toBeNull();
  });
});

describe('sessionRecordsText', () => {
  it('nomeia os levantamentos com recorde', () => {
    expect(sessionRecordsText(session(daysAgo(1), [lift('Levantamento Terra', 215, 1, true, true)]))).toBe('Recorde em Terra');
    expect(sessionRecordsText(session(daysAgo(1), [
      lift('Agachamento', 180, 1, true, true), lift('Levantamento Terra', 215, 1, true, true),
    ]))).toBe('Recordes em Agachamento e Terra');
    expect(sessionRecordsText(session(daysAgo(1), [lift('Agachamento', 180)]))).toBeNull();
  });
});
