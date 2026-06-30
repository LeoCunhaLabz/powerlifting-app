import React, { useMemo, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { calculateE1RM } from '../utils/powerlifting';
import { Award } from 'lucide-react';

const isSBD = (name: string): boolean => {
  const n = name.toLowerCase();
  return n.includes('agachamento') || n.includes('squat') || n.includes('supino') || n.includes('bench') || n.includes('terra') || n.includes('deadlift');
};

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Página dedicada de recordes (PRs): todos os PRs do histórico, com filtro SBD/todos. */
export const PRs: React.FC = () => {
  const { state } = useWorkout();
  const { history, settings } = state;
  const u = settings.units;
  const [filter, setFilter] = useState<'all' | 'sbd'>('all');

  const prs = useMemo(() => {
    const out: { name: string; weight: number; reps: number; e1rm: number; date: string }[] = [];
    history.forEach((s) =>
      s.exercises.forEach((ex) =>
        ex.sets.forEach((set) => {
          if (set.completed && set.isPr) {
            out.push({ name: ex.name, weight: set.weight, reps: set.reps, e1rm: calculateE1RM(set.weight, set.reps, set.rpe), date: s.date });
          }
        }),
      ),
    );
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [history]);

  const filtered = filter === 'sbd' ? prs.filter((p) => isSBD(p.name)) : prs;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>RECORDES</h1>

      <div style={styles.segmented}>
        <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.segOn : styles.segOff}>Todos</button>
        <button onClick={() => setFilter('sbd')} style={filter === 'sbd' ? styles.segOn : styles.segOff}>SBD</button>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>{filter === 'sbd' ? 'Nenhum PR de SBD ainda.' : 'Nenhum recorde ainda. Continue progredindo!'}</div>
      ) : (
        <div style={styles.list}>
          {filtered.map((pr, idx) => (
            <div key={idx} style={styles.row}>
              <span style={styles.icon}><Award size={16} color="var(--accent)" /></span>
              <span style={styles.info}>
                <span style={styles.name}>{pr.name}</span>
                <span style={styles.sub}>{pr.weight} {u} × {pr.reps} · e1RM {Math.round(pr.e1rm)} {u}</span>
              </span>
              <span style={styles.date}>{fmtDate(pr.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  title: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  segmented: { display: 'flex', gap: 6, marginBottom: 14 },
  segOn: { flex: 1, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', fontSize: 12, fontWeight: 700 },
  segOff: { flex: 1, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontSize: 12, fontWeight: 700 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px' },
  icon: { width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  sub: { fontSize: 12, color: 'var(--text-secondary)' },
  date: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },
  empty: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0' },
};

export default PRs;
