import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { WorkoutSession } from '@powerlifting/shared';
import { calculateE1RM, calculateDots, calculateWilks } from '../utils/powerlifting';
import { Award, Calendar, TrendingUp, Zap, Clock, Eye, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state, getMaxE1RM } = useWorkout();
  const { history, settings } = state;

  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  // Compute best SBD lifts
  const bestSquatE1RM = getMaxE1RM('Agachamento');
  const bestBenchE1RM = getMaxE1RM('Supino Reto');
  const bestDeadliftE1RM = getMaxE1RM('Levantamento Terra');
  
  // Best weight lifted (raw absolute max weight)
  const getAbsoluteMaxWeight = (exerciseName: string): number => {
    let max = 0;
    const lowerName = exerciseName.toLowerCase();
    history.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (ex.name.toLowerCase() === lowerName) {
          ex.sets.forEach((set) => {
            if (set.completed && set.weight > max) max = set.weight;
          });
        }
      });
    });
    return max || (settings.units === 'kg' ? 60 : 135); // fallback
  };

  const bestSquatWeight = getAbsoluteMaxWeight('Agachamento');
  const bestBenchWeight = getAbsoluteMaxWeight('Supino Reto');
  const bestDeadliftWeight = getAbsoluteMaxWeight('Levantamento Terra');

  // Compute strength points based on best e1RM total
  const bestTotal = bestSquatE1RM + bestBenchE1RM + bestDeadliftE1RM;
  const bestDots = calculateDots(settings.bodyweight, bestTotal, settings.gender === 'male');
  const bestWilks = calculateWilks(settings.bodyweight, bestTotal, settings.gender === 'male');

  // Format date helper
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const calculateTonnage = (session: WorkoutSession) => {
    return session.exercises.reduce((totalEx, ex) => {
      return totalEx + ex.sets.reduce((totalSet, set) => {
        return totalSet + (set.completed ? (set.weight * set.reps) : 0);
      }, 0);
    }, 0);
  };

  return (
    <div style={styles.container}>
      {/* Welcome header */}
      <div style={styles.header}>
        <div>
          <span style={styles.appSubtitle}>ONYX POWERLIFTING</span>
          <h1 style={styles.appTitle}>FORÇA E CONSISTÊNCIA</h1>
        </div>
        <div style={styles.statusBadge}>
          <Zap size={14} fill="currentColor" />
          <span>{history.length} TREINOS</span>
        </div>
      </div>

      {/* SBD / PR Panel */}
      <div style={styles.prCard}>
        <div style={styles.prCardHeader}>
          <div style={styles.prTitleRow}>
            <Award size={18} />
            <span style={styles.prTitle}>RECORDES PESSOAIS (PR)</span>
          </div>
          <span style={styles.dotsPoints}>{bestDots} DOTS</span>
        </div>

        <div style={styles.prGrid}>
          <div style={styles.prCol}>
            <span style={styles.liftLabel}>AGACHAMENTO</span>
            <div style={styles.liftVal}>{bestSquatWeight} <span style={styles.unitSmall}>{settings.units}</span></div>
            <span style={styles.e1rmLabel}>e1RM: {bestSquatE1RM} {settings.units}</span>
          </div>
          <div style={{ ...styles.prCol, borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <span style={styles.liftLabel}>SUPINO RETO</span>
            <div style={styles.liftVal}>{bestBenchWeight} <span style={styles.unitSmall}>{settings.units}</span></div>
            <span style={styles.e1rmLabel}>e1RM: {bestBenchE1RM} {settings.units}</span>
          </div>
          <div style={styles.prCol}>
            <span style={styles.liftLabel}>TERRA</span>
            <div style={styles.liftVal}>{bestDeadliftWeight} <span style={styles.unitSmall}>{settings.units}</span></div>
            <span style={styles.e1rmLabel}>e1RM: {bestDeadliftE1RM} {settings.units}</span>
          </div>
        </div>

        <div style={styles.prFooter}>
          <span>Total Estimado: <strong>{bestTotal} {settings.units}</strong></span>
          <span>Wilks: <strong>{bestWilks} pts</strong></span>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={styles.statsGrid}>
        <div style={styles.statBox}>
          <Calendar size={16} />
          <div>
            <div style={styles.statLabel}>Frequência</div>
            <div style={styles.statVal}>{history.length > 0 ? `${Math.round((history.length / 30) * 10) / 10} / semana` : '0'}</div>
          </div>
        </div>
        <div style={styles.statBox}>
          <TrendingUp size={16} />
          <div>
            <div style={styles.statLabel}>Volume Médio</div>
            <div style={styles.statVal}>
              {history.length > 0 
                ? `${Math.round(history.reduce((acc, h) => acc + calculateTonnage(h), 0) / history.length)} ${settings.units}`
                : `0 ${settings.units}`
              }
            </div>
          </div>
        </div>
      </div>

      {/* History section */}
      <div style={styles.historySection}>
        <h2 style={styles.sectionTitle}>Histórico Recente</h2>
        
        {history.length === 0 ? (
          <div style={styles.emptyHistoryCard}>
            Nenhum treino registrado ainda. Inicie seu primeiro treino para visualizar o histórico aqui!
          </div>
        ) : (
          <div style={styles.historyList}>
            {history.slice(0, 5).map((session) => {
              const tonnage = calculateTonnage(session);
              const hasPr = session.exercises.some(ex => ex.sets.some(s => s.isPr));
              return (
                <div 
                  key={session.id} 
                  onClick={() => setSelectedSession(session)}
                  style={styles.historyCard}
                >
                  <div style={styles.historyHeader}>
                    <div>
                      <div style={styles.historyTitleRow}>
                        <span style={styles.historyName}>{session.name}</span>
                        {hasPr && <span style={styles.prRecordBadge}>PR</span>}
                      </div>
                      <span style={styles.historyDate}>{formatDate(session.date)}</span>
                    </div>
                    <Eye size={16} style={styles.eyeIcon} />
                  </div>

                  <div style={styles.historyStatsRow}>
                    <span style={styles.hStat}><Clock size={12} /> {formatDuration(session.duration)}</span>
                    <span style={styles.hStat}><TrendingUp size={12} /> {tonnage} {settings.units}</span>
                    <span style={styles.hStat}><Zap size={12} /> {session.exercises.length} Exs</span>
                  </div>

                  <div style={styles.historyExercisesPreview}>
                    {session.exercises.slice(0, 3).map((ex, idx) => (
                      <div key={idx} style={styles.previewExRow}>
                        <span style={styles.previewExName}>{ex.name}</span>
                        <span style={styles.previewExSets}>
                          {ex.sets.length} séries • Max {Math.max(...ex.sets.map(s => s.weight))} {settings.units}
                        </span>
                      </div>
                    ))}
                    {session.exercises.length > 3 && (
                      <div style={styles.previewExMore}>+ {session.exercises.length - 3} exercícios</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: WORKOUT SESSION DETAILS */}
      {selectedSession && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{selectedSession.name}</h3>
                <span style={styles.modalDate}>{new Date(selectedSession.date).toLocaleString('pt-BR')}</span>
              </div>
              <button onClick={() => setSelectedSession(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {selectedSession.notes && (
                <div style={styles.modalNotes}>
                  <strong>Notas:</strong> {selectedSession.notes}
                </div>
              )}

              <div style={styles.modalExercisesList}>
                {selectedSession.exercises.map((ex) => (
                  <div key={ex.id} style={styles.modalExBlock}>
                    <div style={styles.modalExName}>{ex.name}</div>
                    
                    <table style={styles.modalTable}>
                      <thead>
                        <tr>
                          <th style={styles.modalTh}>Série</th>
                          <th style={styles.modalTh}>Tipo</th>
                          <th style={styles.modalTh}>Peso</th>
                          <th style={styles.modalTh}>Reps</th>
                          <th style={styles.modalTh}>RPE</th>
                          <th style={styles.modalTh}>e1RM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((set, setIdx) => {
                          const e1rm = calculateE1RM(set.weight, set.reps, set.rpe);
                          return (
                            <tr key={set.id} style={styles.modalTr}>
                              <td style={styles.modalTdIndex}>{setIdx + 1}</td>
                              <td style={styles.modalTd}>{set.type}</td>
                              <td style={styles.modalTd}>
                                {set.weight} {settings.units}
                                {set.isPr && <span style={styles.modalPrBadge} title="Recorde Pessoal!">PR</span>}
                              </td>
                              <td style={styles.modalTd}>{set.reps}</td>
                              <td style={styles.modalTd}>{set.rpe || '-'}</td>
                              <td style={{ ...styles.modalTd, fontWeight: '700' }}>
                                {e1rm ? `${e1rm} ${settings.units}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  appSubtitle: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.15em',
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.02em',
    color: '#ffffff',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '800',
  },
  prCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    marginBottom: '16px',
  },
  prCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  prTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
  },
  prTitle: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  dotsPoints: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  prGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    margin: '12px 0',
    textAlign: 'center',
  },
  prCol: {
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 0',
  },
  liftLabel: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  liftVal: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
  },
  unitSmall: {
    fontSize: '11px',
    fontWeight: '400',
    color: 'var(--text-secondary)',
  },
  e1rmLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  prFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '10px',
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'var(--text-secondary)',
  },
  statLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
  },
  historySection: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    color: 'var(--text-secondary)',
  },
  emptyHistoryCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  historyTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  historyName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  prRecordBadge: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '8px',
    fontWeight: '800',
    padding: '1px 4px',
    borderRadius: '2px',
  },
  historyDate: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  eyeIcon: {
    color: 'var(--text-muted)',
  },
  historyStatsRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  hStat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  historyExercisesPreview: {
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  previewExRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  previewExName: {
    color: '#eaeaea',
    fontWeight: '500',
  },
  previewExSets: {
    color: 'var(--text-muted)',
  },
  previewExMore: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: '2px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: 'var(--bg-secondary)',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderTopRightRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    width: '100%',
    maxWidth: 'var(--max-width)',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
  },
  modalDate: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  closeBtn: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  modalBody: {
    overflowY: 'auto',
    flex: 1,
  },
  modalNotes: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '16px',
    color: '#eaeaea',
  },
  modalExercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalExBlock: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '12px',
  },
  modalExName: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '8px',
  },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  modalTh: {
    fontSize: '8px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    paddingBottom: '4px',
    textTransform: 'uppercase',
  },
  modalTr: {
    height: '28px',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
  },
  modalTdIndex: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  modalTd: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-primary)',
    padding: '2px',
  },
  modalPrBadge: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '8px',
    fontWeight: '800',
    padding: '0px 3px',
    borderRadius: '2px',
    marginLeft: '6px',
    verticalAlign: 'middle',
  },
};
export default Dashboard;
