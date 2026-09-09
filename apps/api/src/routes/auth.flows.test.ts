import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as sleep } from 'node:timers/promises'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { authRoutes } from './auth.js'
import { authPluginFp } from '../plugins/auth.js'
import { users, sessions } from '../db/schema.js'
import { hashPassword } from '../lib/auth.js'

// ---------------------------------------------------------------------------
// Cobertura pré-lançamento das rotas de auth (issue #251): register, login,
// logout, GET/DELETE /auth/me, google e o replay de refresh rotacionado —
// complementa auth.test.ts (forgot/reset/refresh). Mesmo padrão do repo:
// rota→schema→handler reais via inject, db drizzle mockado por teste. O JWT é
// o @fastify/jwt REAL (via authPluginFp, secret do .env.test) para exercitar
// sign/verify e expiração de verdade.
// ---------------------------------------------------------------------------

const USER_ID = '3f2f2ecb-30e6-4f8e-9d3f-1af1cc9be1f7'

interface DbUser {
  id: string
  email: string
  name: string
  passwordHash: string | null
}

interface Recorder {
  inserted: Array<{ table: unknown; value: Record<string, unknown> }>
  deleted: Array<{ table: unknown }>
}

// bcrypt de 12 rounds é lento de propósito — um hash único compartilhado pelos testes.
const SENHA_CORRETA = 'senha-correta-123'
const senhaCorretaHash = await hashPassword(SENHA_CORRETA)

/**
 * Db mockado cobrindo as chains que as rotas deste arquivo usam:
 * select().from().where().limit(), insert().values()[.returning()],
 * delete().where()[.returning()] e transaction. O estado é canned por teste
 * (`user`, `sessionOnDelete`); `deleteSessionOnce` faz o delete da sessão
 * devolver a linha só na PRIMEIRA chamada — é o comportamento real da rotação
 * que o teste de replay do refresh exercita.
 */
function createDb(opts: { user?: DbUser | null; sessionOnDelete?: { userId: string; expiresAt: Date } | null; deleteSessionOnce?: boolean } = {}) {
  const recorder: Recorder = { inserted: [], deleted: [] }
  let sessionDeletes = 0

  const db = {
    recorder,
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                async limit() {
                  if (table === users && opts.user) return [opts.user]
                  return []
                },
              }
            },
          }
        },
      }
    },
    insert(table: unknown) {
      return {
        values(value: Record<string, unknown>) {
          recorder.inserted.push({ table, value })
          return {
            then(resolve: (v: undefined) => void) {
              resolve(undefined)
            },
            async returning() {
              return [{ id: USER_ID, email: value.email, name: value.name }]
            },
          }
        },
      }
    },
    delete(table: unknown) {
      return {
        where() {
          recorder.deleted.push({ table })
          return {
            then(resolve: (v: undefined) => void) {
              resolve(undefined)
            },
            async returning() {
              if (table !== sessions || !opts.sessionOnDelete) return []
              sessionDeletes += 1
              if (opts.deleteSessionOnce && sessionDeletes > 1) return []
              return [opts.sessionOnDelete]
            },
          }
        },
      }
    },
    async transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      return fn(db)
    },
  }
  return db
}

async function buildApp(db: ReturnType<typeof createDb>) {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.decorate('db', db as never)
  await app.register(authPluginFp)
  await app.register(authRoutes)
  return app
}

// --- POST /auth/register ---

test('POST /auth/register cria a conta: 201 com tokens, user sem passwordHash e sessão criada', async () => {
  const db = createDb({ user: null })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { name: 'Atleta', email: 'Novo@Example.com', password: 'senha-valida-123' },
  })

  assert.equal(response.statusCode, 201)
  const body = response.json()
  assert.ok(body.accessToken)
  assert.ok(body.refreshToken)
  assert.equal(body.user.email, 'novo@example.com') // normalizado pelo schema
  assert.ok(!('passwordHash' in body.user), 'passwordHash nunca aparece na resposta')
  // insert do usuário + insert da sessão (refresh token)
  assert.equal(db.recorder.inserted.filter((i) => i.table === users).length, 1)
  assert.equal(db.recorder.inserted.filter((i) => i.table === sessions).length, 1)

  await app.close()
})

test('POST /auth/register com e-mail já cadastrado responde 409 sem criar nada', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'existe@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { name: 'Atleta', email: 'existe@example.com', password: 'senha-valida-123' },
  })

  assert.equal(response.statusCode, 409)
  assert.equal(response.json().code, 'EMAIL_ALREADY_REGISTERED')
  assert.equal(db.recorder.inserted.length, 0)

  await app.close()
})

test('POST /auth/register com senha curta responde 400 sem tocar o banco', async () => {
  const db = createDb()
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { name: 'Atleta', email: 'novo@example.com', password: 'curta' },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(db.recorder.inserted.length, 0)

  await app.close()
})

// --- POST /auth/login ---

