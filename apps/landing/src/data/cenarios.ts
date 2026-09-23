/**
 * Seção "Isso é pra você" (issue #317, spec §5): três cenários em que a pessoa
 * se reconhece antes de ver qualquer termo técnico. Cada frase aponta para algo
 * que o app faz hoje — nada de modo competição ou coach compartilhado.
 */
export interface Cenario {
  title: string;
  text: string;
}

export const CENARIOS: Cenario[] = [
  {
    title: 'Treina os três básicos na academia',
    text: 'Sem técnico, sem planilha. O ONYX diz quanto colocar na barra e guarda cada série.',
  },
  {
    title: 'Segue a planilha do coach',
    text: 'Registre o programa como ele foi escrito, por porcentagem ou RPE, e pare de fazer conta no meio do treino.',
  },
  {
    title: 'Pensa em competir',
    text: 'Veja onde você ficaria entre quem já competiu no Brasil e acompanhe seu total até o dia.',
  },
];
