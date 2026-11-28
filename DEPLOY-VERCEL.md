# Deploy Ankurit on Vercel (update from version 1)

Version 1 was a plain Node server, so on Vercel only the pages were published and the AI had
nothing to answer it. From v4.1 the project has a `vercel.json` and an `api/` folder, so Vercel
runs the AI, news, weather, location and photo services as **Vercel Functions** (Mumbai region).

## 1. Put the new files in your GitHub repo
1. Open the folder on your computer that is connected to your GitHub repo (the one with the hidden `.git` folder).
2. Delete the old app files there **except** the `.git` folder (and your `.env` if you have one).
3. Copy **everything** from the new `ankurit` folder into it — including `api/`, `vercel.json`, `server.js`, `public/`.
   The repo root must now contain `vercel.json`, `server.js`, `package.json`, `api/` and `public/`.
4. Make sure `.env` is **not** uploaded (it is listed in `.gitignore`).
5. Push:
   ```
   git add -A
   git commit -m "Ankurit v4.1 - Vercel functions, AI backups, news, weather, location"
   git push
   ```

## 2. Check the Vercel project settings (one time)
Vercel dashboard → your project → **Settings**:
- **Build and Deployment** → Framework Preset: **Other**. Leave Build Command and Output Directory empty / default (`vercel.json` sets Output Directory to `public`). Root Directory: the folder that holds `vercel.json` (usually empty = repo root).
- **Functions** → make sure **Fluid Compute is ON** (default for projects made after April 2025). It lets AI answers run up to 120 s.
- **Environment Variables** → add (tick *Production* and *Preview*):

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini key (or several: `key1,key2,key3`) |
| `GEMINI_API_KEY_2` … `_4` | optional extra Gemini keys |
| `GROQ_API_KEY` | optional free backup (recommended) |
| `MISTRAL_API_KEY` | optional free backup |
| `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` | optional |
| `AI_WEB_SEARCH` | optional, `true` |
| `DATA_GOV_API_KEY` | needed for **बाजारभाव** (free from data.gov.in → My Account → API key) |
| `AI_FAST` | optional, `groq` = chat answers from Groq first (fastest) |

**Schemes (योजना) live check** uses Gemini's *Grounding with Google Search*. If your key's project doesn't allow it, the app still works but marks the list "not checked today". **Vercel Hobby allows 12 functions — v6 uses exactly 12 files in `api/`; don't add more.**

Do **not** set `PORT` on Vercel.

## 3. Redeploy
Pushing to GitHub starts a new deployment automatically. If you changed environment variables
after the last push: **Deployments** → latest → ⋯ → **Redeploy** (variables only apply to new deployments).

## 4. Test
1. `https://YOUR-APP.vercel.app/api/ai-check` → should show `"ok": true` and which keys/backups work.
2. `https://YOUR-APP.vercel.app/api/news` → a list of news (first load can take ~10 s, then it is cached).
3. Open the app → ⋮ → *Use my current location* — GPS works on Vercel because the link is **https**.
4. Try Crop Doctor, a crop guide and the chat.

## If something is wrong
| Problem | Fix |
|---|---|
| `/api/ai-check` gives 404 | The `api/` folder or `vercel.json` was not pushed, or Root Directory points to the wrong folder. |
| "AI is not set up yet" / `ok:false, No AI key` | Environment variable name is wrong or you did not redeploy after adding it. |
| Build error about `maxDuration` | Turn on Fluid Compute (Settings → Functions), or change `120` to `60` in `vercel.json`. |
| Gemini "busy" or "free limit reached" | Add more Gemini keys and a free `GROQ_API_KEY`. |
| See what happened | Vercel → your project → **Logs** (every `[ankurit]` line from the server appears there). |
| Own crop photos | Put them in `public/img/crops/<crop-id>.jpg`, push again. |

Running on your own computer still works the same: `npm start` → http://localhost:3000
