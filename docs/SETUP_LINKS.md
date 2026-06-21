# EBE ORB — setup links (everywhere you need to go)

All keys go in **`apps/api/.env`** (git-ignored). After editing, restart the server
(`Ctrl+C`, then `npm run dev:api`) and verify with:

```powershell
(Invoke-RestMethod http://localhost:8080/api/orb/status) | ConvertTo-Json -Depth 5
```

## The brains (required for EBE to think/talk)
| Service | Get the key | Env var |
|---|---|---|
| OpenAI | https://platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Anthropic (Claude) | https://console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` |
| Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |

> Sign in at each site first — deep links 404 when logged out.

## Restaurants — "good spots near me" / "book me a restaurant"
Google Maps Platform (Google Cloud Console):
1. Enable **Places API (New)**: https://console.cloud.google.com/apis/library/places.googleapis.com
2. Create an **API key**: https://console.cloud.google.com/apis/credentials
3. → `GOOGLE_PLACES_API_KEY`  *(separate from the Gemini key)*

## Auto-book by email (EBE emails the restaurant for you)
- Resend API key: https://resend.com → `RESEND_API_KEY`
- Verify sender domain/address: https://resend.com/domains → `EBE_FROM_EMAIL`

## Gmail + Calendar (real inbox/calendar in the cycle)
Google Cloud Console:
1. OAuth client (Web app): https://console.cloud.google.com/apis/credentials → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
2. Enable Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
3. Enable Calendar API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
4. Redirect URI: `http://localhost:8080/api/orb/oauth/google/callback`

## Persistence (remember across restarts)
- Supabase: https://supabase.com → Project Settings → API
  - Project URL → `SUPABASE_URL`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
  - Run `sql/schema.sql` in the Supabase SQL editor.

## Optional
| Service | Link | Env var |
|---|---|---|
| News (else free Hacker News) | https://newsapi.org/register | `NEWS_API_KEY` |
| Weather | none needed (Open-Meteo) | — |
| OpenTable in-app booking (~3–4 wk approval) | https://www.opentable.com/restaurant-solutions/api-partners/become-a-partner/ | `OPENTABLE_API_TOKEN` |
| Location for weather signals | — | `DEFAULT_LAT` / `DEFAULT_LON` / `DEFAULT_CITY` |
