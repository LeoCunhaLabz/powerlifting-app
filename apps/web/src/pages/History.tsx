import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { WorkoutSession, ExerciseState, SetState } from '@powerlifting/shared';
import { Clock, TrendingUp, Award, X, RotateCcw, Pencil, Check, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { EXERCISE_OPTIONS } from '../utils/exerciseOptions';

interface HistoryProps {
  onRepeat: (session: WorkoutSession) => void;
  /** Abre direto a sessão com este id ao montar (deep-link vindo do Dashboard). */
  initialSessionId?: string;
  /** Se true, abre a sessão inicial já em modo de edição. */
  initialEdit?: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const History: React.FC<HistoryProps> = ({ onRepeat, initialSessionId, initialEdit }) => {
  const { state, updateHistorySession, deleteHistorySession } = useWorkout();
  const { history, settings } = state;
  const u = settings.units;

  // Deep-link do Dashboard: abre a sessão (e edição) já no primeiro render.
  const initialSelected = initialSessionId ? history.find((s) => s.id === initialSessionId) ?? null : null;

  const [selected, setSelected] = useState<WorkoutSession | null>(initialSelected);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(!!(initialSelected && initialEdit));
  const [editDraft, setEditDraft] = useState<WorkoutSession | null>(
    initialSelected && initialEdit ? (JSON.parse(JSON.stringify(initialSelected)) as WorkoutSession) : null,
  );
  const [showAddEx, setShowAddEx] = useState(false);
  const [addExSearch, setAddExSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openModal = (s: WorkoutSession) => { setSelected(s); setEditMode(false); setEditDraft(null); };
  const closeModal = () => { setSelected(null); setEditMode(false); setEditDraft(null); setConfirmDelete(false); };

  const startEdit = () => {
    if (!selected) return;
    setEditDraft(JSON.parse(JSON.stringify(selected)) as WorkoutSession);
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setEditDraft(null); setShowAddEx(false); setAddExSearch(''); };

  const saveEdit = () => {
    if (!editDraft) return;
    updateHistorySession(editDraft);
    setSelected(editDraft);
    setEditMode(false);
    setEditDraft(null);
  };

  const removeSession = () => {
    if (!selected) return;
    deleteHistorySession(selected.id);
    closeModal();
  };

  type NumericSetField = 'weight' | 'reps' | 'rpe';
  const updateDraftSet = (exIdx: number, setIdx: number, field: NumericSetField, raw: string) => {
    if (!editDraft) return;
    const val = field === 'rpe' ? parseFloat(raw) : parseFloat(raw);
    setEditDraft(prev => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) =>
            si !== setIdx ? s : { ...s, [field]: isNaN(val) ? s[field] : val }
          ),
        };
      });
      return { ...prev, exercises };
    });
  };

  const toggleDraftSetCompleted = (exIdx: number, setIdx: number) => {
    setEditDraft(prev => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, si) => (si !== setIdx ? s : { ...s, completed: !s.completed })) },
      );
      return { ...prev, exercises };
    });
  };

  const updateDraftSetType = (exIdx: number, setIdx: number, type: 'W' | 'N' | 'D') => {
    if (!editDraft) return;
    setEditDraft(prev => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, type }),
        };
      });
      return { ...prev, exercises };
    });
  };

  const updateDraftField = (patch: Partial<WorkoutSession>) =>
    setEditDraft(prev => (prev ? { ...prev, ...patch } : prev));

  const updateDraftDurationMin = (raw: string) => {
    const min = parseFloat(raw);
    updateDraftField({ duration: isNaN(min) || min < 0 ? 0 : Math.round(min * 60) });
  };

  const updateDraftExerciseNotes = (exIdx: number, notes: string) =>
    setEditDraft(prev => prev
      ? { ...prev, exercises: prev.exercises.map((ex, ei) => ei === exIdx ? { ...ex, notes } : ex) }
      : prev);

  const addDraftExercise = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newEx: ExerciseState = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      sets: [{ id: `set-${Date.now()}-0`, weight: 0, reps: 5, completed: true, type: 'N' }],
    };
    setEditDraft(prev => (prev ? { ...prev, exercises: [...prev.exercises, newEx] } : prev));
    setShowAddEx(false);
    setAddExSearch('');
  };

  const removeDraftExercise = (exIdx: number) =>
    setEditDraft(prev => prev
      ? { ...prev, exercises: prev.exercises.filter((_, ei) => ei !== exIdx) }
      : prev);

  const addDraftSet = (exIdx: number) =>
    setEditDraft(prev => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: SetState = {
          id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          weight: last ? last.weight : 0,
          reps: last ? last.reps : 5,
          rpe: last ? last.rpe : undefined,
          completed: true,
          type: last ? last.type : 'N',
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises };
    });

  const removeDraftSet = (exIdx: number, setIdx: number) =>
    setEditDraft(prev => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, ei) =>
        ei !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) });
      return { ...prev, exercises };
    });

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = search.trim()
    ? sorted.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const tonnage = (s: WorkoutSession) =>
    s.exercises.reduce((t, ex) => t + ex.sets.reduce((st, set) => st + (set.completed ? set.weight * set.reps : 0), 0), 0);

  // Group by month
  const groups: { label: string; sessions: WorkoutSession[] }[] = [];
  for (const s of filtered) {
    const label = monthLabel(s.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.sessions.push(s);
    } else {
      groups.push({ label, sessions: [s] });
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>HISTÓRICO</h1>

      <input
        type="search"
        placeholder="Buscar treino..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {filtered.length === 0 && (
        <div style={styles.empty}>
          {history.length === 0 ? 'Nenhum treino registrado ainda.' : 'Nenhum treino encontrado.'}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <div style={styles.monthLabel}>{group.label.toUpperCase()}</div>
          <div style={styles.list}>
            {group.sessions.map((s) => {
              const hasPr = s.exercises.some((ex) => ex.sets.some((set) => set.isPr));
              return (
                <button key={s.id} onClick={() => openModal(s)} style={styles.card}>
                  <div style={styles.cardTop}>
                    <span style={styles.name}>
                      {s.name}
                      {hasPr && <span style={styles.prBadge}>PR</span>}
                    </span>
                    <span style={styles.date}>{formatDate(s.date)}</span>
                  </div>
                  <div style={styles.stats}>
                    <span style={styles.stat}><Clock size={11} /> {formatDuration(s.duration)}</span>
                    <span style={styles.stat}><TrendingUp size={11} /> {Math.round(tonnage(s))} {u}</span>
                    <span style={styles.stat}>{s.exercises.length} ex</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Session detail modal */}
      {selected && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <h3 style={styles.modalTitle}>{selected.name}</h3>
                <span style={styles.modalDate}>{new Date(selected.date).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!editMode && (
                  <button
                    onClick={() => { onRepeat(selected); closeModal(); }}
                    style={styles.repeatBtn}
                    aria-label="Repetir este treino"
                  >
                    <RotateCcw size={14} /> Repetir
                  </button>
                )}
                {!editMode ? (
                  <button onClick={startEdit} style={styles.editBtn} aria-label="Editar sessão">
                    <Pencil size={14} />
                  </button>
                ) : (
                  <button onClick={cancelEdit} style={styles.editBtn} aria-label="Cancelar edição">
                    <X size={16} />
                  </button>
                )}
                {!editMode && (
                  <button onClick={() => setConfirmDelete(true)} style={styles.deleteBtn} aria-label="Excluir treino">
                    <Trash2 size={15} />
                  </button>
                )}
                {!editMode && (
                  <button onClick={closeModal} style={styles.closeBtn} aria-label="Fechar">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            <div style={styles.modalStats}>
              <span><Clock size={12} /> {formatDuration(selected.duration)}</span>
              <span><TrendingUp size={12} /> {Math.round(tonnage(selected))} {u}</span>
              {selected.exercises.some((ex) => ex.sets.some((s) => s.isPr)) && (
                <span style={{ color: 'var(--accent)' }}><Award size={12} /> PR</span>
              )}
            </div>
            <div style={styles.modalBody}>
              {!editMode ? (
                // Read-only view
                <>
                  {(() => {
                    const routineNote = selected.templateId
                      ? state.templates.find((t) => t.id === selected.templateId)?.notes
                      : undefined;
                    return routineNote ? <div style={styles.routineNote}>Nota da rotina: {routineNote}</div> : null;
                  })()}
                  {selected.exercises.map((ex) => (
                    <div key={ex.id} style={styles.exBlock}>
                      <div style={styles.exName}>{ex.name}</div>
                      {ex.sets.map((set, i) => (
                        <div key={set.id} style={styles.setRow}>
                          <span style={styles.setNum}>
                            {i + 1}{set.isPr && <span style={styles.prBadge}>PR</span>}
                          </span>
                          <span>
                            {set.weight} {u} × {set.reps}
                            {set.rpe ? ` · RPE ${set.rpe}` : ''}
                            {set.type !== 'N' ? ` · ${set.type === 'W' ? 'Aquec.' : 'Drop'}` : ''}
                          </span>
                          {!set.completed && <span style={styles.skipped}>não concluída</span>}
                        </div>
                      ))}
                      {ex.notes && <div style={styles.exNote}>{ex.notes}</div>}
                    </div>
                  ))}
                  {selected.notes && (
                    <div style={styles.notes}>{selected.notes}</div>
                  )}
                </>
              ) : (
                // Edit mode
                <>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700 }}>EDITANDO &mdash; mesmas ações do treino ao vivo</p>

                  <div style={styles.durationRow}>
                    <span style={styles.durationLabel}>Duração (min)</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={Math.round((editDraft?.duration ?? 0) / 60)}
                      onBlur={(e) => updateDraftDurationMin(e.target.value)}
                      style={{ ...styles.editInput, flex: '0 0 90px' }}
                    />
                  </div>

                  {(editDraft?.exercises ?? []).map((ex, exIdx) => (
                    <div key={ex.id} style={styles.exBlock}>
                      <div style={styles.exHeadEdit}>
                        <span style={styles.exName}>{ex.name}</span>
                        <button onClick={() => removeDraftExercise(exIdx)} style={styles.removeExBtn} aria-label="Remover exercício">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={styles.editHeader}>
                        <span style={{ flex: '0 0 22px' }}>#</span>
                        <span style={{ flex: 1 }}>Tipo</span>
                        <span style={{ flex: 1 }}>{u}</span>
                        <span style={{ flex: 1 }}>Reps</span>
                        <span style={{ flex: 1 }}>RPE</span>
                        <span style={{ flex: '0 0 28px' }} />
                        <span style={{ flex: '0 0 28px' }} />
                      </div>
                      {ex.sets.map((set, setIdx) => (
                        <div key={set.id} style={styles.editRow}>
                          <span style={{ flex: '0 0 22px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{setIdx + 1}</span>
                          <select
                            value={set.type}
                            onChange={(e) => updateDraftSetType(exIdx, setIdx, e.target.value as 'W' | 'N' | 'D')}
                            style={styles.editSelect}
                          >
                            <option value="N">N</option>
                            <option value="W">W</option>
                            <option value="D">D</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            defaultValue={set.weight}
                            onBlur={(e) => updateDraftSet(exIdx, setIdx, 'weight', e.target.value)}
                            style={styles.editInput}
                          />
                          <input
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={set.reps}
                            onBlur={(e) => updateDraftSet(exIdx, setIdx, 'reps', e.target.value)}
                            style={styles.editInput}
                          />
                          <input
                            type="number"
                            min={5}
                            max={10}
                            step={0.5}
                            defaultValue={set.rpe ?? ''}
                            placeholder="-"
                            onBlur={(e) => updateDraftSet(exIdx, setIdx, 'rpe', e.target.value)}
                            style={styles.editInput}
                          />
                          <button
                            type="button"
                            onClick={() => toggleDraftSetCompleted(exIdx, setIdx)}
                            style={{ ...styles.completedToggle, color: set.completed ? 'var(--accent)' : 'var(--text-muted)', borderColor: set.completed ? 'var(--accent-border)' : 'var(--border-color)' }}
                            title={set.completed ? 'Concluída — toque para desmarcar' : 'Não concluída — toque para marcar'}
                            aria-label="Alternar conclusão da série"
                            aria-pressed={set.completed}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => removeDraftSet(exIdx, setIdx)}
                            disabled={ex.sets.length <= 1}
                            style={{ ...styles.removeSetBtn, opacity: ex.sets.length <= 1 ? 0.3 : 1 }}
                            aria-label="Remover série"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addDraftSet(exIdx)} style={styles.addSetBtn}>
                        <Plus size={12} /> Série
                      </button>
                      <textarea
                        placeholder="Nota do exercício..."
                        value={ex.notes ?? ''}
                        onChange={(e) => updateDraftExerciseNotes(exIdx, e.target.value)}
                        style={styles.exNotesInput}
                      />
                    </div>
                  ))}

                  <button onClick={() => setShowAddEx(true)} style={styles.addExBtn}>
                    <Plus size={15} /> Adicionar exercício
                  </button>

                  <textarea
                    placeholder="Notas do treino..."
                    value={editDraft?.notes ?? ''}
                    onChange={(e) => updateDraftField({ notes: e.target.value })}
                    style={styles.sessionNotesInput}
                  />

                  <button onClick={saveEdit} style={styles.saveBtn}>
                    <Check size={15} /> Salvar alterações
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add exercise picker (edit mode) */}
      {showAddEx && (
        <div style={styles.overlay} onClick={() => { setShowAddEx(false); setAddExSearch(''); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h3 style={styles.modalTitle}>Adicionar exercício</h3>
              <button onClick={() => { setShowAddEx(false); setAddExSearch(''); }} style={styles.closeBtn} aria-label="Fechar"><X size={20} /></button>
            </div>
            <input
              type="text"
              placeholder="Buscar ou digitar exercício..."
              value={addExSearch}
              onChange={(e) => setAddExSearch(e.target.value)}
              style={styles.search}
              autoFocus
            />
            <div style={styles.suggestions}>
              {addExSearch.trim() && !EXERCISE_OPTIONS.some((o) => o.toLowerCase() === addExSearch.toLowerCase()) && (
                <button onClick={() => addDraftExercise(addExSearch)} style={{ ...styles.suggestion, color: 'var(--accent)', fontWeight: 700 }}>
                  Criar "{addExSearch}"
                </button>
              )}
              {EXERCISE_OPTIONS.filter((o) => o.toLowerCase().includes(addExSearch.toLowerCase())).map((name) => (
                <button key={name} onClick={() => addDraftExercise(name)} style={styles.suggestion}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete session confirmation */}
      {confirmDelete && (
        <div style={styles.overlay} onClick={() => setConfirmDelete(false)}>
          <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center', padding: '24px 20px' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
            <h3 style={styles.modalTitle}>Excluir treino</h3>
            <p style={styles.confirmDesc}>O treino será removido do histórico e os PRs serão recalculados. Esta ação não pode ser desfeita.</p>
            <div style={styles.confirmActions}>
              <button onClick={() => setConfirmDelete(false)} style={styles.confirmBack}>Voltar</button>
              <button onClick={removeSession} style={styles.confirmDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  title: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  search: { width: '100%', height: 40, padding: '0 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
  empty: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' },
  monthLabel: { fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, marginTop: 4 },
  list: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  card: { width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 },
  date: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },
  stats: { display: 'flex', gap: 12 },
  stat: { fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 },
  prBadge: { fontSize: '9px', fontWeight: 800, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' },
  modal: { width: '100%', maxWidth: 'var(--max-width)', margin: '0 auto', backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', maxHeight: '80dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 16px 10px' },
  modalTitle: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  modalDate: { fontSize: 12, color: 'var(--text-muted)' },
  modalStats: { display: 'flex', gap: 14, padding: '0 16px 12px', fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center', borderBottom: '1px solid var(--border-color)' },
  modalBody: { overflowY: 'auto', padding: '12px 16px 16px', flex: 1 },
  exBlock: { marginBottom: 14 },
  exName: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  setRow: { display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 3 },
  setNum: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 20, display: 'flex', alignItems: 'center', gap: 4 },
  skipped: { fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' },
  exNote: { fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 6, whiteSpace: 'pre-wrap' },
  routineNote: { fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: 10, whiteSpace: 'pre-wrap' },
  notes: { fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px 0', borderTop: '1px solid var(--border-color)', marginTop: 4, whiteSpace: 'pre-wrap' },
  repeatBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', padding: '7px 12px', borderRadius: 'var(--radius-sm)' },
  editBtn: { width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  durationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' },
  durationLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' },
  exHeadEdit: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  removeExBtn: { width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeSetBtn: { flex: '0 0 28px', height: 34, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  completedToggle: { flex: '0 0 28px', height: 34, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  addSetBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', marginTop: 6 },
  exNotesInput: { width: '100%', minHeight: 36, marginTop: 8, padding: '8px 10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  addExBtn: { width: '100%', height: 42, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' },
  sessionNotesInput: { width: '100%', minHeight: 56, marginTop: 12, padding: '10px 12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  suggestions: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '50dvh' },
  suggestion: { textAlign: 'left', padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)', background: 'transparent', borderBottom: '1px solid var(--border-color)' },
  confirmDesc: { fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 18px', lineHeight: 1.5 },
  confirmActions: { display: 'flex', gap: 10, width: '100%' },
  confirmBack: { flex: 1, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 },
  confirmDelete: { flex: 1, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--error)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700 },
  editHeader: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid var(--border-color)' },
  editRow: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 },
  editInput: { flex: 1, height: 34, textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, padding: '0 4px' },
  editSelect: { flex: 1, height: 34, textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12, padding: '0 2px' },
  saveBtn: { width: '100%', height: 42, marginTop: 12, backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

export default History;