test('POST /auth/login com credenciais válidas responde 200 com tokens e user', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'atleta@example.com', password: SENHA_CORRETA },
  })

  assert.equal(response.statusCode, 200)
  const body = response.json()
  assert.ok(body.accessToken)
  assert.ok(body.refreshToken)
  assert.ok(!('passwordHash' in body.user))
  assert.equal(db.recorder.inserted.filter((i) => i.table === sessions).length, 1)

  await app.close()
})

test('POST /auth/login com senha errada e com usuário inexistente respondem o MESMO 401 (anti-enumeração)', async () => {
  const dbSenhaErrada = createDb({ user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const appSenhaErrada = await buildApp(dbSenhaErrada)
  const senhaErrada = await appSenhaErrada.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'atleta@example.com', password: 'senha-errada-999' },
  })

  const dbInexistente = createDb({ user: null })
  const appInexistente = await buildApp(dbInexistente)
  const inexistente = await appInexistente.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'ninguem@example.com', password: 'qualquer-senha-1' },
  })

  assert.equal(senhaErrada.statusCode, 401)
  assert.equal(inexistente.statusCode, 401)
  assert.deepEqual(senhaErrada.json(), inexistente.json(), 'mesmo corpo nos dois casos')
  assert.equal(dbSenhaErrada.recorder.inserted.length, 0)

  await appSenhaErrada.close()
  await appInexistente.close()
})

test('POST /auth/login em conta Google (sem senha) responde 401 em vez de quebrar', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'google@example.com', name: 'Atleta', passwordHash: null } })
  const app = await buildApp(db)

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'google@example.com', password: 'qualquer-senha-1' },
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.json().code, 'INVALID_CREDENTIALS')

  await app.close()
})

// --- POST /auth/refresh: replay do token rotacionado ---

test('POST /auth/refresh reutilizado após rotação responde 401 (token antigo morre com a rotação)', async () => {
  const db = createDb({
    user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash },
    sessionOnDelete: { userId: USER_ID, expiresAt: new Date(Date.now() + 60_000) },
    deleteSessionOnce: true,
  })
  const app = await buildApp(db)

  const primeira = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refreshToken: 'R0' } })
  assert.equal(primeira.statusCode, 200)
  assert.ok(primeira.json().refreshToken !== 'R0')

  // Replay do token antigo: a sessão já foi deletada na rotação — 401.
  const replay = await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refreshToken: 'R0' } })
  assert.equal(replay.statusCode, 401)
  assert.equal(replay.json().code, 'INVALID_REFRESH_TOKEN')

  await app.close()
})

// --- POST /auth/logout ---

test('POST /auth/logout responde 204 e apaga a sessão', async () => {
  const db = createDb()
  const app = await buildApp(db)

  const response = await app.inject({ method: 'POST', url: '/auth/logout', payload: { refreshToken: 'R0' } })

  assert.equal(response.statusCode, 204)
  assert.equal(db.recorder.deleted.filter((d) => d.table === sessions).length, 1)

  await app.close()
})

// --- GET /auth/me ---

test('GET /auth/me com access token válido responde 200 com o user', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const app = await buildApp(db)
  const token = app.jwt.sign({ sub: USER_ID, email: 'atleta@example.com' })

  const response = await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${token}` } })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().id, USER_ID)
  assert.ok(!('passwordHash' in response.json()))

  await app.close()
})

test('GET /auth/me sem token e com token expirado respondem 401', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const app = await buildApp(db)

  const semToken = await app.inject({ method: 'GET', url: '/auth/me' })
  assert.equal(semToken.statusCode, 401)

  const expirado = app.jwt.sign({ sub: USER_ID, email: 'atleta@example.com' }, { expiresIn: '1ms' })
  await sleep(20)
  const comExpirado = await app.inject({ method: 'GET', url: '/auth/me', headers: { authorization: `Bearer ${expirado}` } })
  assert.equal(comExpirado.statusCode, 401)

  await app.close()
})

// --- DELETE /auth/me ---

test('DELETE /auth/me responde 204 e apaga o usuário (cascade limpa o resto)', async () => {
  const db = createDb({ user: { id: USER_ID, email: 'atleta@example.com', name: 'Atleta', passwordHash: senhaCorretaHash } })
  const app = await buildApp(db)
  const token = app.jwt.sign({ sub: USER_ID, email: 'atleta@example.com' })

  const response = await app.inject({ method: 'DELETE', url: '/auth/me', headers: { authorization: `Bearer ${token}` } })

  assert.equal(response.statusCode, 204)
  assert.equal(db.recorder.deleted.filter((d) => d.table === users).length, 1)

  await app.close()
})

// --- POST /auth/google ---

test('POST /auth/google sem GOOGLE_CLIENT_ID configurado responde 503', async () => {
  // .env.test não define GOOGLE_CLIENT_ID — o endpoint deve degradar com 503.
  const db = createDb()
  const app = await buildApp(db)

  const response = await app.inject({ method: 'POST', url: '/auth/google', payload: { credential: 'abc' } })

  assert.equal(response.statusCode, 503)
  assert.equal(response.json().code, 'GOOGLE_AUTH_UNAVAILABLE')

  await app.close()
})
