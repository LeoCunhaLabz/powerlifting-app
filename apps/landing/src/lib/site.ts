/** URLs e textos fixos da landing (única fonte para nav, CTAs, footer e SEO). */
export const SITE_URL = 'https://onyxtreino.com.br';
export const APP_URL = 'https://app.onyxtreino.com.br';
export const SITE_NAME = 'ONYX';

/**
 * Hero copy — reescrita na issue #317 (spec 2026-09-21, §5) para a persona que
 * treina os três básicos e não sabe o que é DOTS: benefício no título, termo na
 * legenda. O H1 é monocromático (sem palavra em brass): o único botão brass do
 * hero é o da calculadora. A tagline do GTM (issue #260) vive só no footer.
 */
export const HERO_TITLE = 'Quão forte você é? E quanto falta pro próximo nível?';
export const HERO_SUBTITLE =
  'Compare com quem compete no Brasil e treine com um app que calcula a carga certa de cada dia. Grátis, em português, funciona sem internet.';

/** `<title>` da home. As outras páginas montam o seu no próprio layout. */
export const HOME_TITLE = 'ONYX: descubra quão forte você é e treine powerlifting em português';

/** Description padrão do site — na home, acompanha o subtítulo do hero (spec §5). */
export const DEFAULT_DESCRIPTION = HERO_SUBTITLE;

export const CTA_PRIMARY = 'Criar conta grátis';
export const CTA_CALCULATORS = 'Ver as calculadoras';
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
