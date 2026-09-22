import React, { useState } from 'react';
import { TrendingUp, Scale, Trophy, Users, Info } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateDots } from '../utils/powerlifting';
import { compareLift, compareTotal, type SingleLift } from '../utils/strength';

type LiftKey = SingleLift;

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

// Progresso real dentro do nível atual: do kg de entrada do nível até o kg do próximo.
const progressPct = (value: number, levelMinKg: number, nextKg?: number) => {
  if (!(value > 0) || nextKg === undefined) return 0;
  const span = Math.max(1, nextKg - levelMinKg);
  return Math.max(0, Math.min(100, Math.round(((value - levelMinKg) / span) * 100)));
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
  const [overviewInfoOpen, setOverviewInfoOpen] = useState(false);
  const [radarInfoOpen, setRadarInfoOpen] = useState(false);

  const squat = getMaxE1RM('Agachamento');
  const bench = getMaxE1RM('Supino Reto');
  const deadlift = getMaxE1RM('Levantamento Terra');
  const bodyweight = getBodyweightAt(new Date().toISOString());
  const total = squat + bench + deadlift;
  const dots = calculateDots(bodyweight, total, isMale);
  const comparison = compareTotal(isMale, bodyweight, total);

  const lifts: { key: LiftKey; short: string; value: number }[] = [
    { key: 'squat', short: 'Agach.', value: squat },
    { key: 'bench', short: 'Supino', value: bench },
    { key: 'deadlift', short: 'Terra', value: deadlift },
  ];

  // Cada lift mira só a PRÓPRIA próxima faixa da categoria; o radar mede a
  // fração do kg de entrada de "Elite nacional" (P85 da faixa).
  const liftProgress = lifts.map((lift) => {
    const r = compareLift(isMale, bodyweight, lift.key, lift.value);
    const currentMult = bodyweight > 0 ? lift.value / bodyweight : 0;
    const eliteKg = r?.thresholdsKg[r.thresholdsKg.length - 1] ?? 0;
    return {
      ...lift,
      currentMult,
      currentLevel: r?.level,
      nextLevel: r?.nextLevel,
      targetLift: r?.nextKg ?? lift.value,
      gap: r?.kgToNext ?? 0,
      radarFraction: eliteKg > 0 ? Math.min(1.15, lift.value / eliteKg) : 0,
      angle: RADAR_AXES[lift.key],
    };
  });

  const dataReady = bodyweight > 0 && total > 0 && dots > 0 && comparison !== null;
  const progress = comparison ? progressPct(total, comparison.levelMinKg, comparison.nextKg) : 0;
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

      {dataReady && comparison && (
        <>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Visão geral</span>
              <div style={styles.cardHeaderRight}>
                <span style={styles.cardClass}>{comparison.classLabel}</span>
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
                O nível geral compara o seu total (agachamento + supino + terra) com o melhor total de cada atleta raw da sua categoria que competiu no Brasil nos últimos 10 anos, segundo o OpenPowerlifting.
                A escada tem quatro degraus: Estreante, Competitivo, Pódio regional e Elite nacional. O DOTS ao lado é só o seu total ajustado ao peso corporal.
                {comparison.merged && ' Categorias vizinhas foram agrupadas por haver poucos atletas na sua.'}
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
                <div style={styles.heroPercentValue}>Acima de {comparison.percentile}%</div>
                <div style={styles.heroPercentCaption}>dos {comparison.n} atletas da sua categoria ({comparison.classLabel}) que competiram no Brasil</div>
              </div>
            </div>

            {comparison.nextLevel && comparison.kgToNext !== undefined && (
              <>
                <div style={styles.nextText}>
                  Próximo nível: <strong>{comparison.nextLevel}</strong> a partir de <strong>{safeRound(comparison.nextKg ?? 0, 1)} {unit}</strong> de total · faltam {safeRound(comparison.kgToNext, 1)} {unit}
                </div>
                <div style={styles.progressTrack} aria-label="Progresso para o próximo nível">
                  <span style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              </>
            )}
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardKicker}>Perfil de força (SBD) · quem competiu no Brasil</span>
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
                Cada eixo compara o seu máximo estimado naquele levantamento com quem competiu raw na sua categoria no Brasil (OpenPowerlifting, últimos 10 anos); o contorno cheio marca o kg de entrada de Elite nacional.
                Cada levantamento tem a própria escada — por isso o nível de um lift pode ser diferente do nível geral pelo total.
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
                    <span style={styles.liftLevel}>{lift.currentLevel ?? '—'}</span>
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
                      <Trophy size={12} /> {lift.currentLevel ? 'Elite nacional nesta categoria' : 'Sem dados para comparar'}
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
    // Tom mais claro do accent via color-mix (o hex fixo #e6c27a era do tema brass e
    // quebrava onyx/volt).
    background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 72%, var(--text-primary)))',
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