import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Templates from './pages/Templates';
import Calculators from './pages/Calculators';
import SettingsPage from './pages/Settings';
import Analytics from './pages/Analytics';
import More, { type MoreTab } from './pages/More';
import RestTimer from './components/RestTimer';
import { Home, ClipboardList, Plus, TrendingUp, MoreHorizontal, ArrowLeft } from 'lucide-react';

type Tab = 'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings' | 'more';

// Abas que vivem dentro do hub "Mais" (Análises voltou para a barra inferior)
const MORE_TABS: Tab[] = ['more', 'calculators', 'settings'];
const MORE_LABELS: Record<MoreTab, string> = {
  calculators: 'Calculadoras',
  settings: 'Configurações',
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const { activeWorkout } = useWorkout();

  const isMoreChild = currentTab === 'calculators' || currentTab === 'settings';
  const moreActive = MORE_TABS.includes(currentTab);

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'workout':
        return <Workout />;
      case 'templates':
        return <Templates onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'more':
        return <More onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'analytics':
        return <Analytics />;
      case 'calculators':
        return <Calculators />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onStartWorkoutTab={() => setCurrentTab('workout')} />;
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        {isMoreChild && (
          <button onClick={() => setCurrentTab('more')} style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Mais · {MORE_LABELS[currentTab as MoreTab]}</span>
          </button>
        )}
        {renderActiveTab()}
      </div>

      {/* Floating rest timer banner above bottom nav */}
      <RestTimer />

      {/* Navegação inferior — 5 slots com "+" central (Treinar) */}
      <nav className="bottom-nav">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        >
          <Home />
          <span>Início</span>
        </button>

        <button
          onClick={() => setCurrentTab('templates')}
          className={`nav-item ${currentTab === 'templates' ? 'active' : ''}`}
        >
          <ClipboardList />
          <span>Rotinas</span>
        </button>

        {/* Espaço reservado para o FAB central */}
        <div style={styles.fabSlot} aria-hidden="true" />

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
        >
          <TrendingUp />
          <span>Análises</span>
        </button>

        <button
          onClick={() => setCurrentTab('more')}
          className={`nav-item ${moreActive ? 'active' : ''}`}
        >
          <MoreHorizontal />
          <span>Mais</span>
        </button>

        {/* FAB central — iniciar / continuar treino */}
        <button
          onClick={() => setCurrentTab('workout')}
          style={{
            ...styles.fab,
            boxShadow: currentTab === 'workout'
              ? '0 0 0 4px var(--accent-soft), 0 8px 20px rgba(0,0,0,0.45)'
              : '0 8px 20px rgba(0,0,0,0.45)',
          }}
          aria-label="Treinar"
        >
          <span style={styles.fabCircle}>
            <Plus size={26} strokeWidth={3} color="var(--accent-ink)" />
            {activeWorkout && <span style={styles.fabActiveDot} />}
          </span>
          <span style={styles.fabLabel}>Treinar</span>
        </button>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 0',
    marginBottom: '8px',
    background: 'none',
  },
  fabSlot: {
    width: '60px',
    flex: '0 0 60px',
    height: '70px',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    top: '-18px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: 'none',
    padding: 0,
  },
  fabCircle: {
    position: 'relative',
    width: '54px',
    height: '54px',
    borderRadius: '18px',
    backgroundColor: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActiveDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    border: '2px solid var(--bg-primary)',
  },
  fabLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: 'var(--accent)',
  },
};

export default App;
