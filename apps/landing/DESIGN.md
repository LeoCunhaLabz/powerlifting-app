---
name: ONYX (landing)
description: Landing pública do ONYX. Calculadoras grátis e o app, em superfícies chapadas e brass contido.
colors:
  page: "#000000"
  surface: "#060606"
  surface-raised: "#161616"
  surface-high: "#1e1e1e"
  surface-table: "#0d0d0d"
  text-primary: "#fafafa"
  text-secondary: "#9a9aa0"
  text-muted: "#5c5c61"
  border: "#242424"
  border-focus: "#4a4a4a"
  hairline: "#1a1a1a"
  brass: "#e3a83b"
  brass-hover: "#f0c06a"
  brass-soft: "rgba(227, 168, 59, 0.12)"
  brass-border: "rgba(227, 168, 59, 0.3)"
  brass-ink: "#1a1304"
  bar-sleeve: "#3a3a3a"
  bar-collar: "#2c2c2c"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 85"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 36px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 85"
  number-xl:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    fontVariation: "'wdth' 85"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    fontVariation: "'wdth' 85"
  title-sm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    fontVariation: "'wdth' 85"
  subtitle:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "14px"
  small:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "13px"
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
  micro:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    fontVariation: "'wdth' 85"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "2.2px"
    fontVariation: "'wdth' 85"
  wordmark:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontWeight: 900
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  pill: "999px"
spacing:
  gutter-desktop: "64px"
  gutter-tablet: "32px"
  gutter-mobile: "20px"
  section-desktop: "96px"
  section-tablet: "72px"
  section-mobile: "44px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-ink}"
    rounded: "{rounded.md}"
    padding: "15px 26px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hover}"
    textColor: "{colors.brass-ink}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "15px 26px"
  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
---

# Design System: ONYX (landing)

> Fonte normativa dos valores: `apps/landing/src/styles/tokens.css` e `global.css`. Decisões de estrutura e copy: specs em `docs/superpowers/specs/2026-09-16-landing-page-design.md` e `2026-09-21-landing-forca-redesign-design.md` (o card de resultado `resultado-card-v4.html` é normativo). Se este arquivo divergir delas, as specs e o CSS vencem.

## Overview

**Creative North Star: "Ferramenta antes de vitrine"**

A landing ganha confiança fazendo algo útil na hora: a calculadora "Quão forte você é?" está no hero e entrega um resultado real, comparado com quem competiu no Brasil. O resto da página mostra o app de verdade (telas reais) e explica o valor em linguagem de quem treina.

