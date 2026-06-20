import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Templates from './pages/Templates';
import Calculators from './pages/Calculators';
import SettingsPage from './pages/Settings';
import RestTimer from './components/RestTimer';
import { Trophy, Dumbbell, ClipboardList, Calculator, Settings as SettingsIcon, TrendingUp } from 'lucide-react';

type Tab = 'dashboard' | 'workout' | 'templates' | 'analytics' | 'calculators' | 'settings';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const { activeWorkout } = useWorkout();

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'workout':
        return <Workout />;
      case 'templates':
        return <Templates onStartWorkoutTab={() => setCurrentTab('workout')} />;
      case 'analytics':
        return <Analytics />;
      case 'calculators':
        return <Calculators />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Scrollable page body */}
      <div className="app-content">
        {renderActiveTab()}
      </div>

      {/* Floating rest timer banner above bottom nav */}
      <RestTimer />

      {/* Navigation Bar */}
      <nav className="bottom-nav">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        >
          <Trophy />
          <span>Início</span>
        </button>

        <button
          onClick={() => setCurrentTab('templates')}
          className={`nav-item ${currentTab === 'templates' ? 'active' : ''}`}
        >
          <ClipboardList />
          <span>Rotinas</span>
        </button>

        <button
          onClick={() => setCurrentTab('workout')}
          className={`nav-item ${currentTab === 'workout' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <Dumbbell />
          <span>Treinar</span>
          {activeWorkout && (
            <span style={styles.activeDot} />
          )}
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
        >
          <TrendingUp />
          <span>Análises</span>
        </button>

        <button
          onClick={() => setCurrentTab('calculators')}
          className={`nav-item ${currentTab === 'calculators' ? 'active' : ''}`}
        >
          <Calculator />
          <span>Calculadoras</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
        >
          <SettingsIcon />
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
};

// Lazy import or local definition of Analytics to avoid circular/missing import errors
import Analytics from './pages/Analytics';

export const App: React.FC = () => {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
};

const styles = {
  activeDot: {
    position: 'absolute' as const,
    top: '12px',
    right: '24px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '1px solid #000000',
  }
};

export default App;
