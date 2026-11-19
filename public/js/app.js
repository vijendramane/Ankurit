(function(){
'use strict';
/* ---------- state ---------- */
var LSK = 'ankurit.v1.';
function lsGet(k, d){ try{ var v = localStorage.getItem(LSK + k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(LSK + k, JSON.stringify(v)); }catch(e){} }
var S = {
  lang: lsGet('lang', 'mr'), state: lsGet('state', 'Maharashtra'), district: lsGet('district', ''),
  cycles: lsGet('cycles', []), store: 'local', uid: null, db: null,
  sample: null, sampleReady: false, imgOk: false, tts: null, dict: null,
  chat: [], scanMode: 'leaf', scanFile: null, scanUrl: null, scanRes: {}, guides: {}, reviews: {}, reco: null,
  libCat: 'all', libQ: '', cycTab: 'overview', speakingId: null
};
var LANGNAME = {en:'English', hi:'Hindi (हिंदी, Devanagari script)', mr:'Marathi (मराठी, Devanagari script)'};
var CATCOL = {cereal:'#B7791F', pulse:'#8B5E3C', oil:'#A16207', cash:'#1D6F42', veg:'#2F7D4F', fruit:'#C2410C', spice:'#B45309'};
var STAGECOL = ['#9BC9A9','#5FAF7B','#E2B33C','#D9920E','#8B5E3C','#6B4D0B'];
var EXPCATS = ['seed','manure','organic','protection','labour','irrigation','machinery','transport','other'];
var ACTS = ['prep','sow','irrigate','manure','spray','weed','scout','harvest','scan','other'];

/* ---------- helpers ---------- */
function t(k, v){ var s = (T[S.lang] && T[S.lang][k]) || T.en[k] || k; if(v) for(var x in v) s = s.split('{' + x + '}').join(v[x]); return s; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function L(o){ return o ? (o[S.lang] || o.en || '') : ''; }
function crop(id){ for(var i = 0; i < CROPS.length; i++) if(CROPS[i].id === id) return CROPS[i]; return null; }
function first(s){ return Array.from(String(s))[0] || ''; }
function $(s, c){ return (c || document).querySelector(s); }
function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
function uid(p){ return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function today0(){ var d = new Date(); d.setHours(0,0,0,0); return d; }
function isoDate(d){ var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
function parseD(s){ var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : today0(); }
function addDays(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function diffDays(a, b){ return Math.round((a - b) / 86400000); }
function fmtD(d){ return d.getDate() + ' ' + MONTHS[S.lang][d.getMonth()] + ' ' + d.getFullYear(); }
function fmtDs(d){ return d.getDate() + ' ' + MONTHS[S.lang][d.getMonth()]; }
function num(n, dp){ var loc = S.lang === 'en' ? 'en-IN' : (S.lang === 'hi' ? 'hi-IN' : 'mr-IN'); try{ return Number(n).toLocaleString(loc, {maximumFractionDigits: dp == null ? 2 : dp}); }catch(e){ return String(n); } }
function rs(n){ return '₹' + num(Math.round(n), 0); }
function seasonNow(){ var m = new Date().getMonth() + 1; return (m >= 6 && m <= 9) ? 'kharif' : ((m >= 10 || m <= 1) ? 'rabi' : 'zaid'); }
function place(){ return S.district ? (S.district + ', ' + S.state) : (S.state || 'India'); }
function sowText(c){ return c.sow.map(function(m){ return MONTHS[S.lang][m - 1]; }).join(', '); }
function avgDur(c){ return Math.round((c.d[0] + c.d[1]) / 2); }
function stagesFor(c, dur){ var set = STAGESETS[c.st]; return set.map(function(s, i){ var start = Math.round(dur * s[1] / 100), end = i < set.length - 1 ? Math.round(dur * set[i + 1][1] / 100) : dur; return {k: s[0], start: start, end: end}; }); }
function stripMd(s){ return String(s).replace(/[#*_`>|]/g, '').replace(/\n{2,}/g, '\n'); }

var ICONS = {
 home:'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
 book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
 scan:'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
 leaf:'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6',
 bug:'M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3 3 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6zM12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4',
 sprout:'M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z',
 chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
 map:'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15',
 jar:'M8 2h8M9 2v3.5L5.5 9A3 3 0 0 0 5 10.7V20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9.3a3 3 0 0 0-.5-1.7L15 5.5V2M7 14h10',
 plus:'M12 5v14M5 12h14', arrowr:'M5 12h14M13 6l6 6-6 6', arrowl:'M19 12H5M11 18l-6-6 6-6', check:'M20 6 9 17l-5-5', x:'M18 6 6 18M6 6l12 12',
 trash:'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
 mic:'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
 vol:'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14', stop:'M6 6h12v12H6z', send:'M22 2 11 13M22 2l-7 20-4-9-9-4z',
 search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35',
 phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
 ext:'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', chev:'M6 9l6 6 6-6',
 cal:'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18', alert:'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
 info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
 camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
 spark:'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z',
 shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', drop:'M12 2.7l5.7 5.6a8 8 0 1 1-11.3 0z',
 flask:'M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
 refresh:'M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5', rupee:'M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10',
 sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
 edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', pin:'M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
};
function I(n, cls){ return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + ICONS[n] + '"/></svg>'; }
var MARK = '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="none"><path d="M16 28V15" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M16 17c0-5 3.5-8.5 9.5-9-.3 6-4 9.2-9.5 9z" fill="#E9B949"/><path d="M16 20c0-4.5-3-7.5-8.5-8 .3 5.3 3.5 8 8.5 8z" fill="#fff"/><path d="M6 28h20" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';

/* ---------- markdown (safe) ---------- */
function inl(s){ return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>'); }
function md(src){
  var lines = esc(src).split(/\r?\n/), out = [], list = null, para = [], tbl = [];
  function flushP(){ if(para.length){ out.push('<p>' + inl(para.join(' ')) + '</p>'); para = []; } }
  function flushL(){ if(list){ out.push('</' + list + '>'); list = null; } }
  function flushT(){ if(tbl.length){ var h = '<table>'; tbl.forEach(function(r, i){ if(/^\|?\s*:?-{2,}/.test(r)) return; var cells = r.replace(/^\||\|$/g, '').split('|'); h += '<tr>' + cells.map(function(c){ return (i === 0 ? '<th>' : '<td>') + inl(c.trim()) + (i === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'; }); out.push(h + '</table>'); tbl = []; } }
  lines.forEach(function(l){
    var m;
    if(/^\s*\|.*\|\s*$/.test(l)){ flushP(); flushL(); tbl.push(l.trim()); return; } else flushT();
    if((m = l.match(/^\s*(#{1,4})\s+(.*)$/))){ flushP(); flushL(); var lv = Math.min(4, m[1].length + 1); out.push('<h' + lv + '>' + inl(m[2]) + '</h' + lv + '>'); }
    else if((m = l.match(/^\s*[-*•]\s+(.*)$/))){ flushP(); if(list !== 'ul'){ flushL(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inl(m[1]) + '</li>'); }
    else if((m = l.match(/^\s*\d+[.)]\s+(.*)$/))){ flushP(); if(list !== 'ol'){ flushL(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inl(m[1]) + '</li>'); }
    else if(!l.trim()){ flushP(); flushL(); }
    else { flushL(); para.push(l.trim()); }
  });
  flushP(); flushL(); flushT();
  return out.join('');
}

/* ---------- capabilities ---------- */
function use(n){ try{ return (window.ANK && window.ANK[n]) ? Promise.resolve(window.ANK[n]()).catch(function(){ return null; }) : Promise.resolve(null); }catch(e){ return Promise.resolve(null); } }
function aiMsg(e){ var c = e && e.code; if(c === 'rate_limited') return t('err_rate'); if(c === 'image_rejected' || c === 'images_unavailable') return t('err_img'); if(c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') return t('ai_off'); return t('err'); }
function aiLangRule(){ return 'Write the ENTIRE answer in ' + LANGNAME[S.lang] + '. Use simple words a farmer understands. Units: acre, guntha, kg, quintal, litre, ₹.'; }
function ctxRule(){ return 'Farmer location: ' + place() + ', India. Today: ' + fmtD(new Date()) + ' (season: ' + T.en[seasonNow()] + ').'; }

function initCaps(){
  use('sample').then(function(s){ S.sample = s; S.sampleReady = true; if(s && s.limits){ s.limits().then(function(l){ S.imgOk = !!(l && l.images); refreshAI(); }).catch(function(){ refreshAI(); }); } else refreshAI(); });
  use('tts').then(function(x){ S.tts = x; });
  use('dictation').then(function(x){ S.dict = x; refreshAI(); });
  Promise.all([use('db'), use('user')]).then(function(r){
    var db = r[0], user = r[1];
    if(!db || !user || !user.id) return;
    user.id().then(function(id){
      if(!id) return;
      S.db = db; S.uid = id;
      var gotFirst = false;
      var timer = setTimeout(function(){ if(!gotFirst){ S.db = null; } }, 10000);
      try{
        db.collection('data/users/' + id).onSnapshot(function(snap){
          if(!gotFirst && snap.metadata && snap.metadata.fromCache) return;
          var list = snap.docs.filter(function(d){ return d.id.indexOf('c-') === 0; }).map(function(d){ return JSON.parse(JSON.stringify(d.data())); });
          if(!gotFirst && !(snap.metadata && snap.metadata.fromCache)){
            gotFirst = true; clearTimeout(timer);
            if(!list.length && S.cycles.length){ var local = S.cycles.slice(); S.store = 'cloud'; local.forEach(function(c){ writeCycle(c); }); return; }
          }
          S.store = 'cloud';
          list.sort(function(a, b){ return (b.created || 0) - (a.created || 0); });
          S.cycles = list; lsSet('cycles', list);
          softRender();
        }, function(){ clearTimeout(timer); S.store = 'local'; S.db = null; softRender(); });
      }catch(e){ clearTimeout(timer); }
    });
  });
}
function refreshAI(){ if(['crop','planner','scan','ai','cycle'].indexOf(route().v) > -1) softRender(); }

/* ---------- storage ---------- */
var wq = {};
function writeCycle(c){
  var i = S.cycles.findIndex(function(x){ return x.id === c.id; });
  if(i > -1) S.cycles[i] = c; else S.cycles.unshift(c);
  lsSet('cycles', S.cycles);
  if(S.store === 'cloud' && S.db && S.uid){
    var body = JSON.parse(JSON.stringify(c));
    wq[c.id] = (wq[c.id] || Promise.resolve()).then(function(){ return S.db.collection('data/users/' + S.uid).doc(c.id).set(body); }).catch(function(e){ if(e && e.code === 'invalid_argument'){ S.store = 'local'; softRender(); } });
  }
}
function removeCycle(id){
  S.cycles = S.cycles.filter(function(x){ return x.id !== id; }); lsSet('cycles', S.cycles);
  if(S.store === 'cloud' && S.db && S.uid){ wq[id] = (wq[id] || Promise.resolve()).then(function(){ return S.db.collection('data/users/' + S.uid).doc(id).delete(); }).catch(function(){}); }
}
function cyc(id){ for(var i = 0; i < S.cycles.length; i++) if(S.cycles[i].id === id) return S.cycles[i]; return null; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ---------- cycle maths ---------- */
function cycInfo(c){
  var cr = crop(c.crop) || CROPS[0], dur = avgDur(cr), sow = parseD(c.sow), now = today0();
  var day = diffDays(now, sow) + 1, st = stagesFor(cr, dur), cur = null;
  st.forEach(function(s){ if(day - 1 >= s.start) cur = s; });
  var spent = (c.exp || []).reduce(function(a, e){ return a + (+e.amt || 0); }, 0);
  var inc = (c.inc || []).reduce(function(a, e){ return a + (+e.qty || 0) * (+e.rate || 0); }, 0);
  return {cr: cr, dur: dur, sow: sow, day: day, stages: st, cur: cur, pct: Math.max(0, Math.min(100, (day - 1) / dur * 100)), spent: spent, inc: inc, profit: inc - spent,
    h1: addDays(sow, cr.d[0]), h2: addDays(sow, cr.d[1]), done: day > cr.d[1] + 15};
}
function buildTasks(){
  var now = today0(), out = [];
  S.cycles.forEach(function(c){
    var x = cycInfo(c); if(x.done) return; var name = L(x.cr.n) + (c.plot ? ' · ' + c.plot : '');
    for(var k = 15; k < x.dur * 0.85; k += 15){ var d = addDays(x.sow, k); var dd = diffDays(d, now); if(dd >= 0){ out.push({d: d, dd: dd, title: t('task_jeev'), sub: name, cid: c.id}); break; } }
    x.stages.forEach(function(s, i){ if(i === 0) return; var d = addDays(x.sow, s.start), dd = diffDays(d, now); if(dd >= 0 && dd <= 30) out.push({d: d, dd: dd, title: t('task_stage', {s: t('st_' + s.k)}), sub: name, cid: c.id}); });
    if(x.day >= 1){ var nxt = 7 - ((x.day - 1) % 7); if(nxt === 7) nxt = 0; out.push({d: addDays(now, nxt), dd: nxt, title: t('task_scout'), sub: name, cid: c.id}); }
    var hd = diffDays(x.h1, now); if(hd >= 0 && hd <= 45) out.push({d: x.h1, dd: hd, title: t('task_harvest'), sub: name + ' · ' + fmtDs(x.h1) + ' – ' + fmtDs(x.h2), cid: c.id});
  });
  out.sort(function(a, b){ return a.dd - b.dd; });
  return out.slice(0, 7);
}

/* ---------- router ---------- */
function route(){ var h = (location.hash || '#home').slice(1); var m;
  if((m = h.match(/^crop-([a-z]+)$/))) return {v:'crop', id:m[1]};
  if((m = h.match(/^cycle-(c-[a-z0-9]+)$/))) return {v:'cycle', id:m[1]};
  if(['home','crops','planner','scan','farm','organic','ai'].indexOf(h) > -1) return {v:h};
  return {v:'home'};
}
var NAV = [['home','home','nav_home'],['crops','book','nav_crops'],['planner','map','nav_planner'],['scan','scan','nav_scan'],['farm','sprout','nav_farm'],['organic','jar','nav_organic'],['ai','chat','nav_ai']];
function navKey(v){ return v === 'crop' ? 'crops' : (v === 'cycle' ? 'farm' : v); }

/* ---------- shell ---------- */
function shell(){
  var r = route(), nk = navKey(r.v);
  var side = '<aside class="side" aria-label="' + esc(t('app')) + '"><a class="logo" href="#home"><span class="mk">' + MARK + '</span><span><b>' + esc(t('app')) + '</b><small>' + esc(t('tagline')) + '</small></span></a><nav class="snav">' +
    NAV.map(function(n, i){ return (i === 3 ? '<div class="sep"></div>' : '') + '<a href="#' + n[0] + '" class="' + (nk === n[0] ? 'on' : '') + '"' + (nk === n[0] ? ' aria-current="page"' : '') + '>' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') +
    '</nav><div class="foot"><b>' + esc(t('helpline')) + '</b><a href="tel:18001801551" style="color:#4D3706;font-weight:700;text-decoration:none">1800-180-1551</a></div></aside>';
  var titles = {home:t('app'), crops:t('nav_crops'), crop:t('nav_crops'), planner:t('nav_planner'), scan:t('scan_title'), farm:t('nav_farm'), cycle:t('nav_farm'), organic:t('nav_organic'), ai:t('ai_h')};
  var top = '<header class="top" id="top"><div class="ttl">' + esc(titles[r.v]) + '</div><a class="logo mlogo" href="#home" style="padding:0"><span class="mk" style="width:36px;height:36px;border-radius:11px">' + MARK + '</span><span><b style="font-size:19px">' + esc(t('app')) + '</b></span></a>' +
    '<div class="lang" role="group" aria-label="' + esc(t('language')) + '">' + [['mr','मरा'],['hi','हिं'],['en','EN']].map(function(l){ return '<button type="button" data-act="lang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '" lang="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div></header>';
  var bn = [['home','home','nav_home'],['crops','book','nav_crops'],['scan','camera','nav_scan'],['farm','sprout','nav_farm'],['ai','chat','nav_ai']];
  var bnav = '<nav class="bnav" aria-label="Main">' + bn.map(function(n){ var on = nk === n[0]; if(n[0] === 'scan') return '<a href="#scan" class="scan' + (on ? ' on' : '') + '"><span class="sc">' + I('camera') + '</span><span>' + esc(t(n[2])) + '</span></a>'; return '<a href="#' + n[0] + '" class="' + (on ? 'on' : '') + '">' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') + '</nav>';
  return '<div class="app">' + side + '<div class="main">' + top + '<main class="view" id="view"></main></div></div>' + bnav;
}

/* ---------- views ---------- */
function cropDot(c, big){ return '<span class="' + (big ? 'cbig' : 'cdot') + '" style="background:' + CATCOL[c.cat] + '" aria-hidden="true">' + esc(first(L(c.n))) + '</span>'; }
function locBox(){
  var ds = DISTRICTS[S.state];
  return '<div class="loc"><span class="lbl">' + esc(t('location')) + '</span>' +
    '<select class="inp" data-act="state" aria-label="' + esc(t('state')) + '">' + STATES.map(function(s){ return '<option' + (s === S.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
    (ds ? '<select class="inp" data-act="district" aria-label="' + esc(t('district')) + '"><option value="">' + esc(t('district')) + ' — ' + esc(t('select')) + '</option>' + ds.map(function(d){ return '<option' + (d === S.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>'
        : '<input class="inp" data-act="district-t" value="' + esc(S.district) + '" placeholder="' + esc(t('type_district')) + '" aria-label="' + esc(t('district')) + '">') + '</div>';
}
var HEROART = '<svg class="art" viewBox="0 120 520 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 200 C120 150 220 170 320 150 S480 120 520 130 V260 H0Z" fill="#2F8F57" opacity=".55"/><path d="M0 230 C140 190 260 210 360 190 S500 180 520 185 V260 H0Z" fill="#1D6F42"/><g stroke="#5FAF7B" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M60 250 C160 220 260 228 360 212"/><path d="M40 262 C150 236 270 242 400 226"/><path d="M120 262 C220 246 330 248 470 236"/></g><g fill="#9BC9A9" opacity=".85"><path d="M300 168c0-10 6-17 16-18-1 10-7 16-16 18z"/><path d="M300 172c0-9-6-15-15-16 1 9 6 15 15 16z"/><path d="M340 160c0-8 5-14 13-15-1 8-6 13-13 15z"/></g></svg>';

function vHome(){
  var se = seasonNow(), sc = CROPS.filter(function(c){ return c.s.indexOf(se) > -1; });
  var tasks = buildTasks();
  var tiles = [['scan','leaf','g','t_doctor','t_doctor_d',1,'leaf'],['scan','bug','r','t_pest','t_pest_d',1,'insect'],['farm','sprout','s','t_farm','t_farm_d',0],['ai','chat','b','t_ai','t_ai_d',1],['crops','book','g','t_lib','t_lib_d',0],['planner','map','o','t_planner','t_planner_d',1],['organic','jar','s','t_organic','t_organic_d',0]];
  var h = '<section class="hero"><div style="position:relative"><span class="seasonpill">' + I('sun') + '<span>' + esc(t('season_now')) + '</span><b>' + esc(t(se)) + '</b></span><h1 style="margin-top:16px">' + esc(t('greet')) + '!</h1><p>' + esc(t('greet_sub')) + '</p><div class="row wrap"><a class="btn" style="background:#fff;color:var(--g2)" href="#scan">' + I('camera') + esc(t('t_doctor')) + '</a><a class="btn" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)" href="#ai">' + I('chat') + esc(t('t_ai')) + '</a></div></div>' + locBox() + HEROART + '</section>';
  h += '<div class="tiles">' + tiles.map(function(x){ return '<a class="tile" href="#' + x[0] + '"' + (x[6] ? ' data-act="scanmode" data-v="' + x[6] + '"' : '') + '><span class="ico ' + x[2] + '">' + I(x[1]) + '</span><b>' + esc(t(x[3])) + (x[5] ? ' <span class="ai-dot">AI</span>' : '') + '</b><span class="d">' + esc(t(x[4], {n: CROPS.length})) + '</span></a>'; }).join('') + '</div>';
  h += '<div class="h-sec"><h2>' + esc(t('crops_season')) + ' · ' + esc(t(se)) + '</h2><a href="#crops" data-act="libseason" data-v="' + se + '">' + esc(t('see_all')) + ' →</a></div><p class="mu sm" style="margin:-8px 0 12px">' + esc(t('season_' + se + '_d')) + '</p><div class="cropstrip">' + sc.map(function(c){ return '<a class="cmini" href="#crop-' + c.id + '">' + cropDot(c) + esc(L(c.n)) + '</a>'; }).join('') + '</div>';
  h += '<div class="grid g2" style="margin-top:26px;align-items:start"><div><div class="h-sec" style="margin-top:0"><h2>' + esc(t('tasks')) + '</h2><a href="#farm">' + esc(t('nav_farm')) + ' →</a></div><div class="card tasks">' +
    (tasks.length ? tasks.map(function(k){ return '<a class="task" href="#cycle-' + k.cid + '" style="text-decoration:none;color:inherit"><span class="when' + (k.dd === 0 ? ' today' : '') + '"><b>' + k.d.getDate() + '</b><small>' + esc(MONTHS[S.lang][k.d.getMonth()]) + '</small></span><span class="tx"><b>' + esc(k.title) + '</b><span>' + esc(k.sub) + ' · ' + esc(k.dd === 0 ? t('today') : t('in_days', {n: k.dd})) + '</span></span></a>'; }).join('')
      : '<div class="empty"><span class="ico g">' + I('cal') + '</span><p style="margin:0 0 14px">' + esc(t('no_tasks')) + '</p><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div>') + '</div></div>';
  h += '<div style="display:flex;flex-direction:column;gap:16px"><div class="help"><span class="ico s" style="background:#fff">' + I('phone') + '</span><div><b style="display:block">' + esc(t('helpline')) + '</b><a class="num" href="tel:18001801551">1800-180-1551</a><div class="sm" style="color:#6B4D0B">' + esc(t('helpline_d')) + '</div></div></div>' +
    '<div class="card"><div class="pad" style="padding-bottom:6px"><h2 style="font-size:18px">' + esc(t('links')) + '</h2></div><div class="linkrow"><a href="https://agmarknet.gov.in" target="_blank" rel="noopener">' + esc(t('link_mandi')) + I('ext') + '</a><a href="https://enam.gov.in" target="_blank" rel="noopener">' + esc(t('link_enam')) + I('ext') + '</a><a href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">' + esc(t('link_shc')) + I('ext') + '</a></div></div></div></div>';
  return h;
}

function vCrops(){
  var cats = ['all','cereal','pulse','oil','cash','veg','fruit','spice'];
  var q = S.libQ.toLowerCase();
  var list = CROPS.filter(function(c){ return (S.libCat === 'all' || c.cat === S.libCat || c.s.indexOf(S.libCat) > -1) && (!q || (c.n.en + ' ' + c.n.hi + ' ' + c.n.mr).toLowerCase().indexOf(q) > -1); });
  var h = '<div class="ph"><h1>' + esc(t('t_lib')) + '</h1><p>' + esc(t('t_lib_d', {n: CROPS.length})) + '</p></div>';
  h += '<div class="toolbar"><div class="search">' + I('search') + '<input class="inp" type="search" data-act="libq" value="' + esc(S.libQ) + '" placeholder="' + esc(t('search_crops')) + '" aria-label="' + esc(t('search_crops')) + '"></div></div>';
  h += '<div class="chips" role="group" style="margin-bottom:18px">' + cats.concat(['kharif','rabi','zaid']).map(function(c){ return '<button type="button" data-act="libcat" data-v="' + c + '" aria-pressed="' + (S.libCat === c) + '">' + esc(c === 'all' ? t('all') : (['kharif','rabi','zaid'].indexOf(c) > -1 ? t(c) : t('cat_' + c))) + '</button>'; }).join('') + '</div>';
  h += '<div class="cgrid" id="cgrid">' + cropCards(list) + '</div>';
  return h;
}
function cropCards(list){
  if(!list.length) return '<div class="empty" style="grid-column:1/-1">—</div>';
  return list.map(function(c){ var alt = S.lang === 'en' ? c.n.mr + ' · ' + c.n.hi : c.n.en;
    return '<a class="ccard" href="#crop-' + c.id + '"><div class="hd">' + cropDot(c, true) + '<div><h3>' + esc(L(c.n)) + '</h3><div class="alt">' + esc(alt) + '</div></div></div><div class="meta">' + c.s.map(function(s){ return '<span class="chip g">' + esc(t(s)) + '</span>'; }).join('') + '<span class="chip">' + c.d[0] + '–' + c.d[1] + ' ' + esc(t('days')) + '</span><span class="chip b">' + I('drop', '') .replace('<svg', '<svg width="14" height="14" stroke="currentColor"') + esc(t(c.w)) + '</span></div></a>'; }).join('');
}

function vCrop(id){
  var c = crop(id); if(!c) return vCrops();
  var dur = avgDur(c), st = stagesFor(c, dur), key = c.id + '|' + S.lang + '|' + place();
  var h = '<div class="dhead"><a class="btn bs bsm" href="#crops">' + I('arrowl') + esc(t('back')) + '</a></div>';
  h += '<div class="dhead" style="margin-top:0">' + cropDot(c, true) + '<div style="flex:1;min-width:200px"><h1>' + esc(L(c.n)) + '</h1><div class="mu">' + esc(S.lang === 'en' ? c.n.mr + ' · ' + c.n.hi : c.n.en) + ' · ' + esc(t('cat_' + c.cat)) + '</div></div><button class="btn bp" data-act="newcycle" data-v="' + c.id + '">' + I('plus') + esc(t('start_track')) + '</button></div>';
  h += '<div class="facts">' + [['season', c.s.map(function(s){ return t(s); }).join(', ')], ['duration', c.d[0] + '–' + c.d[1] + ' ' + t('days')], ['sowing', sowText(c)], ['soil', c.soil.map(function(s){ return t('soil_' + s); }).join(', ')], ['water', t(c.w)], ['temp', c.t]].map(function(f){ return '<div class="fact"><small>' + esc(t(f[0])) + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>';
  h += '<div class="card pad" style="margin-top:16px"><h2 style="font-size:19px">' + esc(t('stages')) + '</h2><div class="stagebar">' + st.map(function(s, i){ return '<i style="flex:' + Math.max(1, s.end - s.start) + ';background:' + STAGECOL[i] + '"></i>'; }).join('') + '</div><div class="stagelist">' + st.map(function(s, i){ return '<div><i style="background:' + STAGECOL[i] + '"></i><span>' + esc(t('st_' + s.k)) + '<small>' + esc(t('day_n', {n: s.start + 1})) + ' – ' + s.end + '</small></span></div>'; }).join('') + '</div><p class="xs mu2" style="margin:12px 0 0">' + esc(t('approx')) + '</p></div>';
  h += '<div class="grid g2" style="margin-top:16px"><div class="card pad"><h2 style="font-size:19px;margin-bottom:12px;display:flex;gap:8px;align-items:center"><span class="ico r" style="width:36px;height:36px;border-radius:10px">' + I('bug') + '</span>' + esc(t('pests')) + '</h2><div class="row wrap" style="gap:8px">' + c.p.map(function(p){ return '<span class="chip r">' + esc(L(PESTS[p])) + '</span>'; }).join('') + '</div><h2 style="font-size:19px;margin:20px 0 12px;display:flex;gap:8px;align-items:center"><span class="ico s" style="width:36px;height:36px;border-radius:10px">' + I('alert') + '</span>' + esc(t('diseases')) + '</h2><div class="row wrap" style="gap:8px">' + c.ds.map(function(d){ return '<span class="chip s">' + esc(L(DISEASES[d])) + '</span>'; }).join('') + '</div><div class="row wrap" style="margin-top:18px"><a class="btn bs bsm" href="#scan" data-act="scanmode" data-v="leaf">' + I('leaf') + esc(t('t_doctor')) + '</a><a class="btn bs bsm" href="#scan" data-act="scanmode" data-v="insect">' + I('bug') + esc(t('t_pest')) + '</a></div></div>';
  h += '<div class="card pad"><h2 style="font-size:19px;margin-bottom:14px;display:flex;gap:8px;align-items:center"><span class="ico g" style="width:36px;height:36px;border-radius:10px">' + I('leaf') + '</span>' + esc(t('organic_plan')) + '</h2><ul class="ulist">' + ['op1','op2','op3','op4','op5','op6','op7'].map(function(k){ return '<li>' + I('check') + '<span>' + esc(t(k)) + '</span></li>'; }).join('') + '</ul><a class="btn bg bsm" style="margin-top:12px;padding-left:0" href="#organic">' + esc(t('t_organic')) + ' →</a></div></div>';
  var g = S.guides[key];
  h += '<div class="aibox" style="margin-top:16px"><div class="hd"><div style="display:flex;gap:14px;align-items:flex-start"><span class="ico s">' + I('spark') + '</span><div><h2 style="font-size:20px">' + esc(t('ai_guide')) + '</h2><p class="mu sm" style="margin:4px 0 0;max-width:620px">' + esc(t('ai_guide_d', {place: place()})) + '</p></div></div>' + aiButtons('guide', c.id, g) + '</div><div id="guide-out" class="md" style="margin-top:' + (g ? '14px' : '0') + '">' + (g ? (g.text ? md(g.text) : '') + (g.busy ? '<div class="load"><span class="spin"></span>' + esc(g.text ? '' : t('thinking')) + '</div>' : '') + (g.err ? '<div class="note r">' + I('alert') + esc(g.err) + '</div>' : '') : '') + '</div>' + (g && g.text && !g.busy ? '<p class="xs mu2" style="margin:14px 0 0">' + esc(t('disclaimer')) + '</p>' : '') + '</div>';
  return h;
}
function aiButtons(kind, id, g){
  if(S.sampleReady && !S.sample) return '<div class="note" style="max-width:360px">' + I('info') + esc(t('ai_off')) + '</div>';
  if(g && g.busy) return '<button class="btn bs" data-act="ai-stop" data-k="' + kind + '">' + I('stop') + esc(t('stop_gen')) + '</button>';
  var lbl = kind === 'guide' ? (g && g.text ? t('regen') : t('gen_guide')) : t('get_review');
  return '<div class="row">' + (g && g.text ? speakBtn(kind + id) : '') + '<button class="btn bp" data-act="' + kind + '" data-v="' + id + '"' + (S.sampleReady ? '' : ' disabled') + '>' + I(g && g.text ? 'refresh' : 'spark') + esc(lbl) + '</button></div>';
}
function speakBtn(sid){ if(!S.tts) return ''; var on = S.speakingId === sid; return '<button class="btn bs bsm" data-act="speak" data-v="' + sid + '">' + I(on ? 'stop' : 'vol') + esc(on ? t('stop') : t('listen')) + '</button>'; }

var ctl = {};
function runGuide(id){
  var c = crop(id), key = c.id + '|' + S.lang + '|' + place(), regen = !!(S.guides[key] && S.guides[key].text);
  var prompt = 'You are an experienced Indian agronomist and natural-farming advisor. Write a complete, practical crop guide for ' + c.n.en + ' (' + c.n.hi + ' / ' + c.n.mr + ').\n' + ctxRule() + '\n' + aiLangRule() + '\n' +
    'Use Markdown with these ## sections, each short and actionable:\n1. Best season and sowing window for this area\n2. Suitable varieties (only name well-known released varieties you are confident about; tell the farmer to confirm locally)\n3. Land preparation and soil\n4. Seed rate, spacing and seed treatment (Beejamrut/biological first)\n5. Nutrient plan — organic first (FYM/compost, Ghanjeevamrut, Jeevamrut, biofertilizers); then the general chemical recommendation as a reference\n6. Irrigation by crop stage\n7. Weed management\n8. Major pests and diseases: symptoms, organic control, and when to escalate\n9. Harvest, typical yield range per acre, storage\n10. Ways to cut cost and raise profit\nGive ranges and say "approximately" instead of exact claims. Do not invent statistics. End with one line advising to confirm with the local Krishi Vigyan Kendra.';
  S.guides[key] = {text: '', busy: true}; softRender();
  ctl.guide = new AbortController();
  S.sample(prompt, {signal: ctl.guide.signal, cache: regen ? {gcTime: 86400000, refresh: true} : {gcTime: 86400000}, onText: function(u){ S.guides[key].text = u.text; patchGuide(key); }})
   .then(function(r){ S.guides[key] = {text: r.text}; softRender(); })
   .catch(function(e){ var g = S.guides[key]; g.busy = false; g.text = e.text || g.text || ''; if(e.code !== 'cancelled') g.err = aiMsg(e); softRender(); });
}
function patchGuide(key){ var el = $('#guide-out'); if(el && route().v === 'crop'){ el.innerHTML = md(S.guides[key].text) + '<div class="load"><span class="spin"></span></div>'; } }

/* planner */
function vPlanner(){
  var se = S.plSeason || seasonNow(), w = S.plWater || 'medium';
  var h = '<div class="ph"><h1>' + esc(t('planner_h')) + '</h1><p>' + esc(t('planner_d')) + '</p></div>';
  h += '<div class="card pad"><div class="grid g3" style="align-items:end">' +
    '<label class="f">' + esc(t('state')) + '<select class="inp" data-act="state">' + STATES.map(function(s){ return '<option' + (s === S.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('district')) + (DISTRICTS[S.state] ? '<select class="inp" data-act="district"><option value="">' + esc(t('select')) + '</option>' + DISTRICTS[S.state].map(function(d){ return '<option' + (d === S.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>' : '<input class="inp" data-act="district-t" value="' + esc(S.district) + '" placeholder="' + esc(t('type_district')) + '">') + '</label>' +
    '<label class="f">' + esc(t('season')) + '<select class="inp" data-act="plseason">' + ['kharif','rabi','zaid'].map(function(s){ return '<option value="' + s + '"' + (s === se ? ' selected' : '') + '>' + esc(t(s)) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="row wrap" style="margin-top:16px;justify-content:space-between"><div><div class="sm mu" style="margin-bottom:6px;font-weight:500">' + esc(t('land')) + '</div><div class="seg" role="group">' + [['low','irr_rainfed'],['medium','irr_sprinkler'],['high','irr_flood']].map(function(x){ return '<button type="button" data-act="plwater" data-v="' + x[0] + '" aria-pressed="' + (w === x[0]) + '">' + esc(t(x[0])) + '</button>'; }).join('') + '</div></div>' +
    (S.sampleReady && !S.sample ? '<div class="note">' + I('info') + esc(t('ai_off')) + '</div>' : '<button class="btn bp" data-act="reco"' + ((S.reco && S.reco.busy) || !S.sampleReady ? ' disabled' : '') + '>' + I('spark') + esc(t('get_reco')) + '</button>') + '</div></div>';
  var r = S.reco;
  if(r && r.busy) h += '<div class="card pad" style="margin-top:16px"><div class="load"><span class="spin"></span>' + esc(t('thinking')) + '</div></div>';
  if(r && r.err) h += '<div class="note r" style="margin-top:16px">' + I('alert') + esc(r.err) + '</div>';
  if(r && r.data && r.data.crops){
    h += '<div class="h-sec"><h2>' + esc(place()) + ' · ' + esc(t(r.season)) + '</h2></div><div class="grid g2">' + r.data.crops.map(function(x, i){ var c = crop(String(x.id || '')); return '<div class="card pad" style="display:flex;flex-direction:column;gap:10px"><div class="row"><span class="cbig" style="background:' + (c ? CATCOL[c.cat] : '#2F7D4F') + ';width:44px;height:44px;font-size:18px">' + (i + 1) + '</span><div style="flex:1"><h3 style="font-size:19px">' + esc(x.name) + '</h3><div class="row wrap" style="gap:6px;margin-top:4px">' + (x.duration ? '<span class="chip">' + esc(x.duration) + '</span>' : '') + (x.water ? '<span class="chip b">' + esc(t(String(x.water)) ) + '</span>' : '') + '</div></div></div><p style="margin:0"><b>' + esc(t('reco_why')) + ':</b> ' + esc(x.why) + '</p>' + (x.tip ? '<p class="sm" style="margin:0;color:var(--g2);background:var(--gl);padding:10px 12px;border-radius:10px"><b>' + esc(t('reco_tip')) + ':</b> ' + esc(x.tip) + '</p>' : '') + (c ? '<a class="btn bg bsm" style="align-self:flex-start;padding-left:0" href="#crop-' + c.id + '">' + esc(t('t_lib')) + ' →</a>' : '') + '</div>'; }).join('') + '</div>' + (r.data.note ? '<div class="note g" style="margin-top:14px">' + I('info') + esc(r.data.note) + '</div>' : '') + '<p class="xs mu2" style="margin-top:12px">' + esc(t('disclaimer')) + '</p>';
  }
  var stat = CROPS.filter(function(c){ return c.s.indexOf(se) > -1; });
  h += '<div class="h-sec"><h2>' + esc(t('reco_static', {s: t(se)})) + '</h2></div><div class="cgrid">' + cropCards(stat) + '</div>';
  return h;
}
function runReco(){
  var se = S.plSeason || seasonNow(), w = S.plWater || 'medium';
  S.reco = {busy: true, season: se}; softRender();
  var ids = CROPS.map(function(c){ return c.id + '=' + c.n.en; }).join(', ');
  var prompt = 'You are an Indian agronomist. Recommend the 6 most suitable crops for a farmer.\n' + ctxRule() + '\nTarget season: ' + T.en[se] + '. Water availability: ' + w + ' (low = rainfed, medium = limited irrigation, high = assured irrigation).\nConsider the typical soil, rainfall and markets of this district. Prefer profitable, low-risk options and mention intercropping where useful.\n' + aiLangRule() + '\nReply with ONLY JSON: {"crops":[{"id":"<id from this list or empty>","name":"<crop name in the answer language>","why":"<1-2 sentences>","duration":"<e.g. 100–120 days, in the answer language>","water":"low|medium|high","tip":"<one practical tip>"}],"note":"<one short caution or general advice>"}\nKnown ids: ' + ids;
  S.sample.json(prompt, {cache: {gcTime: 86400000}}).then(function(d){ S.reco = {data: d && d.crops ? d : {crops: []}, season: se}; softRender(); }).catch(function(e){ S.reco = {err: aiMsg(e), season: se}; softRender(); });
}

/* scan */
function vScan(){
  var m = S.scanMode, res = S.scanRes[m];
  var h = '<div class="ph"><h1>' + esc(t('scan_title')) + '</h1></div><div class="seg" role="group" style="margin-bottom:18px"><button type="button" data-act="scanmode" data-v="leaf" aria-pressed="' + (m === 'leaf') + '">' + esc(t('scan_leaf')) + '</button><button type="button" data-act="scanmode" data-v="insect" aria-pressed="' + (m === 'insect') + '">' + esc(t('scan_insect')) + '</button></div>';
  h += '<div class="scanwrap"><div class="card pad" style="display:flex;flex-direction:column;gap:14px"><h2 style="font-size:20px">' + esc(t(m === 'leaf' ? 'leaf_h' : 'insect_h')) + '</h2>';
  if(S.sampleReady && (!S.sample || !S.imgOk)) h += '<div class="note">' + I('info') + esc(t('ai_off')) + '</div>';
  h += '<label class="drop" id="drop">' + (S.scanUrl ? '<img src="' + S.scanUrl + '" alt="">' + '<span class="btn bs bsm">' + I('camera') + esc(t('change_photo')) + '</span>' : '<span class="ico g" style="width:64px;height:64px;border-radius:20px">' + I('camera') + '</span><b>' + esc(t('upload')) + '</b><span class="sm mu">' + esc(t(m === 'leaf' ? 'tips_leaf' : 'tips_insect')) + '</span>') + '<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-act="scanfile" aria-label="' + esc(t('upload')) + '"></label>';
  h += '<label class="f">' + esc(t('crop_opt')) + '<select class="inp" id="scancrop"><option value="">—</option>' + CROPS.map(function(c){ return '<option value="' + c.id + '"' + (S.scanCrop === c.id ? ' selected' : '') + '>' + esc(L(c.n)) + '</option>'; }).join('') + '</select></label>';
  h += '<label class="f">' + esc(t('notes_opt')) + '<input class="inp" id="scannote" value="' + esc(S.scanNote || '') + '"></label>';
  h += '<button class="btn bp" data-act="analyze"' + (!S.scanFile || (res && res.busy) || !S.imgOk ? ' disabled' : '') + '>' + I('spark') + esc(t('analyze')) + '</button><p class="xs mu2" style="margin:0">' + esc(t('disclaimer')) + '</p></div>';
  h += '<div class="result" id="scanres">' + scanResult(m, res) + '</div></div>';
  return h;
}
function lvl(v){ v = String(v || '').toLowerCase(); return v.indexOf('high') > -1 ? 'h' : (v.indexOf('med') > -1 ? 'm' : 'l'); }
function lvlT(v){ var k = lvl(v); return t(k === 'h' ? 'high' : (k === 'm' ? 'medium' : 'low')); }
function liList(a){ a = Array.isArray(a) ? a : (a ? [a] : []); return a.length ? '<ul>' + a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
function scanResult(m, r){
  if(!r) return '<div class="card empty"><span class="ico ' + (m === 'leaf' ? 'g' : 'r') + '">' + I(m === 'leaf' ? 'leaf' : 'bug') + '</span><p style="margin:0">' + esc(t(m === 'leaf' ? 't_doctor_d' : 't_pest_d')) + '</p></div>';
  if(r.busy) return '<div class="card pad"><div class="load"><span class="spin"></span>' + esc(t('analyzing')) + '</div></div>';
  if(r.err) return '<div class="note r">' + I('alert') + esc(r.err) + '</div>';
  var d = r.data || {}, sid = 'scan' + m, h = '';
  if(d.imageOk === false){ return '<div class="rhead"><span class="ico s">' + I('camera') + '</span><div><h2>' + esc(t('retake')) + '</h2><p class="mu" style="margin:6px 0 0">' + esc(d.retake || '') + '</p></div></div>'; }
  if(m === 'leaf'){
    var healthy = String(d.status || '').toLowerCase() === 'healthy';
    h += '<div class="rhead"><span class="ico ' + (healthy ? 'g' : 'r') + '">' + I(healthy ? 'check' : 'alert') + '</span><div style="flex:1"><div class="xs mu2" style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">' + esc(t('r_problem')) + (d.plant ? ' · ' + esc(d.plant) : '') + '</div><h2>' + esc(healthy ? t('healthy') : (d.problem || '—')) + '</h2>' + (d.problem_en && S.lang !== 'en' ? '<div class="sub">' + esc(d.problem_en) + '</div>' : '') +
      '<div class="row wrap" style="margin-top:10px;gap:18px"><span class="sm">' + esc(t('r_conf')) + ' <span class="meter ' + lvl(d.confidence) + '" style="display:inline-flex;vertical-align:middle;margin-left:6px"><i></i><i></i><i></i></span> ' + esc(lvlT(d.confidence)) + '</span>' + (!healthy ? '<span class="sm">' + esc(t('r_sev')) + ' <span class="meter sev ' + lvl(d.severity) + '" style="display:inline-flex;vertical-align:middle;margin-left:6px"><i></i><i></i><i></i></span> ' + esc(lvlT(d.severity)) + '</span>' : '') + '</div></div>' + speakBtn(sid) + '</div>';
    if(d.observed && d.observed.length) h += '<div class="rsec"><h3>' + I('scan') + esc(t('r_observed')) + '</h3>' + liList(d.observed) + '</div>';
    if(d.cause) h += '<div class="rsec"><h3>' + I('info') + esc(t('r_cause')) + '</h3><p style="margin:0">' + esc(d.cause) + '</p></div>';
    if(d.organic && d.organic.length) h += '<div class="rsec g"><h3>' + I('leaf') + esc(t('r_organic')) + '</h3>' + liList(d.organic).replace('<ul>', '<ol>').replace('</ul>', '</ol>') + '</div>';
    if(d.prevention && d.prevention.length) h += '<div class="rsec"><h3>' + I('shield') + esc(t('r_prev')) + '</h3>' + liList(d.prevention) + '</div>';
    if(d.chemical) h += '<div class="rsec s"><h3>' + I('flask') + esc(t('r_chem')) + '</h3><p style="margin:0">' + esc(d.chemical) + '</p></div>';
    if(d.expert) h += '<div class="rsec"><h3>' + I('user') + esc(t('r_expert')) + '</h3><p style="margin:0">' + esc(d.expert) + '</p></div>';
  } else {
    var ty = String(d.type || 'unclear').toLowerCase(); if(['harmful','beneficial','neutral','unclear'].indexOf(ty) < 0) ty = 'unclear';
    var tc = ty === 'harmful' ? 'r' : (ty === 'beneficial' ? 'g' : 's');
    h += '<div class="rhead"><span class="ico ' + tc + '">' + I('bug') + '</span><div style="flex:1"><span class="chip ' + tc + '">' + esc(t(ty)) + '</span><h2 style="margin-top:8px">' + esc(d.name || '—') + '</h2>' + (d.scientific ? '<div class="sub">' + esc(d.scientific) + '</div>' : '') + '<div class="sm" style="margin-top:10px">' + esc(t('r_conf')) + ' <span class="meter ' + lvl(d.confidence) + '" style="display:inline-flex;vertical-align:middle;margin-left:6px"><i></i><i></i><i></i></span> ' + esc(lvlT(d.confidence)) + '</div></div>' + speakBtn(sid) + '</div>';
    if(d.crops && d.crops.length) h += '<div class="rsec"><h3>' + I('sprout') + esc(t('r_crops')) + '</h3><div class="row wrap" style="gap:6px">' + (Array.isArray(d.crops) ? d.crops : [d.crops]).map(function(x){ return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div></div>';
    if(d.damage) h += '<div class="rsec"><h3>' + I('alert') + esc(t('r_damage')) + '</h3><p style="margin:0">' + esc(d.damage) + '</p></div>';
    if(d.lifecycle) h += '<div class="rsec"><h3>' + I('refresh') + esc(t('r_life')) + '</h3><p style="margin:0">' + esc(d.lifecycle) + '</p></div>';
    if(d.threshold) h += '<div class="rsec"><h3>' + I('info') + esc(t('r_threshold')) + '</h3><p style="margin:0">' + esc(d.threshold) + '</p></div>';
    if(d.organic && d.organic.length) h += '<div class="rsec g"><h3>' + I('leaf') + esc(t('r_organic')) + '</h3>' + liList(d.organic).replace('<ul>', '<ol>').replace('</ul>', '</ol>') + '</div>';
    if(d.natural_enemies && d.natural_enemies.length) h += '<div class="rsec"><h3>' + I('shield') + esc(t('r_enemies')) + '</h3>' + liList(d.natural_enemies) + '</div>';
    if(d.chemical) h += '<div class="rsec s"><h3>' + I('flask') + esc(t('r_chem')) + '</h3><p style="margin:0">' + esc(d.chemical) + '</p></div>';
  }
  if(S.cycles.length){
    h += '<div class="rsec"><h3>' + I('book') + esc(t('save_diary')) + '</h3><div class="row wrap"><select class="inp" id="diarycyc" style="flex:1;min-width:180px">' + S.cycles.map(function(c){ var cr = crop(c.crop); return '<option value="' + c.id + '">' + esc((cr ? L(cr.n) : c.crop) + (c.plot ? ' · ' + c.plot : '')) + '</option>'; }).join('') + '</select><button class="btn bs" data-act="scansave">' + I(r.saved ? 'check' : 'plus') + esc(r.saved ? t('saved') : t('save_diary')) + '</button></div></div>';
  }
  return h;
}
function scanSpeech(m){ var d = (S.scanRes[m] || {}).data || {}; var parts = m === 'leaf' ? [d.problem, d.cause, (d.organic || []).join('. '), (d.prevention || []).join('. ')] : [d.name, d.damage, (d.organic || []).join('. ')]; return parts.filter(Boolean).join('. '); }
function runScan(){
  var m = S.scanMode, cr = crop(S.scanCrop || ''), note = S.scanNote || '';
  S.scanRes[m] = {busy: true}; softRender();
  var common = ctxRule() + '\n' + (cr ? 'Crop (as told by the farmer): ' + cr.n.en + '.\n' : '') + (note ? 'Farmer note: ' + note + '\n' : '') + aiLangRule() + ' Keep JSON keys in English; write all values in the answer language.\nPrefer organic/natural methods (Neemastra, Dashparni, Trichoderma, traps, cultural practices). Mention a chemical option only as a last resort, as an active ingredient name with "follow label dose", never invent dose numbers.\nIf the photo is not a plant/insect or too unclear to judge, set "imageOk": false and explain how to retake it in "retake".\n';
  var prompt = m === 'leaf'
    ? 'You are a plant pathologist helping an Indian farmer. Look at the attached photo of a plant leaf/part and diagnose its health.\n' + common + 'Reply with ONLY JSON: {"imageOk":true,"retake":"","plant":"<plant name>","status":"healthy|disease|pest_damage|nutrient_deficiency|abiotic|unclear","problem":"<problem name in answer language>","problem_en":"<common English name>","confidence":"low|medium|high","severity":"low|medium|high","observed":["<visible symptom>"],"cause":"<pathogen/cause in simple words>","organic":["<step-by-step organic treatment>"],"prevention":["<prevention>"],"chemical":"<last-resort option or empty>","expert":"<when to contact KVK/agri officer>"}'
    : 'You are an agricultural entomologist helping an Indian farmer. Identify the insect (or pest) in the attached photo.\n' + common + 'Many insects are friendly (ladybird beetles, lacewings, spiders, wasps, bees) — say so clearly if beneficial and advise not to spray.\nReply with ONLY JSON: {"imageOk":true,"retake":"","name":"<common name in answer language>","scientific":"<scientific name if confident, else empty>","type":"harmful|beneficial|neutral|unclear","confidence":"low|medium|high","crops":["<crops it affects>"],"damage":"<how it damages>","lifecycle":"<short life cycle>","threshold":"<when to act>","organic":["<organic control steps>"],"natural_enemies":["<natural enemies>"],"chemical":"<last-resort option or empty>"}';
  S.sample.json(prompt, {images: [S.scanFile]}).then(function(d){ S.scanRes[m] = {data: d || {}}; softRender(); }).catch(function(e){ S.scanRes[m] = {err: aiMsg(e)}; softRender(); });
}

/* farm */
function vFarm(){
  var h = '<div class="ph row wrap" style="justify-content:space-between"><div><h1>' + esc(t('my_crops')) + '</h1><p><span class="storebadge"><i style="background:' + (S.store === 'cloud' ? 'var(--g3)' : 'var(--sun)') + '"></i>' + esc(t(S.store === 'cloud' ? 'store_cloud' : 'store_local')) + '</span></p></div><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div>';
  if(!S.cycles.length) return h + '<div class="card empty"><span class="ico g">' + I('sprout') + '</span><p style="margin:0 0 16px;max-width:420px;margin-inline:auto">' + esc(t('empty_farm')) + '</p><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div>';
  h += '<div class="grid g3">' + S.cycles.map(function(c){ var x = cycInfo(c);
    var stTxt = x.day < 1 ? t('not_sown', {n: 1 - x.day}) : (x.done ? t('done_cycle') : (t('day_n', {n: x.day}) + ' · ' + t('st_' + (x.cur ? x.cur.k : 'germ'))));
    return '<a class="cyc" href="#cycle-' + c.id + '"><div class="hd">' + cropDot(x.cr, true) + '<div style="flex:1;min-width:0"><h3>' + esc(L(x.cr.n)) + '</h3><div class="sm mu">' + esc((c.plot || '') + (c.plot ? ' · ' : '') + num(c.area) + ' ' + t('acres_short')) + '</div></div></div><div><div class="row" style="justify-content:space-between;font-size:14px;margin-bottom:6px"><span>' + esc(stTxt) + '</span><span class="mu2">' + Math.round(x.pct) + '%</span></div><div class="prog"><i style="width:' + x.pct + '%"></i></div></div><div class="row" style="justify-content:space-between;font-size:14px"><span class="mu">' + esc(t('spent')) + ' <b style="color:var(--ink)">' + rs(x.spent) + '</b></span><span class="mu">' + esc(t('exp_harvest')) + ' <b style="color:var(--ink)">' + esc(fmtDs(x.h1)) + '</b></span></div></a>'; }).join('') + '</div>';
  return h;
}
function cycleForm(c, cropId){
  c = c || {crop: cropId || (CROPS[0].id), plot: '', area: 1, unit: 'acre', sow: isoDate(today0()), variety: '', budget: '', irr: 'rainfed'};
  var areaDisp = c.unit === 'guntha' ? c.area * 40 : (c.unit === 'hectare' ? +(c.area / 2.471).toFixed(2) : c.area);
  return '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="box"><h2 id="mh">' + esc(c.id ? t('edit') : t('add_crop')) + '</h2><form id="cform" class="formgrid">' +
    '<label class="f full">' + esc(t('f_crop')) + '<select class="inp" name="crop">' + CROPS.map(function(x){ return '<option value="' + x.id + '"' + (x.id === c.crop ? ' selected' : '') + '>' + esc(L(x.n)) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('f_plot')) + '<input class="inp" name="plot" value="' + esc(c.plot) + '" maxlength="40"></label>' +
    '<label class="f">' + esc(t('f_sow')) + '<input class="inp" type="date" name="sow" value="' + esc(c.sow) + '" required></label>' +
    '<label class="f">' + esc(t('f_area')) + '<input class="inp" type="number" name="area" min="0.01" step="0.01" value="' + esc(areaDisp) + '" required></label>' +
    '<label class="f">&nbsp;<select class="inp" name="unit" aria-label="' + esc(t('f_area')) + '">' + ['acre','guntha','hectare'].map(function(u){ return '<option value="' + u + '"' + (u === (c.unit || 'acre') ? ' selected' : '') + '>' + esc(t(u)) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('f_variety')) + '<input class="inp" name="variety" value="' + esc(c.variety) + '" maxlength="40"></label>' +
    '<label class="f">' + esc(t('f_budget')) + '<input class="inp" type="number" name="budget" min="0" step="100" value="' + esc(c.budget) + '"></label>' +
    '<label class="f full">' + esc(t('f_irr')) + '<select class="inp" name="irr">' + ['rainfed','drip','sprinkler','flood'].map(function(u){ return '<option value="' + u + '"' + (u === c.irr ? ' selected' : '') + '>' + esc(t('irr_' + u)) + '</option>'; }).join('') + '</select></label>' +
    '</form><div class="acts"><button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bp" data-act="savecycle" data-v="' + esc(c.id || '') + '">' + I('check') + esc(t('save')) + '</button></div></div></div>';
}
function vCycle(id){
  var c = cyc(id); if(!c) return vFarm();
  var x = cycInfo(c), tab = S.cycTab;
  var h = '<div class="dhead"><a class="btn bs bsm" href="#farm">' + I('arrowl') + esc(t('back')) + '</a></div>';
  h += '<div class="dhead" style="margin-top:0">' + cropDot(x.cr, true) + '<div style="flex:1;min-width:200px"><h1>' + esc(L(x.cr.n)) + (c.plot ? ' · ' + esc(c.plot) : '') + '</h1><div class="mu">' + esc(num(c.area) + ' ' + t('acres_short') + (c.variety ? ' · ' + c.variety : '') + ' · ' + t('irr_' + (c.irr || 'rainfed')) + ' · ' + fmtD(x.sow)) + '</div></div><div class="row"><button class="btn bs bsm" data-act="editcycle" data-v="' + c.id + '">' + I('edit') + esc(t('edit')) + '</button><button class="btn bd bsm" data-act="delcycle" data-v="' + c.id + '">' + I('trash') + esc(t('delete')) + '</button></div></div>';
  var pos = x.profit >= 0;
  h += '<div class="kpis"><div class="kpi"><small>' + esc(t('cur_stage')) + '</small><b style="font-size:19px">' + esc(x.day < 1 ? t('not_sown', {n: 1 - x.day}) : (x.done ? t('done_cycle') : t('st_' + (x.cur ? x.cur.k : 'germ')))) + '</b><small>' + (x.day >= 1 ? esc(t('day_n', {n: x.day})) : '') + '</small></div><div class="kpi"><small>' + esc(t('spent')) + '</small><b>' + rs(x.spent) + '</b><small>' + esc(t('per_acre')) + ': ' + rs(c.area ? x.spent / c.area : 0) + '</small></div><div class="kpi"><small>' + esc(t('income')) + '</small><b>' + rs(x.inc) + '</b><small>' + esc(t('exp_harvest')) + ': ' + esc(fmtDs(x.h1)) + '</small></div><div class="kpi ' + (x.inc || x.spent ? (pos ? 'pos' : 'neg') : '') + '"><small>' + esc(pos ? t('profit') : t('loss')) + '</small><b>' + rs(Math.abs(x.profit)) + '</b><small>' + (c.budget ? esc(t('budget_used')) + ': ' + Math.round(x.spent / c.budget * 100) + '%' : esc(t('no_budget'))) + '</small></div></div>';
  h += '<div class="tabs" role="tablist">' + [['overview','tab_overview'],['exp','tab_exp'],['inc','tab_inc'],['diary','tab_diary']].map(function(k){ return '<button type="button" role="tab" data-act="cyctab" data-v="' + k[0] + '" aria-selected="' + (tab === k[0]) + '">' + esc(t(k[1])) + '</button>'; }).join('') + '</div>';
  if(tab === 'overview'){
    h += '<div class="grid g2" style="align-items:start"><div class="card pad"><h2 style="font-size:19px;margin-bottom:6px">' + esc(t('timeline')) + '</h2><div class="prog" style="margin:10px 0 18px"><i style="width:' + x.pct + '%"></i></div><div class="tl">' + x.stages.map(function(s){ var d = addDays(x.sow, s.start), st = (x.day - 1) >= s.end ? 'done' : ((x.cur && x.cur.k === s.k && !x.done) ? 'now' : ''); return '<div class="it ' + st + '"><span class="dt"></span><div><b>' + esc(t('st_' + s.k)) + '</b><small>' + esc(fmtDs(d)) + ' · ' + esc(t('day_n', {n: s.start + 1})) + '</small></div></div>'; }).join('') + '<div class="it ' + (x.done ? 'done' : '') + '"><span class="dt"></span><div><b>' + esc(t('exp_harvest')) + '</b><small>' + esc(fmtDs(x.h1) + ' – ' + fmtDs(x.h2)) + '</small></div></div></div><p class="xs mu2" style="margin:10px 0 0">' + esc(t('approx')) + '</p></div>';
    var rv = S.reviews[c.id];
    h += '<div style="display:flex;flex-direction:column;gap:16px"><div class="card pad"><h2 style="font-size:19px;margin-bottom:14px">' + esc(t('by_cat')) + '</h2>' + catBars(c) + '</div><div class="aibox"><div class="hd"><div style="display:flex;gap:12px"><span class="ico s">' + I('spark') + '</span><div><h2 style="font-size:19px">' + esc(t('ai_review')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('ai_review_d')) + '</p></div></div>' + aiButtons('review', c.id, rv) + '</div><div class="md" id="review-out" style="margin-top:' + (rv ? '12px' : '0') + '">' + (rv ? (rv.text ? md(rv.text) : '') + (rv.busy ? '<div class="load"><span class="spin"></span>' + esc(rv.text ? '' : t('thinking')) + '</div>' : '') + (rv.err ? '<div class="note r">' + I('alert') + esc(rv.err) + '</div>' : '') : '') + '</div></div></div></div>';
  }
  if(tab === 'exp'){
    h += '<div class="card pad" style="margin-bottom:16px"><form id="expform" class="grid g4" style="align-items:end"><label class="f">' + esc(t('category')) + '<select class="inp" name="cat">' + EXPCATS.map(function(k){ return '<option value="' + k + '">' + esc(t('ec_' + k)) + '</option>'; }).join('') + '</select></label><label class="f">' + esc(t('amount')) + '<input class="inp" type="number" name="amt" min="1" step="1" required></label><label class="f">' + esc(t('date')) + '<input class="inp" type="date" name="date" value="' + isoDate(today0()) + '"></label><label class="f">' + esc(t('note')) + '<input class="inp" name="note" maxlength="80"></label></form><button class="btn bp" style="margin-top:14px" data-act="addexp" data-v="' + c.id + '">' + I('plus') + esc(t('add_exp')) + '</button></div>';
    var ex = (c.exp || []).slice().sort(function(a, b){ return a.date < b.date ? 1 : -1; });
    h += '<div class="card lst">' + (ex.length ? ex.map(function(e){ return '<div class="li"><span class="ico g" style="width:40px;height:40px;border-radius:12px">' + I('rupee') + '</span><div class="tx"><b>' + esc(t('ec_' + e.cat)) + '</b><span>' + esc(fmtD(parseD(e.date)) + (e.note ? ' · ' + e.note : '')) + '</span></div><span class="amt">' + rs(e.amt) + '</span><button class="xbtn" data-act="delrow" data-k="exp" data-v="' + e.id + '" aria-label="' + esc(t('delete')) + '">' + I('trash') + '</button></div>'; }).join('') : '<div class="empty">' + esc(t('no_entries')) + '</div>') + '</div>';
  }
  if(tab === 'inc'){
    var tq = {}; (c.inc || []).forEach(function(e){ tq[e.unit] = (tq[e.unit] || 0) + (+e.qty || 0); });
    h += '<div class="card pad" style="margin-bottom:16px"><form id="incform" class="grid g4" style="align-items:end"><label class="f">' + esc(t('qty')) + '<input class="inp" type="number" name="qty" min="0.01" step="0.01" required></label><label class="f">&nbsp;<select class="inp" name="unit" aria-label="unit">' + ['quintal','kg','ton'].map(function(u){ return '<option value="' + u + '">' + esc(t(u)) + '</option>'; }).join('') + '</select></label><label class="f">' + esc(t('rate')) + '<input class="inp" type="number" name="rate" min="0" step="1" required></label><label class="f">' + esc(t('date')) + '<input class="inp" type="date" name="date" value="' + isoDate(today0()) + '"></label><label class="f" style="grid-column:1/-1">' + esc(t('buyer')) + '<input class="inp" name="buyer" maxlength="60"></label></form><button class="btn bp" style="margin-top:14px" data-act="addinc" data-v="' + c.id + '">' + I('plus') + esc(t('add_inc')) + '</button></div>';
    if(Object.keys(tq).length) h += '<div class="note g" style="margin-bottom:14px">' + I('sprout') + '<span><b>' + esc(t('yield_total')) + ':</b> ' + Object.keys(tq).map(function(u){ return num(tq[u]) + ' ' + esc(t(u)); }).join(' + ') + (c.area ? ' · ' + Object.keys(tq).map(function(u){ return num(tq[u] / c.area) + ' ' + esc(t(u)) + '/' + esc(t('acre')); }).join(' + ') : '') + '</span></div>';
    var inc = (c.inc || []).slice().sort(function(a, b){ return a.date < b.date ? 1 : -1; });
    h += '<div class="card lst">' + (inc.length ? inc.map(function(e){ return '<div class="li"><span class="ico s" style="width:40px;height:40px;border-radius:12px">' + I('sprout') + '</span><div class="tx"><b>' + num(e.qty) + ' ' + esc(t(e.unit)) + ' × ' + rs(e.rate) + '</b><span>' + esc(fmtD(parseD(e.date)) + (e.buyer ? ' · ' + e.buyer : '')) + '</span></div><span class="amt" style="color:var(--g)">' + rs(e.qty * e.rate) + '</span><button class="xbtn" data-act="delrow" data-k="inc" data-v="' + e.id + '" aria-label="' + esc(t('delete')) + '">' + I('trash') + '</button></div>'; }).join('') : '<div class="empty">' + esc(t('no_entries')) + '</div>') + '</div>';
  }
  if(tab === 'diary'){
    h += '<div class="card pad" style="margin-bottom:16px"><form id="logform" class="grid g3" style="align-items:end"><label class="f">' + esc(t('activity')) + '<select class="inp" name="act">' + ACTS.map(function(k){ return '<option value="' + k + '">' + esc(t('ac_' + k)) + '</option>'; }).join('') + '</select></label><label class="f">' + esc(t('date')) + '<input class="inp" type="date" name="date" value="' + isoDate(today0()) + '"></label><label class="f">' + esc(t('note')) + '<input class="inp" name="note" maxlength="300"></label></form><button class="btn bp" style="margin-top:14px" data-act="addlog" data-v="' + c.id + '">' + I('plus') + esc(t('add_entry')) + '</button></div>';
    var lg = (c.log || []).slice().sort(function(a, b){ return a.date < b.date ? 1 : -1; });
    h += '<div class="card lst">' + (lg.length ? lg.map(function(e){ return '<div class="li" style="align-items:flex-start"><span class="ico b" style="width:40px;height:40px;border-radius:12px">' + I(e.act === 'scan' ? 'camera' : 'cal') + '</span><div class="tx"><b>' + esc(t('ac_' + e.act)) + ' · <span class="mu2" style="font-weight:500">' + esc(fmtD(parseD(e.date))) + '</span></b><span style="white-space:pre-wrap;color:var(--mu)">' + esc(e.note || '') + '</span></div><button class="xbtn" data-act="delrow" data-k="log" data-v="' + e.id + '" aria-label="' + esc(t('delete')) + '">' + I('trash') + '</button></div>'; }).join('') : '<div class="empty">' + esc(t('no_entries')) + '</div>') + '</div>';
  }
  return h;
}
function catBars(c){
  var by = {}, tot = 0; (c.exp || []).forEach(function(e){ by[e.cat] = (by[e.cat] || 0) + (+e.amt || 0); tot += (+e.amt || 0); });
  var ks = Object.keys(by).sort(function(a, b){ return by[b] - by[a]; });
  if(!ks.length) return '<p class="mu sm" style="margin:0">' + esc(t('no_entries')) + '</p>';
  return '<div class="bars">' + ks.map(function(k){ return '<div class="b"><span>' + esc(t('ec_' + k)) + '</span><span class="tr"><i style="width:' + (by[k] / tot * 100) + '%"></i></span><span>' + rs(by[k]) + '</span></div>'; }).join('') + '</div>';
}
function runReview(id){
  var c = cyc(id), x = cycInfo(c);
  var sum = {crop: x.cr.n.en, plot: c.plot, area_acres: c.area, variety: c.variety, irrigation: c.irr, sowing_date: c.sow, day_after_sowing: x.day, current_stage: x.cur ? T.en['st_' + x.cur.k] : 'not sown', expected_harvest: isoDate(x.h1) + ' to ' + isoDate(x.h2), budget_rs: c.budget || null, spent_rs: x.spent, income_rs: x.inc,
    expenses_by_category: (c.exp || []).reduce(function(a, e){ a[e.cat] = (a[e.cat] || 0) + (+e.amt || 0); return a; }, {}), recent_diary: (c.log || []).slice(-12).map(function(e){ return e.date + ' ' + e.act + (e.note ? ': ' + e.note.slice(0, 160) : ''); })};
  var prompt = 'You are a friendly, practical farm advisor. Review this farmer\'s crop record and give personalised advice.\n' + ctxRule() + '\n' + aiLangRule() + '\nCrop record (JSON): ' + JSON.stringify(sum) + '\nWrite Markdown with ## sections: 1) What to do in the next 2 weeks for this exact stage (organic-first), 2) Pests/diseases to watch for now, 3) Cost review — where money can be saved, budget status, 4) Harvest & selling preparation if near harvest. Be specific and brief. Don\'t invent numbers you were not given; give ranges when estimating.';
  S.reviews[id] = {text: '', busy: true}; softRender();
  ctl.review = new AbortController();
  S.sample(prompt, {cache: false, signal: ctl.review.signal, onText: function(u){ S.reviews[id].text = u.text; var el = $('#review-out'); if(el) el.innerHTML = md(u.text) + '<div class="load"><span class="spin"></span></div>'; }})
   .then(function(r){ S.reviews[id] = {text: r.text}; softRender(); })
   .catch(function(e){ var g = S.reviews[id]; g.busy = false; g.text = e.text || g.text || ''; if(e.code !== 'cancelled') g.err = aiMsg(e); softRender(); });
}

/* organic */
function vOrganic(){
  var h = '<div class="ph"><h1>' + esc(t('org_h')) + '</h1><p>' + esc(t('org_d')) + '</p></div><div class="note" style="margin-bottom:16px">' + I('info') + esc(t('org_note')) + '</div><div style="display:flex;flex-direction:column;gap:12px">';
  h += RECIPES.map(function(r){ var open = S.openRecipe === r.id; return '<div class="rcard' + (open ? ' open' : '') + '"><button type="button" data-act="recipe" data-v="' + r.id + '" aria-expanded="' + open + '"><span class="ico ' + (r.base === 'dilute' ? 'r' : (r.base === 'seed' ? 's' : 'g')) + '">' + I(r.base === 'dilute' ? 'shield' : (r.base === 'seed' ? 'sprout' : 'leaf')) + '</span><span class="tx"><b>' + esc(L(r.n)) + '</b><span>' + esc(L(r.purpose)) + '</span></span>' + I('chev', 'chev') + '</button><div class="body">' + (open ? recipeBody(r) : '') + '</div></div>'; }).join('');
  return h + '</div>';
}
function recipeBody(r){
  var v = S.calc[r.id], f = 1, calc = '';
  if(r.base === 'acre'){ v = v || {a: 1, u: 'acre'}; var ac = v.u === 'guntha' ? v.a / 40 : (v.u === 'hectare' ? v.a * 2.471 : v.a); f = ac;
    calc = '<div class="calcbox"><label class="f">' + esc(t('f_area')) + '<input class="inp" type="number" min="0.01" step="0.01" value="' + esc(v.a) + '" data-act="calc" data-v="' + r.id + '" data-k="a"></label><label class="f">&nbsp;<select class="inp" data-act="calc" data-v="' + r.id + '" data-k="u">' + ['acre','guntha','hectare'].map(function(u){ return '<option value="' + u + '"' + (v.u === u ? ' selected' : '') + '>' + esc(t(u)) + '</option>'; }).join('') + '</select></label></div>'; }
  else if(r.base === 'seed'){ v = v || {a: 100}; f = v.a / 100; calc = '<div class="calcbox"><label class="f">' + esc(t('seed_qty')) + '<input class="inp" type="number" min="1" step="1" value="' + esc(v.a) + '" data-act="calc" data-v="' + r.id + '" data-k="a"></label></div>'; }
  else { v = v || {a: 100}; calc = '<div class="calcbox"><label class="f">' + esc(t('spray_l')) + '<input class="inp" type="number" min="1" step="1" value="' + esc(v.a) + '" data-act="calc" data-v="' + r.id + '" data-k="a"></label><div style="flex:1;min-width:160px;padding-bottom:10px"><div class="sm mu">' + esc(t('concentrate')) + '</div><b style="font-size:22px;color:var(--g2)">' + num(v.a * r.dose / 100, 1) + ' ' + esc(UNITS.L[S.lang]) + '</b></div></div>'; }
  function q(n, u){ if(u === 'hand') return num(Math.max(1, Math.round(n * f))) + ' ' + UNITS.hand[S.lang]; var val = n * f; if(u === 'g' && val >= 1000) return num(val / 1000, 2) + ' ' + UNITS.kg[S.lang]; return num(val, val < 10 ? 2 : 1) + ' ' + UNITS[u][S.lang]; }
  return '<div class="grid g2" style="margin-top:16px;align-items:start"><div><h3 style="font-size:16px;margin-bottom:4px">' + esc(t('calc')) + '</h3>' + calc + '<h3 style="font-size:16px;margin:4px 0 6px">' + esc(t('ingredients')) + (r.base === 'dilute' ? '' : ' · ' + esc(t('for_area'))) + '</h3><table class="ingt">' + r.ing.map(function(g){ return '<tr><td>' + esc(L(INGR[g[0]])) + '</td><td>' + esc(r.base === 'dilute' ? (num(g[1]) + ' ' + UNITS[g[2]][S.lang]) : q(g[1], g[2])) + '</td></tr>'; }).join('') + '</table><p class="sm mu" style="margin:10px 0 0">' + I('cal').replace('<svg', '<svg width="16" height="16" stroke="currentColor" style="display:inline;vertical-align:-3px;margin-right:4px"') + esc(L(r.time)) + '</p></div><div><h3 style="font-size:16px;margin-bottom:8px">' + esc(t('method')) + '</h3><ol class="steps">' + L(r.m).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><h3 style="font-size:16px;margin:16px 0 6px">' + esc(t('how_use')) + '</h3><p style="margin:0">' + esc(L(r.use)) + '</p><div class="note r" style="margin-top:14px">' + I('alert') + '<span><b>' + esc(t('caution')) + ':</b> ' + esc(L(r.caution)) + '</span></div></div></div>';
}

/* chat */
function vAI(){
  var h = '<div class="chat"><div class="row" style="justify-content:space-between;margin:8px 0 10px"><h1 style="font-size:24px">' + esc(t('ai_h')) + '</h1>' + (S.chat.length ? '<button class="btn bs bsm" data-act="newchat">' + I('refresh') + esc(t('new_chat')) + '</button>' : '') + '</div><div class="msgs" id="msgs" aria-live="polite">';
  h += '<div class="msg a"><div class="md"><p>' + esc(t('ai_welcome')) + '</p></div></div>';
  S.chat.forEach(function(m, i){ if(m.role === 'user') h += '<div class="msg u">' + esc(m.content) + '</div>'; else h += '<div class="msg a"><div class="md">' + (m.content ? md(m.content) : '') + (m.busy ? '<div class="load" style="padding:4px 0"><span class="spin"></span>' + (m.content ? '' : esc(t('thinking'))) + '</div>' : '') + (m.err ? '<div class="note r" style="margin-top:8px">' + I('alert') + esc(m.err) + '</div>' : '') + '</div>' + (!m.busy && m.content ? '<div class="mact">' + speakBtn('chat' + i) + '</div>' : '') + '</div>'; });
  if(!S.chat.length) h += '<div class="sugs">' + ['sug1','sug2','sug3','sug4'].map(function(k){ return '<button type="button" data-act="sug" data-v="' + k + '">' + esc(t(k)) + '</button>'; }).join('') + '</div>';
  h += '</div>';
  var off = S.sampleReady && !S.sample;
  if(off) h += '<div class="note" style="margin-bottom:10px">' + I('info') + esc(t('ai_off')) + '</div>';
  var busy = S.chat.length && S.chat[S.chat.length - 1].busy;
  h += '<form class="composer" id="composer">' + (S.dict ? '<button type="button" class="iconbtn' + (S.listening ? ' rec' : '') + '" data-act="mic" aria-label="' + esc(S.listening ? t('listening') : t('speak')) + '">' + I('mic') + '</button>' : '') + '<textarea id="chatin" rows="1" placeholder="' + esc(S.listening ? t('listening') : t('ai_ph')) + '" aria-label="' + esc(t('ai_ph')) + '"' + (off ? ' disabled' : '') + '>' + esc(S.draft || '') + '</textarea>' + (busy ? '<button type="button" class="iconbtn" data-act="ai-stop" data-k="chat" aria-label="' + esc(t('stop_gen')) + '">' + I('stop') + '</button>' : '<button type="submit" class="iconbtn p" aria-label="' + esc(t('send')) + '"' + (off || !S.sampleReady ? ' disabled' : '') + '>' + I('send') + '</button>') + '</form></div>';
  return h;
}
function chatRules(){
  var mine = S.cycles.slice(0, 6).map(function(c){ var x = cycInfo(c); return x.cr.n.en + ' (' + c.area + ' acre, day ' + x.day + ', stage ' + (x.cur ? T.en['st_' + x.cur.k] : 'not sown') + ', spent ₹' + Math.round(x.spent) + ')'; }).join('; ');
  return 'You are "Ankurit", a warm, expert farming assistant for Indian farmers. ' + ctxRule() + (mine ? ' The farmer is currently growing: ' + mine + '.' : '') + '\n' + aiLangRule() + ' Always reply in that language even if the farmer writes in another.\nGive practical, step-by-step answers. Prefer organic and natural-farming methods (Jeevamrut, Beejamrut, Neemastra, Dashparni, traps, crop rotation); mention chemicals only as a last resort with "follow label dose". Never invent statistics, prices, scheme amounts or dates. You cannot see live mandi prices or weather: if asked, say so and suggest agmarknet.gov.in / IMD or the Kisan Call Centre (1800-180-1551). Keep answers concise; use short Markdown lists. For serious problems advise contacting the local Krishi Vigyan Kendra.';
}
function sendChat(text){
  text = String(text || '').trim(); if(!text || !S.sample) return;
  S.draft = ''; S.chat.push({role: 'user', content: text}); var a = {role: 'assistant', content: '', busy: true}; S.chat.push(a); softRender(); scrollChat();
  var hist = S.chat.filter(function(m){ return m !== a && !m.err; }).slice(-12).map(function(m){ return {role: m.role, content: m.content || '…'}; });
  while(hist.length && hist[0].role !== 'user') hist.shift();
  var turns = [{role: 'user', content: chatRules()}].concat(hist);
  ctl.chat = new AbortController();
  S.sample(turns, {cache: false, signal: ctl.chat.signal, onText: function(u){ a.content = u.text; var el = $$('#msgs .msg.a'); el = el[el.length - 1]; if(el && route().v === 'ai'){ $('.md', el).innerHTML = md(u.text); scrollChat(); } }})
   .then(function(r){ a.content = r.text; a.busy = false; softRender(); scrollChat(); })
   .catch(function(e){ a.busy = false; a.content = e.text || a.content; if(e.code !== 'cancelled') a.err = aiMsg(e); if(!a.content && !a.err) S.chat.splice(S.chat.indexOf(a), 1); softRender(); });
}
function scrollChat(){ var m = $('#msgs'); if(m) m.scrollTop = m.scrollHeight; }

/* ---------- render ---------- */
var lastShellKey = '';
function render(){
  var r = route(), key = S.lang + '|' + navKey(r.v) + '|' + r.v;
  document.documentElement.lang = S.lang;
  document.title = t('app') + ' — ' + t('tagline');
  if(key !== lastShellKey){ document.getElementById('root').innerHTML = shell(); lastShellKey = key; }
  var v = $('#view'), html;
  switch(r.v){
    case 'crops': html = vCrops(); break; case 'crop': html = vCrop(r.id); break; case 'planner': html = vPlanner(); break;
    case 'scan': html = vScan(); break; case 'farm': html = vFarm(); break; case 'cycle': html = vCycle(r.id); break;
    case 'organic': html = vOrganic(); break; case 'ai': html = vAI(); break; default: html = vHome();
  }
  v.innerHTML = html;
  if(r.v === 'ai') scrollChat();
}
function softRender(){
  var act = document.activeElement, id = act && act.id, sel = null, asel = null;
  if(act && !id && act.getAttribute && act.getAttribute('data-act')){ asel = '[data-act="' + act.getAttribute('data-act') + '"]' + (act.getAttribute('data-v') ? '[data-v="' + act.getAttribute('data-v') + '"]' : '') + (act.getAttribute('data-k') ? '[data-k="' + act.getAttribute('data-k') + '"]' : ''); }
  try{ if(act && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA')) sel = [act.selectionStart, act.selectionEnd]; }catch(e){}
  var st = window.scrollY; render(); window.scrollTo(0, st);
  var el = id ? document.getElementById(id) : (asel ? document.querySelector(asel) : null);
  if(el){ el.focus(); try{ if(sel) el.setSelectionRange(sel[0], sel[1]); }catch(e){} }
}
function modal(html){ closeModal(); var d = document.createElement('div'); d.id = 'modalwrap'; d.innerHTML = html; document.body.appendChild(d); var f = $('input,select', d); if(f) f.focus(); }
function closeModal(){ var m = $('#modalwrap'); if(m) m.remove(); }

/* ---------- events ---------- */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-act]'); if(!el) return;
  var a = el.getAttribute('data-act'), v = el.getAttribute('data-v');
  if(el.tagName === 'SELECT' || el.tagName === 'INPUT' && el.type !== 'button') return;
  switch(a){
    case 'lang': S.lang = v; lsSet('lang', v); lastShellKey = ''; stopSpeak(); render(); break;
    case 'scanmode': S.scanMode = v; if(route().v === 'scan'){ e.preventDefault(); render(); } break;
    case 'libseason': S.libCat = v; break;
    case 'libcat': S.libCat = v; $$('[data-act="libcat"]').forEach(function(b){ b.setAttribute('aria-pressed', b === el); }); updLib(); break;
    case 'guide': runGuide(v); break;
    case 'review': runReview(v); break;
    case 'ai-stop': var k = el.getAttribute('data-k'); if(ctl[k]) ctl[k].abort(); break;
    case 'speak': toggleSpeak(v); break;
    case 'plwater': S.plWater = v; render(); break;
    case 'reco': runReco(); break;
    case 'analyze': S.scanCrop = $('#scancrop').value; S.scanNote = $('#scannote').value; runScan(); break;
    case 'scansave': saveScanToDiary(); break;
    case 'newcycle': e.preventDefault(); modal(cycleForm(null, v)); break;
    case 'editcycle': modal(cycleForm(cyc(v))); break;
    case 'close': closeModal(); break;
    case 'savecycle': saveCycleForm(v); break;
    case 'delcycle': confirmDelete(v); break;
    case 'cyctab': S.cycTab = v; render(); break;
    case 'addexp': addRow(v, 'exp'); break;
    case 'addinc': addRow(v, 'inc'); break;
    case 'addlog': addRow(v, 'log'); break;
    case 'delrow': delRow(route().id, el.getAttribute('data-k'), v); break;
    case 'recipe': S.openRecipe = S.openRecipe === v ? null : v; render(); break;
    case 'sug': sendChat(t(v)); break;
    case 'newchat': if(ctl.chat) ctl.chat.abort(); S.chat = []; render(); break;
    case 'mic': toggleMic(); break;
    case 'confirmdel': removeCycle(v); closeModal(); location.hash = '#farm'; break;
  }
});
document.addEventListener('change', function(e){
  var el = e.target, a = el.getAttribute('data-act'); if(!a) return;
  if(a === 'state'){ S.state = el.value; S.district = ''; lsSet('state', S.state); lsSet('district', ''); S.reco = null; softRender(); }
  if(a === 'district'){ S.district = el.value; lsSet('district', S.district); S.reco = null; softRender(); }
  if(a === 'district-t'){ S.district = el.value.trim().slice(0, 60); lsSet('district', S.district); S.reco = null; }
  if(a === 'plseason'){ S.plSeason = el.value; S.reco = null; render(); }
  if(a === 'calc'){ var id = el.getAttribute('data-v'), k = el.getAttribute('data-k'); S.calc[id] = S.calc[id] || (RECIPES.filter(function(r){ return r.id === id; })[0].base === 'acre' ? {a: 1, u: 'acre'} : {a: 100}); S.calc[id][k] = k === 'u' ? el.value : Math.max(0, parseFloat(el.value) || 0); softRender(); }
  if(a === 'scanfile'){ var f = el.files && el.files[0]; if(f){ if(S.scanUrl) URL.revokeObjectURL(S.scanUrl); S.scanFile = f; S.scanUrl = URL.createObjectURL(f); S.scanRes[S.scanMode] = null; S.scanCrop = $('#scancrop') && $('#scancrop').value; S.scanNote = $('#scannote') && $('#scannote').value; render(); } }
});
document.addEventListener('input', function(e){
  var el = e.target, a = el.getAttribute('data-act');
  if(a === 'libq'){ S.libQ = el.value; updLib(); }
  if(a === 'calc'){ var id = el.getAttribute('data-v'), k = el.getAttribute('data-k'); if(k === 'a' && el.value !== ''){ S.calc[id] = S.calc[id] || (RECIPES.filter(function(r){ return r.id === id; })[0].base === 'acre' ? {a: 1, u: 'acre'} : {a: 100}); S.calc[id].a = Math.max(0, parseFloat(el.value) || 0); clearTimeout(S.calcT); S.calcT = setTimeout(softRender, 350); } }
  if(el.id === 'chatin'){ S.draft = el.value; el.style.height = 'auto'; el.style.height = Math.min(160, el.scrollHeight) + 'px'; }
});
document.addEventListener('submit', function(e){
  if(e.target.id === 'composer'){ e.preventDefault(); var ta = $('#chatin'); sendChat(ta.value); }
  else e.preventDefault();
});
document.addEventListener('keydown', function(e){
  if(e.target.id === 'chatin' && e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(e.target.value); }
  if(e.key === 'Escape') closeModal();
});
document.addEventListener('dragover', function(e){ var d = e.target.closest && e.target.closest('#drop'); if(d){ e.preventDefault(); d.classList.add('over'); } });
document.addEventListener('dragleave', function(e){ var d = e.target.closest && e.target.closest('#drop'); if(d) d.classList.remove('over'); });
document.addEventListener('drop', function(e){ var d = e.target.closest && e.target.closest('#drop'); if(d && e.dataTransfer.files[0]){ e.preventDefault(); var f = e.dataTransfer.files[0]; if(S.scanUrl) URL.revokeObjectURL(S.scanUrl); S.scanFile = f; S.scanUrl = URL.createObjectURL(f); S.scanRes[S.scanMode] = null; render(); } });
window.addEventListener('hashchange', function(){ closeModal(); S.cycTab = route().v === 'cycle' ? S.cycTab : 'overview'; render(); window.scrollTo(0, 0); });
window.addEventListener('scroll', function(){ var tp = $('#top'); if(tp) tp.classList.toggle('sc', window.scrollY > 4); }, {passive: true});

function updLib(){
  var q = S.libQ.toLowerCase(), g = $('#cgrid'); if(!g) return;
  g.innerHTML = cropCards(CROPS.filter(function(c){ return (S.libCat === 'all' || c.cat === S.libCat || c.s.indexOf(S.libCat) > -1) && (!q || (c.n.en + ' ' + c.n.hi + ' ' + c.n.mr).toLowerCase().indexOf(q) > -1); }));
}
function saveCycleForm(id){
  var f = $('#cform'); if(!f) return; var fd = new FormData(f);
  var area = parseFloat(fd.get('area')), unit = fd.get('unit') || 'acre';
  if(!(area > 0) || !fd.get('sow')){ f.reportValidity && f.reportValidity(); return; }
  var acres = unit === 'guntha' ? area / 40 : (unit === 'hectare' ? area * 2.471 : area);
  var c = id ? clone(cyc(id)) : {id: uid('c-'), created: Date.now(), exp: [], inc: [], log: []};
  c.crop = fd.get('crop'); c.plot = String(fd.get('plot') || '').trim().slice(0, 40); c.area = Math.round(acres * 1000) / 1000; c.unit = unit; c.sow = fd.get('sow');
  c.variety = String(fd.get('variety') || '').trim().slice(0, 40); c.budget = parseFloat(fd.get('budget')) || 0; c.irr = fd.get('irr');
  writeCycle(c); closeModal();
  if(!id) location.hash = '#cycle-' + c.id; else render();
}
function confirmDelete(id){
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:420px"><h2>' + esc(t('confirm_delete')) + '</h2><div class="acts"><button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bd" data-act="confirmdel" data-v="' + id + '">' + I('trash') + esc(t('delete')) + '</button></div></div></div>');
}
function addRow(id, kind){
  var form = $('#' + kind + 'form'); if(!form) return; var fd = new FormData(form), c = clone(cyc(id)), row = {id: uid('r'), date: fd.get('date') || isoDate(today0())};
  if(kind === 'exp'){ row.cat = fd.get('cat'); row.amt = parseFloat(fd.get('amt')); row.note = String(fd.get('note') || '').trim().slice(0, 80); if(!(row.amt > 0)){ form.reportValidity(); return; } }
  if(kind === 'inc'){ row.qty = parseFloat(fd.get('qty')); row.unit = fd.get('unit'); row.rate = parseFloat(fd.get('rate')); row.buyer = String(fd.get('buyer') || '').trim().slice(0, 60); if(!(row.qty > 0) || !(row.rate >= 0) || fd.get('rate') === ''){ form.reportValidity(); return; } }
  if(kind === 'log'){ row.act = fd.get('act'); row.note = String(fd.get('note') || '').trim().slice(0, 300); }
  c[kind] = (c[kind] || []).concat([row]); if(c[kind].length > 400) c[kind] = c[kind].slice(-400);
  writeCycle(c); render();
}
function delRow(id, kind, rid){ var c = clone(cyc(id)); c[kind] = (c[kind] || []).filter(function(r){ return r.id !== rid; }); writeCycle(c); render(); }
function saveScanToDiary(){
  var m = S.scanMode, r = S.scanRes[m]; if(!r || !r.data) return; var id = $('#diarycyc').value, c = clone(cyc(id)); if(!c) return; var d = r.data;
  var note = m === 'leaf' ? ((d.problem || '') + (d.organic && d.organic.length ? '\n• ' + d.organic.slice(0, 4).join('\n• ') : '')) : ((d.name || '') + ' (' + t(d.type || 'unclear') + ')' + (d.organic && d.organic.length ? '\n• ' + d.organic.slice(0, 4).join('\n• ') : ''));
  c.log = (c.log || []).concat([{id: uid('r'), date: isoDate(today0()), act: 'scan', note: note.slice(0, 600)}]); writeCycle(c); r.saved = true; render();
}

/* speech */
function speechText(sid){
  if(sid.indexOf('guide') === 0){ var g = S.guides[sid.slice(5) + '|' + S.lang + '|' + place()]; return g ? g.text : ''; }
  if(sid.indexOf('review') === 0){ var r = S.reviews[sid.slice(6)]; return r ? r.text : ''; }
  if(sid.indexOf('scan') === 0) return scanSpeech(sid.slice(4));
  if(sid.indexOf('chat') === 0){ var m = S.chat[+sid.slice(4)]; return m ? m.content : ''; }
  return '';
}
function stopSpeak(){ if(S.tts && S.speakingId){ try{ S.tts.stop(); }catch(e){} } S.speakingId = null; }
function toggleSpeak(sid){
  if(!S.tts) return;
  if(S.speakingId === sid){ stopSpeak(); softRender(); return; }
  var txt = stripMd(speechText(sid)).slice(0, 1990); if(!txt) return;
  S.speakingId = sid; softRender();
  var p; try{ p = S.tts.speak(txt, {language: S.lang}); }catch(e){ p = Promise.reject(e); }
  p.catch(function(){ return S.tts.speak(txt); }).catch(function(){}).then(function(){ if(S.speakingId === sid){ S.speakingId = null; softRender(); } });
}
function toggleMic(){
  var d = S.dict; if(!d) return;
  if(S.listening){ d.stop().catch(function(){}); return; }
  var base = ($('#chatin') || {}).value || '';
  var pr;
  try{ pr = d.start(); }catch(e){ return; }
  S.listening = true; render();
  if(!S.dictBound){ S.dictBound = true;
    d.onPartial(function(x){ var ta = $('#chatin'); if(ta) ta.value = (S.dictBase ? S.dictBase + ' ' : '') + x.text; });
    d.onFinal(function(x){ S.dictBase = ((S.dictBase ? S.dictBase + ' ' : '') + x.text).trim(); S.draft = S.dictBase; var ta = $('#chatin'); if(ta) ta.value = S.draft; });
    d.onState(function(x){ if(x.state === 'idle'){ S.listening = false; S.dictBase = ''; softRender(); } });
  }
  S.dictBase = base.trim();
  Promise.resolve(pr).catch(function(){ S.listening = false; softRender(); });
}

/* ---------- boot ---------- */
S.calc = {};
render();
initCaps();
})();
