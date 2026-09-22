// Gera src/data/strength-percentiles.json a partir do dump público do OpenPowerlifting
// (issue #293, spec §7). Rotina manual, trimestral — sem cron.
//
// Uso (na raiz):
//   1. baixar https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip
//      e extrair fora do repo (≈ 160 MB zipado, ≈ 800 MB de CSV);
//   2. npm run opl:percentiles -w @powerlifting/web -- --csv <caminho-do-csv>
//
// Opções: --years 10 · --min-sample 50 · --out <arquivo>
// No fim imprime a tabela de calibração (n, P25/P50/P85 por sexo × classe × lift).
import { createReadStream, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseCsvLine, readHeader, toEntry, type ColumnIndex, type Entry } from './parse'
import { buildTable, LIFTS, type StrengthTable } from './aggregate'

const ATTRIBUTION =
  'This page uses data from the OpenPowerlifting project, https://www.openpowerlifting.org. ' +
  'You may download a copy of the data at https://gitlab.com/openpowerlifting/opl-data.'

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const here = path.dirname(fileURLToPath(import.meta.url))
const csvPath = arg('csv')
const years = Number(arg('years', '10'))
const minSample = Number(arg('min-sample', '50'))
const outPath = arg('out', path.join(here, '..', '..', 'src', 'data', 'strength-percentiles.json'))!

if (!csvPath) {
  console.error('Informe o CSV do OpenPowerlifting: --csv <caminho>')
  process.exit(1)
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const today = new Date()
const from = new Date(today)
from.setFullYear(from.getFullYear() - years)
const windowFrom = isoDate(from)
const windowTo = isoDate(today)

async function readEntries(file: string): Promise<{ entries: Entry[]; lines: number }> {
  const entries: Entry[] = []
  let idx: ColumnIndex | null = null
  let lines = 0
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!idx) {
      idx = readHeader(line)
      continue
    }
    lines++
    if (lines % 500_000 === 0) process.stderr.write(`  ${lines.toLocaleString('pt-BR')} linhas…\n`)
    const entry = toEntry(parseCsvLine(line), idx, { minDate: windowFrom })
    if (entry) entries.push(entry)
  }
  return { entries, lines }
}

/** Arrays numéricos em uma linha só: diff legível sem 3 mil linhas de números. */
function toJson(table: StrengthTable): string {
  return JSON.stringify(table, null, 2).replace(/\[\s+([-\d.,\s]+?)\s+\]/g, (_, inner: string) => `[${inner.replace(/\s+/g, ' ').trim()}]`)
}

function calibrationTable(table: StrengthTable): string {
  const rows: string[] = ['| Sexo | Lift | Faixa | n | P25 | P50 | P85 |', '|---|---|---|---|---|---|---|']
  for (const sex of ['M', 'F'] as const) {
    for (const lift of LIFTS) {
      for (const bin of table[sex][lift]) {
        rows.push(`| ${sex} | ${lift} | ${bin.label}${bin.merged ? ' *' : ''} | ${bin.n} | ${bin.p[5]} | ${bin.p[10]} | ${bin.p[17]} |`)
      }
    }
  }
  rows.push('', '\\* faixa fundida por amostra menor que o mínimo')
  return rows.join('\n')
}

const started = Date.now()
process.stderr.write(`Lendo ${csvPath} (janela ${windowFrom} → ${windowTo})\n`)
const { entries, lines } = await readEntries(csvPath)
process.stderr.write(`${lines.toLocaleString('pt-BR')} linhas lidas, ${entries.length.toLocaleString('pt-BR')} resultados no recorte\n`)

const table = buildTable(
  entries,
  {
    source: 'OpenPowerlifting',
    generatedAt: windowTo,
    windowFrom,
    windowTo,
    filters: 'MeetCountry=Brazil, Equipment=Raw, Sex in {M,F}, melhor resultado por atleta na janela',
    attribution: ATTRIBUTION,
  },
  minSample,
)

writeFileSync(outPath, toJson(table) + '\n', 'utf8')
process.stderr.write(`JSON gravado em ${path.relative(process.cwd(), outPath)} em ${((Date.now() - started) / 1000).toFixed(1)}s\n\n`)
console.log(calibrationTable(table))
