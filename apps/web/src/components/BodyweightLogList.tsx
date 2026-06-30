import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Trash2, Check, Pencil, X } from 'lucide-react';

/**
 * Lista editável dos registros de peso corporal (bodyweightLog): ver, editar e excluir.
 * Reutiliza logBodyweight (upsert por dia) e deleteBodyweightEntry do contexto.
 */
export const BodyweightLogList: React.FC = () => {
  const { state, logBodyweight, deleteBodyweightEntry } = useWorkout();
  const { bodyweightLog, settings } = state;
  const u = settings.units;

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sorted = [...bodyweightLog].sort((a, b) => b.date.localeCompare(a.date));

  const startEdit = (date: string, weight: number) => {
    setEditingDate(date);
    setEditValue(String(weight));
  };

  const saveEdit = (date: string) => {
    const val = Number(editValue.replace(',', '.'));
    if (val > 0) logBodyweight(val, date);
    setEditingDate(null);
    setEditValue('');
  };

  if (sorted.length === 0) {
    return <div style={styles.empty}>Nenhum registro de peso ainda.</div>;
  }

  return (
    <div style={styles.list}>
      {sorted.map((e) => (
        <div key={e.date} style={styles.row}>
          <span style={styles.date}>
            {new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {editingDate === e.date ? (
            <div style={styles.editWrap}>
              <input
                type="number"
                inputMode="decimal"
                autoFocus
                value={editValue}
                onChange={(ev) => setEditValue(ev.target.value)}
                onKeyDown={(ev) => { if (ev.key === 'Enter') saveEdit(e.date); }}
                style={styles.input}
              />
              <button onClick={() => saveEdit(e.date)} style={styles.iconBtnAccent} aria-label="Salvar"><Check size={15} /></button>
              <button onClick={() => { setEditingDate(null); setEditValue(''); }} style={styles.iconBtn} aria-label="Cancelar"><X size={15} /></button>
            </div>
          ) : (
            <div style={styles.editWrap}>
              <span style={styles.weight}>{e.weight} {u}</span>
              <button onClick={() => startEdit(e.date, e.weight)} style={styles.iconBtn} aria-label="Editar"><Pencil size={14} /></button>
              <button onClick={() => deleteBodyweightEntry(e.date)} style={styles.iconBtnDanger} aria-label="Excluir"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  list: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '46dvh', overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' },
  date: { fontSize: 13, color: 'var(--text-secondary)' },
  weight: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  editWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  input: { width: 70, height: 32, padding: '0 8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center' },
  iconBtn: { width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnAccent: { width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', border: 'none', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' },
};

export default BodyweightLogList;
