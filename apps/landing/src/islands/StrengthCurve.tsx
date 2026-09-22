import { useId, type CSSProperties } from 'react';
import { buildAreaPath, valueToRatio } from '../lib/strengthCurve';
import { formatKg } from '../lib/format';

const VIEW_W = 340;
const VIEW_H = 112;
const BASELINE = 108;
const TOP = 14;

interface StrengthCurveProps {
  hist: number[];
  min: number;
  max: number;
  /** Valor do usuário, em kg. */
  value: number;
  /** Meta (entrada do próximo nível), em kg — ausente no topo da escada. */
  goal?: number;
  goalLabel?: string;
  /** Texto equivalente da curva para leitores de tela (spec §6.7). */
  ariaLabel: string;
  /** Preenche a área uma vez ao revelar (desktop sem prefers-reduced-motion). */
  animate: boolean;
}

/**
 * Curva de distribuição da categoria com o marcador do usuário e a meta.
 * Eixo x em kg: a área preenchida à esquerda é a fatia que levanta menos.
 * As etiquetas são HTML sobre o SVG — texto que quebra e cresce sem medir glifo.
 *
 * O preenchimento entra por `animation` de CSS (keyframes em forca.css), não por
 * estado: é a única animação da landing e não deve custar render nenhum.
 */
export default function StrengthCurve({ hist, min, max, value, goal, goalLabel, ariaLabel, animate }: StrengthCurveProps) {
  const clipId = useId().replace(/:/g, '');

  const path = buildAreaPath(hist, VIEW_W, BASELINE - TOP);
  const userRatio = valueToRatio(value, min, max);
  const userX = userRatio * VIEW_W;
  const goalRatio = goal === undefined ? 0 : valueToRatio(goal, min, max);
  const hasGoal = goal !== undefined && goalLabel !== undefined;

  return (
    <div className="forca__curve">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" height={VIEW_H} width={userX} className={animate ? 'forca__reveal' : undefined} />
          </clipPath>
        </defs>
        <g transform={`translate(0 ${TOP})`}>
          <path d={path} fill="var(--bg-tertiary)" />
          <path d={path} fill="var(--accent)" fillOpacity="0.3" clipPath={`url(#${clipId})`} />
        </g>
        <line x1={userX} y1="0" x2={userX} y2={BASELINE} stroke="var(--accent)" strokeWidth="2" />
        {hasGoal && (
          <line
            x1={goalRatio * VIEW_W}
            y1="0"
            x2={goalRatio * VIEW_W}
            y2={BASELINE}
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}
        <line x1="0" y1={BASELINE} x2={VIEW_W} y2={BASELINE} stroke="var(--border-color)" />
      </svg>
      <span className="forca__tag" style={tagStyle(userRatio, 0)}>
        Você · {formatKg(value)} kg
      </span>
      {hasGoal && (
        <span className="forca__tag forca__tag--goal" style={tagStyle(goalRatio, 1)}>
          {goalLabel} · {formatKg(goal)} kg
        </span>
      )}
    </div>
  );
}

/** Etiqueta ancorada no marcador, virando para dentro perto das bordas. */
function tagStyle(ratio: number, row: number): CSSProperties {
  const translate = ratio > 0.72 ? '-100%' : ratio < 0.12 ? '0%' : '-50%';
  return { left: `${ratio * 100}%`, top: `${row * 30}px`, transform: `translateX(${translate})` };
}
