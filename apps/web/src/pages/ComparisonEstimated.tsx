import React, { useState } from 'react';
import { TrendingUp, Scale, Trophy, Users, Info } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateDots, getStrengthComparison, type StrengthLevel } from '../utils/powerlifting';

type LiftKey = 'squat' | 'bench' | 'deadlift';

interface LiftBand {
  /** Múltiplo do peso corporal (ex.: 1.5 = 1.5x PC) a partir do qual este nível é atingido. */
  min: number;
  level: StrengthLevel;
}

// Bandas por levantamento, referência IPF (raw) — independentes da escala geral por DOTS.
// Cada levantamento tem sua própria progressão de níveis com base na relação peso levantado / peso corporal.
// Estimativa aproximada; hoje cobre apenas IPF (outras federações podem ser adicionadas depois).
const LIFT_REFERENCE_MALE_IPF: Record<LiftKey, LiftBand[]> = {
  squat: [
    { min: 0, level: 'Iniciante' },
    { min: 1.5, level: 'Intermediário' },
    { min: 2.0, level: 'Avançado' },
    { min: 2.4, level: 'Elite' },
  ],
  bench: [
    { min: 0, level: 'Iniciante' },
    { min: 1.0, level: 'Intermediário' },
    { min: 1.4, level: 'Avançado' },
    { min: 1.8, level: 'Elite' },
  ],
  deadlift: [
    { min: 0, level: 'Iniciante' },
    { min: 1.8, level: 'Intermediário' },
    { min: 2.3, level: 'Avançado' },
    { min: 2.8, level: 'Elite' },
  ],
};

const LIFT_REFERENCE_FEMALE_IPF: Record<LiftKey, LiftBand[]> = {
  squat: [
    { min: 0, level: 'Iniciante' },
    { min: 1.2, level: 'Intermediário' },
    { min: 1.6, level: 'Avançado' },
    { min: 2.0, level: 'Elite' },
  ],
  bench: [
    { min: 0, level: 'Iniciante' },
    { min: 0.7, level: 'Intermediário' },
    { min: 1.0, level: 'Avançado' },
    { min: 1.3, level: 'Elite' },
  ],
  deadlift: [
    { min: 0, level: 'Iniciante' },
    { min: 1.4, level: 'Intermediário' },
    { min: 1.9, level: 'Avançado' },
    { min: 2.3, level: 'Elite' },
  ],
};

/** Ângulo (graus, sentido horário a partir do topo) de cada levantamento no radar. */
const RADAR_AXES: Record<LiftKey, number> = { squat: -90, bench: 30, deadlift: 150 };
const RADAR_R = 64;
const RADAR_LABEL_R = 82;
const RADAR_CENTER = 100;

const radarPoint = (angleDeg: number, fraction: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const r = RADAR_R * fraction;
  return { x: RADAR_CENTER + r * Math.cos(rad), y: RADAR_CENTER + r * Math.sin(rad) };
};

const radarLabelPoint = (angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: RADAR_CENTER + RADAR_LABEL_R * Math.cos(rad), y: RADAR_CENTER + RADAR_LABEL_R * Math.sin(rad) };
};

/** Encontra o nível atual (banda mais alta atingida) e a próxima banda (se houver) para um multiplicador. */
const findLiftBandProgress = (multiplier: number, bands: LiftBand[]) => {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  let currentIdx = 0;
  sorted.forEach((band, idx) => {
    if (multiplier >= band.min) currentIdx = idx;
  });
  return {
    currentLevel: sorted[currentIdx].level,
    nextBand: sorted[currentIdx + 1],
  };
};

// Progresso real dentro da faixa atual: do limite inferior do nível atual até o limite
// do próximo nível (não uma janela fixa), para refletir corretamente faixas de larguras diferentes.
const progressPct = (currentDots: number, currentLevelMinDots?: number, dotsToNext?: number) => {
  if (!(currentDots > 0) || dotsToNext === undefined || currentLevelMinDots === undefined) return 0;
  const target = currentDots + dotsToNext;
  const span = Math.max(1, target - currentLevelMinDots);
  return Math.max(0, Math.min(100, Math.round(((currentDots - currentLevelMinDots) / span) * 100)));
};

const safeRound = (value: number, decimals = 1) => {
  const base = 10 ** decimals;
  return Math.round(value * base) / base;
};

const formatDelta = (value: number, unit: string) => {
  if (!(value > 0)) return 'meta atingida';
  return `+${safeRound(value, 1)} ${unit}`;
};

