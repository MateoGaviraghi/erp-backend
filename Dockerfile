# =============================================================================
# Stage 1 — Build
# =============================================================================
FROM node:22-slim AS builder

# Parchear vulnerabilidades del OS base
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar manifests primero para aprovechar caché de capas
COPY package*.json ./
COPY nest-cli.json tsconfig*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./

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
FROM node:22-slim AS production

# Parchear vulnerabilidades del OS base
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copiar manifests
COPY package*.json ./
COPY prisma ./prisma/

# Solo dependencias de producción (dotenv es devDep — no se instala aquí)
RUN npm ci --omit=dev && npm cache clean --force

# Copiar Prisma Client ya generado desde el builder (evita necesitar dotenv)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar el build compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/src/main"]
