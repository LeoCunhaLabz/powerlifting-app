# Setup: Exposição do Dokploy via HTTPS

## Diagnóstico

A porta 3000 do Dokploy está **bloqueada por firewall de rede do provedor** para IPs externos (ex.: GitHub Actions). Porém, portas 80/443 (HTTP/HTTPS) estão abertas. A solução é expor o Dokploy via **subdomínio HTTPS**.

## Configuração necessária

### 1. DNS: Registros A dos subdomínios

Adicione no seu provedor de domínio (cunhalabs.tech):

```
dokploy.cunhalabs.tech    A    187.77.245.102
powerlifting.cunhalabs.tech   A    187.77.245.102
```

Aguarde propagação (5-60 min). Teste:
```bash
nslookup dokploy.cunhalabs.tech
nslookup powerlifting.cunhalabs.tech
```

### 2. Dokploy: Configurar domínio do painel

**Acesse:** `http://187.77.245.102:3000` (do seu PC local)

**Navegue para:** Settings → Server → Domain

**Adicione:** `dokploy.cunhalabs.tech`

O Dokploy gera certificado SSL automaticamente via Let's Encrypt. Aguarde ~1 min.

**Teste:**
```bash
curl -k https://dokploy.cunhalabs.tech/
# Deve retornar 200 (com SSL)
```

### 3. Dokploy: Mover aplicação para subdomínio

**Aplicação powerlifting**

1. Dentro do Dokploy, acesse a aplicação powerlifting
2. **Domains** → remova `cunhalabs.tech`, adicione `powerlifting.cunhalabs.tech`
3. Aguarde rebuild (1-2 min)

**Teste:**
```bash
curl -I https://powerlifting.cunhalabs.tech
```

### 4. GitHub Secrets: Atualizar URLs

```
DOKPLOY_URL=https://dokploy.cunhalabs.tech
APP_URL=https://powerlifting.cunhalabs.tech
```

No seu repo: **Settings → Secrets and variables → Actions → Secrets**

**Após isso:** o próximo `push` em `main` disparará o deploy via HTTPS (porta 443, sem firewall).

## Rollback (se precisar revertir)

Se precisar voltar ao IP:3000 por algum motivo, remova os subdomínios do DNS e revert os secrets em GitHub. Mas **recomenda-se deixar assim** — é mais seguro e profissional.
