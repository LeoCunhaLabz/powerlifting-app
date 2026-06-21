import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Dumbbell, Trash2, Check, Clock, Play, AlertTriangle, Scale } from 'lucide-react';
import PlateVisualizer from '../components/PlateVisualizer';

export const Workout: React.FC = () => {
  const {
    activeWorkout,
    startWorkout,
    cancelWorkout,
    completeActiveWorkout,
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
    addSetToExercise,
    removeSetFromExercise,
    updateSet,
    updateWorkoutNotes,
    state,
    getMaxE1RM
  } = useWorkout();

  const { settings } = state;

  // Local state for exercise search modal
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for Integrated Plate Calculator Modal
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [plateCalcTarget, setPlateCalcTarget] = useState({ exIdx: 0, setIdx: 0 });

  // Local state for Cancel Confirmation Modal
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Time elapsed state
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!activeWorkout) return;

    const interval = setInterval(() => {
      const start = new Date(activeWorkout.date).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      
      const formatted = hrs > 0 
        ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      setElapsedTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIconBox}>
          <Dumbbell size={48} color="var(--text-secondary)" />
        </div>
        <h2 style={styles.emptyTitle}>NENHUM TREINO ATIVO</h2>
        <p style={styles.emptyDesc}>
          Inicie um treino avulso para registrar na hora ou vá na aba <strong>Rotinas</strong> para carregar um template pré-definido.
        </p>
        <button onClick={() => startWorkout()} style={styles.startEmptyBtn}>
          <Play size={16} fill="currentColor" /> Iniciar Treino Avulso
        </button>
      </div>
    );
  }

  const handleOpenPlateCalc = (exIdx: number, setIdx: number, currentWeight: number) => {
    setPlateCalcWeight(currentWeight || 60);
    setPlateCalcTarget({ exIdx, setIdx });
  };

  const handleApplyPlateWeight = () => {
    if (plateCalcWeight !== null) {
      updateSet(plateCalcTarget.exIdx, plateCalcTarget.setIdx, { weight: plateCalcWeight });
      setPlateCalcWeight(null);
    }
  };

  const handleAddExercise = (name: string) => {
    addExerciseToActiveWorkout(name);
    setSearchQuery('');
    setShowAddExModal(false);
  };

  const EXERCISE_OPTIONS = [
    'Agachamento',
    'Supino Reto',
    'Levantamento Terra',
    'Desenvolvimento Militar',
    'Remada Curvada',
    'Barra Fixa',
    'Agachamento Frontal',
    'Supino Inclinado',
    'Terra Romeno',
    'Elevação Lateral',
    'Tríceps Testa',
    'Rosca Direta'
  ];

  return (
    <div style={styles.container}>
      {/* Workout Info Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.workoutTitle}>{activeWorkout.name}</h1>
          <div style={styles.timeBadge}>
            <Clock size={12} />
            <span>{elapsedTime}</span>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowConfirmCancel(true)} style={styles.cancelBtn}>
            Descartar
          </button>
          <button onClick={completeActiveWorkout} style={styles.completeBtn}>
            Finalizar
          </button>
        </div>
      </div>

      {/* Workout Notes */}
      <textarea
        placeholder="Notas do treino (clima, humor, dores...)"
        value={activeWorkout.notes || ''}
        onChange={(e) => updateWorkoutNotes(e.target.value)}
        style={styles.notesTextarea}
      />

      {/* Exercises list */}
      <div style={styles.exercisesList}>
        {activeWorkout.exercises.map((ex, exIdx) => {
          const maxE1RM = getMaxE1RM(ex.name);
          return (
            <div key={ex.id} style={styles.exCard}>
              <div style={styles.exCardHeader}>
                <div>
                  <span style={styles.exName}>{ex.name}</span>
                  <span style={styles.e1rmIndicator}>e1RM atual: {maxE1RM} {settings.units}</span>
                </div>
                <button onClick={() => removeExerciseFromActiveWorkout(exIdx)} style={styles.removeExBtn}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Sets Table */}
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thCol}>SÉRIE</th>
                    <th style={styles.thCol}>TIPO</th>
                    <th style={styles.thCol}>PESO ({settings.units})</th>
                    <th style={styles.thCol}>REPS</th>
                    <th style={styles.thCol}>RPE</th>
                    <th style={{ ...styles.thCol, width: '40px' }}>✓</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((set, setIdx) => {
                    return (
                      <tr
                        key={set.id}
                        style={{
                          ...styles.tr,
                          backgroundColor: set.completed ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                        }}
                      >
                        <td style={styles.tdIndex}>
                          {setIdx + 1}
                          {set.percentage && (
                            <span style={styles.pctLabel}>{set.percentage}%</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <select
                            value={set.type}
                            disabled={set.completed}
                            onChange={(e) => updateSet(exIdx, setIdx, { type: e.target.value as 'W' | 'N' | 'D' })}
                            style={styles.selectType}
                          >
                            <option value="N">N</option>
                            <option value="W">W</option>
                            <option value="D">D</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.weightCell}>
                            <input
                              type="number"
                              value={set.weight || ''}
                              disabled={set.completed}
                              onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                              style={styles.weightInput}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleOpenPlateCalc(exIdx, setIdx, set.weight)}
                              style={styles.plateCalcBtn}
                              title="Calculadora de Anilhas"
                            >
                              <Scale size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            value={set.reps || ''}
                            disabled={set.completed}
                            onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                            style={styles.repsInput}
                            placeholder="0"
                          />
                        </td>
                        <td style={styles.td}>
                          <select
                            value={set.rpe || ''}
                            disabled={set.completed}
                            onChange={(e) => updateSet(exIdx, setIdx, { rpe: e.target.value ? Number(e.target.value) : undefined })}
                            style={styles.selectRpe}
                          >
                            <option value="">-</option>
                            <option value="10">10</option>
                            <option value="9.5">9.5</option>
                            <option value="9">9</option>
                            <option value="8.5">8.5</option>
                            <option value="8">8</option>
                            <option value="7.5">7.5</option>
                            <option value="7">7</option>
                            <option value="6.5">6.5</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                            style={{
                              ...styles.checkBtn,
                              backgroundColor: set.completed ? 'var(--accent-white)' : 'transparent',
                              borderColor: set.completed ? 'var(--accent-white)' : 'var(--border-color)',
                              color: set.completed ? 'var(--bg-primary)' : 'transparent',
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={styles.exCardActions}>
                <button onClick={() => addSetToExercise(exIdx)} style={styles.addSetBtn}>
                  + Adicionar Série
                </button>
                <button
                  onClick={() => removeSetFromExercise(exIdx, ex.sets.length - 1)}
                  disabled={ex.sets.length <= 1}
                  style={styles.removeSetBtn}
                >
                  Remover Série
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise Trigger Button */}
      <button onClick={() => setShowAddExModal(true)} style={styles.addExBtn}>
        + Adicionar Exercício
      </button>

      {/* MODAL: ADD EXERCISE */}
      {showAddExModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>ADICIONAR EXERCÍCIO</h3>
              <button onClick={() => setShowAddExModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar ou digitar exercício..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.modalSearch}
              autoFocus
            />

            <div style={styles.suggestionsList}>
              {searchQuery.trim() !== '' && !EXERCISE_OPTIONS.some(o => o.toLowerCase() === searchQuery.toLowerCase()) && (
                <div
                  onClick={() => handleAddExercise(searchQuery)}
                  style={{ ...styles.suggestionItem, fontWeight: '700' }}
                >
                  Criar exercício "{searchQuery}"
                </div>
              )}
              {EXERCISE_OPTIONS.filter((o) =>
                o.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((name) => (
                <div
                  key={name}
                  onClick={() => handleAddExercise(name)}
                  style={styles.suggestionItem}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISCARD CONFIRMATION */}
      {showConfirmCancel && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, padding: '20px', alignItems: 'center', textAlign: 'center' }}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>DESCARTAR TREINO</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              Tem certeza que deseja apagar esta sessão de treino? Todo o progresso registrado será perdido.
            </p>
            <div style={styles.confirmActions}>
              <button onClick={() => setShowConfirmCancel(false)} style={styles.cancelBackBtn}>
                Voltar ao Treino
              </button>
              <button
                onClick={() => {
                  cancelWorkout();
                  setShowConfirmCancel(false);
                }}
                style={styles.confirmDiscardBtn}
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INTEGRATED PLATE CALCULATOR */}
      {plateCalcWeight !== null && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>CALCULADORA DE ANILHAS</h3>
              <button onClick={() => setPlateCalcWeight(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.plateCalcBody}>
              <div style={styles.plateCalcAdjustRow}>
                <button
                  onClick={() => setPlateCalcWeight((prev) => Math.max(settings.barWeight, (prev || 0) - 2.5))}
                  style={styles.adjustPlateValBtn}
                >
                  -2.5
                </button>
                <div style={styles.plateCalcVal}>
                  {plateCalcWeight} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{settings.units}</span>
                </div>
                <button
                  onClick={() => setPlateCalcWeight((prev) => (prev || 0) + 2.5)}
                  style={styles.adjustPlateValBtn}
                >
                  +2.5
                </button>
              </div>

              <PlateVisualizer
                weight={plateCalcWeight}
                barWeight={settings.barWeight}
                availablePlates={settings.availablePlates}
                units={settings.units}
              />
            </div>

            <button onClick={handleApplyPlateWeight} style={styles.applyPlateBtn}>
              Aplicar Peso ao Treino
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const X: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '24px',
    textAlign: 'center',
  },
  emptyIconBox: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    maxWidth: '300px',
    marginBottom: '24px',
  },
  startEmptyBtn: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  workoutTitle: {
    fontSize: '18px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.02em',
    color: '#ffffff',
  },
  timeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginTop: '4px',
    fontFamily: 'monospace',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error)',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  completeBtn: {
    backgroundColor: 'var(--accent-white)',
    color: 'var(--bg-primary)',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: 'var(--radius-sm)',
  },
  notesTextarea: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    height: '52px',
    resize: 'none',
    marginBottom: '16px',
    width: '100%',
    outline: 'none',
  },
  exercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '16px',
  },
  exCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
  },
  exCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '4px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  exName: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
  },
  e1rmIndicator: {
    display: 'block',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  removeExBtn: {
    color: 'var(--text-muted)',
    padding: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thCol: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    paddingBottom: '6px',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    height: '38px',
  },
  tdIndex: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    position: 'relative',
  },
  pctLabel: {
    display: 'block',
    fontSize: '8px',
    color: '#ffffff',
    opacity: 0.6,
  },
  td: {
    padding: '4px 2px',
    textAlign: 'center',
  },
  selectType: {
    height: '28px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '0 4px',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    color: '#fff',
    width: '38px',
    textAlign: 'center',
  },
  weightCell: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    paddingRight: '4px',
  },
  weightInput: {
    height: '28px',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    width: '46px',
    padding: '0',
  },
  plateCalcBtn: {
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
  },
  repsInput: {
    height: '28px',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    color: '#fff',
    width: '42px',
    padding: '0',
  },
  selectRpe: {
    height: '28px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    color: '#fff',
    width: '42px',
    textAlign: 'center',
  },
  checkBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '4px',
    border: '2px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  },
  exCardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  addSetBtn: {
    flex: 2,
    height: '28px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ffffff',
  },
  removeSetBtn: {
    flex: 1,
    height: '28px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  addExBtn: {
    width: '100%',
    height: '42px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
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
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  modalSearch: {
    height: '40px',
    fontSize: '14px',
    marginBottom: '12px',
  },
  suggestionsList: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  suggestionItem: {
    padding: '12px 8px',
    fontSize: '13px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  cancelBackBtn: {
    flex: 1,
    height: '40px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmDiscardBtn: {
    flex: 1,
    height: '40px',
    backgroundColor: 'var(--error)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  plateCalcBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    flex: 1,
  },
  plateCalcAdjustRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    margin: '12px 0 20px',
  },
  adjustPlateValBtn: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '50%',
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    border: '1px solid var(--border-color)',
  },
  plateCalcVal: {
    fontSize: '32px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
  },
  applyPlateBtn: {
    height: '44px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontWeight: '800',
    fontSize: '14px',
    borderRadius: 'var(--radius-sm)',
    marginTop: '16px',
    width: '100%',
  },
};
export default Workout;
