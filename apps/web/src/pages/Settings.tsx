import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Download, Upload, Trash2, CheckCircle2, AlertTriangle, Check, LogOut, Plus, X } from 'lucide-react';
import { DEFAULT_PLATES_KG, DEFAULT_PLATES_LBS } from '../utils/powerlifting';
import type { ThemeName } from '@powerlifting/shared';

const THEMES: { id: ThemeName; name: string; swatch: string; desc: string }[] = [
  { id: 'onyx', name: 'Onyx', swatch: '#fafafa', desc: 'Monocromático' },
  { id: 'brass', name: 'Brass', swatch: '#e3a83b', desc: 'Padrão' },
  { id: 'volt', name: 'Volt', swatch: '#b6e34a', desc: 'Elétrico' },
];

export const Settings: React.FC = () => {
  const { state, updateSettings, exportData, importData, logBodyweight, addCustomPlate, removeCustomPlate } = useWorkout();
  const { user, logout } = useAuth();
  const { settings } = state;

  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [customPlateInput, setCustomPlateInput] = useState('');

  const handleUnitChange = (units: 'kg' | 'lbs') => {
    updateSettings({ units });
  };

  const handlePlateToggle = (plate: number) => {
    let newPlates = [...settings.availablePlates];
    if (newPlates.includes(plate)) {
      // Only remove if there's at least one other plate available (standard or custom)
      const otherStandardPlates = newPlates.filter(p => p !== plate);
      if (otherStandardPlates.length > 0 || settings.customPlates.length > 0) {
        newPlates = otherStandardPlates;
      }
    } else {
      newPlates.push(plate);
    }
    updateSettings({ availablePlates: newPlates });
  };

  const handleAddCustomPlate = () => {
    const weight = parseFloat(customPlateInput);
    if (weight > 0) {
      addCustomPlate(weight);
      setCustomPlateInput('');
    }
  };

  const handleRemoveCustomPlate = (weight: number) => {
    removeCustomPlate(weight);
  };

  const handleExportFile = () => {
    try {
      const dataStr = exportData();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.download = `powerlifting_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleImportJson = () => {
    if (!importText.trim()) return;
    const success = importData(importText);
    if (success) {
      setImportStatus('success');
      setImportText('');
      setTimeout(() => setImportStatus('idle'), 4000);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 4000);
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('powerlifting_app_state');
    localStorage.removeItem('powerlifting_active_workout');
    localStorage.removeItem('powerlifting_rest_timer_end');
    window.location.reload();
  };

  const availablePlatesPool = settings.units === 'kg' ? DEFAULT_PLATES_KG : DEFAULT_PLATES_LBS;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>CONFIGURAÇÕES</h1>

      {/* Aparência / Tema */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Aparência</h2>
        <div style={{ ...styles.settingDesc, marginBottom: '12px' }}>
          Escolha a cor de acento do app. Brass é o padrão.
        </div>

        <div style={styles.themeGrid}>
          {THEMES.map((theme) => {
            const isActive = settings.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                style={{
                  ...styles.themeCard,
                  borderColor: isActive ? 'var(--accent)' : 'var(--border-color)',
                }}
              >
                {isActive && (
                  <span style={styles.themeCheck}>
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
                <span style={styles.themeSwatchWrap}>
                  <span style={{ ...styles.themeSwatch, borderColor: theme.swatch }} />
                </span>
                <span style={styles.themeName}>{theme.name}</span>
                <span style={styles.themeDesc}>{theme.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferências do Atleta */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Preferências do Atleta</h2>

        <div style={styles.settingRow}>
          <div style={styles.settingInfo}>
            <div style={styles.settingLabel}>Unidade de Medida</div>
            <div style={styles.settingDesc}>Define o padrão de peso do app</div>
          </div>
          <div style={styles.unitToggle}>
            <button
              onClick={() => handleUnitChange('kg')}
              style={{
                ...styles.unitBtn,
                backgroundColor: settings.units === 'kg' ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: settings.units === 'kg' ? 'var(--accent-ink)' : 'var(--text-primary)',
              }}
            >
              KG
            </button>
            <button
              onClick={() => handleUnitChange('lbs')}
              style={{
                ...styles.unitBtn,
                backgroundColor: settings.units === 'lbs' ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: settings.units === 'lbs' ? 'var(--accent-ink)' : 'var(--text-primary)',
              }}
            >
              LBS
            </button>
          </div>
        </div>

        <div style={styles.settingRow}>
          <div style={styles.settingInfo}>
            <div style={styles.settingLabel}>Peso Corporal ({settings.units.toUpperCase()})</div>
            <div style={styles.settingDesc}>Usado no cálculo de Wilks/Dots</div>
          </div>
          <input
            type="number"
            value={settings.bodyweight}
            onChange={(e) => updateSettings({ bodyweight: Math.max(1, Number(e.target.value)) })}
            onBlur={(e) => { const v = Math.max(1, Number(e.target.value)); if (v > 0) logBodyweight(v); }}
            style={styles.numberInput}
          />
        </div>

        <div style={styles.settingRow}>
          <div style={styles.settingInfo}>
            <div style={styles.settingLabel}>Gênero</div>
            <div style={styles.settingDesc}>Coeficiente de força baseado no gênero</div>
          </div>
          <select
            value={settings.gender}
            onChange={(e) => updateSettings({ gender: e.target.value as 'male' | 'female' })}
            style={styles.select}
          >
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </select>
        </div>
      </div>

      {/* Configuração de Equipamento */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Equipamento & Barra</h2>

        <div style={styles.settingRow}>
          <div style={styles.settingInfo}>
            <div style={styles.settingLabel}>Peso da Barra Padrão</div>
            <div style={styles.settingDesc}>Peso inicial no cálculo de anilhas</div>
          </div>
          <input
            type="number"
            value={settings.barWeight}
            onChange={(e) => updateSettings({ barWeight: Math.max(1, Number(e.target.value)) })}
            style={styles.numberInput}
          />
        </div>

        <div style={styles.formGroup}>
          <div style={styles.settingLabel}>Anilhas Disponíveis na Academia</div>
          <div style={{ ...styles.settingDesc, marginBottom: '10px' }}>
            Desmarque as anilhas que sua academia não possui para que o cálculo seja correto.
          </div>

          <div style={styles.platesGrid}>
            {availablePlatesPool.map((plate) => {
              const isActive = settings.availablePlates.includes(plate);
              return (
                <button
                  key={plate}
                  onClick={() => handlePlateToggle(plate)}
                  style={{
                    ...styles.plateCheckbox,
                    backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: isActive ? 'var(--accent-ink)' : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border-color)',
                  }}
                >
                  {plate} {settings.units}
                </button>
              );
            })}
          </div>

          {/* Seção de anilhas customizadas */}
          <div style={styles.customPlatesSection}>
            <div style={styles.settingLabel}>Anilhas Customizadas</div>
            <div style={{ ...styles.settingDesc, marginBottom: '10px' }}>
              Adicione anilhas não-padrão disponíveis na sua academia (ex.: 1 kg, 2 kg, 3 kg).
            </div>

            <div style={styles.customPlateInput}>
              <input
                type="number"
                value={customPlateInput}
                onChange={(e) => setCustomPlateInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomPlate();
                  }
                }}
                placeholder="Ex: 1.5"
                step="0.25"
                min="0.01"
                style={styles.plateNumberInput}
              />
              <button onClick={handleAddCustomPlate} style={styles.addPlateBtn}>
                <Plus size={16} /> Adicionar
              </button>
            </div>

            {settings.customPlates.length > 0 && (
              <div style={styles.customPlatesList}>
                {settings.customPlates.map((plate) => (
                  <div key={plate} style={styles.customPlateItem}>
                    <span style={styles.customPlateName}>{plate} {settings.units}</span>
                    <button
                      onClick={() => handleRemoveCustomPlate(plate)}
                      style={styles.removeCustomPlateBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup e Importação */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Backup dos Dados</h2>
        <p style={{ ...styles.settingDesc, marginBottom: '14px' }}>
          Toda a persistência é salva localmente no seu navegador. Exporte regularmente para não perder seus dados de treino.
        </p>

        <button onClick={handleExportFile} style={{ ...styles.btn, ...styles.btnBackup }}>
          <Download size={16} /> Exportar Arquivo JSON
        </button>

        <div style={styles.divider} />

        <div style={styles.formGroup}>
          <div style={{ ...styles.settingLabel, marginBottom: '6px' }}>Importar Backup</div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Cole o código JSON do seu backup aqui..."
            style={styles.textarea}
          />
          <button onClick={handleImportJson} style={{ ...styles.btn, ...styles.btnImport, marginTop: '8px' }}>
            <Upload size={16} /> Importar Código JSON
          </button>

          {importStatus === 'success' && (
            <div style={styles.successAlert}>
              <CheckCircle2 size={16} /> Dados importados com sucesso!
            </div>
          )}
          {importStatus === 'error' && (
            <div style={styles.errorAlert}>
              <AlertTriangle size={16} /> Backup inválido ou corrompido. Nenhuma alteração foi feita.
            </div>
          )}
        </div>
      </div>

      {/* Conta */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Conta</h2>
        {user && (
          <div style={styles.accountRow}>
            <div style={styles.accountInfo}>
              <div style={styles.settingLabel}>{user.name}</div>
              <div style={styles.settingDesc}>{user.email}</div>
            </div>
            <button onClick={() => logout()} style={styles.logoutBtn}>
              <LogOut size={15} />
              Sair
            </button>
          </div>
        )}
      </div>

      {/* Perigo / Reset */}
      <div style={styles.section}>
        <h2 style={{ ...styles.sectionTitle, color: 'var(--error)' }}>Perigo</h2>
        {showConfirmReset ? (
          <div style={styles.confirmBox}>
            <div style={styles.confirmText}>
              <AlertTriangle size={20} color="var(--error)" />
              Tem certeza? Isso apagará permanentemente todo seu histórico de treinos e recordes pessoais.
            </div>
            <div style={styles.confirmButtons}>
              <button onClick={() => setShowConfirmReset(false)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button onClick={handleResetData} style={styles.confirmDeleteBtn}>
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowConfirmReset(true)} style={{ ...styles.btn, ...styles.btnDelete }}>
            <Trash2 size={16} /> Limpar Todos os Dados
          </button>
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
  section: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '6px',
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  themeCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 8px',
  },
  themeCheck: {
    position: 'absolute',
    top: '-7px',
    right: '-7px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchWrap: {
    width: '100%',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatch: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: '5px solid',
    boxSizing: 'border-box',
  },
  themeName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  themeDesc: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    paddingRight: '12px',
  },
  settingLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  settingDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  unitToggle: {
    display: 'flex',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '6px',
    padding: '2px',
    border: '1px solid var(--border-color)',
  },
  unitBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '4px',
  },
  numberInput: {
    width: '80px',
    height: '36px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  select: {
    width: '120px',
    height: '36px',
    fontSize: '13px',
    fontWeight: '700',
    padding: '0 8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '12px',
  },
  platesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '8px',
  },
  plateCheckbox: {
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '16px 0',
  },
  btn: {
    width: '100%',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnBackup: {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-ink)',
  },
  btnImport: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  btnDelete: {
    backgroundColor: 'rgba(229, 84, 75, 0.1)',
    color: 'var(--error)',
    border: '1px solid rgba(229, 84, 75, 0.2)',
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
    flex: 1,
    minWidth: 0,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  textarea: {
    width: '100%',
    height: '80px',
    fontSize: '12px',
    fontFamily: 'monospace',
    resize: 'none',
    backgroundColor: 'var(--bg-primary)',
    marginTop: '6px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(55, 184, 127, 0.1)',
    color: 'var(--success)',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    marginTop: '10px',
    border: '1px solid rgba(55, 184, 127, 0.2)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(229, 84, 75, 0.1)',
    color: 'var(--error)',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    marginTop: '10px',
    border: '1px solid rgba(229, 84, 75, 0.2)',
  },
  confirmBox: {
    backgroundColor: 'rgba(229, 84, 75, 0.05)',
    border: '1px solid rgba(229, 84, 75, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
  },
  confirmText: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  confirmButtons: {
    display: 'flex',
    gap: '8px',
  },
  cancelBtn: {
    flex: 1,
    height: '32px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  confirmDeleteBtn: {
    flex: 1,
    height: '32px',
    backgroundColor: 'var(--error)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
  },
  customPlatesSection: {
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  customPlateInput: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  plateNumberInput: {
    flex: 1,
    height: '36px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  addPlateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-ink)',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  customPlatesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  customPlateItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
  },
  customPlateName: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  removeCustomPlateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0',
  },
};
export default Settings;
