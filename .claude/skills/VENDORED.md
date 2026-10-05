# Skills de terceiros (vendorizadas)

Skills de design copiadas de repositórios públicos para que todo agente que abrir este repo use o mesmo repertório. Como o texto delas vira **instrução** para o agente, cada atualização é revisada antes de entrar. Quando uma skill contradiz o projeto, valem o `AGENTS.md`, o `PRODUCT.md`, os `DESIGN.md` e a skill do projeto [`design-onyx`](design-onyx/SKILL.md), que é quem decide quando e como cada uma destas é usada.

| Pasta | Origem | Commit | Licença |
|---|---|---|---|
| `animate`, `animation-vocabulary`, `apple-design`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `pick-ui-library`, `prototype`, `review-animations` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `e8a175de22ae1e49370fc144c1f3bb9aeedf988d` | MIT |
| `impeccable` (pasta `.claude/skills/impeccable` do repo de origem, skill v4.5.0, engine 0.1.11) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `e103efe779e2dd01274dabae83531fef00bf2563` | Apache-2.0 (+ `NOTICE.md`) |
Cada pasta carrega o `LICENSE` da origem. Os arquivos estão **sem modificação**; ajustes ao projeto ficam na `design-onyx` e no `AGENTS.md`, nunca dentro da skill, para que a atualização seja só substituir a pasta.

## Fora de propósito

- **Emil:** `write-swift`, `animate-expo` (React Native) e `ask-sonner` (não usamos Sonner).
- **[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)** (MIT, revisado no commit `ce26fc25`): não vendorizado. Quando o projeto não usa um design system de terceiros (o ONYX é próprio), ele parte de Tailwind, Motion e ícones Phosphor, exige modo claro e escuro, animação de entrada e fundos em gradiente, o oposto do passe de subtração da #315. As cerca de 10 regras compatíveis foram adaptadas na §3 da `design-onyx`, com crédito. As skills de geração de imagem do repo dependem de uma ferramenta de imagem que o Claude Code não tem.

## Impeccable: só a skill, sem hooks

O instalador oficial (`npx impeccable install`) também registra hooks de `SessionStart`, `PostToolUse` (Edit/Write) e `Stop` em `.claude/settings.json`. **Eles não foram instalados**: a skill roda só quando chamada (`/impeccable <comando>`). Na primeira execução, o launcher `scripts/impeccable` baixa o binário da engine do GitHub Releases do próprio projeto (`engine-v<VERSION>`) para `~/.impeccable/bin/<versão>/` e confere o SHA-256 antes de executar.

## Como atualizar

1. Baixe o tarball da origem no commit novo: `gh api repos/<owner>/<repo>/tarball/<sha> > x.tgz`. O `git clone` costuma falhar no Windows por causa dos caminhos longos.
2. Revise o diff do texto antes de copiar: comandos de rede, instalação de pacotes, escrita em settings/hooks e regras novas que conflitem com o `AGENTS.md`.
3. Substitua a pasta inteira, mantenha o `LICENSE` e atualize o commit na tabela acima.
4. Impeccable: o launcher `scripts/impeccable` precisa continuar com LF (regra no `.gitattributes`) e com bit de execução (`git update-index --chmod=+x`).
