import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapClientIdToDbUuid } from './syncId.js'

const UUID_V5_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

test('gera UUID valido para IDs legados de workout', () => {
  const userId = '7d9bc183-a3d6-420f-83b2-534ef6e649bc'
  const clientId = 'session-1735689600000'

  const mapped = mapClientIdToDbUuid(userId, 'workout', clientId)

  assert.match(mapped, UUID_V5_REGEX)
})

test('mapeamento e deterministico para mesma entrada', () => {
  const userId = '7d9bc183-a3d6-420f-83b2-534ef6e649bc'
  const clientId = 'template-1735689600000'

  const first = mapClientIdToDbUuid(userId, 'template', clientId)
  const second = mapClientIdToDbUuid(userId, 'template', clientId)

  assert.equal(first, second)
})

test('mapeamento separa entidades e usuarios para evitar colisao', () => {
  const clientId = 'same-client-id'

  const workoutId = mapClientIdToDbUuid('00000000-0000-0000-0000-000000000001', 'workout', clientId)
  const templateId = mapClientIdToDbUuid('00000000-0000-0000-0000-000000000001', 'template', clientId)
  const otherUserWorkoutId = mapClientIdToDbUuid('00000000-0000-0000-0000-000000000002', 'workout', clientId)

  assert.notEqual(workoutId, templateId)
  assert.notEqual(workoutId, otherUserWorkoutId)
})