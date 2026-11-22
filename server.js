/*
 * Ankurit server — serves the web app, forwards AI requests to Gemini (or any
 * OpenAI-compatible API such as Groq) so your API key stays on the server, and
 * collects farm news (Agrowon first) into one feed.
 * Requires Node.js 18 or newer. No npm packages needed.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

/* ---------- config (.env) ---------- */
function loadEnv(file){
  try{
    fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(function(line){
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if(!m || line.trim().startsWith('#')) return;
      let v = m[2].trim();
      if(/^["']/.test(v)) v = v.replace(/^(["'])(.*)\1.*$/, '$2');   /* "quoted value" */
      else v = v.replace(/\s+#.*$/, '').trim();                     /* value   # comment */
      if(process.env[m[1]] === undefined) process.env[m[1]] = v;
    });
  }catch(e){ /* no .env file: fine */ }
}
loadEnv(path.join(__dirname, '.env'));

const PORT = parseInt(process.env.PORT || '3000', 10);
/* One or more Gemini keys: GEMINI_API_KEY=key1,key2   and/or GEMINI_API_KEY_2 … GEMINI_API_KEY_5 */
function splitKeys(v){ return String(v || '').split(/[,\s]+/).map(function(k){ return k.trim().replace(/^["']|["']$/g, ''); }).filter(function(k){ return k.length > 10; }); }
const GEMINI_KEYS = Array.from(new Set(splitKeys(process.env.GEMINI_API_KEY).concat(splitKeys(process.env.GEMINI_API_KEY_2), splitKeys(process.env.GEMINI_API_KEY_3), splitKeys(process.env.GEMINI_API_KEY_4), splitKeys(process.env.GEMINI_API_KEY_5))));
const GEMINI_KEY = GEMINI_KEYS[0] || '';
const GEMINI_BASE = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const OPENAI_MODEL = (process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile').trim();
const OPENAI_VISION = /^(1|true|yes)$/i.test(process.env.OPENAI_VISION || '');
/* Free backup AI services (used when every Gemini key/model is busy or out of quota). Several keys per service allowed: KEY1,KEY2 */
const BACKUPS = [];
function addBackup(name, keys, base, model, vision){
  splitKeys(keys).forEach(function(k, i){ if(model) BACKUPS.push({name: name + (i ? ' #' + (i + 1) : ''), key: k, base: String(base).replace(/\/$/, ''), model: model.trim(), vision: (vision || '').trim()}); });
}
addBackup('Groq', process.env.GROQ_API_KEY, process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1', process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct');
addBackup('Mistral', process.env.MISTRAL_API_KEY, process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1', process.env.MISTRAL_MODEL || 'mistral-small-latest', process.env.MISTRAL_VISION_MODEL || 'mistral-small-latest');
addBackup('OpenRouter', process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1', process.env.OPENROUTER_MODEL || '', process.env.OPENROUTER_VISION_MODEL || '');
addBackup('Custom', process.env.OPENAI_API_KEY, OPENAI_BASE, (process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile'), /^(1|true|yes)$/i.test(process.env.OPENAI_VISION || '') ? (process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile') : '');
const ANY_AI = GEMINI_KEYS.length > 0 || BACKUPS.length > 0;
let WEB_SEARCH = /^(1|true|yes)$/i.test(process.env.AI_WEB_SEARCH || '');
const RATE_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || '30', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
/* On Vercel each request runs in a short-lived function: no background work after
   the reply, read-only disk (except /tmp) and a shared CDN cache in front. */
const ON_VERCEL = !!process.env.VERCEL;

/* ---------- helpers ---------- */
function sendJSON(res, code, obj, cache){ res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store'}); res.end(JSON.stringify(obj)); }
function readBody(req, limit){
  if(req.body !== undefined && req.body !== null && typeof req.body !== 'function'){
    const b = typeof req.body === 'string' ? req.body : (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body));
    return b.length > limit ? Promise.reject(Object.assign(new Error('Request too large'), {status: 413})) : Promise.resolve(b);
  }
  return new Promise(function(resolve, reject){
    let size = 0; const chunks = [];
    req.on('data', function(c){ size += c.length; if(size > limit){ reject(Object.assign(new Error('Request too large'), {status: 413})); req.destroy(); } else chunks.push(c); });
    req.on('end', function(){ resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}
const hits = new Map();
function rateOk(ip, bucket, perMin){
  const key = bucket + '|' + ip, now = Date.now(), list = (hits.get(key) || []).filter(function(t){ return now - t < 60000; });
  if(list.length >= perMin){ hits.set(key, list); return false; }
  list.push(now); hits.set(key, list); return true;
}
setInterval(function(){ const now = Date.now(); hits.forEach(function(v, k){ if(!v.some(function(t){ return now - t < 60000; })) hits.delete(k); }); }, 120000).unref();
function clientIp(req){ return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
const sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

/* Merge consecutive turns with the same role (Gemini expects alternating roles). */
function normalise(messages){
  const out = [];
  (Array.isArray(messages) ? messages : []).forEach(function(m){
    const role = m && m.role === 'assistant' ? 'assistant' : 'user';
    const content = String((m && m.content) || '').slice(0, 60000);
    if(!content) return;
    if(out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + content;
    else out.push({role: role, content: content});
  });
  while(out.length && out[0].role !== 'user') out.shift();
  return out;
}

/* ---------- AI tuning per kind of request ----------
   Low temperature = factual and consistent (diagnosis, JSON, numbers).
   Slightly higher for conversation so answers sound natural. */
const TASKS = {
  chat:   {temperature: 0.4,  topP: 0.9,  maxOutputTokens: 4096},
  guide:  {temperature: 0.35, topP: 0.9,  maxOutputTokens: 8192},
  json:   {temperature: 0.2,  topP: 0.85, maxOutputTokens: 8192},
  vision: {temperature: 0.15, topP: 0.8,  maxOutputTokens: 8192},
  short:  {temperature: 0.3,  topP: 0.9,  maxOutputTokens: 2048}
};
function taskOf(body){ return TASKS[body.task] ? body.task : (body.images && body.images.length ? 'vision' : (body.json ? 'json' : 'chat')); }

/* ---------- Gemini ----------
   Several free Flash models are tried in order. If one is overloaded (503),
   rate-limited (429), wrong (400/404) or too slow, the next one answers.
   A model that was busy is rested for 2 minutes. */
/* Accept "gemini-2.5-flash", "models/gemini-2.5-flash", " gemini-2.5-flash  # note" … */
function cleanModel(v){
  v = String(v || '').trim().replace(/^["']|["']$/g, '').replace(/^models\//i, '').split(/\s/)[0];
  return /^[a-z0-9][a-z0-9.\-]*$/i.test(v) ? v : '';
}
const ENV_MODEL = cleanModel(process.env.GEMINI_MODEL);
if((process.env.GEMINI_MODEL || '').trim() && !ENV_MODEL) console.warn('[ankurit] GEMINI_MODEL in .env is not a valid model name ("' + process.env.GEMINI_MODEL + '") — ignoring it and choosing a model automatically.');
const PREFERRED = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const FIRST_BYTE_MS = parseInt(process.env.AI_TIMEOUT_SEC || '25', 10) * 1000;   /* give up on a model that has not started answering */
const IDLE_MS = 30000;                                                            /* …or that stops in the middle */
let geminiModels = null, geminiModel = ENV_MODEL || PREFERRED[0];
const resting = new Map();          /* model → time until which we skip it */
const badModels = new Set();        /* names that do not exist for this key */
async function listGeminiModels(){
  if(geminiModels) return geminiModels;
  let names = [];
  try{
    const r = await fetch(GEMINI_BASE + '/v1beta/models?pageSize=1000', {headers: {'x-goog-api-key': GEMINI_KEY}, signal: AbortSignal.timeout(10000)});
    const j = await r.json();
    names = (j.models || []).filter(function(m){ return (m.supportedGenerationMethods || []).indexOf('generateContent') > -1; }).map(function(m){ return String(m.name).replace(/^models\//, ''); });
  }catch(e){ console.warn('[ankurit] Could not list Gemini models:', e.message); }
  let list = PREFERRED.filter(function(n){ return !names.length || names.indexOf(n) > -1; });
  if(names.length && list.length < 2){   /* unusual key: add any other plain Flash models */
    names.filter(function(n){ return /flash/.test(n) && !/(live|image|tts|audio|transcribe|translate|embedding|exp|preview)/.test(n) && list.indexOf(n) < 0; }).forEach(function(n){ list.push(n); });
  }
  if(ENV_MODEL) list = [ENV_MODEL].concat(list.filter(function(n){ return n !== ENV_MODEL; }));
  if(!list.length) list = PREFERRED.slice();
  if(names.length) geminiModels = list;   /* keep trying to list next time if listing failed */
  return list;
}
async function pickGeminiModel(){ const l = await listGeminiModels(); return l[0]; }
function thinkingFor(model, task){
  /* Gemini 2.5 models "think" before answering. Limit it so answers start quickly. */
  if(!/(2\.5-flash(?!-lite)|^gemini-flash-latest$|gemini-3[\w.-]*flash(?!-lite))/.test(model)) return null;
  return {thinkingBudget: {short: 0, chat: 1024, json: 1024, vision: 2048, guide: 2048}[task] || 1024};
}
const badKeys = new Set(), keyRest = new Map();   /* key|model → time */
function keyTag(k){ return 'key #' + (GEMINI_KEYS.indexOf(k) + 1); }
async function streamGemini(model, body, onDelta, useTools, noThinking, key){
  key = key || GEMINI_KEY;
  const msgs = normalise(body.messages);
  const contents = msgs.map(function(m){ return {role: m.role === 'assistant' ? 'model' : 'user', parts: [{text: m.content}]}; });
  if(body.images && body.images.length && contents.length){
    const last = contents[contents.length - 1];
    body.images.slice(0, 3).forEach(function(im){ last.parts.push({inline_data: {mime_type: String(im.mime || 'image/jpeg'), data: String(im.data || '')}}); });
  }
  const task = taskOf(body), cfg = Object.assign({}, TASKS[task]);
  if(body.json) cfg.responseMimeType = 'application/json';
  const th = noThinking ? null : thinkingFor(model, task);
  if(th) cfg.thinkingConfig = th;
  const payload = {contents: contents, generationConfig: cfg};
  if(body.system) payload.systemInstruction = {parts: [{text: String(body.system).slice(0, 20000)}]};
  if(useTools) payload.tools = [{google_search: {}}];

  const ac = new AbortController(); let timer = null, timedOut = false;
  const arm = function(ms){ clearTimeout(timer); timer = setTimeout(function(){ timedOut = true; ac.abort(); }, ms); };
  arm(FIRST_BYTE_MS + (body.images && body.images.length ? 15000 : 0));
  try{
    const r = await fetch(GEMINI_BASE + '/v1beta/models/' + model + ':streamGenerateContent?alt=sse', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(payload), signal: ac.signal
    });
    if(!r.ok){
      const t = await r.text().catch(function(){ return ''; });
      const err = upstreamError('gemini', r.status, t, model + (GEMINI_KEYS.length > 1 ? ', ' + keyTag(key) : ''));
      if(r.status === 404 || (r.status === 400 && /model/i.test(t) && !/API key|thinking/i.test(t))) err.badModel = true;
      if(r.status === 400 && /thinking/i.test(t)) err.noThinking = true;
      throw err;
    }
    let got = false;
    await readSSE(r.body, function(data){
      const j = JSON.parse(data);
      if(j.error) throw upstreamError('gemini', j.error.code || 500, JSON.stringify(j.error), model);
      const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
      parts.forEach(function(p){ if(p.text && !p.thought){ if(!got){ got = true; } onDelta(p.text); } });
      arm(IDLE_MS);
    });
  }catch(e){
    if(timedOut){ const err = Object.assign(new Error('gemini model ' + model + ' was too slow'), {code: 'busy', status: 504, timeout: true}); console.warn('[ankurit]', err.message); throw err; }
    throw e;
  }finally{ clearTimeout(timer); }
}
async function geminiProvider(body, onDelta, state){
  const tools = WEB_SEARCH && taskOf(body) === 'chat' && !body.json;
  const all = (await listGeminiModels()).filter(function(m){ return !badModels.has(m); });
  const now = Date.now();
  const order = all.filter(function(m){ return !(resting.get(m) > now); }).concat(all.filter(function(m){ return resting.get(m) > now; }));
  let lastErr = null;
  state.t0 = state.t0 || Date.now();
  for(const model of order){
    const keys = GEMINI_KEYS.filter(function(k){ return !badKeys.has(k); });
    const fresh = keys.filter(function(k){ return !(keyRest.get(k + '|' + model) > Date.now()); });
    for(const key of (fresh.length ? fresh : keys)){
      if(state.closed) return;
      if(Date.now() - state.t0 > 75000) throw lastErr || new Error('AI took too long');
      try{
        await streamGemini(model, body, onDelta, tools, state.noThinking, key);
        if(geminiModel !== model){ geminiModel = model; console.log('[ankurit] Answered by Gemini model:', model); }
        state.model = model + (GEMINI_KEYS.length > 1 ? ' (' + keyTag(key) + ')' : '');
        return;
      }catch(e){
        lastErr = e;
        if(state.sent > 0) throw e;                                  /* never mix two half answers */
        if(e.noThinking && !state.noThinking){ state.noThinking = true; try{ await streamGemini(model, body, onDelta, tools, true, key); state.model = model; return; }catch(e2){ lastErr = e = e2; } }
        if(tools && e.status === 400 && !e.badModel && !/API key/i.test(e.raw || '')){ console.warn('[ankurit] Web search not available for this model/key — turning it off.'); WEB_SEARCH = false; return geminiProvider(body, onDelta, state); }
        if(e.code === 'not_granted'){ badKeys.add(key); console.warn('[ankurit] Gemini ' + keyTag(key) + ' is not valid — skipping it.'); continue; }
        if(e.code === 'rate_limited'){ keyRest.set(key + '|' + model, Date.now() + (/per ?day|PerDay|daily/i.test(e.raw || '') ? 3 * 3600000 : 60000)); continue; }   /* quota of this key → next key */
        if(e.badModel){ badModels.add(model); break; }
        if(e.code === 'busy'){ resting.set(model, Date.now() + 120000); break; }                  /* model overloaded → next model */
        throw e;
      }
    }
  }
  if(!GEMINI_KEYS.some(function(k){ return !badKeys.has(k); })) throw Object.assign(new Error('All Gemini API keys are invalid'), {code: 'not_granted'});
  throw lastErr || new Error('No Gemini model available');
}

/* ---------- OpenAI-compatible (Groq, OpenRouter, OpenAI…) ---------- */
async function openaiProvider(body, onDelta, state, bk){
  const hasImg = body.images && body.images.length;
  const model = hasImg ? bk.vision : bk.model;
  const msgs = normalise(body.messages).map(function(m){ return {role: m.role, content: m.content}; });
  if(hasImg && msgs.length){
    const last = msgs[msgs.length - 1];
    last.content = [{type: 'text', text: last.content}].concat(body.images.slice(0, 3).map(function(im){ return {type: 'image_url', image_url: {url: 'data:' + (im.mime || 'image/jpeg') + ';base64,' + im.data}}; }));
  }
  if(body.system) msgs.unshift({role: 'system', content: String(body.system).slice(0, 20000)});
  const cfg = TASKS[taskOf(body)];
  const payload = {model: model, messages: msgs, temperature: cfg.temperature, top_p: cfg.topP, max_tokens: Math.min(cfg.maxOutputTokens, 8000), stream: true};
  if(body.json) payload.response_format = {type: 'json_object'};
  const ac = new AbortController(); let timer = null, timedOut = false;
  const arm = function(ms){ clearTimeout(timer); timer = setTimeout(function(){ timedOut = true; ac.abort(); }, ms); };
  arm(FIRST_BYTE_MS + (hasImg ? 15000 : 0));
  try{
    const r = await fetch(bk.base + '/chat/completions', {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bk.key, 'HTTP-Referer': 'https://ankurit.app', 'X-Title': 'Ankurit'}, body: JSON.stringify(payload), signal: ac.signal});
    if(!r.ok){ const t = await r.text().catch(function(){ return ''; }); throw upstreamError(bk.name, r.status, t, model); }
    await readSSE(r.body, function(data){
      if(data === '[DONE]') return;
      const j = JSON.parse(data);
      if(j.error) throw upstreamError(bk.name, j.error.code || 500, JSON.stringify(j.error), model);
      const d = (((j.choices || [])[0] || {}).delta || {}).content;
      if(d) onDelta(typeof d === 'string' ? d : (Array.isArray(d) ? d.map(function(x){ return x.text || ''; }).join('') : ''));
      arm(IDLE_MS);
    });
    if(state) state.model = bk.name + ' (' + model + ')';
  }catch(e){
    if(timedOut) throw Object.assign(new Error(bk.name + ' was too slow'), {code: 'busy'});
    throw e;
  }finally{ clearTimeout(timer); }
}

async function readSSE(stream, onData){
  const reader = stream.getReader(), dec = new TextDecoder(); let buf = '';
  for(;;){
    const r = await reader.read(); if(r.done) break;
    buf += dec.decode(r.value, {stream: true}).replace(/\r\n/g, '\n');
    let i;
    while((i = buf.indexOf('\n\n')) > -1){
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = ev.split('\n').filter(function(l){ return l.indexOf('data:') === 0; }).map(function(l){ return l.slice(5).trim(); }).join('');
      if(data) onData(data);
    }
  }
}
function upstreamError(provider, status, text, model){
  if(model) provider = provider + ' (' + model + ')';
  let code = 'upstream_error', msg = provider + ' error ' + status;
  if(status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(text)) { code = 'rate_limited'; msg = provider + ': free limit reached.'; }
  else if((status === 400 || status === 403) && /API key|API_KEY|api_key|PERMISSION_DENIED/i.test(text)) { code = 'not_granted'; msg = 'The ' + provider + ' API key is not valid.'; }
  else if(status === 401 || status === 403) { code = 'not_granted'; msg = 'The ' + provider + ' API key was rejected.'; }
  else if(status === 404) { msg = provider + ': model not found.'; }
  else if(status === 503 || status === 500) { code = 'busy'; msg = provider + ' is busy right now.'; }
  console.warn('[ankurit]', msg, String(text).replace(/\s+/g, ' ').slice(0, 160));
  return Object.assign(new Error(msg), {code: code, status: status, raw: String(text).slice(0, 600)});
}

/* ---------- /api/ai ---------- */
async function handleAI(req, res){
  if(!rateOk(clientIp(req), 'ai', RATE_PER_MIN)) return sendJSON(res, 429, {code: 'rate_limited', message: 'Too many requests'});
  if(!ANY_AI) return sendJSON(res, 503, {code: 'not_granted', message: 'No API key configured'});
  let body;
  try{ body = JSON.parse(await readBody(req, 12 * 1024 * 1024)); }catch(e){ return sendJSON(res, e.status || 400, {code: 'invalid_request', message: e.message}); }
  if(!body || !Array.isArray(body.messages) || !body.messages.length) return sendJSON(res, 400, {code: 'invalid_request', message: 'messages required'});
  const hasImages = Array.isArray(body.images) && body.images.length > 0;

  res.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'});
  const state = {sent: 0, closed: false};
  res.on('close', function(){ state.closed = true; });
  const onDelta = function(t){ if(state.closed) return; state.sent += t.length; res.write('data: ' + JSON.stringify({delta: t}) + '\n\n'); };

  const order = [];
  if(GEMINI_KEYS.length) order.push(geminiProvider);
  BACKUPS.forEach(function(bk){ if(!hasImages || bk.vision) order.push(function(b, d, st){ return openaiProvider(b, d, st, bk); }); });
  let lastErr = null;
  outer:
  for(const fn of order){
    for(let attempt = 0; attempt < 2; attempt++){
      try{ await fn(body, onDelta, state); lastErr = null; break outer; }
      catch(e){
        lastErr = e;
        if(state.sent > 0 || state.closed) break outer;           /* never mix two half answers */
        if(e.code === 'busy' && attempt === 0 && order.length === 1){ await sleep(2500); continue; } /* only Gemini configured: wait and try once more */
        break;                                                     /* try the next provider */
      }
    }
  }
  if(lastErr && !state.closed) res.write('data: ' + JSON.stringify({error: {code: lastErr.code || 'upstream_error', message: lastErr.message}}) + '\n\n');
  if(!state.closed) res.end();
}

/* =====================================================================
   FARM NEWS — Agrowon first, plus other trusted farm news sources.
   Sources can be changed with NEWS_FEEDS in .env (JSON array).
   ===================================================================== */
const NEWS_TTL = Math.max(5, parseInt(process.env.NEWS_REFRESH_MIN || '15', 10)) * 60000;
const UA = 'Mozilla/5.0 (compatible; AnkuritNews/2.0; +https://github.com/)';
function gnews(q, lang){
  const m = {mr: ['mr', 'IN:mr'], hi: ['hi', 'IN:hi'], en: ['en-IN', 'IN:en']}[lang] || ['en-IN', 'IN:en'];
  return 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:7d') + '&hl=' + m[0] + '&gl=IN&ceid=' + m[1];
}
const DEFAULT_FEEDS = [
  {id: 'agrowon', name: 'Agrowon', lang: 'mr', type: 'quintype', base: 'https://agrowon.esakal.com', max: 80},
  {id: 'agrowon-gn', name: 'Agrowon', lang: 'mr', type: 'rss', url: gnews('site:agrowon.esakal.com', 'mr'), onlyIfEmpty: 'agrowon', max: 60},
  {id: 'thehindu', name: 'The Hindu', lang: 'en', type: 'rss', url: 'https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss', max: 15},
  {id: 'kj-hi', name: 'Krishi Jagran', lang: 'hi', type: 'rss', url: gnews('site:hindi.krishijagran.com', 'hi'), max: 15},
  {id: 'kj-en', name: 'Krishi Jagran', lang: 'en', type: 'rss', url: gnews('site:krishijagran.com', 'en'), max: 12},
  {id: 'gn-mr', name: 'Marathi news', lang: 'mr', type: 'rss', url: gnews('शेतकरी OR शेती OR पीक OR बाजारभाव', 'mr'), max: 20},
  {id: 'gn-hi', name: 'Hindi news', lang: 'hi', type: 'rss', url: gnews('किसान OR खेती OR फसल OR मंडी', 'hi'), max: 15},
  {id: 'gn-en', name: 'India news', lang: 'en', type: 'rss', url: gnews('farmers OR agriculture OR crop India', 'en'), max: 12}
];
let FEEDS = DEFAULT_FEEDS;
if(process.env.NEWS_FEEDS){ try{ const f = JSON.parse(process.env.NEWS_FEEDS); if(Array.isArray(f) && f.length) FEEDS = f; }catch(e){ console.warn('[ankurit] NEWS_FEEDS is not valid JSON — using defaults.'); } }

/* category detection — section names first, then keywords in Marathi, Hindi and English */
const SECTION_CAT = {'market-intelligence': 'market', 'marketintelligence': 'market', 'agriculture-price': 'market', 'bajarbhav': 'market', 'weather-news': 'weather', 'weather': 'weather', 'hawaman': 'weather', 'animal-care': 'livestock', 'pashudhan': 'livestock', 'dairy': 'livestock', 'techno-wan': 'tech', 'technowan': 'tech', 'technology': 'tech', 'yashogatha': 'success', 'success-story': 'success', 'yojana': 'schemes', 'schemes': 'schemes', 'government-schemes': 'schemes'};
const CAT_WORDS = [
  ['weather', /हवामान|पाऊस|पावसा|मान्सून|मॉन्सून|गारपीट|अवकाळी|थंडीची|थंडी |उष्णतेची|चक्रीवादळ|मौसम|बारिश|वर्षा |ओलावृष्टि|आंधी|ठंड |शीतलहर|लू का|\b(weather|rain|rainfall|monsoon|cyclone|heatwave|heat wave|cold wave|imd|hailstorm|drought)\b/i],
  ['market', /बाजारभाव|भावात|भाववाढ|भावाने|बाजार समिती|बाजारात|दरात|दर |आवक|मंडी|हमीभाव|निर्यात|आयात|खरेदी केंद्र|कीमत|दाम|भाव में|\b(msp|mandi|prices?|exports?|imports?|procurement|market)\b/i],
  ['schemes', /योजना|अनुदान|सरकार|शासन|मंत्री|कर्जमाफी|कर्ज|पीकविमा|पीक विमा|भरपाई|पीएम किसान|पीएम-किसान|नमो शेतकरी|सब्सिडी|सरकारी|बीमा|किस्त|मुआवजा|\b(scheme|subsidy|yojana|insurance|pm-kisan|pm kisan|loan|compensation|minister|government|budget|policy)\b/i],
  ['livestock', /पशु|जनावर|दूध|दुग्ध|गाई|गायी|म्हैस|शेळी|कोंबडी|कुक्कुट|पोल्ट्री|मत्स्य|डेअरी|डेयरी|लम्पी|पशुपालन|भैंस|बकरी|मछली|\b(dairy|milk|cattle|goats?|poultry|fisheries|fish farming|livestock|veterinary)\b/i],
  ['tech', /तंत्रज्ञान|ड्रोन|यंत्रसामग्री|कृषी यंत्र|यांत्रिकीकरण|ट्रॅक्टर|ॲप|डिजिटल|सौर पंप|सौरऊर्जा|तकनीक|मशीन|ट्रैक्टर|\b(drones?|technology|tractors?|machinery|digital|app|artificial intelligence|ai|solar|startups?|agritech)\b/i],
  ['success', /यशोगाथा|यशस्वी|प्रयोगशील|लाखांचे उत्पन्न|लाखों की कमाई|सफलता|सफल किसान|\b(success story|inspiring|earns)\b/i],
  ['advisory', /कीड|अळी|नियंत्रण|रोग|की खेती|शेती कशी|फवारणी|खते|खताचे|खत व्यवस्थापन|लागवड|व्यवस्थापन|बियाणे|सिंचन|पेरणी|काढणी|कीट|छिड़काव|खाद|बुवाई|बीज|सिंचाई|किस्म|\b(pests?|diseases?|fertili[sz]ers?|sowing|seeds?|variet(y|ies)|irrigation|harvest|advisory|organic)\b/i]
];
function classify(title, summary, sections){
  for(const s of sections || []){ const k = SECTION_CAT[String(s).toLowerCase()]; if(k) return k; }
  const txt = title + ' ' + summary;
  for(const c of CAT_WORDS) if(c[1].test(title)) return c[0];
  for(const c of CAT_WORDS) if(c[1].test(txt)) return c[0];
  return 'other';
}

/* tiny XML/HTML helpers (no dependencies) */
function decodeEnt(s){
  return String(s || '').replace(/&#x([0-9a-f]+);/gi, function(_, h){ return String.fromCodePoint(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function(_, d){ return String.fromCodePoint(+d); })
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, function(_, e){ return {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'"}[e]; });
}
function cdata(s){ return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'); }
function tagText(block, name){ const m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'i')); return m ? cdata(m[1]).trim() : ''; }
function tagAttr(block, name, attr){ const m = block.match(new RegExp('<' + name + '\\s[^>]*' + attr + '\\s*=\\s*["\']([^"\']+)["\']', 'i')); return m ? decodeEnt(m[1]) : ''; }
function stripHtml(s){ return decodeEnt(decodeEnt(String(s || '')).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function clip(s, n){ s = String(s || '').trim(); if(s.length <= n) return s; const cut = s.slice(0, n); const sp = cut.lastIndexOf(' '); return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:\s]+$/, '') + '…'; }
function firstImg(html){ const m = decodeEnt(String(html || '')).match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i); return m ? m[1] : ''; }
function absUrl(u, base){ try{ return new URL(u, base).href; }catch(e){ return ''; } }

function parseFeed(xml, src){
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(function(b){
    let title = stripHtml(tagText(b, 'title'));
    const source = stripHtml(tagText(b, 'source'));
    if(source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3)).trim();
    let link = stripHtml(tagText(b, 'link')) || tagAttr(b, 'link', 'href');
    const rawDesc = tagText(b, 'description') || tagText(b, 'content:encoded') || tagText(b, 'summary') || tagText(b, 'content');
    let summary = stripHtml(rawDesc);
    if(summary && title && summary.replace(/\W/g, '').indexOf(title.replace(/\W/g, '').slice(0, 40)) === 0) summary = '';   /* Google News repeats the headline */
    if(source && summary === source) summary = '';
    let image = tagAttr(b, 'media:content', 'url') || tagAttr(b, 'media:thumbnail', 'url') || (/<enclosure[^>]+type=["']image/i.test(b) ? tagAttr(b, 'enclosure', 'url') : '') || firstImg(tagText(b, 'content:encoded')) || firstImg(rawDesc);
    const d = Date.parse(stripHtml(tagText(b, 'pubDate') || tagText(b, 'dc:date') || tagText(b, 'published') || tagText(b, 'updated')));
    const cats = (b.match(/<category[^>]*>[\s\S]*?<\/category>/gi) || []).map(function(c){ return stripHtml(c).toLowerCase().replace(/\s+/g, '-'); });
    return {title: title, summary: clip(summary, 280), url: link, image: image ? absUrl(image, link) : '', date: isNaN(d) ? 0 : d, source: String(src.id).indexOf('gn-') === 0 ? (source || src.name) : src.name, lang: src.lang, sections: cats};
  }).filter(function(x){ return x.title && x.url; });
}

async function getText(url, maxBytes){
  const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, application/json, text/html;q=0.9, */*;q=0.5', 'Accept-Language': 'mr-IN,hi-IN;q=0.9,en-IN;q=0.8'}, redirect: 'follow', signal: AbortSignal.timeout(9000)});
  if(!r.ok) throw new Error('HTTP ' + r.status);
  if(!maxBytes) return r.text();
  const reader = r.body.getReader(), chunks = []; let size = 0;
  while(size < maxBytes){ const x = await reader.read(); if(x.done) break; chunks.push(x.value); size += x.value.length; }
  try{ reader.cancel(); }catch(e){}
  return Buffer.concat(chunks.map(function(c){ return Buffer.from(c); })).toString('utf8');
}

async function fetchQuintype(src){
  const fields = 'id,headline,subheadline,slug,url,hero-image-s3-key,published-at,sections,summary,seo';
  try{
    const txt = await getText(src.base.replace(/\/$/, '') + '/api/v1/stories?limit=' + (src.max || 60) + '&fields=' + fields);
    const j = JSON.parse(txt);
    const list = (j.stories || []).map(function(s){
      const seo = s.seo || {};
      const key = s['hero-image-s3-key'];
      return {
        title: stripHtml(s.headline), summary: clip(stripHtml(s.summary || s.subheadline || seo['meta-description'] || ''), 280),
        url: s.url || (src.base.replace(/\/$/, '') + '/' + String(s.slug || '').replace(/^\//, '')),
        image: key ? 'https://images.assettype.com/' + String(key).split('/').map(encodeURIComponent).join('/') + '?w=720&auto=format%2Ccompress' : '',
        date: +s['published-at'] || 0, source: src.name, lang: src.lang,
        sections: (s.sections || []).map(function(x){ return String(x.slug || x.name || '').toLowerCase(); })
      };
    }).filter(function(x){ return x.title; });
    if(list.length) return list;
    throw new Error('no stories');
  }catch(e){
    /* Quintype sites also publish an RSS feed */
    const xml = await getText(src.base.replace(/\/$/, '') + '/stories.rss');
    return parseFeed(xml, src);
  }
}
async function fetchSource(src){
  if(src.type === 'quintype') return fetchQuintype(src);
  return parseFeed(await getText(src.url), src);
}

/* Fill in missing photos / summaries from the article page (og:image, og:description). */
const ogCache = new Map();
async function enrich(item){
  if(/news\.google\.com/.test(item.url)) return;           /* Google News links are redirects — skip */
  let og = ogCache.get(item.url);
  if(!og){
    try{
      const html = await getText(item.url, 250000);
      const meta = function(p){ const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + p + '["\'][^>]*content=["\']([^"\']+)["\']', 'i')) || html.match(new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']' + p + '["\']', 'i')); return m ? decodeEnt(m[1]) : ''; };
      og = {image: meta('og:image') || meta('twitter:image'), desc: meta('og:description') || meta('description')};
    }catch(e){ og = {image: '', desc: ''}; }
    ogCache.set(item.url, og);
    if(ogCache.size > 2000) ogCache.delete(ogCache.keys().next().value);
  }
  if(!item.image && og.image) item.image = absUrl(og.image, item.url);
  if(!item.summary && og.desc) item.summary = clip(stripHtml(og.desc), 280);
}
async function pool(items, n, fn){ let i = 0; await Promise.all(Array.from({length: n}, async function(){ while(i < items.length){ const it = items[i++]; await fn(it); } })); }

let NEWS = {updated: 0, items: [], sources: []}, newsBusy = null;
function normTitle(s){ return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').slice(0, 70); }
async function refreshNews(){
  const status = [], byId = {};
  const main = FEEDS.filter(function(s){ return !s.onlyIfEmpty; });
  const results = await Promise.all(main.map(function(s){ return fetchSource(s).then(function(l){ return {s: s, l: l}; }, function(e){ return {s: s, l: [], e: e}; }); }));
  for(const f of FEEDS.filter(function(s){ return s.onlyIfEmpty; })){
    const dep = results.find(function(r){ return r.s.id === f.onlyIfEmpty; });
    if(dep && dep.l.length) continue;
    try{ results.push({s: f, l: await fetchSource(f)}); }catch(e){ results.push({s: f, l: [], e: e}); }
  }
  const all = [], seen = new Set();
  results.forEach(function(r){
    status.push({id: r.s.id, name: r.s.name, ok: !r.e, count: r.l.length, error: r.e ? String(r.e.message || r.e).slice(0, 120) : undefined});
    if(r.e) console.warn('[ankurit] news source', r.s.id, 'failed:', r.e.message || r.e);
    r.l.slice(0, r.s.max || 20).forEach(function(it){
      const k = normTitle(it.title); if(!k || seen.has(k) || seen.has(it.url)) return; seen.add(k); seen.add(it.url);
      it.id = Buffer.from(it.url).toString('base64').replace(/[^a-z0-9]/gi, '').slice(-16);
      it.priority = r.s.id.indexOf('agrowon') === 0 ? 1 : 0;
      all.push(it); byId[it.id] = it;
    });
  });
  if(!all.length && NEWS.items.length){ NEWS.sources = status; return NEWS; }   /* keep old news if everything failed */
  await pool(all.filter(function(x){ return !x.image || !x.summary; }).slice(0, 40), 6, enrich);
  const now = Date.now();
  all.forEach(function(it){
    if(!it.date || it.date > now + 3600000) it.date = now;
    it.cat = classify(it.title, it.summary, it.sections); delete it.sections;
  });
  all.sort(function(a, b){ return b.date - a.date; });
  NEWS = {updated: now, items: all.slice(0, 220), sources: status};
  console.log('[ankurit] News refreshed:', NEWS.items.length, 'stories from', status.filter(function(s){ return s.count; }).map(function(s){ return s.id + '(' + s.count + ')'; }).join(', ') || 'no sources');
  return NEWS;
}
function getNews(force){
  const stale = Date.now() - NEWS.updated > NEWS_TTL;
  if((stale || force) && !newsBusy) newsBusy = refreshNews().catch(function(e){ console.warn('[ankurit] news refresh failed', e); return NEWS; }).finally(function(){ newsBusy = null; });
  if(NEWS.items.length && !force && !(ON_VERCEL && stale)) return Promise.resolve(NEWS);   /* serve cached news instantly, refresh in background */
  return newsBusy || Promise.resolve(NEWS);
}
async function handleNews(req, res){
  const force = /[?&]refresh=1/.test(req.url) && rateOk(clientIp(req), 'newsref', 3);
  const n = await getNews(force);
  sendJSON(res, 200, {updated: n.updated, items: n.items, sources: n.sources}, force ? 'no-store' : 'public, max-age=60, s-maxage=600, stale-while-revalidate=1800');
}

/* =====================================================================
   WEATHER — Open-Meteo (free, no key). /api/weather?lat=..&lon=..  or  ?q=District,State
   ===================================================================== */
const WX_BASE = (process.env.WEATHER_BASE_URL || 'https://api.open-meteo.com').replace(/\/$/, '');
const GEO_BASE = (process.env.GEOCODE_BASE_URL || 'https://geocoding-api.open-meteo.com').replace(/\/$/, '');
const wxCache = new Map(), geoCache = new Map();
async function geocode(q){
  const key = q.toLowerCase();
  if(geoCache.has(key)) return geoCache.get(key);
  const parts = q.split(',').map(function(x){ return x.trim(); }).filter(Boolean);
  const name = parts[0], state = (parts[1] || '').toLowerCase();
  const url = GEO_BASE + '/v1/search?count=10&language=en&format=json&countryCode=IN&name=' + encodeURIComponent(name);
  const j = JSON.parse(await getText(url));
  let list = j.results || [];
  if(state){ const m = list.filter(function(r){ return String(r.admin1 || '').toLowerCase() === state; }); if(m.length) list = m; }
  const r = list[0] ? {lat: list[0].latitude, lon: list[0].longitude, name: list[0].name} : null;
  geoCache.set(key, r);
  return r;
}
async function handleWeather(req, res){
  const u = new URL(req.url, 'http://x');
  let lat = parseFloat(u.searchParams.get('lat')), lon = parseFloat(u.searchParams.get('lon')), place = null;
  const q = (u.searchParams.get('q') || '').slice(0, 120);
  if((isNaN(lat) || isNaN(lon)) && q){ place = await geocode(q).catch(function(){ return null; }); if(place){ lat = place.lat; lon = place.lon; } }
  if(isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return sendJSON(res, 400, {error: 'location_not_found'});
  const key = lat.toFixed(2) + ',' + lon.toFixed(2), hit = wxCache.get(key);
  if(hit && Date.now() - hit.at < 20 * 60000) return sendJSON(res, 200, Object.assign({place: place && place.name}, hit.data), 'public, max-age=300, s-maxage=900');
  const url = WX_BASE + '/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&timezone=Asia%2FKolkata&forecast_days=7' +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day' +
    '&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset,et0_fao_evapotranspiration';
  try{
    const j = JSON.parse(await getText(url));
    if(!j.current || !j.daily) throw new Error('bad weather data');
    const data = {lat: lat, lon: lon, at: Date.now(), current: j.current, hourly: j.hourly, daily: j.daily};
    wxCache.set(key, {at: Date.now(), data: data});
    if(wxCache.size > 500) wxCache.delete(wxCache.keys().next().value);
    sendJSON(res, 200, Object.assign({place: place && place.name}, data), 'public, max-age=300, s-maxage=900');
  }catch(e){
    console.warn('[ankurit] weather failed:', e.message);
    if(hit) return sendJSON(res, 200, Object.assign({place: place && place.name, stale: true}, hit.data));
    sendJSON(res, 502, {error: 'weather_unavailable'});
  }
}

/* =====================================================================
   CROP PHOTOS — lead photo of each crop's Wikipedia article (cached for 7 days).
   ===================================================================== */
const WIKI_BASE = (process.env.WIKI_BASE_URL || 'https://en.wikipedia.org').replace(/\/$/, '');
const CROP_WIKI = {
  rice:'Rice', wheat:'Wheat', jowar:'Sorghum bicolor', bajra:'Pearl millet', maize:'Maize', ragi:'Eleusine coracana', vari:'Panicum sumatrense',
  tur:'Pigeon pea', chana:'Chickpea', moong:'Mung bean', urad:'Vigna mungo', matki:'Vigna aconitifolia', chavali:'Cowpea', kulith:'Macrotyloma uniflorum', masoor:'Lentil', pavta:'Lablab', rajma:'Kidney bean',
  soybean:'Soybean', groundnut:'Peanut', mustard:'Brassica juncea', sunflower:'Common sunflower', safflower:'Safflower', sesame:'Sesame', niger:'Guizotia abyssinica', linseed:'Flax', castor:'Ricinus',
  cotton:'Cotton', sugarcane:'Sugarcane', mulberry:'Morus alba', betel:'Betel', arecanut:'Areca nut',
  turmeric:'Turmeric', chilli:'Chili pepper', garlic:'Garlic', ginger:'Ginger', blackpepper:'Black pepper',
  onion:'Onion', tomato:'Tomato', potato:'Potato', brinjal:'Eggplant', okra:'Okra', cabbage:'Cabbage', cauliflower:'Cauliflower', cucumber:'Cucumber', bottlegourd:'Calabash', bittergourd:'Momordica charantia', ridgegourd:'Luffa acutangula', spongegourd:'Luffa aegyptiaca', snakegourd:'Trichosanthes cucumerina', pumpkin:'Pumpkin', ivygourd:'Coccinia grandis', drumstick:'Moringa oleifera', clusterbean:'Guar', frenchbean:'Green bean', ghevada:'Hyacinth bean', carrot:'Carrot', radish:'Radish', beetroot:'Beetroot', sweetpotato:'Sweet potato', peas:'Pea', capsicum:'Bell pepper', colocasia:'Taro', suran:'Amorphophallus paeoniifolius',
  methi:'Fenugreek', palak:'Spinach', kothimbir:'Coriander', shepu:'Dill', lalmath:'Amaranthus tricolor', ambadi:'Roselle (plant)', mint:'Mentha', curryleaf:'Curry tree',
  banana:'Banana', pomegranate:'Pomegranate', mango:'Mango', lime:'Key lime', chiku:'Sapodilla', guava:'Common guava', custardapple:'Annona squamosa', grapes:'Grape', orange:'Mandarin orange', mosambi:'Citrus limetta', fig:'Common fig', cashew:'Cashew', coconut:'Coconut', jackfruit:'Jackfruit', kokum:'Garcinia indica', jamun:'Syzygium cumini', ber:'Ziziphus mauritiana', amla:'Phyllanthus emblica', tamarind:'Tamarind', watermelon:'Watermelon', muskmelon:'Muskmelon',
  marigold:'Tagetes erecta', rose:'Rose', shevanti:'Chrysanthemum', tuberose:'Polianthes tuberosa', mogra:'Jasminum sambac', aster:'Callistephus',
  lucerne:'Alfalfa', napier:'Cenchrus purpureus',
  dragonfruit:'Pitaya', avocado:'Avocado', strawberry:'Strawberry', broccoli:'Broccoli', ccapsicum:'Capsicum', cherrytomato:'Cherry tomato', zucchini:'Zucchini', lettuce:'Iceberg lettuce', quinoa:'Quinoa', chia:'Salvia hispanica', kiwi:'Kiwifruit', blueberry:'Blueberry', passionfruit:'Passiflora edulis', saffron:'Saffron', mushroom:'Pleurotus ostreatus', papaya:'Papaya', datepalm:'Phoenix dactylifera', sweetcorn:'Sweet corn'
};
const IMG_CACHE_FILE = ON_VERCEL ? '/tmp/ankurit-crop-photos.json' : path.join(__dirname, '.crop-photos.json');
let cropImgs = {at: 0, map: {}}, cropImgBusy = null;
try{ cropImgs = JSON.parse(fs.readFileSync(IMG_CACHE_FILE, 'utf8')); if(cropImgs.v !== 2) cropImgs.at = 0; }catch(e){}
/* second-choice article titles, tried when the first one has no photo */
const CROP_WIKI_ALT = {vari:'Little millet', jowar:'Sorghum', ragi:'Finger millet', matki:'Moth bean', kulith:'Horse gram', pavta:'Lablab purpureus', ghevada:'Lablab', rajma:'Common bean', niger:'Niger seed', castor:'Castor oil plant', mulberry:'Mulberry', betel:'Piper betle', arecanut:'Areca catechu', bottlegourd:'Lagenaria siceraria', bittergourd:'Bitter melon', ridgegourd:'Luffa', spongegourd:'Luffa cylindrica', snakegourd:'Snake gourd', ivygourd:'Ivy gourd', drumstick:'Moringa', clusterbean:'Cyamopsis tetragonoloba', suran:'Elephant foot yam', lalmath:'Amaranth', ambadi:'Hibiscus sabdariffa', mint:'Mentha spicata', curryleaf:'Murraya koenigii', lime:'Lime (fruit)', chiku:'Manilkara zapota', custardapple:'Sugar-apple', orange:'Orange (fruit)', mosambi:'Sweet lemon', kokum:'Kokum', jamun:'Jambul', ber:'Indian jujube', amla:'Indian gooseberry', tuberose:'Tuberose', mogra:'Arabian jasmine', aster:'Callistephus chinensis', napier:'Napier grass', lucerne:'Medicago sativa', lettuce:'Lettuce', passionfruit:'Passion fruit', mushroom:'Oyster mushroom', chia:'Chia seed', ccapsicum:'Bell pepper', marigold:'Tagetes', shevanti:'Chrysanthemum indicum', dragonfruit:'Selenicereus undatus', vigna:'', colocasia:'Colocasia esculenta'};
async function wikiThumbs(titleOf){
  const ids = Object.keys(titleOf), map = {};
  for(let i = 0; i < ids.length; i += 40){
    const chunk = ids.slice(i, i + 40);
    const url = WIKI_BASE + '/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=480&titles=' + encodeURIComponent(chunk.map(function(id){ return titleOf[id]; }).join('|'));
    const j = JSON.parse(await getText(url));
    const q = j.query || {}, back = {};
    chunk.forEach(function(id){ back[titleOf[id]] = (back[titleOf[id]] || []).concat(id); });
    (q.normalized || []).concat(q.redirects || []).forEach(function(n){ if(back[n.from]) back[n.to] = (back[n.to] || []).concat(back[n.from]); });
    (q.pages || []).forEach(function(pg){ if(pg.thumbnail && pg.thumbnail.source) (back[pg.title] || []).forEach(function(id){ map[id] = pg.thumbnail.source; }); });
  }
  return map;
}
/* Real photos: search Wikimedia Commons for a JPEG photo of the crop in the field.
   Your own photos in public/img/crops/<id>.jpg (or .png/.webp) always win. */
const COMMONS_BASE = (process.env.COMMONS_BASE_URL || 'https://commons.wikimedia.org').replace(/\/$/, '');
const FRUIT_IDS = 'banana pomegranate mango lime chiku guava custardapple grapes orange mosambi fig cashew coconut jackfruit kokum jamun ber amla tamarind watermelon muskmelon dragonfruit avocado strawberry kiwi blueberry passionfruit papaya datepalm cherrytomato'.split(' ');
const FLOWER_IDS = 'marigold rose shevanti tuberose mogra aster saffron'.split(' ');
const PHOTO_Q = {rice:'paddy field rice India', wheat:'wheat field', jowar:'sorghum field', bajra:'pearl millet field', maize:'maize field', ragi:'finger millet field', vari:'little millet', tur:'pigeon pea pods plant', chana:'chickpea plant pods', moong:'mung bean plant', urad:'black gram plant', matki:'moth bean plant', chavali:'cowpea pods', kulith:'horse gram plant', masoor:'lentil plant', pavta:'lablab beans pods', rajma:'kidney bean plant', soybean:'soybean field', groundnut:'peanut plant field', mustard:'mustard field flowers', sunflower:'sunflower field', safflower:'safflower field', sesame:'sesame plant flowers', niger:'Guizotia abyssinica field', linseed:'flax field', castor:'castor plant', cotton:'cotton field bolls', sugarcane:'sugarcane field', mulberry:'mulberry plantation sericulture', betel:'betel leaf vine', arecanut:'areca nut palm', turmeric:'turmeric plant field', chilli:'chilli plant green chillies', garlic:'garlic bulbs field', ginger:'ginger plant', blackpepper:'black pepper vine berries', onion:'onion field', tomato:'tomato plant fruits', potato:'potato field', brinjal:'brinjal plant', okra:'okra plant', cabbage:'cabbage field', cauliflower:'cauliflower field', capsicum:'capsicum plant', cucumber:'cucumber plant', bottlegourd:'bottle gourd vine', bittergourd:'bitter gourd vine', ridgegourd:'ridge gourd vine', spongegourd:'sponge gourd vine', snakegourd:'snake gourd', pumpkin:'pumpkin field', ivygourd:'ivy gourd tindora', drumstick:'moringa pods tree', clusterbean:'cluster bean guar plant', frenchbean:'green beans plant', ghevada:'hyacinth bean pods', peas:'green peas pods plant', carrot:'carrot harvest', radish:'radish harvest', beetroot:'beetroot harvest', sweetpotato:'sweet potato tubers', colocasia:'taro colocasia leaves', suran:'elephant foot yam', methi:'fenugreek leaves', palak:'spinach plants', kothimbir:'coriander leaves plant', shepu:'dill plant', lalmath:'red amaranth leaves', ambadi:'roselle plant leaves', mint:'mint plant', curryleaf:'curry leaves plant', lucerne:'alfalfa field', napier:'napier grass', broccoli:'broccoli plant', zucchini:'zucchini plant', lettuce:'iceberg lettuce field', quinoa:'quinoa field', chia:'chia plant', mushroom:'oyster mushroom', sweetcorn:'sweet corn cob', ccapsicum:'red yellow bell peppers'};
const BAD_PHOTO = /(\bmaps?\b|diagram|illustration|drawing|\bplate\b|herbarium|köhler|kohler|\blogo|\bstamp|\bicon|\bchart|botanical|engraving|painting|sketch|\bseal\b|\bflag\b|coat of arms|\.svg|\.gif|\.tiff?$)/i;
function photoQuery(id){ if(PHOTO_Q[id]) return PHOTO_Q[id]; const t = CROP_WIKI[id] || id; return FLOWER_IDS.indexOf(id) > -1 ? t + ' flower' : (FRUIT_IDS.indexOf(id) > -1 ? t + ' fruit' : t + ' plant'); }
async function commonsPhoto(id){
  const url = COMMONS_BASE + '/w/api.php?action=query&format=json&formatversion=2&generator=search&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=480&gsrsearch=' + encodeURIComponent(photoQuery(id) + ' filetype:bitmap');
  const j = JSON.parse(await getText(url));
  const pages = ((j.query || {}).pages || []).sort(function(a, b){ return (a.index || 0) - (b.index || 0); });
  for(const pg of pages){
    const ii = (pg.imageinfo || [])[0]; if(!ii) continue;
    if(!/jpeg/.test(ii.mime || '') || BAD_PHOTO.test(pg.title || '') || (ii.width || 0) < 500 || (ii.height || 0) < 300) continue;
    return ii.thumburl || ii.url;
  }
  return '';
}
function ownPhotos(){
  const dir = path.join(PUBLIC_DIR, 'img', 'crops'), map = {};
  try{ fs.readdirSync(dir).forEach(function(f){ const m = f.match(/^([a-z]+)\.(jpe?g|png|webp)$/i); if(m) map[m[1].toLowerCase()] = '/img/crops/' + f; }); }catch(e){}
  return map;
}
async function loadCropImgs(){
  const ids = Object.keys(CROP_WIKI), map = {};
  await pool(ids.slice(), ON_VERCEL ? 10 : 4, async function(id){ try{ const u = await commonsPhoto(id); if(u) map[id] = u; }catch(e){} });
  const missing = {};
  ids.forEach(function(id){ if(!map[id]) missing[id] = CROP_WIKI[id]; });
  if(Object.keys(missing).length){
    const w = await wikiThumbs(missing).catch(function(){ return {}; });
    Object.assign(map, w);
    const alt = {}; Object.keys(missing).forEach(function(id){ if(!map[id] && CROP_WIKI_ALT[id]) alt[id] = CROP_WIKI_ALT[id]; });
    if(Object.keys(alt).length) Object.assign(map, await wikiThumbs(alt).catch(function(){ return {}; }));
  }
  const n = Object.keys(map).length, total = ids.length;
  if(n){
    cropImgs = {at: Date.now() - (n < total ? 6 * 86400000 : 0), map: map, v: 2};
    fs.writeFile(IMG_CACHE_FILE, JSON.stringify(cropImgs), function(){});
    console.log('[ankurit] Crop photos ready:', n + '/' + total + (n < total ? ' (no photo: ' + ids.filter(function(id){ return !map[id]; }).join(', ') + ')' : ''));
  }
  return cropImgs;
}
function getCropImgs(){
  if(Date.now() - cropImgs.at > 7 * 86400000 && !cropImgBusy) cropImgBusy = loadCropImgs().catch(function(e){ console.warn('[ankurit] crop photos failed:', e.message); return cropImgs; }).finally(function(){ cropImgBusy = null; });
  if(Object.keys(cropImgs.map).length) return Promise.resolve(cropImgs);
  return cropImgBusy || Promise.resolve(cropImgs);
}

/* quick AI self-test: open http://localhost:3000/api/ai-check */
async function handleAICheck(req, res){
  if(!ANY_AI) return sendJSON(res, 200, {ok: false, problem: 'No AI key in .env — add GEMINI_API_KEY (and optionally GROQ_API_KEY / MISTRAL_API_KEY).'});
  const ping = {messages: [{role: 'user', content: 'Reply with the single word OK.'}], task: 'short'};
  const results = [];
  /* every Gemini key on its own */
  for(const key of GEMINI_KEYS){
    const t0 = Date.now(); let text = '', model = '', problem = '';
    const models = (await listGeminiModels()).filter(function(m){ return !badModels.has(m); });
    for(const m of models){
      try{ text = ''; await streamGemini(m, ping, function(t){ text += t; }, false, false, key); model = m; problem = ''; break; }
      catch(e){ problem = e.message; if(e.code === 'not_granted') break; if(e.badModel) badModels.add(m); if(e.code === 'busy') resting.set(m, Date.now() + 120000); }
    }
    results.push({service: 'Gemini ' + keyTag(key) + ' (…' + key.slice(-4) + ')', ok: !!model, model: model || undefined, seconds: Math.round((Date.now() - t0) / 100) / 10, problem: model ? undefined : problem});
  }
  for(const bk of BACKUPS){
    const t0 = Date.now(); let text = '';
    try{ await openaiProvider(ping, function(t){ text += t; }, null, bk); results.push({service: bk.name, ok: true, model: bk.model, photo_model: bk.vision || 'none (text only)', seconds: Math.round((Date.now() - t0) / 100) / 10}); }
    catch(e){ results.push({service: bk.name, ok: false, model: bk.model, problem: e.message}); }
  }
  const okCount = results.filter(function(r){ return r.ok; }).length;
  sendJSON(res, 200, {ok: okCount > 0, working: okCount + ' of ' + results.length, services: results,
    tip: okCount === 0 ? 'No AI service is working right now. If Gemini says "busy", wait 1–2 minutes. Add free backup keys (GROQ_API_KEY, MISTRAL_API_KEY) in .env so the app keeps working.' : (BACKUPS.length === 0 ? 'Tip: add a free GROQ_API_KEY or MISTRAL_API_KEY in .env as a backup for busy times.' : undefined)});
}

/* =====================================================================
   LOCATION NAMES — GPS → village / town, taluka, district, state.
   OpenStreetMap Nominatim (free, no key; max 1 request per second), with
   BigDataCloud as a backup. Results are cached.
   ===================================================================== */
const NOMINATIM = (process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const BDC = (process.env.BDC_BASE_URL || 'https://api.bigdatacloud.net').replace(/\/$/, '');
const GEO_UA = 'Ankurit-farm-app/4.1 (self-hosted farmer advisory app)';
const geoCache2 = new Map(); let lastNomi = 0;
async function nomi(pathq){
  const wait = 1100 - (Date.now() - lastNomi); if(wait > 0) await sleep(wait);
  lastNomi = Date.now();
  const r = await fetch(NOMINATIM + pathq, {headers: {'User-Agent': GEO_UA, 'Accept': 'application/json'}, signal: AbortSignal.timeout(9000)});
  if(!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function pickPlace(a){
  a = a || {};
  return {
    place: a.village || a.hamlet || a.town || a.city || a.suburb || a.neighbourhood || a.municipality || a.locality || a.county || '',
    taluka: a.subdistrict || a.county || a.municipality || '',
    district: (a.state_district || a.district || a.county || '').replace(/\s+(District|district|जिल्हा|ज़िला|जिला)$/, '').trim(),
    state: a.state || a.region || '',
    pin: a.postcode || ''
  };
}
async function reverseGeo(lat, lon, lang){
  const key = lat.toFixed(4) + ',' + lon.toFixed(4) + ',' + lang;
  if(geoCache2.has(key)) return geoCache2.get(key);
  let out = null;
  try{
    const en = await nomi('/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=en&lat=' + lat + '&lon=' + lon);
    const e = pickPlace(en.address);
    let local = e;
    if(lang !== 'en'){ try{ const lo = await nomi('/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=' + lang + ',en&lat=' + lat + '&lon=' + lon); local = pickPlace(lo.address); }catch(_){} }
    out = {en: e, local: local, source: 'OpenStreetMap'};
  }catch(err){
    const j = JSON.parse(await getText(BDC + '/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=en'));
    const adm = ((j.localityInfo || {}).administrative || []);
    const dist = (adm.find(function(x){ return x.adminLevel === 5; }) || {}).name || '';
    const e = {place: j.locality || j.city || '', taluka: (adm.find(function(x){ return x.adminLevel === 6; }) || {}).name || '', district: dist.replace(/\s+district$/i, ''), state: j.principalSubdivision || '', pin: j.postcode || ''};
    out = {en: e, local: e, source: 'BigDataCloud'};
  }
  geoCache2.set(key, out); if(geoCache2.size > 3000) geoCache2.delete(geoCache2.keys().next().value);
  return out;
}
async function handleRevGeo(req, res){
  const u = new URL(req.url, 'http://x'), lat = parseFloat(u.searchParams.get('lat')), lon = parseFloat(u.searchParams.get('lon')), lang = (u.searchParams.get('lang') || 'en').replace(/[^a-z]/g, '').slice(0, 2) || 'en';
  if(isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return sendJSON(res, 400, {error: 'bad_location'});
  try{ sendJSON(res, 200, await reverseGeo(lat, lon, lang), 'public, max-age=86400'); }
  catch(e){ console.warn('[ankurit] reverse geocode failed:', e.message); sendJSON(res, 502, {error: 'not_found'}); }
}
async function handleGeoSearch(req, res){
  const u = new URL(req.url, 'http://x'), q = (u.searchParams.get('q') || '').trim().slice(0, 80), lang = (u.searchParams.get('lang') || 'en').replace(/[^a-z]/g, '').slice(0, 2) || 'en';
  if(q.length < 2) return sendJSON(res, 200, {results: []});
  const key = 's|' + q.toLowerCase() + '|' + lang;
  try{
    let out = geoCache2.get(key);
    if(!out){
      const j = await nomi('/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&accept-language=' + lang + ',en&q=' + encodeURIComponent(q));
      out = {results: (j || []).map(function(r){ const p = pickPlace(r.address); return {lat: +r.lat, lon: +r.lon, name: p.place || String(r.display_name || '').split(',')[0], taluka: p.taluka, district: p.district, state: p.state, label: String(r.display_name || '').split(',').slice(0, 4).join(',')}; })};
      geoCache2.set(key, out);
    }
    sendJSON(res, 200, out, 'public, max-age=86400');
  }catch(e){ console.warn('[ankurit] place search failed:', e.message); sendJSON(res, 502, {results: [], error: 'search_failed'}); }
}

/* =====================================================================
   FULL ARTICLE TEXT — so "Simple words" explains the whole news, not only the headline.
   Only for links that are in our own news list (safe).
   ===================================================================== */
const articleCache = new Map();
function extractArticle(html){
  let body = '';
  const ld = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for(const blk of ld){
    try{
      const raw = blk.replace(/^<script[^>]*>|<\/script>$/gi, '');
      const j = JSON.parse(raw), list = Array.isArray(j) ? j : (j['@graph'] || [j]);
      for(const it of list){ if(it && it.articleBody && String(it.articleBody).length > body.length) body = String(it.articleBody); }
    }catch(e){}
  }
  if(body.length < 300){
    const area = (html.match(/<article[\s\S]*?<\/article>/i) || [html])[0];
    const paras = (area.match(/<p[\s>][\s\S]*?<\/p>/gi) || []).map(stripHtml).filter(function(p){ return p.length > 50 && !/(cookie|subscribe|copyright|all rights reserved|download app|follow us|whatsapp channel)/i.test(p); });
    const joined = paras.join('\n');
    if(joined.length > body.length) body = joined;
  }
  return stripHtml(body).replace(/\s{2,}/g, ' ').slice(0, 6000);
}
async function handleArticle(req, res){
  const u = new URL(req.url, 'http://x'), url = u.searchParams.get('url') || '';
  const item = (NEWS.items || []).find(function(n){ return n.url === url; });
  if(!item) return sendJSON(res, 404, {text: ''});
  if(/news\.google\.com/.test(url)) return sendJSON(res, 200, {text: '', note: 'redirect_link'});
  if(articleCache.has(url)) return sendJSON(res, 200, {text: articleCache.get(url)}, 'public, max-age=3600');
  try{
    const text = extractArticle(await getText(url, 900000));
    articleCache.set(url, text); if(articleCache.size > 500) articleCache.delete(articleCache.keys().next().value);
    sendJSON(res, 200, {text: text}, 'public, max-age=3600');
  }catch(e){ sendJSON(res, 200, {text: ''}); }
}

/* ---------- static files ---------- */
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json'};
function serveStatic(req, res){
  let p;
  try{ p = decodeURIComponent(new URL(req.url, 'http://x').pathname); }catch(e){ res.writeHead(400); return res.end('Bad request'); }
  if(p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if(!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, function(e, data){
    if(e){ res.writeHead(404, {'Content-Type': 'text/plain'}); return res.end('Not found'); }
    const ext = path.extname(file);
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.css') ? 'no-cache' : 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

function handler(req, res){
  const url = req.url.split('?')[0];
  if(url === '/api/status' && req.method === 'GET'){
    return sendJSON(res, 200, {ai: ANY_AI, vision: GEMINI_KEYS.length > 0 || BACKUPS.some(function(b){ return b.vision; }), provider: GEMINI_KEYS.length ? 'gemini' : (BACKUPS[0] ? BACKUPS[0].name : 'none'), webSearch: WEB_SEARCH && GEMINI_KEYS.length > 0});
  }
  if(url === '/api/ai' && req.method === 'POST') return handleAI(req, res).catch(function(e){ try{ sendJSON(res, 500, {code: 'upstream_error', message: e.message}); }catch(_){} });
  if(url === '/api/weather' && req.method === 'GET'){ if(!rateOk(clientIp(req), 'wx', 30)) return sendJSON(res, 429, {error: 'rate_limited'}); return handleWeather(req, res).catch(function(e){ sendJSON(res, 502, {error: 'weather_unavailable'}); }); }
  if(url === '/api/revgeo' && req.method === 'GET'){ if(!rateOk(clientIp(req), 'geo', 20)) return sendJSON(res, 429, {error: 'rate_limited'}); return handleRevGeo(req, res); }
  if(url === '/api/geosearch' && req.method === 'GET'){ if(!rateOk(clientIp(req), 'geo', 20)) return sendJSON(res, 429, {error: 'rate_limited'}); return handleGeoSearch(req, res); }
  if(url === '/api/article' && req.method === 'GET'){ if(!rateOk(clientIp(req), 'art', 30)) return sendJSON(res, 429, {text: ''}); return handleArticle(req, res); }
  if(url === '/api/cropimgs' && req.method === 'GET') return getCropImgs().then(function(c){ sendJSON(res, 200, Object.assign({}, c.map, ownPhotos()), Object.keys(c.map).length ? 'public, max-age=600, s-maxage=86400, stale-while-revalidate=604800' : 'no-store'); });
  if(url === '/api/ai-check' && req.method === 'GET') return handleAICheck(req, res);
  if(url === '/api/news' && req.method === 'GET') return handleNews(req, res).catch(function(e){ sendJSON(res, 200, {updated: 0, items: [], sources: [], error: e.message}); });
  if(req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.writeHead(405); res.end();
}
module.exports = handler;

/* Running on your own computer / server:  node server.js */
if(require.main === module) http.createServer(handler).listen(PORT, function(){
  console.log('\n  Ankurit is running →  http://localhost:' + PORT);
  console.log('  AI: ' + (ANY_AI ? [GEMINI_KEYS.length ? 'Gemini (' + GEMINI_KEYS.length + ' key' + (GEMINI_KEYS.length > 1 ? 's' : '') + ')' : ''].concat(BACKUPS.map(function(b){ return b.name; })).filter(Boolean).join(' → ') : 'NOT CONFIGURED — add GEMINI_API_KEY to .env') + (WEB_SEARCH && GEMINI_KEY ? ' · web search ON for chat' : ''));
  console.log('  News: ' + FEEDS.length + ' sources (Agrowon first), refresh every ' + (NEWS_TTL / 60000) + ' min\n');
  getNews(false);   /* warm the news cache */
  getCropImgs();
  if(GEMINI_KEYS.length) listGeminiModels().then(function(l){ console.log('  Gemini models (in order): ' + l.join(', ') + '\n  Test AI: http://localhost:' + PORT + '/api/ai-check\n'); });
});
