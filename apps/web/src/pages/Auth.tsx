import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthApiError } from '../services/authApi';
import { Eye, EyeOff, Dumbbell } from 'lucide-react';

type Mode = 'login' | 'register';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim().toLowerCase(), password);
      } else {
        if (name.trim().length < 1) {
          setError('Informe seu nome.');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('A senha deve ter ao menos 8 caracteres.');
          setLoading(false);
          return;
        }
        await register(name.trim(), email.trim().toLowerCase(), password);
      }
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível conectar ao servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setName('');
    setPassword('');
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>
            <Dumbbell size={28} color="var(--accent-ink)" />
          </span>
          <span style={styles.wordmark}>ONYX</span>
        </div>

        <h1 style={styles.title}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p style={styles.subtitle}>
          {mode === 'login'
            ? 'Acesse seu histórico de treinos em qualquer dispositivo.'
            : 'Registre-se para sincronizar seus treinos.'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {mode === 'register' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="auth-name">Nome</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="auth-password">Senha</label>
            <div style={styles.passwordWrap}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                style={{ ...styles.input, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading
              ? 'Aguarde…'
              : mode === 'login'
              ? 'Entrar'
              : 'Criar conta'}
          </button>
        </form>

        <div style={styles.switchRow}>
          <span style={styles.switchText}>
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </span>
          <button onClick={toggleMode} style={styles.switchBtn}>
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--bg-primary)',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wordmark: {
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    fontSize: '22px',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition-fast)',
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    background: 'rgba(229, 84, 75, 0.12)',
    border: '1px solid rgba(229, 84, 75, 0.35)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--error)',
    fontSize: '13px',
    padding: '10px 14px',
    fontWeight: 500,
  },
  submitBtn: {
    marginTop: '4px',
    padding: '14px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-ink)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 800,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)',
  },
  switchRow: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
  },
  switchText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0',
    textDecoration: 'underline',
  },
};

export default Auth;
