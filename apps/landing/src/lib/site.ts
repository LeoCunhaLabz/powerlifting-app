/** URLs e textos fixos da landing (única fonte para nav, CTAs, footer e SEO). */
export const SITE_URL = 'https://onyxtreino.com.br';
export const APP_URL = 'https://app.onyxtreino.com.br';
export const SITE_NAME = 'ONYX';

/**
 * Hero copy — base aprovada no GTM (issue #260), revisada em 17/09/2026 (feedback
 * direto do responsável do produto): "diário de treino" trocado por "app" e o
 * travessão do subtítulo removido.
 */
export const HERO_TITLE_PREFIX = 'O app que fala a língua do ';
export const HERO_TITLE_ACCENT = 'powerlifting';
export const HERO_SUBTITLE = 'RPE, %1RM, DOTS e total SBD, grátis, em português e offline.';

export const DEFAULT_DESCRIPTION =
  'ONYX é o app de powerlifting em português: RPE, %1RM, DOTS, Wilks e IPF GL, grátis e offline. Calculadoras públicas sem login.';

export const CTA_PRIMARY = 'Criar conta grátis';
export const CTA_CALCULATORS = 'Usar as calculadoras';
export const CTA_OPEN_APP = 'Abrir o app';

export const ROUTES = {
  home: '/',
  calcDots: '/calculadoras/dots',
  calc1rm: '/calculadoras/1rm',
  calcAnilhas: '/calculadoras/anilhas',
  quaoForteVoceE: '/quao-forte-voce-e',
  privacidade: '/privacidade',
  termos: '/termos',
  oQueEDots: '/o-que-e-dots',
  tabelaRpe: '/tabela-de-rpe',
  comoCalcular1rm: '/como-calcular-1rm',
  programasPowerlifting: '/programas-de-powerlifting',
  calendarioCompeticoes: '/calendario-competicoes-powerlifting-brasil',
} as const;

/**
 * Páginas evergreen (issue #250, escopo composto de SEO): conteúdo educativo pt-BR,
 * cada uma porta de entrada orgânica própria. Fonte única para o footer (sitewide) e
 * para o "leia também" cruzado entre elas (ArticleLayout).
 */
export interface EvergreenPage {
  href: (typeof ROUTES)[keyof typeof ROUTES];
  label: string;
}

export const EVERGREEN_PAGES: EvergreenPage[] = [
  { href: ROUTES.oQueEDots, label: 'O que é DOTS' },
  { href: ROUTES.tabelaRpe, label: 'Tabela de RPE' },
  { href: ROUTES.comoCalcular1rm, label: 'Como calcular 1RM' },
  { href: ROUTES.programasPowerlifting, label: 'Programas de powerlifting' },
  { href: ROUTES.calendarioCompeticoes, label: 'Calendário de competições no Brasil' },
];

export const NAV_LINKS = [
  { href: '/#calculadoras', label: 'Calculadoras' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#comparativo', label: 'Comparativo' },
] as const;

/** Data de revisão dos textos legais — atualizar ao mudar privacidade/termos. */
export const LEGAL_UPDATED_AT = '2026-09-16';
