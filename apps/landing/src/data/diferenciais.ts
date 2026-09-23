/**
 * Seção 4 da home: 6 diferenciais. Ícones são chaves resolvidas em Differentials.astro.
 * Copy reescrita na issue #317 (spec §5): **benefício no título, termo na legenda**
 * (`term`) — a persona não sabe o que é DOTS, mas sabe o que é "ser forte pro seu peso".
 */
export type DifferentialIcon = 'bars' | 'percent' | 'clock' | 'wifi' | 'globe' | 'check';

export interface Differential {
  icon: DifferentialIcon;
  title: string;
  /** O termo técnico, exibido como legenda sob o título. */
  term: string;
  text: string;
}

export const DIFFERENTIALS: Differential[] = [
  {
    icon: 'bars',
    title: 'Registre como foi a série, não só o peso',
    term: 'RPE, de 1 a 10',
    text: 'Prescreva séries por esforço e registre o que aconteceu de verdade, série a série.',
  },
  {
    icon: 'percent',
    title: 'A carga certa pra hoje, calculada sozinha',
    term: '%1RM sobre o seu máximo estimado',
    text: 'A porcentagem sai do seu máximo de hoje, não de um recorde de seis meses atrás.',
  },
  {
    icon: 'clock',
    title: 'Descubra se você é forte pro seu peso',
    term: 'DOTS, Wilks e IPF GL',
    text: 'Força relativa em todas as análises: recordes, evolução e comparativos já saem em pontos.',
  },
  {
    icon: 'wifi',
    title: 'Funciona sem internet',
    term: 'PWA: registra sem sinal, sincroniza depois',
    text: 'Treine no subsolo da academia: o treino fica salvo e sobe quando a rede voltar.',
  },
  {
    icon: 'globe',
    title: 'Em português de verdade',
    term: 'Agachamento, supino e terra, sem tradução automática',
    text: 'Escrito em português, não traduzido de um app genérico gringo.',
  },
  {
    icon: 'check',
    title: 'Grátis no essencial',
    term: 'Sem paywall no app e nas análises',
    text: 'Sem assinatura para registrar treino, ver recordes ou abrir as análises.',
  },
];
