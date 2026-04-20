# Frankfurter CORS proxy

GitHub Pages serves static files only. Browsers load your site from `https://enmahub.github.io` and call `https://api.frankfurter.app`; some networks or tools surface that as a CORS problem. This Worker forwards `GET /latest?...` to Frankfurter and adds `Access-Control-Allow-Origin: *` so your `currency-rates.js` can call **your** worker origin instead.

## Deploy (Cloudflare)

**Interactive machine (browser login):**

1. From the repo root: `npm install` (adds Wrangler as a dev dependency).
2. Log in once: `npx wrangler login`
3. Deploy: `npm run deploy:worker`  
   Or from this folder: `npx wrangler deploy`

Wrangler prints the worker URL, e.g. `https://practical-calculators-frankfurter-proxy.<your-subdomain>.workers.dev`

**Non-interactive (CI, Cursor agent, etc.):**

Create an API token with permission to edit Workers for your account ([Cloudflare: Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)), then:

```bash
set CLOUDFLARE_API_TOKEN=your_token_here
npm run deploy:worker
```

(PowerShell: `$env:CLOUDFLARE_API_TOKEN = "..."` then `npm run deploy:worker`.)

## Wire the site

In repo root `pages.config.json`, set (no trailing slash):

```json
"frankfurterProxyBase": "https://practical-calculators-frankfurter-proxy.your-subdomain.workers.dev"
```

Regenerate HTML:

```bash
node scripts/generate-pages.js --overwrite
node scripts/migrate-layout.js
```

Currency pages will get `data-frankfurter-proxy="..."` on the script tag; `currency-rates.js` uses it for the rate request.

## Test

```bash
curl -sS "https://YOUR_WORKERS_URL/latest?from=USD&to=EUR"
```

You should see JSON with `rates` (same shape as Frankfurter).

## Limits

- This is a thin pass-through; respect [Frankfurter](https://www.frankfurter.app/) usage and terms.
- `Access-Control-Allow-Origin: *` is appropriate for public read-only rates; tighten if you bind a custom domain and want a single allowed origin.
