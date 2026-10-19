# VeryFact — Cloud Deployment Guide

This guide walks you through deploying **VeryFact** live to the web using **Render.com** (recommended for free-tier full-stack apps) or **Railway.app**.

---

## Architecture in Production

```mermaid
flowchart LR
    User["User Browser"] --> |HTTPS| Frontend["Frontend (Vite / Nginx)"]
    Frontend --> |HTTPS /api/*| Backend["Spring Boot 4.1 (Java 25)"]
    Backend --> |JDBC SSL| Postgres[("Managed PostgreSQL")]
    Backend --> |API| Gemini["Google Gemini 3.8 Flash"]
    Backend --> |API| FactCheck["Google Fact Check Tools"]
```

---

## Option 1: Deploying to Render.com (Recommended Free Tier)

Render provides a free PostgreSQL database, free backend Web Service (Docker), and free frontend Static Site.

### Step 1: Create a Render Account & Connect GitHub
1. Sign in to [Render.com](https://render.com) using your GitHub account (`kingsmark16`).

---

### Step 2: Provision a Managed PostgreSQL Database
1. In the Render Dashboard, click **New +** $\to$ **PostgreSQL**.
2. Set:
   - **Name:** `veryfact-db`
   - **Database:** `veryfact`
   - **User:** `veryfact`
   - **Region:** Choose the region closest to you (e.g. *Singapore*, *Oregon*, or *Frankfurt*).
   - **Instance Type:** **Free**
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g., `postgres://veryfact:...@dpg-...-a:5432/veryfact`).
   - If deploying backend on Render, use the **Internal Database URL**.
   - If connecting from outside Render, use the **External Database URL**.

---

### Step 3: Deploy the Backend Web Service
1. In the Render Dashboard, click **New +** $\to$ **Web Service**.
2. Select your repository: **`kingsmark16/VeryFact`**.
3. Configure the service:
   - **Name:** `veryfact-backend`
   - **Region:** Same region as your database.
   - **Root Directory:** `backend`
   - **Runtime:** **Docker**
   - **Docker Command:** *(leave default / empty)*
   - **Instance Type:** **Free**
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:5432/veryfact?sslmode=require` | Replace `<host>` from your Render DB Internal URL |
   | `POSTGRES_USER` | `veryfact` | Database username |
   | `POSTGRES_PASSWORD` | `<your-render-db-password>` | From your Render DB |
   | `GEMINI_API_KEY` | `<your-gemini-api-key>` | From Google AI Studio |
   | `GOOGLE_FACTCHECK_API_KEY` | `<your-api-key>` | *(Optional; falls back to GEMINI_API_KEY)* |
   | `CORS_ALLOWED_ORIGINS` | `*` *(or your frontend URL after creation)* | e.g. `https://veryfact.onrender.com` |
5. Click **Deploy Web Service**.
   - Render will build the Docker container using `backend/Dockerfile` with Java 25.
   - When deployed, note your backend URL (e.g., `https://veryfact-backend.onrender.com`).

---

### Step 4: Deploy the Frontend (Static Site)
1. In the Render Dashboard, click **New +** $\to$ **Static Site**.
2. Select repository: **`kingsmark16/VeryFact`**.
3. Configure:
   - **Name:** `veryfact`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://veryfact-backend.onrender.com` *(your backend URL)* |
5. Under **Redirects / Rewrites** in the left menu:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** **Rewrite** *(essential for React Router routes like `/r/{slug}`)*
6. Click **Create Static Site**.

---

### Step 5: Update CORS on Backend
Once your frontend URL is live (e.g. `https://veryfact.onrender.com`):
1. Go back to `veryfact-backend` $\to$ **Environment Variables**.
2. Update `CORS_ALLOWED_ORIGINS` to: `https://veryfact.onrender.com`.
3. Save changes.

---

## Option 2: Deploying to Railway.app

If you prefer deploying the full monorepo with 1 click:
1. Go to [Railway.app](https://railway.app) and click **New Project** $\to$ **Deploy from GitHub repo**.
2. Add **PostgreSQL** from the Railway catalog.
3. Add a new service pointing to the `backend/` directory using Dockerfile.
   - Connect Railway's `${{Postgres.DATABASE_URL}}` to `SPRING_DATASOURCE_URL`.
   - Add `GEMINI_API_KEY`.
4. Add a new service pointing to `frontend/` using Dockerfile (`frontend/Dockerfile` includes Nginx).

