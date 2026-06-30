import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import PlateVisualizer from '../components/PlateVisualizer';
import { calculateWilks, calculateDots, calculateIpfGl, calculateE1RM, calculateE1RMBrzycki, calculateE1RMEpley } from '../utils/powerlifting';

export const Calculators: React.FC = () => {
  const { state } = useWorkout();
  const { settings } = state;

  const [activeTab, setActiveTab] = useState<'plates' | 'score' | '1rm'>('plates');

  // Plate Calculator local state
  const [targetWeight, setTargetWeight] = useState(100);
  const [barWeight, setBarWeight] = useState(settings.barWeight);

  // 1RM Calculator local state
  const [rmWeight, setRmWeight] = useState<number | ''>('');
  const [rmReps, setRmReps] = useState<number | ''>('');
  const [rmRpe, setRmRpe] = useState<number | ''>('');

  // Score Calculator local state
  const [isMale, setIsMale] = useState(settings.gender === 'male');
  const [isEquipped, setIsEquipped] = useState(settings.isEquipped);
  const [bodyweight, setBodyweight] = useState(settings.bodyweight);
  const [squat, setSquat] = useState<number | ''>('');
  const [bench, setBench] = useState<number | ''>('');
  const [deadlift, setDeadlift] = useState<number | ''>('');

  const handleAdjustWeight = (amount: number) => {
    setTargetWeight((prev) => Math.max(barWeight, prev + amount));
  };

  // 1RM results
  const rmW = Number(rmWeight) || 0;
  const rmR = Number(rmReps) || 0;
  const rmRpeVal = rmRpe !== '' ? Number(rmRpe) : undefined;
  const rmRPE = rmW > 0 && rmR > 0 && rmRpeVal !== undefined ? calculateE1RM(rmW, rmR, rmRpeVal) : null;
  const rmBrzycki = rmW > 0 && rmR > 0 ? calculateE1RMBrzycki(rmW, rmR) : null;
  const rmEpley = rmW > 0 && rmR > 0 ? calculateE1RMEpley(rmW, rmR) : null;

  // Calculate scores
  const totalLifted = (Number(squat) || 0) + (Number(bench) || 0) + (Number(deadlift) || 0);
  const wilksScore = calculateWilks(bodyweight, totalLifted, isMale);
  const dotsScore = calculateDots(bodyweight, totalLifted, isMale);
  const ipfGlScore = calculateIpfGl(bodyweight, totalLifted, isMale, isEquipped);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>CALCULADORAS</h1>
      
      {/* Sub tabs */}
      <div style={styles.subTabs}>
        <button
          onClick={() => setActiveTab('plates')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'plates' ? 'var(--accent)' : 'transparent', borderRadius: '9px',
            color: activeTab === 'plates' ? 'var(--accent-ink)' : 'var(--text-secondary)',
          }}
        >
          Anilhas
        </button>
        <button
          onClick={() => setActiveTab('score')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'score' ? 'var(--accent)' : 'transparent', borderRadius: '9px',
            color: activeTab === 'score' ? 'var(--accent-ink)' : 'var(--text-secondary)',
          }}
        >
          Coeficiente
        </button>
        <button
          onClick={() => setActiveTab('1rm')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === '1rm' ? 'var(--accent)' : 'transparent', borderRadius: '9px',
            color: activeTab === '1rm' ? 'var(--accent-ink)' : 'var(--text-secondary)',
          }}
        >
          1RM
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'plates' ? (
          <div style={styles.platesSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>PESO ALVO ({settings.units.toUpperCase()})</label>
              <div style={styles.inputContainer}>
                <button onClick={() => handleAdjustWeight(-10)} style={styles.adjustBtn}>-10</button>
                <button onClick={() => handleAdjustWeight(-2.5)} style={styles.adjustBtn}>-2.5</button>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(Math.max(0, Number(e.target.value)))}
                  style={styles.weightInput}
                />
                <button onClick={() => handleAdjustWeight(2.5)} style={styles.adjustBtn}>+2.5</button>
                <button onClick={() => handleAdjustWeight(10)} style={styles.adjustBtn}>+10</button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>PESO DA BARRA ({settings.units.toUpperCase()})</label>
              <select
                value={barWeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBarWeight(val);
                  if (targetWeight < val) setTargetWeight(val);
                }}
                style={styles.select}
              >
                {settings.units === 'kg' ? (
                  <>
                    <option value={20}>Barra de 20 kg (Padrão)</option>
                    <option value={15}>Barra de 15 kg (Feminina)</option>
                    <option value={25}>Barra de 25 kg (Agachamento)</option>
                  </>
                ) : (
                  <>
                    <option value={45}>Barra de 45 lbs (Padrão)</option>
                    <option value={35}>Barra de 35 lbs (Feminina)</option>
                    <option value={55}>Barra de 55 lbs (Agachamento)</option>
                  </>
                )}
              </select>
            </div>

            {/* Visual Barbell Loading */}
            <div style={styles.visualizerCard}>
              <PlateVisualizer
                weight={targetWeight}
                barWeight={barWeight}
                availablePlates={[...new Set([...settings.availablePlates, ...settings.customPlates])].sort((a, b) => b - a)}
                units={settings.units}
              />
            </div>
          </div>
        ) : activeTab === '1rm' ? (
          <div style={styles.rmSection}>
            <div style={styles.gridTwoCols}>
              <div style={styles.formGroup}>
                <label style={styles.label}>PESO ({settings.units.toUpperCase()})</label>
                <input
                  type="number"
                  placeholder="0"
                  value={rmWeight}
                  onChange={(e) => setRmWeight(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  style={styles.liftInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>REPS</label>
                <input
                  type="number"
                  placeholder="0"
                  value={rmReps}
                  onChange={(e) => setRmReps(e.target.value === '' ? '' : Math.max(1, Math.min(30, Number(e.target.value))))}
                  style={styles.liftInput}
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>RPE (OPCIONAL, 6.5–10)</label>
              <input
                type="number"
                placeholder="ex.: 8.5"
                value={rmRpe}
                min={6.5}
                max={10}
                step={0.5}
                onChange={(e) => setRmRpe(e.target.value === '' ? '' : Number(e.target.value))}
                style={styles.fullInput}
              />
            </div>
            <div style={styles.resultsCard}>
              {rmBrzycki !== null ? (
                <>
                  {rmRPE !== null && rmRPE > 0 && (
                    <div style={styles.scoreRow}>
                      <span style={styles.scoreLabel}>RTS RPE TABLE:</span>
                      <span style={styles.scoreVal}>{rmRPE} {settings.units}</span>
                    </div>
                  )}
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreLabel}>BRZYCKI:</span>
                    <span style={styles.scoreVal}>{rmBrzycki} {settings.units}</span>
                  </div>
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreLabel}>EPLEY:</span>
                    <span style={styles.scoreVal}>{rmEpley} {settings.units}</span>
                  </div>
                </>
              ) : (
                <span style={styles.scoreLabel}>Preencha peso e reps para calcular.</span>
              )}
              <div style={styles.disclaimer}>
                * RTS RPE Table requer RPE e reps entre 1–12. Brzycki e Epley são fórmulas de repetições máximas; resultados podem variar entre métodos.
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.scoreSection}>
            <div style={styles.gridTwoCols}>
              <div style={styles.formGroup}>
                <label style={styles.label}>GÊNERO</label>
                <div style={styles.genderToggle}>
                  <button
                    onClick={() => setIsMale(true)}
                    style={{
                      ...styles.genderBtn,
                      backgroundColor: isMale ? 'var(--accent-white)' : 'var(--bg-tertiary)',
                      color: isMale ? 'var(--bg-primary)' : 'var(--text-primary)',
                    }}
                  >
                    Masculino
                  </button>
                  <button
                    onClick={() => setIsMale(false)}
                    style={{
                      ...styles.genderBtn,
                      backgroundColor: !isMale ? 'var(--accent-white)' : 'var(--bg-tertiary)',
                      color: !isMale ? 'var(--bg-primary)' : 'var(--text-primary)',
                    }}
                  >
                    Feminino
                  </button>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>EQUIPAMENTO</label>
                <div style={styles.genderToggle}>
                  <button
                    onClick={() => setIsEquipped(false)}
                    style={{
                      ...styles.genderBtn,
                      backgroundColor: !isEquipped ? 'var(--accent-white)' : 'var(--bg-tertiary)',
                      color: !isEquipped ? 'var(--bg-primary)' : 'var(--text-primary)',
                    }}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setIsEquipped(true)}
                    style={{
                      ...styles.genderBtn,
                      backgroundColor: isEquipped ? 'var(--accent-white)' : 'var(--bg-tertiary)',
                      color: isEquipped ? 'var(--bg-primary)' : 'var(--text-primary)',
                    }}
                  >
                    Equipado
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>PESO CORPORAL ({settings.units.toUpperCase()})</label>
              <input
                type="number"
                value={bodyweight}
                onChange={(e) => setBodyweight(Math.max(1, Number(e.target.value)))}
                style={styles.fullInput}
              />
            </div>

            <div style={styles.liftsGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>AGACHAMENTO (S)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={squat}
                  onChange={(e) => setSquat(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  style={styles.liftInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>SUPINO (B)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={bench}
                  onChange={(e) => setBench(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  style={styles.liftInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>TERRA (D)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={deadlift}
                  onChange={(e) => setDeadlift(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  style={styles.liftInput}
                />
              </div>
            </div>

            {/* Score Results Table */}
            <div style={styles.resultsCard}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>TOTAL LEVANTADO:</span>
                <span style={styles.totalVal}>{totalLifted} {settings.units}</span>
              </div>
              
              <div style={styles.divider} />
              
              <div style={styles.scoreRow}>
                <span style={styles.scoreLabel}>DOTS SCORE:</span>
                <span style={styles.scoreVal}>{dotsScore} pts</span>
              </div>
              
              <div style={styles.scoreRow}>
                <span style={styles.scoreLabel}>WILKS SCORE (Classic):</span>
                <span style={styles.scoreVal}>{wilksScore} pts</span>
              </div>
              
              <div style={styles.scoreRow}>
                <span style={styles.scoreLabel}>IPF GL POINTS:</span>
                <span style={styles.scoreVal}>{ipfGlScore} pts</span>
              </div>
              
              <div style={styles.disclaimer}>
                * O coeficiente DOTS é o padrão moderno de comparação da IPF. O Wilks é amplamente utilizado em federações clássicas. O IPF GL Points é usado em competições internacionais oficiais da IPF.
              </div>
            </div>
          </div>
        )}
      </div>
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
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  subTabs: {
    display: 'flex',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '3px',
    marginBottom: '20px',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    padding: '12px 0',
    fontSize: '13px',
    fontWeight: '700',
    textAlign: 'center',
    transition: 'all var(--transition-fast)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  platesSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    width: '100%',
  },
  label: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
  },
  adjustBtn: {
    flex: 1,
    height: '44px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  weightInput: {
    width: '100px',
    height: '44px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
  },
  select: {
    height: '44px',
    width: '100%',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0 12px',
    fontSize: '14px',
  },
  visualizerCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    padding: '16px',
    marginTop: '12px',
  },
  rmSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  scoreSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
  },
  genderToggle: {
    display: 'flex',
    height: '40px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px',
  },
  genderBtn: {
    flex: 1,
    height: '100%',
    borderRadius: '2px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullInput: {
    height: '44px',
    fontSize: '15px',
    fontWeight: '600',
  },
  liftsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    marginBottom: '16px',
  },
  liftInput: {
    height: '44px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '12px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--text-secondary)',
  },
  totalVal: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '12px 0',
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
  },
  scoreVal: {
    fontSize: '16px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
  },
  disclaimer: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '16px',
    lineHeight: '1.4',
  },
};
export default Calculators;
