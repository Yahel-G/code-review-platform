# --- Production-ready Dockerfile for the Node.js backend ---
# Use official lightweight Node.js image
FROM node:20-alpine AS base

# Create and set working directory
WORKDIR /app

# Copy only the package manifests first for efficient layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY . .

# Ensure environment variables are set to production by default
ENV NODE_ENV=production

# Expose the port Express listens on
EXPOSE 5000

# Launch the server
CMD ["node", "server.js"]
