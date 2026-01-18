# Deploy to Render

This guide covers deploying the **Skill Execution Platform** (backend + frontend) to [Render](https://render.com).

## Architecture on Render

You will create **two Web Services** from this repo:

| Service  | Root Directory | Purpose        |
|----------|----------------|----------------|
| **API**  | `server`       | Express backend |
| **Web**  | `client`       | Next.js frontend |

---

## Option A: Deploy with Blueprint (recommended)

1. **Push this repo to GitHub/GitLab** (ensure `render.yaml` is in the root).

2. **In Render: New → Blueprint**
   - Connect your repo.
   - Render will read `render.yaml` and create both services.
   - You still must **add secret environment variables** in each service (see below).

3. **Configure env vars** for both services (see **Environment variables** below).

4. **Deploy**: Render will build and deploy. The first deploy may fail if `NEXT_PUBLIC_API_URL` or `CLIENT_URL` are missing; add them and redeploy.

---

## Option B: Create two Web Services manually

### 1. Backend (API)

- **New → Web Service** → connect this repo.
- **Name**: e.g. `skill-platform-api`
- **Region**: choose one (e.g. Oregon).
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free or paid.

**Environment** (add in Dashboard):

| Key           | Value / Note                                      |
|---------------|---------------------------------------------------|
| `NODE_ENV`    | `production`                                      |
| `MONGODB_URI` | Your Atlas URI (e.g. `mongodb+srv://...`)         |
| `JWT_SECRET`  | Strong random string (e.g. 32+ chars)             |
| `CLIENT_URL`  | Frontend URL, e.g. `https://skill-platform-web.onrender.com` |
| `GEMINI_API_KEY` | Your Google Gemini API key (optional)         |
| `ADMIN_EMAIL` | Admin login email (optional, default `admin@example.com`) |
| `ADMIN_PASSWORD` | Admin password (optional, default `admin123`) |

After the first deploy, copy the **backend URL** (e.g. `https://skill-platform-api.onrender.com`).

---

### 2. Frontend (Web)

- **New → Web Service** → same repo.
- **Name**: e.g. `skill-platform-web`
- **Root Directory**: `client`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment**:

| Key                    | Value / Note                                                                 |
|------------------------|-------------------------------------------------------------------------------|
| `NODE_ENV`             | `production`                                                                  |
| `NEXT_PUBLIC_API_URL`  | Backend URL + `/api`, e.g. `https://skill-platform-api.onrender.com/api`     |

> **Important:** `NEXT_PUBLIC_API_URL` is used at **build time**. If you change it, trigger a **new deploy** (Redeploy in Render).

---

## Environment variables summary

### Backend (server)

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `MONGODB_URI`   | Yes      | MongoDB Atlas connection string. For Atlas, add `0.0.0.0/0` in Network Access. |
| `JWT_SECRET`    | Yes      | Secret for JWT signing. Use a long random string in production. |
| `CLIENT_URL`    | Yes (prod) | Frontend URL(s), comma-separated. Must use `https` in production. |
| `GEMINI_API_KEY`| No       | For AI scope/test generation. App runs with fallback if unset. |
| `ADMIN_EMAIL`   | No       | Default admin email. |
| `ADMIN_PASSWORD`| No       | Default admin password. Change after first login. |
| `PORT`          | No       | Set by Render. Do not override unless needed. |

### Frontend (client)

| Variable             | Required | Description |
|----------------------|----------|-------------|
| `NEXT_PUBLIC_API_URL`| Yes      | Backend base URL including `/api`. Must be set before build. |
| `PORT`               | No       | Set by Render. |

---

## URL dependency (CLIENT_URL and NEXT_PUBLIC_API_URL)

- **Backend** needs `CLIENT_URL` = your **frontend** URL (for CORS).
- **Frontend** needs `NEXT_PUBLIC_API_URL` = your **backend** URL + `/api`.

**Suggested order:**

1. Create and deploy **backend** first (you can use a placeholder `CLIENT_URL` like `https://skill-platform-web.onrender.com` before the frontend exists).
2. Create and deploy **frontend** with `NEXT_PUBLIC_API_URL` = `https://<your-backend-name>.onrender.com/api`.
3. If you used a placeholder `CLIENT_URL`, ensure it exactly matches the real frontend URL, then redeploy the backend if you change it.

---

## MongoDB Atlas (required for production)

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access**: Create a user with read/write to the `skill-platform` database.
3. **Network Access**: Add `0.0.0.0/0` so Render can connect.
4. **Connection string**: Use `mongodb+srv://user:pass@cluster....mongodb.net/skill-platform?retryWrites=true&w=majority`.  
   - URL-encode special characters in the password (e.g. `@` → `%40`).
5. Set `MONGODB_URI` in the **backend** service environment.

See `QUICK_ATLAS_SETUP.md` for more detail.

---

## Free tier notes

- **Spinning down**: Free web services spin down after ~15 minutes of no traffic. The first request after that can take 30–60 seconds.
- **Build time**: Free tier has limits; if builds fail, check Render status and logs.
- **No persistent disk**: The filesystem is ephemeral. Do not store uploads or DB files on disk; use MongoDB (and, if needed, object storage) for persistent data.

---

## Health check

- Backend: `GET /health` → `{ "status": "ok", "timestamp": "..." }`.
- Render can use **Health Check Path** = `/health` for the API service (already set in `render.yaml`).

---

## Troubleshooting

| Issue | What to check |
|-------|---------------|
| CORS errors in browser | `CLIENT_URL` on backend must exactly match the frontend URL (protocol, host, no trailing slash). |
| 401 / JWT errors | `JWT_SECRET` must be the same on every deploy; if it changes, existing tokens break. |
| `NEXT_PUBLIC_API_URL` not updating | It is embedded at build time. Change it in Environment and trigger a **new deploy**. |
| MongoDB connection failed | Atlas: Network Access `0.0.0.0/0`, correct user/password, and correct `MONGODB_URI` in the backend. |
| Build fails (server) | Ensure `rootDir` is `server` and Build = `npm install && npm run build`. |
| Build fails (client) | Ensure `rootDir` is `client` and `NEXT_PUBLIC_API_URL` is set before build. |

---

## Files changed for Render

- `render.yaml` – Blueprint for both services.
- `server/src/index.ts` – CORS from `CLIENT_URL`, bind to `0.0.0.0`, production checks for `JWT_SECRET` and `MONGODB_URI`.
- `client/package.json` – `next start -p ${PORT:-3000}` for Render’s `PORT`.
- `client/next.config.js` – `images.remotePatterns` for Render and localhost.
- `server/env.example`, `client/env.example` – copy to `.env` / `.env.local`; reference for Render env.
- `.nvmrc` – Node 20 for Render.
