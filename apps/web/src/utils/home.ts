/**
 * Contas do Início (#343). Funções puras, testadas em home.test.ts; `now` é sempre parâmetro.
 *
 * "Atual" = melhor e1RM de cada levantamento nas últimas 12 semanas (esta e as 11 anteriores).
 * É a definição que a #335 adota nas outras telas, ao lado de "melhor de sempre".
 */
import type { BodyweightEntry, Program, WorkoutSession, WorkoutTemplate } from '@powerlifting/shared';
import { calculateE1RM } from './powerlifting';
import { currentWeekIndex, sessionDayKey, toLocalDate, weekDayIdx } from './programProgress';
import { formatCompact, formatNumber } from './format';

export const SBD_LIFTS = ['Agachamento', 'Supino Reto', 'Levantamento Terra'] as const;
export type SbdLift = (typeof SBD_LIFTS)[number];
export const SBD_LABELS: Record<SbdLift, string> = {
  Agachamento: 'Agachamento',
  'Supino Reto': 'Supino',
  'Levantamento Terra': 'Terra',
};

/** Janela do "atual", em semanas. */
export const CURRENT_WEEKS = 12;

const DAY_MS = 86_400_000;

/** Segunda-feira 00:00 (hora local) da semana de `d`. */
export function startOfWeek(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - weekDayIdx(s));
  return s;
}

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Dias de calendário entre duas datas (hora local), ignorando a hora do dia. */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

// ─── Sua força ────────────────────────────────────────────────────────────────

export interface LiftStrength {
  lift: SbdLift;
  label: string;
  /** Melhor e1RM nas últimas 12 semanas; 0 sem dado. */
  current: number;
  /** Melhor e1RM de sempre; 0 sem dado. */
  record: number;
}

export type StrengthTrend =
  | { kind: 'up' | 'down'; delta: number; weeks: number }
  /** Total igual nas últimas `weeks` semanas (platô). */
  | { kind: 'flat'; weeks: number }
  /** Oscilou, mas voltou ao total de `weeks` semanas atrás. */
  | { kind: 'same'; weeks: number };

export interface StrengthSummary {
  lifts: LiftStrength[];
  /** Soma dos três atuais; null quando falta algum. */
  total: number | null;
  /** Rótulos dos levantamentos sem dado nas últimas 12 semanas. */
  missing: string[];
  /** Total atual ao fim de cada uma das últimas 12 semanas (a última é esta); null sem os três. */
  weekly: (number | null)[];
  trend: StrengthTrend | null;
}

interface LiftPoint { t: number; e1rm: number }

function liftPoints(history: WorkoutSession[]): Record<SbdLift, LiftPoint[]> {
  const points = { Agachamento: [], 'Supino Reto': [], 'Levantamento Terra': [] } as Record<SbdLift, LiftPoint[]>;
  for (const session of history) {
    const t = new Date(session.date).getTime();
    for (const ex of session.exercises) {
      const lift = SBD_LIFTS.find((l) => l.toLowerCase() === ex.name.trim().toLowerCase());
      if (!lift) continue;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const e1rm = calculateE1RM(set.weight, set.reps, set.rpe);
        if (e1rm > 0) points[lift].push({ t, e1rm });
      }
    }
  }
  return points;
}

const bestIn = (points: LiftPoint[], from: number, to: number) =>
  points.reduce((best, p) => (p.t >= from && p.t < to && p.e1rm > best ? p.e1rm : best), 0);

/** Semanas seguidas, até a atual, em que o total ficou igual. */
function flatWeeks(weekly: (number | null)[]): number {
  const last = weekly[weekly.length - 1];
  let steps = 0;
  for (let i = weekly.length - 2; i >= 0 && weekly[i] !== null && weekly[i] === last; i -= 1) steps += 1;
  return steps;
}

