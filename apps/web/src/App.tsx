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
import PRs from './pages/PRs';
import ComparisonEstimated from './pages/ComparisonEstimated';
import More, { type MoreTab } from './pages/More';
import Auth from './pages/Auth';
import SessionClock from './components/SessionClock';
import { RestBar } from './components/workout/RestBar/RestBar';
import { useWakeLock } from './hooks/useWakeLock';
import { IconButton, Toast } from './ui';
import { trackTabView } from './utils/analytics';
import { takeHandoff } from './utils/strengthHandoff';
import { Home, ClipboardList, Plus, TrendingUp, MoreHorizontal, ArrowLeft, AlertTriangle, X, Cloud, CloudUpload, CloudCheck, CloudOff } from 'lucide-react';

type Tab = 'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings' | 'more' | 'calendar' | 'history' | 'exercises' | 'prs' | 'comparison';

// Abas que vivem dentro do hub "Mais" (Análises voltou para a barra inferior)
const MORE_TABS: Tab[] = ['more', 'calculators', 'settings', 'calendar', 'history', 'exercises', 'prs', 'comparison'];
const MORE_LABELS: Record<MoreTab, string> = {
  calculators: 'Calculadoras',
  settings: 'Configurações',
  calendar: 'Calendário',
  history: 'Histórico',
  exercises: 'Exercícios',
  prs: 'Recordes',
  comparison: 'Comparação estimada',
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [historyInit, setHistoryInit] = useState<{ sessionId?: string; edit?: boolean } | null>(null);
  const { activeWorkout, restTimer, saveError, dismissSaveError, syncStatus, repeatWorkout, seedFromStrengthHandoff } = useWorkout();

  // Tela acesa durante o treino ativo (#341).
  useWakeLock(!!activeWorkout);

  // Conta recém-criada a partir da calculadora de força: semeia uma única vez (#318).
  // takeHandoff sempre apaga o stash; login de conta existente só o descarta.
  React.useEffect(() => {
    const payload = takeHandoff();
    if (payload) seedFromStrengthHandoff(payload);
  }, [seedFromStrengthHandoff]);

  // Navega para o Histórico, opcionalmente abrindo uma sessão (deep-link do Dashboard).
  const goToHistory = (opts?: { sessionId?: string; edit?: boolean }) => {
    setHistoryInit(opts ?? null);
    setCurrentTab('history');
  };

  // Pageview virtual por aba (Umami #290): sem router, a troca de aba é a navegação.
  React.useEffect(() => {
    trackTabView(currentTab);
  }, [currentTab]);

  const syncIndicator = (() => {
    switch (syncStatus) {
      case 'syncing':  return { icon: <CloudUpload size={12} />, label: 'Sincronizando…', color: 'var(--text-2)' };
      case 'error':   return { icon: <CloudOff size={12} />, label: 'Erro ao sincronizar', color: 'var(--danger)' };
      case 'offline': return { icon: <Cloud size={12} />, label: 'Offline', color: 'var(--text-2)' };
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

  const isMoreChild = currentTab === 'calculators' || currentTab === 'settings' || currentTab === 'calendar' || currentTab === 'history' || currentTab === 'exercises' || currentTab === 'prs' || currentTab === 'comparison';
  const moreActive = MORE_TABS.includes(currentTab);

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onStartWorkoutTab={() => setCurrentTab('workout')} onNavigateHistory={goToHistory} />;
      case 'workout':
        return <Workout />;
      case 'templates':
        return <Templates onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'more':
        return <More onNavigate={(tab) => { setHistoryInit(null); setCurrentTab(tab); }} />;
      case 'analytics':
        return <Analytics onSeeAllPRs={() => setCurrentTab('prs')} />;
      case 'calculators':
        return <Calculators />;
      case 'settings':
        return <SettingsPage />;
      case 'calendar':
        return <Calendar onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'history':
        return <History onRepeat={(s) => { repeatWorkout(s); setCurrentTab('workout'); }} initialSessionId={historyInit?.sessionId} initialEdit={historyInit?.edit} />;
      case 'exercises':
        return <CustomExercises />;
      case 'prs':
        return <PRs />;
      case 'comparison':
        return <ComparisonEstimated />;
      default:
        return <Dashboard onStartWorkoutTab={() => setCurrentTab('workout')} onNavigateHistory={goToHistory} />;
    }
  };

  return (
    <div className="app-container">
      {/* Com a barra de descanso na tela, sobra espaço no fim para nada ficar escondido atrás dela (#330). */}
      <div className={restTimer ? 'app-content app-content--rest' : 'app-content'}>
        {isMoreChild && (
          <button onClick={() => setCurrentTab('more')} style={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Mais · {MORE_LABELS[currentTab as MoreTab]}</span>
          </button>
        )}
        {renderActiveTab()}
      </div>

      {/* Faixa fixa acima da navegação, presa ao shell de 480 px (#330): avisos em cima, descanso
          embaixo. Antes era position: absolute no #root e caía no fim da página rolada. */}
      <div className="dock">
        {saveError && (
          <Toast
            tone="danger"
            icon={<AlertTriangle size={18} />}
            message={saveError}
            action={<IconButton aria-label="Dispensar aviso" variant="plain" icon={<X size={16} />} onClick={dismissSaveError} />}
          />
        )}
        {(syncIndicator || showSynced) && (
          <div style={styles.syncBadge} aria-live="polite">
            {showSynced && !syncIndicator
              ? <><CloudCheck size={12} style={{ color: 'var(--text-2)' }} /><span style={{ color: 'var(--text-2)' }}>Sincronizado</span></>
              : syncIndicator && <>{syncIndicator.icon}<span style={{ color: syncIndicator.color }}>{syncIndicator.label}</span></>
            }
          </div>
        )}
        <RestBar />
      </div>

      {/* Navegação inferior — 5 slots com "+" central (Treinar) */}
      <nav className="bottom-nav">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          aria-current={currentTab === 'dashboard' ? 'page' : undefined}
        >
          <Home />
          <span>Início</span>
        </button>

        <button
          onClick={() => setCurrentTab('templates')}
          className={`nav-item ${currentTab === 'templates' ? 'active' : ''}`}
          aria-current={currentTab === 'templates' ? 'page' : undefined}
        >
          <ClipboardList />
          <span>Biblioteca</span>
        </button>

        {/* Espaço reservado para o FAB central */}
        <div style={styles.fabSlot} aria-hidden="true" />

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
          aria-current={currentTab === 'analytics' ? 'page' : undefined}
        >
          <TrendingUp />
          <span>Análises</span>
        </button>

        <button
          onClick={() => setCurrentTab('more')}
          className={`nav-item ${moreActive ? 'active' : ''}`}
          aria-current={moreActive ? 'page' : undefined}
        >
          <MoreHorizontal />
          <span>Mais</span>
        </button>

        {/* Botão central: neutro; dourado (= agora) só com treino em andamento, mostrando o tempo da sessão */}
        <div style={styles.fabWrap}>
          <button
            onClick={() => setCurrentTab('workout')}
            style={styles.fab}
            aria-label={activeWorkout ? 'Treino em andamento' : 'Treinar'}
            aria-current={currentTab === 'workout' ? 'page' : undefined}
          >
            <span style={{ ...styles.fabCircle, ...(activeWorkout ? styles.fabCircleLive : {}) }}>
              {activeWorkout
                ? <SessionClock startIso={activeWorkout.date} />
                : <Plus size={22} strokeWidth={2.5} />}
            </span>
            <span style={styles.fabLabel}>{activeWorkout ? 'Treinando' : 'Treinar'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

const AuthGate: React.FC<{ openRegister: boolean }> = ({ openRegister }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth openRegister={openRegister} />;
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

export const App: React.FC<{ openRegister?: boolean }> = ({ openRegister = false }) => {
  return (
    <AuthProvider>
      <AuthGate openRegister={openRegister} />
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
  // O invólucro centraliza; o botão fica sem transform próprio para o scale do :active funcionar.
  fabWrap: {
    position: 'absolute',
    left: '50%',
    top: '8px',
    transform: 'translateX(-50%)',
  },
  fab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    padding: 0,
  },
  fabCircle: {
    minWidth: '56px',
    height: '36px',
    padding: '0 8px',
    borderRadius: 'var(--radius-button)',
    backgroundColor: 'var(--surface-3)',
    color: 'var(--text-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-num)',
    fontWeight: 700,
    fontSize: 'var(--title-3)',
    fontVariantNumeric: 'tabular-nums',
  },
  fabCircleLive: {
    backgroundColor: 'var(--now)',
    color: 'var(--now-ink)',
  },
  fabLabel: {
    fontSize: 'var(--fs-label)',
    fontWeight: 600,
    color: 'var(--text-1)',
  },
  syncBadge: {
    alignSelf: 'flex-end',
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
