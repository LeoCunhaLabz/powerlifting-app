import { createHash } from 'node:crypto'

export function deterministicUuidFromText(input: string): string {
  const hash = createHash('sha1').update(input).digest('hex')
  const bytes = hash.slice(0, 32).split('')

  // Version 5 UUID (name-based), com variante RFC 4122.
  bytes[12] = '5'
  const variant = parseInt(bytes[16], 16)
  bytes[16] = ((variant & 0x3) | 0x8).toString(16)

  const hex = bytes.join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function mapClientIdToDbUuid(userId: string, entity: 'workout' | 'template' | 'custom-exercise', clientId: string): string {
  return deterministicUuidFromText(`${entity}:${userId}:${clientId}`)
}