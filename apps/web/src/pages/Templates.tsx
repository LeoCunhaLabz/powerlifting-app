import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { TemplateExercise, WorkoutTemplate, Program, WeekOverride } from '@powerlifting/shared';
import { Plus, Trash2, Play, X, ChevronRight, AlertTriangle, Pencil, Copy, ListOrdered, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';

interface TemplatesProps {
  onStartWorkoutTab: () => void;
}

const EXERCISE_SUGGESTIONS = [
  'Agachamento', 'Supino Reto', 'Levantamento Terra', 'Desenvolvimento Militar',
  'Remada Curvada', 'Barra Fixa', 'Agachamento Frontal', 'Supino Inclinado',
  'Terra Romeno', 'Tríceps Testa', 'Rosca Direta',
];

type Prescription = 'percent' | 'rpe';

const schemeSummary = (ex: TemplateExercise[]): string => {
  const total = ex.reduce((a, e) => a + e.sets.length, 0);
  const reps = ex[0]?.sets[0]?.reps;
  return ex.length ? `${ex.length} ex · ${total} séries${reps ? ` · ${reps} reps` : ''}` : 'Sem exercícios';
};

export const Templates: React.FC<TemplatesProps> = ({ onStartWorkoutTab }) => {
  const { state, saveTemplate, deleteTemplate, startWorkout, saveProgram, deleteProgram } = useWorkout();
  const { templates } = state;
  const programs = state.programs;

  // Top-level view: rotinas vs programas
  const [mainView, setMainView] = useState<'rotinas' | 'programas'>('rotinas');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'mine' | 'builtin'>('mine');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Create/Edit template form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prescription, setPrescription] = useState<Prescription>('percent');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [searchExercise, setSearchExercise] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Program form state
  const [isProgramForm, setIsProgramForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [progName, setProgName] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progTemplateIds, setProgTemplateIds] = useState<string[]>([]);
  const [progActive, setProgActive] = useState(false);
  const [progStartDate, setProgStartDate] = useState('');
  const [progTrainingDays, setProgTrainingDays] = useState<number[]>([]);
  const [progWeekCount, setProgWeekCount] = useState(4);
  const [progWeekOverrides, setProgWeekOverrides] = useState<WeekOverride[]>([]);
  const [selectedOverrideWeek, setSelectedOverrideWeek] = useState(0);
  const [confirmDeleteProgId, setConfirmDeleteProgId] = useState<string | null>(null);

  const filtered = templates.filter((t) => (filter === 'builtin' ? t.isBuiltIn : !t.isBuiltIn));

  const handleStart = (id: string) => {
    startWorkout(id);
    onStartWorkoutTab();
  };

  const addEx = (exName: string) => {
    setExercises((prev) => [...prev, { name: exName, sets: [{ reps: 5, type: 'N', weightPercentage: prescription === 'percent' ? 100 : undefined, rpe: prescription === 'rpe' ? 8 : undefined }] }]);
    setSearchExercise('');
    setShowSuggestions(false);
  };
  const addSet = (exIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const last = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx].sets.push({ reps: last?.reps ?? 5, type: last?.type ?? 'N', weightPercentage: last?.weightPercentage, rpe: last?.rpe });
      return next;
    });
  };
  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      if (next[exIdx].sets.length > 1) next[exIdx].sets = next[exIdx].sets.filter((_, i) => i !== setIdx);
      return next;
    });
  };
  const updateSet = (exIdx: number, setIdx: number, fields: Partial<TemplateExercise['sets'][number]>) => {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx].sets[setIdx] = { ...next[exIdx].sets[setIdx], ...fields };
      return next;
    });
  };
  const removeEx = (exIdx: number) => setExercises((prev) => prev.filter((_, i) => i !== exIdx));

  const resetForm = () => {
    setName(''); setDescription(''); setExercises([]); setPrescription('percent'); setIsCreating(false); setEditingId(null);
  };

  const startEdit = (tpl: WorkoutTemplate, duplicate = false) => {
    const detectedPresc: Prescription =
      tpl.exercises[0]?.sets[0]?.rpe !== undefined ? 'rpe' : 'percent';
    setName(duplicate ? `${tpl.name} (cópia)` : tpl.name);
    setDescription(tpl.description);
    setPrescription(detectedPresc);
    setExercises(tpl.exercises.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) })));
    setEditingId(duplicate ? null : tpl.id);
    setIsCreating(true);
    setExpandedId(null);
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    // Garante apenas um critério por série (%1RM OU RPE)
    const cleaned = exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        reps: s.reps, type: s.type,
        weightPercentage: prescription === 'percent' ? s.weightPercentage : undefined,
        rpe: prescription === 'rpe' ? s.rpe : undefined,
      })),
    }));
    saveTemplate({ id: editingId ?? undefined, name, description, exercises: cleaned });
    resetForm();
  };

  // ---- Program form helpers ----
  const resetProgramForm = () => {
    setProgName(''); setProgDesc(''); setProgTemplateIds([]); setProgActive(false);
    setProgStartDate(''); setProgTrainingDays([]); setProgWeekCount(4); setProgWeekOverrides([]); setSelectedOverrideWeek(0);
    setEditingProgramId(null); setIsProgramForm(false);
  };

  const startEditProgram = (prog: Program) => {
    setProgName(prog.name);
    setProgDesc(prog.description ?? '');
    setProgTemplateIds([...prog.templateIds]);
    setProgActive(prog.isActive);
    setProgStartDate(prog.startDate ?? prog.createdAt.slice(0, 10));
    setProgTrainingDays(prog.trainingDays ?? []);
    setProgWeekCount(prog.weekCount ?? 4);
    setProgWeekOverrides(prog.weekOverrides ? prog.weekOverrides.map(o => ({ ...o })) : []);
    setSelectedOverrideWeek(0);
    setEditingProgramId(prog.id);
    setIsProgramForm(true);
  };

  const handleSaveProgram = () => {
    if (!progName.trim() || progTemplateIds.length === 0) return;
    saveProgram({
      id: editingProgramId ?? undefined,
      name: progName,
      description: progDesc,
      templateIds: progTemplateIds,
      isActive: progActive,
      startDate: progStartDate || new Date().toISOString().slice(0, 10),
      trainingDays: progTrainingDays,
      weekCount: progWeekCount,
      weekOverrides: progWeekOverrides.length > 0 ? progWeekOverrides : undefined,
    });
    resetProgramForm();
  };

  const toggleProgTemplate = (id: string) => {
    setProgTemplateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const moveProgTemplate = (idx: number, dir: -1 | 1) => {
    setProgTemplateIds(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // ---- Week override helpers ----
  const updateWeekOverride = (weekIndex: number, exerciseName: string, field: keyof Omit<WeekOverride, 'weekIndex' | 'exerciseName'>, value: number | undefined) => {
    setProgWeekOverrides(prev => {
      const existing = prev.findIndex(o => o.weekIndex === weekIndex && o.exerciseName === exerciseName);
      if (existing > -1) {
        const next = [...prev];
        next[existing] = { ...next[existing], [field]: value };
        // Remover override se todos os campos opcionais estiverem undefined
        const ov = next[existing];
        if (ov.reps === undefined && ov.weightPercentage === undefined && ov.rpe === undefined && ov.sets === undefined) {
          return next.filter((_, i) => i !== existing);
        }
        return next;
      }
      if (value === undefined) return prev;
      return [...prev, { weekIndex, exerciseName, [field]: value }];
    });
  };

  const getOverrideVal = (weekIndex: number, exerciseName: string, field: keyof Omit<WeekOverride, 'weekIndex' | 'exerciseName'>): number | undefined =>
    progWeekOverrides.find(o => o.weekIndex === weekIndex && o.exerciseName === exerciseName)?.[field];

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>{mainView === 'rotinas' ? 'ROTINAS' : 'PROGRAMAS'}</h1>
        {mainView === 'rotinas'
          ? <button onClick={() => setIsCreating(true)} style={styles.newBtn}><Plus size={15} /> Nova</button>
          : <button onClick={() => setIsProgramForm(true)} style={styles.newBtn}><Plus size={15} /> Novo</button>
        }
      </div>

      {/* Main view toggle */}
      <div style={styles.segmented}>
        <button onClick={() => setMainView('rotinas')} style={mainView === 'rotinas' ? styles.segOn : styles.segOff}>Rotinas</button>
        <button onClick={() => setMainView('programas')} style={mainView === 'programas' ? styles.segOn : styles.segOff}><ListOrdered size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Programas</button>
      </div>

      {mainView === 'rotinas' && (<>
        {/* Sub-filter: Minhas / Embutidas */}
        <div style={styles.segmented}>
          <button onClick={() => setFilter('mine')} style={filter === 'mine' ? styles.segOn : styles.segOff}>Minhas</button>
          <button onClick={() => setFilter('builtin')} style={filter === 'builtin' ? styles.segOn : styles.segOff}>Embutidas</button>
        </div>

      <div style={styles.list}>
        {filtered.length === 0 && (
          <div style={styles.empty}>
            {filter === 'mine' ? 'Você ainda não criou rotinas. Toque em “Nova” para montar a sua.' : 'Nenhuma rotina embutida.'}
          </div>
        )}
        {filtered.map((tpl) => {
          const open = expandedId === tpl.id;
          return (
            <div key={tpl.id} style={styles.row}>
              <button onClick={() => setExpandedId(open ? null : tpl.id)} style={styles.rowHead}>
                <span style={styles.avatar}>{tpl.name.charAt(0).toUpperCase()}</span>
                <span style={styles.rowTexts}>
                  <span style={styles.rowName}>{tpl.name}</span>
                  <span style={styles.rowSub}>{schemeSummary(tpl.exercises)}</span>
                </span>
                <ChevronRight size={18} style={{ ...styles.chevron, transform: open ? 'rotate(90deg)' : 'none' }} />
              </button>

              {open && (
                <div style={styles.expand}>
                  {tpl.description && <div style={styles.desc}>{tpl.description}</div>}
                  <div style={styles.exSummary}>
                    {tpl.exercises.map((ex, i) => (
                      <div key={i} style={styles.exSumRow}>
                        <span style={styles.exSumName}>{ex.name}</span>
                        <span style={styles.exSumSets}>
                          {ex.sets.length}× · {ex.sets.map((s) => s.reps).join('/')}
                          {ex.sets[0]?.weightPercentage ? ` · ${ex.sets.map((s) => s.weightPercentage).join('/')}%` : ex.sets[0]?.rpe ? ` · RPE ${ex.sets.map((s) => s.rpe).join('/')}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.rowActions}>
                    {!tpl.isBuiltIn && (
                      <>
                        <button onClick={() => startEdit(tpl)} style={styles.editBtn}><Pencil size={14} /> Editar</button>
                        <button onClick={() => setConfirmDeleteId(tpl.id)} style={styles.delBtn}><Trash2 size={14} /> Excluir</button>
                      </>
                    )}
                    {tpl.isBuiltIn && (
                      <button onClick={() => startEdit(tpl, true)} style={styles.editBtn}><Copy size={14} /> Duplicar</button>
                    )}
                    <button onClick={() => handleStart(tpl.id)} style={styles.startBtn}><Play size={14} fill="var(--accent-ink)" stroke="none" /> Iniciar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm delete modal */}
      {confirmDeleteId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12, alignSelf: 'center' }} />
            <h3 style={{ ...styles.modalTitle, textAlign: 'center', marginBottom: 8 }}>Excluir rotina</h3>
            <p style={styles.confirmDesc}>Esta rotina será excluída permanentemente.</p>
            <div style={styles.confirmActions}>
              <button onClick={() => setConfirmDeleteId(null)} style={styles.confirmBack}>Voltar</button>
              <button onClick={() => { deleteTemplate(confirmDeleteId); setConfirmDeleteId(null); }} style={styles.confirmDiscard}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Create overlay */}
      {isCreating && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayHead}>
              <button onClick={resetForm} style={styles.close} aria-label="Fechar"><X size={20} /></button>
              <h2 style={styles.overlayTitle}>{editingId ? 'Editar rotina' : 'Criar rotina'}</h2>
              <button onClick={handleSave} disabled={!name.trim() || exercises.length === 0} style={{ ...styles.saveTop, opacity: !name.trim() || exercises.length === 0 ? 0.4 : 1 }}>Salvar</button>
            </div>

            <div style={styles.form}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da rotina" style={styles.nameInput} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" style={styles.descInput} />

              {/* Prescription toggle (%1RM OU RPE) */}
              <div style={styles.prescRow}>
                <span style={styles.prescLabel}>Prescrever por</span>
                <div style={styles.segmented}>
                  <button onClick={() => setPrescription('percent')} style={prescription === 'percent' ? styles.segOn : styles.segOff}>% do 1RM</button>
                  <button onClick={() => setPrescription('rpe')} style={prescription === 'rpe' ? styles.segOn : styles.segOff}>RPE</button>
                </div>
              </div>

              {exercises.map((ex, exIdx) => (
                <div key={exIdx} style={styles.exBlock}>
                  <div style={styles.exBlockHead}>
                    <span style={styles.exBlockName}>{ex.name}</span>
                    <button onClick={() => removeEx(exIdx)} style={styles.removeExText}>Remover</button>
                  </div>
                  <div style={styles.setHead}>
                    <span>SÉRIE</span><span style={styles.cC}>TIPO</span><span style={styles.cC}>REPS</span><span style={styles.cC}>{prescription === 'percent' ? '%1RM' : 'RPE'}</span><span></span>
                  </div>
                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} style={styles.setRow}>
                      <span style={styles.setIdx}>{setIdx + 1}</span>
                      <select value={set.type} onChange={(e) => updateSet(exIdx, setIdx, { type: e.target.value as 'W' | 'N' | 'D' })} style={styles.sel}>
                        <option value="N">N</option><option value="W">W</option><option value="D">D</option>
                      </select>
                      <input type="number" inputMode="numeric" value={set.reps} onChange={(e) => updateSet(exIdx, setIdx, { reps: Math.max(1, Number(e.target.value)) })} style={styles.inp} />
                      {prescription === 'percent' ? (
                        <input type="number" inputMode="numeric" placeholder="100" value={set.weightPercentage ?? ''} onChange={(e) => updateSet(exIdx, setIdx, { weightPercentage: Number(e.target.value) || undefined })} style={styles.inp} />
                      ) : (
                        <select value={set.rpe ?? ''} onChange={(e) => updateSet(exIdx, setIdx, { rpe: e.target.value ? Number(e.target.value) : undefined })} style={styles.inp}>
                          <option value="">—</option>
                          {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                      <button onClick={() => removeSet(exIdx, setIdx)} style={styles.delSetBtn}><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => addSet(exIdx)} style={styles.addSetBtn}><Plus size={13} /> Série</button>
                </div>
              ))}

              <div style={styles.addExBox}>
                <input type="text" value={searchExercise} onChange={(e) => { setSearchExercise(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} placeholder="Buscar ou adicionar exercício..." style={styles.searchEx} />
                {searchExercise.trim() && !EXERCISE_SUGGESTIONS.includes(searchExercise) && (
                  <button onClick={() => addEx(searchExercise)} style={styles.addCustom}>Adicionar "{searchExercise}"</button>
                )}
                {showSuggestions && (
                  <div style={styles.suggestions}>
                    {EXERCISE_SUGGESTIONS.filter((e) => e.toLowerCase().includes(searchExercise.toLowerCase())).map((e) => (
                      <button key={e} onClick={() => addEx(e)} style={styles.suggestion}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>)}

      {/* ---- PROGRAMS VIEW ---- */}
      {mainView === 'programas' && (
        <div style={styles.list}>
          {programs.length === 0 && (
            <div style={styles.empty}>Nenhum programa ainda. Toque em "Novo" para criar um.</div>
          )}
          {programs.map((prog) => (
            <div key={prog.id} style={{ ...styles.row, borderColor: prog.isActive ? 'var(--accent-border)' : undefined }}>
              <div style={styles.rowHead}>
                <span style={{ ...styles.avatar, backgroundColor: prog.isActive ? 'var(--accent)' : 'var(--bg-tertiary)', color: prog.isActive ? 'var(--accent-ink)' : 'var(--text-secondary)' }}>
                  {prog.isActive ? <CheckCircle2 size={20} /> : <ListOrdered size={20} />}
                </span>
                <span style={styles.rowTexts}>
                  <span style={styles.rowName}>{prog.name}{prog.isActive && <span style={styles.activeBadge}> ativo</span>}</span>
                  <span style={styles.rowSub}>{prog.templateIds.length} rotina{prog.templateIds.length !== 1 ? 's' : ''} na sequência</span>
                </span>
              </div>
              {prog.description && <div style={{ ...styles.desc, paddingLeft: 14, paddingRight: 14 }}>{prog.description}</div>}
              <div style={styles.progSequence}>
                {prog.templateIds.map((tid, idx) => {
                  const tpl = templates.find(t => t.id === tid);
                  return (
                    <div key={tid} style={styles.progSeqItem}>
                      <span style={styles.progSeqNum}>{idx + 1}</span>
                      <span style={styles.progSeqName}>{tpl?.name ?? '(rotina removida)'}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ ...styles.rowActions, padding: '10px 14px' }}>
                {!prog.isActive && (
                  <button onClick={() => saveProgram({ ...prog, isActive: true })} style={styles.activateBtn}>Ativar</button>
                )}
                {prog.isActive && (
                  <button onClick={() => saveProgram({ ...prog, isActive: false })} style={styles.editBtn}>Desativar</button>
                )}
                <button onClick={() => startEditProgram(prog)} style={styles.editBtn}><Pencil size={14} /> Editar</button>
                <button onClick={() => setConfirmDeleteProgId(prog.id)} style={styles.delBtn}><Trash2 size={14} /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete program */}
      {confirmDeleteProgId !== null && (
        <div style={styles.overlay} onClick={() => setConfirmDeleteProgId(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12, alignSelf: 'center' }} />
            <h3 style={{ ...styles.modalTitle, textAlign: 'center', marginBottom: 8 }}>Excluir programa</h3>
            <p style={styles.confirmDesc}>Este programa será excluído permanentemente.</p>
            <div style={styles.confirmActions}>
              <button onClick={() => setConfirmDeleteProgId(null)} style={styles.confirmBack}>Voltar</button>
              <button onClick={() => { deleteProgram(confirmDeleteProgId); setConfirmDeleteProgId(null); }} style={styles.confirmDiscard}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Program create/edit overlay */}
      {isProgramForm && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <div style={styles.overlayHead}>
              <button onClick={resetProgramForm} style={styles.close} aria-label="Fechar"><X size={20} /></button>
              <h2 style={styles.overlayTitle}>{editingProgramId ? 'Editar programa' : 'Criar programa'}</h2>
              <button onClick={handleSaveProgram} disabled={!progName.trim() || progTemplateIds.length === 0} style={{ ...styles.saveTop, opacity: !progName.trim() || progTemplateIds.length === 0 ? 0.4 : 1 }}>Salvar</button>
            </div>
            <div style={styles.form}>
              <input type="text" value={progName} onChange={(e) => setProgName(e.target.value)} placeholder="Nome do programa" style={styles.nameInput} />
              <textarea value={progDesc} onChange={(e) => setProgDesc(e.target.value)} placeholder="Descrição (opcional)" style={styles.descInput} />

              <div style={styles.progActiveRow}>
                <span style={styles.prescLabel}>Programa ativo</span>
                <button onClick={() => setProgActive(v => !v)} style={{ ...styles.toggleBtn, backgroundColor: progActive ? 'var(--accent)' : 'var(--bg-tertiary)', borderColor: progActive ? 'var(--accent-border)' : 'var(--border-color)' }}>
                  <span style={{ ...styles.toggleKnob, transform: progActive ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>

              <div style={styles.progActiveRow}>
                <span style={styles.prescLabel}>Data de início</span>
                <input type="date" value={progStartDate} onChange={(e) => setProgStartDate(e.target.value)} style={{ ...styles.inp, width: 'auto', height: '36px', padding: '0 8px' }} />
              </div>

              <div>
                <div style={{ ...styles.prescLabel, marginBottom: 8 }}>Dias de treino</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => (
                    <button key={i} onClick={() => setProgTrainingDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())}
                      style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 10, fontWeight: 700, border: '1px solid var(--border-color)', backgroundColor: progTrainingDays.includes(i) ? 'var(--accent)' : 'var(--bg-tertiary)', color: progTrainingDays.includes(i) ? 'var(--accent-ink)' : 'var(--text-secondary)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.prescLabel}>Sequência de rotinas</div>
              {/* Ordered list with reorder controls */}
              {progTemplateIds.length > 0 && (
                <div style={styles.progOrderList}>
                  {progTemplateIds.map((tid, idx) => {
                    const tpl = templates.find(t => t.id === tid);
                    return (
                      <div key={tid} style={styles.progOrderItem}>
                        <span style={styles.progSeqNum}>{idx + 1}</span>
                        <span style={{ ...styles.progSeqName, flex: 1 }}>{tpl?.name ?? tid}</span>
                        <button onClick={() => moveProgTemplate(idx, -1)} disabled={idx === 0} style={styles.reorderBtn}><ArrowUp size={14} /></button>
                        <button onClick={() => moveProgTemplate(idx, 1)} disabled={idx === progTemplateIds.length - 1} style={styles.reorderBtn}><ArrowDown size={14} /></button>
                        <button onClick={() => toggleProgTemplate(tid)} style={styles.removeExText}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={styles.prescLabel}>Adicionar rotinas</div>
              {templates.filter(t => !t.isBuiltIn && !progTemplateIds.includes(t.id)).map(tpl => (
                <button key={tpl.id} onClick={() => toggleProgTemplate(tpl.id)} style={styles.addTplBtn}>
                  <Plus size={13} /> {tpl.name}
                </button>
              ))}
              {templates.filter(t => !t.isBuiltIn).length === 0 && (
                <div style={{ ...styles.empty, padding: '12px', border: 'none', fontSize: '12px' }}>Crie rotinas customizadas primeiro.</div>
              )}

              {/* ---- Periodização por semana ---- */}
              {progTemplateIds.length > 0 && (() => {
                // Deduplica exercícios dos templates selecionados
                const exNames: string[] = [];
                progTemplateIds.forEach(tid => {
                  const tpl = templates.find(t => t.id === tid);
                  tpl?.exercises.forEach(ex => { if (!exNames.includes(ex.name)) exNames.push(ex.name); });
                });
                return (
                  <div>
                    <div style={{ ...styles.prescLabel, marginBottom: 8 }}>Periodização por semana</div>
                    <div style={styles.progActiveRow}>
                      <span style={styles.prescLabel}>Nº de semanas</span>
                      <input type="number" inputMode="numeric" min={1} max={52} value={progWeekCount}
                        onChange={(e) => { const v = Math.max(1, Math.min(52, Number(e.target.value))); setProgWeekCount(v); setSelectedOverrideWeek(w => Math.min(w, v - 1)); }}
                        style={{ ...styles.inp, width: 64, height: 36 }} />
                    </div>
                    {/* Week tabs */}
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
                      {Array.from({ length: progWeekCount }, (_, i) => (
                        <button key={i} onClick={() => setSelectedOverrideWeek(i)}
                          style={{ flexShrink: 0, height: 30, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            backgroundColor: selectedOverrideWeek === i ? 'var(--accent)' : 'var(--bg-tertiary)',
                            color: selectedOverrideWeek === i ? 'var(--accent-ink)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)' }}>
                          S{i + 1}
                        </button>
                      ))}
                    </div>
                    {/* Exercise overrides for selected week */}
                    {exNames.map(exName => {
                      const reps = getOverrideVal(selectedOverrideWeek, exName, 'reps');
                      const pct  = getOverrideVal(selectedOverrideWeek, exName, 'weightPercentage');
                      const rpe  = getOverrideVal(selectedOverrideWeek, exName, 'rpe');
                      const sets = getOverrideVal(selectedOverrideWeek, exName, 'sets');
                      return (
                        <div key={exName} style={{ ...styles.exBlock, marginBottom: 8 }}>
                          <div style={{ ...styles.exBlockHead, marginBottom: 6 }}>
                            <span style={{ ...styles.exBlockName, fontSize: 12 }}>{exName}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>S{selectedOverrideWeek + 1}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                            {[
                              { label: 'Séries', field: 'sets' as const, val: sets },
                              { label: 'Reps', field: 'reps' as const, val: reps },
                              { label: '%1RM', field: 'weightPercentage' as const, val: pct },
                              { label: 'RPE', field: 'rpe' as const, val: rpe },
                            ].map(({ label, field, val }) => (
                              <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)' }}>{label}</span>
                                <input type="number" inputMode="decimal" placeholder="—" value={val ?? ''}
                                  onChange={(e) => updateWeekOverride(selectedOverrideWeek, exName, field, e.target.value === '' ? undefined : Number(e.target.value))}
                                  style={{ ...styles.inp, height: 32, fontSize: 12 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  pageTitle: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' },
  newBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, padding: '8px 13px', borderRadius: '999px' },
  segmented: { display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '3px', marginBottom: '16px' },
  segOn: { flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '8px', borderRadius: '9px' },
  segOff: { flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', padding: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'center', padding: '28px 16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' },
  row: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  rowHead: { display: 'flex', alignItems: 'center', gap: '13px', width: '100%', textAlign: 'left', padding: '13px 14px', background: 'none' },
  avatar: { width: '40px', height: '40px', borderRadius: '11px', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', flexShrink: 0 },
  rowTexts: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  rowName: { fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' },
  rowSub: { fontSize: '11px', color: 'var(--text-muted)' },
  chevron: { color: 'var(--text-muted)', flexShrink: 0, transition: 'transform var(--transition-normal)' },
  expand: { borderTop: '1px solid var(--border-color)', padding: '14px', backgroundColor: 'rgba(0,0,0,0.15)' },
  desc: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' },
  exSummary: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  exSumRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' },
  exSumName: { fontWeight: 700, color: 'var(--text-primary)' },
  exSumSets: { color: 'var(--text-muted)', fontSize: '11px' },
  rowActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: 'var(--text-secondary)', padding: '9px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, border: '1px solid var(--border-color)' },
  delBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', color: 'var(--error)', padding: '9px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(229,84,75,0.2)' },
  startBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '9px 18px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 800 },
  modal: { backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 'var(--max-width)', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' },
  modalTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  confirmDesc: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4, textAlign: 'center' },
  confirmActions: { display: 'flex', gap: '12px', width: '100%' },
  confirmBack: { flex: 1, height: '44px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' },
  confirmDiscard: { flex: 1, height: '44px', backgroundColor: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 800, color: '#fff' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  overlayContent: { backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: 'var(--max-width)', height: '94vh', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' },
  overlayHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border-color)' },
  overlayTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  close: { color: 'var(--text-secondary)', padding: '4px' },
  saveTop: { fontSize: '14px', fontWeight: 800, color: 'var(--accent)', background: 'none' },
  form: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' },
  nameInput: { height: '46px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' },
  descInput: { height: '56px', lineHeight: 1.4, resize: 'none' },
  prescRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  prescLabel: { fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  exBlock: { backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '13px' },
  exBlockHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  exBlockName: { fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' },
  removeExText: { color: 'var(--error)', fontSize: '11px', fontWeight: 700 },
  setHead: { display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr 30px', gap: '7px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: '7px' },
  cC: { textAlign: 'center' },
  setRow: { display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr 30px', gap: '7px', alignItems: 'center', marginBottom: '7px' },
  setIdx: { textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' },
  sel: { height: '34px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center', fontSize: '13px', width: '100%', minWidth: 0 },
  inp: { height: '34px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center', fontSize: '14px', fontWeight: 700, width: '100%', padding: '0 2px', minWidth: 0 },
  delSetBtn: { color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' },
  addSetBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', width: '100%', justifyContent: 'center', height: '34px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, marginTop: '4px' },
  addExBox: { position: 'relative' },
  searchEx: { width: '100%', height: '46px' },
  addCustom: { width: '100%', height: '38px', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, marginTop: '8px' },
  suggestions: { position: 'absolute', bottom: '50px', left: 0, width: '100%', maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', zIndex: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  suggestion: { display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', fontSize: '13px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', background: 'none' },
  activeBadge: { fontSize: '10px', fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '999px', padding: '1px 7px', marginLeft: 6, verticalAlign: 'middle' },
  activateBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '9px 18px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 800 },
  progSequence: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 14px 4px' },
  progSeqItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border-color)' },
  progSeqNum: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', flexShrink: 0 } as React.CSSProperties,
  progSeqName: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  progActiveRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' },
  toggleBtn: { width: '44px', height: '24px', borderRadius: '999px', border: '1px solid', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0, cursor: 'pointer' } as React.CSSProperties,
  toggleKnob: { position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 0.2s' } as React.CSSProperties,
  progOrderList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  progOrderItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' },
  reorderBtn: { color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center' },
  addTplBtn: { display: 'inline-flex', alignItems: 'center', gap: '7px', width: '100%', padding: '11px 14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 },
};

export default Templates;
