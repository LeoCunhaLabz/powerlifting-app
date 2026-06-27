import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { TemplateExercise } from '@powerlifting/shared';
import { Plus, Trash2, Play, X, ChevronRight, AlertTriangle } from 'lucide-react';

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
  const { state, saveTemplate, deleteTemplate, startWorkout } = useWorkout();
  const { templates } = state;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'mine' | 'builtin'>('mine');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prescription, setPrescription] = useState<Prescription>('percent');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [searchExercise, setSearchExercise] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    setName(''); setDescription(''); setExercises([]); setPrescription('percent'); setIsCreating(false);
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
    saveTemplate({ name, description, exercises: cleaned });
    resetForm();
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>ROTINAS</h1>
        <button onClick={() => setIsCreating(true)} style={styles.newBtn}><Plus size={15} /> Nova</button>
      </div>

      {/* Segmented filter */}
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
                      <button onClick={() => setConfirmDeleteId(tpl.id)} style={styles.delBtn}><Trash2 size={14} /> Excluir</button>
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
              <button onClick={resetForm} style={styles.close}><X size={20} /></button>
              <h2 style={styles.overlayTitle}>Criar rotina</h2>
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
};

export default Templates;
