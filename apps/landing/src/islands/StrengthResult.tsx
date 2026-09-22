import { LEVELS, type StrengthComparison } from '@onyx/strength';
import { formatKg, formatNumber } from '../lib/format';
import AnimatedNumber from './AnimatedNumber';
import StrengthCurve from './StrengthCurve';

/** Rótulos curtos dos degraus no eixo (o nome inteiro estoura no mobile). */
const AXIS_LABELS: Record<string, string> = {
  'Pódio regional': 'Pódio reg.',
  'Elite nacional': 'Elite nac.',
};

interface StrengthResultProps {
  comparison: StrengthComparison;
  /** "supino", "agacho", "terra" ou "total". */
  liftLabel: string;
  /** Valor comparado, em kg (máximo estimado ou total). */
  value: number;
  /** "Máximo estimado"/"Total estimado" — ausente quando tudo veio com 1 rep. */
  estimatedLabel?: string;
  dots?: number;
  animate: boolean;
  signupUrl: string;
  onCta: () => void;
  shareLabel: string;
  onShare: () => void;
  /** Link "adicionar agacho e terra" — só no modo compacto. */
  fullModeHref?: string;
  onAddLifts?: () => void;
}

/** Card de resultado (spec §6.2, normativo em resultado-card-v4.html). */
export default function StrengthResult({
  comparison,
  liftLabel,
  value,
  estimatedLabel,
  dots,
  animate,
  signupUrl,
  onCta,
  shareLabel,
  onShare,
  fullModeHref,
  onAddLifts,
}: StrengthResultProps) {
  const { percentile, level, nextLevel, kgToNext, classLabel, merged, n, ratio } = comparison;
  const hasGoal = nextLevel !== undefined && kgToNext !== undefined;

  const ariaLabel = hasGoal
    ? `Você está acima de ${percentile}% dos atletas da categoria ${classLabel}; faltam ${formatKg(kgToNext)} quilos para ${nextLevel}.`
    : `Você está acima de ${percentile}% dos atletas da categoria ${classLabel}: ${level}, o topo da escada.`;

  return (
    <div className="forca__card">
      <span className="forca__kicker">
        Seu {liftLabel} · {classLabel} · raw
      </span>

      <p className="forca__ratio">
        <AnimatedNumber value={ratio} decimals={1} />×<small>o seu peso corporal</small>
      </p>

      {estimatedLabel && (
        <p className="forca__estimated">
          {estimatedLabel}: <b>{formatKg(value)} kg</b>
        </p>
      )}

      <StrengthCurve
        hist={comparison.hist}
        min={comparison.min}
        max={comparison.max}
        value={value}
        goal={comparison.nextKg}
        goalLabel={nextLevel}
        ariaLabel={ariaLabel}
        animate={animate}
      />

      <div className="forca__axis" aria-hidden="true">
        {LEVELS.map((step) => (
          <span key={step} className={step === level ? 'is-current' : undefined}>
            {AXIS_LABELS[step] ?? step}
          </span>
        ))}
      </div>

      <div className={`forca__stats${hasGoal ? '' : ' forca__stats--single'}`}>
        <div>
          <span className="forca__stat-num forca__stat-num--accent">{percentile}%</span>
          <span className="forca__stat-label">dos atletas da sua categoria levantam menos</span>
        </div>
        {hasGoal && (
          <div>
            <span className="forca__stat-num">{formatKg(kgToNext)} kg</span>
            <span className="forca__stat-label">faltam pra {nextLevel}</span>
          </div>
        )}
      </div>

      <p className="forca__foot">
        Dados: OpenPowerlifting · {formatNumber(n, 0)} atletas {classLabel} · raw · últimos 10 anos
        {merged && ' · categorias agrupadas por poucos dados'}
        {dots !== undefined && ` · DOTS ${formatNumber(dots, 1)}`}
      </p>

      <a className="btn btn--primary forca__cta" href={signupUrl} onClick={onCta}>
        Salvar e acompanhar a evolução
      </a>

      <p className="forca__links">
        <button type="button" onClick={onShare}>
          {shareLabel}
        </button>
        {fullModeHref && (
          <>
            <span aria-hidden="true">·</span>
            <a href={fullModeHref} onClick={onAddLifts}>
              adicionar agacho e terra
            </a>
          </>
        )}
      </p>
    </div>
  );
}
