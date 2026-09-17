/**
 * Formatação numérica pt-BR para a landing (vírgula decimal, ponto de milhar).
 * Funções puras — testadas em format.test.ts.
 */

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

/** Formata com casas decimais fixas: formatNumber(347.16, 2) → "347,16". */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return getFormatter(decimals, decimals).format(value);
}

/**
 * Formata um peso em kg sem zeros à direita desnecessários (máx. 2 casas):
 * 142.5 → "142,5" · 100 → "100" · 1.25 → "1,25".
 */
export function formatKg(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return getFormatter(0, 2).format(value);
}

/**
 * Converte a digitação do usuário em número. Aceita vírgula ou ponto como
 * separador decimal e ignora espaços. Retorna NaN para texto inválido/vazio.
 */
export function parseDecimal(input: string): number {
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
