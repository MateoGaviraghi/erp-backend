# =============================================================================
# Stage 1 — Build
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifests primero para aprovechar caché de capas
COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (dev incluidas para compilar)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente y compilar
COPY src ./src
RUN npm run build

# =============================================================================
# Stage 2 — Production
# =============================================================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copiar manifests
COPY package*.json ./
COPY prisma ./prisma/

# Solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Generar Prisma Client en producción
RUN npx prisma generate

# Copiar el build compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/src/main"]
