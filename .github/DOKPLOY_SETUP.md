# Setup: Runner self-hosted para o deploy

## Diagnóstico

O firewall de rede do provedor do VPS **bloqueia os IPs dos runners hospedados do GitHub** (datacenter/Azure) tanto na porta `3000` quanto na `443` — mesmo o painel Dokploy estando acessível por HTTPS a partir de IPs residenciais. Por isso os jobs `deploy` e `verify` falhavam com timeout (`curl 28 / HTTP 000`).

## Solução

Um **GitHub Actions runner self-hosted** roda no próprio VPS. Ele abre uma conexão **de saída** (VPS → GitHub) por long-poll, então **não depende** do firewall liberar acesso de entrada. Os jobs de deploy passam a chamar a API do Dokploy **internamente** em `http://localhost:3000`.

- `build`, `lint`, `test` e `notify` continuam em `ubuntu-latest` (runners hospedados do GitHub).
- `deploy` e `verify` rodam no runner self-hosted (label `dokploy-vps`) — ver [deploy.yml](workflows/deploy.yml).

## O que já está provisionado no VPS

Feito automaticamente (usuário `github-runner`, em `/home/github-runner/actions-runner`):

- Runner `v2.335.1` (linux-x64) baixado e com dependências instaladas.
- Unit do systemd `github-runner.service` criada (auto-restart, `Restart=always`).

Falta apenas **registrar o runner com um token** (passo manual — o token é secreto).

## Passo manual: registrar o runner

1. No GitHub, acesse: **Settings → Actions → Runners → New self-hosted runner**
   (URL direta: `https://github.com/LeoCunhaLabz/powerlifting-app/settings/actions/runners/new`)
2. Copie o **registration token** (começa com `A...`, válido por 1h).
3. No **seu** terminal, rode (substituindo `COLE_O_TOKEN`):

   ```bash
   ssh root@187.77.245.102 "su - github-runner -c 'cd /home/github-runner/actions-runner && ./config.sh --url https://github.com/LeoCunhaLabz/powerlifting-app --token COLE_O_TOKEN --name dokploy-vps --labels dokploy-vps --unattended --replace'"
   ```

4. Inicie o serviço (auto-start no boot):

   ```bash
   ssh root@187.77.245.102 "systemctl enable --now github-runner.service && systemctl --no-pager status github-runner.service | head -5"
   ```

5. Confirme que o runner aparece **online** em Settings → Actions → Runners.

## Validação

Após o runner ficar online, qualquer `push` em `main` dispara o pipeline; os jobs `deploy` e `verify` rodarão no runner do VPS. Acompanhe em **Actions**.

## Manutenção

- O runner se **auto-atualiza** por padrão.
- Logs: `journalctl -u github-runner.service -f` (no VPS).
- Reiniciar: `systemctl restart github-runner.service`.
- Remover: `su - github-runner -c '.../config.sh remove --token <TOKEN>'` + `systemctl disable --now github-runner.service`.

## Secrets do GitHub ainda usados

`deploy`/`verify` não usam mais `DOKPLOY_URL` (agora é `http://localhost:3000` fixo, interno). Continuam necessários:

- `DOKPLOY_API_KEY`, `DOKPLOY_APP_ID_WEB`, `DOKPLOY_APP_ID_API` — disparo do deploy.
- `APP_URL`, `API_URL` — smoke test das URLs públicas (hairpin pelo Traefik do VPS).
- `RESEND_API_KEY` (e afins) — notificação por e-mail no job `notify`.
