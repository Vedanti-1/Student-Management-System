# Production Dockerfile for Student Management System
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first for cached dependency installation
COPY backend/package*.json ./backend/

# Install production dependencies inside backend directory
WORKDIR /app/backend
RUN npm ci --omit=dev || npm install --production

# Copy backend source code and frontend static assets
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start server
CMD ["node", "backend/server.js"]
