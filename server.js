/*
 * Ankurit server — serves the web app and forwards AI requests to Gemini (or any
 * OpenAI-compatible API such as Groq), so your API key stays on the server.
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
      let v = m[2].replace(/^["']|["']$/g, '');
      if(process.env[m[1]] === undefined) process.env[m[1]] = v;
    });
  }catch(e){ /* no .env file: fine */ }
}
loadEnv(path.join(__dirname, '.env'));

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_BASE = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
const OPENAI_BASE = (process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const OPENAI_MODEL = (process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile').trim();
const OPENAI_VISION = /^(1|true|yes)$/i.test(process.env.OPENAI_VISION || '');
const RATE_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || '30', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

/* ---------- helpers ---------- */
function sendJSON(res, code, obj){ res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(obj)); }
function readBody(req, limit){
  return new Promise(function(resolve, reject){
    let size = 0; const chunks = [];
    req.on('data', function(c){ size += c.length; if(size > limit){ reject(Object.assign(new Error('Request too large'), {status: 413})); req.destroy(); } else chunks.push(c); });
    req.on('end', function(){ resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}
const hits = new Map();
function rateOk(ip){
  const now = Date.now(), list = (hits.get(ip) || []).filter(function(t){ return now - t < 60000; });
  if(list.length >= RATE_PER_MIN){ hits.set(ip, list); return false; }
  list.push(now); hits.set(ip, list); return true;
}
setInterval(function(){ const now = Date.now(); hits.forEach(function(v, k){ if(!v.some(function(t){ return now - t < 60000; })) hits.delete(k); }); }, 120000).unref();

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

/* ---------- Gemini ---------- */
let geminiModel = (process.env.GEMINI_MODEL || '').trim();
async function pickGeminiModel(){
  if(geminiModel) return geminiModel;
  try{
    const r = await fetch(GEMINI_BASE + '/v1beta/models?pageSize=1000', {headers: {'x-goog-api-key': GEMINI_KEY}});
    const j = await r.json();
    const names = (j.models || []).filter(function(m){ return (m.supportedGenerationMethods || []).indexOf('generateContent') > -1; }).map(function(m){ return String(m.name).replace(/^models\//, ''); });
    if(names.indexOf('gemini-flash-latest') > -1){ geminiModel = 'gemini-flash-latest'; }
    else {
      const flash = names.filter(function(n){ return /^gemini-[\d.]+-flash$/.test(n); });
      flash.sort(function(a, b){ return parseFloat(b.split('-')[1]) - parseFloat(a.split('-')[1]); });
      geminiModel = flash[0] || names.find(function(n){ return /flash/.test(n) && !/(lite|live|image|tts|audio|transcribe|translate|embedding)/.test(n); }) || '';
    }
    if(geminiModel) console.log('[ankurit] Using Gemini model:', geminiModel);
  }catch(e){ console.warn('[ankurit] Could not list Gemini models:', e.message); }
  return geminiModel || 'gemini-flash-latest';
}
async function streamGemini(body, onDelta){
  const model = await pickGeminiModel();
  const msgs = normalise(body.messages);
  const contents = msgs.map(function(m){ return {role: m.role === 'assistant' ? 'model' : 'user', parts: [{text: m.content}]}; });
  if(body.images && body.images.length && contents.length){
    const last = contents[contents.length - 1];
    body.images.slice(0, 3).forEach(function(im){ last.parts.push({inline_data: {mime_type: String(im.mime || 'image/jpeg'), data: String(im.data || '')}}); });
  }
  const payload = {contents: contents, generationConfig: {temperature: 0.6, maxOutputTokens: 8192}};
  if(body.json) payload.generationConfig.responseMimeType = 'application/json';
  const r = await fetch(GEMINI_BASE + '/v1beta/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY}, body: JSON.stringify(payload)
  });
  if(!r.ok){
    const t = await r.text().catch(function(){ return ''; });
    if(r.status === 404) geminiModel = (process.env.GEMINI_MODEL || '').trim();
    throw upstreamError('gemini', r.status, t);
  }
  await readSSE(r.body, function(data){
    const j = JSON.parse(data);
    if(j.error) throw upstreamError('gemini', j.error.code || 500, JSON.stringify(j.error));
    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    parts.forEach(function(p){ if(p.text && !p.thought) onDelta(p.text); });
  });
}

/* ---------- OpenAI-compatible (Groq, OpenRouter, OpenAI…) ---------- */
async function streamOpenAI(body, onDelta){
  const msgs = normalise(body.messages).map(function(m){ return {role: m.role, content: m.content}; });
  if(body.images && body.images.length && msgs.length){
    const last = msgs[msgs.length - 1];
    last.content = [{type: 'text', text: last.content}].concat(body.images.slice(0, 3).map(function(im){ return {type: 'image_url', image_url: {url: 'data:' + (im.mime || 'image/jpeg') + ';base64,' + im.data}}; }));
  }
  const payload = {model: OPENAI_MODEL, messages: msgs, temperature: 0.6, stream: true};
  if(body.json) payload.response_format = {type: 'json_object'};
  const r = await fetch(OPENAI_BASE + '/chat/completions', {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY}, body: JSON.stringify(payload)});
  if(!r.ok){ const t = await r.text().catch(function(){ return ''; }); throw upstreamError('openai', r.status, t); }
  await readSSE(r.body, function(data){
    if(data === '[DONE]') return;
    const j = JSON.parse(data);
    const d = (((j.choices || [])[0] || {}).delta || {}).content;
    if(d) onDelta(d);
  });
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
function upstreamError(provider, status, text){
  let code = 'upstream_error', msg = provider + ' error ' + status;
  if(status === 429) { code = 'rate_limited'; msg = 'Free-tier limit reached. Please wait a minute.'; }
  else if(status === 400 && /API key|API_KEY/i.test(text)) { code = 'not_granted'; msg = 'The ' + provider + ' API key is not valid.'; }
  else if(status === 401 || status === 403) { code = 'not_granted'; msg = 'The ' + provider + ' API key was rejected.'; }
  else if(status === 404) { msg = provider + ' model not found. Set GEMINI_MODEL / OPENAI_MODEL in .env.'; }
  console.warn('[ankurit]', msg, String(text).slice(0, 300));
  return Object.assign(new Error(msg), {code: code, status: status});
}

/* ---------- /api/ai ---------- */
async function handleAI(req, res){
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if(!rateOk(ip)) return sendJSON(res, 429, {code: 'rate_limited', message: 'Too many requests'});
  if(!GEMINI_KEY && !OPENAI_KEY) return sendJSON(res, 503, {code: 'not_granted', message: 'No API key configured'});
  let body;
  try{ body = JSON.parse(await readBody(req, 12 * 1024 * 1024)); }catch(e){ return sendJSON(res, e.status || 400, {code: 'invalid_request', message: e.message}); }
  if(!body || !Array.isArray(body.messages) || !body.messages.length) return sendJSON(res, 400, {code: 'invalid_request', message: 'messages required'});
  const hasImages = Array.isArray(body.images) && body.images.length > 0;

  res.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'});
  let closed = false, sent = 0;
  req.on('close', function(){ closed = true; });
  const onDelta = function(t){ if(closed) return; sent += t.length; res.write('data: ' + JSON.stringify({delta: t}) + '\n\n'); };

  const order = [];
  if(GEMINI_KEY) order.push(streamGemini);
  if(OPENAI_KEY && (!hasImages || OPENAI_VISION || !GEMINI_KEY)) order.push(streamOpenAI);
  let lastErr = null;
  for(const fn of order){
    try{ await fn(body, onDelta); lastErr = null; break; }
    catch(e){ lastErr = e; if(sent > 0 || closed) break; /* only fall back if nothing was streamed yet */ }
  }
  if(lastErr && !closed) res.write('data: ' + JSON.stringify({error: {code: lastErr.code || 'upstream_error', message: lastErr.message}}) + '\n\n');
  if(!closed) res.end();
}

/* ---------- static files ---------- */
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json'};
function serveStatic(req, res){
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if(p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if(!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, function(e, data){
    if(e){ res.writeHead(404, {'Content-Type': 'text/plain'}); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': p === '/index.html' ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff'});
    res.end(data);
  });
}

http.createServer(function(req, res){
  const url = req.url.split('?')[0];
  if(url === '/api/status' && req.method === 'GET'){
    return sendJSON(res, 200, {ai: !!(GEMINI_KEY || OPENAI_KEY), vision: !!GEMINI_KEY || (!!OPENAI_KEY && OPENAI_VISION), provider: GEMINI_KEY ? 'gemini' : (OPENAI_KEY ? 'openai-compatible' : 'none')});
  }
  if(url === '/api/ai' && req.method === 'POST') return handleAI(req, res).catch(function(e){ try{ sendJSON(res, 500, {code: 'upstream_error', message: e.message}); }catch(_){} });
  if(req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.writeHead(405); res.end();
}).listen(PORT, function(){
  console.log('\n  Ankurit is running →  http://localhost:' + PORT);
  console.log('  AI: ' + (GEMINI_KEY ? 'Gemini' : '') + (GEMINI_KEY && OPENAI_KEY ? ' + ' : '') + (OPENAI_KEY ? 'OpenAI-compatible (' + OPENAI_MODEL + ')' : '') + (!GEMINI_KEY && !OPENAI_KEY ? 'NOT CONFIGURED — add GEMINI_API_KEY to .env' : '') + '\n');
});
