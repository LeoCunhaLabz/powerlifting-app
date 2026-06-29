import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Templates from './pages/Templates';
import Calculators from './pages/Calculators';
import SettingsPage from './pages/Settings';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import History from './pages/History';
import CustomExercises from './pages/CustomExercises';
import More, { type MoreTab } from './pages/More';
import Auth from './pages/Auth';
import RestTimer from './components/RestTimer';
import { Home, ClipboardList, Plus, TrendingUp, MoreHorizontal, ArrowLeft, AlertTriangle, X, Cloud, CloudUpload, CloudCheck, CloudOff, Dumbbell } from 'lucide-react';

type Tab = 'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings' | 'more' | 'calendar' | 'history' | 'exercises';

// Abas que vivem dentro do hub "Mais" (Análises voltou para a barra inferior)
const MORE_TABS: Tab[] = ['more', 'calculators', 'settings', 'calendar', 'history', 'exercises'];
const MORE_LABELS: Record<MoreTab, string> = {
  calculators: 'Calculadoras',
  settings: 'Configurações',
  calendar: 'Calendário',
  history: 'Histórico',
  exercises: 'Exercícios',
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const { activeWorkout, saveError, dismissSaveError, syncStatus, repeatWorkout } = useWorkout();

  const syncIndicator = (() => {
    switch (syncStatus) {
      case 'syncing':  return { icon: <CloudUpload size={12} />, label: 'Sincronizando…', color: 'var(--accent)' };
      case 'error':   return { icon: <CloudOff size={12} />, label: 'Erro ao sincronizar', color: 'var(--danger, #e05252)' };
      case 'offline': return { icon: <Cloud size={12} />, label: 'Offline', color: 'var(--text-muted)' };
      default:        return null; // idle — não mostra nada
    }
  })();

  // Mostra o badge de syncências bem-sucedidas por 3 segundos
  const [showSynced, setShowSynced] = React.useState(false);
  const prevSync = React.useRef(syncStatus);
  React.useEffect(() => {
    if (prevSync.current === 'syncing' && syncStatus === 'idle') {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(t);
    }
    prevSync.current = syncStatus;
  }, [syncStatus]);

  const isMoreChild = currentTab === 'calculators' || currentTab === 'settings' || currentTab === 'calendar' || currentTab === 'history' || currentTab === 'exercises';
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
      case 'calendar':
        return <Calendar onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'history':
        return <History onRepeat={(s) => { repeatWorkout(s); setCurrentTab('workout'); }} />;
      case 'exercises':
        return <CustomExercises />;
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

      {/* Aviso nao intrusivo de falha ao salvar no armazenamento local */}
      {saveError && (
        <div style={styles.saveErrorBanner} role="alert">
          <AlertTriangle size={18} style={styles.saveErrorIcon} />
          <span style={styles.saveErrorText}>{saveError}</span>
          <button
            onClick={dismissSaveError}
            style={styles.saveErrorClose}
            aria-label="Dispensar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Indicador de status de sync (acima da nav) */}
      {(syncIndicator || showSynced) && (
        <div style={styles.syncBadge} aria-live="polite">
          {showSynced && !syncIndicator
            ? <><CloudCheck size={12} style={{ color: 'var(--success, #4caf50)' }} /><span style={{ color: 'var(--success, #4caf50)' }}>Sincronizado</span></>
            : syncIndicator && <>{syncIndicator.icon}<span style={{ color: syncIndicator.color }}>{syncIndicator.label}</span></>
          }
        </div>
      )}

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
            {activeWorkout
              ? <Dumbbell size={24} color="var(--accent-ink)" />
              : <Plus size={26} strokeWidth={3} color="var(--accent-ink)" />}
            {activeWorkout && <span style={styles.fabActiveDot} />}
          </span>
          <span style={styles.fabLabel}>Treinar</span>
        </button>
      </nav>
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <WorkoutProvider
      key={user?.id ?? 'auth'}
      storageScopeId={user?.id ?? null}
      demoEmail={user?.email ?? null}
    >
      <AppContent />
    </WorkoutProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
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
  saveErrorBanner: {
    position: 'absolute',
    bottom: 'calc(70px + env(safe-area-inset-bottom, 0px) + 12px)',
    left: '16px',
    right: '16px',
    zIndex: 95,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--error)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
  },
  saveErrorIcon: {
    flex: '0 0 auto',
    color: 'var(--error)',
  },
  saveErrorText: {
    flex: '1 1 auto',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  saveErrorClose: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    color: 'var(--text-secondary)',
    background: 'none',
  },
  syncBadge: {
    position: 'absolute',
    bottom: 'calc(70px + env(safe-area-inset-bottom, 0px) + 8px)',
    right: '16px',
    zIndex: 94,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full, 999px)',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-subtle)',
    fontSize: '11px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
};

export default App;
