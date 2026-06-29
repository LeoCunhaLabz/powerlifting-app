import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import { env } from './env.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { workoutRoutes } from './routes/workouts.js'
import { templateRoutes } from './routes/templates.js'
import { syncRoutes } from './routes/sync.js'
import { dbPluginFp } from './plugins/db.js'
import { authPluginFp } from './plugins/auth.js'
import { runMigrations } from './db/index.js'

const FIELD_LABELS: Record<string, string> = {
  email: 'e-mail',
  password: 'senha',
  name: 'nome',
}

const normalizePath = (path: (string | number)[]): string => {
  const relevantSegments = path
    .filter((segment) => segment !== 'body')
    .map((segment) => String(segment))

  return relevantSegments.join('.')
}

const formatField = (path: (string | number)[]): string => {
  const normalizedPath = normalizePath(path)
  const lastSegment = normalizedPath.split('.').at(-1)

  if (!lastSegment) {
    return 'campo'
  }

  return FIELD_LABELS[lastSegment] ?? lastSegment
}

const formatZodValidationMessage = (error: ZodError): string => {
  const firstIssue = error.issues[0]

  if (!firstIssue) {
    return 'Dados inválidos. Revise os campos enviados.'
  }

  const field = formatField(firstIssue.path)

  if (field === 'e-mail') {
    if (firstIssue.code === 'invalid_string') {
      return 'Informe um e-mail válido.'
    }

    if (firstIssue.code === 'too_small') {
      return 'Informe o e-mail.'
    }
  }

  if (field === 'senha') {
    if (firstIssue.code === 'too_small') {
      const minLength =
        typeof firstIssue.minimum === 'number' && Number.isFinite(firstIssue.minimum)
          ? firstIssue.minimum
          : undefined

      if (minLength && minLength > 1) {
        return `A senha deve ter ao menos ${minLength} caracteres.`
      }

      return 'Informe a senha.'
    }
  }

  if (field === 'nome' && firstIssue.code === 'too_small') {
    return 'Informe o nome.'
  }

  return `Valor inválido para ${field}.`
}

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

await app.register(cors, { origin: env.CORS_ORIGIN })
await app.register(helmet, { contentSecurityPolicy: false })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
await app.register(dbPluginFp)
await app.register(authPluginFp)
await app.register(healthRoutes)
await app.register(authRoutes)
await app.register(workoutRoutes)
await app.register(templateRoutes)
await app.register(syncRoutes)

const defaultErrorHandler = app.errorHandler

app.setErrorHandler((error: FastifyError, request, reply) => {
  const statusCode = error.statusCode ?? 500

  if (error instanceof ZodError) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: formatZodValidationMessage(error),
    })
  }

  if (statusCode < 500) {
    return defaultErrorHandler(error, request, reply)
  }

  request.log.error({ err: error }, 'Erro interno não tratado')

  return reply.code(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Erro interno do servidor',
  })
})

const shutdown = async () => {
  try {
    await app.close()
    process.exit(0)
  } catch (err) {
    app.log.error({ err }, 'Erro ao encerrar o servidor')
    process.exit(1)
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  await runMigrations(env.DATABASE_URL)
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (err) {
  app.log.error({ err }, 'Falha ao iniciar o servidor')
  process.exit(1)
}
