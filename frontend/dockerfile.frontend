## ==== Base (deps + sources) ====
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

## ==== Development (Vite dev server) ====
FROM base AS dev

ENV NODE_ENV=development
ENV FRONTEND_PORT=5173
EXPOSE ${FRONTEND_PORT}
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "${FRONTEND_PORT}"]

## ==== Build (Vite build) ====
FROM base AS build

# Allow passing base URLs at build time (used by Vite)
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

## ==== Runtime (Nginx serving dist) ====
FROM nginx:1.27-alpine AS runtime

WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=build /app/dist .

# Copy nginx.conf that uses env placeholders
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port configurable by env at runtime
ENV FRONTEND_PORT=80
ENV FRONTEND_DOMAIN=localhost
ENV BACKEND_PORT=3000

EXPOSE ${FRONTEND_PORT}

CMD ["nginx", "-g", "daemon off;"]