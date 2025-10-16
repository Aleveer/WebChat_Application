# ==== Base node image ====
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Default port via env (runtime overridable)
ENV PORT=3001

# ==== Development target ====
FROM base AS dev

ENV NODE_ENV=development
EXPOSE ${PORT}
CMD ["npm", "run", "start:dev"]

# ==== Build target ====
FROM base AS build
ENV NODE_ENV=production
RUN npm run build

# ==== Production runtime ====
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
EXPOSE ${PORT}
CMD ["npm", "run", "start:prod"]


