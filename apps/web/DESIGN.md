---
name: ONYX (app)
description: Diário de treino de powerlifting, escuro, mobile-first, um único acento.
colors:
  page: "#000000"
  surface: "#060606"
  surface-raised: "#161616"
  surface-high: "#1e1e1e"
  text-primary: "#fafafa"
  text-secondary: "#9a9aa0"
  text-muted: "#5c5c61"
  border: "#242424"
  border-focus: "#4a4a4a"
  brass: "#e3a83b"
  brass-soft: "rgba(227, 168, 59, 0.12)"
  brass-border: "rgba(227, 168, 59, 0.30)"
  brass-ink: "#1a1304"
  success: "#37b87f"
  error: "#e5544b"
  warning: "#e0a93f"
typography:
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title-lg:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  subtitle:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "-0.02em"
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
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "11px"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  pill: "999px"
spacing:
  page: "16px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-ink}"
    rounded: "{rounded.md}"
    padding: "14px"
  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "15px"
  input:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# Design System: ONYX (app)

> Fonte normativa dos valores: `apps/web/src/index.css`. Este arquivo descreve como usá-los; se divergirem, o CSS vence e este arquivo deve ser corrigido. Vale para `apps/web`; a landing tem o próprio `apps/landing/DESIGN.md`.

## Overview

**Creative North Star: "A anilha no escuro"**

Um diário de treino que some atrás dos números. Fundo quase preto, superfícies em degraus de cinza e **um** acento metálico (brass) reservado para o que importa agora: a ação principal, a aba ativa, o dado que mudou. Denso como uma ferramenta, não como um dashboard de marketing: quem usa está entre séries, com o celular numa mão.

O app vive num shell travado em 480 px, centralizado no desktop com bordas laterais. Tudo precisa funcionar nessa largura e com o polegar.

**Key Characteristics:**
- Escuro sempre (não há modo claro).
- Um acento, trocável pelo usuário (Brass padrão, Onyx branco, Volt verde) via `data-theme` no `<html>`; o código só usa `var(--accent)`.
- Profundidade por tom, não por sombra.
- Números grandes e legíveis; texto de apoio em cinza.

## Colors

Neutros frios e quase pretos, com um único acento quente.