export function strengthSummary(history: WorkoutSession[], now: Date): StrengthSummary {
  const points = liftPoints(history);
  const thisWeek = startOfWeek(now);

  const weekly = Array.from({ length: CURRENT_WEEKS }, (_, k) => {
    const end = addDays(thisWeek, (k - CURRENT_WEEKS + 2) * 7).getTime();
    const start = addDays(new Date(end), -CURRENT_WEEKS * 7).getTime();
    const bests = SBD_LIFTS.map((l) => bestIn(points[l], start, end));
    return bests.every((b) => b > 0) ? round1(bests.reduce((a, b) => a + b, 0)) : null;
  });

  const windowEnd = addDays(thisWeek, 7).getTime();
  const windowStart = addDays(thisWeek, -(CURRENT_WEEKS - 1) * 7).getTime();
  const lifts = SBD_LIFTS.map((lift): LiftStrength => ({
    lift,
    label: SBD_LABELS[lift],
    current: bestIn(points[lift], windowStart, windowEnd),
    record: points[lift].reduce((best, p) => Math.max(best, p.e1rm), 0),
  }));

  const total = weekly[CURRENT_WEEKS - 1];
  const first = weekly.findIndex((v) => v !== null);
  let trend: StrengthTrend | null = null;
  if (total !== null && first >= 0 && first < CURRENT_WEEKS - 1) {
    const weeks = CURRENT_WEEKS - 1 - first;
    const flat = flatWeeks(weekly);
    const delta = round1(total - (weekly[first] as number));
    if (flat >= 3 || flat === weeks) trend = { kind: 'flat', weeks: flat };
    else if (delta === 0) trend = { kind: 'same', weeks };
    else trend = { kind: delta > 0 ? 'up' : 'down', delta: Math.abs(delta), weeks };
  }

  return {
    lifts,
    total,
    missing: lifts.filter((l) => l.current === 0).map((l) => l.label),
    weekly,
    trend,
  };
}

/**
 * Altura de cada barra (0 a 1). A base fica abaixo do mínimo, para a menor barra ainda aparecer
 * e o platô virar barras iguais (nunca uma linha colada no fundo). Semana sem total → 0.
 */
export function barHeights(values: (number | null)[]): number[] {
  const present = values.filter((v): v is number => v !== null && v > 0);
  if (present.length === 0) return values.map(() => 0);
  const max = Math.max(...present);
  const min = Math.min(...present);
  const floor = Math.max(0, min - Math.max(max - min, max * 0.05));
  return values.map((v) => (v === null || v <= 0 ? 0 : (v - floor) / (max - floor)));
}

const weeksText = (n: number) => (n === 1 ? '1 semana' : `${n} semanas`);

/** "+12,5 kg em 12 semanas", "−5 kg em 4 semanas", "Estável há 3 semanas". */
export function trendText(trend: StrengthTrend, unit: string): string {
  if (trend.kind === 'flat') return `Estável há ${weeksText(trend.weeks)}`;
  if (trend.kind === 'same') return `Igual a ${weeksText(trend.weeks)} atrás`;
  const sign = trend.kind === 'up' ? '+' : '−';
  return `${sign}${formatCompact(trend.delta, 1)} ${unit} em ${weeksText(trend.weeks)}`;
}

// ─── Esta semana ──────────────────────────────────────────────────────────────

export const tonnage = (s: WorkoutSession) =>
  s.exercises.reduce((t, ex) => t + ex.sets.reduce((st, set) => st + (set.completed ? set.weight * set.reps : 0), 0), 0);

export interface WeekSummary {
  count: number;
  tonnage: number;
  /** Seg a Dom: treinou no dia. */
  days: boolean[];
  todayIdx: number;
  /** Semanas seguidas com treino. Se esta ainda não tem, conta a partir da passada. */
  streak: number;
}

