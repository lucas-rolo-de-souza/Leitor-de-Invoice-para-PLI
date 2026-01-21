# Build Stage
FROM node:24-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# We don't verify env vars here because they will be provided at runtime
RUN npm run build

# Production Stage
FROM nginx:1-alpine-slim

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy env script and make it executable
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Expose port 80
EXPOSE 80

# Nginx Docker image automatically runs scripts in /docker-entrypoint.d/
# We don't need a custom ENTRYPOINT as long as env.sh doesn't block (it shouldn't if we remove exec)
# But my env.sh DOES have exec "$@". 
# So I should either:
# 1. Modify env.sh to NOT have exec "$@" (if using /docker-entrypoint.d/)
# 2. Use a custom CMD ["/bin/sh", "-c", "/docker-entrypoint.d/env.sh && nginx -g 'daemon off;'"]
# 3. Use my own ENTRYPOINT.

# Let's use the explicit CMD approach for clarity and control, keeping env.sh as is (with exec)
# actually, if env.sh has exec "$@", and I put it in /docker-entrypoint.d/, the default entrypoint will run it.
# If it runs it, it will exec nginx (because default entrypoint passes CMD to run-parts which might be tricky).

# Safest bet: Custom ENTRYPOINT
COPY env.sh /env.sh
RUN chmod +x /env.sh
ENTRYPOINT ["/env.sh"]
CMD ["nginx", "-g", "daemon off;"]
