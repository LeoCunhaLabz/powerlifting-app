# Product

<!-- impeccable:product-schema 1 -->

> Registro de produto do ONYX, lido automaticamente pelas skills de design (Impeccable) antes de qualquer trabalho de interface. Vale para o app (`apps/web`) e para a landing (`apps/landing`); o mundo visual de cada um está no `DESIGN.md` da própria pasta. Convenções de código ficam no [AGENTS.md](AGENTS.md).

## Platform

web

## Users

Quem treina powerlifting 3 a 5 vezes por semana e faz os três básicos (agachamento, supino e levantamento terra). Sabe o que é 1RM, talvez já tenha ouvido falar de RPE, não sabe o que é DOTS e ainda não compete. O concorrente real não é outro app: é a planilha do Google Sheets ou o PDF do coach.

Público secundário: quem segue um programa escrito por porcentagem ou RPE e quem pensa em competir e quer acompanhar o total até o dia do meet.

Brasil primeiro. O público é majoritariamente Android.

## Product Purpose

Diário de treino de powerlifting que faz a conta pelo atleta: registra cada série (peso, repetições, RPE), calcula a carga do dia por %1RM sobre o máximo estimado atual, guarda PRs e mostra a evolução. Calculadoras públicas (1RM, anilhas, DOTS/Wilks/IPF GL, "Quão forte você é") funcionam sem conta e levam ao cadastro.

Sucesso: a pessoa treina sem fazer conta no meio da série, volta na sessão seguinte e enxerga a própria evolução.

## Positioning

O app de powerlifting brasileiro: fala a língua do esporte (RPE, %1RM, DOTS, total SBD) sem exigir que o usuário já saiba esses termos, em português de verdade e funcionando sem internet. Compara a força do usuário com quem competiu no Brasil (OpenPowerlifting), algo que Strong e Hevy, genéricos e em inglês, não fazem.

## Operating Context

- **App:** usado na academia, entre séries, com o celular numa mão e pouca atenção sobrando. Iluminação variável, às vezes sem sinal. Toques precisam ser grandes e certeiros; números precisam ser lidos de relance.
- **Landing:** quem chega por busca ("calculadora de 1RM", "o que é DOTS") ou por link compartilhado de um resultado. Decide em segundos se a ferramenta resolve a dúvida dela.
- PWA instalável; a publicação na Play Store será um TWA, que embrulha o mesmo site sem mudar a linguagem visual.

## Capabilities and Constraints

- Registro de treino com séries de aquecimento, normais e drop sets; rotinas, programas e exercícios próprios; descanso cronometrado; histórico, calendário e análises; backup JSON; sincronização entre dispositivos (offline-first, last-write-wins).
- Unidades em kg ou lbs. Tema único (dourado), sem seletor de cor.
- Toda interface em pt-BR.
- Frontend sem frameworks de CSS nem bibliotecas de animação; dependência nova só quando essencial.
- **Ainda não existe** e não pode aparecer como promessa: modo competição, coach compartilhado, percentil global, paywall, versão em inglês.

## Brand Commitments

- Nome **ONYX**. Wordmark em Outfit 900 e a marca (anilha vista de frente, anel dourado), em `apps/web/public/favicon.svg` e `logo.svg`.
- Voz: técnico explicando para quem está começando. Tom sóbrio, sem hype fitness, sem emoji, sem travessão.
- **Benefício no título, termo na legenda:** quem é técnico vê o termo e sabe que é real; quem não é entende o valor.
- Tagline "o app que fala a língua do powerlifting" fica só no rodapé da landing.

## Evidence on Hand

- Percentis de quem competiu no Brasil (OpenPowerlifting, raw, últimos 10 anos): `apps/web/src/data/strength-percentiles.json`. Dados em domínio público; a atribuição precisa aparecer onde o resultado aparece.
- Telas reais do app usadas na landing (`apps/landing/src/components/phones/`) e a og-image de cada site.
- **Não existem** depoimentos, número de usuários, logos de parceiros nem métricas de uso públicas. Não fabricar nenhum deles.

## Product Principles

1. **Honestidade no primeiro contato.** Nunca mostrar número inventado; sem histórico, o app diz que não sabe.
2. **Feito para a sessão de treino.** Rápido com uma mão, legível de relance, funciona sem sinal.
3. **Fala powerlifting sem exigir jargão.** O termo técnico está lá para quem procura, nunca como barreira.
4. **Grátis no essencial.** Crescimento antes de monetização.
5. **Subtração.** Só entra o que serve ao treino ou à decisão de quem visita; efeito decorativo sai.

## Accessibility & Inclusion

Contraste mínimo WCAG AA, foco visível com o acento, alvos de toque de pelo menos 40 px, campos com 16 px de fonte (evita zoom no iOS) e `prefers-reduced-motion` respeitado em todo movimento.
