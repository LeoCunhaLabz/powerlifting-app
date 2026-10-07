/**
 * Tempo decorrido entre `startIso` e `nowMs`, como "mm:ss" ou "h:mm:ss".
 * Data inválida ou no futuro vira "00:00". Pura, testada em elapsed.test.ts.
 */
export function formatElapsed(startIso: string, nowMs: number): string {
  const start = new Date(startIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(nowMs)) return '00:00';
  const diff = Math.max(0, Math.floor((nowMs - start) / 1000));
  const h = Math.floor(diff / 3600);
  const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const ss = String(diff % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
