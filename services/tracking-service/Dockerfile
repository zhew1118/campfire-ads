# Multi-stage build for tracking service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY services/tracking-service/package*.json ./services/tracking-service/
COPY common/middleware/package*.json ./common/middleware/

# Install dependencies for both tracking service and common middleware
RUN cd services/tracking-service && npm ci
RUN cd common/middleware && npm install

# Copy all source code
COPY . .

# Build TypeScript for both common middleware and tracking service
RUN cd common/middleware && npm run build
RUN cd services/tracking-service && npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY services/tracking-service/package*.json ./services/tracking-service/
COPY common/middleware/package*.json ./common/middleware/

RUN cd common/middleware && npm ci --only=production
RUN cd services/tracking-service && npm ci --only=production

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/tracking-service/dist ./services/tracking-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/common/middleware/dist ./common/middleware/dist
COPY --from=builder --chown=nodejs:nodejs /app/common/types ./common/types

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to nodejs user
USER nodejs

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/tracking-service/dist/services/tracking-service/src/app.js"]

