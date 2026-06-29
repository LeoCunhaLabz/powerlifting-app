import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthApiError, forgotPassword, resetPassword } from '../services/authApi';
import { Eye, EyeOff, Dumbbell, ArrowLeft } from 'lucide-react';

// Declaração mínima do Google Identity Services (carregado via script externo)
declare const google: {
  accounts: {
    id: {
      initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: object) => void;
      cancel: () => void;
    };
  };
} | undefined;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Mode = 'login' | 'register' | 'forgot' | 'reset';

// Lê o token de redefinição da URL (?reset_token=...) uma única vez, no carregamento.
const initialResetToken = (() => {
  try {
    return new URLSearchParams(window.location.search).get('reset_token');
  } catch {
    return null;
  }
})();

export const Auth: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>(initialResetToken ? 'reset' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(initialResetToken);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Remove o parâmetro reset_token da URL (após concluir/cancelar o fluxo de reset).
  const clearResetParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  };

  // Inicializa o botão Google GSI quando o script carregar
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const init = () => {
      if (typeof google === 'undefined' || !googleBtnRef.current) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError(null);
          setLoading(true);
          try {
            await loginWithGoogle(credential);
          } catch (err) {
            setError(err instanceof AuthApiError ? err.message : 'Erro ao entrar com Google.');
          } finally {
            setLoading(false);
          }
        },
      });
      google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 352,
        text: 'signin_with',
        locale: 'pt-BR',
      });
    };

    // Lazy-load do script GSI apenas quando VITE_GOOGLE_CLIENT_ID estiver definido
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) {
      // Script já injetado (hot reload / segunda montagem)
      if (typeof google !== 'undefined') {
        init();
      } else {
        existing.addEventListener('load', init);
        return () => existing.removeEventListener('load', init);
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.addEventListener('load', init);
      document.head.appendChild(script);
      return () => {
        script.removeEventListener('load', init);
      };
    }
  }, [loginWithGoogle]);

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
          return;
        }
        if (password.length < 8) {
          setError('A senha deve ter ao menos 8 caracteres.');
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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setInfo(res.message);
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!resetToken) {
      setError('Link de redefinição inválido. Solicite um novo.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      clearResetParam();
      setResetToken(null);
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      setInfo('Senha redefinida com sucesso. Faça login com a nova senha.');
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

  const goToMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
    if (m !== 'reset') {
      clearResetParam();
      setResetToken(null);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setInfo(null);
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

        {(mode === 'forgot' || mode === 'reset') && (
          <button onClick={() => goToMode('login')} style={styles.backLink}>
            <ArrowLeft size={14} /> Voltar ao login
          </button>
        )}

        <h1 style={styles.title}>
          {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Recuperar senha' : 'Nova senha'}
        </h1>
        <p style={styles.subtitle}>
          {mode === 'login'
            ? 'Acesse seu histórico de treinos em qualquer dispositivo.'
            : mode === 'register'
            ? 'Registre-se para sincronizar seus treinos.'
            : mode === 'forgot'
            ? 'Informe seu e-mail e enviaremos um link para redefinir a senha.'
            : 'Defina uma nova senha para a sua conta.'}
        </p>

        {/* Forgot password form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="auth-email">E-mail</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                style={styles.input}
              />
            </div>
            {error && <div style={styles.errorBox} role="alert">{error}</div>}
            {info && <div style={styles.infoBox} role="status">{info}</div>}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Aguarde…' : 'Enviar link'}
            </button>
          </form>
        )}

        {/* Reset password form */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="auth-password">Nova senha</label>
              <div style={styles.passwordWrap}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
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
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="auth-confirm">Confirmar senha</label>
              <input
                id="auth-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                required
                style={styles.input}
              />
            </div>
            {error && <div style={styles.errorBox} role="alert">{error}</div>}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Aguarde…' : 'Redefinir senha'}
            </button>
          </form>
        )}

        {/* Login / register form */}
        {(mode === 'login' || mode === 'register') && (
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

          {mode === 'login' && (
            <button type="button" onClick={() => goToMode('forgot')} style={styles.forgotLink}>
              Esqueci minha senha
            </button>
          )}

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}
          {info && (
            <div style={styles.infoBox} role="status">
              {info}
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
        )}

        {(mode === 'login' || mode === 'register') && (
        <div style={styles.switchRow}>
          <span style={styles.switchText}>
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </span>
          <button onClick={toggleMode} style={styles.switchBtn}>
            {mode === 'login' ? 'Cadastrar' : 'Entrar'}
          </button>
        </div>
        )}

        {GOOGLE_CLIENT_ID && (mode === 'login' || mode === 'register') && (
          <>
            <div style={styles.dividerRow}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>ou</span>
              <span style={styles.dividerLine} />
            </div>
            <div ref={googleBtnRef} style={styles.googleBtnWrap} />
          </>
        )}
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
    textAlign: 'center',
  },
  infoBox: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--accent)',
    fontSize: '13px',
    padding: '10px 14px',
    fontWeight: 500,
    textAlign: 'center',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: '16px',
    alignSelf: 'flex-start',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    alignSelf: 'flex-end',
    textDecoration: 'underline',
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
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  googleBtnWrap: {
    marginTop: '12px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
};

export default Auth;
