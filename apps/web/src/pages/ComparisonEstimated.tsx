import React from 'react';
import { TrendingUp, Scale, Target } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateDots, getStrengthComparison } from '../utils/powerlifting';

type Level = 'Iniciante' | 'Intermediario' | 'Avancado' | 'Elite';
type LiftKey = 'squat' | 'bench' | 'deadlift';

interface LiftBand {
  min: number;
  level: Level;
}

const LIFT_REFERENCE_MALE: Record<LiftKey, LiftBand[]> = {
  squat: [
    { min: 0, level: 'Iniciante' },
    { min: 1.5, level: 'Intermediario' },
    { min: 2.0, level: 'Avancado' },
    { min: 2.4, level: 'Elite' },
  ],
  bench: [
    { min: 0, level: 'Iniciante' },
    { min: 1.0, level: 'Intermediario' },
    { min: 1.4, level: 'Avancado' },
    { min: 1.8, level: 'Elite' },
  ],
  deadlift: [
    { min: 0, level: 'Iniciante' },
    { min: 1.8, level: 'Intermediario' },
    { min: 2.3, level: 'Avancado' },
    { min: 2.8, level: 'Elite' },
  ],
};

const LIFT_REFERENCE_FEMALE: Record<LiftKey, LiftBand[]> = {
  squat: [
    { min: 0, level: 'Iniciante' },
    { min: 1.2, level: 'Intermediario' },
    { min: 1.6, level: 'Avancado' },
    { min: 2.0, level: 'Elite' },
  ],
  bench: [
    { min: 0, level: 'Iniciante' },
    { min: 0.7, level: 'Intermediario' },
    { min: 1.0, level: 'Avancado' },
    { min: 1.3, level: 'Elite' },
  ],
  deadlift: [
    { min: 0, level: 'Iniciante' },
    { min: 1.4, level: 'Intermediario' },
    { min: 1.9, level: 'Avancado' },
    { min: 2.3, level: 'Elite' },
  ],
};

const LEVEL_ORDER: Record<Level, number> = {
  Iniciante: 0,
  Intermediario: 1,
  Avancado: 2,
  Elite: 3,
};

const levelLabel = (level: Level) => {
  if (level === 'Intermediario') return 'Intermediario';
  if (level === 'Avancado') return 'Avancado';
  return level;
};

const classifyLiftByMultiplier = (multiplier: number, isMale: boolean, key: LiftKey): Level => {
  const reference = isMale ? LIFT_REFERENCE_MALE : LIFT_REFERENCE_FEMALE;
  const bands = reference[key];
  const level = [...bands].reverse().find((b) => multiplier >= b.min)?.level;
  return level ?? 'Iniciante';
};

const progressPct = (currentDots: number, dotsToNext?: number) => {
  if (!(currentDots > 0) || dotsToNext === undefined) return 0;
  const target = currentDots + dotsToNext;
  if (!(target > 0)) return 0;
  const start = Math.max(0, target - 80);
  const span = Math.max(1, target - start);
  return Math.max(0, Math.min(100, Math.round(((currentDots - start) / span) * 100)));
};

const safeRound = (value: number, decimals = 1) => {
  const base = 10 ** decimals;
  return Math.round(value * base) / base;
};

const formatDelta = (value: number, unit: string) => {
  if (!(value > 0)) return 'Meta atingida';
  return `+${safeRound(value, 1)} ${unit}`;
};