A estética nasceu de um **passe de subtração** (issue #315): bordas elétricas, spotlight, tilt 3D, grade de pontos, letreiros, gradientes e sombras pesadas foram removidos porque denunciavam página gerada por IA. O que sobra é superfície chapada, divisória fina, contraste por peso tipográfico e brass só onde há decisão ou dado.

**Key Characteristics:**
- Escura e chapada; tema Brass fixo.
- Tipografia carrega a hierarquia (Archivo 800 semi-condensada).
- No máximo um CTA brass e um destaque de dado brass por viewport.
- Movimento quase nenhum, e só quando mostra o produto.

## Colors

Os mesmos neutros do app, com duas superfícies e uma linha que só a landing usa.

### Primary
- **Brass** (#e3a83b): CTA principal, números de resultado, checks da coluna ONYX no comparativo, links. Hover de link e de botão em #f0c06a. Texto sobre brass em #1a1304.

### Neutral
- **Superfície** (#060606) e **elevada** (#161616): fundo e cards. **Tabela** (#0d0d0d): só o comparativo.
- **Texto** (#fafafa / #9a9aa0 / #5c5c61). Kicker e ícones ficam em secundário, nunca em brass.
- **Hairline** (#1a1a1a): divisória entre seções e linhas, mais sutil que a borda (#242424).

### Named Rules
**A Regra do Brass Contido.** Por viewport, no máximo um CTA brass e um destaque de dado brass. No hero, os CTAs da coluna de texto são secundários; o único botão brass é o da calculadora.

**A Regra das Anilhas.** As cores IPF das anilhas (`--plate-*`) e o metal da barra (`--bar-sleeve`, `--bar-collar`) são a única cor fora do brass, e só nos visuais de barra.

## Typography

**Display Font:** Archivo (variável, `wght 800`, `wdth 85`)
**Body Font:** Plus Jakarta Sans
**Wordmark:** Outfit 900, só no logotipo ONYX (`Logo.astro`, `logo.svg` desenha o texto em Outfit)

**Character:** Archivo semi-condensada dá aos números e títulos o peso de uma ficha técnica; Plus Jakarta Sans deixa o corpo amigável. Fontes via Google Fonts (a CSP do nginx já libera); trocar a lista exige atualizar `nginx-landing-security-headers.conf`.

### Hierarchy
- **Display** (Archivo 800, `wdth 85`, 1.1): H1 e números grandes de resultado.
- **Headline** (Archivo 800, `clamp(24px, 3vw, 36px)`): títulos de seção.
- **Número de resultado** (Archivo 800, 48 px): o destaque do card da calculadora. Escala interna do card de força: 10 · 12 · 20 · 48 px (`forca.css`).
- **Title** (Archivo 800, 20 / 18 px): títulos de card.
- **Body** (Plus Jakarta Sans 400, 15 px, 1.5): parágrafos em `--text-secondary`; 16 px em subtítulos.
- **Apoio** (Plus Jakarta Sans, 14 / 13 / 12 px): legendas, termos técnicos, notas de tabela.
- **Label / kicker** (Archivo 800, 11 px, 2.2 px de tracking, maiúsculas, `--text-secondary`); 10 px nos rótulos internos das calculadoras.

As telas de celular (`components/phones/`) imitam o app e seguem a escala do `apps/web/DESIGN.md`, não esta.

### Named Rules
**A Regra do Benefício.** Título diz o benefício; o termo técnico (RPE, %1RM, DOTS) vai na legenda. Sem sigla solta no hero.

## Layout

Container de até 1440 px com gutter de 64 / 32 / 20 px (desktop / tablet / mobile) e respiro vertical de seção de 96 / 72 / 44 px. Ordem da home: Hero · Isso é pra você · Diferenciais · Um treino no ONYX (narrativa numerada: a ordem das telas conta a história) · Ferramentas grátis · Comparativo · CTA final · Footer. No mobile o hero empilha título → calculadora → CTAs. Em ≤ 480 px, o comparativo troca as colunas Strong/Hevy/Outros por uma só, "Outros apps". URLs limpas sem barra final.

## Elevation & Depth

Plano. Separação por hairline e degrau de superfície. As únicas sombras são das telas de celular (até `0 8px 24px rgba(0,0,0,0.35)`) e de elementos internos dessas telas que imitam o app. Foco em campo com anel `0 0 0 3px var(--accent-soft)`.

### Named Rules
**A Regra da Subtração.** Nada de gradiente, glow, spotlight, tilt, borda animada, grade de pontos, granulado ou vidro. Se um efeito não mostra o produto, ele sai.

## Shapes

Raios de 4 / 8 / 14 px (campo / botão / card) e pílula só em chips e segmentados. Bordas de 1 px. A coluna ONYX do comparativo usa borda `--accent-border` de 1 px e fundo `--accent-soft` chapado.

## Components

### Buttons
- **Primário:** fundo brass, texto `--accent-ink`, 700, 15 px, padding 15×26 px, raio 8 px; hover #f0c06a; pressionado desce 1 px.
- **Secundário:** fundo `--bg-secondary`, borda `--border-color`, texto primário 600; hover só troca a borda para `--border-focus`.
- **Pequeno:** 14 px, padding 10×18 px.

### Cards / Containers
- Fundo `--bg-secondary`, borda `--border-color`, raio 14 px, sem sombra; hover em card clicável troca só a borda. Cards de diferenciais e cenários: título de benefício + legenda com o termo.

### Kicker
- Rótulo curto acima do título de seção, em `--text-secondary`. **É decisão aprovada da landing** (spec de 21/09): não remover por regra genérica de skill. Em seção nova, só use se o título sozinho não situar o leitor.

### Calculadora "Quão forte você é" (assinatura)
- Ilha React em dois modos: `compacto` (um lift, no hero) e `completo` (três lifts + total, em `/quao-forte-voce-e`). O resultado sai no clique em "Ver meu resultado", nunca ao vivo. Card de resultado segue o `resultado-card-v4.html`: número grande, curva com meta tracejada, dois dados de apoio, atribuição do OpenPowerlifting visível.

### Navigation
- Nav sticky no topo, uma linha no desktop, wordmark à esquerda.

## Do's and Don'ts

### Do:
- **Do** importar cálculos do app (`@onyx/calc`, `@onyx/strength`); nunca duplicar fórmula na landing.
- **Do** manter o HTML do hero estático (LCP não espera JS); ilha `client:load` só para a calculadora.
- **Do** animar só os números das calculadoras com `useCountUp` (requestAnimationFrame) atrás de `useMotionAllowed()`: desktop sem `prefers-reduced-motion`; mobile e crawler recebem o valor final.
- **Do** conferir toda frase de benefício contra o que o app faz hoje.
- **Do** usar meia-risca (–) em faixas de números ("168,8–185,2"), como na convenção do português; travessão (—) nunca.

### Don't:
- **Don't** adicionar Motion, GSAP, OGL, reactbits, Three.js, WebGL, Tailwind ou biblioteca de efeito.
- **Don't** usar scroll reveal, parallax, entrada animada de seção ou cursor customizado.
- **Don't** criar modo claro (a landing é `color-scheme: dark`).
- **Don't** trocar Archivo / Plus Jakarta Sans / Outfit por recomendação de skill; mudança de fonte passa pela spec e só altera `--font-display`.
- **Don't** inventar depoimento, contagem de usuários, logo de parceiro ou número de precisão falsa.
- **Don't** usar emoji, hype fitness ou travessão na copy.
