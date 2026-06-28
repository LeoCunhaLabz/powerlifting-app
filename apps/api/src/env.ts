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
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
