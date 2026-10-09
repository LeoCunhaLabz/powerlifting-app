import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Dumbbell, Check, Clock, Play, Plus, X, RotateCcw, Award, TrendingUp } from 'lucide-react';
import { ExerciseCard } from '../components/workout/ExerciseCard/ExerciseCard';
import { FinishSheet } from '../components/workout/FinishSheet/FinishSheet';
import { PlateSheet } from '../components/workout/PlateSheet/PlateSheet';
import { WorkoutHeader } from '../components/workout/WorkoutHeader/WorkoutHeader';
import { Button } from '../ui';
import { useTemplateStart } from '../hooks/useTemplateStart';
import { EXERCISE_OPTIONS } from '../utils/exerciseOptions';
import { formatCompact } from '../utils/format';
import { currentSetIndex, findCurrentSet, finishSummary, firstPendingSet, setLabel } from '../utils/workoutSets';
import type { ExerciseState, WorkoutTemplate } from '@powerlifting/shared';

// Aqui o treino começa na própria aba: nada a fazer depois de iniciar.
const NOOP = () => {};

export const Workout: React.FC = () => {
  const {
    activeWorkout, startWorkout, repeatWorkout, cancelWorkout, completeActiveWorkout,
    addExerciseToActiveWorkout, removeExerciseFromActiveWorkout, addSetToExercise,
    removeSetFromExercise, updateSet, updateWorkoutNotes, updateExerciseNotes, state, getMaxE1RM,
    addCustomExercise, getNextTemplate,
  } = useWorkout();
  const { settings, history, customExercises, programs } = state;
  const u = settings.units;
  // Rotina por %1RM sem máximo pergunta antes os máximos (#336).
  const templateStart = useTemplateStart(NOOP);

  // Sugestões = exercícios embutidos + customizados do usuário (sem duplicar nome)
  const exerciseOptions = React.useMemo(() => {
    const seen = new Set(EXERCISE_OPTIONS.map((o) => o.toLowerCase()));
    const merged = [...EXERCISE_OPTIONS];
    for (const c of customExercises) {
      if (c.deleted) continue;
      if (!seen.has(c.name.toLowerCase())) { seen.add(c.name.toLowerCase()); merged.push(c.name); }
    }
    return merged;
  }, [customExercises]);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Anilhas: exercício, série que recebe a carga (-1 = todas feitas) e a carga montada.
  const [plate, setPlate] = useState<{ exIdx: number; setIdx: number; weight: number } | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<typeof history[number] | null>(null);
  // Id da sessão finalizada, à espera de entrar no history para abrir o resumo.
  const pendingFinishRef = useRef<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  // Procura pelo id, não pelo history[0]: um efeito pendente de um render anterior (ex.: merge
  // de sync) pode rodar logo depois do clique em Finalizar, ainda com o history antigo.
  useEffect(() => {
    const id = pendingFinishRef.current;
    if (!id) return;
    const finished = history.find((h) => h.id === id);
    if (finished) {
      pendingFinishRef.current = null;
      setWorkoutSummary(finished);
    }
  }, [history]);

  // Chave estável dos nomes dos exercícios: deps dos memos abaixo sem invalidar
  // a cada keystroke (updateSet recria os arrays de sets, não os nomes) (#267).
  const exerciseNamesKey = activeWorkout ? activeWorkout.exercises.map((e) => e.name).join('\n') : '';

  // e1RM por exercício: uma varredura do history por exercício, não por render × exercício (#267)
  const e1rmByExercise = useMemo(() => {
    const m = new Map<string, number>();
    if (!exerciseNamesKey) return m;
    for (const name of exerciseNamesKey.split('\n')) {
      const key = name.toLowerCase();
      if (!m.has(key)) m.set(key, getMaxE1RM(name));
    }
    return m;
  }, [exerciseNamesKey, getMaxE1RM]);

  // Exercício-fonte da coluna "ANT." por nome: evita varrer o history por série (#267)
  const prevExByName = useMemo(() => {
    const m = new Map<string, ExerciseState>();
    if (!exerciseNamesKey) return m;
    for (const name of exerciseNamesKey.split('\n')) {
      const key = name.toLowerCase();
      if (m.has(key)) continue;
      for (const s of history) {
        const ex = s.exercises.find((e) => e.name.toLowerCase() === key);
        if (ex) { m.set(key, ex); break; }
      }
    }
    return m;
  }, [exerciseNamesKey, history]);

  if (!activeWorkout) {
    if (workoutSummary) {
      const summaryTonnage = workoutSummary.exercises.reduce(
        (t, ex) => t + ex.sets.reduce((st, s) => st + s.weight * s.reps, 0), 0
      );
      const prCount = workoutSummary.exercises.reduce(
        (n, ex) => n + ex.sets.filter((s) => s.isPr).length, 0
      );
      const dur = workoutSummary.duration;
      const dh = Math.floor(dur / 3600), dm = Math.floor((dur % 3600) / 60), ds = dur % 60;
      const durStr = dh > 0 ? `${dh}:${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}` : `${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '24px 0', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--accent-soft)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Check size={36} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Treino concluído</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 20 }}>{workoutSummary.name}</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 20 }}>
            {[
              { icon: <Clock size={18} color="var(--accent)" />, val: durStr, lbl: 'Duração' },
              { icon: <TrendingUp size={18} color="var(--accent)" />, val: `${Math.round(summaryTonnage)}`, lbl: `Volume (${u})` },
              { icon: <Award size={18} color="var(--accent)" />, val: String(prCount), lbl: prCount === 1 ? 'PR' : 'PRs' },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 8px' }}>
                {icon}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: 16, textAlign: 'left' }}>
            {workoutSummary.exercises.map((ex) => (
              <div key={ex.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ex.name}
                  {ex.sets.some((s) => s.isPr) && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '1px 5px', borderRadius: 4 }}>PR</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ex.sets.map((s, i) => `${i + 1}. ${s.weight}×${s.reps}`).join(' · ')}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setWorkoutSummary(null)} style={{ width: '100%', height: 44, backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 800 }}>
            Concluir
          </button>
        </div>
      );
    }

    const myTemplates = state.templates.filter((t) => !t.isBuiltIn && !t.archived && !t.deleted);
    const activeProgram = programs.find((p) => p.isActive);
    const nextTemplate = getNextTemplate();
    const nextFromProgram = !!(activeProgram && nextTemplate && activeProgram.templateIds.includes(nextTemplate.id));
    // A mesma sugestão do Início (#336): com histórico, o próximo treino; sem, treino avulso e rotinas prontas.
    const showNext = !!nextTemplate && (nextFromProgram || history.length > 0);
    const builtInTemplates = state.templates.filter((t) => t.isBuiltIn && !t.archived && !t.deleted && !(showNext && t.id === nextTemplate?.id));

    // Rotinas do programa ativo (na ordem do programa), exceto a "próxima" já destacada.
    const programTemplates = activeProgram
      ? activeProgram.templateIds
          .map((id) => myTemplates.find((t) => t.id === id))
          .filter((t): t is WorkoutTemplate => !!t)
      : [];
    const otherProgramTemplates = programTemplates.filter((t) => t.id !== nextTemplate?.id);
    // Rotinas avulsas: minhas rotinas que não pertencem ao programa ativo.
    const programIdSet = new Set(programTemplates.map((t) => t.id));
    const standaloneTemplates = myTemplates.filter((t) => !programIdSet.has(t.id));

    const renderTemplateRow = (t: WorkoutTemplate) => (
      <button key={t.id} onClick={() => templateStart.start(t.id)} style={styles.templateRow}>
        <span style={styles.templateAvatar}>{t.name.charAt(0).toUpperCase()}</span>
        <span style={styles.templateTexts}>
          <span style={styles.templateName}>{t.name}</span>
          <span style={styles.templateSub}>{t.exercises.length} exercícios · {t.exercises.reduce((a, e) => a + e.sets.length, 0)} séries</span>
        </span>
        <Play size={14} fill="var(--text-2)" stroke="none" aria-hidden="true" />
      </button>
    );

    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}><Dumbbell size={44} color="var(--text-secondary)" /></div>
        <h2 style={styles.emptyTitle}>Nenhum treino ativo</h2>

        {/* Modo 1 — Próximo treino (do programa ou do rodízio das rotinas), como no Início */}
        {showNext && nextTemplate && (
          <button onClick={() => templateStart.start(nextTemplate.id)} style={styles.nextProgramCard}>
            <span style={styles.nextProgramKicker}>{nextFromProgram && activeProgram ? `Próxima rotina · ${activeProgram.name}` : 'Próximo treino'}</span>
            <span style={styles.nextProgramName}>{nextTemplate.name}</span>
            <span style={styles.nextProgramSub}>
              {nextTemplate.exercises.length} exercícios · {nextTemplate.exercises.reduce((a, e) => a + e.sets.length, 0)} séries
            </span>
            <span style={styles.nextProgramPlay}><Play size={16} fill="var(--accent-ink)" stroke="none" /> Começar</span>
          </button>
        )}
        {otherProgramTemplates.length > 0 && (
          <>
            <p style={styles.sectionHeader}>Prefere outra rotina do programa?</p>
            <div style={styles.templateList}>{otherProgramTemplates.map(renderTemplateRow)}</div>
          </>
        )}

        {/* Modo 2 — Rotina avulsa */}
        {standaloneTemplates.length > 0 && (
          <>
            <p style={styles.sectionHeader}>{activeProgram ? 'Outras rotinas' : 'Iniciar uma rotina'}</p>
            <div style={styles.templateList}>{standaloneTemplates.map(renderTemplateRow)}</div>
          </>
        )}

        {/* Sem rotina própria: as rotinas prontas (#336) */}
        {myTemplates.length === 0 && builtInTemplates.length > 0 && (
          <>
            <p style={styles.sectionHeader}>Rotinas prontas</p>
            <div style={styles.templateList}>{builtInTemplates.map(renderTemplateRow)}</div>
          </>
        )}

        {/* Modo 3 — Treino vazio ou repetir sem vínculo */}
        <p style={styles.sectionHeader}>Sem rotina</p>
        {/* Um primário por tela (#340): com o próximo treino em destaque, ele é a ação dourada. */}
        <Button
          variant={showNext ? 'secondary' : 'primary'}
          icon={<Play size={16} fill="currentColor" stroke="none" />}
          onClick={() => startWorkout()}
        >
          Iniciar treino avulso
        </Button>
        {history.length > 0 && (
          <button onClick={() => repeatWorkout(history[0])} style={styles.repeatLastBtn}>
            <RotateCcw size={15} /> Repetir último treino
          </button>
        )}
        {templateStart.sheet}
      </div>
    );
  }

  const lastPerf = (name: string, setIdx: number): string | null => {
    const prevEx = prevExByName.get(name.toLowerCase());
    if (!prevEx) return null;
    const set = prevEx.sets[setIdx] || prevEx.sets[prevEx.sets.length - 1];
    return set ? `${formatCompact(set.weight)} × ${set.reps}` : null;
  };

  const currentSet = findCurrentSet(activeWorkout.exercises);
  const summary = finishSummary(activeWorkout.exercises);

  // "Revisar séries" (#328): fecha a folha e leva à primeira série sem check. A folha desmonta
  // no clique; o rAF roda depois do commit, com a lista já sem o <dialog> por cima.
  const reviewPending = () => {
    setShowFinish(false);
    const first = firstPendingSet(activeWorkout.exercises);
    if (!first) return;
    const id = activeWorkout.exercises[first.exIdx].sets[first.setIdx].id;
    requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-set-id="${CSS.escape(id)}"]`);
      if (!row) return;
      row.querySelector('button')?.focus({ preventScroll: true });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      row.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    });
  };

  // Abre com a carga da próxima série pendente do exercício (ou da última, se todas foram feitas).
  const openPlates = (exIdx: number) => {
    const sets = activeWorkout.exercises[exIdx].sets;
    const setIdx = currentSetIndex(sets.map((s) => s.completed));
    const base = setIdx !== -1 ? sets[setIdx].weight : sets[sets.length - 1]?.weight;
    setPlate({ exIdx, setIdx, weight: base || settings.barWeight || 60 });
  };
  const applyPlate = () => {
    if (plate && plate.setIdx !== -1) updateSet(plate.exIdx, plate.setIdx, { weight: plate.weight });
    setPlate(null);
  };
  const addExercise = (name: string) => {
    addExerciseToActiveWorkout(name);
    setSearchQuery('');
    setShowAddExModal(false);
  };
  // Cria um exercício novo: persiste como customizado (reutilizável) e adiciona ao treino
  const createAndAddExercise = (name: string) => {
    const saved = addCustomExercise(name);
    addExercise(saved || name.trim());
  };

  return (
    <div style={styles.container}>
      <WorkoutHeader
        name={activeWorkout.name}
        startIso={activeWorkout.date}
        done={summary.done}
        total={summary.total}
        onFinish={() => setShowFinish(true)}
      />

      {(() => {
        const routineNote = activeWorkout.templateId
          ? state.templates.find((t) => t.id === activeWorkout.templateId)?.notes
          : undefined;
        return routineNote ? (
          <div style={styles.routineNote}>
            <span style={styles.routineNoteLabel}>Nota da rotina</span>
            <span style={styles.routineNoteText}>{routineNote}</span>
          </div>
        ) : null;
      })()}

      <div style={styles.metaRow}>
        <span style={styles.metaItem}>{activeWorkout.exercises.length} exercícios</span>
        <button onClick={() => setShowNotes((v) => !v)} style={styles.notesToggle}>
          {showNotes ? 'Ocultar notas' : 'Notas da sessão'}
        </button>
      </div>
      {showNotes && (
        <textarea
          placeholder="Notas da sessão (clima, humor, dores...)"
          value={activeWorkout.notes || ''}
          onChange={(e) => updateWorkoutNotes(e.target.value)}
          style={styles.notes}
        />
      )}

      {/* Exercises */}
      <div style={styles.exList}>
        {activeWorkout.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            units={u}
            e1rm={e1rmByExercise.get(ex.name.toLowerCase()) ?? 0}
            currentSetIdx={currentSet?.exIdx === exIdx ? currentSet.setIdx : -1}
            previousFor={(setIdx) => lastPerf(ex.name, setIdx)}
            onUpdateSet={(setIdx, fields) => updateSet(exIdx, setIdx, fields)}
            onAddSet={() => addSetToExercise(exIdx)}
            onRemoveSet={(setIdx) => removeSetFromExercise(exIdx, setIdx)}
            onNotesChange={(notes) => updateExerciseNotes(exIdx, notes)}
            onRemove={() => removeExerciseFromActiveWorkout(exIdx)}
            onOpenPlates={() => openPlates(exIdx)}
          />
        ))}
      </div>

      <button onClick={() => setShowAddExModal(true)} style={styles.addEx}><Plus size={15} /> Adicionar exercício</button>

      <Button variant="primary" size="lg" block onClick={() => setShowFinish(true)}>Finalizar treino</Button>

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
              {searchQuery.trim() && !exerciseOptions.some((o) => o.toLowerCase() === searchQuery.toLowerCase()) && (
                <button onClick={() => createAndAddExercise(searchQuery)} style={{ ...styles.suggestion, color: 'var(--accent)', fontWeight: 700 }}>
                  Criar "{searchQuery}"
                </button>
              )}
              {exerciseOptions.filter((o) => o.toLowerCase().includes(searchQuery.toLowerCase())).map((name) => (
                <button key={name} onClick={() => addExercise(name)} style={styles.suggestion}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFinish && (
        <FinishSheet
          summary={summary}
          onClose={() => setShowFinish(false)}
          onReview={reviewPending}
          // Sem séries concluídas nada entra no history: não arma o pendingFinishRef.
          onFinish={() => { pendingFinishRef.current = summary.done > 0 ? activeWorkout.id : null; completeActiveWorkout(); setShowFinish(false); }}
          onDiscard={() => { cancelWorkout(); setShowFinish(false); }}
        />
      )}

      {plate && (() => {
        const ex = activeWorkout.exercises[plate.exIdx];
        const target = plate.setIdx !== -1
          ? { type: ex.sets[plate.setIdx].type, label: setLabel(ex.sets, plate.setIdx) }
          : null;
        return (
          <PlateSheet
            exerciseName={ex.name}
            target={target}
            weight={plate.weight}
            onWeightChange={(weight) => setPlate({ ...plate, weight })}
            barWeight={settings.barWeight}
            plates={[...new Set([...settings.availablePlates, ...settings.customPlates])].sort((a, b) => b - a)}
            units={u}
            onApply={applyPlate}
            onClose={() => setPlate(null)}
          />
        );
      })()}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px', textAlign: 'center' },
  emptyIcon: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  emptyTitle: { fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' },
  emptyDesc: { fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '300px', marginBottom: '24px' },
  nextProgramCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, width: '100%', maxWidth: 320, marginBottom: 16, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'left' },
  nextProgramKicker: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  nextProgramName: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 },
  nextProgramSub: { fontSize: 12, color: 'var(--text-secondary)' },
  nextProgramPlay: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 800, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '7px 14px', borderRadius: 'var(--radius-sm)' },
  sectionHeader: { width: '100%', maxWidth: 320, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 22, marginBottom: 8, textAlign: 'left' },
  repeatLastBtn: { marginTop: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px 22px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' },
  templateList: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 },
  templateRow: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'left' },
  templateAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--surface-3)', color: 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  templateTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  templateName: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  templateSub: { fontSize: 11, color: 'var(--text-muted)' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  metaItem: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 },
  routineNote: { display: 'flex', flexDirection: 'column', gap: 3, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: 10 },
  routineNoteLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' },
  routineNoteText: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  notesToggle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' },
  notes: { width: '100%', height: '54px', resize: 'none', marginBottom: '14px', backgroundColor: 'var(--bg-secondary)' },
  exList: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' },
  addEx: { width: '100%', height: '46px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 'var(--max-width)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  modalTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  close: { color: 'var(--text-secondary)', padding: '4px' },
  search: { height: '44px', marginBottom: '12px' },
  suggestions: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' },
  suggestion: { textAlign: 'left', padding: '13px 8px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'none' },
};

export default Workout;
