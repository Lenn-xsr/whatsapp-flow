# whatsapp-flow flow-engine, built from the pnpm workspace (repo root as build context):
#   docker build -f apps/flow-engine/Dockerfile -t whatsapp-flow-engine .
FROM node:22-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Root workspace manifests + the packages this app needs + the app itself.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/flow-engine ./apps/flow-engine

# Install only the app and its workspace dependency graph.
RUN pnpm install --frozen-lockfile --filter @whatsapp-flow/flow-engine...

# pnpm builds the workspace dependencies first, then the app.
RUN pnpm --filter @whatsapp-flow/flow-engine... build

# Self-contained, prod-only deployment (workspace deps are injected + pruned).
RUN pnpm --filter @whatsapp-flow/flow-engine deploy --prod /app

FROM node:22-alpine AS production
WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
