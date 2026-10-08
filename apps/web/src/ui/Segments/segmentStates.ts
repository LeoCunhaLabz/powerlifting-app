export type SegmentState = 'done' | 'current' | 'pending';
export type SegmentsMode = 'progress' | 'countdown';

export interface SegmentsInput {
  total: number;
  filled: number;
  mode: SegmentsMode;
  withCurrent?: boolean;
}

/** Maior quantidade de segmentos desenhada; acima disso, os estados são escalados. */
export const MAX_SEGMENTS = 60;

/**
 * Estado de cada segmento da barra.
 * - progress: os `filled` primeiros são 'done'; o seguinte é 'current' (se `withCurrent`); o resto, 'pending'.
 * - countdown: os `filled` primeiros (tempo restante) são 'current'; o resto, 'pending'.
 * `total` é truncado e limitado a [0, ∞); `filled`, a [0, total]. Acima de MAX_SEGMENTS,
 * desenha MAX_SEGMENTS segmentos com `filled` escalado na mesma proporção.
 */
export function segmentStates({ total, filled, mode, withCurrent = true }: SegmentsInput): SegmentState[] {
  const rawTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const rawFilled = Number.isFinite(filled) ? Math.min(rawTotal, Math.max(0, Math.floor(filled))) : 0;
  const count = Math.min(MAX_SEGMENTS, rawTotal);
  const lit = rawTotal > MAX_SEGMENTS ? Math.floor((rawFilled * MAX_SEGMENTS) / rawTotal) : rawFilled;

  return Array.from({ length: count }, (_, i): SegmentState => {
    if (i < lit) return mode === 'countdown' ? 'current' : 'done';
    if (mode === 'progress' && withCurrent && i === lit) return 'current';
    return 'pending';
  });
}

/**
 * Quantos segmentos ficam acesos numa contagem regressiva. Arredonda para cima,
 * para o último segmento só apagar quando o tempo acabar. Restante acima do total
 * (ex.: +15 s além do padrão) acende todos; entradas inválidas apagam todos.
 */
export function countdownFilled(remainingSec: number, totalSec: number, segments: number): number {
  if (!(totalSec > 0) || !(segments > 0) || !Number.isFinite(remainingSec)) return 0;
  const ratio = Math.min(1, Math.max(0, remainingSec / totalSec));
  return Math.ceil(ratio * segments);
}
