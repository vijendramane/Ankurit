# Ankurit · अंकुरित

**Your AI farming companion — in Marathi, Hindi and English.**

*Ankurit* means "sprouted" in Marathi and Hindi — the moment a seed comes alive. The app helps farmers from sowing to selling: crop guides, leaf-disease and insect detection from a photo, a crop budget and profit tracker, organic input recipes with a calculator, and an AI assistant you can talk to.

---

## Features

| Module | What it does | Needs AI key? |
|---|---|---|
| **Leaf Doctor** | Photo of a leaf → disease, confidence, severity, organic treatment, prevention, when to call an expert | Yes |
| **Insect ID** | Photo of an insect → pest or friendly insect, damage, organic control, natural enemies | Yes |
| **Crop Library** | 25 major Indian crops: season, duration, sowing months, soil, water, growth stages, major pests and diseases, organic care plan | No |
| **AI crop guide** | One click → a full guide for that crop, written for the farmer's own district | Yes |
| **Crop Planner** | State + district + season + water → recommended crops with reasons | Yes (static list works without) |
| **My Farm** | Track each crop: area (acre/guntha/hectare), stage timeline, expenses by category, sales, profit, cost per acre, diary, AI review | Tracking: No · Review: Yes |
| **Task calendar** | Upcoming Jeevamrut dates, stage changes, field checks, harvest window | No |
| **Organic Inputs** | Jeevamrut, Ghanjeevamrut, Beejamrut, Neemastra, Agniastra, Brahmastra, Dashparni — scaled to your area | No |
| **AI Assistant** | Chat in your language, voice input, read-aloud answers | Yes |

All screens switch instantly between **मराठी / हिंदी / English**.

---

## Quick start (5 minutes)

### 1. Install Node.js
Download and install **Node.js 18 or newer** from <https://nodejs.org> (choose the "LTS" version).
Check it worked — open a terminal (Command Prompt / PowerShell on Windows) and run:

```bash
node --version
```

You should see `v18` or higher. No other packages are needed — the project has **zero dependencies**.

### 2. Get your free Gemini API key
1. Go to **<https://aistudio.google.com/app/apikey>** and sign in with a Google account.
2. Click **Create API key** and copy it.

The Gemini API has a free tier — no credit card needed. It is rate-limited (a limited number of requests per minute and per day).

### 3. Add the key
In the project folder, copy `.env.example` to a new file named `.env`:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

Open `.env` in any text editor and paste your key:

```
GEMINI_API_KEY=paste-your-key-here
```

### 4. Run it

```bash
npm start
# or
node server.js
```

Open **<http://localhost:3000>** in Chrome. Done!

The terminal shows which AI model was picked automatically (the newest free Gemini "Flash" model available to your key).

---

## Optional: free backup AI (Groq)

When Gemini's free limit is reached, Ankurit can automatically use a second provider for text answers (chat, guides, planner).

1. Get a free key at **<https://console.groq.com/keys>**
2. Add it to `.env`:

```
OPENAI_API_KEY=your-groq-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

Any **OpenAI-compatible** API works (OpenRouter, OpenAI, a local Ollama server, etc.) — just change the base URL and model. Photo scanning stays on Gemini unless you set `OPENAI_VISION=true` with a model that can read images.

---

## Use it on your phone

**Same Wi-Fi (for testing):** find your computer's local IP (e.g. `192.168.1.5`) and open `http://192.168.1.5:3000` on your phone.
Note: browsers only allow the **microphone** on `https://` sites or `localhost`, so voice input works after you deploy (below).

**Install like an app:** once deployed with https, open the site in Chrome on Android → menu → **Add to Home screen**.

---

## Deploy online (free options)

The app is a single Node.js server, so it runs on almost any host. Ready-made files are included:
`render.yaml` (Render one-click Blueprint), `Dockerfile`, and `deploy/nginx-ankurit.conf` (VPS + HTTPS).
See the full hosting guide for step-by-step instructions.

