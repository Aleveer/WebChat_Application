FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
# Port Nest lắng nghe – ECS/ALB đang trỏ port 3000
ENV PORT=3000
EXPOSE 3000

# Start Nest app HTTP (main.ts)
CMD ["node", "dist/main.js"]