### Primary
- **Brass** (`--accent`, #e3a83b no tema padrão): botão primário, aba ativa da navegação, foco, dia concluído no calendário, destaque do programa atual. Texto sobre ele usa `--accent-ink`. Tons de apoio: `--accent-soft` (fundo de seleção, anel de foco) e `--accent-border` (contorno de destaque).

### Neutral
- **Página** (#000000): só o fundo fora do shell, no desktop.
- **Superfície** (`--bg-primary`, #060606): fundo do app.
- **Superfície elevada** (`--bg-secondary`, #161616): cards.
- **Superfície alta** (`--bg-tertiary`, #1e1e1e): campos, tooltips, toasts.
- **Texto** (`--text-primary` #fafafa, `--text-secondary` #9a9aa0, `--text-muted` #5c5c61): três níveis de ênfase; `p` já nasce em secundário.
- **Linhas** (`--border-color` #242424, `--border-focus` #4a4a4a).

### Status
- `--success` (PR, conclusão), `--error` (cancelar, excluir), `--warning`. Status não substitui o acento.

### Named Rules
**A Regra do Acento Único.** Toda ênfase usa `var(--accent)` / `var(--accent-ink)`. Nunca hex do brass no código, nunca `#ffffff`/`#000000` como destaque (o alias legado `--accent-white` aponta para o acento). Nada de segunda cor de marca, gradiente ou "cor por categoria".

**A Regra das Anilhas.** As cores das anilhas no `PlateVisualizer` seguem o padrão IPF e são a única paleta extra permitida, só ali.

## Typography

**Display Font:** Outfit (fallback system-ui)
**Body Font:** Plus Jakarta Sans (fallback system-ui)

**Character:** Outfit dá peso e geometria aos títulos e números; Plus Jakarta Sans mantém o corpo legível em tamanho pequeno. As duas vêm do Google Fonts (import no topo do `index.css`).

### Hierarchy
- **Headline** (Outfit 700, 28 px, -0.02em): `h1`, título de página.
- **Title** (Outfit 700, 22 / 20 / 18 px): `h2`, título de seção ou card, número de destaque em card.
- **Subtitle** (Outfit 700, 16 px): `h3`.
- **Body** (Plus Jakarta Sans 400, 15 px, 1.5): texto corrido e listas.
- **Apoio** (Plus Jakarta Sans, 14 / 13 / 12 / 11 px): texto secundário de card, legendas, metadados, unidades. É onde o app vive na prática: use estes degraus, não valores intermediários.
- **Label** (Plus Jakarta Sans 500, 10 px): rótulos da navegação inferior.

Tamanhos fora dessa escala (8, 9, 17, 23 px…) existem em telas antigas e são desvio; não os repita em código novo.

### Named Rules
**A Regra do Número.** Carga, repetições, e1RM e PR são o conteúdo principal: maiores e mais pesados que o rótulo que os acompanha. Em colunas de números, `font-variant-numeric: tabular-nums`.

## Layout

Coluna única dentro de `--max-width: 480px`. Conteúdo com 16 px de margem (`.app-content`), respeitando `safe-area-inset` em cima e embaixo. A navegação inferior é fixa, com 5 slots: Início · Rotinas · **[+ Treinar]** (FAB central) · Análises · Mais. Páginas secundárias vivem no hub "Mais", com botão de voltar. Espaçamento entre cards de 14 px; agrupar apertado, separar com folga.

## Elevation & Depth

Plano por padrão: a profundidade vem dos degraus de superfície (#060606 → #161616 → #1e1e1e) e de bordas de 1 px. Sombra só em elementos que realmente flutuam sobre o conteúdo:

### Shadow Vocabulary
- **FAB central** (`0 8px 20px rgba(0,0,0,0.45)`).
- **Sheet do descanso** (`0 -8px 24px rgba(0,0,0,0.5)`): entra de baixo.
- **Tooltip / toast** (`0 4px 12px rgba(0,0,0,0.3)` a `0 4px 16px rgba(0,0,0,0.4)`).

A barra de navegação usa fundo `rgba(10,10,10,0.95)` com `backdrop-filter: blur(8px)` por função (o conteúdo rola por baixo), não como efeito de vidro.

## Shapes

Raios contidos: 4 px em campos e tags, 8 px em botões, 14 px em cards. Pílula (`999px`) só para toasts e chips. Bordas de 1 px; nenhuma borda colorida grossa em lateral de card.

## Components

### Buttons
- **Primário:** fundo `--accent`, texto `--accent-ink`, raio 8 px, 14 px de padding, peso 800. Um por tela.
- **Secundário / texto:** sem fundo ou em superfície, texto `--text-secondary` ou `--accent` para links de ação.
- **Estados:** `:disabled` com opacidade 0.4; pressão com `scale(0.9)` nos ícones da navegação; transição `--transition-fast`.

### Segmented control
- Segmento ativo com fundo `--accent` e texto `--accent-ink`; inativos em `--text-secondary`. Usado em Análises e Calculadoras.

### Cards / Containers
- Fundo `--bg-secondary`, borda `--border-color`, raio 14 px, padding 15 px. Card em destaque ganha borda `--accent` e anel `0 0 0 1px var(--accent-border)`. Nunca card dentro de card.

### Inputs / Fields
- Fundo `--bg-tertiary`, borda `--border-color`, raio 4 px, 16 px de fonte.
- **Foco:** borda `--accent` + anel `0 0 0 3px var(--accent-soft)`. Placeholder em `--text-muted`.

### Navigation
- `.bottom-nav` fixa de 70 px + safe area; ícones lucide de 20 px; rótulo de 10 px; item ativo em `--accent`. O FAB central mostra um ponto quando há treino ativo.

### Ícones
- Somente `lucide-react`, traço único, tamanho coerente por contexto.

## Do's and Don'ts

### Do:
- **Do** usar os tokens de `index.css`; se faltar um valor, criar um token novo no mesmo padrão de nome.
- **Do** estilizar com o objeto `styles: Record<string, React.CSSProperties>` no fim do arquivo, como o resto do app.
- **Do** desenhar os estados vazio, carregando e erro de toda tela nova; sem histórico, dizer que não há dados em vez de inventar número.
- **Do** manter alvos de toque com pelo menos 40 px e testar em 375 px e 480 px.
- **Do** animar só com CSS (transições com `--transition-fast`/`--transition-normal`, `@keyframes` como o `slideUp` do descanso) e respeitar `prefers-reduced-motion`.

### Don't:
- **Don't** adicionar Tailwind, CSS-in-JS, biblioteca de componentes ou de animação (Motion, GSAP, Sonner, Vaul etc.).
- **Don't** usar gradiente, brilho (glow), vidro decorativo, textura ou granulado.
- **Don't** criar modo claro nem segunda cor de destaque.
- **Don't** trocar as fontes Outfit e Plus Jakarta Sans por recomendação de skill; troca de fonte é decisão de produto.
- **Don't** escrever texto de interface fora do pt-BR nem usar travessão.
