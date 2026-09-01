import React from 'react';
import type { WorkoutSession, WorkoutTemplate } from '@powerlifting/shared';

interface SessionDetailProps {
  session: WorkoutSession;
  templates: WorkoutTemplate[];
  units: 'kg' | 'lbs';
}

/**
 * Detalhe read-only de uma sessão de treino: exercícios, séries (peso, reps, RPE,
 * tipo N/W/D, badge de PR, séries não concluídas) e notas. Extraído de History.tsx
 * para ser reutilizado em outros lugares que mostram detalhe de sessão (ex.: Calendário).
 */
export const SessionDetail: React.FC<SessionDetailProps> = ({ session, templates, units }) => {
  const routineNote = session.templateId
    ? templates.find((t) => t.id === session.templateId)?.notes
    : undefined;

  return (
    <>
      {routineNote && <div style={styles.routineNote}>Nota da rotina: {routineNote}</div>}
      {session.exercises.map((ex) => (
        <div key={ex.id} style={styles.exBlock}>
          <div style={styles.exName}>{ex.name}</div>
          {ex.sets.map((set, i) => (
            <div key={set.id} style={styles.setRow}>
              <span style={styles.setNum}>
                {i + 1}{set.isPr && <span style={styles.prBadge}>PR</span>}
              </span>
              <span>
                {set.weight} {units} × {set.reps}
                {set.rpe ? ` · RPE ${set.rpe}` : ''}
                {set.type !== 'N' ? ` · ${set.type === 'W' ? 'Aquec.' : 'Drop'}` : ''}
              </span>
              {!set.completed && <span style={styles.skipped}>não concluída</span>}
            </div>
          ))}
          {ex.notes && <div style={styles.exNote}>{ex.notes}</div>}
        </div>
      ))}
      {session.notes && (
        <div style={styles.notes}>{session.notes}</div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  routineNote: { fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: 10, whiteSpace: 'pre-wrap' },
  exBlock: { marginBottom: 14 },
  exName: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  setRow: { display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 3 },
  setNum: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 20, display: 'flex', alignItems: 'center', gap: 4 },
  prBadge: { fontSize: '9px', fontWeight: 800, color: 'var(--accent-ink)', background: 'var(--accent)', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' },
  skipped: { fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' },
  exNote: { fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 6, whiteSpace: 'pre-wrap' },
  notes: { fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px 0', borderTop: '1px solid var(--border-color)', marginTop: 4, whiteSpace: 'pre-wrap' },
};

export default SessionDetail;
