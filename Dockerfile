# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci

COPY . .
ARG VITE_API_URL="https://api-treino.cunhalabs.tech"
# Client ID do Google OAuth — valor PÚBLICO (vai no bundle JS de qualquer forma; o que é
# secreto é o Client Secret, que este app não usa — fluxo GSI de ID token). Default
# hardcoded para o build de produção do Dokploy; sobreponível por build arg.
ARG VITE_GOOGLE_CLIENT_ID="260163007618-7buhki8asaektd6b3g9sr0ga2eamf1g6.apps.googleusercontent.com"
RUN VITE_API_URL="${VITE_API_URL}" VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}" npm run build

# Production stage
FROM nginx:1.27-alpine

# Mesma origem de API usada no build do bundle — entra na CSP (connect-src) para que
# o frontend possa chamar a API. ARG é por stage, por isso precisa ser repetido aqui.
ARG VITE_API_URL="https://api-treino.cunhalabs.tech"

# Copiar build da stage anterior
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Config do nginx versionada no repo. Antes era gerada inline aqui com printf, o que
# fazia o nginx.conf do repo virar código morto: produção rodava sem NENHUM header de
# segurança e sem o bloco de no-cache do PWA. Agora o repo é a fonte única.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/security-headers.conf

# Remover diretiva 'user nginx' (o container já roda como nginx), injetar a origem da
# API na CSP, validar a config e só então corrigir permissões.
# Porta 8080: processos não-root não podem fazer bind em portas < 1024
RUN sed -i '/^user[[:space:]]/d' /etc/nginx/nginx.conf && \
    sed -i "s|__API_ORIGIN__|${VITE_API_URL}|g" /etc/nginx/security-headers.conf && \
    nginx -t && \
    chown -R nginx:nginx \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]

