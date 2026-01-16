# Deployment Guide

This application is a static React SPA (Single Page Application). It can be hosted on any static file server (Vercel, Netlify, AWS S3, Nginx).

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Google Gemini API Key**: You need a valid API Key from Google AI Studio.

## 2. Environment Configuration

The application expects the API Key to be available in the environment variables.

### Local Development

Create a `.env` file in the root:

```bash
API_KEY=your_google_api_key_here
```

_Note: In the AI Studio internal environment, this is injected automatically via `process.env.API_KEY`._

### Production

You must configure your build tool to inject the variable at build time.

**Important**: Since this is a client-side app, the API Key will be exposed in the browser network traffic.

- **Recommendation**: For strict production environments, set up a simple Proxy Server (Node/Edge Function) that holds the key and forwards requests to Google, rather than exposing the key directly in the frontend code.

## 3. Building the Application

To create a production build:

```bash
npm run build
```

This will generate a `dist/` folder containing:

- `index.html`
- `assets/` (Minified JS and CSS)

## 4. Hosting Options

### Vercel (Recommended)

1.  Connect your Git repository.
2.  Set Framework Preset to **Vite**.
3.  Add Environment Variable `API_KEY`.
4.  Deploy.

### Netlify

1.  Connect Git repository.
2.  Build command: `npm run build`.
3.  Publish directory: `dist`.
4.  Add Environment Variable `API_KEY`.

### Docker (Nginx)

Create a `Dockerfile`:

```dockerfile
# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pass key arg if needed, or rely on runtime env
ARG API_KEY
ENV API_KEY=$API_KEY
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 5. Permissions

If hosting in a restricted iframe or specific browser environments, ensure `metadata.json` permissions (camera/microphone) are respected, although this app currently primarily uses file upload.

## 6. Post-Deployment Checks

1.  **NCM Database**: Open the app and verify the footer status says "Base NCM: Online". This confirms the external fetch to Siscomex/GitHub was successful.
2.  **AI Extraction**: Upload a test PDF. If it fails immediately, check console logs for 401 (Invalid API Key) errors. Ensure your key has access to `gemini-2.5-flash`.
