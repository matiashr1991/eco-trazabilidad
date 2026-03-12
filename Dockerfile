# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para Prisma
RUN apk add --no-cache libc6-compat

# Copiar archivos de definición de paquetes
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Construir la aplicación Next.js
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar solo lo necesario desde el builder (output: standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# El comando de inicio para standalone es node server.js
CMD ["node", "server.js"]