**Render.com (free web service)**
1. Push this folder to a GitHub repository (the `.gitignore` already keeps `.env` out).
2. On Render: **New → Web Service →** pick the repo.
3. Build command: *(leave empty)* · Start command: `node server.js`
4. Add environment variable `GEMINI_API_KEY` (and the optional ones).
5. Deploy — you get an `https://…onrender.com` address.

**Railway, Fly.io, any VPS:** same idea — run `node server.js` and set the environment variables. The server reads `PORT` automatically.

> ⚠️ Never put your API key inside the `public/` files or commit `.env`. The key lives only on the server; the browser never sees it.

---

## Project structure

```
ankurit/
├── server.js            ← web server + secure AI proxy (Gemini / OpenAI-compatible)
├── package.json
├── .env.example         ← copy to .env and add your key
├── render.yaml          ← Render Blueprint (one-click deploy)
├── Dockerfile           ← container image
├── deploy/nginx-ankurit.conf ← Nginx + HTTPS config for a VPS
└── public/              ← everything the browser loads
    ├── index.html
    ├── icon.svg, manifest.webmanifest
    ├── css/style.css    ← all styling
    └── js/
        ├── adapters.js  ← AI calls, read-aloud, voice input (browser side)
        ├── data.js      ← crops, pests, diseases, organic recipes, states, districts
        ├── i18n.js      ← every on-screen text in English / Hindi / Marathi
        └── app.js       ← screens and logic
```

## Customising

- **Add a crop:** add an entry to `CROPS` in `public/js/data.js` (copy an existing one). Pest and disease keys must exist in `PESTS` / `DISEASES`.
- **Add districts for another state:** add the state to `DISTRICTS` in `data.js` — the app then shows a dropdown instead of a text box.
- **Change any text / translation:** edit `public/js/i18n.js` (same key in `en`, `hi`, `mr`).
- **Change colours / fonts:** CSS variables at the top of `public/css/style.css`.
- **Change AI behaviour:** prompts are in `app.js` (`runGuide`, `runReco`, `runScan`, `runReview`, `chatRules`).

## Where data is stored

Crop records (My Farm) are saved in the **browser on that device** (localStorage). Clearing browser data removes them, and they don't sync between devices. For accounts and cloud sync, add a database (for example Supabase or Firebase with phone-OTP login) — that's the natural next step for a public launch.

## Privacy note

On Google's **free** tier, requests may be used by Google to improve its products. Tell your users this, and avoid sending personal details in prompts. For production with real farmers, consider the paid tier, which has different data handling.

## Good to know

- AI answers can be wrong. The app tells farmers to confirm with their local **Krishi Vigyan Kendra** before spraying.
- Crop durations, stages and recipe amounts are general reference values; they vary by variety, region and weather.
- There are no live mandi prices or weather — the app links to official sites (Agmarknet, eNAM, Soil Health Card) instead of showing made-up numbers.
- **Kisan Call Centre: 1800-180-1551** (shown in the app).

## Troubleshooting

| Problem | Fix |
|---|---|
| "AI is not set up yet" | `.env` is missing or `GEMINI_API_KEY` is empty. Add it and **restart** the server. |
| "Too many requests" | Free-tier limit reached. Wait a minute, add the Groq backup, or lower usage. |
| "model not found" in terminal | Set `GEMINI_MODEL` in `.env` to a model listed in Google AI Studio. |
| "API key is not valid" | Re-copy the key from AI Studio; no spaces or quotes. |
| Mic button missing | Voice input needs Chrome/Edge and an `https://` site or `localhost`. |
| Read-aloud is in a Hindi voice for Marathi | Most devices have no Marathi voice; the Hindi voice reads Devanagari well. Android: Settings → Text-to-speech → install Marathi. |
| Port 3000 busy | Set `PORT=4000` in `.env`. |

---

Built with plain HTML, CSS and JavaScript + a zero-dependency Node.js server.
