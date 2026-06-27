# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:1.27-alpine

# Copiar build da stage anterior
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Remover diretiva 'user nginx' do nginx.conf principal:
# quando o master process já sobe como não-root, a diretiva 'user' causa erro.
# Corrigir também as permissões dos diretórios que o worker precisa escrever.
RUN sed -i '/^user[[:space:]]/d' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Gerar nginx.conf inline (evita BOM/CRLF de arquivos criados no Windows)
# Porta 8080: processos não-root não podem fazer bind em portas < 1024
RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_proxied any;\n\
    gzip_comp_level 6;\n\
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;\n\
    location ~* \\.(js|css|woff2|woff|ttf|ico|png|jpg|jpeg|gif|svg)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        access_log off;\n\
    }\n\
    location = /index.html {\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
        add_header Pragma "no-cache";\n\
        add_header Expires "0";\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]

