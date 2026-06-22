# Deploy EBE (live in ~20 minutes)

EBE is one Node service that serves both the API and the web face. It reads `PORT` from the host
and the web auto-targets its own origin — so any Node host works. Recommended: **Render** (free tier).

## Prereqs
- The code on **GitHub** (merge `claude/charming-franklin-yzb1cg` → `main`, or deploy that branch).
- Your API keys (OpenAI, Anthropic, Gemini at minimum).

## Render (one click via Blueprint)
1. Push to GitHub. Go to **render.com → New → Blueprint** → pick this repo (it reads `render.yaml`).
2. Render sets build `npm install && npm run build` and start `npm run start` automatically.
3. When prompted, paste your secret env vars (or add them under the service → Environment):
   - Required: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
   - Optional: `GOOGLE_PLACES_API_KEY`, `RESEND_API_KEY`, `EBE_FROM_EMAIL`, `EBE_REPLY_TO`,
     `GOOGLE_CLIENT_ID/SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. You get a URL like `https://ebe-orb.onrender.com` — that's the live ORB + web face.

### Manual (no Blueprint)
New → Web Service → connect repo → Build `npm install && npm run build` → Start `npm run start`
→ Health check `/api/orb/health` → add env vars → Create.

## After it's live
- **Verify:** open the URL (the orb loads) and `GET /api/orb/status` (keys show `true`).
- **Google OAuth (if used):** set `GOOGLE_REDIRECT_URI=https://YOUR-URL/api/orb/oauth/google/callback`
  and add that exact URI to your Google Cloud OAuth client's Authorized redirect URIs.
- **Custom domain (ebehq.com):** Render → Settings → Custom Domains → add e.g. `app.ebehq.com`,
  then in Cloudflare add the CNAME Render gives you (DNS-only / grey cloud).
- **Mobile app:** set `EBE_URL` in `apps/mobile/App.js` to the live URL — works from anywhere, no LAN.

## Other hosts (same idea)
- **Railway:** New Project → Deploy from repo → it auto-detects `build`/`start` → add env vars.
- **Fly.io:** `fly launch` (Node) → set env with `fly secrets set KEY=...`.

## Notes
- Free tiers sleep when idle (first request after idle is slow). Upgrade to keep it always-on.
- In-memory data (journal, tasks, etc.) resets on restart unless `SUPABASE_*` is set — add Supabase
  for real persistence in production.
