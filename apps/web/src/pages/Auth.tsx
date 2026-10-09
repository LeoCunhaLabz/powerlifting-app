import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthApiError, forgotPassword, resetPassword } from '../services/authApi';
import { hasPendingHandoff } from '../utils/strengthHandoff';
import { Button, Field, IconButton } from '../ui';
import { cx } from '../ui/cx';
import styles from './Auth.module.css';

// Declaração mínima do Google Identity Services (carregado via script externo)
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

type Mode = 'welcome' | 'login' | 'register' | 'forgot' | 'reset';

// Lê o token de redefinição da URL (?reset_token=...) uma única vez, no carregamento.
const initialResetToken = (() => {
  try {
    return new URLSearchParams(window.location.search).get('reset_token');
  } catch {
    return null;
  }
})();

const SERVER_ERROR = 'Não foi possível conectar ao servidor. Tente novamente.';

interface AuthProps {
  /** Veio de /registro (CTA da landing): abre direto no cadastro. */
  openRegister?: boolean;
}

/** A marca ONYX: a anilha vista de frente (mesmo desenho do favicon.svg). */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="118 118 276 276" aria-hidden="true" className={styles.mark}>
      <circle cx="256" cy="256" r="113" fill="none" strokeWidth="50" />
    </svg>
  );
}

/**
 * Entrada do app (#337): boas-vindas com a marca e uma frase de benefício, depois
 * cadastro, login, recuperar e redefinir senha, sem card. Google antes do e-mail.
 */
