import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateE1RM } from '../utils/powerlifting';
import type { SetState } from '../types/workout';
import { TrendingUp, BarChart2, Award } from 'lucide-react';

interface ChartDataPoint {
  date: Date;
  weight: number;
  reps: number;
  rpe?: number;
  e1rm: number;
  formattedDate: string;
}

export const Analytics: React.FC = () => {
  const { state } = useWorkout();
  const { history, settings } = state;

  const [activeLift, setActiveLift] = useState<'Squat' | 'Bench' | 'Deadlift'>('Squat');

  const getLiftDisplayName = (lift: string) => {
    switch (lift) {
      case 'Squat': return 'Agachamento';
      case 'Bench': return 'Supino Reto';
      case 'Deadlift': return 'Levantamento Terra';
      default: return '';
    }
  };

  const getLiftMatches = (lift: string) => {
    const name = getLiftDisplayName(lift).toLowerCase();
    switch (lift) {
      case 'Squat': return [name, 'squat', 'agachamento'];
      case 'Bench': return [name, 'bench', 'supino'];
      case 'Deadlift': return [name, 'deadlift', 'terra', 'levantamento terra'];
      default: return [];
    }
  };

  // Extract e1RM history for active lift
  const getLiftHistoryData = (): ChartDataPoint[] => {
    const matches = getLiftMatches(activeLift);
    const dataPoints: ChartDataPoint[] = [];

    // Loop chronologically (history is saved newest first, so we reverse it)
    const chronoHistory = [...history].reverse();

    chronoHistory.forEach((session) => {
      session.exercises.forEach((ex) => {
        const isMatch = matches.some(m => ex.name.toLowerCase().includes(m));
        if (isMatch) {
          // Find max e1rm in this workout for this exercise
          let maxE1RMInSession = 0;
          let bestSet: SetState | null = null;

          for (const set of ex.sets) {
            if (set.completed) {
              const e1rm = calculateE1RM(set.weight, set.reps, set.rpe);
              if (e1rm > maxE1RMInSession) {
                maxE1RMInSession = e1rm;
                bestSet = set;
              }
            }
          }

          if (maxE1RMInSession > 0 && bestSet) {
            dataPoints.push({
              date: new Date(session.date),
              weight: bestSet.weight,
              reps: bestSet.reps,
              rpe: bestSet.rpe,
              e1rm: maxE1RMInSession,
              formattedDate: new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            });
          }
        }
      });
    });

    return dataPoints;
  };

  const data = getLiftHistoryData();

  // Custom SVG Line Chart Renderer
  const renderLineChart = () => {
    if (data.length === 0) {
      return (
        <div style={styles.chartEmpty}>
          Nenhum dado registrado para {getLiftDisplayName(activeLift)}.<br />
          Complete um treino salvando cargas para gerar o gráfico de evolução.
        </div>
      );
    }

    const width = 360;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min and max e1rm
    const e1rmValues = data.map(d => d.e1rm);
    const maxVal = Math.max(...e1rmValues) * 1.05; // 5% padding top
    const minVal = Math.min(...e1rmValues) * 0.95; // 5% padding bottom
    const valRange = maxVal - minVal || 10;

    // Map points to SVG coordinates
    const points = data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((d.e1rm - minVal) / valRange) * chartHeight;
      return { x, y, data: d };
    });

    // Create polyline path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Y Axis labels (3 values)
    const yGridValues = [
      minVal,
      minVal + valRange / 2,
      maxVal
    ];

    return (
      <div style={styles.chartContainer}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
          {/* Grid lines */}
          {yGridValues.map((val, idx) => {
            const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#222222"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="var(--text-secondary)"
                  fontSize="10"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Draw chart line */}
          {data.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Draw dots and tooltips */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#ffffff"
                stroke="#050505"
                strokeWidth="1.5"
              />
              {/* Highlight value label directly on top of dot */}
              <text
                x={p.x}
                y={p.y - 8}
                fill="#ffffff"
                fontSize="8"
                fontWeight="700"
                textAnchor="middle"
              >
                {Math.round(p.data.e1rm)}
              </text>
              
              {/* Date label on X axis (for first, middle and last points to avoid clutter) */}
              {(idx === 0 || idx === data.length - 1 || (data.length > 2 && idx === Math.floor(data.length / 2))) && (
                <text
                  x={p.x}
                  y={height - 8}
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.data.formattedDate}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Calculate some analytics summaries
  const totalTonnageHistory = history.map(session => {
    return session.exercises.reduce((totalEx, ex) => {
      return totalEx + ex.sets.reduce((totalSet, set) => {
        return totalSet + (set.completed ? (set.weight * set.reps) : 0);
      }, 0);
    }, 0);
  });

  const avgWeeklyTonnage = totalTonnageHistory.length > 0
    ? Math.round(totalTonnageHistory.reduce((a, b) => a + b, 0) / totalTonnageHistory.length)
    : 0;

  // Extract PRs list
  const prsList: { exercise: string; weight: number; reps: number; e1rm: number; date: string }[] = [];
  history.forEach(session => {
    session.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && set.isPr) {
          prsList.push({
            exercise: ex.name,
            weight: set.weight,
            reps: set.reps,
            e1rm: calculateE1RM(set.weight, set.reps, set.rpe),
            date: new Date(session.date).toLocaleDateString('pt-BR')
          });
        }
      });
    });
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>ANÁLISES</h1>

      {/* Lift Selector Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveLift('Squat')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeLift === 'Squat' ? '#ffffff' : '#121212',
            color: activeLift === 'Squat' ? '#000000' : '#8a8a8f',
          }}
        >
          Agachamento
        </button>
        <button
          onClick={() => setActiveLift('Bench')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeLift === 'Bench' ? '#ffffff' : '#121212',
            color: activeLift === 'Bench' ? '#000000' : '#8a8a8f',
          }}
        >
          Supino
        </button>
        <button
          onClick={() => setActiveLift('Deadlift')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeLift === 'Deadlift' ? '#ffffff' : '#121212',
            color: activeLift === 'Deadlift' ? '#000000' : '#8a8a8f',
          }}
        >
          Terra
        </button>
      </div>

      {/* SVG Chart Card */}
      <div style={styles.sectionCard}>
        <h2 style={styles.cardTitle}>Evolução de e1RM ({settings.units.toUpperCase()})</h2>
        <div style={styles.chartWrapper}>
          {renderLineChart()}
        </div>
      </div>

      {/* Volume Summary Card */}
      <div style={styles.gridTwoCols}>
        <div style={styles.statMiniCard}>
          <BarChart2 size={18} />
          <div>
            <div style={styles.miniLabel}>Média por Treino</div>
            <div style={styles.miniValue}>{avgWeeklyTonnage} {settings.units}</div>
            <span style={styles.miniSub}>Tonelagem média</span>
          </div>
        </div>
        <div style={styles.statMiniCard}>
          <TrendingUp size={18} />
          <div>
            <div style={styles.miniLabel}>Ponto de Força</div>
            <div style={styles.miniValue}>
              {data.length > 0 ? `${Math.round(data[data.length - 1].e1rm)} ${settings.units}` : '-'}
            </div>
            <span style={styles.miniSub}>Último e1RM de {getLiftDisplayName(activeLift)}</span>
          </div>
        </div>
      </div>

      {/* PRs Achieved History */}
      <div style={styles.sectionCard}>
        <div style={styles.cardHeaderWithIcon}>
          <Award size={16} />
          <h2 style={styles.cardTitleNoMargin}>Recordes Conquistados</h2>
        </div>
        
        {prsList.length === 0 ? (
          <div style={styles.emptyPrText}>
            Nenhum recorde pessoal (PR) registrado nas últimas sessões. Continue progredindo nas séries de trabalho!
          </div>
        ) : (
          <div style={styles.prList}>
            {prsList.slice(0, 5).map((pr, idx) => (
              <div key={idx} style={styles.prRow}>
                <div>
                  <span style={styles.prExName}>{pr.exercise}</span>
                  <span style={styles.prDetails}>
                    {pr.reps} reps @ {pr.weight} {settings.units}
                  </span>
                </div>
                <div style={styles.prRight}>
                  <div style={styles.prE1rm}>e1RM: {pr.e1rm} {settings.units}</div>
                  <span style={styles.prDate}>{pr.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  tabContainer: {
    display: 'flex',
    gap: '6px',
    marginBottom: '16px',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid var(--border-color)',
    transition: 'all var(--transition-fast)',
  },
  sectionCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    color: 'var(--text-secondary)',
  },
  cardTitleNoMargin: {
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  },
  cardHeaderWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  chartWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  chartContainer: {
    width: '100%',
    maxWidth: '360px',
  },
  svg: {
    overflow: 'visible',
  },
  chartEmpty: {
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
    padding: '12px',
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  statMiniCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    color: 'var(--text-secondary)',
  },
  miniLabel: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  miniValue: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '2px 0',
  },
  miniSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  emptyPrText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    textAlign: 'center',
    padding: '16px 0',
  },
  prList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  prRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '8px',
  },
  prExName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'block',
  },
  prDetails: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  prRight: {
    textAlign: 'right',
  },
  prE1rm: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
  },
  prDate: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
};
export default Analytics;
