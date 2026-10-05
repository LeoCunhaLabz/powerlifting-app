<!-- Obrigado pela contribuição! Preencha as seções abaixo. Textos em pt-BR. -->

## Resumo

<!-- Descreva de forma concisa o que este PR faz e por quê. -->

## Issue relacionada

Closes #

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `chore` — manutenção/infra (sem mudança de comportamento)
- [ ] `docs` — apenas documentação
- [ ] `refactor` — refatoração sem mudança de comportamento

## Como testar

<!-- Passos para validar manualmente. Ex.: npm run dev e acessar a aba X. -->

1.

## Design

<!-- Só se o PR toca interface (apps/web ou apps/landing). Resultado da revisão de design (skill design-onyx §5): o que foi corrigido, screenshots em 375/480 px e as sugestões das skills que ficaram de fora, com o motivo. Apague a seção se não se aplica. -->

## Checklist

- [ ] Escopo mínimo: apenas o necessário para a issue (sem refatorações fora do pedido)
- [ ] `npm run build` passa (na raiz)
- [ ] `npm run lint` sem **novos** erros (erros pré-existentes ficam para PR separado)
- [ ] `npm run test` passa (Vitest — se a issue tocar em `apps/web/src/utils/`)
- [ ] Sem dependências novas desnecessárias
- [ ] Textos de UI em **pt-BR**
- [ ] Revisão de design feita (se tocou interface); `DESIGN.md` da superfície atualizado se token, componente ou regra visual mudou
- [ ] **Documentação em sincronia** (`AGENTS.md`, `.github/copilot-instructions.md`, `.github/{agents,prompts,skills}`, `docs/deploy-vps.md`) quando estrutura/comandos/caminhos/infra mudarem — **obrigatório na mesma PR**

## Notas adicionais

<!-- Decisões de design, trade-offs, follow-ups ou pontos de atenção para o revisor. -->
