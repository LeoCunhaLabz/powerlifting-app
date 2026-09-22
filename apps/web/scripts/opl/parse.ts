// Etapa 1 do pipeline OpenPowerlifting (issue #293, spec §7.3): leitura do CSV e
// filtro linha a linha. Não sabe nada de percentis — é a parte reutilizável pelo
// futuro explorador de atletas (#298).

export const REQUIRED_COLUMNS = [
  'Name',
  'Sex',
  'Event',
  'Equipment',
  'Date',
  'MeetCountry',
  'BodyweightKg',
  'Best3SquatKg',
  'Best3BenchKg',
  'Best3DeadliftKg',
  'TotalKg',
] as const

export type Column = (typeof REQUIRED_COLUMNS)[number]
export type ColumnIndex = Record<Column, number>

export type Sex = 'M' | 'F'

export interface Entry {
  name: string
  sex: Sex
  bodyweight: number
  /** YYYY-MM-DD */
  date: string
  squat?: number
  bench?: number
  deadlift?: number
  total?: number
}

export interface Filters {
  /** Data mínima inclusiva, YYYY-MM-DD (comparação lexicográfica funciona para ISO). */
  minDate: string
  /** Padrão: 'Brazil'. */
  meetCountry?: string
  /** Padrão: 'Raw'. */
  equipment?: string
}

/** Parser RFC 4180 mínimo: vírgula, aspas e aspas duplicadas dentro de aspas. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  const end = line.endsWith('\r') ? line.length - 1 : line.length

  for (let i = 0; i < end; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      out.push(field)
      field = ''
    } else {
      field += ch
    }
  }
  out.push(field)
  return out
}

export function readHeader(headerLine: string): ColumnIndex {
  const names = parseCsvLine(headerLine)
  const idx = {} as ColumnIndex
  for (const col of REQUIRED_COLUMNS) {
    const i = names.indexOf(col)
    if (i === -1) throw new Error(`Coluna obrigatória ausente no CSV: ${col}`)
    idx[col] = i
  }
  return idx
}

const positive = (raw: string): number | undefined => {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function toEntry(fields: string[], idx: ColumnIndex, filters: Filters): Entry | null {
  if (fields.length <= idx.TotalKg || fields.length <= idx.MeetCountry) return null

  if (fields[idx.MeetCountry] !== (filters.meetCountry ?? 'Brazil')) return null
  if (fields[idx.Equipment] !== (filters.equipment ?? 'Raw')) return null

  const sex = fields[idx.Sex]
  if (sex !== 'M' && sex !== 'F') return null

  const date = fields[idx.Date]
  if (!date || date < filters.minDate) return null

  const bodyweight = positive(fields[idx.BodyweightKg])
  if (bodyweight === undefined) return null

  const event = fields[idx.Event]
  const squat = event.includes('S') ? positive(fields[idx.Best3SquatKg]) : undefined
  const bench = event.includes('B') ? positive(fields[idx.Best3BenchKg]) : undefined
  const deadlift = event.includes('D') ? positive(fields[idx.Best3DeadliftKg]) : undefined
  const total = event === 'SBD' ? positive(fields[idx.TotalKg]) : undefined

  if (squat === undefined && bench === undefined && deadlift === undefined && total === undefined) return null

  const entry: Entry = { name: fields[idx.Name], sex, bodyweight, date }
  if (squat !== undefined) entry.squat = squat
  if (bench !== undefined) entry.bench = bench
  if (deadlift !== undefined) entry.deadlift = deadlift
  if (total !== undefined) entry.total = total
  return entry
}

/** Conveniência para testes e arquivos pequenos: o CLI usa stream por linha. */
export function parseCsv(text: string, filters: Filters): Entry[] {
  const lines = text.split('\n')
  const idx = readHeader(lines[0])
  const entries: Entry[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const entry = toEntry(parseCsvLine(lines[i]), idx, filters)
    if (entry) entries.push(entry)
  }
  return entries
}
