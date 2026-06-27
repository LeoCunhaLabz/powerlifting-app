import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './env.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { dbPluginFp } from './plugins/db.js'
import { authPluginFp } from './plugins/auth.js'
import { runMigrations } from './db/index.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

await app.register(cors, { origin: env.CORS_ORIGIN })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
await app.register(dbPluginFp)
await app.register(authPluginFp)
await app.register(healthRoutes)
await app.register(authRoutes)

const defaultErrorHandler = app.errorHandler

app.setErrorHandler((error: FastifyError, request, reply) => {
  const statusCode = error.statusCode ?? 500

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
