# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci

# Copy source files
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/

# Compile TypeScript
RUN npm run build -w @powerlifting/api

# Production stage
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --omit=dev
# Copy compiled output from build stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0
ENV CORS_ORIGIN=http://localhost:5173

CMD ["node", "apps/api/dist/index.js"]
