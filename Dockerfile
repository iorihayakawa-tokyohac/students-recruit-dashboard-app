FROM node:20-slim AS base

# Install a pinned pnpm version up front to avoid Corepack downloads timing out in CI
ARG PNPM_VERSION=10.4.1
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

RUN mkdir -p /pnpm/store \
  && npm install -g pnpm@${PNPM_VERSION} \
  && pnpm config set store-dir /pnpm/store

FROM base AS build

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Set environment variables from build args
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# Ensure .env file is present in the image (will be empty if not provided by the build context)
RUN test -f .env || touch .env
# Copy .env to .env.local for Next.js to read during build
RUN cp .env .env.local 2>/dev/null || touch .env.local
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/server /app/server
COPY --from=build /app/api /app/api
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/drizzle /app/drizzle
COPY --from=build /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build /app/.env /app/.env
COPY --from=build /app/.env.local /app/.env.local
COPY --from=build /app/next.config.js /app/next.config.js

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD [ "sh", "-c", "pnpm drizzle-kit push && pnpm start" ]
