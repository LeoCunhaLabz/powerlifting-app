import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { TemplateExercise } from '../types/workout';
import { Plus, Trash2, Play, X, ChevronRight } from 'lucide-react';

interface TemplatesProps {
  onStartWorkoutTab: () => void;
}

const EXERCISE_SUGGESTIONS = [
  'Agachamento',
  'Supino Reto',
  'Levantamento Terra',
  'Desenvolvimento Militar',
  'Remada Curvada',
  'Barra Fixa',
  'Agachamento Frontal',
  'Supino Inclinado',
  'Terra Romeno',
  'Tríceps Testa',
  'Rosca Direta'
];

export const Templates: React.FC<TemplatesProps> = ({ onStartWorkoutTab }) => {
  const { state, saveTemplate, deleteTemplate, startWorkout } = useWorkout();
  const { templates } = state;

  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create Template form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [searchExercise, setSearchExercise] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleStartWorkout = (id: string) => {
    startWorkout(id);
    onStartWorkoutTab(); // Switch view to Workout Tracker
  };

  const handleAddExerciseToTemplate = (exName: string) => {
    const newEx: TemplateExercise = {
      name: exName,
      sets: [{ reps: 5, type: 'N', weightPercentage: 100 }]
    };
    setExercises([...exercises, newEx]);
    setSearchExercise('');
    setShowSuggestions(false);
  };

  const handleAddSetToExercise = (exIdx: number) => {
    const updated = [...exercises];
    const targetEx = updated[exIdx];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];
    
    targetEx.sets.push({
      reps: lastSet ? lastSet.reps : 5,
      type: lastSet ? lastSet.type : 'N',
      rpe: lastSet ? lastSet.rpe : undefined,
      weightPercentage: lastSet ? lastSet.weightPercentage : 100
    });
    setExercises(updated);
  };

  const handleRemoveSetFromExercise = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    const targetEx = updated[exIdx];
    if (targetEx.sets.length > 1) {
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIdx);
      setExercises(updated);
    }
  };

  const handleUpdateSet = (exIdx: number, setIdx: number, fields: Partial<TemplateExercise['sets'][number]>) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      ...fields
    };
    setExercises(updated);
  };

  const handleRemoveExercise = (exIdx: number) => {
    setExercises(exercises.filter((_, idx) => idx !== exIdx));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    saveTemplate({
      name,
      description,
      exercises
    });
    // Reset Form
    setName('');
    setDescription('');
    setExercises([]);
    setIsCreating(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>ROTINAS</h1>
        <button onClick={() => setIsCreating(true)} style={styles.addTemplateBtn}>
          <Plus size={16} /> Novo Template
        </button>
      </div>

      <div style={styles.templatesList}>
        {templates.map((tpl) => {
          const isExpanded = expandedTemplateId === tpl.id;
          return (
            <div key={tpl.id} style={styles.templateCard}>
              <div 
                onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)} 
                style={styles.cardHeader}
              >
                <div>
                  <div style={styles.cardHeaderTitleRow}>
                    <span style={styles.templateName}>{tpl.name}</span>
                    {tpl.isBuiltIn && <span style={styles.builtInBadge}>Embutido</span>}
                  </div>
                  <div style={styles.templateDesc}>{tpl.description}</div>
                </div>
                <ChevronRight 
                  size={18} 
                  style={{
                    ...styles.chevron,
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }} 
                />
              </div>

              {isExpanded && (
                <div style={styles.expandedPanel}>
                  <div style={styles.exerciseSummary}>
                    {tpl.exercises.map((ex, exIdx) => (
                      <div key={exIdx} style={styles.exerciseSummaryRow}>
                        <span style={styles.exName}>{ex.name}</span>
                        <span style={styles.exSetsCount}>
                          {ex.sets.length} séries • {ex.sets.map(s => `${s.reps}${s.type === 'W' ? 'W' : ''}`).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.actionsRow}>
                    {!tpl.isBuiltIn && (
                      <button 
                        onClick={() => deleteTemplate(tpl.id)} 
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={15} /> Excluir
                      </button>
                    )}
                    <button 
                      onClick={() => handleStartWorkout(tpl.id)} 
                      style={styles.startBtn}
                    >
                      <Play size={15} /> Iniciar Treino
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE TEMPLATE FULL SCREEN OVERLAY */}
      {isCreating && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayHeader}>
              <h2 style={styles.overlayTitle}>CRIAR TEMPLATE</h2>
              <button onClick={() => setIsCreating(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.formContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>NOME DO TEMPLATE</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Madcow - Dia B" 
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>DESCRIÇÃO</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Ex: Treino focado em desenvolvimento de força linear..." 
                  style={styles.textarea}
                />
              </div>

              <div style={styles.exercisesSection}>
                <div style={styles.sectionHeader}>EXERCÍCIOS</div>
                
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} style={styles.exerciseEditBlock}>
                    <div style={styles.exerciseEditHeader}>
                      <span style={styles.exEditName}>{ex.name}</span>
                      <button 
                        onClick={() => handleRemoveExercise(exIdx)} 
                        style={styles.removeExBtn}
                      >
                        Remover
                      </button>
                    </div>

                    <table style={styles.setsTable}>
                      <thead>
                        <tr>
                          <th style={styles.th}>SÉRIE</th>
                          <th style={styles.th}>TIPO</th>
                          <th style={styles.th}>REPS</th>
                          <th style={styles.th}>% DO 1RM</th>
                          <th style={styles.th}>RPE</th>
                          <th style={styles.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((set, setIdx) => (
                          <tr key={setIdx} style={styles.setRow}>
                            <td style={styles.tdIndex}>{setIdx + 1}</td>
                            <td style={styles.td}>
                              <select
                                value={set.type}
                                onChange={(e) => handleUpdateSet(exIdx, setIdx, { type: e.target.value as 'W' | 'N' | 'D' })}
                                style={styles.tableSelect}
                              >
                                <option value="N">N</option>
                                <option value="W">W</option>
                                <option value="D">D</option>
                              </select>
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => handleUpdateSet(exIdx, setIdx, { reps: Math.max(1, Number(e.target.value)) })}
                                style={styles.tableInput}
                              />
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                placeholder="100"
                                value={set.weightPercentage || ''}
                                onChange={(e) => handleUpdateSet(exIdx, setIdx, { weightPercentage: Number(e.target.value) || undefined })}
                                style={styles.tableInput}
                              />
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                placeholder="-"
                                value={set.rpe || ''}
                                onChange={(e) => handleUpdateSet(exIdx, setIdx, { rpe: Number(e.target.value) || undefined })}
                                style={styles.tableInput}
                              />
                            </td>
                            <td style={styles.td}>
                              <button 
                                onClick={() => handleRemoveSetFromExercise(exIdx, setIdx)} 
                                style={styles.deleteSetBtn}
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <button 
                      onClick={() => handleAddSetToExercise(exIdx)} 
                      style={styles.addSetBtn}
                    >
                      + Adicionar Série
                    </button>
                  </div>
                ))}

                {/* Add Exercise Search Input */}
                <div style={styles.addExerciseBox}>
                  <input
                    type="text"
                    value={searchExercise}
                    onChange={(e) => {
                      setSearchExercise(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Buscar ou adicionar exercício..."
                    style={styles.searchExerciseInput}
                  />
                  {searchExercise.trim() !== '' && !EXERCISE_SUGGESTIONS.includes(searchExercise) && (
                    <button
                      onClick={() => handleAddExerciseToTemplate(searchExercise)}
                      style={styles.addCustomExBtn}
                    >
                      Adicionar "{searchExercise}"
                    </button>
                  )}
                  {showSuggestions && (
                    <div style={styles.suggestionsList}>
                      {EXERCISE_SUGGESTIONS.filter(ex => 
                        ex.toLowerCase().includes(searchExercise.toLowerCase())
                      ).map(ex => (
                        <div
                          key={ex}
                          onClick={() => handleAddExerciseToTemplate(ex)}
                          style={styles.suggestionItem}
                        >
                          {ex}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={!name.trim() || exercises.length === 0} 
              style={styles.saveBtn}
            >
              Salvar Template
            </button>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
  },
  addTemplateBtn: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  templatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  templateCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  cardHeaderTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  templateName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  builtInBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-secondary)',
    fontSize: '9px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'uppercase',
  },
  templateDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    maxWidth: '380px',
  },
  chevron: {
    color: 'var(--text-secondary)',
    transition: 'transform var(--transition-normal)',
  },
  expandedPanel: {
    borderTop: '1px solid var(--border-color)',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  exerciseSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  exerciseSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fontSize: '13px',
  },
  exName: {
    fontWeight: '700',
    color: '#ffffff',
  },
  exSetsCount: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    color: 'var(--error)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  startBtn: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 120,
    backdropFilter: 'blur(4px)',
  },
  overlayContent: {
    backgroundColor: 'var(--bg-secondary)',
    width: '100%',
    maxWidth: 'var(--max-width)',
    height: '92vh',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderTopRightRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
  },
  overlayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  overlayTitle: {
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  formContent: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
  },
  input: {
    height: '40px',
    fontWeight: '600',
  },
  textarea: {
    height: '60px',
    lineHeight: '1.4',
    resize: 'none',
  },
  exercisesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '4px',
    marginTop: '8px',
  },
  exerciseEditBlock: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
  },
  exerciseEditHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  exEditName: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#ffffff',
  },
  removeExBtn: {
    color: 'var(--error)',
    fontSize: '11px',
    fontWeight: '700',
  },
  setsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10px',
  },
  th: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    paddingBottom: '6px',
  },
  setRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  tdIndex: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  td: {
    padding: '4px',
    textAlign: 'center',
  },
  tableSelect: {
    height: '28px',
    padding: '0 4px',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    color: '#fff',
    width: '44px',
  },
  tableInput: {
    height: '28px',
    textAlign: 'center',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: '3px',
    color: '#fff',
    width: '50px',
    padding: '0',
  },
  deleteSetBtn: {
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  addSetBtn: {
    width: '100%',
    height: '32px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '600',
  },
  addExerciseBox: {
    position: 'relative',
    marginTop: '8px',
  },
  searchExerciseInput: {
    width: '100%',
    height: '40px',
  },
  addCustomExBtn: {
    width: '100%',
    height: '32px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '12px',
    fontWeight: '700',
    marginTop: '6px',
  },
  suggestionsList: {
    position: 'absolute',
    bottom: '42px',
    left: 0,
    width: '100%',
    maxHeight: '180px',
    overflowY: 'auto',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    zIndex: 130,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  suggestionItem: {
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    cursor: 'pointer',
  },
  saveBtn: {
    width: '100%',
    height: '44px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '14px',
    fontWeight: '800',
    borderRadius: 'var(--radius-sm)',
    marginTop: '12px',
  },
};
export default Templates;
