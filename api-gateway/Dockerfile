FROM node:18-alpine

WORKDIR /app

# First, copy and build common middleware
COPY common ./common
WORKDIR /app/common
RUN npm ci && npm run build

# Then build API Gateway
WORKDIR /app/api-gateway
COPY api-gateway/package*.json ./
RUN npm ci --only=production

# Copy API Gateway source
COPY api-gateway .

# Build TypeScript
RUN npm run build

# Set final working directory
WORKDIR /app/api-gateway

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app/api-gateway
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "run", "start:secure"]