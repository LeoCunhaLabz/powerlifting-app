/**
 * Descanso entre séries (#330, #341, #342): estado, formato e ajustes do cronômetro.
 * Funções puras, testadas em restTimer.test.ts.
 */
import type { SetState } from '@powerlifting/shared';
import { formatCompact } from './format';
import { findCurrentSet, setLabel } from './workoutSets';

/** Descanso em andamento: fim (epoch ms), duração total em segundos (0 = desconhecida) e exercício. */
export interface RestTimerData {
  end: number;
  total: number;
  exercise?: string;
}

export const DEFAULT_REST_SECONDS = 120;
/** Depois de 15 min de tempo extra, a barra some sozinha (ex.: app reaberto horas depois). */
export const REST_OVERTIME_LIMIT = 15 * 60;

export function serializeRest(rest: RestTimerData): string {
  return JSON.stringify(rest);
}

/** Lê o valor salvo: o JSON atual ou o formato antigo (só o número do fim). null se inválido. */
export function parseStoredRest(raw: string | null): RestTimerData | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw.trim())) return { end: Number(raw), total: 0 };
  try {
    const v = JSON.parse(raw) as Partial<RestTimerData>;
    if (typeof v.end !== 'number' || !Number.isFinite(v.end)) return null;
    const total = typeof v.total === 'number' && v.total > 0 ? v.total : 0;
    return typeof v.exercise === 'string' ? { end: v.end, total, exercise: v.exercise } : { end: v.end, total };
  } catch {
    return null;
  }
}

/** Restante (arredondado para cima), tempo extra depois do fim e total para os segmentos. */
export function restStatus(rest: Pick<RestTimerData, 'end' | 'total'>, now: number) {
  const remaining = Math.max(0, Math.ceil((rest.end - now) / 1000));
  const ended = remaining === 0;
  const overtime = ended ? Math.floor((now - rest.end) / 1000) : 0;
  return { remaining, overtime, ended, total: Math.max(rest.total, remaining) };
}

/**
 * ±segundos no descanso atual. Nunca deixa o fim no passado; somar depois do fim recomeça a
 * contagem a partir de agora (e o total passa a ser só o que foi somado).
 */
export function adjustRest(rest: RestTimerData, deltaSeconds: number, now: number): RestTimerData {
  const ended = rest.end <= now;
  const end = Math.max(now, Math.max(now, rest.end) + deltaSeconds * 1000);
  const total = ended ? Math.max(1, deltaSeconds) : Math.max(1, rest.total + deltaSeconds);
  return { ...rest, end, total };
}

/** "1:48", "0:05", "10:00". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Duração padrão do descanso nas Configurações: de 30 s a 10 min; inválido volta a 2 min. */
export function clampRestSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_REST_SECONDS;
  return Math.min(600, Math.max(30, Math.round(seconds)));
}

/** Próxima série do treino para a barra de descanso. null com tudo concluído. */
export function nextSetInfo(
  exercises: ReadonlyArray<{ name: string; sets: ReadonlyArray<SetState> }>,
  units: 'kg' | 'lbs',
): { exercise: string; set: string; load: string } | null {
  const current = findCurrentSet(exercises);
  if (!current) return null;
  const ex = exercises[current.exIdx];
  const s = ex.sets[current.setIdx];
  const set = s.type === 'W' ? 'aquecimento' : s.type === 'D' ? 'drop set' : `série ${setLabel(ex.sets, current.setIdx)}`;
  const load = s.weight > 0
    ? `${formatCompact(s.weight)} ${units} × ${s.reps}`
    : s.reps > 0 ? `${s.reps} reps` : '';
  return { exercise: ex.name, set, load };
}
