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

# Gerar nginx.conf inline (evita BOM/CRLF de arquivos criados no Windows)
RUN printf 'server {\n\
    listen 80;\n\
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

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

