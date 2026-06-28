import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Dumbbell, Trash2, Check, Clock, Play, AlertTriangle, Scale, Plus, X, RotateCcw, MessageSquare } from 'lucide-react';
import PlateVisualizer from '../components/PlateVisualizer';

const EXERCISE_OPTIONS = [
  'Agachamento', 'Supino Reto', 'Levantamento Terra', 'Desenvolvimento Militar',
  'Remada Curvada', 'Barra Fixa', 'Agachamento Frontal', 'Supino Inclinado',
  'Terra Romeno', 'Elevação Lateral', 'Tríceps Testa', 'Rosca Direta',
];

const TYPE_CYCLE: Record<'N' | 'W' | 'D', 'N' | 'W' | 'D'> = { N: 'W', W: 'D', D: 'N' };

export const Workout: React.FC = () => {
  const {
    activeWorkout, startWorkout, repeatWorkout, cancelWorkout, completeActiveWorkout,
    addExerciseToActiveWorkout, removeExerciseFromActiveWorkout, addSetToExercise,
    removeSetFromExercise, updateSet, updateWorkoutNotes, updateExerciseNotes, state, getMaxE1RM,
  } = useWorkout();
  const { settings, history } = state;
  const u = settings.units;

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [plateCalcTarget, setPlateCalcTarget] = useState({ exIdx: 0, setIdx: 0 });
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [confirmRemoveExIdx, setConfirmRemoveExIdx] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [openExNotes, setOpenExNotes] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!activeWorkout) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.date).getTime()) / 1000));
      const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
      setElapsed(h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [activeWorkout]);

  if (!activeWorkout) {
    const myTemplates = state.templates.filter((t) => !t.isBuiltIn && !t.archived);
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}><Dumbbell size={44} color="var(--text-secondary)" /></div>
        <h2 style={styles.emptyTitle}>Nenhum treino ativo</h2>
        <button onClick={() => startWorkout()} style={styles.startBtn}>
          <Play size={16} fill="var(--accent-ink)" stroke="none" /> Iniciar treino avulso
        </button>
        {history.length > 0 && (
          <button onClick={() => repeatWorkout(history[0])} style={styles.repeatLastBtn}>
            <RotateCcw size={15} /> Repetir último treino
          </button>
        )}
        {myTemplates.length > 0 && (
          <>
            <p style={{ ...styles.emptyDesc, marginTop: 24, marginBottom: 8 }}>Ou inicie uma rotina:</p>
            <div style={styles.templateList}>
              {myTemplates.map((t) => (
                <button key={t.id} onClick={() => startWorkout(t.id)} style={styles.templateRow}>
                  <span style={styles.templateAvatar}>{t.name.charAt(0).toUpperCase()}</span>
                  <span style={styles.templateTexts}>
                    <span style={styles.templateName}>{t.name}</span>
                    <span style={styles.templateSub}>{t.exercises.length} exercícios · {t.exercises.reduce((a, e) => a + e.sets.length, 0)} séries</span>
                  </span>
                  <Play size={14} fill="var(--accent)" stroke="none" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const lastPerf = (name: string, setIdx: number): string | null => {
    const ln = name.toLowerCase();
    for (const s of history) {
      const ex = s.exercises.find((e) => e.name.toLowerCase() === ln);
      if (ex) {
        const set = ex.sets[setIdx] || ex.sets[ex.sets.length - 1];
        if (set) return `${set.weight}×${set.reps}`;
      }
    }
    return null;
  };

  const openPlate = (exIdx: number, setIdx: number, w: number) => {
    setPlateCalcWeight(w || settings.barWeight || 60);
    setPlateCalcTarget({ exIdx, setIdx });
  };
  const applyPlate = () => {
    if (plateCalcWeight !== null) {
      updateSet(plateCalcTarget.exIdx, plateCalcTarget.setIdx, { weight: plateCalcWeight });
      setPlateCalcWeight(null);
    }
  };
  const addExercise = (name: string) => {
    addExerciseToActiveWorkout(name);
    setSearchQuery('');
    setShowAddExModal(false);
  };

  return (
    <div style={styles.container}>
      {/* App bar */}
      <div style={styles.appbar}>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>{activeWorkout.name}</h1>
          <span style={styles.timer}><Clock size={12} /> {elapsed}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={() => setShowConfirmCancel(true)} style={styles.discardBtn}>Descartar</button>
          <button onClick={() => setShowConfirmFinish(true)} style={styles.finishBtn}>Finalizar</button>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span style={styles.metaItem}>{activeWorkout.exercises.length} exercícios</span>
        <button onClick={() => setShowNotes((v) => !v)} style={styles.notesToggle}>
          {showNotes ? 'Ocultar notas' : 'Notas'}
        </button>
      </div>
      {showNotes && (
        <textarea
          placeholder="Notas do treino (clima, humor, dores...)"
          value={activeWorkout.notes || ''}
          onChange={(e) => updateWorkoutNotes(e.target.value)}
          style={styles.notes}
        />
      )}

      {/* Exercises */}
      <div style={styles.exList}>
        {activeWorkout.exercises.map((ex, exIdx) => (
          <div key={ex.id} style={styles.exCard}>
            <div style={styles.exHead}>
              <div>
                <div style={styles.exName}>{ex.name}</div>
                <div style={styles.exSub}>{(() => {
                  const e1rm = getMaxE1RM(ex.name);
                  const ws = ex.sets.find(s => s.type !== 'W');
                  const target = ws?.percentage && e1rm > 0
                    ? Math.round(e1rm * ws.percentage / 100 / 2.5) * 2.5
                    : null;
                  if (target) return `Alvo: ${target} ${u} · e1RM: ${e1rm} ${u}`;
                  return `e1RM: ${e1rm || '—'} ${u}`;
                })()}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setOpenExNotes(prev => {
                    const next = new Set(prev);
                    if (next.has(exIdx)) { next.delete(exIdx); } else { next.add(exIdx); }
                    return next;
                  })}
                  style={{ ...styles.exDel, color: (ex.notes || openExNotes.has(exIdx)) ? 'var(--accent)' : undefined }}
                  aria-label="Notas do exercício"
                  title="Notas do exercício"
                >
                  <MessageSquare size={15} />
                </button>
                <button onClick={() => setConfirmRemoveExIdx(exIdx)} style={styles.exDel} aria-label="Remover exercício"><Trash2 size={15} /></button>
              </div>
            </div>
            {(openExNotes.has(exIdx) || ex.notes) && (
              <textarea
                placeholder="Notas do exercício (técnica, observações...)"
                value={ex.notes || ''}
                onChange={(e) => updateExerciseNotes(exIdx, e.target.value)}
                style={{ ...styles.notes, marginTop: 4, marginBottom: 4 }}
              />
            )}

            <div style={styles.colHead}>
              <span>SÉRIE</span><span>ANT.</span><span style={styles.colC}>{u.toUpperCase()}</span><span style={styles.colC}>REPS</span><span style={styles.colC}>RPE</span><span></span>
            </div>

            {ex.sets.map((set, setIdx) => {
              const prev = lastPerf(ex.name, setIdx);
              return (
                <div key={set.id} style={{ ...styles.setRow, backgroundColor: set.completed ? 'var(--accent-soft)' : 'transparent' }}>
                  <button
                    onClick={() => updateSet(exIdx, setIdx, { type: TYPE_CYCLE[set.type] })}
                    style={{
                      ...styles.typeChip,
                      color: set.type === 'N' ? 'var(--text-secondary)' : 'var(--accent)',
                      borderColor: set.type === 'N' ? 'transparent' : 'var(--accent-border)',
                    }}
                    title="Tipo: Normal / Aquecimento / Drop"
                  >
                    {set.type === 'N' ? setIdx + 1 : set.type}
                  </button>
                  <span style={styles.prev}>{prev || '—'}</span>
                  <div style={styles.weightCell}>
                    <input type="number" inputMode="decimal" value={set.weight || ''} disabled={set.completed}
                      onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                      style={styles.field} placeholder="0" />
                    <button onClick={() => openPlate(exIdx, setIdx, set.weight)} style={styles.plateBtn} title="Montar anilhas"><Scale size={12} /></button>
                  </div>
                  <input type="number" inputMode="numeric" value={set.reps || ''} disabled={set.completed}
                    onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                    style={styles.field} placeholder="0" />
                  <select value={set.rpe || ''} disabled={set.completed}
                    onChange={(e) => updateSet(exIdx, setIdx, { rpe: e.target.value ? Number(e.target.value) : undefined })}
                    style={styles.rpe}>
                    <option value="">—</option>
                    {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                    style={{
                      ...styles.check,
                      backgroundColor: set.completed ? 'var(--accent)' : 'transparent',
                      borderColor: set.completed ? 'var(--accent)' : 'var(--border-color)',
                    }}
                  >
                    <Check size={15} strokeWidth={3.5} color={set.completed ? 'var(--accent-ink)' : 'var(--border-focus)'} />
                  </button>
                </div>
              );
            })}

            <div style={styles.exActions}>
              <button onClick={() => addSetToExercise(exIdx)} style={styles.addSet}><Plus size={14} /> Adicionar série</button>
              <button onClick={() => removeSetFromExercise(exIdx, ex.sets.length - 1)} disabled={ex.sets.length <= 1} style={styles.delSet}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowAddExModal(true)} style={styles.addEx}><Plus size={15} /> Adicionar exercício</button>

      {/* Add exercise modal */}
      {showAddExModal && (
        <div style={styles.overlay} onClick={() => setShowAddExModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h3 style={styles.modalTitle}>Adicionar exercício</h3>
              <button onClick={() => setShowAddExModal(false)} style={styles.close} aria-label="Fechar"><X size={20} /></button>
            </div>
            <input type="text" placeholder="Buscar ou digitar exercício..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} style={styles.search} autoFocus />
            <div style={styles.suggestions}>
              {searchQuery.trim() && !EXERCISE_OPTIONS.some((o) => o.toLowerCase() === searchQuery.toLowerCase()) && (
                <button onClick={() => addExercise(searchQuery)} style={{ ...styles.suggestion, color: 'var(--accent)', fontWeight: 700 }}>
                  Criar "{searchQuery}"
                </button>
              )}
              {EXERCISE_OPTIONS.filter((o) => o.toLowerCase().includes(searchQuery.toLowerCase())).map((name) => (
                <button key={name} onClick={() => addExercise(name)} style={styles.suggestion}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Remove exercise modal */}
      {confirmRemoveExIdx !== null && (
        <div style={styles.overlay} onClick={() => setConfirmRemoveExIdx(null)}>
          <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
            <h3 style={styles.modalTitle}>Remover exercício</h3>
            <p style={styles.confirmDesc}>O exercício e todas as suas séries serão removidos do treino.</p>
            <div style={styles.confirmActions}>
              <button onClick={() => setConfirmRemoveExIdx(null)} style={styles.confirmBack}>Voltar</button>
              <button onClick={() => { removeExerciseFromActiveWorkout(confirmRemoveExIdx); setConfirmRemoveExIdx(null); }} style={styles.confirmDiscard}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Finish confirmation modal */}
      {showConfirmFinish && (() => {
        const completedSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
        const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        return (
          <div style={styles.overlay} onClick={() => setShowConfirmFinish(false)}>
            <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Check size={40} color="var(--accent)" style={{ marginBottom: 12 }} />
              <h3 style={styles.modalTitle}>Finalizar treino?</h3>
              <p style={styles.confirmDesc}>{completedSets} de {totalSets} séries concluídas · {activeWorkout.exercises.length} exercícios.</p>
              <div style={styles.confirmActions}>
                <button onClick={() => setShowConfirmFinish(false)} style={styles.confirmBack}>Voltar</button>
                <button onClick={() => { completeActiveWorkout(); setShowConfirmFinish(false); }} style={styles.finishBtn}>Finalizar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Discard modal */}
      {showConfirmCancel && (
        <div style={styles.overlay} onClick={() => setShowConfirmCancel(false)}>
          <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
            <h3 style={styles.modalTitle}>Descartar treino</h3>
            <p style={styles.confirmDesc}>Todo o progresso registrado nesta sessão será perdido.</p>
            <div style={styles.confirmActions}>
              <button onClick={() => setShowConfirmCancel(false)} style={styles.confirmBack}>Voltar</button>
              <button onClick={() => { cancelWorkout(); setShowConfirmCancel(false); }} style={styles.confirmDiscard}>Descartar</button>
            </div>
          </div>
        </div>
      )}

      {/* Plate calc modal */}
      {plateCalcWeight !== null && (
        <div style={styles.overlay} onClick={() => setPlateCalcWeight(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h3 style={styles.modalTitle}>Calculadora de anilhas</h3>
              <button onClick={() => setPlateCalcWeight(null)} style={styles.close} aria-label="Fechar"><X size={20} /></button>
            </div>
            <div style={styles.plateAdjust}>
              <button onClick={() => setPlateCalcWeight((p) => Math.max(settings.barWeight, (p || 0) - 2.5))} style={styles.adjBtn}>−2.5</button>
              <div style={styles.plateVal}>{plateCalcWeight} <span style={styles.plateUnit}>{u}</span></div>
              <button onClick={() => setPlateCalcWeight((p) => (p || 0) + 2.5)} style={styles.adjBtn}>+2.5</button>
            </div>
            <PlateVisualizer weight={plateCalcWeight} barWeight={settings.barWeight} availablePlates={settings.availablePlates} units={u} />
            <button onClick={applyPlate} style={styles.applyPlate}>Aplicar peso à série</button>
          </div>
        </div>
      )}
    </div>
  );
};

const cols = '34px 52px 1fr 1fr 50px 38px';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px', textAlign: 'center' },
  emptyIcon: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  emptyTitle: { fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' },
  emptyDesc: { fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '300px', marginBottom: '24px' },
  startBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '12px 24px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' },
  repeatLastBtn: { marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px 22px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' },
  templateList: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 },
  templateRow: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'left' },
  templateAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  templateTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  templateName: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  templateSub: { fontSize: 11, color: 'var(--text-muted)' },
  appbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  titleWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  title: { fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--text-primary)' },
  timer: { display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)', padding: '3px 10px', borderRadius: '999px' },
  actions: { display: 'flex', gap: '8px' },
  discardBtn: { backgroundColor: 'rgba(229,84,75,0.1)', color: 'var(--error)', padding: '8px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '999px', border: '1px solid rgba(229,84,75,0.18)' },
  finishBtn: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '8px 18px', fontSize: '12px', fontWeight: 800, borderRadius: '999px' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  metaItem: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 },
  notesToggle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' },
  notes: { width: '100%', height: '54px', resize: 'none', marginBottom: '14px', backgroundColor: 'var(--bg-secondary)' },
  exList: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' },
  exCard: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px' },
  exHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' },
  exName: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  exSub: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  exDel: { color: 'var(--text-muted)', padding: '4px' },
  colHead: { display: 'grid', gridTemplateColumns: cols, gap: '8px', alignItems: 'center', fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '0 2px 8px' },
  colC: { textAlign: 'center' },
  setRow: { display: 'grid', gridTemplateColumns: cols, gap: '8px', alignItems: 'center', height: '52px', borderTop: '1px solid var(--border-color)', borderRadius: '8px', transition: 'background-color var(--transition-fast)' },
  typeChip: { width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  prev: { fontSize: '11px', color: 'var(--text-muted)' },
  weightCell: { display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', paddingRight: '4px', height: '38px' },
  field: { height: '38px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', width: '100%', padding: '0', minWidth: 0 },
  plateBtn: { color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 },
  rpe: { height: '38px', fontWeight: 700, fontSize: '13px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', width: '100%', textAlign: 'center', padding: '0 2px', minWidth: 0 },
  check: { width: '34px', height: '34px', borderRadius: '10px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  exActions: { display: 'flex', gap: '8px', marginTop: '12px' },
  addSet: { flex: 2, height: '42px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  delSet: { flex: 1, height: '42px', backgroundColor: 'transparent', border: '1px solid transparent', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' },
  addEx: { width: '100%', height: '46px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 'var(--max-width)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  modalTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  close: { color: 'var(--text-secondary)', padding: '4px' },
  search: { height: '44px', marginBottom: '12px' },
  suggestions: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' },
  suggestion: { textAlign: 'left', padding: '13px 8px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'none' },
  confirmDesc: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 },
  confirmActions: { display: 'flex', gap: '12px', width: '100%' },
  confirmBack: { flex: 1, height: '44px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' },
  confirmDiscard: { flex: 1, height: '44px', backgroundColor: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 800, color: '#fff' },
  plateAdjust: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '8px 0 16px' },
  adjBtn: { width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px' },
  plateVal: { fontSize: '34px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' },
  plateUnit: { fontSize: '14px', color: 'var(--text-secondary)' },
  applyPlate: { height: '48px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 800, fontSize: '14px', borderRadius: 'var(--radius-md)', marginTop: '16px', width: '100%' },
};

export default Workout;
