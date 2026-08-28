FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY Backend/package.json Backend/package-lock.json* ./Backend/
COPY Backend/prisma ./Backend/prisma/
COPY Frontend/package.json Frontend/package-lock.json* ./Frontend/

# Install backend dependencies and generate Prisma client
RUN cd Backend && npm install --production && npx prisma generate

# Install frontend dependencies (including devDependencies for build)
RUN cd Frontend && npm install

# Copy source code
COPY Backend/ ./Backend/
COPY Frontend/ ./Frontend/

# Build frontend
RUN cd Frontend && chmod +x node_modules/.bin/vite && npm run build

# Set production environment
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "Backend/src/server.js"]
