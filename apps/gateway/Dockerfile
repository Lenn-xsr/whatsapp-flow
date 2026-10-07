# whatsapp-flow gateway, built from the pnpm workspace (repo root as build context):
#   docker build -f apps/gateway/Dockerfile -t whatsapp-flow-gateway .
FROM node:22-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Root workspace manifests + the packages this app needs + the app itself.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/gateway ./apps/gateway

# Install only the app and its workspace dependency graph.
RUN pnpm install --frozen-lockfile --filter @whatsapp-flow/gateway...

# pnpm builds the workspace dependencies first, then the app.
RUN pnpm --filter @whatsapp-flow/gateway... build

# Self-contained, prod-only deployment (workspace deps are injected + pruned).
RUN pnpm --filter @whatsapp-flow/gateway deploy --prod /app

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
