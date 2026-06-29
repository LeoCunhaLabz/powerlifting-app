import { z } from 'zod'

const durationEnvSchema = z
  .string()
  .trim()
  .regex(/^\d+\s*(s|m|h|d)$/, 'Use formatos como 15m, 1h, 7d')

const envSchema = z.object({
  PORT: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z.number().int().min(1).max(65535).default(3000),
  ),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_EXPIRES_IN: durationEnvSchema.default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: durationEnvSchema.default('7d'),
  /** Client ID do Google OAuth (console.cloud.google.com). Obrigatório para login com Google. */
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  /** Validade do token de redefinição de senha. Default 1h. */
  PASSWORD_RESET_EXPIRES_IN: durationEnvSchema.default('1h'),
  /** API key do Resend (resend.com) para envio de e-mails. Se ausente, o link é apenas logado (dev). */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** Remetente dos e-mails (ex.: "ONYX <no-reply@seu-dominio.com>"). Necessário junto com RESEND_API_KEY. */
  EMAIL_FROM: z.string().min(1).optional(),
  /** URL pública do app web (base do link de redefinição). Default: CORS_ORIGIN. */
  APP_PUBLIC_URL: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
