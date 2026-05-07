FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --ignore-scripts

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.build.json tsup.config.ts ./
COPY src ./src
RUN npm run typecheck && npm run build

FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM debian:12-slim AS tini
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=tini /usr/bin/tini /usr/local/bin/tini
COPY public ./public
COPY package.json ./

ENV NODE_ENV=production

EXPOSE 3000 3001

USER 65532:65532

ENTRYPOINT ["/usr/local/bin/tini", "--", "/nodejs/bin/node", "--enable-source-maps", "/app/dist/index.js"]
