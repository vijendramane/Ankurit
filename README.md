# Ankurit · अंकुरित

**Your AI farming companion — in Marathi, Hindi and English.**

*Ankurit* means "sprouted" in Marathi and Hindi — the moment a seed comes alive. The app helps farmers from sowing to selling: crop guides, leaf-disease and insect detection from a photo, soil testing with a fertilizer plan, farm news (mostly from Agrowon), high-value foreign crops matched to your state, a crop budget and profit tracker, organic input recipes with a calculator, and an AI assistant you can talk to.

---

## Features

| Module | What it does | Needs AI key? |
|---|---|---|
| **Leaf Doctor** | Photo of a leaf → disease, confidence, severity, organic treatment, prevention, when to call an expert | Yes |
| **Insect ID** | Photo of an insect → pest or friendly insect, damage, organic control, natural enemies | Yes |
| **Crop Library** | 25 major Indian crops: season, duration, sowing months, soil, water, growth stages, major pests and diseases, organic care plan | No |
| **AI crop guide** | One click → a full guide for that crop, written for the farmer's own district | Yes |
| **Crop Planner** | State + district + season + water → recommended crops with reasons | Yes (static list works without) |
| **Farm News** | Latest news, mostly from **Agrowon**, plus The Hindu, Krishi Jagran and Google News in Marathi/Hindi/English. Photo, headline and summary cards, category filters (market, weather, schemes, crop advice, technology, livestock, success stories), language filter, infinite scroll, "Explain in simple words" with AI. Refreshes every 15 min | No (AI explain: Yes) |
| **Soil Test** | Type your Soil Health Card values (or **scan the card** with the camera); instant colour-coded rating for pH, EC, OC, N, P, K, S, Zn, Fe, Mn, Cu, B; what to do for each problem; AI fertilizer plan with bag quantities for your crop and area; home soil tests (jar, vinegar/soda, earthworm, drainage); saved reports | Rating: No · Scan/plan: Yes |
| **Foreign / high-value crops** | 18 exotic crops (dragon fruit, avocado, strawberry, coloured capsicum, blueberry, kiwi, saffron, oyster mushroom, Taiwan papaya, date palm…) with state-wise suitability, yield, price, income, setup cost and months to first income. They also appear in the Crop Library, Planner and My Crops | No |
| **My Crops** | Track each crop: area (acre/guntha/hectare), stage timeline, expenses by category, sales, profit, cost per acre, diary, AI review | Tracking: No · Review: Yes |
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
- **Change AI behaviour:** the shared expert persona is `EXPERT` / `sysPrompt()` in `app.js`; each feature's prompt is in `runGuide`, `runReco`, `runScan`, `runReview`, `chatRules`, `runSoilPlan`, `runSoilRead`, `runNewsAI`. Temperature and length per task are in `TASKS` in `server.js` (low temperature = more factual).
- **Add a foreign crop:** add it to `EXOTIC` in `data.js` with `x.good` / `x.ok` state lists and the money figures.
- **Change news sources:** set `NEWS_FEEDS` in `.env` (see `.env.example`), or edit `DEFAULT_FEEDS` in `server.js`.

## Where data is stored

Crop records (My Crops) and saved soil reports are saved in the **browser on that device** (localStorage). Clearing browser data removes them, and they don't sync between devices. For accounts and cloud sync, add a database (for example Supabase or Firebase with phone-OTP login) — that's the natural next step for a public launch.

## Privacy note

On Google's **free** tier, requests may be used by Google to improve its products. Tell your users this, and avoid sending personal details in prompts. For production with real farmers, consider the paid tier, which has different data handling.

## Good to know

- AI answers can be wrong. The app tells farmers to confirm with their local **Krishi Vigyan Kendra** before spraying.
- Crop durations, stages and recipe amounts are general reference values; they vary by variety, region and weather.
- There are no live mandi prices or weather — the app links to official sites (Agmarknet, eNAM, Soil Health Card) instead of showing made-up numbers.
- **Kisan Call Centre: 1800-180-1551** (shown in the app).

## Check that AI works

After `npm start`, open **http://localhost:3000/api/ai-check** in your browser. You should see `"ok": true` and the model name. If it says `ok: false`, the `problem` line tells you why (usually a missing or wrong `GEMINI_API_KEY`).

## Deploy on Vercel

See **DEPLOY-VERCEL.md** — the project includes `vercel.json` and an `api/` folder so the AI, news, weather, location and photo services run as Vercel Functions (Mumbai region). Add your keys as Environment Variables in Vercel, push to GitHub, then open `/api/ai-check`.

## What's new in v4.1

- **Several AI keys + free backups**: put 2–5 Gemini keys (`GEMINI_API_KEY=key1,key2` or `GEMINI_API_KEY_2…`). When a key's free limit is used up, the next key answers. If every Gemini key/model is busy, free backups take over in this order: **Groq → Mistral → OpenRouter → custom**. Groq and Mistral can also read crop photos. Check them all at **/api/ai-check** — it tests every key and backup separately.
- **Exact location with village name**: ⋮ → *Use my current location* uses the phone's GPS (most accurate fix within ~12 s) and finds your village/town, taluka, district and state with OpenStreetMap. Or search your village by name. Weather and AI answers then use your exact place.
  - On a phone, GPS works only on an **https** link (or `localhost`). If you open the app as `http://192.168.x.x:3000`, use the village search instead, or publish the app with https (Render, Railway, etc. give https automatically).
