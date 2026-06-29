import { randomBytes, createHash } from 'node:crypto'
import { hash, compare } from 'bcryptjs'

const BCRYPT_ROUNDS = 12

/** Gera o hash bcrypt de uma senha em texto puro. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS)
}

/** Compara uma senha em texto puro com um hash bcrypt. */
export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash)
}

/** Gera um refresh token aleatório criptograficamente seguro (base64url). */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Gera um token de redefinição de senha aleatório (base64url, alta entropia). */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Hash determinístico (sha256) de um token de alta entropia (refresh/reset). Alias semântico. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Calcula o hash determinístico (sha256) de um refresh token para armazenamento.
 * Determinístico para permitir busca por igualdade no banco; o token tem alta
 * entropia, então sha256 é adequado (bcrypt fica reservado para senhas).
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Converte uma duração no formato `<número><unidade>` (s, m, h, d) em milissegundos.
 * Ex.: `15m` -> 900000, `7d` -> 604800000.
 */
export function durationToMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim())
  if (!match) {
    throw new Error(`Duração inválida: "${duration}". Use formatos como 15m, 1h, 7d.`)
  }
  const value = Number(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }
  return value * multipliers[unit]
}