export const Auth: React.FC<AuthProps> = ({ openRegister = false }) => {
  const { login, register, loginWithGoogle } = useAuth();
  // Resultado da calculadora de força aguardando cadastro (#318) — lido uma vez.
  const [pendingHandoff] = useState(() => hasPendingHandoff());
  const [mode, setMode] = useState<Mode>(
    initialResetToken ? 'reset' : openRegister || pendingHandoff ? 'register' : 'welcome',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(initialResetToken);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Remove o parâmetro reset_token da URL (após concluir/cancelar o fluxo de reset).
  const clearResetParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  };

  // Carrega o script do Google uma vez (só com VITE_GOOGLE_CLIENT_ID) e inicializa o GSI.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const init = () => {
      if (typeof google === 'undefined') return;
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
      setGsiReady(true);
    };

    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing && typeof google !== 'undefined') {
      // Script já carregado (hot reload / segunda montagem): inicializa fora do corpo do efeito.
      const id = window.setTimeout(init, 0);
      return () => window.clearTimeout(id);
    }
    const script = existing ?? document.createElement('script');
    if (!existing) {
      (script as HTMLScriptElement).src = 'https://accounts.google.com/gsi/client';
      (script as HTMLScriptElement).async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => script.removeEventListener('load', init);
  }, [loginWithGoogle]);

  // O botão do Google é redesenhado a cada troca de tela: o container só existe no cadastro e no login.
  useEffect(() => {
    const el = googleBtnRef.current;
    if (!gsiReady || !el || typeof google === 'undefined') return;
    el.replaceChildren();
    google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      shape: 'rectangular',
      width: Math.min(400, el.offsetWidth || 343),
      text: mode === 'register' ? 'signup_with' : 'signin_with',
      locale: 'pt-BR',
    });
  }, [gsiReady, mode]);

  const failWith = (err: unknown) => setError(err instanceof AuthApiError ? err.message : SERVER_ERROR);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (mode === 'register') {
      const errors = {
        name: name.trim().length < 1 ? 'Informe seu nome.' : undefined,
        password: password.length < 8 ? 'A senha deve ter ao menos 8 caracteres.' : undefined,
      };
      if (errors.name || errors.password) {
        setFieldErrors(errors);
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'login') await login(email.trim().toLowerCase(), password);
      else await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      failWith(err);
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
      failWith(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setFieldErrors({});
    if (password.length < 8) {
      setFieldErrors({ password: 'A senha deve ter ao menos 8 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors({ confirm: 'As senhas não coincidem.' });
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
      setInfo('Senha redefinida. Entre com a nova senha.');
    } catch (err) {
      failWith(err);
    } finally {
      setLoading(false);
    }
  };

  const goToMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    if (m !== 'reset') {
      clearResetParam();
      setResetToken(null);
    }
  };

  const passwordToggle = (
    <IconButton
      variant="plain"
      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={showPassword}
      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      onClick={() => setShowPassword((v) => !v)}
    />
  );

  const messages = (
    <>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {info && <p role="status" className={styles.info}>{info}</p>}
    </>
  );

  // ─── Boas-vindas ───
  if (mode === 'welcome') {
    return (
      <main className={cx(styles.screen, styles.welcomeScreen)}>
        <header className={styles.brand}>
          <Mark />
          <span className={styles.wordmark}>ONYX</span>
        </header>
        <section className={styles.welcome} aria-labelledby="welcome-title">
          <h1 id="welcome-title" className={styles.heroTitle}>Treine sem fazer conta no meio da série.</h1>
          <p className={styles.heroText}>
            Registre cada série, veja a carga do dia pelo seu máximo e acompanhe a evolução. Em português e funciona sem internet.
          </p>
          <div className={styles.actions}>
            <Button variant="primary" size="lg" block onClick={() => goToMode('register')}>Criar conta</Button>
            <Button variant="secondary" block onClick={() => goToMode('login')}>Já tenho conta</Button>
          </div>
        </section>
      </main>
    );
  }

  const isAccountForm = mode === 'login' || mode === 'register';
  const title = mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Recuperar senha' : 'Nova senha';
  const subtitle =
    mode === 'login'
      ? 'Seus treinos e recordes continuam de onde parou.'
      : mode === 'register'
        ? 'Grátis. Seus treinos e recordes ficam guardados mesmo se trocar de celular.'
        : mode === 'forgot'
          ? 'Informe seu e-mail e enviaremos um link para redefinir a senha.'
          : 'Defina uma nova senha para a sua conta.';

  return (
    <main className={styles.screen}>
      <header className={styles.top}>
        <IconButton
          variant="plain"
          aria-label={isAccountForm ? 'Voltar' : 'Voltar para entrar'}
          icon={<ArrowLeft size={20} />}
          onClick={() => goToMode(isAccountForm ? 'welcome' : 'login')}
        />
        <span className={styles.topBrand} aria-hidden="true">
          <Mark size={20} />
          <span className={styles.wordmarkSmall}>ONYX</span>
        </span>
      </header>

      <div className={styles.content}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {mode === 'register' && pendingHandoff && (
            <p className={styles.handoff} role="status">Vamos guardar seu resultado da calculadora nesta conta.</p>
          )}
        </div>

        {/* Google antes do e-mail: no Android é o caminho mais curto. */}
        {GOOGLE_CLIENT_ID && isAccountForm && (
          <>
            <div ref={googleBtnRef} className={styles.google} />
            <div className={styles.divider}><span>ou com e-mail</span></div>
          </>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className={styles.form} noValidate>
            <Field
              id="auth-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {messages}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? 'Aguarde…' : 'Enviar link'}
            </Button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className={styles.form} noValidate>
            <Field
              id="auth-password"
              label="Nova senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Mínimo de 8 caracteres."
              error={fieldErrors.password}
              trailing={passwordToggle}
              required
            />
            <Field
              id="auth-confirm"
              label="Confirmar senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirm}
              required
            />
            {messages}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? 'Aguarde…' : 'Redefinir senha'}
            </Button>
          </form>
        )}

        {isAccountForm && (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {mode === 'register' && (
              <Field
                id="auth-name"
                label="Nome"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                required
              />
            )}
            <Field
              id="auth-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              id="auth-password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={mode === 'register' ? 'Mínimo de 8 caracteres.' : undefined}
              error={fieldErrors.password}
              trailing={passwordToggle}
              required
            />
            {mode === 'login' && (
              <Button variant="link" className={styles.forgot} onClick={() => goToMode('forgot')}>
                Esqueci minha senha
              </Button>
            )}
            {messages}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        )}

        {isAccountForm && (
          <p className={styles.switch}>
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}
            <Button variant="link" onClick={() => goToMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </Button>
          </p>
        )}
      </div>
    </main>
  );
};

export default Auth;