export const ComparisonEstimated: React.FC = () => {
  const { state, getMaxE1RM, getBodyweightAt } = useWorkout();
  const { settings } = state;
  const isMale = settings.gender === 'male';
  const unit = settings.units;
  const liftReference = isMale ? LIFT_REFERENCE_MALE_IPF : LIFT_REFERENCE_FEMALE_IPF;
  const [overviewInfoOpen, setOverviewInfoOpen] = useState(false);
  const [radarInfoOpen, setRadarInfoOpen] = useState(false);

  const squat = getMaxE1RM('Agachamento');
  const bench = getMaxE1RM('Supino Reto');
  const deadlift = getMaxE1RM('Levantamento Terra');
  const bodyweight = getBodyweightAt(new Date().toISOString());
  const total = squat + bench + deadlift;
  const dots = calculateDots(bodyweight, total, isMale);
  const comparison = getStrengthComparison(dots, bodyweight, isMale);

  // Estimativa do total (SBD) necessário para o próximo nível geral — número único e
  // limitado (não é redistribuído entre os levantamentos, evitando metas irreais por lift).
  const targetDots = comparison.dotsToNext !== undefined ? dots + comparison.dotsToNext : dots;
  const coeff = total > 0 ? dots / total : 0;
  const requiredTotal = coeff > 0 ? targetDots / coeff : total;
  const totalGap = Math.max(0, requiredTotal - total);

  const lifts: { key: LiftKey; short: string; value: number }[] = [
    { key: 'squat', short: 'Agach.', value: squat },
    { key: 'bench', short: 'Supino', value: bench },
    { key: 'deadlift', short: 'Terra', value: deadlift },
  ];

  // Meta por levantamento é independente: cada lift mira apenas a PRÓPRIA próxima
  // banda (nunca herda o gap de outro lift, nunca pula mais de um nível de uma vez).
  const liftProgress = lifts.map((lift) => {
    const currentMult = bodyweight > 0 ? lift.value / bodyweight : 0;
    const bands = liftReference[lift.key];
    const { currentLevel, nextBand } = findLiftBandProgress(currentMult, bands);
    const eliteMin = bands[bands.length - 1].min;
    const radarFraction = eliteMin > 0 ? Math.min(1.15, currentMult / eliteMin) : 0;
    const targetLift = nextBand ? nextBand.min * bodyweight : lift.value;
    const gap = nextBand ? Math.max(0, targetLift - lift.value) : 0;
    return {
      ...lift,
      currentMult,
      currentLevel,
      nextLevel: nextBand?.level,
      targetLift,
      gap,
      radarFraction,
      angle: RADAR_AXES[lift.key],
    };
  });

  const dataReady = bodyweight > 0 && total > 0 && dots > 0;
  const progress = progressPct(dots, comparison.currentLevelMinDots, comparison.dotsToNext);
  const radarRings = [0.25, 0.5, 0.75, 1];

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>COMPARAÇÃO ESTIMADA</h1>

      {!dataReady && (
        <div style={styles.emptyState}>
          <strong style={styles.emptyTitle}>Dados insuficientes para comparar</strong>
          <p style={styles.emptyText}>
            Registre seu peso corporal e finalize treinos com séries de agachamento, supino e terra para liberar a análise completa.
          </p>
        </div>
      )}

      {dataReady && (
        <>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Visão geral</span>
              <div style={styles.cardHeaderRight}>
                <span style={styles.cardClass}>{comparison.bodyweightClass}</span>
                <button
                  type="button"
                  onClick={() => setOverviewInfoOpen((x) => !x)}
                  style={styles.infoBtn}
                  aria-label={overviewInfoOpen ? 'Ocultar explicação da visão geral' : 'Mostrar explicação da visão geral'}
                  aria-expanded={overviewInfoOpen}
                  title="Entenda esta seção"
                >
                  <Info size={12} />
                </button>
              </div>
            </div>
            {overviewInfoOpen && (
              <div style={styles.infoPanel}>
                O nível geral usa o coeficiente DOTS, que compara sua força total (agachamento + supino + terra) ajustada ao seu peso corporal — quanto maior o DOTS, mais forte você é em relação ao seu peso.
                O percentil ("Top X%") é uma estimativa aproximada de onde você estaria entre atletas raw da sua categoria, com base em uma referência estática inspirada nos rankings do OpenPowerlifting — não é um dado oficial de competição, apenas uma referência de progresso.
              </div>
            )}

            <div style={styles.rowMain}>
              <span style={styles.levelBadge}>
                <Trophy size={14} />
                {comparison.level}
              </span>
              <div style={styles.dotsBlock}>
                <TrendingUp size={16} />
                <span style={styles.dotsValue}>{dots} DOTS</span>
              </div>
            </div>

            <div style={styles.heroPercentBlock}>
              <Users size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={styles.heroPercentValue}>Top {comparison.topPercentApprox}%</div>
                <div style={styles.heroPercentCaption}>aproximado entre atletas da sua categoria ({comparison.bodyweightClass})</div>
              </div>
            </div>

            {comparison.nextLevel && comparison.dotsToNext !== undefined && (
              <>
                <div style={styles.nextText}>
                  Próximo nível: <strong>{comparison.nextLevel}</strong> · faltam <strong>{comparison.dotsToNext}</strong> DOTS
                  {totalGap > 0 && <> (~{safeRound(totalGap, 1)} {unit} no total)</>}
                </div>
                <div style={styles.progressTrack} aria-label="Progresso para o próximo nível">
                  <span style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              </>
            )}
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Perfil de força (SBD) · ref. IPF</span>
              <div style={styles.cardHeaderRight}>
                <span style={styles.inlineIcon}><Scale size={14} /> {bodyweight} {unit}</span>
                <button
                  type="button"
                  onClick={() => setRadarInfoOpen((x) => !x)}
                  style={styles.infoBtn}
                  aria-label={radarInfoOpen ? 'Ocultar explicação do perfil de força' : 'Mostrar explicação do perfil de força'}
                  aria-expanded={radarInfoOpen}
                  title="Entenda esta seção"
                >
                  <Info size={12} />
                </button>
              </div>
            </div>
            {radarInfoOpen && (
              <div style={styles.infoPanel}>
                Este radar mostra a relação entre o peso levantado e o seu peso corporal em cada levantamento (agachamento, supino e terra), usando uma referência aproximada baseada em padrões da IPF (raw).
                Essa escala é independente do nível geral acima (que usa DOTS) — por isso os dois podem mostrar níveis diferentes ao mesmo tempo, já que medem coisas ligeiramente distintas.
              </div>
            )}

            <svg viewBox="0 0 200 200" style={styles.radarSvg} role="img" aria-label="Radar de força relativa por levantamento">
              {radarRings.map((ring) => (
                <circle key={ring} cx={RADAR_CENTER} cy={RADAR_CENTER} r={RADAR_R * ring} fill="none" stroke="var(--border-color)" strokeWidth={1} />
              ))}
              {liftProgress.map((lift) => {
                const end = radarPoint(lift.angle, 1);
                return <line key={lift.key} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={end.x} y2={end.y} stroke="var(--border-color)" strokeWidth={1} />;
              })}
              <polygon
                points={liftProgress.map((lift) => { const p = radarPoint(lift.angle, lift.radarFraction); return `${p.x},${p.y}`; }).join(' ')}
                fill="var(--accent-soft)"
                stroke="var(--accent)"
                strokeWidth={2}
              />
              {liftProgress.map((lift) => {
                const p = radarPoint(lift.angle, lift.radarFraction);
                return <circle key={lift.key} cx={p.x} cy={p.y} r={3.5} fill="var(--accent)" />;
              })}
              {liftProgress.map((lift) => {
                const p = radarLabelPoint(lift.angle);
                return (
                  <text key={lift.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={700} fill="var(--text-secondary)">
                    {lift.short}
                  </text>
                );
              })}
            </svg>

            <div style={styles.liftGrid}>
              {liftProgress.map((lift) => (
                <article key={lift.key} style={styles.liftCard}>
                  <div style={styles.liftHead}>
                    <span style={styles.liftName}>{lift.short}</span>
                    <span style={styles.liftLevel}>{lift.currentLevel}</span>
                  </div>
                  <div style={styles.liftMetricRow}>
                    <span style={styles.liftMetric}>{safeRound(lift.value, 1)} {unit}</span>
                    <span style={styles.liftMult}>{safeRound(lift.currentMult, 2)}x PC</span>
                  </div>
                  {lift.nextLevel ? (
                    <div style={styles.liftGoal}>
                      Próximo nível ({lift.nextLevel}): <strong>{safeRound(lift.targetLift, 1)} {unit}</strong> ({formatDelta(lift.gap, unit)})
                    </div>
                  ) : (
                    <div style={styles.liftGoalMax}>
                      <Trophy size={12} /> Nível máximo desta escala atingido
                    </div>
                  )}
                </article>
              ))}
            </div>
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
  cardHeaderRight: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '999px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  infoPanel: {
    fontSize: '11px',
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
  },
  rowMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  levelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    fontSize: '15px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
  },
  heroPercentBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
  },
  heroPercentValue: {
    fontSize: '26px',
    lineHeight: 1,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  heroPercentCaption: {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
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
  radarSvg: {
    width: '100%',
    maxWidth: '220px',
    margin: '0 auto',
    display: 'block',
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
  liftGoalMax: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--accent)',
  },
};

export default ComparisonEstimated;