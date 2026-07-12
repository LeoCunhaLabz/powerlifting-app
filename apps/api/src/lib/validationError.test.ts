import assert from 'node:assert/strict'
import { test } from 'node:test'
import Fastify from 'fastify'
import { validatorCompiler } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ZodTypeAny } from 'zod'
import { buildValidationErrorResponse } from './validationError.js'

const validate = async (schema: ZodTypeAny, payload: Record<string, unknown>) => {
  const app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.post('/validate', { schema: { body: schema } }, async () => ({ ok: true }))
  app.setErrorHandler((error, _request, reply) => {
    const validationError = buildValidationErrorResponse(error)
    if (validationError) return reply.code(400).send(validationError)
    return reply.send(error)
  })

  const response = await app.inject({ method: 'POST', url: '/validate', payload })
  await app.close()
  return response
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

test('traduz o erro real do Fastify/Zod sem expor detalhes técnicos', async () => {
  const response = await validate(loginSchema, { email: 'invalido', password: '' })
  const body = response.json()

  assert.equal(response.statusCode, 400)
  assert.deepEqual(body, {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Informe um e-mail válido.',
  })
  assert.doesNotMatch(response.body, /body\/email|Invalid email|String must contain/)
})

test('orienta o preenchimento de senha vazia', async () => {
  const response = await validate(loginSchema, { email: 'teste@example.com', password: '' })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().message, 'Informe a senha.')
})

test('orienta o preenchimento do nome', async () => {
  const response = await validate(registerSchema, {
    name: '',
    email: 'teste@example.com',
    password: '12345678',
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().message, 'Informe o nome.')
})

test('informa o tamanho mínimo da senha', async () => {
  const response = await validate(registerSchema, {
    name: 'Teste',
    email: 'teste@example.com',
    password: 'curta',
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().message, 'A senha deve ter ao menos 8 caracteres.')
})

test('usa fallback genérico para campos não mapeados', async () => {
  const response = await validate(z.object({ age: z.number().min(18) }), { age: 10 })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().message, 'Dados inválidos. Revise os campos enviados.')
})
