import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: z.object({ status: z.literal('ok') }),
          503: z.object({ status: z.literal('degraded'), error: z.string() }),
        },
      },
    },
    async (_req, reply) => {
      try {
        await app.db.execute(sql`SELECT 1`)
        return reply.send({ status: 'ok' as const })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return reply.status(503).send({ status: 'degraded' as const, error: message })
      }
    },
  )
}
