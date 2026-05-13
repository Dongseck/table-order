# syntax=docker/dockerfile:1
# Build context = repository root (see docker-compose.yml).
# All paths are relative to repo root.

FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm install --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/tsconfig*.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY shared /shared
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Seoul
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY backend/package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
