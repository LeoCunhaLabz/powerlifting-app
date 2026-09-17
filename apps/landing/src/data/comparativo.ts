/**
 * Tabela comparativa da home (seção 7 da spec).
 *
 * Fonte da verdade dos valores: análise competitiva da issue #255 (set/2026, planos
 * gratuitos). Toda célula carrega a `fonte` da afirmação — células marcadas como
 * "verificar" foram confirmadas manualmente nas lojas/apps em 16/09/2026 e devem ser
 * revisadas se o mercado mudar. No mobile (≤ 480px) Strong/Hevy/Outros colapsam na
 * coluna única "Outros apps" via `outrosApps`.
 */

export type CellValue = 'sim' | 'nao' | 'parcial' | 'varia' | 'assinatura' | 'anuncios' | 'traducao';

export interface Cell {
  value: CellValue;
  /** De onde vem a afirmação (issue, pesquisa manual…). Não é exibido. */
  fonte: string;
}

export interface ComparisonRow {
  criterio: string;
  detalhe: string;
  /** Versão curta do critério para a tabela mobile. */
  criterioCurto: string;
  onyx: Cell;
  strong: Cell;
  hevy: Cell;
  outros: Cell;
  /** Célula única exibida no mobile no lugar de Strong/Hevy/Outros. */
  outrosApps: Cell;
}

export const COMPARISON_COLUMNS = {
  onyx: 'ONYX',
  strong: 'Strong',
  hevy: 'Hevy',
  outros: 'Outros',
  outrosSub: 'apps genéricos',
  outrosApps: 'Outros apps',
  outrosAppsSub: 'Strong · Hevy · genéricos',
} as const;

/** Texto exibido para cada valor (pt-BR, minúsculas, como na spec). */
export const CELL_LABEL: Record<CellValue, string> = {
  sim: 'sim',
  nao: 'não',
  parcial: 'parcial',
  varia: 'varia',
  assinatura: 'assinatura',
  anuncios: 'anúncios',
  traducao: 'tradução',
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    criterio: 'DOTS · Wilks · IPF GL',
    criterioCurto: 'DOTS · IPF GL',
    detalhe: 'Força relativa nativa nas análises',
    onyx: { value: 'sim', fonte: 'app: calculateDots/Wilks/IpfGl no dashboard, análises e calculadora' },
    strong: { value: 'nao', fonte: '#255: "DOTS/Wilks/IPF GL: nenhum dos 4 tem"' },
    hevy: { value: 'nao', fonte: '#255: "DOTS/Wilks/IPF GL: nenhum dos 4 tem"' },
    outros: { value: 'nao', fonte: '#255: só apps de nicho minúsculo' },
    outrosApps: { value: 'nao', fonte: '#255' },
  },
  {
    criterio: 'Prescrição por %1RM + RPE',
    criterioCurto: '%1RM + RPE',
    detalhe: 'Programa carga sobre o e1RM atual',
    onyx: { value: 'sim', fonte: 'app: rotinas com %1RM sobre e1RM atual e RPE-alvo por série' },
    strong: { value: 'parcial', fonte: '#255: RPE só no log (pago); sem %1RM programável em rotina custom' },
    hevy: { value: 'parcial', fonte: '#255: RPE só no log; sem %1RM programável' },
    outros: { value: 'varia', fonte: '#255: KeyLifts e Boostcamp têm %1RM; RPE-alvo "nenhum faz direito"' },
    outrosApps: { value: 'parcial', fonte: '#255' },
  },
  {
    criterio: 'Feito em pt-BR, não traduzido',
    criterioCurto: 'pt-BR',
    detalhe: 'Agachamento, supino e terra, termos do esporte',
    onyx: { value: 'sim', fonte: 'app escrito em pt-BR (AGENTS.md: UI em pt-BR)' },
    strong: { value: 'traducao', fonte: 'verificar: localização pt entre vários idiomas, nomes de exercícios traduzidos' },
    hevy: { value: 'traducao', fonte: 'verificar: localização pt-BR entre vários idiomas' },
    outros: { value: 'varia', fonte: 'apps genéricos: parte só em inglês' },
    outrosApps: { value: 'varia', fonte: 'coluna colapsada' },
  },
  {
    criterio: 'Offline de verdade (PWA)',
    criterioCurto: 'Offline (PWA)',
    detalhe: 'Registra sem sinal, sincroniza depois',
    onyx: { value: 'sim', fonte: 'app: localStorage + useSyncManager (fila offline, push no evento online)' },
    strong: { value: 'parcial', fonte: 'verificar: registra offline; sync em nuvem no plano pago' },
    hevy: { value: 'parcial', fonte: 'verificar: registra offline; recursos de sync/análise no Pro' },
    outros: { value: 'varia', fonte: 'apps genéricos: muitos exigem conexão' },
    outrosApps: { value: 'varia', fonte: 'coluna colapsada' },
  },
  {
    criterio: 'Grátis no essencial',
    criterioCurto: 'Grátis',
    detalhe: 'Sem paywall no app e nas análises',
    onyx: { value: 'sim', fonte: '#260: grátis integral até tração' },
    strong: { value: 'assinatura', fonte: '#255: plate calc e RPE pagos; rotinas limitadas no grátis' },
    hevy: { value: 'assinatura', fonte: '#255: rotinas limitadas no grátis; análises no Pro' },
    outros: { value: 'anuncios', fonte: 'apps genéricos: anúncios e/ou assinatura' },
    outrosApps: { value: 'assinatura', fonte: 'coluna colapsada (assinatura / anúncios)' },
  },
];

export const COMPARISON_FOOTNOTE =
  'Comparativo baseado nos planos gratuitos em setembro de 2026. Recursos dos outros apps podem mudar.';
