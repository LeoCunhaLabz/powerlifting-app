/**
 * Geometria da curva de distribuição do card "Quão forte você é" (spec §6.2).
 * O histograma vem da tabela de percentis (`@onyx/strength`): 20 faixas entre
 * `min` e `max`, pico normalizado em 1. Funções puras — testadas ao lado.
 *
 * O eixo x é em **kg** (não em percentil): a área à esquerda do marcador é,
 * por construção, a fatia de atletas que levanta menos.
 */

/** Posição relativa (0–1) de um valor em kg dentro da faixa do histograma. */
export function valueToRatio(value: number, min: number, max: number): number {
  if (!(max > min)) return 0.5;
  const ratio = (value - min) / (max - min);
  return Math.min(1, Math.max(0, ratio));
}

/** Centro da faixa `i` do histograma, em 0–1. */
function binCenter(index: number, bins: number): number {
  return (index + 0.5) / bins;
}

/**
 * Caminho SVG fechado (área) do histograma suavizado por Catmull-Rom.
 * Começa e termina na linha de base, então serve tanto de silhueta cheia
 * quanto de área recortada (clip-path) para o preenchimento em brass.
 */
export function buildAreaPath(hist: number[], width: number, height: number): string {
  if (hist.length === 0 || !(width > 0) || !(height > 0)) return '';

  const peak = Math.max(...hist, 0);
  const scale = peak > 0 ? peak : 1;
  const points = hist.map((value, i) => ({
    x: binCenter(i, hist.length) * width,
    y: height - Math.min(1, Math.max(0, value / scale)) * height,
  }));

  // Âncoras na linha de base nas duas pontas: a curva nasce e morre no chão.
  const all = [{ x: 0, y: height }, ...points, { x: width, y: height }];

  let path = `M${round(all[0].x)},${round(all[0].y)}`;
  for (let i = 0; i < all.length - 1; i++) {
    const p0 = all[Math.max(0, i - 1)];
    const p1 = all[i];
    const p2 = all[i + 1];
    const p3 = all[Math.min(all.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clamp(p1.y + (p2.y - p0.y) / 6, 0, height) };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clamp(p2.y - (p3.y - p1.y) / 6, 0, height) };
    path += ` C${round(c1.x)},${round(c1.y)} ${round(c2.x)},${round(c2.y)} ${round(p2.x)},${round(p2.y)}`;
  }
  return `${path} Z`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
