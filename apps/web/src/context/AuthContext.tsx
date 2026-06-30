import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshTokens as apiRefresh,
  getMe,
  loginWithGoogle as apiLoginWithGoogle,
  deleteAccount as apiDeleteAccount,
} from '../services/authApi';
import type { AuthUser } from '../services/authApi';

const ACCESS_TOKEN_KEY = 'powerlifting_token';
const REFRESH_TOKEN_KEY = 'powerlifting_refresh_token';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** null = ainda verificando sessão salva */
  isLoading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Exclui a conta no servidor e limpa a sessão local. */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveTokens(accessToken: string, refreshToken: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // ignora erros de cota/modo privado
  }
}

function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignora
  }
}

function getSavedRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar: tenta restaurar sessão via refresh token salvo
  useEffect(() => {
    const restore = async () => {
      const savedRefresh = getSavedRefreshToken();
      if (!savedRefresh) {
        setIsLoading(false);
        return;
      }
      try {
        const tokens = await apiRefresh(savedRefresh);
        const me = await getMe(tokens.accessToken);
        saveTokens(tokens.accessToken, tokens.refreshToken);
        setAccessToken(tokens.accessToken);
        setUser(me);
      } catch {
        // refresh inválido/expirado — limpa e pede novo login
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiRegister(name, email, password);
    saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const savedRefresh = getSavedRefreshToken();
    if (savedRefresh) {
      try {
        await apiLogout(savedRefresh);
      } catch {
        // falha de rede/server no logout remoto — limpa localmente de qualquer forma
      }
    }
    clearTokens();
    setAccessToken(null);
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await apiLoginWithGoogle(credential);
    saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (accessToken) {
      await apiDeleteAccount(accessToken);
    }
    clearTokens();
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        accessToken,
        login,
        register,
        logout,
        loginWithGoogle,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
