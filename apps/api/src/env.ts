import { z } from 'zod'

const envSchema = z.object({
  PORT: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z.number().int().min(1).max(65535).default(3000),
  ),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
