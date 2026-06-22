import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { createDb, type Db } from '../db/index.js'
import { env } from '../env.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  const db = createDb(env.DATABASE_URL)
  fastify.decorate('db', db)
}

export const dbPluginFp = fp(dbPlugin, {
  name: 'db',
})
