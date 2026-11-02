# VeryFact — Cloud Deployment Guide

This guide walks you through deploying **VeryFact** live to the web using **Render.com** (recommended for free-tier full-stack apps) or **Railway.app**.

---

## Architecture in Production

```mermaid
flowchart LR
    User["User Browser"] --> |HTTPS| Frontend["Frontend (Vite / Nginx)"]
    Frontend --> |HTTPS /api/*| Backend["Spring Boot 4.1 (Java 25)"]
    Backend --> |JDBC SSL| Postgres[("Managed PostgreSQL")]
    Backend --> |API| Gemini["Google Gemini 3.5 Flash-Lite"]
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
   | `GOOGLE_FACTCHECK_API_KEY` | `<your-api-key>` | *(Optional; separate Fact Check Tools credentials)* |
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


## Live Google Search verification

Deploy both the backend and frontend changes. Configure `GEMINI_API_KEY` on the
backend and set `GEMINI_MODEL` to a model available to that key which supports
Google Search (default: `gemini-3.5-flash-lite`). Fact Check Tools is optional and does
not replace Google Search. Missing Gemini configuration, quota/authentication
failures, and responses without search-result evidence now produce failed checks,
never demo verdicts.

New successful checks expose a `modelVersion` ending in `-search-v1`, confirming
that Google Search execution evidence was returned (queries and web sources for Gemini 2.5). Historical
reports remain accessible; only confirmed-search results within one hour are
reused for identical submissions. After deploying, submit a fresh claim, inspect
the cited pages, and compare completion times across representative inputs.

Gemini requests time out after 60 seconds (`GEMINI_REQUEST_TIMEOUT`, maximum
120s). Google 429 responses fail the check without ungrounded retries. Check the
Gemini project quota/model access when these persist. Fact Check Tools requires
an explicit `GOOGLE_FACTCHECK_API_KEY`; it no longer reuses the Gemini key. A 401
from that optional API does not prevent live Gemini Google Search. Checks left
pending/processing by a restart expire after five minutes (cleanup runs every
30 seconds). Backend code changes require restarting/redeploying the backend;
a refreshed Vite frontend does not reload an existing Java process.

Gemini 3.5 Flash-Lite text-generation quota does not include free-tier API
Google Search grounding. That tool requires eligible API billing. Gemini 2.5
Flash/Flash-Lite offer limited free grounding only for eligible legacy users;
Google restricts those models to users who actively used them previously.
A visible quota row does not establish model access. HTTP 404 is reported as
a model-unavailable failure. Verify model and Search access before deployment.

## Default free Google-results configuration

Set `GEMINI_MODEL=gemini-3.5-flash-lite`, `GOOGLE_SEARCH_PROVIDER=serpapi`, and
`SERPAPI_API_KEY` from a SerpApi Free Plan account. Retain `GEMINI_API_KEY` for
Gemini basic generation. Queries are sent to SerpApi for Google results; native
Gemini Google Search is not called in this mode. The currently advertised free
allowance is 250 searches/month; an uncached report uses one or two searches
and two Gemini calls. Both accounts must remain within their free allowances.
There is no automatic upgrade or paid-grounding fallback. Never put keys in the
frontend or commit them. Restart/redeploy after setting the backend variables.

Earlier notes about Gemini 3 Search billing refer to the explicit native mode
(`GOOGLE_SEARCH_PROVIDER=gemini`), not this default external-retrieval path.
