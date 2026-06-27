import React, { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';

export const RestTimer: React.FC = () => {
  const { 
    restTimerEnd, 
    restTimerDuration, 
    setRestTimerDuration, 
    startRestTimer, 
    stopRestTimer 
  } = useWorkout();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentLeft, setPercentLeft] = useState(100);
  const [isExpanded, setIsExpanded] = useState(false);
  const initialDurationRef = useRef(restTimerDuration);

  // Sound generator using Web Audio API
  const playTimerEndSound = () => {
    try {
      const AudioCtxClass: (new (options?: AudioContextOptions) => AudioContext) | undefined =
        window.AudioContext ||
        (window as { webkitAudioContext?: new (options?: AudioContextOptions) => AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const playBeep = (time: number, freq: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = audioCtx.currentTime;
      // Play 3 high-pitch beeps
      playBeep(now, 880, 0.25);
      playBeep(now + 0.3, 880, 0.25);
      playBeep(now + 0.6, 1200, 0.45);
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  };

  useEffect(() => {
    if (!restTimerEnd) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((restTimerEnd - now) / 1000));
      
      setTimeLeft(diff);
      
      // Calculate percentage
      const totalDuration = initialDurationRef.current || restTimerDuration;
      const pct = Math.min(100, (diff / totalDuration) * 100);
      setPercentLeft(pct);

      if (diff <= 0) {
        playTimerEndSound();
        stopRestTimer();
      }
    };

    // Set initial duration
    const diffOnStart = Math.max(0, Math.round((restTimerEnd - Date.now()) / 1000));
    // If the diff is close to restTimerDuration, reset initialDurationRef
    if (diffOnStart > initialDurationRef.current) {
      initialDurationRef.current = diffOnStart;
    } else if (diffOnStart <= 0) {
      playTimerEndSound();
      stopRestTimer();
      return;
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [restTimerEnd, stopRestTimer, restTimerDuration]);

  if (!restTimerEnd || timeLeft <= 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAdd30Sec = () => {
    // Add 30 seconds to the timer
    const currentEnd = restTimerEnd || Date.now();
    const newEnd = currentEnd + 30000;
    initialDurationRef.current = (initialDurationRef.current || restTimerDuration) + 30;
    startRestTimer(Math.round((newEnd - Date.now()) / 1000));
  };

  return (
    <div style={isExpanded ? styles.expandedContainer : styles.collapsedContainer}>
      {/* Progress Bar (at the top edge of collapsed, background of expanded) */}
      <div 
        style={{
          ...styles.progressBar,
          width: `${percentLeft}%`,
        }} 
      />

      <div style={styles.content}>
        {isExpanded ? (
          <div style={styles.expandedContent}>
            <div style={styles.header}>
              <span style={styles.title}>CRONÔMETRO DE DESCANSO</span>
              <button onClick={() => setIsExpanded(false)} style={styles.iconBtn} aria-label="Recolher cronômetro">
                <ChevronDown size={20} />
              </button>
            </div>
            
            <div style={styles.timeBig}>
              {formatTime(timeLeft)}
            </div>

            <div style={styles.setupRow}>
              <span style={styles.setupLabel}>Duração Padrão:</span>
              <div style={styles.stepper}>
                <button 
                  onClick={() => setRestTimerDuration(Math.max(30, restTimerDuration - 30))}
                  style={styles.stepperBtn}
                >
                  -30s
                </button>
                <span style={styles.stepperVal}>{formatTime(restTimerDuration)}</span>
                <button 
                  onClick={() => setRestTimerDuration(restTimerDuration + 30)}
                  style={styles.stepperBtn}
                >
                  +30s
                </button>
              </div>
            </div>

            <div style={styles.controlsRow}>
              <button onClick={handleAdd30Sec} style={{ ...styles.btn, ...styles.btnAdd }}>
                <Plus size={16} /> +30s
              </button>
              <button onClick={stopRestTimer} style={{ ...styles.btn, ...styles.btnSkip }}>
                Pular Descanso
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.collapsedContent} onClick={() => setIsExpanded(true)}>
            <div style={styles.left}>
              <span style={styles.restText}>Descansando:</span>
              <span style={styles.timeVal}>{formatTime(timeLeft)}</span>
            </div>
            
            <div style={styles.right} onClick={(e) => e.stopPropagation()}>
              <button onClick={handleAdd30Sec} style={styles.smallActionBtn}>
                <Plus size={14} /> 30s
              </button>
              <button onClick={stopRestTimer} style={styles.smallActionBtn}>
                Pular
              </button>
              <button onClick={() => setIsExpanded(true)} style={styles.smallActionIcon} aria-label="Expandir cronômetro">
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  collapsedContainer: {
    position: 'absolute',
    bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', // Right above the bottom navigation bar (with safe-area offset)
    left: 0,
    width: '100%',
    height: '48px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border-color)',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    animation: 'slideUpNav 0.25s ease-out',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '260px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border-color)',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderTopRightRadius: 'var(--radius-lg)',
    zIndex: 110, // covers bottom nav when expanded
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
    animation: 'slideUpNav 0.25s ease-out',
  },
  progressBar: {
    height: '3px',
    backgroundColor: 'var(--accent)',
    transition: 'width 1s linear',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 16px',
    position: 'relative',
  },
  collapsedContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  left: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  restText: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
  },
  timeVal: {
    fontSize: '18px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  smallActionBtn: {
    backgroundColor: 'var(--accent-gray)',
    border: '1px solid var(--border-focus)',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  smallActionIcon: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  expandedContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.08em',
  },
  iconBtn: {
    color: 'var(--text-secondary)',
  },
  timeBig: {
    fontSize: '56px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    textAlign: 'center',
    margin: '12px 0',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  setupRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 8px',
    marginBottom: '16px',
  },
  setupLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--accent-gray)',
    borderRadius: '6px',
    padding: '2px',
  },
  stepperBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '4px',
  },
  stepperVal: {
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
  },
  controlsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '12px',
    padding: '0 8px',
  },
  btn: {
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnAdd: {
    backgroundColor: 'var(--accent-gray)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-focus)',
  },
  btnSkip: {
    backgroundColor: 'var(--accent-white)',
    color: 'var(--bg-primary)',
  },
};
export default RestTimer;
