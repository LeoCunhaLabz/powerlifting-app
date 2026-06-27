---
name: design-system
description: "Design system ONYX deste app de powerlifting: tokens de cor, tipografia, raios, transições e layout mobile-first (480px) em apps/web/src/index.css. Use ao estilizar páginas/componentes ou criar UI nova."
---

# Design System — ONYX

Tema escuro, mobile-first, definido como CSS variables em [apps/web/src/index.css](../../../apps/web/src/index.css). **CSS puro** — não use Tailwind nem bibliotecas de CSS-in-JS. Ícones via `lucide-react`.

## Tokens (CSS variables)

### Cores
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-primary` | `#050505` | Fundo principal |
| `--bg-secondary` | `#121212` | Cards/superfícies |
| `--bg-tertiary` | `#1a1a1a` | Superfícies elevadas |
| `--text-primary` | `#ffffff` | Texto principal |
| `--text-secondary` | `#8a8a8f` | Texto secundário |
| `--text-muted` | `#555558` | Texto apagado |
| `--border-color` | `#222222` | Bordas |
| `--border-focus` | `#444444` | Bordas em foco |
| `--success` | `#10b981` | Sucesso / PR |
| `--error` | `#ef4444` | Erro / cancelar |
| `--warning` | `#f59e0b` | Aviso |

### Tipografia
- `--font-display: 'Outfit'` — títulos (`h1`–`h6`, peso 700, `letter-spacing: -0.02em`).
- `--font-sans: 'Plus Jakarta Sans'` — corpo (base 15px).
- Importadas do Google Fonts no topo do `index.css`.
- Escala: `h1` 28px, `h2` 20px, `h3` 16px.

### Raios e transições
- `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`.
- `--transition-fast: 0.15s ease`, `--transition-normal: 0.25s ease`.

### Layout
- `--max-width: 480px` — a aplicação inteira é travada nessa largura (shell mobile centralizado no desktop, com bordas laterais). Todo componente deve renderizar bem em 480px.

## Convenções

- **Sempre** use os tokens acima em vez de hex literais quando houver token equivalente.
- Estilos inline via objeto `styles: { ... }` no componente são aceitáveis quando seguem o padrão já existente (ver [apps/web/src/components/RestTimer.tsx](../../../apps/web/src/components/RestTimer.tsx) e [apps/web/src/components/PlateVisualizer.tsx](../../../apps/web/src/components/PlateVisualizer.tsx)).
- Navegação inferior (`.bottom-nav`) e itens (`.nav-item`) já estilizados — reutilize as classes ao adicionar abas.
- Mantenha textos em **pt-BR**.

## Cores de anilhas (padrão IPF) — `PlateVisualizer`

- **kg:** 25 vermelho, 20 azul, 15 amarelo, 10 verde, 5 branco, 2,5 preto, 1,25 prata.
- **lbs:** 55 vermelho, 45 azul, 35 amarelo, 25 verde, 10 preto, 5 branco.
