import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Calculator, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { calculateDots } from '../utils/powerlifting';

// Abas que vivem dentro do hub "Mais" (Análises agora fica na barra inferior)
export type MoreTab = 'calculators' | 'settings';

interface MoreProps {
  onNavigate: (tab: MoreTab) => void;
}

interface MoreItem {
  tab: MoreTab;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

export const More: React.FC<MoreProps> = ({ onNavigate }) => {
  const { state, getMaxE1RM, getBodyweightAt } = useWorkout();
  const { settings } = state;

  const bestTotal =
    getMaxE1RM('Agachamento') + getMaxE1RM('Supino Reto') + getMaxE1RM('Levantamento Terra');
  const bw = getBodyweightAt(new Date().toISOString());
  const dots = calculateDots(bw, bestTotal, settings.gender === 'male');

  const items: MoreItem[] = [
    {
      tab: 'calculators',
      label: 'Calculadoras',
      desc: 'Montagem de anilhas e pontuações Wilks/DOTS/IPF GL',
      icon: <Calculator size={22} />,
    },
    {
      tab: 'settings',
      label: 'Configurações',
      desc: 'Tema, unidades, barra, anilhas e backup dos dados',
      icon: <SettingsIcon size={22} />,
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>MAIS</h1>

      {/* Resumo do atleta */}
      <div style={styles.summary}>
        <span style={styles.avatar}>A</span>
        <div style={styles.summaryInfo}>
          <div style={styles.summaryName}>Atleta · {bw} {settings.units}</div>
          <div style={styles.summaryStats}>
            Total {Math.round(bestTotal)} {settings.units} · {dots} DOTS
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div style={styles.grid}>
        {items.map((item) => (
          <button key={item.tab} onClick={() => onNavigate(item.tab)} style={styles.tile}>
            <span style={styles.iconWrap}>{item.icon}</span>
            <span style={styles.tileTexts}>
              <span style={styles.tileLabel}>
                {item.label}
                <ChevronRight size={16} style={styles.chevron} />
              </span>
              <span style={styles.tileDesc}>{item.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div style={styles.footer}>ONYX · Powerlifting</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    marginBottom: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '4px solid var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '18px',
    color: 'var(--text-primary)',
    flexShrink: 0,
  },
  summaryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  summaryName: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  summaryStats: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    textAlign: 'left',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px',
    minHeight: '128px',
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTexts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  tileLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  chevron: {
    color: 'var(--text-muted)',
  },
  tileDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  footer: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    marginTop: '20px',
  },
};

export default More;
