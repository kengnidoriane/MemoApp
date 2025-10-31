# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the source code
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Copy source code
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

# Build the application
WORKDIR /app/apps/frontend
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy PWA files to root for proper service worker registration
COPY --from=builder /app/apps/frontend/dist/sw.js /usr/share/nginx/html/
COPY --from=builder /app/apps/frontend/dist/manifest.json /usr/share/nginx/html/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Set proper permissions
RUN chown -R frontend:nodejs /usr/share/nginx/html
RUN chown -R frontend:nodejs /var/cache/nginx
RUN chown -R frontend:nodejs /var/log/nginx
RUN chown -R frontend:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R frontend:nodejs /var/run/nginx.pid

USER frontend

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]