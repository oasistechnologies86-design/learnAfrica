# Learn Africa: CORS and deployment settings

Last updated: 2026-10-30

## What was fixed

The backend no longer hardcodes a Vercel domain in Python. It builds the CORS allowlist from environment variables:

- `ALLOWED_ORIGINS`: comma-separated list of exact frontend origins. This is the recommended production setting.
- `FRONTEND_URL`: optional single primary frontend origin; it is added to the allowlist if supplied.
- If neither is configured, only the local development origins are allowed. This is intentionally fail-closed; it does not open the API to every website.

The frontend already reads `VITE_API_URL` from its Vercel environment variables. Keep the frontend API URL and backend CORS origin settings separate: one tells the frontend where the API is, and the other tells the API which browser origins it may accept.

## Current Learn Africa production values

Use these values for the current deployment. If the Vercel domain changes, update the Render origin setting to match the new domain exactly.

### 1. Render — backend

Open the Render dashboard, select the `learnafrica-backend` web service, then open **Environment**.

Set:

```env
ALLOWED_ORIGINS=https://learn-africa-five.vercel.app
```

Save the change and let Render redeploy/restart the service.

If you later need to allow a second frontend origin, separate origins with commas and do not add paths:

```env
ALLOWED_ORIGINS=https://learn-africa-five.vercel.app,https://your-preview-domain.vercel.app
```

Alternatively, `FRONTEND_URL` can hold one primary origin. It is not necessary if `ALLOWED_ORIGINS` is already set.

### 2. Vercel — frontend

Open the Vercel project for Learn Africa, then **Settings → Environment Variables**.

Set:

```env
VITE_API_URL=https://learnafrica-backend-fdhb.onrender.com
```

Apply it to **Production**. Add Preview/Development only if those environments should call this backend. Redeploy Vercel after changing the variable because Vite embeds `VITE_*` values into the frontend build.

## Important safety rules

- Use the exact origin, including `https://`; do not add a route such as `/api` or a trailing slash.
- Do **not** set `ALLOWED_ORIGINS=*`. The backend supports credentialed requests, so the allowlist should remain specific.
- Multiple origins belong in one comma-separated `ALLOWED_ORIGINS` value.
- Keep database passwords, Supabase service-role keys, JWT secrets, and payment secrets out of Vercel frontend variables and out of GitHub. Backend secrets belong in Render's environment settings.
- If the Vercel project is renamed or a custom domain becomes the main site, update `ALLOWED_ORIGINS` on Render. No Python code change should be needed.

## How to verify after deployment

1. Wait until the latest Render deploy is **Live**.
2. Open the Learn Africa site and test course loading and login.
3. In browser Developer Tools → **Network**, select the failing request (for example `/api/courses` or `/api/auth/login`). The preflight/response should include an `Access-Control-Allow-Origin` header matching the frontend origin.
4. If CORS still fails, check that Render's `ALLOWED_ORIGINS` has no typo, path, or trailing slash, and confirm the Render service redeployed after saving.
5. Confirm Vercel's `VITE_API_URL` points to the current Render backend. If either service URL changes, update the matching environment variable.

This change configures the application; it does not change environment variables inside your Render or Vercel accounts. Those dashboard settings must still be checked/updated manually.
