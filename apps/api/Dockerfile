FROM node:20-alpine AS base
RUN npm install -g pnpm@9

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/billing/package.json ./packages/billing/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY apps/api ./apps/api
COPY packages ./packages

RUN pnpm --filter @yantrix/shared-types build
RUN pnpm --filter @yantrix/auth build
RUN pnpm --filter @yantrix/billing build
RUN pnpm --filter @yantrix/api build
RUN pnpm --filter @yantrix/api run db:generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/prisma ./prisma

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
