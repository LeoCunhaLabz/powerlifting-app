import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import type { WorkoutSession } from '@powerlifting/shared';
import { Clock, TrendingUp, Award, X, RotateCcw } from 'lucide-react';

interface HistoryProps {
  onRepeat: (session: WorkoutSession) => void;
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

export const History: React.FC<HistoryProps> = ({ onRepeat }) => {
  const { state } = useWorkout();
  const { history, settings } = state;
  const u = settings.units;

  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [search, setSearch] = useState('');

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
                <button key={s.id} onClick={() => setSelected(s)} style={styles.card}>
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
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div>
                <h3 style={styles.modalTitle}>{selected.name}</h3>
                <span style={styles.modalDate}>{new Date(selected.date).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => { onRepeat(selected); setSelected(null); }}
                  style={styles.repeatBtn}
                  aria-label="Repetir este treino"
                >
                  <RotateCcw size={14} /> Repetir
                </button>
                <button onClick={() => setSelected(null)} style={styles.closeBtn} aria-label="Fechar">
                  <X size={20} />
                </button>
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
                      </span>
                      {!set.completed && <span style={styles.skipped}>não concluída</span>}
                    </div>
                  ))}
                </div>
              ))}
              {selected.notes && (
                <div style={styles.notes}>{selected.notes}</div>
              )}
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
  notes: { fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px 0', borderTop: '1px solid var(--border-color)', marginTop: 4 },
  repeatBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', padding: '7px 12px', borderRadius: 'var(--radius-sm)' },
  closeBtn: { width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default History;
