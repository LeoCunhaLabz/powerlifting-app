import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Plus, Trash2, Dumbbell } from 'lucide-react';

export const CustomExercises: React.FC = () => {
  const { state, addCustomExercise, removeCustomExercise } = useWorkout();
  const { customExercises } = state;
  const [name, setName] = useState('');

  const sorted = [...customExercises].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleAdd = () => {
    const saved = addCustomExercise(name);
    if (saved) setName('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>EXERCÍCIOS</h1>
      <p style={styles.subtitle}>
        Crie exercícios reutilizáveis. Eles aparecem na busca ao montar rotinas e durante o treino.
      </p>

      <div style={styles.addRow}>
        <input
          type="text"
          placeholder="Nome do exercício..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          style={styles.input}
        />
        <button onClick={handleAdd} disabled={!name.trim()} style={{ ...styles.addBtn, opacity: name.trim() ? 1 : 0.4 }} aria-label="Adicionar exercício">
          <Plus size={18} />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={styles.empty}>
          <Dumbbell size={40} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
          <span>Nenhum exercício customizado ainda.</span>
        </div>
      ) : (
        <div style={styles.list}>
          {sorted.map((ex) => (
            <div key={ex.id} style={styles.row}>
              <span style={styles.exName}>{ex.name}</span>
              <button onClick={() => removeCustomExercise(ex.id)} style={styles.delBtn} aria-label={`Excluir ${ex.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  title: { fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  subtitle: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 },
  addRow: { display: 'flex', gap: 8, marginBottom: 16 },
  input: { flex: 1, height: 44, padding: '0 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' },
  addBtn: { width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '40px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px' },
  exName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  delBtn: { width: 34, height: 34, flexShrink: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default CustomExercises;
