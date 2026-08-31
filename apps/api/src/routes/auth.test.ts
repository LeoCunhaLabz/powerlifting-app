import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { authRoutes } from './auth.js'
import { users, passwordResetTokens } from '../db/schema.js'

interface MockUser {
  id: string
  email: string
  name: string
}

interface MockResetRecord {
  id: string
  userId: string
}

interface Recorder {
  inserted: Array<{ table: unknown; value: Record<string, unknown> }>
  updated: Array<{ table: unknown; value: Record<string, unknown> }>
  deleted: Array<{ table: unknown }>
}

function makeQueryChain(table: unknown, opts: { forgotUser: MockUser | null; resetRecord: MockResetRecord | null }) {
  return {
    where() {
      return this
    },
    for() {
      return this
    },
    async limit() {
      if (table === users) return opts.forgotUser ? [opts.forgotUser] : []
      if (table === passwordResetTokens) return opts.resetRecord ? [opts.resetRecord] : []
      return []
    },
  }
}

function makeDbLike(recorder: Recorder, opts: { forgotUser: MockUser | null; resetRecord: MockResetRecord | null }) {
  return {
    select() {
      return { from(table: unknown) { return makeQueryChain(table, opts) } }
    },
    insert(table: unknown) {
      return {
        async values(value: Record<string, unknown>) {
          recorder.inserted.push({ table, value })
        },
      }
    },
    update(table: unknown) {
      return {
        set(value: Record<string, unknown>) {
          return {
            async where() {
              recorder.updated.push({ table, value })
            },
          }
        },
      }
    },
    delete(table: unknown) {
      return {
        async where() {
          recorder.deleted.push({ table })
        },
      }
    },
  }
}

function createAuthMockDb(opts: { forgotUser?: MockUser | null; resetRecord?: MockResetRecord | null } = {}) {
  const recorder: Recorder = { inserted: [], updated: [], deleted: [] }
  const resolved = { forgotUser: opts.forgotUser ?? null, resetRecord: opts.resetRecord ?? null }
  const base = makeDbLike(recorder, resolved)

  return {
    ...base,
    async transaction<T>(fn: (tx: ReturnType<typeof makeDbLike>) => Promise<T>): Promise<T> {
      return fn(makeDbLike(recorder, resolved))
    },
    recorder,
  }
}

async function buildApp(db: ReturnType<typeof createAuthMockDb>) {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorate('db', db as never)
  app.decorate('authenticate', async () => {})
  await app.register(authRoutes)
  return app
}

test('POST /auth/forgot com e-mail existente responde genérico e cria token', async () => {
  const db = createAuthMockDb({ forgotUser: { id: 'user-1', email: 'atleta@example.com', name: 'Atleta' } })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/forgot',
    payload: { email: 'atleta@example.com' },
  })

  assert.equal(response.statusCode, 200)
  assert.match(response.json().message, /Se houver uma conta/)
  assert.equal(db.recorder.inserted.length, 1)
  assert.equal(db.recorder.inserted[0]?.table, passwordResetTokens)

  await app.close()
})

test('POST /auth/forgot com e-mail inexistente responde a mesma mensagem genérica, sem criar token', async () => {
  const db = createAuthMockDb({ forgotUser: null })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/forgot',
    payload: { email: 'ninguem@example.com' },
  })

  assert.equal(response.statusCode, 200)
  assert.match(response.json().message, /Se houver uma conta/)
  assert.equal(db.recorder.inserted.length, 0)

  await app.close()
})

test('POST /auth/reset com token válido redefine a senha e invalida o token/sessões', async () => {
  const rawToken = 'valid-token-123'
  const db = createAuthMockDb({
    resetRecord: { id: 'reset-1', userId: 'user-1' },
  })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/reset',
    payload: { token: rawToken, password: 'nova-senha-forte' },
  })

  assert.equal(response.statusCode, 200)
  assert.match(response.json().message, /Senha redefinida/)
  assert.equal(db.recorder.updated.filter((u) => u.table === users).length, 1)
  assert.equal(db.recorder.updated.filter((u) => u.table === passwordResetTokens).length, 1)
  assert.equal(db.recorder.deleted.length, 1)

  await app.close()
})

test('POST /auth/reset com token expirado responde 400 sem alterar dados', async () => {
  // Token expirado/usado/inexistente: a query real (isNull(usedAt) + gt(expiresAt)) não
  // retorna linha — simulado aqui como resetRecord ausente.
  const db = createAuthMockDb({ resetRecord: null })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/reset',
    payload: { token: 'expired-token', password: 'nova-senha-forte' },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().code, 'INVALID_RESET_LINK')
  assert.equal(db.recorder.updated.length, 0)
  assert.equal(db.recorder.deleted.length, 0)

  await app.close()
})

test('POST /auth/reset com token já usado responde 400 sem alterar dados', async () => {
  const db = createAuthMockDb({ resetRecord: null })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/reset',
    payload: { token: 'ja-usado', password: 'nova-senha-forte' },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().code, 'INVALID_RESET_LINK')
  assert.equal(db.recorder.updated.length, 0)

  await app.close()
})
