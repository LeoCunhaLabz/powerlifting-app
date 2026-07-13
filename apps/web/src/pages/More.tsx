import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Calculator, Settings as SettingsIcon, ChevronRight, LogOut, CalendarDays, Dumbbell, Award, Radar } from 'lucide-react';
import { calculateDots } from '../utils/powerlifting';

// Abas que vivem dentro do hub "Mais" (Análises agora fica na barra inferior)
export type MoreTab = 'calculators' | 'settings' | 'calendar' | 'history' | 'exercises' | 'prs' | 'comparison';

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
  const { user, logout } = useAuth();
  const { settings } = state;

  const squat = getMaxE1RM('Agachamento');
  const bench = getMaxE1RM('Supino Reto');
  const deadlift = getMaxE1RM('Levantamento Terra');
  const bestTotal = squat + bench + deadlift;
  const bw = getBodyweightAt(new Date().toISOString());
  const dots = calculateDots(bw, bestTotal, settings.gender === 'male');

  const handleLogout = () => {
    logout();
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? 'A';

  const items: MoreItem[] = [
    {
      tab: 'comparison',
      label: 'Comparação estimada',
      desc: 'Seu nivel atual, comparacao por lift e meta para proximo nivel',
      icon: <Radar size={22} />,
    },
    {
      tab: 'calendar',
      label: 'Calendário',
      desc: 'Projeção do programa ativo: planejado vs concluído',
      icon: <CalendarDays size={22} />,
    },
    {
      tab: 'calculators',
      label: 'Calculadoras',
      desc: 'Montagem de anilhas e pontuações Wilks/DOTS/IPF GL',
      icon: <Calculator size={22} />,
    },
    {
      tab: 'exercises',
      label: 'Exercícios',
      desc: 'Crie e gerencie exercícios customizados reutilizáveis',
      icon: <Dumbbell size={22} />,
    },
    {
      tab: 'prs',
      label: 'Recordes',
      desc: 'Todos os seus PRs (recordes pessoais) por exercício',
      icon: <Award size={22} />,
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
        <span style={styles.avatar}>{avatarLetter}</span>
        <div style={styles.summaryInfo}>
          <div style={styles.summaryName}>{user?.name ?? 'Atleta'} · {bw} {settings.units}</div>
          <div style={styles.summaryStats}>
            {user?.email && <span style={styles.summaryEmail}>{user.email}</span>}
            <span>Total {Math.round(bestTotal)} {settings.units} · {dots} DOTS</span>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} aria-label="Sair">
          <LogOut size={18} />
        </button>
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
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
  },
  summaryEmail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    marginLeft: 'auto',
    flexShrink: 0,
    background: 'none',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
