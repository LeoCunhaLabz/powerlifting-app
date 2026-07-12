const API_BASE = import.meta.env.VITE_API_URL ?? '';

const USER_FACING_ERROR_CODES = new Set([
  'ACCOUNT_CREATION_FAILED',
  'EMAIL_ALREADY_REGISTERED',
  'EXPIRED_REFRESH_TOKEN',
  'GOOGLE_AUTH_UNAVAILABLE',
  'INVALID_CREDENTIALS',
  'INVALID_GOOGLE_CREDENTIAL',
  'INVALID_REFRESH_TOKEN',
  'INVALID_RESET_LINK',
  'UNAUTHORIZED',
  'VALIDATION_ERROR',
]);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

function fallbackErrorMessage(status: number): string {
  if (status === 429) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  }

  if (status >= 500) {
    return 'O serviço está temporariamente indisponível. Tente novamente.';
  }

  return 'Não foi possível concluir a solicitação. Revise os dados e tente novamente.';
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = fallbackErrorMessage(res.status);
    let code: string | undefined;
    try {
      const body = (await res.json()) as { code?: unknown; message?: unknown };
      if (
        typeof body.code === 'string'
        && USER_FACING_ERROR_CODES.has(body.code)
        && typeof body.message === 'string'
        && body.message.trim()
      ) {
        code = body.code;
        message = body.message;
      }
    } catch {
      // usa mensagem padrão
    }
    throw new AuthApiError(message, res.status, code);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new AuthApiError(
      'O servidor retornou uma resposta inesperada. Tente novamente.',
      res.status,
    );
  }
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse<AuthTokens>(res);
}

export async function logout(refreshToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  // ignora erros de rede/server no logout — limpa local sempre
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function getMe(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse<AuthUser>(res);
}

export async function deleteAccount(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new AuthApiError(fallbackErrorMessage(res.status), res.status);
  }
}
