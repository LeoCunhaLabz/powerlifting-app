# Runbook de Produção — VPS / Dokploy

> **Fonte da verdade para infra de produção.** Qualquer mudança de infra deve ser refletida aqui no mesmo PR.

O app roda no **Dokploy** em um VPS próprio. Os três recursos (web, api, postgres) são gerenciados pelo Dokploy como entidades separadas — não use o `docker-compose.yml` da raiz em produção.

---

## Arquitetura de produção

```
Internet → Traefik (TLS, gerenciado pelo Dokploy)
              ├─ app.dominio.com  → web  (nginx não-root, porta 8080, rede dokploy-network)
              └─ api.dominio.com  → api  (Node.js, porta 3000, rede dokploy-network)
                                         └─ postgres (recurso gerenciado, mesma rede)
```

- **Traefik** gerencia TLS (Let's Encrypt) e roteamento — configurado pelo Dokploy automaticamente.
- **`dokploy-network`** é a rede Docker interna que conecta os três recursos sem expor portas ao host.
- Os containers não expõem portas diretamente ao host; o Traefik roteia pelo nome do serviço.

---

## Recursos no Dokploy

| Recurso | Tipo | Porta interna | Observações |
|---------|------|---------------|-------------|
| **web** | Application | 8080 | Nginx non-root; imagem do `Dockerfile` raiz |
| **api** | Application | 3000 | Node.js non-root; imagem do `apps/api/Dockerfile` |
| **powerliftingdb** | PostgreSQL (gerenciado) | 5432 | Painel próprio no Dokploy com backups |

> **Importante:** o auto-deploy do Dokploy **deve estar desligado** em ambas as applications (Settings da aplicação → Deployments → desativar "Auto deploy"). O único gatilho de deploy é o workflow `deploy.yml`.

---

## Variáveis de ambiente da API

Configuradas em **Dokploy → api → Environment** (nunca commitadas):

| Variável | Exemplo / Descrição |
|----------|---------------------|
| `PORT` | `3000` |
| `HOST` | `0.0.0.0` |
| `DATABASE_URL` | `postgresql://powerlifting:<senha>@<hostname-db-dokploy>:5432/powerlifting` |
| `CORS_ORIGIN` | `https://app.dominio.com` (URL pública do frontend) |
| `JWT_SECRET` | String aleatória ≥ 32 chars — gere com `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |

O `DATABASE_URL` aponta para o **hostname do recurso PostgreSQL do Dokploy** (visível em Dokploy → powerliftingdb → Connection), não para `localhost` nem para o hostname do `docker-compose.yml`.

---

## Secrets do GitHub Actions

Configurados em **GitHub → Settings → Secrets → Actions**:

| Secret | Descrição |
|--------|-----------|
| `DOKPLOY_API_KEY` | API key do painel Dokploy (Settings → API → Generate) |
| `DOKPLOY_APP_ID_WEB` | `applicationId` do serviço **web** (URL do painel: `.../application/<id>`) |
| `DOKPLOY_APP_ID_API` | `applicationId` do serviço **api** |
| `APP_URL` | URL pública do frontend (ex.: `https://app.dominio.com`) — usado no smoke test |
| `API_URL` | URL pública da API (ex.: `https://api.dominio.com/health`) — usado no smoke test |
| `RESEND_API_KEY` | API key do [Resend](https://resend.com) para e-mails de deploy |
| `MAIL_TO` | E-mail destinatário do resumo de deploy |

---

## Runner self-hosted (`dokploy-vps`)

O job `deploy` e `verify` do `deploy.yml` rodam em `runs-on: [self-hosted, dokploy-vps]`. Isso é necessário porque:

1. O Dokploy escuta em `localhost:3000` — não acessível pelos runners hospedados do GitHub.
2. O runner no VPS abre conexão **de saída** para o GitHub Actions (sem necessidade de liberar portas de entrada).

### Instalar o runner no VPS

1. GitHub → Settings → Actions → Runners → **New self-hosted runner** → Linux x64.
2. Seguir os passos de instalação (download + `config.sh --url ... --token ...`).
3. Registrar o label `dokploy-vps`:
   ```bash
   # durante o config.sh, quando perguntar labels:
   dokploy-vps
   ```
4. Instalar como serviço:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### Verificar status do runner
```bash
sudo ./svc.sh status
# ou
sudo systemctl status actions.runner.<org>.<repo>.<nome>.service
```

---

## Fluxo do CI/CD (`deploy.yml`)

```
push → main
  └─ job: build (ubuntu-latest)
       lint → testes → build (type-check) do web e da API
       ↓ (somente se tudo passar)
  └─ job: deploy (self-hosted: dokploy-vps)
       POST /api/application.deploy  →  web
       POST /api/application.deploy  →  api
       ↓
  └─ job: verify (self-hosted: dokploy-vps)
       aguarda status 'done' via API Dokploy (poll, ~13 min max)
       curl smoke test  →  APP_URL (200)
       curl smoke test  →  API_URL (200)
       ↓
  └─ job: notify (ubuntu-latest, sempre)
       e-mail com resumo (Resend)
```

- O deploy **nunca acontece** se lint/testes/build do web ou da API falharem.
- O smoke test espera o Dokploy terminar o build/rollout antes de testar a URL pública (evita falso negativo com VPS sob carga).
- Pull Requests são validados pelo `ci.yml` (lint → testes → build do web e da API) antes do merge.

---

## Migrations de banco

As migrations são aplicadas **automaticamente no boot** da API via `runMigrations()` em [`apps/api/src/db/index.ts`](../apps/api/src/db/index.ts). São idempotentes (pula migrations já aplicadas). Não é necessário rodar manualmente em produção.

Para gerar novas migrations após alterar o schema:
```bash
npm run db:generate -w @powerlifting/api
# O arquivo gerado em apps/api/src/db/migrations/ deve ser commitado.
```

---

## Rollback

O Dokploy mantém histórico de deploys. Para reverter:
1. Dokploy → aplicação → Deployments → selecionar deploy anterior → **Redeploy**.
2. Ou reverter o commit em `main` e aguardar o pipeline.

---

## Checklist ao provisionar do zero

- [ ] Criar recurso PostgreSQL no Dokploy; anotar `DATABASE_URL`.
- [ ] Criar application **api** com o Dockerfile `apps/api/Dockerfile`; configurar variáveis de ambiente; desligar auto-deploy.
- [ ] Criar application **web** com o `Dockerfile` da raiz; desligar auto-deploy.
- [ ] Configurar Traefik/domínio para ambas as applications no Dokploy.
- [ ] Instalar runner self-hosted no VPS com label `dokploy-vps`.
- [ ] Configurar todos os secrets no GitHub Actions.
- [ ] Fazer um push para `main` e acompanhar o pipeline.
