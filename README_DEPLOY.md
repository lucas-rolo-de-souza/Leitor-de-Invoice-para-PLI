# Deployment Guide

This guide explains how to deploy the **Leitor de Faturas AI** application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your server or local machine.
- A Supabase project with URL and Anon Key.

## Setup

1. **Environment Variables**
   Ensure you have a `.env` file in the root directory (where `docker-compose.yml` is) with the following variables:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   > **Note:** The Gemini API Key is not included in the build as the application uses a "Bring Your Own Key" (BYOK) model, where the user enters the key in the UI.

2. **Build and Run**

   Run the following command to build the image and start the container:

   ```bash
   docker-compose up -d --build
   ```

   The application will be available at `http://localhost:8080`.

3. **Stopping the Application**

   To stop the application:

   ```bash
   docker-compose down
   ```

## Manual Deployment (Without Docker)

If you prefer to host on a traditional web server (Apache/Nginx):

1. **Build the Application**

   ```bash
   # Install dependencies
   npm ci

   # Build (ensure env vars are set in your shell or .env)
   export VITE_SUPABASE_URL=...
   export VITE_SUPABASE_ANON_KEY=...
   npm run build
   ```

2. **Serve the `dist` folder**
   Copy the contents of the `dist/` directory to your web server's public root.
   Configure your web server to redirect all 404 requests to `index.html` (SPA fallback).
