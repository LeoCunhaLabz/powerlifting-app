import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateDots, calculateE1RM } from '@onyx/calc';
import { compareLift, compareTotal, type Lift, type SingleLift, type StrengthComparison } from '@onyx/strength';
import { parseDecimal } from '../lib/format';
import { useMotionAllowed } from '../lib/media';
import { trackEvent } from '../lib/analytics';
import {
  buildFullModePath,
  buildShareUrl,
  buildSignupUrl,
  parseShareQuery,
  REP_OPTIONS,
  type ShareInput,
  type ShareLift,
  type Sex,
} from '../lib/strengthShare';
import { NumberField, SegmentedRadio } from './ui';
import StrengthResult from './StrengthResult';
import './calc.css';
import './forca.css';

const LIFTS: SingleLift[] = ['squat', 'bench', 'deadlift'];
const LIFT_TITLES: Record<SingleLift, string> = { squat: 'Agacho', bench: 'Supino', deadlift: 'Terra' };
const LIFT_LABELS: Record<Lift, string> = { squat: 'agacho', bench: 'supino', deadlift: 'terra', total: 'total' };

const SEX_OPTIONS = [
  { value: 'm' as Sex, label: 'Masc.' },
  { value: 'f' as Sex, label: 'Fem.' },
];
const LIFT_OPTIONS = LIFTS.map((lift) => ({ value: lift, label: LIFT_TITLES[lift] }));
const REP_CHOICES = REP_OPTIONS.map((reps) => ({ value: String(reps), label: String(reps) }));

const EMPTY_LIFTS: Record<SingleLift, { kg: string; reps: number }> = {
  squat: { kg: '', reps: 1 },
  bench: { kg: '', reps: 1 },
  deadlift: { kg: '', reps: 1 },
};

interface ResultView {
  comparison: StrengthComparison;
  liftLabel: string;
  value: number;
  estimatedLabel?: string;
  dots?: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Resultado de um lift (ou do total) a partir do que foi submetido. */
function buildView(input: ShareInput, lift: Lift): ResultView | null {
  const isMale = input.sex === 'm';
  const estimated = input.lifts.some((l) => l.reps > 1);

  if (lift === 'total') {
    if (input.lifts.length < LIFTS.length) return null;
    const total = round1(input.lifts.reduce((sum, l) => sum + calculateE1RM(l.kg, l.reps), 0));
    const comparison = compareTotal(isMale, input.bodyweight, total);
    if (!comparison) return null;
    return {
      comparison,
      liftLabel: LIFT_LABELS.total,
      value: total,
      estimatedLabel: estimated ? 'Total estimado' : undefined,
      dots: calculateDots(input.bodyweight, total, isMale),
    };
  }

  const entry = input.lifts.find((l) => l.lift === lift);
  if (!entry) return null;
  const value = calculateE1RM(entry.kg, entry.reps);
  const comparison = compareLift(isMale, input.bodyweight, lift, value);
  if (!comparison) return null;
  return {
    comparison,
    liftLabel: LIFT_LABELS[lift],
    value,
    estimatedLabel: entry.reps > 1 ? 'Máximo estimado' : undefined,
  };
}

interface StrengthCalculatorProps {
  /** `compacto`: um lift (hero). `completo`: três lifts + total (página). */
  mode?: 'compacto' | 'completo';
}

/**
 * Calculadora "Quão forte você é" (spec §6): compara o que a pessoa levanta com
 * quem competiu no Brasil (tabela do OpenPowerlifting via `@onyx/strength`).
 * O resultado não é ao vivo — sai no clique, porque a curva e o percentil só
 * fazem sentido com a entrada inteira.
 */
export default function StrengthCalculator({ mode = 'completo' }: StrengthCalculatorProps) {
  const complete = mode === 'completo';
  const [sex, setSex] = useState<Sex>('m');
  const [bodyweight, setBodyweight] = useState('');
  const [lifts, setLifts] = useState(EMPTY_LIFTS);
  const [activeLift, setActiveLift] = useState<SingleLift>('bench');
  const [submitted, setSubmitted] = useState<ShareInput | null>(null);
  const [tab, setTab] = useState<Lift>('bench');
  const [shareLabel, setShareLabel] = useState('Compartilhar');
  const animate = useMotionAllowed();
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Link compartilhado (§6.4): a página abre já com o resultado na tela. O
  // preenchimento acontece num frame depois da hidratação, e não no corpo do
  // efeito, porque o HTML estático é gerado sem query — escrever o estado
  // durante a hidratação daria mismatch (mesmo motivo do rAF em useCountUp).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const shared = parseShareQuery(window.location.search);
      if (!shared) return;
      setSex(shared.sex);
      setBodyweight(String(shared.bodyweight).replace('.', ','));
      const restored = { ...EMPTY_LIFTS };
      for (const entry of shared.lifts) {
        restored[entry.lift] = { kg: String(entry.kg).replace('.', ','), reps: entry.reps };
      }
      setLifts(restored);
      setActiveLift(shared.lifts[0].lift);
      setSubmitted(shared);
      setTab(shared.lifts.length === LIFTS.length ? 'total' : shared.lifts[shared.lifts.length - 1].lift);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const bw = parseDecimal(bodyweight);
  const filledLifts: ShareLift[] = (complete ? LIFTS : [activeLift])
    .map((lift) => ({ lift, kg: parseDecimal(lifts[lift].kg), reps: lifts[lift].reps }))
    .filter((entry) => entry.kg > 0);
  const valid = bw > 0 && filledLifts.length > 0;

  const view = useMemo(() => (submitted ? buildView(submitted, tab) : null), [submitted, tab]);

  const tabs: Lift[] = submitted
    ? [...submitted.lifts.map((l) => l.lift), ...(submitted.lifts.length === LIFTS.length ? (['total'] as Lift[]) : [])]
    : [];

  function handleSubmit() {
    if (!valid) return;
    const input: ShareInput = { sex, bodyweight: bw, lifts: filledLifts };
    const nextTab: Lift = input.lifts.length === LIFTS.length ? 'total' : input.lifts[input.lifts.length - 1].lift;
    const next = buildView(input, nextTab);
    setSubmitted(input);
    setTab(nextTab);
    trackEvent('forca-resultado', {
      lift: nextTab,
      nivel: next?.comparison.level ?? 'indisponivel',
      reps_gt_1: input.lifts.some((l) => l.reps > 1) ? 'sim' : 'nao',
      modo: mode,
    });
  }

  async function handleShare() {
    if (!submitted) return;
    const url = buildShareUrl(submitted);
    trackEvent('forca-compartilhar', { modo: mode });

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch && navigator.share) {
      try {
        await navigator.share({ title: 'Quão forte você é? — ONYX', url });
        return;
      } catch {
        // cancelado pelo usuário: cai no copiar
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Link copiado');
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setShareLabel('Compartilhar'), 2500);
    } catch {
      // sem permissão de área de transferência: o link continua na barra do navegador
    }
  }

