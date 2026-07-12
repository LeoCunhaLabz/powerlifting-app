import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './env.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { workoutRoutes } from './routes/workouts.js'
import { templateRoutes } from './routes/templates.js'
import { syncRoutes } from './routes/sync.js'
import { dbPluginFp } from './plugins/db.js'
import { authPluginFp } from './plugins/auth.js'
import { runMigrations } from './db/index.js'
import { buildValidationErrorResponse } from './lib/validationError.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

const defaultErrorHandler = app.errorHandler

// Deve ser definido antes dos plugins de rotas: handlers configurados depois não
// são herdados pelos contextos encapsulados que o Fastify já registrou.
app.setErrorHandler((error: FastifyError, request, reply) => {
  const statusCode = error.statusCode ?? 500
  const validationError = buildValidationErrorResponse(error)

  if (validationError) {
    return reply.code(400).send(validationError)
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
