/**
 * Formatação numérica pt-BR do app (vírgula decimal, ponto de milhar).
 * Espelha apps/landing/src/lib/format.ts; no app o valor vazio é "sem dado",
 * sem travessão (#345). Funções puras, testadas em format.test.ts.
 */

export const EMPTY_VALUE = 'sem dado';

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(min: number, max: number): Intl.NumberFormat {
  const key = `${min}:${max}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
    formatters.set(key, f);
  }
  return f;
}

/** Zera valores que arredondariam para "-0" (ex.: -0,04 com 1 casa). */
function dropNegativeZero(value: number, decimals: number): number {
  return Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
}

/** Casas decimais fixas: formatNumber(125, 1) → "125,0". Não finito → "sem dado". */
export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE;
  return getFormatter(decimals, decimals).format(dropNegativeZero(value, decimals));
}

/** Até `maxDecimals` casas, sem zeros à direita: 142.5 → "142,5", 100 → "100". */
export function formatCompact(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return EMPTY_VALUE;
  return getFormatter(0, maxDecimals).format(dropNegativeZero(value, maxDecimals));
}

/**
 * Converte a digitação do usuário em número. Aceita vírgula ou ponto como
 * separador decimal e ignora espaços. Devolve NaN para texto inválido ou vazio.
 */
export function parseDecimal(input: string): number {
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