- **News "simple words"** now reads the **full article** (not only the headline) before explaining. The language button is now just a 🌐 icon.

## What's new in v4

- **News like Inshorts**: one story per screen — swipe up/down (arrow keys or mouse wheel on a computer). The **category bar** (सर्व, बाजार व भाव, हवामान, योजना…) with story counts is at the top; the 🌐 button picks the news language.
- **Download AI reports as PDF**: every AI result (crop guide, crop review, Crop Doctor, soil plan, home soil test, weather plan, planner, news explanation) has a **Download PDF** button. It opens a clean report page → tap “Save as PDF / Print”.
- **Smaller weather box** on the home screen (35% smaller).
- **Real crop photos** from Wikimedia Commons (field photos, drawings/maps skipped). To use your own photo, put it in `public/img/crops/<crop-id>.jpg`.

## When Google says "busy" (503)

Free Gemini models are sometimes overloaded. Ankurit now tries several free models in turn (gemini-flash-latest → gemini-2.5-flash → flash-lite …), skips a busy one for 2 minutes, and gives up on a model that does not start answering within 25 seconds (`AI_TIMEOUT_SEC`). For an extra safety net, add a free Groq key as `OPENAI_API_KEY` — it is used automatically if every Gemini model is busy (text answers only).

## What's new in v3

- **Crop Doctor**: Leaf Doctor and Insect ID merged — one photo finds disease, pest damage, nutrient deficiency or a friendly insect.
- **Weather**: current weather on the home screen (tap to expand), hourly + 7-day forecast, automatic farm advice (spraying, irrigation, heat/cold/heavy rain, fungal risk) and an AI weather plan. Data from Open-Meteo (free, no key).
- **⋮ Settings menu** (top right): location (state, district or GPS), language, weather, bigger text, helpline, useful links, clear data.
- **118 crops** with photos (from Wikipedia), including all main Maharashtra crops: leafy greens, gourds, fruits (mango, chiku, lime, grapes, orange…), flowers, fodder, betel leaf, etc. Foreign crops are now a filter inside the Crop Library.
- **Organic inputs**: Agniastra/Brahmastra renamed to *Chilli-Garlic Pest Spray* and *Five-Leaf Pest Spray*; added Panchagavya, Matka Khat, Sour Buttermilk spray, Neem Seed Kernel Extract (NSKE 5%), Fish Amino Acid and Egg-Lemon tonic.
- **AI fix**: a wrong or badly written `GEMINI_MODEL` (for example `models/gemini-2.5-flash` or with a comment) no longer breaks AI — it is cleaned up or replaced automatically.

## How the AI is tuned

- One **expert system instruction** (Indian agronomist, ICAR/SAU/KVK practices, organic first, CIB&RC-registered active ingredients only, no brand names, never invented numbers) is sent with every request, plus your location, date, season, your crops and your latest soil test.
- Answers are forced into your language, with doses **per 15-litre pump and per acre**.
- Per-task settings: chat 0.4 temperature, guides 0.35, photo diagnosis 0.15, JSON 0.2. Broken JSON is retried automatically; a busy Gemini is retried once before switching to the backup provider.
- Optional live Google Search for chat (current prices, schemes, weather): set `AI_WEB_SEARCH=true` in `.env`. Turns itself off if your model/key does not support it.

## Farm news

The server collects news every 15 minutes (`NEWS_REFRESH_MIN`) and keeps the last good copy if a source is down. Agrowon is read first through its public site API (with its RSS feed and Google News as fallbacks). Photos and summaries missing from a feed are filled from the article's page preview. The app only shows the headline, a short summary and a link — tapping "Read full news" opens the publisher's site.

## Troubleshooting

| Problem | Fix |
|---|---|
| News page empty | The server needs internet access to the news sites. Check the terminal for `news source … failed` lines. |
| "AI is not set up yet" | `.env` is missing or `GEMINI_API_KEY` is empty. Add it and **restart** the server. |
| "Too many requests" | Free-tier limit reached. Wait a minute, add the Groq backup, or lower usage. |
| "model not found" in terminal | Set `GEMINI_MODEL` in `.env` to a model listed in Google AI Studio. |
| "API key is not valid" | Re-copy the key from AI Studio; no spaces or quotes. |
| Mic button missing | Voice input needs Chrome/Edge and an `https://` site or `localhost`. |
| Read-aloud is in a Hindi voice for Marathi | Most devices have no Marathi voice; the Hindi voice reads Devanagari well. Android: Settings → Text-to-speech → install Marathi. |
| Port 3000 busy | Set `PORT=4000` in `.env`. |

---

Built with plain HTML, CSS and JavaScript + a zero-dependency Node.js server.