  function setLift(lift: SingleLift, patch: Partial<{ kg: string; reps: number }>) {
    setLifts((prev) => ({ ...prev, [lift]: { ...prev[lift], ...patch } }));
  }

  const liftFields = (complete ? LIFTS : [activeLift]).map((lift) => (
    <div className="forca__lift" key={lift}>
      {complete && <span className="forca__lift-title">{LIFT_TITLES[lift]}</span>}
      <NumberField
        label={complete ? 'Carga (kg)' : 'Carga que você fez (kg)'}
        value={lifts[lift].kg}
        onChange={(value) => setLift(lift, { kg: value })}
        placeholder="110"
        accent
      />
      <div className="forca__reps-row">
        <span className="label">Quantas reps?</span>
        <SegmentedRadio
          ariaLabel={`Repetições — ${LIFT_TITLES[lift]}`}
          className="seg-radio--reps"
          value={String(lifts[lift].reps)}
          onChange={(value) => setLift(lift, { reps: Number(value) })}
          options={REP_CHOICES}
        />
      </div>
    </div>
  ));

  return (
    <div className="calc forca">
      <div className="calc__head">
        <span className="calc__title">Quão forte você é?</span>
        <SegmentedRadio ariaLabel="Sexo" value={sex} onChange={setSex} options={SEX_OPTIONS} />
      </div>

      <div className="calc__body">
        {!complete && (
          <SegmentedRadio
            ariaLabel="Levantamento"
            className="seg-radio--lifts"
            value={activeLift}
            onChange={setActiveLift}
            options={LIFT_OPTIONS}
          />
        )}

        <NumberField
          label="Peso corporal (kg)"
          value={bodyweight}
          onChange={setBodyweight}
          placeholder="82"
        />

        <div className={`forca__lifts${complete ? ' forca__lifts--3' : ''}`}>{liftFields}</div>

        <p className="calc__note">1 rep = seu máximo. Fez 5 com 110? Coloca assim, a gente estima o máximo.</p>

        <button type="button" className="btn btn--primary forca__submit" onClick={handleSubmit} disabled={!valid}>
          Ver meu resultado
        </button>

        {submitted && view && (
          <div className="forca__result">
            {tabs.length > 1 && (
              <SegmentedRadio
                ariaLabel="Resultado por levantamento"
                className="seg-radio--tabs"
                value={tab}
                onChange={(value) => setTab(value)}
                options={tabs.map((lift) => ({ value: lift, label: lift === 'total' ? 'Total' : LIFT_TITLES[lift] }))}
              />
            )}
            <StrengthResult
              comparison={view.comparison}
              liftLabel={view.liftLabel}
              value={view.value}
              estimatedLabel={view.estimatedLabel}
              dots={view.dots}
              animate={animate}
              signupUrl={buildSignupUrl(submitted)}
              onCta={() => trackEvent('forca-cta-app', { modo: mode, lift: tab })}
              shareLabel={shareLabel}
              onShare={handleShare}
              fullModeHref={complete ? undefined : buildFullModePath(submitted)}
              onAddLifts={() => trackEvent('forca-add-lift')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
