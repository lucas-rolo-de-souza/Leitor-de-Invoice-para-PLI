# Deployment Guide

This document provides comprehensive instructions for deploying **Leitor de Faturas AI** in both Cloud PaaS and **Enterprise Self-Hosted** environments.

---

## 1. 🏗 Architecture Overview & Requirements

This is a **Client-Side SPA (Single Page Application)**.

- **Artifacts**: HTML, CSS, JS, Assets (Images/Fonts).
- **Runtime**: Any web server (Nginx, Apache, Caddy).
- **Database**: Connects directly to Supabase (Cloud or Self-Hosted).
- **AI**: Connects directly to Google Gemini.

### Prerequisites for Self-Hosting

- **Docker**: v20.10+
- **SSL Certificate**: **Required**. The Camera API and Clipboard API will **fail** without HTTPS.
- **Supabase Instance**: Either a managed cloud project or a local Docker instance.

---

## 2. 🚀 Cloud Deployment (PaaS)

### Vercel (Recommended)

Zero-configuration deployment for React/Vite apps.

1.  Connect GitHub Repository.
2.  Framework Preset: **Vite**.
3.  **Environment Variables**:
    - `VITE_SUPABASE_URL`: Your Supabase URL.
    - `VITE_SUPABASE_ANON_KEY`: Your Public Key.
    - `VITE_GOOGLE_API_KEY`: Your Gemini API Key (Note: User can also provide this via BYOK).

### Netlify

1.  **Build Command**: `npm run build`
2.  **Publish Directory**: `dist`
3.  **Environment Variables**: Set the same variables as above.

---

## 3. 🏢 Enterprise Self-Hosting (Docker + Nginx)

For on-premise deployment, we use a Multi-Stage Docker build to create an optimized, lightweight container (~20MB).

### 3.1 Production Dockerfile

Create a file named `Dockerfile.prod`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
# Install dependencies (ci for strict lockfile adherence)
RUN npm ci
COPY . .

# Build-time variables MUST be passed as ARGs for Vite to see them
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_API_KEY
# Bake variables into the static files
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copy custom Nginx config for SPA routing & caching
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Nginx Configuration (`nginx.conf`)

Essential for SPA routing (fixing 404s on refresh) and Gzip compression.

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip Compression for Performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA Routing: Redirect all unknown routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Control for Static Assets (Vite hashes filenames, so infinite cache is safe)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Security Headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 3.3 Docker Compose (Orchestration)

```yaml
version: "3.8"
services:
  invoice-reader-app:
    build:
      context: .
      dockerfile: Dockerfile.prod
      args:
        - VITE_SUPABASE_URL=https://your-project.supabase.co
        - VITE_SUPABASE_ANON_KEY=your-key
        - VITE_GOOGLE_API_KEY=your-key
    ports:
      - "8080:80"
    restart: always
```

---

## 4. 🔌 Connecting to Self-Hosted Supabase

If you are running Supabase on-premise (via their Docker setup):

1.  **Network Access**: Ensure the Invoice Reader container (or user browser) can resolve the Supabase API URL.
2.  **Configuration**:
    - `VITE_SUPABASE_URL`: `https://your-internal-supabase-domain.com`
    - **CORS**: You MUST configure Supabase (`kong` gateway) to accept requests from your Invoice Reader domain.

---

## 5. 🔒 Security Checklist for Production

- ( ) **SSL/TLS**: Ensure Nginx is behind a reverse proxy (like Traefik or AWS ALB) terminating SSL. **The app will not work over HTTP** due to browser security policies for Camera access.
- ( ) **CSP (Content Security Policy)**: Adjust Nginx headers to allow connections only to:
  - `portalunico.siscomex.gov.br` (Official NCM)
  - `generativelanguage.googleapis.com` (Gemini)
  - `your-supabase-url.com`
- ( ) **Environment Variables**: Never commit `.env` files. Use secrets management (GitHub Secrets, Docker Secrets).

---

## 6. 🛠 Troubleshooting

- **"404 Not Found" on Refresh**: Check if `nginx.conf` has the handy `try_files $uri $uri/ /index.html;` line.
- **"Camera Permission Denied"**: You are likely strictly on `http://`. Switch to `https://` or `localhost`.
- **"CORS Error" (Supabase)**: Check your Supabase Project Settings -> API -> Allowed Origins. Add your domain.