export const ComparisonEstimated: React.FC = () => {
  const { state, getMaxE1RM, getBodyweightAt } = useWorkout();
  const { settings } = state;
  const isMale = settings.gender === 'male';
  const unit = settings.units;

  const squat = getMaxE1RM('Agachamento');
  const bench = getMaxE1RM('Supino Reto');
  const deadlift = getMaxE1RM('Levantamento Terra');
  const bodyweight = getBodyweightAt(new Date().toISOString());
  const total = squat + bench + deadlift;
  const dots = calculateDots(bodyweight, total, isMale);
  const comparison = getStrengthComparison(dots, bodyweight, isMale);

  const targetDots = comparison.dotsToNext !== undefined ? dots + comparison.dotsToNext : dots;
  const coeff = total > 0 ? dots / total : 0;
  const requiredTotal = coeff > 0 ? targetDots / coeff : total;
  const totalGap = Math.max(0, requiredTotal - total);

  const lifts = [
    { key: 'squat' as const, label: 'Agachamento', short: 'Agach.', value: squat },
    { key: 'bench' as const, label: 'Supino', short: 'Supino', value: bench },
    { key: 'deadlift' as const, label: 'Terra', short: 'Terra', value: deadlift },
  ];

  const positiveBase = lifts.reduce((acc, lift) => acc + (lift.value > 0 ? lift.value : 0), 0);
  const distributionBase = positiveBase > 0 ? positiveBase : 3;

  const liftProgress = lifts.map((lift) => {
    const share = (lift.value > 0 ? lift.value : 1) / distributionBase;
    const recommendedGap = totalGap * share;
    const targetLift = lift.value + recommendedGap;
    const currentMult = bodyweight > 0 ? lift.value / bodyweight : 0;
    const targetMult = bodyweight > 0 ? targetLift / bodyweight : 0;
    const currentLevel = classifyLiftByMultiplier(currentMult, isMale, lift.key);
    const targetLevel = classifyLiftByMultiplier(targetMult, isMale, lift.key);
    return {
      ...lift,
      currentMult,
      targetMult,
      currentLevel,
      targetLevel,
      recommendedGap,
      targetLift,
    };
  });

  const dataReady = bodyweight > 0 && total > 0 && dots > 0;
  const progress = progressPct(dots, comparison.dotsToNext);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>COMPARACAO ESTIMADA</h1>

      {!dataReady && (
        <div style={styles.emptyState}>
          <strong style={styles.emptyTitle}>Dados insuficientes para comparar</strong>
          <p style={styles.emptyText}>
            Registre seu peso corporal e finalize treinos com series de agachamento, supino e terra para liberar a analise completa.
          </p>
        </div>
      )}

      {dataReady && (
        <>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Visao geral</span>
              <span style={styles.cardClass}>{comparison.bodyweightClass}</span>
            </div>
            <div style={styles.rowMain}>
              <div style={styles.levelBlock}>
                <span style={styles.levelLabel}>{comparison.level}</span>
                <span style={styles.percentileText}>Top {comparison.topPercentApprox}% aproximado</span>
              </div>
              <div style={styles.dotsBlock}>
                <TrendingUp size={16} />
                <span style={styles.dotsValue}>{dots} DOTS</span>
              </div>
            </div>
            {comparison.nextLevel && comparison.dotsToNext !== undefined && (
              <>
                <div style={styles.nextText}>
                  Proximo nivel: <strong>{comparison.nextLevel}</strong> · faltam <strong>{comparison.dotsToNext}</strong> DOTS
                </div>
                <div style={styles.progressTrack} aria-label="Progresso para o proximo nivel">
                  <span style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              </>
            )}
            <p style={styles.note}>Base: DOTS/OpenPowerlifting (estimativa). Use como referencia de progresso, nao como resultado oficial de competicao.</p>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Por lift (forca relativa)</span>
              <span style={styles.inlineIcon}><Scale size={14} /> Peso corporal: {bodyweight} {unit}</span>
            </div>

            <div style={styles.liftGrid}>
              {liftProgress.map((lift) => {
                const improving = LEVEL_ORDER[lift.targetLevel] > LEVEL_ORDER[lift.currentLevel];
                return (
                  <article key={lift.key} style={styles.liftCard}>
                    <div style={styles.liftHead}>
                      <span style={styles.liftName}>{lift.short}</span>
                      <span style={styles.liftLevel}>{levelLabel(lift.currentLevel)}</span>
                    </div>
                    <div style={styles.liftMetricRow}>
                      <span style={styles.liftMetric}>{safeRound(lift.value, 1)} {unit}</span>
                      <span style={styles.liftMult}>{safeRound(lift.currentMult, 2)}x PC</span>
                    </div>
                    <div style={styles.liftGoal}>
                      Meta sugerida: <strong>{safeRound(lift.targetLift, 1)} {unit}</strong> ({formatDelta(lift.recommendedGap, unit)})
                    </div>
                    <div style={styles.liftGoalLevel}>
                      Projecao: {levelLabel(lift.targetLevel)} {improving ? 'com avancao de nivel' : 'com consolidacao do nivel atual'}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Plano para o proximo nivel</span>
              <span style={styles.inlineIcon}><Target size={14} /> Objetivo estimado</span>
            </div>
            <div style={styles.planRow}>
              <span style={styles.planLabel}>Total atual</span>
              <strong style={styles.planValue}>{safeRound(total, 1)} {unit}</strong>
            </div>
            <div style={styles.planRow}>
              <span style={styles.planLabel}>Total projetado para subir de nivel</span>
              <strong style={styles.planValue}>{safeRound(requiredTotal, 1)} {unit}</strong>
            </div>
            <div style={styles.planRow}>
              <span style={styles.planLabel}>Gap estimado total</span>
              <strong style={styles.planValue}>{formatDelta(totalGap, unit)}</strong>
            </div>
            <p style={styles.note}>Distribuicao do gap por lift foi feita de forma proporcional ao seu perfil atual para manter uma progressao equilibrada.</p>
          </section>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  emptyState: {
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
  },
  emptyTitle: {
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  emptyText: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  cardKicker: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    fontWeight: 800,
  },
  cardClass: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  rowMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  levelBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  levelLabel: {
    fontSize: '24px',
    lineHeight: 1,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  percentileText: {
    fontSize: '12px',
    color: 'var(--accent)',
    fontWeight: 700,
  },
  dotsBlock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
  },
  dotsValue: {
    fontWeight: 800,
    fontSize: '13px',
  },
  nextText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  progressFill: {
    display: 'block',
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent), #e6c27a)',
  },
  inlineIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  liftGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
  },
  liftCard: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  liftHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  liftName: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  liftLevel: {
    fontSize: '11px',
    color: 'var(--accent)',
    fontWeight: 700,
  },
  liftMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
  },
  liftMetric: {
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  liftMult: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  liftGoal: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  liftGoalLevel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  planRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '12px',
  },
  planLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  planValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  note: {
    margin: 0,
    fontSize: '11px',
    lineHeight: 1.45,
    color: 'var(--text-muted)',
  },
};

export default ComparisonEstimated;