# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

# Install runtime dependencies for dataset download and SQLite import
RUN apk add --no-cache bash curl sqlite gzip

# Copy initialization scripts
COPY init.sh init.sql indexes.sql ./
RUN chmod +x init.sh

# Copy built output from builder
COPY --from=builder /app/.output ./.output

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
