---
name: design-system
description: "Design system ONYX deste app de powerlifting: tokens de cor, tipografia, raios, transições e layout mobile-first (480px) em apps/web/src/index.css. Use ao estilizar páginas/componentes ou criar UI nova."
---

# Design System — ONYX

Tema escuro, mobile-first, definido como CSS variables em [apps/web/src/index.css](../../../apps/web/src/index.css). **CSS puro** — não use Tailwind nem bibliotecas de CSS-in-JS. Ícones via `lucide-react`.

Descrição completa (hierarquia, componentes, do's e don'ts) em [apps/web/DESIGN.md](../../../apps/web/DESIGN.md); regras que vencem qualquer skill de design de terceiros em [.claude/skills/design-onyx/SKILL.md](../../../.claude/skills/design-onyx/SKILL.md).

## Tokens (CSS variables)

### Cores
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-primary` | `#060606` | Fundo principal |
| `--bg-secondary` | `#161616` | Cards/superfícies |
| `--bg-tertiary` | `#1e1e1e` | Superfícies elevadas, campos |
| `--text-primary` | `#fafafa` | Texto principal |
| `--text-secondary` | `#9a9aa0` | Texto secundário |
| `--text-muted` | `#5c5c61` | Texto apagado |
| `--border-color` | `#242424` | Bordas |
| `--border-focus` | `#4a4a4a` | Bordas em foco |
| `--accent` | `#e3a83b` (Brass, padrão) | **Único** destaque: botão primário, aba ativa, foco. Troca por tema (`data-theme`: brass/onyx/volt) |
| `--accent-ink` | `#1a1304` | Texto sobre o acento |
| `--accent-soft` / `--accent-border` | brass com 12% / 30% de opacidade | Fundo de seleção, anel de foco / contorno de destaque |
| `--success` | `#37b87f` | Sucesso / PR |
| `--error` | `#e5544b` | Erro / cancelar |
| `--warning` | `#e0a93f` | Aviso |

### Tipografia
- `--font-display: 'Outfit'` — títulos (`h1`–`h6`, peso 700, `letter-spacing: -0.02em`).
- `--font-sans: 'Plus Jakarta Sans'` — corpo (base 15px).
- Importadas do Google Fonts no topo do `index.css`.
- Escala: `h1` 28px, `h2` 20px, `h3` 16px.

### Raios e transições
- `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 14px`.
- `--transition-fast: 0.15s ease`, `--transition-normal: 0.25s ease`.

### Layout
- `--max-width: 480px` — a aplicação inteira é travada nessa largura (shell mobile centralizado no desktop, com bordas laterais). Todo componente deve renderizar bem em 480px.

## Convenções

- **Sempre** use os tokens acima em vez de hex literais quando houver token equivalente. Precisa de uma cor/valor **sem** token? Adicione um token novo em `index.css` (mesmo padrão de nome) em vez de espalhar literais — e atualize a tabela desta skill.
- **Padrão: objeto `styles: Record<string, React.CSSProperties>` inline** no final do arquivo, referenciado via `style={styles.xxx}` — é assim que quase toda página/componente é estilizado (ver [Dashboard.tsx](../../../apps/web/src/pages/Dashboard.tsx), [PlateVisualizer.tsx](../../../apps/web/src/components/PlateVisualizer.tsx), [RestTimer.tsx](../../../apps/web/src/components/RestTimer.tsx), [BodyweightLogList.tsx](../../../apps/web/src/components/BodyweightLogList.tsx)). Classes CSS em `index.css` são reservadas para tokens, o shell fixo (`.app-container`, `.app-content`, `.bottom-nav`, `.nav-item`) e a camada de utilitários compartilhados (`.btn-*`, `.card`, `.badge`, `.modal-*`, resets de `input`/`button`/`h1-h6`, espaçamento `.mt-*`/`.mb-*`) — não crie classe nova em `index.css` para estilo específico de uma página.
- Navegação inferior (`.bottom-nav`) e itens (`.nav-item`) já estilizados — reutilize as classes ao adicionar abas.
- Mantenha textos em **pt-BR**.

## Cores de anilhas — `PlateVisualizer`

- **kg (padrão IPF):** 25 vermelho, 20 azul, 15 amarelo, 10 verde, 5 branco, 2,5 preto, 1,25 prata.
- **lbs (convenção deste app — não existe padrão IPF para lbs):** 55 vermelho, 45 azul, 35 amarelo, 25 verde, 10 preto, 5 branco.
