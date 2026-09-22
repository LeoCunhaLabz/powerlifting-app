import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseCsvLine, readHeader, toEntry, parseCsv, type Entry } from './parse'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = readFileSync(path.join(here, '__fixtures__', 'opl-sample.csv'), 'utf8')
const FILTERS = { minDate: '2016-01-01' }

const byName = (entries: Entry[]) => Object.fromEntries(entries.map((e) => [e.name, e]))

// ─── parseCsvLine ────────────────────────────────────────────────────────────

describe('parseCsvLine', () => {
  it('separa campos simples por vírgula', () => {
    expect(parseCsvLine('a,b,,d')).toEqual(['a', 'b', '', 'd'])
  })

  it('mantém vírgula dentro de aspas', () => {
    expect(parseCsvLine('x,"Campeonato, Etapa 1",y')).toEqual(['x', 'Campeonato, Etapa 1', 'y'])
  })

  it('desfaz aspas duplicadas ("") dentro de campo entre aspas', () => {
    expect(parseCsvLine('"Meet ""Aspas"" Teste",1')).toEqual(['Meet "Aspas" Teste', '1'])
  })

  it('remove o \\r de linhas CRLF', () => {
    expect(parseCsvLine('a,b\r')).toEqual(['a', 'b'])
  })
})

// ─── readHeader ──────────────────────────────────────────────────────────────

describe('readHeader', () => {
  it('resolve o índice de cada coluna obrigatória', () => {
    const idx = readHeader(fixture.split('\n')[0])
    expect(idx.Name).toBe(0)
    expect(idx.Sex).toBe(1)
    expect(idx.Event).toBe(2)
    expect(idx.Equipment).toBe(3)
    expect(idx.BodyweightKg).toBe(6)
    expect(idx.Best3SquatKg).toBe(8)
    expect(idx.Best3BenchKg).toBe(9)
    expect(idx.Best3DeadliftKg).toBe(10)
    expect(idx.TotalKg).toBe(11)
    expect(idx.Date).toBe(13)
    expect(idx.MeetCountry).toBe(15)
  })

  it('lança erro nomeando a coluna ausente', () => {
    expect(() => readHeader('Name,Sex,Event')).toThrow(/Equipment/)
  })
})

// ─── toEntry / parseCsv (filtros da spec §7.3) ──────────────────────────────

describe('parseCsv com os filtros da spec', () => {
  const entries = parseCsv(fixture, FILTERS)
  const map = byName(entries)

  it('mantém só quem passa em país, equipamento, sexo, peso e janela', () => {
    expect(Object.keys(map).sort()).toEqual([
      'Ana Silva',
      'Bruno Costa #2',
      'Eva Rocha',
      'Fábio Nunes',
      'Karen Luz',
      'Lucas Reis',
      'Marta Paz',
      'Otávio Cruz',
      'Paula Reis',
    ])
  })

  it('exclui equipado (Wraps, Single-ply), meet fora do Brasil, sexo Mx, peso 0 e data antiga', () => {
    for (const name of ['Carlos Lima', 'Diego Ruiz', 'Helena Dias', 'Igor Melo', 'João Pedro', 'Gabriel Souza']) {
      expect(map[name]).toBeUndefined()
    }
  })

  it('entrada completa traz os três lifts e o total', () => {
    expect(map['Ana Silva']).toEqual({
      name: 'Ana Silva',
      sex: 'F',
      bodyweight: 62.5,
      date: '2024-05-10',
      squat: 120,
      bench: 70,
      deadlift: 150,
      total: 340,
    })
  })

  it('preserva o sufixo #N que o OpenPowerlifting usa para homônimos', () => {
    expect(map['Bruno Costa #2'].name).toBe('Bruno Costa #2')
  })

  it('meet só de supino (Event = B) entra só com bench e sem total', () => {
    expect(map['Eva Rocha']).toMatchObject({ bench: 80 })
    expect(map['Eva Rocha'].squat).toBeUndefined()
    expect(map['Eva Rocha'].deadlift).toBeUndefined()
    expect(map['Eva Rocha'].total).toBeUndefined()
  })

  it('Best3 negativo (tentativa falhada) não conta e total vazio não conta', () => {
    expect(map['Fábio Nunes']).toMatchObject({ bench: 160, deadlift: 300 })
    expect(map['Fábio Nunes'].squat).toBeUndefined()
    expect(map['Fábio Nunes'].total).toBeUndefined()
  })

  it('Event sem a letra do lift ignora aquele lift (SD sem supino)', () => {
    expect(map['Karen Luz']).toMatchObject({ squat: 130, deadlift: 160 })
    expect(map['Karen Luz'].bench).toBeUndefined()
  })

  it('linha sem nenhum lift válido é descartada', () => {
    expect(map['Nina Alves']).toBeUndefined()
  })

  it('a data igual ao início da janela entra', () => {
    expect(map['Otávio Cruz']).toMatchObject({ total: 600 })
  })

  it('aspas duplicadas no MeetName não deslocam as colunas', () => {
    expect(map['Paula Reis']).toMatchObject({ bodyweight: 57, total: 280 })
  })
})

describe('toEntry', () => {
  const header = readHeader(fixture.split('\n')[0])

  it('retorna null para linha malformada (menos colunas que o cabeçalho)', () => {
    expect(toEntry(['Só um campo'], header, FILTERS)).toBeNull()
  })
})
