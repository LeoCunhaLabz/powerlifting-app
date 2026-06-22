---
description: "Brainstorm e redação de novas issues para evoluir o app (UX/UI, bugs, features, dívidas técnicas), sempre com escopo enxuto e sem overengineering. Use para 'gerar issues', 'ideias de melhoria', 'backlog', 'o que fazer a seguir'."
name: "Gerar issues"
argument-hint: "Opcional: tema/área (ex.: 'UX do Workout', 'bugs', 'analytics')"
agent: Plan
---

# Gerar novas issues para evoluir o app

Você está em **modo de planejamento**: **não edite código**. O objetivo é me ajudar a descobrir e **redigir issues úteis e enxutas** para evoluir o app de powerlifting — melhorias de **UX/UI**, **correção de bugs**, **novas funcionalidades** e **dívidas técnicas** que tragam valor real.

Contexto: leia [AGENTS.md](../../AGENTS.md) e [.github/copilot-instructions.md](../copilot-instructions.md). Respeite a stack e os limites do projeto (React 19 + TS strict + Vite, client-side com `localStorage`, CSS puro "Chalk & Onyx", pt-BR, fase 2 introduzindo `apps/api`).

Foco opcional desta rodada: `${input:tema:Tema/área (deixe vazio para uma varredura geral)}`.

## Princípios (inegociáveis)

- **Sem overengineering.** Prefira a menor mudança que entrega valor. Nada de abstrações, libs ou arquitetura "para o futuro" sem necessidade clara agora.
- **Valor para o usuário primeiro.** Cada issue deve explicar o problema/benefício real, não só "seria legal ter".
- **Escopo de 1 PR.** Cada issue deve caber em uma entrega focada. Se for grande, quebre em issues menores e indique a ordem/dependências.
- **Coerente com a stack atual.** Nada de dependências novas sem justificativa forte; sem backend/rede no `apps/web` até a issue de sync.

## Passo a passo

1. **Investigar oportunidades.** Explore a codebase procurando:
   - **Bugs / inconsistências** (cálculos em `powerlifting.ts`, estado em `WorkoutContext`, persistência, edge cases).
   - **UX/UI**: atrito em fluxos, feedback visual, estados vazios/erro, mobile-first 480px, acessibilidade.
   - **Funcionalidades úteis** alinhadas ao domínio (powerlifting) que faltam.
   - **Dívidas técnicas** que reduzem retrabalho futuro.

2. **Propor um backlog priorizado.** Apresente uma tabela: `# | Categoria | Título | Valor | Esforço | Depende de`. Ordene por valor/esforço.

3. **Perguntar antes de redigir** quais itens transformar em issues.

4. **Redigir as issues** no formato padrão, prontas para colar no GitHub.

## Formato de cada issue (saída)

```
### <tipo>: <título curto e claro>

**Contexto / Problema**
<o que está acontecendo hoje e por que importa>

**Proposta**
<a menor mudança que resolve>

**Escopo**
- [ ] <passo objetivo>
- [ ] <passo objetivo>

**Fora de escopo**
- <o que NÃO entra agora>

**Critérios de aceite**
- <verificável>

**Arquivos prováveis:** <caminhos>
**Labels sugeridas:** <ex.: ux, bug, enhancement>
**Branch sugerido:** <type>/<resumo> · **Esforço:** P/M/G
```
