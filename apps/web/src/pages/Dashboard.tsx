import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { WorkoutSession } from '@powerlifting/shared';
import { calculateE1RM, calculateDots } from '../utils/powerlifting';
import { Award, Flame, Play, Plus, TrendingUp, Clock, Eye, X, RotateCcw } from 'lucide-react';

interface DashboardProps {
  onStartWorkoutTab: () => void;
}

const SBD = ['Agachamento', 'Supino Reto', 'Levantamento Terra'] as const;

export const Dashboard: React.FC<DashboardProps> = ({ onStartWorkoutTab }) => {
  const { state, activeWorkout, getMaxE1RM, getBodyweightAt, startWorkout, repeatWorkout, logBodyweight, getNextTemplate } = useWorkout();
  const { history, settings, bodyweightLog, programs } = state;

  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [confirmRepeat, setConfirmRepeat] = useState<WorkoutSession | null>(null);
  const [metric, setMetric] = useState<'e1rm' | 'dots'>('e1rm');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isEvoHovered, setIsEvoHovered] = useState(false);

  const u = settings.units;

  // ---- Helpers ----
  const tonnage = (s: WorkoutSession) =>
    s.exercises.reduce((t, ex) => t + ex.sets.reduce((st, set) => st + (set.completed ? set.weight * set.reps : 0), 0), 0);

  const startOfWeek = (() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d.getTime();
  })();

  const weekSessions = history.filter((s) => new Date(s.date).getTime() >= startOfWeek);
  const weekTonnage = weekSessions.reduce((t, s) => t + tonnage(s), 0);

  const last4wStart = new Date().getTime() - 28 * 86400000;
  const freq = Math.round((history.filter((s) => new Date(s.date).getTime() >= last4wStart).length / 4) * 10) / 10;

  // Week streak (semanas consecutivas com ao menos 1 treino, terminando nesta semana)
  const weekStreak = (() => {
    const weeks = new Set(history.map((s) => Math.floor((new Date(s.date).getTime() - startOfWeek) / (7 * 86400000))));
    let streak = 0;
    let k = 0;
    while (weeks.has(-k) || (k === 0 && weeks.has(0))) {
      streak += 1;
      k += 1;
    }
    return streak;
  })();

  // SBD bests
  const bestE1RM = SBD.map((n) => getMaxE1RM(n));
  const bestTotal = Math.round(bestE1RM.reduce((a, b) => a + b, 0));
  const bw = getBodyweightAt(new Date().toISOString());
  const dots = calculateDots(bw, bestTotal, settings.gender === 'male');

  // Bodyweight trend
  const sortedBw = [...bodyweightLog].sort((a, b) => a.date.localeCompare(b.date));
  const bwTrend = sortedBw.length >= 2 ? Math.round((sortedBw[sortedBw.length - 1].weight - sortedBw[0].weight) * 10) / 10 : 0;

  // Evolution series (running best total e1RM / dots per session, chronological)
  const series = (() => {
    const chrono = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const best: Record<string, number> = {};
    const out: { total: number; dots: number }[] = [];
    chrono.forEach((s) => {
      s.exercises.forEach((ex) => {
        const ln = ex.name.toLowerCase();
        const key = SBD.find((n) => ln === n.toLowerCase());
        if (!key) return;
        ex.sets.forEach((set) => {
          if (set.completed) {
            const e = calculateE1RM(set.weight, set.reps, set.rpe);
            if (e > (best[key] || 0)) best[key] = e;
          }
        });
      });
      const total = SBD.reduce((a, n) => a + (best[n] || 0), 0);
      if (total > 0) out.push({ total: Math.round(total), dots: calculateDots(getBodyweightAt(s.date), total, settings.gender === 'male') });
    });
    return out.slice(-12);
  })();

  const polyline = (vals: number[], w: number, h: number, pad = 6) => {
    if (vals.length === 0) return '';
    if (vals.length === 1) return `0,${h / 2} ${w},${h / 2}`;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    return vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - pad - ((v - min) / span) * (h - pad * 2);
        return `${Math.round(x)},${Math.round(y)}`;
      })
      .join(' ');
  };

  const evoVals = series.map((p) => (metric === 'e1rm' ? p.total : p.dots));
  const bwVals = sortedBw.slice(-10).map((e) => e.weight);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yest.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };
  const formatDuration = (sec: number) => `${Math.floor(sec / 60)} min`;

  const suggestedTemplate = getNextTemplate();
  const activeProgram = programs.find((p) => p.isActive);
  const fromProgram = !!(activeProgram && suggestedTemplate && activeProgram.templateIds.includes(suggestedTemplate.id));
  const recentHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const handleResume = () => {
    if (!activeWorkout && suggestedTemplate) startWorkout(suggestedTemplate.id);
    onStartWorkoutTab();
  };
  const handleAvulso = () => {
    if (!activeWorkout) startWorkout();
    onStartWorkoutTab();
  };
  const saveWeight = () => {
    const val = Number(weightInput.replace(',', '.'));
    if (val > 0) {
      logBodyweight(val);
      setWeightInput('');
      setShowWeightInput(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>ONYX</div>
          <h1 style={styles.title}>Pronto pra treinar</h1>
        </div>
        {weekStreak > 0 && (
          <span style={styles.streak}>
            <Flame size={13} fill="currentColor" /> {weekStreak} sem
          </span>
        )}
      </div>

      {/* Resume / start hero */}
      <div style={{ ...styles.hero, ...(fromProgram && !activeWorkout ? styles.heroProgram : {}) }}>
        <div>
          <div style={styles.heroKicker}>
            {activeWorkout ? 'Em andamento' : fromProgram ? 'Próxima rotina do programa' : 'Próximo treino'}
          </div>
          <div style={styles.heroTitle}>{activeWorkout ? activeWorkout.name : suggestedTemplate?.name || 'Treino avulso'}</div>
          {!activeWorkout && suggestedTemplate && (
            <div style={styles.heroSub}>
              {fromProgram && activeProgram ? `${activeProgram.name} · ` : ''}{suggestedTemplate.exercises.length} exercícios
            </div>
          )}
        </div>
        <button onClick={handleResume} style={styles.heroPlay} aria-label="Iniciar">
          <Play size={22} fill="var(--accent-ink)" stroke="none" />
        </button>
      </div>
      <button onClick={handleAvulso} style={styles.avulsoBtn}>
        <Plus size={15} /> Treino avulso
      </button>

      {/* Week summary */}
      <div style={styles.sectionLabel}>Esta semana</div>
      <div style={styles.statGrid}>
        <div style={styles.statTile}><div style={styles.statVal}>{weekSessions.length}</div><div style={styles.statLbl}>SESSÕES</div></div>
        <div style={styles.statTile}><div style={styles.statVal}>{(weekTonnage / 1000).toFixed(1)}<span style={styles.unit}>t</span></div><div style={styles.statLbl}>TONELAGEM</div></div>
        <div style={styles.statTile}><div style={styles.statVal}>{freq}<span style={styles.unit}>/sem</span></div><div style={styles.statLbl}>FREQUÊNCIA</div></div>
      </div>

      {/* Bodyweight */}
      <div style={styles.bwCard}>
        <div style={styles.bwLeft}>
          <div style={styles.bwLabel}>Peso corporal</div>
          <div style={styles.bwValRow}>
            <span style={styles.bwVal}>{bw}</span>
            <span style={styles.bwUnit}>{u}</span>
            {bwTrend !== 0 && (
              <span style={{ ...styles.bwTrend, color: bwTrend > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                {bwTrend > 0 ? '↑' : '↓'} {Math.abs(bwTrend)}
              </span>
            )}
          </div>
        </div>
        <div style={styles.bwRight}>
          {bwVals.length >= 2 && (
            <svg width="74" height="34" viewBox="0 0 74 34" fill="none">
              <polyline points={polyline(bwVals, 74, 34, 4)} stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <button onClick={() => setShowWeightInput((v) => !v)} style={styles.bwAdd} aria-label="Registrar peso">
            <Plus size={18} />
          </button>
        </div>
      </div>
      {showWeightInput && (
        <div style={styles.weightInputRow}>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder={`Peso de hoje (${u})`}
            style={styles.weightInput}
          />
          <button onClick={saveWeight} style={styles.weightSave}>Registrar</button>
        </div>
      )}

      {/* Evolution */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}>Evolução</span>
          <div style={styles.toggle}>
            <button onClick={() => setMetric('e1rm')} style={metric === 'e1rm' ? styles.toggleOn : styles.toggleOff}>e1RM</button>
            <button onClick={() => setMetric('dots')} style={metric === 'dots' ? styles.toggleOn : styles.toggleOff}>DOTS</button>
          </div>
        </div>
        {evoVals.length >= 2 ? (
          <svg
            width="100%"
            height="84"
            viewBox="0 0 300 84"
            fill="none"
            preserveAspectRatio="none"
            onMouseEnter={() => setIsEvoHovered(true)}
            onMouseLeave={() => setIsEvoHovered(false)}
          >
            <polyline
              points={polyline(evoVals, 300, 84, 10)}
              stroke="var(--accent)"
              strokeWidth={isEvoHovered ? '2.9' : '2.4'}
              opacity={isEvoHovered ? 1 : 0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke-width var(--transition-fast), opacity var(--transition-fast)' }}
            />
          </svg>
        ) : (
          <div style={styles.emptyMini}>Registre treinos para ver sua evolução.</div>
        )}
      </div>

      {/* PR compact */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.prKicker}><Award size={14} /> RECORDES (e1RM)</span>
          <span style={styles.dotsBadge}>{dots} DOTS</span>
        </div>
        <div style={styles.prGrid}>
          {SBD.map((n, i) => (
            <div key={n} style={{ ...styles.prCol, ...(i === 1 ? styles.prColMid : {}) }}>
              <span style={styles.prLbl}>{i === 0 ? 'AGACH.' : i === 1 ? 'SUPINO' : 'TERRA'}</span>
              <span style={styles.prVal}>{bestE1RM[i]}</span>
            </div>
          ))}
        </div>
        <div style={styles.prFooter}>Total estimado <strong style={{ color: 'var(--text-primary)' }}>{bestTotal} {u}</strong></div>
      </div>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <>
          <div style={styles.sectionLabel}>Histórico recente</div>
          <div style={styles.historyList}>
            {recentHistory.slice(0, 4).map((s) => {
              const hasPr = s.exercises.some((ex) => ex.sets.some((set) => set.isPr));
              return (
                <button key={s.id} onClick={() => setSelectedSession(s)} style={styles.historyCard}>
                  <div style={styles.historyTop}>
                    <span style={styles.historyName}>{s.name}{hasPr && <span style={styles.prTag}>PR</span>}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRepeat(s); }}
                        style={styles.repeatBtn}
                        aria-label="Repetir treino"
                        title="Repetir treino"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <Eye size={15} color="var(--text-muted)" />
                    </div>
                  </div>
                  <div style={styles.historyStats}>
                    <span style={styles.hStat}>{formatDate(s.date)}</span>
                    <span style={styles.hStat}><Clock size={12} /> {formatDuration(s.duration)}</span>
                    <span style={styles.hStat}><TrendingUp size={12} /> {Math.round(tonnage(s))} {u}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Session detail modal */}
      {selectedSession && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSession(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{selectedSession.name}</h3>
                <span style={styles.modalDate}>{new Date(selectedSession.date).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => { setConfirmRepeat(selectedSession); }}
                  style={styles.repeatModalBtn}
                  aria-label="Repetir este treino"
                >
                  <RotateCcw size={14} /> Repetir
                </button>
                <button onClick={() => setSelectedSession(null)} style={styles.closeBtn} aria-label="Fechar"><X size={20} /></button>
              </div>
            </div>
            <div style={styles.modalBody}>
              {selectedSession.exercises.map((ex) => (
                <div key={ex.id} style={styles.modalEx}>
                  <div style={styles.modalExName}>{ex.name}</div>
                  {ex.sets.map((set, i) => (
                    <div key={set.id} style={styles.modalSet}>
                      <span>Série {i + 1}{set.isPr && <span style={styles.prTag}>PR</span>}</span>
                      <span>{set.weight} {u} × {set.reps}{set.rpe ? ` · RPE ${set.rpe}` : ''}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm repeat modal */}
      {confirmRepeat && (
        <div style={styles.modalOverlay} onClick={() => setConfirmRepeat(null)}>
          <div style={{ ...styles.modalContent, padding: '24px', alignItems: 'center', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <RotateCcw size={36} color="var(--accent)" style={{ marginBottom: 12 }} />
            <h3 style={styles.modalTitle}>Repetir treino?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 20px', lineHeight: 1.4 }}>
              {activeWorkout
                ? 'Há um treino em andamento. Iniciar este treino irá descartar o progresso atual.'
                : `Iniciar um novo treino baseado em "${confirmRepeat.name}".`}
            </p>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={() => setConfirmRepeat(null)} style={styles.closeBtn}>Cancelar</button>
              <button
                onClick={() => { repeatWorkout(confirmRepeat); setConfirmRepeat(null); setSelectedSession(null); onStartWorkoutTab(); }}
                style={{ flex: 1, height: 44, backgroundColor: activeWorkout ? 'var(--error)' : 'var(--accent)', color: activeWorkout ? '#fff' : 'var(--accent-ink)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 800 }}
              >
                {activeWorkout ? 'Descartar e iniciar' : 'Iniciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '15px',
  marginBottom: '14px',
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' },
  kicker: { fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-secondary)' },
  title: { fontSize: '23px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--text-primary)', marginTop: '2px' },
  streak: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '12px', fontWeight: 800, padding: '6px 11px', borderRadius: '999px' },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--accent-soft), transparent)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: '12px' },
  heroProgram: { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent-border)' },
  heroKicker: { fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' },
  heroTitle: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' },
  heroSub: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' },
  heroPlay: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avulsoBtn: { width: '100%', height: '44px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' },
  sectionLabel: { fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' },
  statTile: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '13px 10px' },
  statVal: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' },
  unit: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 },
  statLbl: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' },
  bwCard: { ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  bwLeft: {},
  bwLabel: { fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' },
  bwValRow: { display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' },
  bwVal: { fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' },
  bwUnit: { fontSize: '12px', color: 'var(--text-secondary)' },
  bwTrend: { fontSize: '11px', fontWeight: 700 },
  bwRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  bwAdd: { width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  weightInputRow: { display: 'flex', gap: '8px', margin: '10px 0 14px' },
  weightInput: { flex: 1, height: '42px' },
  weightSave: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '13px', padding: '0 18px' },
  card,
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  cardTitle: { fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' },
  toggle: { display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '2px' },
  toggleOn: { fontSize: '11px', fontWeight: 700, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '4px 10px', borderRadius: '7px' },
  toggleOff: { fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 10px' },
  emptyMini: { fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '18px 0' },
  prKicker: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text-secondary)' },
  dotsBadge: { fontSize: '11px', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '3px 9px', borderRadius: '6px' },
  prGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center' },
  prCol: { display: 'flex', flexDirection: 'column' },
  prColMid: { borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' },
  prLbl: { fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)' },
  prVal: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' },
  prFooter: { borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyCard: { textAlign: 'left', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' },
  historyTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  historyName: { fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  prTag: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' },
  historyStats: { display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' },
  hStat: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: 'var(--max-width)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', padding: '20px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  modalTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' },
  modalDate: { fontSize: '11px', color: 'var(--text-secondary)' },
  closeBtn: { color: 'var(--text-secondary)', padding: '4px' },
  repeatBtn: { color: 'var(--accent)', padding: '4px', display: 'flex', alignItems: 'center' },
  repeatModalBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '7px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 800 },
  modalBody: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' },
  modalEx: { borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' },
  modalExName: { fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' },
  modalSet: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', padding: '3px 0' },
};

export default Dashboard;
