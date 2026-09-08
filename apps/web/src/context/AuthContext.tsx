import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  loginWithGoogle as apiLoginWithGoogle,
  deleteAccount as apiDeleteAccount,
} from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { saveTokens, clearTokens, getRefreshToken, getAccessToken, refreshSession } from '../services/session';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar: tenta restaurar sessão via refresh token salvo.
  // refreshSession é single-flight + anti-clobber (#265): o StrictMode monta o
  // efeito duas vezes em dev, e duas abas compartilham o localStorage — sem isso
  // a chamada "perdedora" apagava os tokens que a vencedora acabara de salvar.
  useEffect(() => {
    const restore = async () => {
      if (!getRefreshToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const accessToken = await refreshSession();
        if (!accessToken) return; // sem sessão recuperável: refreshSession já limpou se preciso
        const me = await getMe(accessToken);
        // Relê: refreshSession pode ter reaproveitado o token de outra aba.
        setAccessToken(getAccessToken());
        setUser(me);
      } catch {
        // getMe falhou (ex.: rede) — não desloga; a sessão pode estar viva.
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
    const savedRefresh = getRefreshToken();
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
