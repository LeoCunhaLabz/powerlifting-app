import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as schema from './schema.js'

export function createDb(connectionString: string) {
  const client = postgres(connectionString)
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>

export async function runMigrations(connectionString: string): Promise<void> {
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)
  const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), 'migrations')
  try {
    await migrate(db, { migrationsFolder })
  } finally {
    await client.end()
  }
}
