# Multi-stage build for inventory service
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY services/inventory-service/package*.json ./services/inventory-service/
COPY common/middleware/package*.json ./common/middleware/

# Install dependencies for both inventory service and common middleware
RUN cd services/inventory-service && npm ci
RUN cd common/middleware && npm install

# Copy all source code
COPY . .

# Build TypeScript for both common middleware and inventory service
RUN cd common/middleware && npm run build
RUN cd services/inventory-service && npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY services/inventory-service/package*.json ./services/inventory-service/
COPY common/middleware/package*.json ./common/middleware/

RUN cd common/middleware && npm ci --only=production
RUN cd services/inventory-service && npm ci --only=production

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/inventory-service/dist ./services/inventory-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/common/middleware/dist ./common/middleware/dist
COPY --from=builder --chown=nodejs:nodejs /app/common/types ./common/types

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to nodejs user
USER nodejs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/inventory-service/dist/services/inventory-service/src/app.js"]