export function weekSummary(history: WorkoutSession[], now: Date): WeekSummary {
  const start = startOfWeek(now);
  const dayKeys = Array.from({ length: 7 }, (_, i) => toLocalDate(addDays(start, i)));
  const thisWeek = history.filter((s) => new Date(s.date).getTime() >= start.getTime());
  const trainedKeys = new Set(history.map((s) => sessionDayKey(s.date)));

  const weeksWithSession = new Set(history.map((s) => toLocalDate(startOfWeek(new Date(s.date)))));
  let cursor = weeksWithSession.has(toLocalDate(start)) ? start : addDays(start, -7);
  let streak = 0;
  while (weeksWithSession.has(toLocalDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }

  return {
    count: thisWeek.length,
    tonnage: thisWeek.reduce((t, s) => t + tonnage(s), 0),
    days: dayKeys.map((k) => trainedKeys.has(k)),
    todayIdx: weekDayIdx(now),
    streak,
  };
}

/** "18,4 t" (kg a partir de 1.000), "850 kg", "40.500 lbs". */
export function tonnageText(value: number, unit: string): string {
  if (unit === 'kg' && value >= 1000) return `${formatNumber(value / 1000, 1)} t`;
  return `${formatCompact(Math.round(value), 0)} ${unit}`;
}

// ─── Peso corporal ────────────────────────────────────────────────────────────

export interface BodyweightSummary {
  latest: number;
  /** Variação até o último registro; null com um registro só. */
  delta: number | null;
  /** Dias cobertos pela variação (até 30, ou desde o primeiro registro). */
  days: number;
}

/** Último peso e a variação nos últimos 30 dias (ou desde o primeiro registro). null sem registro. */
export function bodyweightSummary(log: BodyweightEntry[]): BodyweightSummary | null {
  if (log.length === 0) return null;
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  if (sorted.length === 1) return { latest: latest.weight, delta: null, days: 0 };
  const latestTime = new Date(latest.date).getTime();
  const ref = [...sorted].reverse().find((e) => new Date(e.date).getTime() <= latestTime - 30 * DAY_MS) ?? sorted[0];
  return {
    latest: latest.weight,
    delta: round1(latest.weight - ref.weight),
    days: calendarDaysBetween(new Date(ref.date), new Date(latest.date)),
  };
}

/** "−0,6 kg em 30 dias", "sem variação em 12 dias". */
export function bodyweightTrendText(summary: BodyweightSummary, unit: string): string | null {
  if (summary.delta === null || summary.days === 0) return null;
  const period = summary.days === 1 ? '1 dia' : `${summary.days} dias`;
  if (summary.delta === 0) return `sem variação em ${period}`;
  const sign = summary.delta > 0 ? '+' : '−';
  return `${sign}${formatCompact(Math.abs(summary.delta), 1)} ${unit} em ${period}`;
}

// ─── Título e datas ───────────────────────────────────────────────────────────

export interface HeadlineInput {
  hasActiveWorkout: boolean;
  history: WorkoutSession[];
  program?: Program;
  now: Date;
}

/** Título do Início: responde ao estado do dia. */
export function dayHeadline({ hasActiveWorkout, history, program, now }: HeadlineInput): string {
  if (hasActiveWorkout) return 'Treino em andamento';
  const today = toLocalDate(now);
  if (history.some((s) => sessionDayKey(s.date) === today)) return 'Treino feito hoje';
  if (program?.trainingDays?.length) {
    return program.trainingDays.includes(weekDayIdx(now)) ? 'Dia de treino' : 'Dia de descanso';
  }
  if (history.length === 0) return 'Seu primeiro treino';
  const last = history.reduce((a, b) => (a.date > b.date ? a : b));
  const days = calendarDaysBetween(new Date(last.date), now);
  if (days <= 1) return 'Treinou ontem';
  if (days < 14) return `Treinou há ${days} dias`;
  return `Treinou há ${Math.floor(days / 7)} semanas`;
}

const weekdayName = (d: Date) => {
  const name = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** "Quinta, 8 de outubro". */
export function longDate(d: Date): string {
  return `${weekdayName(d)}, ${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
}

/** "Hoje", "Ontem", "Terça" (até 6 dias) ou "8 de out.". */
export function relativeDay(date: Date, now: Date): string {
  const days = calendarDaysBetween(date, now);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return weekdayName(date);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

// ─── Próximo e último treino ──────────────────────────────────────────────────

/** "4 exercícios, 17 séries". */
export function templateMeta(template: WorkoutTemplate): string {
  const ex = template.exercises.length;
  const sets = template.exercises.reduce((n, e) => n + e.sets.length, 0);
  return `${ex === 1 ? '1 exercício' : `${ex} exercícios`}, ${sets === 1 ? '1 série' : `${sets} séries`}`;
}

/** Semana atual do bloco (1-based); null quando o programa não tem mais de uma semana. */
export function programWeek(program: Program, now: Date): { week: number; count: number } | null {
  const count = program.weekCount ?? 1;
  if (count <= 1) return null;
  const startDate = program.startDate ?? program.createdAt.slice(0, 10);
  return { week: currentWeekIndex(startDate, count, now) + 1, count };
}

/** "Recorde em Terra", "Recordes em Agachamento e Terra", "Recordes em 3 exercícios"; null sem recorde. */
export function sessionRecordsText(session: WorkoutSession): string | null {
  const names = session.exercises
    .filter((ex) => ex.sets.some((s) => s.completed && s.isPr))
    .map((ex) => {
      const lift = SBD_LIFTS.find((l) => l.toLowerCase() === ex.name.trim().toLowerCase());
      return lift ? SBD_LABELS[lift] : ex.name;
    });
  if (names.length === 0) return null;
  if (names.length === 1) return `Recorde em ${names[0]}`;
  if (names.length === 2) return `Recordes em ${names[0]} e ${names[1]}`;
  return `Recordes em ${names.length} exercícios`;
}
