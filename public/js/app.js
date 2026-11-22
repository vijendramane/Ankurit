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
  libCat: 'all', libQ: '', cycTab: 'overview', speakingId: null, webSearch: false,
  news: null, newsBusy: false, newsErr: null, newsCat: 'top', newsLang: 'all', newsSheet: null, newsShown: 12, newsAI: {},
  soils: lsGet('soils', []), soilForm: lsGet('soilDraft', {}), soilTab: 'card', soilPlan: null, soilHome: null, soilHomeQ: {}, soilRead: null, openTest: null,
  exoFit: true, plExotic: true,
  cimg: lsGet('cimg', {}), gps: lsGet('gps', null), wx: lsGet('wx', null), wxBusy: false, wxErr: null, wxOpen: false, wxAI: null, bigText: lsGet('bigText', false),
  reports: lsGet('reports', []), repFilter: 'all', mk: lsGet('mk', null), mkCrop: lsGet('mkCrop', ''), mkData: {}, botOpen: false, botHello: true, photoPick: lsGet('photoPick', {}), photoCands: {}
};
var LANGNAME = {en:'English', hi:'Hindi (हिंदी, Devanagari script)', mr:'Marathi (मराठी, Devanagari script)'};
var CATCOL = {cereal:'#B7791F', pulse:'#8B5E3C', oil:'#A16207', cash:'#1D6F42', veg:'#2F7D4F', fruit:'#C2410C', spice:'#B45309', exotic:'#9D174D', leafy:'#4D7C0F', flower:'#BE185D', fodder:'#65A30D'};
var NEWSCOL = {market:'#B45309', weather:'#1F6FB2', schemes:'#7C3AED', advisory:'#2F7D4F', tech:'#0E7490', livestock:'#8B5E3C', success:'#C2410C', other:'#56635B'};
var NEWSCATS = ['top','all','market','weather','schemes','advisory','tech','livestock','success','other'];
var NEWSICON = {top:'fire', all:'news', market:'rupee', weather:'cloudsun', schemes:'shield', advisory:'leaf', tech:'spark', livestock:'cow', success:'star', other:'dots'};
function topNews(max){ var all = ((S.news && S.news.items) || []).filter(function(n){ return S.newsLang === 'all' || n.lang === S.newsLang; }); var a = all.filter(function(n){ return n.image; }); a.sort(function(x, y){ return (y.source === 'Agrowon') - (x.source === 'Agrowon') || y.date - x.date; }); var rest = all.filter(function(n){ return !n.image; }).sort(function(x, y){ return y.date - x.date; }); var dayAgo = Date.now() - 2 * 86400000; a.sort(function(x, y){ return ((y.date > dayAgo) - (x.date > dayAgo)) || ((y.source === 'Agrowon') - (x.source === 'Agrowon')) || y.date - x.date; }); return a.concat(rest).slice(0, max || 8); }
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
function place(){ var g = S.gps && S.gps.en; if(g && g.place) return [g.place, g.taluka && g.taluka !== g.place ? g.taluka + ' taluka' : '', (g.district || S.district) ? (g.district || S.district) + ' district' : '', g.state || S.state].filter(Boolean).join(', '); return S.district ? (S.district + ', ' + S.state) : (S.state || 'India'); }
function sowText(c){ return c.sow.map(function(m){ return MONTHS[S.lang][m - 1]; }).join(', '); }
function avgDur(c){ return Math.round((c.d[0] + c.d[1]) / 2); }
function stagesFor(c, dur){ var set = STAGESETS[c.st]; return set.map(function(s, i){ var start = Math.round(dur * s[1] / 100), end = i < set.length - 1 ? Math.round(dur * set[i + 1][1] / 100) : dur; return {k: s[0], start: start, end: end}; }); }
function money(n){ n = Math.round(n); if(n >= 100000) return '₹' + num(n / 100000, n >= 1000000 ? 0 : 1) + ' ' + t('lakh'); return rs(n); }
function moneyR(a, b){ return money(a) + ' – ' + money(b); }
function ago(ts){ var m = Math.max(0, Math.round((Date.now() - ts) / 60000)); if(m < 2) return t('just_now'); if(m < 60) return t('mins_ago', {n: num(m, 0)}); var h = Math.round(m / 60); if(h < 24) return t('hrs_ago', {n: num(h, 0)}); return t('days_ago_s', {n: num(Math.round(h / 24), 0)}); }
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
 plus:'M12 5v14M5 12h14', fire:'M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 3s1-4 0-7z', file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5', expand:'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7', star:'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z', cow:'M5 6c0 2 1 3 3 3h8c2 0 3-1 3-3M7 9v6a5 5 0 0 0 10 0V9M10 17h.01M14 17h.01M9 12h.01M15 12h.01', trend:'M3 17l6-6 4 4 8-8M15 7h6v6', arrowr:'M5 12h14M13 6l6 6-6 6', arrowl:'M19 12H5M11 18l-6-6 6-6', check:'M20 6 9 17l-5-5', x:'M18 6 6 18M6 6l12 12',
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
 news:'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9h4M18 14h-8M15 18h-5M10 6h8v4h-8z',
 globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20',
 layers:'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5', cloud:'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z',
 cloudsun:'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65A4 4 0 0 0 8.5 9.5M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z',
 rain:'M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
 storm:'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6',
 wind:'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2',
 dots:'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
 pin:'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
 gps:'M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
 text:'M4 7V4h16v3M9 20h6M12 4v16',
 thermo:'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
 share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
 download:'M12 3v12M7 10l5 5 5-5M5 21h14',
 clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
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
function aiMsg(e){ var c = e && e.code; if(c === 'busy') return t('err_busy'); if(c === 'upstream_error' && e.message) return t('err') + ' (' + String(e.message).slice(0, 120) + ')'; if(c === 'rate_limited') return t('err_rate'); if(c === 'image_rejected' || c === 'images_unavailable') return t('err_img'); if(c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') return t('ai_off'); return t('err'); }
/* ---------- AI prompt building blocks ----------
   One expert persona (system instruction) + context + strict language rule.
   Every feature adds its own task and output format on top. */
var MON_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function aiLangRule(){
  return 'LANGUAGE: Write the ENTIRE answer in ' + LANGNAME[S.lang] + ' — headings, lists and tables too. ' + (S.lang === 'en' ? '' : 'Use the everyday farming words used in ' + (S.lang === 'mr' ? 'Maharashtra (as in Agrowon)' : 'Hindi-speaking villages') + '; you may add the English or technical name in brackets once. ') +
    'Use short, simple sentences a village farmer understands. Units: acre and guntha (1 acre = 40 guntha), kg, quintal, litre, ₹. For any spray, give the amount per 15-litre knapsack pump AND per acre (about 150–200 litres of spray water per acre).';
}
function soilCtx(){
  var r = S.soils[0]; if(!r) return '';
  return ' Latest soil test' + (r.plot ? ' (' + r.plot + ')' : '') + ' on ' + r.date + ': ' + soilSummaryEn(r.v, r.pu) + '.';
}
function ctxRule(){ var d = new Date(); return 'FARMER CONTEXT: Location ' + place() + ', India. Today is ' + d.getDate() + ' ' + MON_EN[d.getMonth()] + ' ' + d.getFullYear() + '; current season: ' + T.en[seasonNow()] + '.' + soilCtx() + wxCtx(); }
var EXPERT = 'You are "Ankurit", a senior Indian agronomist (ICAR / state agricultural university background) and natural-farming expert who advises small and marginal farmers.\n' +
  'ACCURACY: Base every recommendation on ICAR, state agricultural university and Krishi Vigyan Kendra (KVK) package of practices for the farmer\'s region and season. Be specific and practical. If you are not sure, say so plainly instead of guessing. Never invent variety names, brand names, scheme amounts, prices, dates, phone numbers, websites or statistics. Use ranges and words like "about" for yields, costs and doses that vary.\n' +
  'CROP PROTECTION: Organic and biological options first (Neemastra, Dashparni, neem oil 1500 ppm, Trichoderma, Pseudomonas, Beauveria, Metarhizium, pheromone/sticky traps, cultural control, field sanitation). When a chemical is truly needed, name only the CIB&RC-registered active ingredient (never brand names), tell the farmer to follow the label dose (give a typical dose only if you are confident it is the label dose), and always mention protective clothing, spraying in calm morning/evening hours and the waiting period before harvest. Never suggest banned or highly hazardous pesticides, and never suggest mixing many chemicals together.\n' +
  'SAFETY: For poisoning, human/animal health or a severe crop loss, tell the farmer to contact a doctor/vet, the local KVK or the Kisan Call Centre 1800-180-1551.';
function sysPrompt(extra){ return EXPERT + '\n' + ctxRule() + '\n' + aiLangRule() + (extra ? '\n' + extra : ''); }

function initCaps(){
  use('sample').then(function(s){ S.sample = s; S.sampleReady = true; if(s && s.status){ s.status().then(function(x){ S.webSearch = !!(x && x.webSearch); }); } if(s && s.limits){ s.limits().then(function(l){ S.imgOk = !!(l && l.images); refreshAI(); }).catch(function(){ refreshAI(); }); } else refreshAI(); });
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
function refreshAI(){ if(['crop','planner','scan','ai','cycle','soil','news'].indexOf(route().v) > -1) softRender(); }

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
  if(h === 'exotic'){ S.libCat = 'exotic'; return {v:'crops'}; }
  if((m = h.match(/^report-(r-[a-z0-9]+)$/))) return {v:'report', id:m[1]};
  if(['home','crops','planner','scan','farm','organic','ai','news','soil','weather','market','reports','photos'].indexOf(h) > -1) return {v:h};
  return {v:'home'};
}
var NAV = [['home','home','nav_home'],['farm','sprout','nav_farm'],['crops','book','nav_crops'],['news','news','nav_news'],['weather','cloudsun','nav_wx'],['market','rupee','nav_market'],'-',['scan','scan','t_doctor'],['soil','layers','nav_soil'],['planner','map','nav_planner'],['organic','jar','nav_organic'],['ai','chat','nav_ai'],['reports','file','nav_reports']];
function navKey(v){ return v === 'crop' ? 'crops' : (v === 'cycle' ? 'farm' : (v === 'report' ? 'reports' : v)); }

/* ---------- shell ---------- */
function shell(){
  var r = route(), nk = navKey(r.v);
  var side = '<aside class="side" aria-label="' + esc(t('app')) + '"><a class="logo" href="#home"><span class="mk">' + MARK + '</span><span><b>' + esc(t('app')) + '</b><small>' + esc(t('tagline')) + '</small></span></a><nav class="snav">' +
    NAV.map(function(n){ if(n === '-') return '<div class="sep"></div>'; return '<a href="#' + n[0] + '" class="' + (nk === n[0] ? 'on' : '') + '"' + (nk === n[0] ? ' aria-current="page"' : '') + '>' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') +
    '</nav><div class="foot"><b>' + esc(t('helpline')) + '</b><a href="tel:18001801551" style="color:#4D3706;font-weight:700;text-decoration:none">1800-180-1551</a></div></aside>';
  var titles = {home:t('app'), crops:t('nav_crops'), crop:t('nav_crops'), planner:t('nav_planner'), scan:t('scan_title'), farm:t('nav_farm'), cycle:t('nav_farm'), organic:t('nav_organic'), ai:t('bot_name'), news:t('news_h'), soil:t('soil_h'), weather:t('wx_h'), market:t('mk_h'), reports:t('rep_h'), report:t('rep_h'), photos:t('ph_h')};
  var top = '<header class="top" id="top"><div class="ttl">' + esc(titles[r.v]) + '</div><a class="logo mlogo" href="#home" style="padding:0"><span class="mk" style="width:36px;height:36px;border-radius:11px">' + MARK + '</span><span><b style="font-size:19px">' + esc(t('app')) + '</b></span></a>' +
    '<div class="topr"><div class="lang" role="group" aria-label="' + esc(t('language')) + '">' + [['mr','मरा'],['hi','हिं'],['en','EN']].map(function(l){ return '<button type="button" data-act="lang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '" lang="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div><button type="button" class="kebab" data-act="menu" aria-label="' + esc(t('menu')) + '" title="' + esc(t('menu')) + '">' + I('dots') + '</button></div></header>';
  var bn = [['home','home','nav_home'],['crops','book','nav_crops'],['farm','sprout','nav_farm'],['news','news','nav_news'],['market','rupee','nav_market']];
  var bnav = '<nav class="bnav" aria-label="Main">' + bn.map(function(n){ var on = nk === n[0]; if(n[0] === 'farm') return '<a href="#farm" class="mid' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '><span class="sc">' + I('sprout') + '</span><span>' + esc(t(n[2])) + '</span></a>'; return '<a href="#' + n[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') + '</nav>';
  return '<div class="app">' + side + '<div class="main">' + top + '<main class="view" id="view"></main></div></div>' + bnav + (r.v === 'home' ? botFab() : '');
}

/* ---------- views ---------- */
function cropImg(c){ return S.photoPick && S.photoPick[c.id] ? S.photoPick[c.id] : (S.cimg && S.cimg[c.id] ? S.cimg[c.id] : ''); }
function imgTag(src, cls){ return '<img src="' + esc(src) + '" alt="" loading="lazy" referrerpolicy="no-referrer"' + (cls ? ' class="' + cls + '"' : '') + ' onerror="this.remove()">'; }
function cropDot(c, big){ var src = cropImg(c); return '<span class="' + (big ? 'cbig' : 'cdot') + '" style="background:' + CATCOL[c.cat] + '" aria-hidden="true">' + esc(first(L(c.n))) + (src ? imgTag(src) : '') + '</span>'; }
function cropPhoto(c){ var src = cropImg(c); return '<div class="cph" style="background:' + CATCOL[c.cat] + '"><span>' + esc(first(L(c.n))) + '</span>' + (src ? imgTag(src) : '') + '</div>'; }
function loadCropImgs(){ fetch('/api/cropimgs').then(function(r){ return r.ok ? r.json() : {}; }).then(function(m){ if(m && Object.keys(m).length){ var changed = JSON.stringify(m) !== JSON.stringify(S.cimg); S.cimg = m; lsSet('cimg', m); if(changed) softRender(); } }).catch(function(){}); }
function locBox(){
  var ds = DISTRICTS[S.state];
  return '<div class="loc"><span class="lbl">' + esc(t('location')) + '</span>' +
    '<select class="inp" data-act="state" aria-label="' + esc(t('state')) + '">' + STATES.map(function(s){ return '<option' + (s === S.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
    (ds ? '<select class="inp" data-act="district" aria-label="' + esc(t('district')) + '"><option value="">' + esc(t('district')) + ' — ' + esc(t('select')) + '</option>' + ds.map(function(d){ return '<option' + (d === S.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>'
        : '<input class="inp" data-act="district-t" value="' + esc(S.district) + '" placeholder="' + esc(t('type_district')) + '" aria-label="' + esc(t('district')) + '">') + '</div>';
}
var HEROART = '<svg class="art" viewBox="0 120 520 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 200 C120 150 220 170 320 150 S480 120 520 130 V260 H0Z" fill="#2F8F57" opacity=".55"/><path d="M0 230 C140 190 260 210 360 190 S500 180 520 185 V260 H0Z" fill="#1D6F42"/><g stroke="#5FAF7B" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M60 250 C160 220 260 228 360 212"/><path d="M40 262 C150 236 270 242 400 226"/><path d="M120 262 C220 246 330 248 470 236"/></g><g fill="#9BC9A9" opacity=".85"><path d="M300 168c0-10 6-17 16-18-1 10-7 16-16 18z"/><path d="M300 172c0-9-6-15-15-16 1 9 6 15 15 16z"/><path d="M340 160c0-8 5-14 13-15-1 8-6 13-13 15z"/></g></svg>';

function vHome(){
  var se = seasonNow(), sc = CROPS.filter(function(c){ return c.s.indexOf(se) > -1 && c.cat !== 'exotic' && c.s.indexOf('perennial') < 0; });
  /* [route, icon, colour, title, desc, AI?] */
  var tiles = [['scan','scan','g','t_doctor','t_doctor_d',1],['soil','layers','o','t_soil','t_soil_d',1],['farm','sprout','s','t_farm','t_farm_d',0],
    ['weather','cloudsun','b','t_wx','t_wx_d',0],['news','news','b','t_news','t_news_d',0],['ai','chat','b','t_ai','t_ai_d',1],
    ['crops','book','g','t_lib','t_lib_d',0],['planner','map','o','t_planner','t_planner_d',1],['organic','jar','s','t_organic','t_organic_d',0]];
  var h = '<section class="hero"><div style="position:relative;z-index:1">' + wxWidget(se) + '<h1 style="margin-top:16px">' + esc(t('greet')) + '!</h1><p>' + esc(t('greet_sub')) + '</p><div class="row wrap"><a class="btn" style="background:#fff;color:var(--g2)" href="#scan">' + I('camera') + esc(t('t_doctor')) + '</a><a class="btn" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)" href="#ai">' + I('chat') + esc(t('t_ai')) + '</a></div></div>' + HEROART + '</section>';
  h += '<div class="tiles">' + tiles.map(function(x, i){ return '<a class="tile' + (i === 0 ? ' feat' : '') + '" href="#' + x[0] + '"><span class="ico ' + x[2] + '">' + I(x[1]) + '</span><b>' + esc(t(x[3])) + (x[5] ? ' <span class="ai-dot">AI</span>' : '') + '</b><span class="d">' + esc(t(x[4], {n: CROPS.length})) + '</span></a>'; }).join('') + '</div>';
  h += '<div class="h-sec"><h2>' + esc(t('latest_news')) + '</h2><a href="#news">' + esc(t('see_all')) + ' →</a></div><div id="homenews">' + homeNews() + '</div>';
  h += '<div class="h-sec"><h2>' + esc(t('crops_season')) + ' · ' + esc(t(se)) + '</h2><a href="#crops" data-act="libseason" data-v="' + se + '">' + esc(t('see_all')) + ' →</a></div><p class="mu sm" style="margin:-8px 0 12px">' + esc(t('season_' + se + '_d')) + '</p><div class="cropstrip">' + sc.map(function(c){ return '<a class="cmini" href="#crop-' + c.id + '">' + cropDot(c) + esc(L(c.n)) + '</a>'; }).join('') + '</div>';
  h += '<div class="grid g2" style="margin-top:26px;align-items:start"><div><div class="h-sec" style="margin-top:0"><h2>' + esc(t('tasks')) + '</h2><a href="#farm">' + esc(t('nav_farm')) + ' →</a></div>' + cropTaskCards() + '</div>';
  h += '<div style="display:flex;flex-direction:column;gap:16px"><div class="help"><span class="ico s" style="background:#fff">' + I('phone') + '</span><div><b style="display:block">' + esc(t('helpline')) + '</b><a class="num" href="tel:18001801551">1800-180-1551</a><div class="sm" style="color:#6B4D0B">' + esc(t('helpline_d')) + '</div></div></div>' +
    '<div class="card"><div class="pad" style="padding-bottom:6px"><h2 style="font-size:18px">' + esc(t('links')) + '</h2></div><div class="linkrow"><a href="https://agmarknet.gov.in" target="_blank" rel="noopener">' + esc(t('link_mandi')) + I('ext') + '</a><a href="https://enam.gov.in" target="_blank" rel="noopener">' + esc(t('link_enam')) + I('ext') + '</a><a href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">' + esc(t('link_shc')) + I('ext') + '</a></div></div></div></div>';
  return h;
}
function vCrops(){
  var cats = ['all','cereal','pulse','oil','veg','leafy','fruit','spice','cash','flower','fodder','exotic'];
  var list = libList();
  var h = '<div class="ph"><h1>' + esc(t('t_lib')) + '</h1><p>' + esc(t('t_lib_d', {n: CROPS.length})) + '</p></div>';
  h += '<div class="toolbar"><div class="search">' + I('search') + '<input class="inp" type="search" data-act="libq" value="' + esc(S.libQ) + '" placeholder="' + esc(t('search_crops')) + '" aria-label="' + esc(t('search_crops')) + '"></div></div>';
  h += '<div class="chips" role="group" style="margin-bottom:18px">' + cats.concat(['kharif','rabi','zaid']).map(function(c){ return '<button type="button" data-act="libcat" data-v="' + c + '" aria-pressed="' + (S.libCat === c) + '">' + esc(c === 'all' ? t('all') : (['kharif','rabi','zaid'].indexOf(c) > -1 ? t(c) : t('cat_' + c))) + '</button>'; }).join('') + '</div>';
  h += '<div class="cgrid" id="cgrid">' + cropCards(list) + '</div>';
  return h;
}
function fitChip(c){ var f = exoticFit(c, S.state); return '<span class="chip ' + (f === 'good' ? 'g' : (f === 'ok' ? 's' : '')) + '">' + I(f === 'good' ? 'check' : (f === 'ok' ? 'info' : 'x')).replace('<svg', '<svg width="14" height="14" stroke="currentColor"') + esc(t('fit_' + f, {state: S.state})) + '</span>'; }
function libList(){ var q = S.libQ.toLowerCase(); var list = CROPS.filter(function(c){ return (S.libCat === 'all' || c.cat === S.libCat || c.s.indexOf(S.libCat) > -1) && (!q || (c.n.en + ' ' + c.n.hi + ' ' + c.n.mr).toLowerCase().indexOf(q) > -1); });
  if(S.libCat === 'exotic'){ var o = {good: 0, ok: 1, no: 2}; list.sort(function(a, b){ return o[exoticFit(a, S.state)] - o[exoticFit(b, S.state)]; }); }
  return list; }
function cropCards(list){
  if(!list.length) return '<div class="empty" style="grid-column:1/-1">—</div>';
  return list.map(function(c){ var alt = S.lang === 'en' ? c.n.mr + ' · ' + c.n.hi : c.n.en;
    return '<a class="ccard" href="#crop-' + c.id + '">' + cropPhoto(c) + '<div class="hd"><div><h3>' + esc(L(c.n)) + '</h3><div class="alt">' + esc(alt) + '</div></div></div><div class="meta">' + (c.x ? fitChip(c) : '') + c.s.map(function(s){ return '<span class="chip g">' + esc(t(s)) + '</span>'; }).join('') + '<span class="chip">' + c.d[0] + '–' + c.d[1] + ' ' + esc(t('days')) + '</span><span class="chip b">' + I('drop', '') .replace('<svg', '<svg width="14" height="14" stroke="currentColor"') + esc(t(c.w)) + '</span></div></a>'; }).join('');
}

function vCrop(id){
  var c = crop(id); if(!c) return vCrops();
  var dur = avgDur(c), st = stagesFor(c, dur), key = c.id + '|' + S.lang + '|' + place();
  var h = '<div class="dhead"><a class="btn bs bsm" href="#crops">' + I('arrowl') + esc(t('back')) + '</a></div>';
  if(cropImg(c)) h += '<div class="cbanner">' + imgTag(cropImg(c)) + '</div>';
  h += '<div class="dhead" style="margin-top:0">' + cropDot(c, true) + '<div style="flex:1;min-width:200px"><h1>' + esc(L(c.n)) + '</h1><div class="mu">' + esc(S.lang === 'en' ? c.n.mr + ' · ' + c.n.hi : c.n.en) + ' · ' + esc(t('cat_' + c.cat)) + '</div></div><button class="btn bp" data-act="newcycle" data-v="' + c.id + '">' + I('plus') + esc(t('start_track')) + '</button></div>';
  h += '<div class="facts">' + [['season', c.s.map(function(s){ return t(s); }).join(', ')], ['duration', c.d[0] + '–' + c.d[1] + ' ' + t('days')], ['sowing', sowText(c)], ['soil', c.soil.map(function(s){ return t('soil_' + s); }).join(', ')], ['water', t(c.w)], ['temp', c.t]].map(function(f){ return '<div class="fact"><small>' + esc(t(f[0])) + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>';
  if(c.x) h += exoEcon(c);
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
  return '<div class="row wrap">' + (g && g.text ? speakBtn(kind + id) : '') + '<button class="btn bp" data-act="' + kind + '" data-v="' + id + '"' + (S.sampleReady ? '' : ' disabled') + '>' + I(g && g.text ? 'refresh' : 'spark') + esc(lbl) + '</button></div>';
}
function speakBtn(sid){ var on = S.speakingId === sid; return (S.tts ? '<button class="btn bs bsm" data-act="speak" data-v="' + sid + '">' + I(on ? 'stop' : 'vol') + esc(on ? t('stop') : t('listen')) + '</button>' : '') + (sid.indexOf('chat') === 0 ? '<button class="btn bs bsm" data-act="savechat" data-v="' + sid.slice(4) + '">' + I('file') + esc(t('rep_save')) + '</button>' : dlBtn(sid)); }

var ctl = {};
function exoFacts(c){
  if(!c || !c.x) return '';
  var x = c.x, u = x.yu === 'bag' ? ' per 100 bags' : ' per acre';
  return 'App reference ranges (approximate): yield ' + x.yld[0] + '–' + x.yld[1] + ' kg' + u + ' at full bearing; farm-gate price ₹' + x.price[0] + '–' + x.price[1] + '/kg; first-year cost ₹' + x.inv[0] + '–' + x.inv[1] + u + '; first income after about ' + x.first + ' months; grown in: ' + T.en['prot_' + x.prot] + '. Suitability for ' + S.state + ': ' + {good: 'grown well here', ok: 'possible only with care (hill pockets / shade net / polyhouse / special varieties)', no: 'not suitable here'}[exoticFit(c, S.state)] + '.';
}
function runGuide(id){
  var c = crop(id), key = c.id + '|' + S.lang + '|' + place(), regen = !!(S.guides[key] && S.guides[key].text), exo = c.cat === 'exotic';
  var prompt = 'TASK: Write a complete, practical cultivation guide for ' + c.n.en + ' (' + c.n.hi + ' / ' + c.n.mr + ') for this farmer\'s district (' + place() + ').\n' +
    (exo ? 'This is a high-value / foreign crop. ' + exoFacts(c) + ' If it does not suit this location, say so clearly at the start and suggest what would make it possible.\n' : '') +
    'Use Markdown with these ## sections. Keep each section short, with bullet points and numbers:\n' +
    '1. Is it right for my area? (climate, soil, water and the best sowing / planting window here)\n' +
    '2. Varieties (only well-known released varieties or types you are sure about for this region; ask the farmer to confirm at the KVK / agricultural university)\n' +
    '3. Land preparation and soil\n' +
    '4. Seed or plants: rate per acre, spacing, seed / seedling treatment (Beejamrut, Trichoderma, biofertilizers first)\n' +
    '5. Nutrient plan: organic first (FYM/compost per acre, Ghanjeevamrut, Jeevamrut schedule, biofertilizers), then the general recommended N-P-K dose per acre as a reference, split by stage' + (S.soils[0] ? ', adjusted to the soil test in the context' : '') + '\n' +
    '6. Irrigation by crop stage, and the critical stages that must not miss water\n' +
    '7. Weed management\n' +
    '8. Major pests and diseases as a Markdown table: Problem | Signs | Organic control | When to escalate\n' +
    '9. Harvest: signs of maturity, typical yield range per acre, grading and storage\n' +
    (exo ? '10. Market, investment and risks: who buys and how to sell, approximate first-year cost per acre, subsidy schemes by name only (e.g. MIDH/NHM — no amounts unless sure), main risks and how to start small\n11. Ways to cut cost and raise profit\n'
         : '10. Ways to cut cost and raise profit (intercropping, value addition, selling tips)\n') +
    'End with one line advising to confirm locally with the KVK or agriculture officer.';
  S.guides[key] = {text: '', busy: true}; softRender();
  ctl.guide = new AbortController();
  S.sample(prompt, {system: sysPrompt(), task: 'guide', signal: ctl.guide.signal, cache: regen ? {gcTime: 86400000, refresh: true} : {gcTime: 86400000}, onText: function(u){ S.guides[key].text = u.text; patchGuide(key); }})
   .then(function(r){ S.guides[key] = {text: r.text}; softRender(); saveReport('guide' + id); })
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
    '<div class="row wrap" style="margin-top:16px;justify-content:space-between"><div><div class="sm mu" style="margin-bottom:6px;font-weight:500">' + esc(t('land')) + '</div><div class="seg" role="group">' + [['low','irr_rainfed'],['medium','irr_sprinkler'],['high','irr_flood']].map(function(x){ return '<button type="button" data-act="plwater" data-v="' + x[0] + '" aria-pressed="' + (w === x[0]) + '">' + esc(t(x[0])) + '</button>'; }).join('') + '</div><label class="check" style="margin-top:12px"><input type="checkbox" data-act="plexotic"' + (S.plExotic ? ' checked' : '') + '><span>' + esc(t('planner_exotic')) + '</span></label></div>' +
    (S.sampleReady && !S.sample ? '<div class="note">' + I('info') + esc(t('ai_off')) + '</div>' : '<button class="btn bp" data-act="reco"' + ((S.reco && S.reco.busy) || !S.sampleReady ? ' disabled' : '') + '>' + I('spark') + esc(t('get_reco')) + '</button>') + '</div></div>';
  var r = S.reco;
  if(r && r.busy) h += '<div class="card pad" style="margin-top:16px"><div class="load"><span class="spin"></span>' + esc(t('thinking')) + '</div></div>';
  if(r && r.err) h += '<div class="note r" style="margin-top:16px">' + I('alert') + esc(r.err) + '</div>';
  if(r && r.data && r.data.crops){
    h += '<div class="h-sec"><h2>' + esc(place()) + ' · ' + esc(t(r.season)) + '</h2>' + dlBtn('reco') + '</div><div class="grid g2">' + r.data.crops.map(function(x, i){ var c = crop(String(x.id || '')); return '<div class="card pad" style="display:flex;flex-direction:column;gap:10px"><div class="row"><span class="cbig" style="background:' + (c ? CATCOL[c.cat] : '#2F7D4F') + ';width:44px;height:44px;font-size:18px">' + (i + 1) + '</span><div style="flex:1"><h3 style="font-size:19px">' + esc(x.name) + '</h3><div class="row wrap" style="gap:6px;margin-top:4px">' + (x.duration ? '<span class="chip">' + esc(x.duration) + '</span>' : '') + (x.water ? '<span class="chip b">' + esc(t('water')) + ': ' + esc(t(String(x.water))) + '</span>' : '') + (x.profit ? '<span class="chip g">' + esc(t('profit')) + ': ' + esc(lvlT(x.profit)) + '</span>' : '') + (x.risk ? '<span class="chip ' + (lvl(x.risk) === 'h' ? 'r' : 's') + '">' + esc(t('risk')) + ': ' + esc(lvlT(x.risk)) + '</span>' : '') + (c && c.cat === 'exotic' ? '<span class="chip x">' + esc(t('cat_exotic')) + '</span>' : '') + '</div></div></div><p style="margin:0"><b>' + esc(t('reco_why')) + ':</b> ' + esc(x.why) + '</p>' + (x.tip ? '<p class="sm" style="margin:0;color:var(--g2);background:var(--gl);padding:10px 12px;border-radius:10px"><b>' + esc(t('reco_tip')) + ':</b> ' + esc(x.tip) + '</p>' : '') + (c ? '<a class="btn bg bsm" style="align-self:flex-start;padding-left:0" href="#crop-' + c.id + '">' + esc(t('t_lib')) + ' →</a>' : '') + '</div>'; }).join('') + '</div>' + (r.data.note ? '<div class="note g" style="margin-top:14px">' + I('info') + esc(r.data.note) + '</div>' : '') + '<p class="xs mu2" style="margin-top:12px">' + esc(t('disclaimer')) + '</p>';
  }
  var stat = CROPS.filter(function(c){ return c.s.indexOf(se) > -1; });
  h += '<div class="h-sec"><h2>' + esc(t('reco_static', {s: t(se)})) + '</h2></div><div class="cgrid">' + cropCards(stat) + '</div>';
  return h;
}
function runReco(){
  var se = S.plSeason || seasonNow(), w = S.plWater || 'medium';
  S.reco = {busy: true, season: se}; softRender();
  var ids = CROPS.filter(function(c){ return S.plExotic || c.cat !== 'exotic'; }).map(function(c){ return c.id + '=' + c.n.en + (c.cat === 'exotic' ? ' [exotic]' : ''); }).join(', ');
  var prompt = 'TASK: Recommend the 6 most suitable crops for this farmer for the ' + T.en[se] + ' season.\n' +
    'Water availability: ' + w + ' (low = rainfed only, medium = limited irrigation / protective watering, high = assured irrigation).\n' +
    'Think about: the usual soil, rainfall and temperature of this district in that season; water need; market demand and price risk; input cost; and crop rotation. Prefer profitable, low-risk choices; mention intercropping where useful.' + (S.soils[0] ? ' Use the soil test in the context.' : '') + '\n' +
    (S.plExotic ? 'Include 1–2 high-value foreign crops (ids marked [exotic]) ONLY if they realistically suit this location and season; say in "tip" if polyhouse / shade net / contract buyer is needed.\n' : 'Do not suggest foreign / exotic crops.\n') +
    'Reply with ONLY JSON: {"crops":[{"id":"<id from the list or empty>","name":"<crop name in the answer language>","why":"<1-2 sentences specific to this district>","duration":"<e.g. 100–120 days, in the answer language>","water":"low|medium|high","profit":"low|medium|high","risk":"low|medium|high","tip":"<one practical tip>"}],"note":"<one short caution or general advice>"}\n' +
    'Keep JSON keys and the low|medium|high values in English; write all other values in the answer language.\nKnown ids: ' + ids;
  S.sample.json(prompt, {system: sysPrompt(), task: 'json', cache: {gcTime: 86400000}}).then(function(d){ S.reco = {data: d && d.crops ? d : {crops: []}, season: se}; softRender(); if(d && d.crops && d.crops.length) saveReport('reco'); }).catch(function(e){ S.reco = {err: aiMsg(e), season: se}; softRender(); });
}

/* scan */
function vScan(){
  var res = S.scanRes.one;
  var h = '<div class="ph"><h1>' + esc(t('t_doctor')) + '</h1><p>' + esc(t('doctor_d')) + '</p></div>';
  h += '<div class="scanwrap"><div class="card pad" style="display:flex;flex-direction:column;gap:14px">';
  if(S.sampleReady && (!S.sample || !S.imgOk)) h += '<div class="note">' + I('info') + esc(t('ai_off')) + '</div>';
  h += '<label class="drop" id="drop">' + (S.scanUrl ? '<img src="' + S.scanUrl + '" alt="">' + '<span class="btn bs bsm">' + I('camera') + esc(t('change_photo')) + '</span>' : '<span class="ico g" style="width:64px;height:64px;border-radius:20px">' + I('camera') + '</span><b>' + esc(t('upload')) + '</b><span class="sm mu">' + esc(t('tips_doctor')) + '</span>') + '<input type="file" accept="image/jpeg,image/png,image/webp,image/*" id="scanfile" data-act="scanfile" aria-label="' + esc(t('upload')) + '"></label>';
  h += '<label class="f">' + esc(t('crop_opt')) + '<select class="inp" id="scancrop"><option value="">—</option>' + cropOptions(S.scanCrop) + '</select></label>';
  h += '<label class="f">' + esc(t('notes_opt')) + '<input class="inp" id="scannote" value="' + esc(S.scanNote || '') + '" placeholder="' + esc(t('notes_ph')) + '"></label>';
  h += '<button class="btn bp" data-act="analyze"' + (!S.scanFile || (res && res.busy) || !S.imgOk ? ' disabled' : '') + '>' + I('spark') + esc(t('analyze')) + '</button><p class="xs mu2" style="margin:0">' + esc(t('disclaimer')) + '</p></div>';
  h += '<div class="result" id="scanres">' + scanResult('one', res) + '</div></div>';
  return h;
}
function lvl(v){ v = String(v || '').toLowerCase(); return v.indexOf('high') > -1 ? 'h' : (v.indexOf('med') > -1 ? 'm' : 'l'); }
function lvlT(v){ var k = lvl(v); return t(k === 'h' ? 'high' : (k === 'm' ? 'medium' : 'low')); }
function liList(a){ a = Array.isArray(a) ? a : (a ? [a] : []); return a.length ? '<ul>' + a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
var STATUS_LOOK = {healthy: ['g', 'check', 'healthy'], disease: ['r', 'alert', 'st_disease'], pest_damage: ['r', 'bug', 'st_pest'], harmful_insect: ['r', 'bug', 'harmful'], beneficial_insect: ['g', 'bug', 'beneficial'], nutrient_deficiency: ['s', 'leaf', 'st_nutrient'], abiotic: ['s', 'sun', 'st_abiotic'], unclear: ['s', 'info', 'unclear']};
function scanResult(m, r){
  if(!r) return '<div class="card empty"><span class="ico g">' + I('scan') + '</span><p style="margin:0">' + esc(t('t_doctor_d')) + '</p></div>';
  if(r.busy) return '<div class="card pad"><div class="load"><span class="spin"></span>' + esc(t('analyzing')) + '</div></div>';
  if(r.err) return '<div class="note r">' + I('alert') + esc(r.err) + '</div>';
  var d = r.data || {}, sid = 'scanone', h = '';
  if(d.imageOk === false){ return '<div class="rhead"><span class="ico s">' + I('camera') + '</span><div><h2>' + esc(t('retake')) + '</h2><p class="mu" style="margin:6px 0 0">' + esc(d.retake || '') + '</p></div></div>'; }
  var st = String(d.status || 'unclear').toLowerCase(); if(!STATUS_LOOK[st]) st = 'unclear';
  var lk = STATUS_LOOK[st], healthy = st === 'healthy', friend = st === 'beneficial_insect';
  h += '<div class="rhead"><span class="ico ' + lk[0] + '">' + I(lk[1]) + '</span><div style="flex:1"><span class="chip ' + lk[0] + '">' + esc(t(lk[2])) + '</span>' + (d.plant ? ' <span class="chip">' + esc(d.plant) + '</span>' : '') +
    '<h2 style="margin-top:8px">' + esc(healthy ? t('healthy') : (d.problem || '—')) + '</h2>' + (d.problem_en && S.lang !== 'en' && !healthy ? '<div class="sub">' + esc(d.problem_en) + '</div>' : '') + (d.scientific ? '<div class="sub"><i>' + esc(d.scientific) + '</i></div>' : '') +
    '<div class="row wrap" style="margin-top:10px;gap:18px"><span class="sm">' + esc(t('r_conf')) + ' <span class="meter ' + lvl(d.confidence) + '" style="display:inline-flex;vertical-align:middle;margin-left:6px"><i></i><i></i><i></i></span> ' + esc(lvlT(d.confidence)) + '</span>' +
    (!healthy && !friend && d.severity ? '<span class="sm">' + esc(t('r_sev')) + ' <span class="meter sev ' + lvl(d.severity) + '" style="display:inline-flex;vertical-align:middle;margin-left:6px"><i></i><i></i><i></i></span> ' + esc(lvlT(d.severity)) + '</span>' : '') + '</div></div>' + speakBtn(sid) + '</div>';
  if(friend) h += '<div class="note g">' + I('check') + esc(t('friend_note')) + '</div>';
  if(lvl(d.confidence) === 'l' && !healthy) h += '<div class="note">' + I('info') + esc(t('low_conf')) + '</div>';
  if(d.observed && d.observed.length) h += '<div class="rsec"><h3>' + I('scan') + esc(t('r_observed')) + '</h3>' + liList(d.observed) + '</div>';
  if(d.cause) h += '<div class="rsec"><h3>' + I('info') + esc(t('r_cause')) + '</h3><p style="margin:0">' + esc(d.cause) + '</p></div>';
  if(d.threshold) h += '<div class="rsec"><h3>' + I('alert') + esc(t('r_threshold')) + '</h3><p style="margin:0">' + esc(d.threshold) + '</p></div>';
  if(d.organic && d.organic.length) h += '<div class="rsec g"><h3>' + I('leaf') + esc(t('r_organic')) + '</h3>' + liList(d.organic).replace('<ul>', '<ol>').replace('</ul>', '</ol>') + '</div>';
  if(d.natural_enemies && d.natural_enemies.length) h += '<div class="rsec"><h3>' + I('shield') + esc(t('r_enemies')) + '</h3>' + liList(d.natural_enemies) + '</div>';
  if(d.prevention && d.prevention.length) h += '<div class="rsec"><h3>' + I('shield') + esc(t('r_prev')) + '</h3>' + liList(d.prevention) + '</div>';
  if(d.chemical && !friend) h += '<div class="rsec s"><h3>' + I('flask') + esc(t('r_chem')) + '</h3><p style="margin:0">' + esc(d.chemical) + '</p></div>';
  if(d.expert) h += '<div class="rsec"><h3>' + I('user') + esc(t('r_expert')) + '</h3><p style="margin:0">' + esc(d.expert) + '</p></div>';
  if(S.cycles.length){
    h += '<div class="rsec"><h3>' + I('book') + esc(t('save_diary')) + '</h3><div class="row wrap"><select class="inp" id="diarycyc" style="flex:1;min-width:180px">' + S.cycles.map(function(c){ var cr = crop(c.crop); return '<option value="' + c.id + '">' + esc((cr ? L(cr.n) : c.crop) + (c.plot ? ' · ' + c.plot : '')) + '</option>'; }).join('') + '</select><button class="btn bs" data-act="scansave">' + I(r.saved ? 'check' : 'plus') + esc(r.saved ? t('saved') : t('save_diary')) + '</button></div></div>';
  }
  return h;
}
function scanSpeech(){ var d = (S.scanRes.one || {}).data || {}; return [d.problem, d.cause, (d.organic || []).join('. '), (d.prevention || []).join('. ')].filter(Boolean).join('. '); }
function runScan(){
  var cr = crop(S.scanCrop || ''), note = S.scanNote || '';
  S.scanRes.one = {busy: true}; softRender();
  var prompt = 'TASK: You are an expert plant doctor (plant pathologist + entomologist + soil-nutrition specialist). Look at the attached photo and find out what is wrong with the crop — or identify the insect in it.\n' +
    (cr ? 'Crop (as told by the farmer): ' + cr.n.en + '.\n' : '') + (note ? 'Farmer note: ' + note + '\n' : '') +
    'METHOD: First decide what the photo shows: a plant part (leaf, stem, fruit, root) or an insect/mite. Then study it carefully — colour changes, the shape, colour and edge of spots (yellow halo, concentric rings, water-soaked, powdery coating, rusty pustules, mosaic pattern), which leaves are affected (old or young), insects, eggs, webbing, droppings, holes, mining tunnels. Consider all causes: fungal / bacterial / viral disease, insect or mite damage, nutrient deficiency (N, P, K, Mg, Fe, Zn, B), herbicide injury, sun scorch, water stress or cold. Choose the single most likely cause. Use "high" confidence only when signs are clear and typical; if two causes are close, mention the second one in "observed" and lower the confidence.\n' +
    'Many insects are friends of the farmer (ladybird beetles, lacewings, spiders, syrphid flies, parasitic wasps, bees, praying mantis, ground beetles) — if so, set status "beneficial_insect" and advise NOT to spray.\n' +
    'TREATMENT: Organic / biological steps first, in the order to do them, each with the amount per 15-litre pump and how often to repeat. Give a chemical option only as a last resort (active ingredient only, "follow the label dose", protective clothing, waiting period before harvest).\n' +
    'If the photo is not a plant or insect, or is too blurred/dark to judge, set "imageOk": false and explain in "retake" exactly how to take a better photo.\n' +
    'Reply with ONLY JSON: {"imageOk":true,"retake":"","plant":"<plant name or empty>","status":"healthy|disease|pest_damage|nutrient_deficiency|abiotic|harmful_insect|beneficial_insect|unclear","problem":"<problem or insect name in answer language>","problem_en":"<common English name>","scientific":"<scientific name if confident, else empty>","confidence":"low|medium|high","severity":"low|medium|high","observed":["<what you can see>"],"cause":"<cause in simple words and how it spreads>","threshold":"<for pests: when action is needed; else empty>","organic":["<step-by-step organic treatment with dose per 15 L>"],"natural_enemies":["<for pests: natural enemies to protect>"],"prevention":["<prevention for next time>"],"chemical":"<last-resort option or empty>","expert":"<when to contact KVK / agriculture officer>"}';
  S.sample.json(prompt, {system: sysPrompt('Reply with JSON only. Keep JSON keys and the fixed option values (healthy, disease, low, high…) in English; write every other value in the answer language.'), task: 'vision', images: [S.scanFile]}).then(function(d){ S.scanRes.one = {data: d || {}}; softRender(); if(d && d.imageOk !== false) saveReport('scanone'); }).catch(function(e){ S.scanRes.one = {err: aiMsg(e)}; softRender(); });
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
var CATORDER = ['cereal','pulse','oil','veg','leafy','fruit','spice','cash','flower','fodder','exotic'];
function cropOptions(sel){
  function o(x){ return '<option value="' + x.id + '"' + (x.id === sel ? ' selected' : '') + '>' + esc(L(x.n)) + '</option>'; }
  return CATORDER.map(function(k){ var l = CROPS.filter(function(x){ return x.cat === k; }); l.sort(function(a, b){ return L(a.n).localeCompare(L(b.n)); }); return l.length ? '<optgroup label="' + esc(t('cat_' + k)) + '">' + l.map(o).join('') + '</optgroup>' : ''; }).join('');
}
function cycleForm(c, cropId){
  c = c || {crop: cropId || (CROPS[0].id), plot: '', area: 1, unit: 'acre', sow: isoDate(today0()), variety: '', budget: '', irr: 'rainfed'};
  var areaDisp = c.unit === 'guntha' ? c.area * 40 : (c.unit === 'hectare' ? +(c.area / 2.471).toFixed(2) : c.area);
  return '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="box"><h2 id="mh">' + esc(c.id ? t('edit') : t('add_crop')) + '</h2><form id="cform" class="formgrid">' +
    '<label class="f full">' + esc(t('f_crop')) + '<select class="inp" name="crop">' + cropOptions(c.crop) + '</select></label>' +
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
  var prompt = 'TASK: Review this farmer\'s crop record and give personalised advice for exactly where the crop is now.\nCrop record (JSON): ' + JSON.stringify(sum) + '\n' +
    'Write Markdown with these ## sections, short and specific:\n1. Next 14 days — what to do now (day-wise or week-wise; organic first, with amounts per acre / per 15-L pump)\n2. Pests and diseases to watch at this stage, and the first sign to look for\n3. Cost review — where money can be saved; budget status' + (c.budget ? '' : ' (no budget was set)') + '\n4. Harvest and selling — only if harvest is within about 45 days: maturity signs, grading, where to sell\n' +
    'Use the diary to avoid repeating work already done. Do not invent numbers you were not given; give ranges when estimating.';
  S.reviews[id] = {text: '', busy: true}; softRender();
  ctl.review = new AbortController();
  S.sample(prompt, {system: sysPrompt(), task: 'guide', cache: false, signal: ctl.review.signal, onText: function(u){ S.reviews[id].text = u.text; var el = $('#review-out'); if(el) el.innerHTML = md(u.text) + '<div class="load"><span class="spin"></span></div>'; }})
   .then(function(r){ S.reviews[id] = {text: r.text}; softRender(); saveReport('review' + id); })
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
  var h = '<div class="chat"><div class="row" style="justify-content:space-between;margin:8px 0 10px"><h1 style="font-size:22px;display:flex;align-items:center;gap:10px"><span class="aihlogo">' + BOTLOGO + '</span>' + esc(t('bot_name')) + '</h1>' + (S.chat.length ? '<button class="btn bs bsm" data-act="newchat">' + I('refresh') + esc(t('new_chat')) + '</button>' : '') + '</div><div class="msgs" id="msgs" aria-live="polite">';
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
  return sysPrompt((mine ? 'The farmer is currently growing: ' + mine + '.\n' : '') +
    'Always reply in the language above, even if the farmer writes in another language or in Roman script.\n' +
    'ANSWER STYLE: Start with a 1–2 line direct answer. Then short numbered steps or bullets with quantities and timing (days after sowing / crop stage). Use a small table only when comparing options. Keep it under about 250 words unless the farmer asks for detail. If key information is missing (crop, stage, symptoms, area), first give the most likely answer, then ask ONE short follow-up question at the end. Do not repeat the question back.\n' +
    (S.webSearch ? 'LIVE DATA: You may use Google Search for current prices, weather, scheme news and dates — mention the source and date, and keep it short.' : 'LIVE DATA: You cannot see live mandi prices, weather forecasts or the latest scheme news. If asked, say so briefly and suggest agmarknet.gov.in / eNAM, the IMD Meghdoot app, or the Kisan Call Centre 1800-180-1551 — then still give useful general advice.'));
}
function sendChat(text){
  text = String(text || '').trim(); if(!text || !S.sample) return;
  S.draft = ''; S.chat.push({role: 'user', content: text}); var a = {role: 'assistant', content: '', busy: true}; S.chat.push(a); softRender(); scrollChat();
  var hist = S.chat.filter(function(m){ return m !== a && !m.err; }).slice(-14).map(function(m){ return {role: m.role, content: m.content || '…'}; });
  while(hist.length && hist[0].role !== 'user') hist.shift();
  ctl.chat = new AbortController();
  S.sample(hist, {system: chatRules(), task: 'chat', cache: false, signal: ctl.chat.signal, onText: function(u){ a.content = u.text; var el = $$('#msgs .msg.a'); el = el[el.length - 1]; if(el && route().v === 'ai'){ $('.md', el).innerHTML = md(u.text); scrollChat(); } }})
   .then(function(r){ a.content = r.text; a.busy = false; softRender(); scrollChat(); })
   .catch(function(e){ a.busy = false; a.content = e.text || a.content; if(e.code !== 'cancelled') a.err = aiMsg(e); if(!a.content && !a.err) S.chat.splice(S.chat.indexOf(a), 1); softRender(); });
}
function scrollChat(){ var m = $('#msgs'); if(m) m.scrollTop = m.scrollHeight; }

/* ================= FOREIGN / HIGH-VALUE CROPS ================= */
function exoUnit(c){ return c.x.yu === 'bag' ? t('per_100bags') : t('per_acre_s'); }
function exoEcon(c){
  var x = c.x, f = exoticFit(c, S.state), u = exoUnit(c);
  return '<div class="card pad econ" style="margin-top:16px"><div class="row wrap" style="justify-content:space-between;margin-bottom:12px"><h2 style="font-size:19px">' + esc(t('x_econ')) + '</h2>' + fitChip(c) + '</div>' +
    '<div class="econgrid">' +
    '<div><small>' + esc(t('x_yield')) + '</small><b>' + num(x.yld[0]) + '–' + num(x.yld[1]) + ' ' + esc(UNITS.kg[S.lang]) + esc(u) + '</b></div>' +
    '<div><small>' + esc(t('x_price')) + '</small><b>' + moneyR(x.price[0], x.price[1]) + '/' + esc(UNITS.kg[S.lang]) + '</b></div>' +
    '<div class="hi"><small>' + esc(t('x_income')) + '</small><b>' + moneyR(x.yld[0] * x.price[0], x.yld[1] * x.price[1]) + esc(u) + '</b></div>' +
    '<div><small>' + esc(t('x_invest')) + '</small><b>' + moneyR(x.inv[0], x.inv[1]) + esc(u) + '</b></div>' +
    '<div><small>' + esc(t('x_first')) + '</small><b>' + num(x.first) + ' ' + esc(t('months')) + '</b></div>' +
    '<div><small>' + esc(t('x_grow')) + '</small><b>' + esc(t('prot_' + x.prot)) + '</b></div></div>' +
    '<p style="margin:14px 0 0"><b>' + esc(t('x_why')) + ':</b> ' + esc(L(x.note)) + '</p>' +
    (f === 'ok' ? '<div class="note" style="margin-top:12px">' + I('info') + esc(t('x_ok_note')) + '</div>' : '') +
    '<p class="xs mu2" style="margin:12px 0 0">' + esc(t('x_origin')) + ': ' + esc(L(x.origin)) + ' · ' + esc(t('exotic_warn')) + '</p></div>';
}
/* ================= FARM NEWS ================= */
function loadNews(force){
  if(S.newsBusy) return;
  var had = !!(S.news && S.news.items && S.news.items.length);
  S.newsBusy = true; S.newsErr = null; if(route().v === 'news' && (force || !had)) patchNews();
  use('news').then(function(fn){
    if(!fn) throw new Error('no news');
    return fn(force);
  }).then(function(d){ S.news = {items: (d && d.items) || [], updated: (d && d.updated) || Date.now(), at: Date.now()}; S.newsErr = null; })
    .catch(function(){ S.newsErr = t('news_err'); })
    .then(function(){ S.newsBusy = false; var v = route().v; if(v === 'news' && (force || !had)) render(); if(v === 'home'){ var hn = $('#homenews'); if(hn) hn.innerHTML = homeNews(); } });
}
function newsNeeded(){ return !S.news || Date.now() - S.news.at > 10 * 60000; }
function newsList(){
  var items = ((S.news && S.news.items) || []).filter(function(n){ return S.newsLang === 'all' || n.lang === S.newsLang; });
  if(S.newsCat === 'top') return topNews(20);
  return items.filter(function(n){ return S.newsCat === 'all' || n.cat === S.newsCat; });
}
function newsImg(n, cls){
  var col = NEWSCOL[n.cat] || NEWSCOL.other, ph = '<div class="nph" style="background:' + col + '">' + I(n.cat === 'weather' ? 'sun' : (n.cat === 'market' ? 'rupee' : (n.cat === 'livestock' ? 'drop' : (n.cat === 'tech' ? 'spark' : 'news')))) + '<span>' + esc(n.source) + '</span></div>';
  if(!n.image) return '<div class="' + cls + '">' + ph + '</div>';
  return '<div class="' + cls + '"><img src="' + esc(n.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">' + ph + '</div>';
}
function newsChip(n){ return '<span class="nchip" style="--c:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '">' + esc(t('nc_' + n.cat)) + '</span>'; }
function newsCard(n){
  var ai = S.newsAI[n.id];
  return '<article class="ncard" id="n-' + esc(n.id) + '">' + newsImg(n, 'nimg') + '<div class="nbody"><div class="nmeta">' + newsChip(n) + '<span>' + esc(n.source) + ' · ' + esc(ago(n.date)) + '</span></div>' +
    '<h3><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(n.title) + '</a></h3>' + (n.summary ? '<p class="clamp3">' + esc(n.summary) + '</p>' : '') + '</div>' +
    '<div class="nbody nfoot"><div class="nact"><a class="btn bs bsm" href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(t('news_read')) + I('ext') + '</a>' +
    (S.sample ? '<button class="btn bg bsm" data-act="newsai" data-v="' + esc(n.id) + '"' + (ai && ai.busy ? ' disabled' : '') + '>' + I('spark') + esc(t('news_ai')) + '</button>' : '') + '</div>' +
    (ai ? '<div class="naibox md">' + (ai.text ? md(ai.text) : '') + (ai.busy ? '<div class="load" style="padding:6px 0"><span class="spin"></span>' + (ai.text ? '' : esc(t('thinking'))) + '</div>' : '') + (ai.err ? '<div class="note r">' + I('alert') + esc(ai.err) + '</div>' : '') + (!ai.busy && ai.text ? '<p class="xs mu2" style="margin:8px 0 0">' + esc(t('news_ai_note')) + '</p>' : '') + '</div>' : '') +
    '</div></article>';
}
function homeNews(){
  if(newsNeeded() && !S.newsBusy) setTimeout(function(){ loadNews(false); }, 0);
  var items = ((S.news && S.news.items) || []).slice(0, 10);
  if(!items.length){
    if(S.newsErr) return '<div class="note">' + I('info') + esc(S.newsErr) + '</div>';
    return '<div class="nstrip">' + [0, 1, 2, 3].map(function(){ return '<div class="nmini skel"><div class="nimg"></div><div class="nbody"><i></i><i></i></div></div>'; }).join('') + '</div>';
  }
  return '<div class="nstrip">' + items.map(function(n){ return '<a class="nmini" href="#news" data-act="newsopen" data-v="' + esc(n.id) + '">' + newsImg(n, 'nimg') + '<div class="nbody">' + newsChip(n) + '<b class="clamp3">' + esc(n.title) + '</b><small>' + esc(n.source) + ' · ' + esc(ago(n.date)) + '</small></div></a>'; }).join('') + '</div>';
}
function vNews(){
  if(newsNeeded() && !S.newsBusy) setTimeout(function(){ loadNews(false); }, 0);
  var all = (S.news && S.news.items) || [];
  var counts = {}; all.forEach(function(n){ if(S.newsLang === 'all' || n.lang === S.newsLang) counts[n.cat] = (counts[n.cat] || 0) + 1; });
  var h = '<div class="nwrap"><div class="reels reelsB" id="reels">' + reelsBody() + '</div>';
  h += '<div class="rtop"><a class="rback" href="#home" aria-label="' + esc(t('back')) + '">' + I('arrowl') + '</a><div class="rtabs" role="tablist" aria-label="' + esc(t('news_cat')) + '">' + NEWSCATS.filter(function(c){ return c === 'all' || c === 'top' || counts[c]; }).map(function(c){ var on = S.newsCat === c;
      return '<button type="button" role="tab" data-act="newscat" data-v="' + c + '" aria-selected="' + on + '">' + (c === 'top' ? I('fire') : '') + esc(c === 'top' ? t('news_top') : t('ncs_' + c)) + '</button>'; }).join('') + '</div>' +
    '<button type="button" class="rlang" data-act="newsfilter" aria-label="' + esc(t('news_lang')) + '" title="' + esc(t('news_lang')) + '"><span>अ</span><small>A</small>' + (S.newsLang === 'all' ? '' : '<em>' + esc(({mr: 'म', hi: 'हि', en: 'E'})[S.newsLang]) + '</em>') + '</button></div>';
  h += '<div id="nsheet">' + newsSheet() + '</div></div>';
  return h;
}
function reelsBody(){
  var all = (S.news && S.news.items) || [];
  if(!all.length){
    if(S.newsErr) return '<div class="rempty"><span class="ico r">' + I('alert') + '</span><p>' + esc(S.newsErr) + '</p><button class="btn bp" data-act="newsref">' + I('refresh') + esc(t('news_refresh')) + '</button></div>';
    return '<div class="rempty"><span class="spin"></span><p>' + esc(t('news_loading')) + '</p></div>';
  }
  var list = newsList();
  if(!list.length) return '<div class="rempty"><span class="ico b">' + I('news') + '</span><p>' + esc(t('news_empty')) + '</p><button class="btn bs" data-act="newscat" data-v="all">' + esc(t('nc_all')) + '</button></div>';
  S.reelN = Math.min(list.length, Math.max(S.reelN || 0, 25));
  return list.slice(0, S.reelN).map(function(n, i){ return reelItem(n, i, list.length); }).join('');
}
function reelItem(n, i, total){
  var ai = S.newsAI[n.id], spk = S.speakingId === 'nread' + n.id, ready = ai && ai.text && !ai.busy;
  return '<article class="reel rB" id="n-' + esc(n.id) + '" data-i="' + i + '">' + newsImg(n, 'rbg') + '<div class="rsh"></div>' +
    '<div class="rtx"><div class="rmeta"><span class="rcat" style="background:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '">' + esc(t('nc_' + n.cat)) + '</span><span class="rcnt">' + num(i + 1, 0) + ' / ' + num(total, 0) + '</span></div>' +
      '<h2>' + esc(n.title) + '</h2>' + (n.summary ? '<p>' + esc(n.summary) + '</p>' : '') +
      '<a class="rsrc" href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(n.source) + ' · ' + esc(ago(n.date)) + ' · <u>' + esc(t('news_full')) + ' ›</u></a></div>' +
    '<div class="rside">' + (S.sample ? '<button type="button" data-act="newsai" data-v="' + esc(n.id) + '"' + (ready ? ' class="ready"' : '') + '>' + I('spark') + '<small>' + esc(t('news_ai_btn')) + '</small></button>' : '') +
      (S.tts ? '<button type="button" data-act="speak" data-v="nread' + esc(n.id) + '"' + (spk ? ' class="on"' : '') + '>' + I(spk ? 'stop' : 'vol') + '<small>' + esc(spk ? t('stop') : t('listen')) + '</small></button>' : '') +
      '<button type="button" data-act="newsshare" data-v="' + esc(n.id) + '">' + I('share') + '<small>' + esc(t('share')) + '</small></button>' +
      '<a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + I('ext') + '<small>' + esc(t('news_open')) + '</small></a></div>' +
    (i === 0 && total > 1 ? '<div class="rswipe">' + I('chev', 'up') + esc(t('news_swipe')) + '</div>' : '') + '</article>';
}
function newsSheet(){
  var id = S.newsSheet, n = id && newsById(id), ai = id && S.newsAI[id]; if(!n || !ai) return '';
  return '<div class="nsbg" data-act="nsclose"></div><div class="nsheet" role="dialog" aria-label="' + esc(t('news_ai_s')) + '"><div class="nsgrab"></div><div class="nshd"><span class="ico g">' + I('spark') + '</span><div><b>' + esc(t('news_ai_s')) + '</b><small>' + esc(n.title) + '</small></div><button class="xbtn" data-act="nsclose" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="nsbody md" id="nsbody">' + (ai.text ? md(ai.text) : '') + (ai.busy ? '<div class="load" style="padding:6px 0"><span class="spin"></span>' + (ai.text ? '' : esc(t('thinking'))) + '</div>' : '') + (ai.err ? '<div class="note r">' + I('alert') + esc(ai.err) + '</div><button class="btn bs bsm" style="margin-top:10px" data-act="newsairetry" data-v="' + esc(id) + '">' + I('refresh') + esc(t('news_refresh')) + '</button>' : '') + (!ai.busy && ai.text ? '<p class="xs mu2" style="margin:10px 0 0">' + esc(t('news_ai_note')) + '</p>' : '') + '</div>' +
    (!ai.busy && ai.text ? '<div class="nsft">' + (S.tts ? '<button class="btn bs bsm" data-act="speak" data-v="newsai' + esc(id) + '">' + I(S.speakingId === 'newsai' + id ? 'stop' : 'vol') + esc(S.speakingId === 'newsai' + id ? t('stop') : t('listen')) + '</button>' : '') + '<button class="btn bs bsm" data-act="download" data-v="news' + esc(id) + '" aria-label="' + esc(t('download')) + '">' + I('download') + 'PDF</button>' + '<a class="btn bp bsm" href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(t('news_full')) + I('ext') + '</a></div>' : '') + '</div>';
}
function patchSheet(){ var s = $('#nsheet'); if(!s) return; var b = $('#nsbody'), st = b ? b.scrollTop : 0, nearEnd = b && b.scrollTop + b.clientHeight >= b.scrollHeight - 30; s.innerHTML = newsSheet(); var nb = $('#nsbody'); if(nb) nb.scrollTop = nearEnd ? nb.scrollHeight : st; }
function nextHeads(i){ var l = newsList().slice(i + 1, i + 4); if(!l.length) return ''; return '<div class="rnext"><small>' + esc(t('news_next_h')) + '</small>' + l.map(function(n, j){ return '<button type="button" data-act="reelnext" data-v="' + (i + 1 + j) + '"><span class="rnd" style="background:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '"></span><span>' + esc(n.title) + '</span></button>'; }).join('') + '</div>'; }
function sizeReels(){
  var r = $('#reels'); if(!r) return;
  var bn = document.querySelector('.bnav'), bnh = bn && getComputedStyle(bn).display !== 'none' ? bn.getBoundingClientRect().height : 0;
  var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  var hgt = Math.max(380, vh - r.getBoundingClientRect().top - bnh - (bnh ? 0 : (window.innerWidth > 600 ? 16 : 0)));
  r.style.height = hgt + 'px';
}
var reelObs = null;
function setupReels(){
  sizeReels();
  var r = $('#reels'); if(!r) return;
  if(reelObs){ reelObs.disconnect(); reelObs = null; }
  var last = r.querySelector('.reel:last-child');
  if(last && 'IntersectionObserver' in window){
    reelObs = new IntersectionObserver(function(en){ if(en[0].isIntersecting){ reelObs.disconnect(); var list = newsList(); if(S.reelN < list.length){ var from = S.reelN; S.reelN = Math.min(list.length, S.reelN + 20); var tmp = document.createElement('div'); tmp.innerHTML = list.slice(from, S.reelN).map(function(n, i){ return reelItem(n, from + i, list.length); }).join(''); while(tmp.firstChild) r.appendChild(tmp.firstChild); setupReels(); } } }, {root: r, rootMargin: '0px 0px 200% 0px'});
    reelObs.observe(last);
  }
}
function reelIndex(){ var r = $('#reels'); return r ? Math.round(r.scrollTop / Math.max(1, r.clientHeight)) : 0; }
function reelScrollTo(i){ var r = $('#reels'); if(r) r.scrollTo({top: i * r.clientHeight, behavior: 'smooth'}); }
function patchNews(){ var b = $('#reels'); if(b){ b.innerHTML = reelsBody(); b.scrollTop = 0; setupReels(); } }
function watchMore(){ setupReels(); }
function openNewsFilter(){
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:420px"><div class="mhead" style="padding:0 0 12px"><h2>' + esc(t('news_lang')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="langpick">' + [['all', t('lang_all')], ['mr', 'मराठी'], ['hi', 'हिंदी'], ['en', 'English']].map(function(l){ return '<button type="button" data-act="newslangpick" data-v="' + l[0] + '" aria-pressed="' + (S.newsLang === l[0]) + '">' + esc(l[1]) + '</button>'; }).join('') + '</div>' +
    '<button class="btn bs" style="width:100%;margin-top:14px" data-act="newsref">' + I('refresh') + esc(t('news_refresh')) + '</button><p class="xs mu2" style="margin:10px 0 0;text-align:center">' + (S.news ? esc(t('news_updated', {t: ago(S.news.updated)})) : '') + '</p></div></div>');
}
function shareNews(id){
  var n = newsById(id); if(!n) return;
  if(navigator.share){ navigator.share({title: n.title, text: n.title, url: n.url}).catch(function(){}); return; }
  var txt = n.title + '\n' + n.url;
  if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ toast(t('copied')); }); else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}
function toast(msg){ var d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 2200); }

/* ================= DOWNLOAD AI REPORTS (PDF via the phone's "Save as PDF") ================= */
function reportFor(sid){
  var c, x;
  if(sid.indexOf('rep:') === 0){ var sr = repById(sid.slice(4)); return sr ? {title: sr.title, md: sr.md, img: sr.img} : null; }
  if(sid.indexOf('guide') === 0){ c = crop(sid.slice(5)); var g = S.guides[sid.slice(5) + '|' + S.lang + '|' + place()]; return g && g.text ? {title: t('ai_guide') + ' — ' + (c ? L(c.n) : ''), md: g.text} : null; }
  if(sid.indexOf('review') === 0){ var cy = cyc(sid.slice(6)), rv = S.reviews[sid.slice(6)]; if(!rv || !rv.text) return null; c = cy && crop(cy.crop); return {title: t('ai_review_h') + ' — ' + (c ? L(c.n) : '') + (cy && cy.plot ? ' · ' + cy.plot : ''), md: rv.text}; }
  if(sid === 'scanone'){ var d = (S.scanRes.one || {}).data; if(!d) return null; var st = String(d.status || '').toLowerCase();
    var m = '## ' + (st === 'healthy' ? t('healthy') : (d.problem || '—')) + (d.problem_en && S.lang !== 'en' ? ' (' + d.problem_en + ')' : '') + '\n' + (d.plant ? '**' + t('crop') + ':** ' + d.plant + '  \n' : '') + '**' + t('r_conf') + ':** ' + lvlT(d.confidence) + (d.severity ? ' · **' + t('r_sev') + ':** ' + lvlT(d.severity) : '') + '\n';
    function sec(k, v, ol){ if(!v || (Array.isArray(v) && !v.length)) return ''; return '\n### ' + t(k) + '\n' + (Array.isArray(v) ? v.map(function(s, i){ return (ol ? (i + 1) + '. ' : '- ') + s; }).join('\n') : v) + '\n'; }
    m += sec('r_observed', d.observed) + sec('r_cause', d.cause) + sec('r_threshold', d.threshold) + sec('r_organic', d.organic, true) + sec('r_enemies', d.natural_enemies) + sec('r_prev', d.prevention) + sec('r_chem', d.chemical) + sec('r_expert', d.expert);
    return {title: t('t_doctor'), md: m, img: S.scanUrl}; }
  if(sid === 'soilplan' && S.soilPlan && S.soilPlan.text){ var v = soilRates(S.soilForm, S.soilForm._pu || 'p');
    var tbl = v.length ? '| ' + t('soil_result') + ' | | |\n|---|---|---|\n' + v.map(function(x){ return '| ' + t('sp_' + x.p.k) + ' | ' + x.v + ' ' + x.p.u + ' | ' + t(x.r.lv) + ' |'; }).join('\n') + '\n\n' : '';
    return {title: t('soil_plan'), md: tbl + S.soilPlan.text}; }
  if(sid === 'soilhome' && S.soilHome && S.soilHome.text) return {title: t('soil_home_ask'), md: S.soilHome.text};
  if(sid === 'wx' && S.wxAI && S.wxAI.text){ var w = wxFresh(); return {title: t('wx_ai') + ' — ' + wxPlace(), md: (w ? '**' + t('wx_now') + ':** ' + Math.round(w.current.temperature_2m) + '°C, ' + t(wmo(w.current.weather_code)[0]) + '\n\n' : '') + S.wxAI.text}; }
  if(sid === 'reco' && S.reco && S.reco.data){ var se = S.reco.season;
    return {title: t('planner_h') + ' — ' + t(se), md: S.reco.data.crops.map(function(r, i){ return '### ' + (i + 1) + '. ' + (r.name || '') + '\n' + (r.why || '') + '\n\n- ' + t('duration') + ': ' + (r.duration || '—') + '\n- ' + t('water') + ': ' + lvlT(r.water) + (r.profit ? '\n- ' + t('profit') + ': ' + lvlT(r.profit) : '') + (r.risk ? '\n- ' + t('risk') + ': ' + lvlT(r.risk) : '') + (r.tip ? '\n- 💡 ' + r.tip : ''); }).join('\n\n') + (S.reco.data.note ? '\n\n> ' + S.reco.data.note : '')}; }
  if(sid.indexOf('news') === 0){ var n = newsById(sid.slice(4)), a = S.newsAI[sid.slice(4)]; return n && a && a.text ? {title: n.title, md: a.text + '\n\n' + t('news_read') + ': ' + n.url} : null; }
  if(sid.indexOf('chat') === 0){ var cm = S.chat[+sid.slice(4)]; return cm && cm.content ? {title: t('ai_h'), md: cm.content} : null; }
  return null;
}
function dlBtn(sid){ return '<button class="btn bs bsm" data-act="download" data-v="' + esc(sid) + '">' + I('download') + esc(t('download')) + '</button>'; }
function downloadReport(sid){
  var r = reportFor(sid); if(!r || !r.md) return;
  var now = new Date(), when = fmtD(now) + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  var html = '<!DOCTYPE html><html lang="' + S.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t('app') + ' — ' + r.title) + '</title><style>' +
    '@page{margin:16mm}body{font-family:"Mukta","Noto Sans Devanagari",system-ui,sans-serif;color:#13201A;max-width:760px;margin:0 auto;padding:20px;line-height:1.6;font-size:15px}' +
    '.bar{display:flex;gap:10px;justify-content:center;margin-bottom:18px}.bar button{font:inherit;font-weight:700;padding:10px 18px;border-radius:10px;border:1px solid #1D6F42;background:#1D6F42;color:#fff}.bar button.s{background:#fff;color:#1D6F42}' +
    'header{display:flex;align-items:center;gap:12px;border-bottom:3px solid #1D6F42;padding-bottom:12px;margin-bottom:16px}header .mk{width:44px;height:44px;border-radius:12px;background:#1D6F42;display:grid;place-items:center}' +
    'header b{font-size:20px;color:#14532F}header small{display:block;color:#56635B;font-size:12.5px}h1{font-size:22px;margin:0 0 6px}.meta{color:#56635B;font-size:13px;margin-bottom:16px}' +
    'h2{font-size:18px;color:#14532F;margin:18px 0 6px}h3{font-size:16px;margin:14px 0 4px}table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border:1px solid #D3D9CC;padding:6px 8px;text-align:left;vertical-align:top}th{background:#E6F2EA}' +
    'blockquote{margin:10px 0;padding:8px 12px;background:#FCF1D8;border-left:4px solid #D9920E}img.ph{max-width:240px;border-radius:12px;margin:6px 0 10px}footer{margin-top:24px;border-top:1px solid #D3D9CC;padding-top:10px;font-size:12px;color:#6F7A73}' +
    '@media print{.bar{display:none}body{padding:0}}</style></head><body>' +
    '<div class="bar"><button onclick="window.print()">' + esc(t('save_pdf')) + '</button><button class="s" onclick="window.close()">' + esc(t('close')) + '</button></div>' +
    '<header><span class="mk">' + MARK + '</span><div><b>' + esc(t('app')) + '</b><small>' + esc(t('tagline')) + '</small></div></header>' +
    '<h1>' + esc(r.title) + '</h1><div class="meta">' + esc(place()) + ' · ' + esc(when) + '</div>' + (r.img ? '<img class="ph" src="' + r.img + '" alt="">' : '') + '<div class="content">' + md(r.md) + '</div>' +
    '<footer>' + esc(t('disclaimer')) + '<br>' + esc(t('helpline')) + ': 1800-180-1551</footer>' +
    '<script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},500)});<\/script></body></html>';
  var w = null; try{ w = window.open('', '_blank'); }catch(e){}
  if(w && w.document){ w.document.open(); w.document.write(html); w.document.close(); return; }
  /* pop-up blocked: download as a file the phone can open and save as PDF */
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], {type: 'text/html'})); a.download = (t('app') + ' - ' + r.title).replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80) + '.html'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function newsById(id){ var it = (S.news && S.news.items) || []; for(var i = 0; i < it.length; i++) if(it[i].id === id) return it[i]; return null; }
function runNewsAI(id, force){
  var n = newsById(id); if(!n || !S.sample) return;
  S.newsSheet = id;
  var old = S.newsAI[id]; if(!force && old && (old.busy || (old.text && !old.err))){ patchSheet(); return; }
  S.newsAI[id] = {text: '', busy: true}; patchSheet();
  var ctrl = new AbortController(); setTimeout(function(){ ctrl.abort(); }, 9000);
  fetch('/api/article?url=' + encodeURIComponent(n.url), {signal: ctrl.signal}).then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; }).then(function(a){
    var full = String((a && a.text) || '').slice(0, 5000);
    var prompt = 'TASK: Explain this farm news to a farmer in very simple words.\nHeadline: ' + n.title + '\nSource: ' + n.source + ', ' + new Date(n.date).toDateString() + '\n' +
      (full.length > 200 ? 'Full article text:\n<<<\n' + full + '\n>>>\n' : 'Summary: ' + (n.summary || '(no summary available)') + '\n') +
      'Write 3-5 short bullet points: what happened (with the important numbers, places and dates from the text), who it affects, and what a farmer should do or check now. Then one line starting with "👉" with the most useful practical tip.\n' +
      'Use ONLY facts from the text given — do not invent numbers, dates or claims. Do not tell the farmer to "read the full news"; explain what is known. If the text is very short, explain what the headline means for farmers and what to watch for.';
    S.sample(prompt, {system: EXPERT + '\n' + aiLangRule(), task: 'short', onText: function(u){ S.newsAI[id].text = u.text; if(S.newsSheet === id) patchSheet(); }})
      .then(function(r){ S.newsAI[id] = {text: r.text}; patchSheet(); patchCard(id); })
      .catch(function(e){ S.newsAI[id] = {err: aiMsg(e), text: e.text || ''}; patchSheet(); });
  });
}
function patchCard(id){ var el = document.getElementById('n-' + id), n = newsById(id); if(!el || !n) return; var list = newsList(), i = +el.getAttribute('data-i'); var d = document.createElement('div'); d.innerHTML = reelItem(n, i, list.length); el.replaceWith(d.firstChild); }

/* ================= SOIL TEST ================= */
function soilP(k){ for(var i = 0; i < SOILP.length; i++) if(SOILP[i].k === k) return SOILP[i]; return null; }
/* value used for rating (P given as P2O5 is converted to P) */
function soilVal(v, k, pu){ var x = v[k]; if(x === '' || x == null || isNaN(+x)) return null; x = +x; if(k === 'p' && pu === 'p2o5') x = x / 2.29; return x; }
function soilRates(v, pu){ var out = []; SOILP.forEach(function(p){ var x = soilVal(v, p.k, pu); if(x == null) return; out.push({p: p, v: +v[p.k], r: soilRate(p, x)}); }); return out; }
function soilSummaryEn(v, pu){
  var names = {ph: 'pH', ec: 'EC', oc: 'organic carbon', n: 'N', p: 'P', k: 'K', s: 'S', zn: 'Zn', fe: 'Fe', mn: 'Mn', cu: 'Cu', b: 'B'};
  return soilRates(v, pu).map(function(x){ var lv = x.r.lv.replace(/^(ph|ec)_/, ''); lv = {acid: 'acidic', sacid: 'slightly acidic', neutral: 'neutral', salk: 'slightly alkaline', alk: 'strongly alkaline', normal: 'normal', mod: 'some salts', high: 'high'}[lv] || lv;
    return names[x.p.k] + ' ' + x.v + (x.p.u ? ' ' + (x.p.k === 'p' && pu === 'p2o5' ? 'kg/ha as P2O5' : x.p.u) : '') + ' (' + lv + ')'; }).join(', ');
}
function soilAdvice(x){
  var k = x.p.k, lv = x.r.lv;
  if(x.r.tone === 'g') return null;
  var key = k === 'ph' ? 'sa_' + lv : (k === 'ec' ? 'sa_' + lv : 'sa_' + k + '_' + lv);
  return T.en[key] ? t(key) : null;
}
function soilBar(x){
  var p = x.p, v = x.v, lo, hi, max, pos, grad;
  if(p.ph){ lo = 4; max = 10; pos = (Math.min(max, Math.max(lo, v)) - lo) / (max - lo) * 100; grad = 'linear-gradient(90deg,var(--red) 0 25%,var(--sun) 25% 41.6%,var(--g3) 41.6% 58.3%,var(--sun) 58.3% 75%,var(--red) 75%)'; }
  else { var r = p.r; hi = p.k === 'p' && S.soilForm._pu === 'p2o5' ? r[1] * 2.29 : r[1]; var l0 = p.k === 'p' && S.soilForm._pu === 'p2o5' ? r[0] * 2.29 : r[0]; max = hi * 2; pos = Math.min(100, v / max * 100); var a = l0 / max * 100, b = 50;
    grad = p.ec ? 'linear-gradient(90deg,var(--g3) 0 ' + a + '%,var(--sun) ' + a + '% ' + b + '%,var(--red) ' + b + '%)' : 'linear-gradient(90deg,var(--red) 0 ' + a + '%,var(--sun) ' + a + '% ' + b + '%,var(--g3) ' + b + '%)'; }
  return '<span class="sbar" style="background:' + grad + '"><i style="left:' + pos + '%"></i></span>';
}
function soilReport(){
  var v = S.soilForm, pu = v._pu || 'p', rs_ = soilRates(v, pu);
  if(!rs_.length) return '<div class="card empty"><span class="ico o">' + I('layers') + '</span><p style="margin:0">' + esc(t('soil_fill')) + '</p></div>';
  var sc = rs_.reduce(function(a, x){ return a + (x.r.tone === 'g' ? 1 : (x.r.tone === 's' ? 0.5 : 0)); }, 0) / rs_.length;
  var lvk = sc >= 0.75 ? 'good' : (sc >= 0.5 ? 'fair' : 'poor'), tone = sc >= 0.75 ? 'g' : (sc >= 0.5 ? 's' : 'r');
  var h = '<div class="card pad"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h2 style="font-size:20px">' + esc(t('soil_result')) + '</h2><span class="score ' + tone + '"><b>' + num(Math.round(sc * 100), 0) + '</b><small>/100</small></span></div><p class="sm" style="margin:0 0 14px"><span class="chip ' + tone + '">' + esc(t('soil_score')) + ': ' + esc(t('soil_' + lvk)) + '</span></p>';
  h += '<div class="srows">' + rs_.map(function(x){ return '<div class="srow"><span class="nm">' + esc(t('sp_' + x.p.k)) + '</span><span class="vl">' + num(x.v) + ' <small>' + esc(x.p.k === 'p' && pu === 'p2o5' ? 'P₂O₅ kg/ha' : x.p.u) + '</small></span><span class="chip ' + x.r.tone + '">' + esc(t(x.r.lv)) + '</span>' + soilBar(x) + '</div>'; }).join('') + '</div></div>';
  var adv = rs_.map(function(x){ var a = soilAdvice(x); return a ? {x: x, a: a} : null; }).filter(Boolean);
  if(adv.length) h += '<div class="rsec g" style="margin-top:14px"><h3>' + I('leaf') + esc(t('soil_quick')) + '</h3><ul>' + adv.map(function(o){ return '<li><b>' + esc(t('sp_' + o.x.p.k)) + ':</b> ' + esc(o.a) + '</li>'; }).join('') + '</ul></div>';
  else h += '<div class="note g" style="margin-top:14px">' + I('check') + esc(t('sa_ok')) + '</div>';
  return h;
}
function patchSoil(){ var el = $('#soilreport'); if(el) el.innerHTML = soilReport(); }
function soilField(p){
  var v = S.soilForm[p.k];
  var unit = p.k === 'p' ? '<select class="inp unitsel" data-act="soilpu" aria-label="' + esc(t('p_unit')) + '"><option value="p"' + ((S.soilForm._pu || 'p') === 'p' ? ' selected' : '') + '>P kg/ha</option><option value="p2o5"' + (S.soilForm._pu === 'p2o5' ? ' selected' : '') + '>P₂O₅ kg/ha</option></select>' : (p.u ? '<span class="u">' + esc(p.u) + '</span>' : '');
  return '<label class="f sf">' + esc(t('sp_' + p.k)) + '<span class="inwrap"><input class="inp" type="number" inputmode="decimal" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" data-act="soilv" data-k="' + p.k + '" id="sv-' + p.k + '" value="' + esc(v == null ? '' : v) + '" placeholder="' + (p.ph ? '7.0' : '') + '">' + unit + '</span></label>';
}
function vSoil(){
  var tab = S.soilTab;
  var h = '<div class="ph"><h1>' + esc(t('soil_h')) + '</h1><p>' + esc(t('soil_d')) + '</p></div>';
  h += '<div class="tabs" role="tablist" style="margin-top:0">' + [['card', 'soil_tab_card'], ['home', 'soil_tab_home'], ['saved', 'soil_tab_saved']].map(function(k){ return '<button type="button" role="tab" data-act="soiltab" data-v="' + k[0] + '" aria-selected="' + (tab === k[0]) + '">' + esc(t(k[1])) + (k[0] === 'saved' && S.soils.length ? ' (' + num(S.soils.length, 0) + ')' : '') + '</button>'; }).join('') + '</div>';
  if(tab === 'card') h += soilCardTab();
  if(tab === 'home') h += soilHomeTab();
  if(tab === 'saved') h += soilSavedTab();
  return h;
}
function soilCardTab(){
  var f = S.soilForm, rd = S.soilRead, vis = S.sampleReady && S.sample && S.imgOk;
  var h = '<div class="grid g2" style="align-items:start"><div class="card pad" style="display:flex;flex-direction:column;gap:16px">';
  if(vis) h += '<label class="scanbtn"><span class="ico g">' + I('camera') + '</span><span style="flex:1"><b>' + esc(t('soil_scan')) + ' <span class="ai-dot">AI</span></b><small>' + esc(t('soil_scan_d')) + '</small></span><input type="file" accept="image/*" data-act="soilscan" aria-label="' + esc(t('soil_scan')) + '"></label>';
  if(rd) h += rd.busy ? '<div class="load" style="padding:0"><span class="spin"></span>' + esc(t('soil_reading')) + '</div>' : '<div class="note ' + (rd.ok ? 'g' : 'r') + '">' + I(rd.ok ? 'check' : 'alert') + esc(rd.ok ? t('soil_read_ok') : t('soil_read_fail')) + '</div>';
  h += '<div><h3 class="sh">' + esc(t('soil_main')) + '</h3><div class="sgrid">' + SOILP.filter(function(p){ return !p.micro; }).map(soilField).join('') + '</div></div>';
  var anyMicro = SOILP.some(function(p){ return p.micro && f[p.k] != null && f[p.k] !== ''; });
  h += '<details class="micro"' + (anyMicro ? ' open' : '') + '><summary>' + esc(t('soil_micro')) + I('chev', 'chev') + '</summary><div class="sgrid" style="margin-top:12px">' + SOILP.filter(function(p){ return p.micro; }).map(soilField).join('') + '</div></details>';
  h += '<div class="sgrid"><label class="f">' + esc(t('soil_plot')) + '<input class="inp" data-act="soilmeta" data-k="_plot" id="sv-plot" maxlength="40" value="' + esc(f._plot || '') + '"></label><label class="f">' + esc(t('soil_date')) + '<input class="inp" type="date" data-act="soilmeta" data-k="_date" id="sv-date" value="' + esc(f._date || isoDate(today0())) + '"></label></div>';
  h += '<div class="row wrap"><button class="btn bp" data-act="soilsave">' + I(S.soilJustSaved ? 'check' : 'plus') + esc(S.soilJustSaved ? t('soil_saved') : t('soil_save')) + '</button><button class="btn bs" data-act="soilclear">' + I('x') + esc(t('soil_clear')) + '</button></div>';
  h += '<a class="sm" href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener" style="display:inline-flex;gap:6px;align-items:center;font-weight:600">' + esc(t('soil_labs')) + I('ext').replace('<svg', '<svg width="15" height="15" stroke="currentColor"') + '</a></div>';
  h += '<div><div id="soilreport">' + soilReport() + '</div>' + soilPlanBox() + '</div></div>';
  return h;
}
function soilPlanBox(){
  var pl = S.soilPlan, f = S.soilForm;
  var h = '<div class="aibox" style="margin-top:16px"><div style="display:flex;gap:12px;align-items:flex-start"><span class="ico s">' + I('spark') + '</span><div><h2 style="font-size:19px">' + esc(t('soil_plan')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('soil_plan_d')) + '</p></div></div>';
  if(S.sampleReady && !S.sample) return h + '<div class="note" style="margin-top:12px">' + I('info') + esc(t('ai_off')) + '</div></div>';
  h += '<div class="grid g3" style="margin-top:14px;align-items:end"><label class="f">' + esc(t('soil_crop')) + '<select class="inp" id="spcrop">' + cropOptions(f._crop || (S.cycles[0] && S.cycles[0].crop) || 'wheat') + '</select></label>' +
    '<label class="f">' + esc(t('f_area')) + '<input class="inp" type="number" min="0.1" step="0.1" id="sparea" value="' + esc(f._area || 1) + '"></label><label class="f">&nbsp;<select class="inp" id="spunit">' + ['acre', 'guntha', 'hectare'].map(function(u){ return '<option value="' + u + '"' + ((f._unit || 'acre') === u ? ' selected' : '') + '>' + esc(t(u)) + '</option>'; }).join('') + '</select></label></div>';
  h += '<div class="row" style="margin-top:12px">' + (pl && pl.busy ? '<button class="btn bs" data-act="ai-stop" data-k="soil">' + I('stop') + esc(t('stop_gen')) + '</button>' : '<button class="btn bp" data-act="soilplan"' + (S.sampleReady ? '' : ' disabled') + '>' + I('spark') + esc(t('soil_get_plan')) + '</button>' + (pl && pl.text ? speakBtn('soilplan') : '')) + '</div>';
  h += '<div class="md" id="soilplan-out" style="margin-top:' + (pl ? '14px' : '0') + '">' + (pl ? (pl.text ? md(pl.text) : '') + (pl.busy ? '<div class="load"><span class="spin"></span>' + esc(pl.text ? '' : t('thinking')) + '</div>' : '') + (pl.err ? '<div class="note r">' + I('alert') + esc(pl.err) + '</div>' : '') : '') + '</div>' + (pl && pl.text && !pl.busy ? '<p class="xs mu2" style="margin:12px 0 0">' + esc(t('disclaimer')) + '</p>' : '') + '</div>';
  return h;
}
function soilHomeTab(){
  var q = S.soilHomeQ, r = S.soilHome;
  var h = '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px">' + HOMETESTS.map(function(x){ var open = S.openTest === x.id;
    return '<div class="rcard' + (open ? ' open' : '') + '"><button type="button" data-act="hometest" data-v="' + x.id + '" aria-expanded="' + open + '"><span class="ico o">' + I(x.id === 'ph' ? 'flask' : (x.id === 'drain' ? 'drop' : (x.id === 'worm' ? 'sprout' : 'jar'))) + '</span><span class="tx"><b>' + esc(L(x.n)) + '</b></span>' + I('chev', 'chev') + '</button><div class="body">' + (open ? '<div class="grid g2" style="margin-top:16px;align-items:start"><div><h3 style="font-size:16px;margin-bottom:8px">' + esc(t('method')) + '</h3><ol class="steps">' + L(x.m).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div><div class="note g" style="align-self:start">' + I('info') + '<span>' + esc(L(x.read)) + '</span></div></div>' : '') + '</div></div>'; }).join('') + '</div>';
  function sel(k, opts){ return '<label class="f">' + esc(t('hq_' + k)) + '<select class="inp" data-act="soilq" data-k="' + k + '"><option value="">' + esc(t('o_unknown')) + '</option>' + opts.map(function(o){ return '<option value="' + o + '"' + (q[k] === o ? ' selected' : '') + '>' + esc(t('o_' + o)) + '</option>'; }).join('') + '</select></label>'; }
  h += '<div class="aibox"><div style="display:flex;gap:12px;align-items:flex-start"><span class="ico s">' + I('spark') + '</span><div><h2 style="font-size:19px">' + esc(t('soil_home_ask')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('soil_home_d')) + '</p></div></div>';
  h += '<div class="grid g3" style="margin-top:14px">' + sel('color', ['black', 'red', 'brown', 'yellow', 'white']) + sel('texture', ['sandy', 'loam', 'clay']) + sel('drain', ['fast', 'good', 'slow']) + sel('worms', ['many', 'few', 'vfew']) + sel('fizz', ['vinegar', 'soda', 'none']) + '<label class="f">' + esc(t('hq_crop')) + '<input class="inp" data-act="soilq" data-k="crop" id="hq-crop" maxlength="120" value="' + esc(q.crop || '') + '"></label></div>';
  if(S.sampleReady && !S.sample) h += '<div class="note" style="margin-top:12px">' + I('info') + esc(t('ai_off')) + '</div>';
  else h += '<div class="row" style="margin-top:14px">' + (r && r.busy ? '<button class="btn bs" data-act="ai-stop" data-k="soilhome">' + I('stop') + esc(t('stop_gen')) + '</button>' : '<button class="btn bp" data-act="soilhome"' + (S.sampleReady ? '' : ' disabled') + '>' + I('spark') + esc(t('soil_home_btn')) + '</button>' + (r && r.text ? speakBtn('soilhome') : '')) + '</div>';
  h += '<div class="md" id="soilhome-out" style="margin-top:' + (r ? '14px' : '0') + '">' + (r ? (r.text ? md(r.text) : '') + (r.busy ? '<div class="load"><span class="spin"></span>' + esc(r.text ? '' : t('thinking')) + '</div>' : '') + (r.err ? '<div class="note r">' + I('alert') + esc(r.err) + '</div>' : '') : '') + '</div></div>';
  return h;
}
function soilSavedTab(){
  if(!S.soils.length) return '<div class="card empty"><span class="ico o">' + I('layers') + '</span><p style="margin:0">' + esc(t('soil_none')) + '</p></div>';
  return '<div class="card lst">' + S.soils.map(function(r){ var rs_ = soilRates(r.v, r.pu); var bad = rs_.filter(function(x){ return x.r.tone === 'r'; });
    return '<div class="li" style="align-items:flex-start"><span class="ico o" style="width:40px;height:40px;border-radius:12px">' + I('layers') + '</span><div class="tx"><b>' + esc((r.plot || t('soil_tab_card')) + ' · ' + fmtD(parseD(r.date))) + '</b><div class="row wrap" style="gap:6px;margin-top:6px">' + rs_.slice(0, 6).map(function(x){ return '<span class="chip ' + x.r.tone + '">' + esc(t('sp_' + x.p.k).split(' (')[0]) + ': ' + esc(t(x.r.lv)) + '</span>'; }).join('') + '</div>' + (bad.length ? '' : '') + '</div><button class="btn bs bsm" data-act="soilopen" data-v="' + r.id + '">' + esc(t('soil_open')) + '</button><button class="xbtn" data-act="soildel" data-v="' + r.id + '" aria-label="' + esc(t('delete')) + '">' + I('trash') + '</button></div>'; }).join('') + '</div>';
}
function saveSoilDraft(){ lsSet('soilDraft', S.soilForm); }
function soilValues(){ var o = {}; SOILP.forEach(function(p){ var x = S.soilForm[p.k]; if(x !== '' && x != null && !isNaN(+x)) o[p.k] = +x; }); return o; }
function saveSoil(){
  var v = soilValues(); if(!Object.keys(v).length){ patchSoil(); return; }
  var f = S.soilForm, rec = {id: uid('s'), date: f._date || isoDate(today0()), plot: String(f._plot || '').trim().slice(0, 40), v: v, pu: f._pu || 'p', created: Date.now()};
  S.soils = [rec].concat(S.soils.filter(function(r){ return !(r.date === rec.date && r.plot === rec.plot); })).slice(0, 30);
  S.soils.sort(function(a, b){ return a.date < b.date ? 1 : (a.date > b.date ? -1 : b.created - a.created); });
  lsSet('soils', S.soils); S.soilJustSaved = true; render(); setTimeout(function(){ S.soilJustSaved = false; if(route().v === 'soil') softRender(); }, 2500);
}
function runSoilRead(file){
  if(!S.sample || !file) return;
  S.soilRead = {busy: true}; softRender();
  var prompt = 'TASK: This is a photo of an Indian Soil Health Card or soil test report. Read the soil test RESULT values (not the "normal level" / reference columns).\n' +
    'Reply with ONLY JSON: {"ok":true,"ph":null,"ec":null,"oc":null,"n":null,"p":null,"p_unit":"P|P2O5","k":null,"s":null,"zn":null,"fe":null,"mn":null,"cu":null,"b":null,"plot":"<survey / field no. if printed, else empty>","date":"<YYYY-MM-DD if printed, else empty>"}\n' +
    'Rules: numbers only (no units). EC in dS/m. Organic carbon in % (if it is given in g/kg divide by 10). N, P, K in kg/ha (if given in kg/acre multiply by 2.47). If phosphorus is reported as P2O5 set "p_unit":"P2O5". S and micronutrients in ppm (mg/kg). Use null for any value you cannot read clearly — never guess. If the image is not a soil report, set "ok": false.';
  S.sample.json(prompt, {system: 'You read documents accurately and reply with JSON only.', task: 'vision', images: [file]}).then(function(d){
    var n = 0;
    if(d && d.ok !== false) SOILP.forEach(function(p){ var x = d[p.k]; if(x != null && x !== '' && !isNaN(parseFloat(x))){ S.soilForm[p.k] = parseFloat(x); n++; } });
    if(d && /p2o5/i.test(String(d.p_unit || ''))) S.soilForm._pu = 'p2o5';
    if(d && d.plot && !S.soilForm._plot) S.soilForm._plot = String(d.plot).slice(0, 40);
    if(d && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || ''))) S.soilForm._date = d.date;
    saveSoilDraft(); S.soilRead = {ok: n > 0}; softRender();
  }).catch(function(){ S.soilRead = {ok: false}; softRender(); });
}
function runSoilPlan(){
  var v = soilValues(), f = S.soilForm;
  f._crop = ($('#spcrop') || {}).value || f._crop; f._area = parseFloat(($('#sparea') || {}).value) || 1; f._unit = ($('#spunit') || {}).value || 'acre'; saveSoilDraft();
  var c = crop(f._crop) || CROPS[0], acres = f._unit === 'guntha' ? f._area / 40 : (f._unit === 'hectare' ? f._area * 2.471 : f._area);
  var soil = Object.keys(v).length ? soilSummaryEn(v, f._pu || 'p') : 'NO SOIL TEST VALUES — give a general plan and strongly advise getting a soil test.';
  var prompt = 'TASK: Make a soil-test-based soil improvement and fertilizer plan.\nCrop: ' + c.n.en + (c.x ? ' (high-value foreign crop)' : '') + '. Area: ' + f._area + ' ' + f._unit + ' (= ' + (Math.round(acres * 100) / 100) + ' acre).\nSoil test (kg/ha for N, P, K; ppm for S and micronutrients): ' + soil + '.\n' +
    'Rating limits used: OC % low <0.5, high >0.75; N kg/ha low <280, high >560; P kg/ha low <10, high >25; K kg/ha low <120, high >280.\n' +
    'Write Markdown with these ## sections:\n' +
    '1. Soil in short — 2–3 lines on what is good and what is the main problem\n' +
    '2. Correct the soil before sowing — amendments (lime / gypsum / organic matter) with quantity for ' + (Math.round(acres * 100) / 100) + ' acre, only if needed\n' +
    '3. Organic nutrition — FYM/compost, Ghanjeevamrut, Jeevamrut schedule, biofertilizers (Azotobacter/Rhizobium, PSB, KMB) with quantities for this area\n' +
    '4. Fertilizer plan — first state the general recommended N-P2O5-K2O dose for ' + c.n.en + ' in ' + S.state + ' (kg per acre), then adjust it using the soil test (low → about 25% more, high → about 25% less, medium → normal). Then give a Markdown table: When (stage / days after sowing) | Fertilizer | Per acre | For ' + f._area + ' ' + f._unit + '. Convert to common fertilizers: Urea 46% N, DAP 18-46-0, SSP 16% P2O5, MOP 60% K2O (count the N supplied by DAP). Also show the number of 50-kg bags for the whole area. Add micronutrients only if the test shows a deficiency.\n' +
    '5. Long-term soil care — 3–4 practical points\n' +
    'Do the arithmetic carefully and round to practical amounts. End with one line: compare with the recommendation printed on your Soil Health Card / ask the KVK.';
  S.soilPlan = {text: '', busy: true}; softRender();
  ctl.soil = new AbortController();
  S.sample(prompt, {system: sysPrompt(), task: 'guide', signal: ctl.soil.signal, onText: function(u){ S.soilPlan.text = u.text; var el = $('#soilplan-out'); if(el) el.innerHTML = md(u.text) + '<div class="load"><span class="spin"></span></div>'; }})
    .then(function(r){ S.soilPlan = {text: r.text}; softRender(); saveReport('soilplan'); })
    .catch(function(e){ var g = S.soilPlan; g.busy = false; g.text = e.text || g.text || ''; if(e.code !== 'cancelled') g.err = aiMsg(e); softRender(); });
}
function runSoilHome(){
  var q = S.soilHomeQ, en = {color: 'soil colour', texture: 'jar test (texture)', drain: 'drainage test: water went down in', worms: 'earthworms in a 30x30x20 cm block', fizz: 'vinegar / baking-soda test'};
  var ans = Object.keys(en).map(function(k){ return q[k] ? '- ' + en[k] + ': ' + T.en['o_' + q[k]] : ''; }).filter(Boolean).join('\n');
  var prompt = 'TASK: A farmer did simple home soil tests (no lab). Give a simple soil assessment.\nResults:\n' + (ans || '- (no tests done)') + (q.crop ? '\nProblem seen in crops: ' + q.crop : '') + '\n' +
    'Write Markdown with ## sections: 1) What your soil is probably like (texture, pH tendency, organic matter, drainage) — say clearly these are rough home tests, 2) What to add / do this season with quantities per acre (organic first), 3) Crops that suit this soil in ' + place() + ', 4) Why and where to get a proper lab soil test (Soil Health Card, KVK). Keep it short.';
  S.soilHome = {text: '', busy: true}; softRender();
  ctl.soilhome = new AbortController();
  S.sample(prompt, {system: sysPrompt(), task: 'guide', signal: ctl.soilhome.signal, onText: function(u){ S.soilHome.text = u.text; var el = $('#soilhome-out'); if(el) el.innerHTML = md(u.text) + '<div class="load"><span class="spin"></span></div>'; }})
    .then(function(r){ S.soilHome = {text: r.text}; softRender(); saveReport('soilhome'); })
    .catch(function(e){ var g = S.soilHome; g.busy = false; g.text = e.text || g.text || ''; if(e.code !== 'cancelled') g.err = aiMsg(e); softRender(); });
}

var WEEKDAYS = {en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], hi:['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'], mr:['रवि','सोम','मंगळ','बुध','गुरु','शुक्र','शनि']};
/* ================= WEATHER (Open-Meteo through our server) ================= */
var STATE_CITY = {'Andhra Pradesh':'Vijayawada','Arunachal Pradesh':'Itanagar','Assam':'Guwahati','Bihar':'Patna','Chhattisgarh':'Raipur','Goa':'Panaji','Gujarat':'Ahmedabad','Haryana':'Hisar','Himachal Pradesh':'Shimla','Jharkhand':'Ranchi','Karnataka':'Bengaluru','Kerala':'Thiruvananthapuram','Madhya Pradesh':'Bhopal','Maharashtra':'Pune','Manipur':'Imphal','Meghalaya':'Shillong','Mizoram':'Aizawl','Nagaland':'Kohima','Odisha':'Bhubaneswar','Punjab':'Ludhiana','Rajasthan':'Jaipur','Sikkim':'Gangtok','Tamil Nadu':'Chennai','Telangana':'Hyderabad','Tripura':'Agartala','Uttar Pradesh':'Lucknow','Uttarakhand':'Dehradun','West Bengal':'Kolkata','Delhi':'New Delhi','Jammu and Kashmir':'Srinagar','Ladakh':'Leh','Puducherry':'Puducherry','Chandigarh':'Chandigarh','Andaman and Nicobar Islands':'Port Blair','Lakshadweep':'Kavaratti','Dadra and Nagar Haveli and Daman and Diu':'Daman'};
function wmo(c){ c = +c;
  if(c === 0) return ['wc_clear', 'sun']; if(c === 1) return ['wc_mainly', 'sun']; if(c === 2) return ['wc_partly', 'cloudsun']; if(c === 3) return ['wc_cloudy', 'cloud'];
  if(c === 45 || c === 48) return ['wc_fog', 'cloud']; if(c >= 51 && c <= 57) return ['wc_drizzle', 'rain']; if(c === 61 || c === 80) return ['wc_lightrain', 'rain'];
  if(c === 63 || c === 81 || c === 66) return ['wc_rain', 'rain']; if(c === 65 || c === 82 || c === 67) return ['wc_heavyrain', 'rain']; if(c >= 95) return ['wc_storm', 'storm']; if(c >= 71 && c <= 86) return ['wc_snow', 'cloud'];
  return ['wc_cloudy', 'cloud']; }
function wxPlace(){ return S.gps ? (gpsName() || t('my_location')) : (S.district || STATE_CITY[S.state] || S.state); }
function wxQuery(){ return S.gps ? 'lat=' + S.gps.lat.toFixed(3) + '&lon=' + S.gps.lon.toFixed(3) : 'q=' + encodeURIComponent((S.district || STATE_CITY[S.state] || S.state) + ',' + S.state); }
function loadWx(force){
  var q = wxQuery();
  if(!force && S.wx && S.wx.q === q && Date.now() - S.wx.got < 30 * 60000) return;
  if(S.wxBusy) return;
  S.wxBusy = true; S.wxErr = null;
  fetch('/api/weather?' + q).then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; }); })
    .then(function(j){ j.q = q; j.got = Date.now(); S.wx = j; lsSet('wx', j); })
    .catch(function(e){ S.wxErr = String(e.message || e) === 'location_not_found' ? t('wx_noloc') : t('wx_err'); })
    .then(function(){ S.wxBusy = false; patchWx(); });
}
function patchWx(){
  var v = route().v;
  if(v === 'home'){ var w = $('#wxw'); if(w) w.outerHTML = wxWidget(seasonNow()); var p = $('#wxpanel'); if(p) p.innerHTML = wxDetail(true); }
  if(v === 'weather'){ var b = $('#wxbody'); if(b) b.innerHTML = wxDetail(false); }
}
function wxFresh(){ return S.wx && S.wx.current && S.wx.q === wxQuery() ? S.wx : null; }
function hourIndex(w){ var h = w.hourly && w.hourly.time; if(!h) return 0; var now = String(w.current.time || '').slice(0, 13); for(var i = 0; i < h.length; i++) if(h[i].slice(0, 13) >= now) return i; return 0; }
function wxNext(w, hours, key, fn){ var i0 = hourIndex(w), a = (w.hourly[key] || []).slice(i0, i0 + hours).filter(function(x){ return x != null; }); return a.length ? fn(a) : 0; }
function maxOf(a){ return Math.max.apply(null, a); } function sumOf(a){ return a.reduce(function(x, y){ return x + y; }, 0); }
function wxAdvice(w){
  var out = [], c = w.current, d = w.daily;
  var rain6 = wxNext(w, 6, 'precipitation_probability', maxOf), rain12 = wxNext(w, 12, 'precipitation_probability', maxOf);
  var wind = c.wind_speed_10m || 0, rain3d = sumOf((d.precipitation_sum || []).slice(0, 3).map(function(x){ return x || 0; }));
  var tmax = maxOf((d.temperature_2m_max || []).slice(0, 3)), tmin = Math.min.apply(null, (d.temperature_2m_min || []).slice(0, 3));
  var heavy = (d.precipitation_sum || []).slice(0, 3).some(function(x){ return x >= 50; });
  var hum = c.relative_humidity_2m || 0, temp = c.temperature_2m || 0;
  if(c.precipitation > 0.2 || rain12 >= 50) out.push(['r', 'rain', t('adv_spray_rain', {p: num(rain12, 0)})]);
  else if(wind >= 15) out.push(['s', 'wind', t('adv_spray_wind', {n: num(Math.round(wind), 0)})]);
  else if(rain6 < 30) out.push(['g', 'check', t('adv_spray_ok')]);
  if(heavy) out.push(['r', 'storm', t('adv_heavy')]);
  if(rain3d >= 10) out.push(['b', 'drop', t('adv_irr_skip', {mm: num(Math.round(rain3d), 0)})]);
  else if(tmax >= 35) out.push(['s', 'drop', t('adv_irr_hot')]);
  if(rain3d >= 20 || heavy) out.push(['s', 'flask', t('adv_urea')]);
  if(tmax >= 40) out.push(['r', 'thermo', t('adv_heat', {n: num(Math.round(tmax), 0)})]);
  if(tmin <= 4) out.push(['r', 'thermo', t('adv_frost', {n: num(Math.round(tmin), 0)})]);
  else if(tmin <= 8) out.push(['b', 'thermo', t('adv_cold', {n: num(Math.round(tmin), 0)})]);
  if(hum >= 85 && temp >= 18 && temp <= 32) out.push(['s', 'alert', t('adv_fungal')]);
  return out;
}
function wxWidget(se){
  var w = wxFresh() || (S.wx && S.wx.current ? S.wx : null);
  var inner;
  if(!w){ inner = '<span class="wxi">' + I(S.wxBusy ? 'refresh' : 'cloudsun') + '</span><span class="wxt"><b>' + esc(S.wxErr || (S.wxBusy ? t('wx_loading') : t('wx_h'))) + '</b><small>' + esc(wxPlace()) + '</small></span>'; }
  else { var c = w.current, k = wmo(c.weather_code);
    inner = '<span class="wxi">' + I(k[1]) + '</span><span class="wxt"><b>' + num(Math.round(c.temperature_2m), 0) + '°<em>' + esc(t(k[0])) + '</em></b><small>' + I('pin') + esc(wxPlace()) + ' · ' + esc(t('humidity')) + ' ' + num(c.relative_humidity_2m, 0) + '%</small></span>'; }
  return '<a class="wxw wxpill" id="wxw" href="#weather" aria-label="' + esc(t('wx_h')) + '">' + inner + '<span class="wxs"><b>' + esc(t(se)) + '</b></span></a>';
}
function dayName(iso, i){ if(i === 0) return t('today'); if(i === 1) return t('tomorrow'); var d = parseD(iso); return WEEKDAYS[S.lang][d.getDay()]; }
function wxDetail(compact){
  var w = wxFresh();
  if(!w){
    if(S.wxErr) return '<div class="card pad"><div class="note r">' + I('alert') + esc(S.wxErr) + '</div><div class="row wrap" style="margin-top:12px"><button class="btn bs bsm" data-act="wxretry">' + I('refresh') + esc(t('news_refresh')) + '</button><button class="btn bs bsm" data-act="menu">' + I('pin') + esc(t('wx_setloc')) + '</button></div></div>';
    return '<div class="card pad"><div class="load"><span class="spin"></span>' + esc(t('wx_loading')) + '</div></div>';
  }
  var c = w.current, d = w.daily, k = wmo(c.weather_code), i0 = hourIndex(w), adv = wxAdvice(w);
  var h = '<div class="card wxcard"><div class="wxnow"><span class="wxbig">' + I(k[1]) + '</span><div style="flex:1;min-width:150px"><div class="xs mu2" style="font-weight:600">' + I('pin').replace('<svg', '<svg width="14" height="14" stroke="currentColor" style="vertical-align:-2px"') + ' ' + esc(wxPlace()) + ' · ' + esc(t('wx_now')) + '</div><div class="wxtemp">' + num(Math.round(c.temperature_2m), 0) + '°C</div><div style="font-weight:600">' + esc(t(k[0])) + '</div><div class="sm mu">' + esc(t('feels', {n: num(Math.round(c.apparent_temperature), 0)})) + '</div></div>' +
    '<div class="wxstats"><div>' + I('drop') + '<small>' + esc(t('humidity')) + '</small><b>' + num(c.relative_humidity_2m, 0) + '%</b></div><div>' + I('wind') + '<small>' + esc(t('wind')) + '</small><b>' + num(Math.round(c.wind_speed_10m), 0) + ' km/h</b></div><div>' + I('rain') + '<small>' + esc(t('rain_today')) + '</small><b>' + num(d.precipitation_sum[0] || 0, 1) + ' mm</b></div><div>' + I('sun') + '<small>UV</small><b>' + num(d.uv_index_max ? d.uv_index_max[0] : 0, 0) + '</b></div></div></div>';
  if(adv.length) h += '<div class="wxadv"><h3>' + I('sprout') + esc(t('wx_farm')) + '</h3>' + adv.map(function(a){ return '<div class="advi ' + a[0] + '">' + I(a[1]) + '<span>' + esc(a[2]) + '</span></div>'; }).join('') + '</div>';
  var hrs = [];
  for(var i = i0; i < Math.min(i0 + 24, w.hourly.time.length); i += (compact ? 3 : 2)) hrs.push(i);
  h += '<div class="wxsec"><h3>' + esc(t('wx_hourly')) + '</h3><div class="wxhours">' + hrs.map(function(i){ var kk = wmo(w.hourly.weather_code[i]), pp = w.hourly.precipitation_probability[i] || 0; return '<div class="wxh"><small>' + esc(w.hourly.time[i].slice(11, 16)) + '</small>' + I(kk[1]) + '<b>' + num(Math.round(w.hourly.temperature_2m[i]), 0) + '°</b><span class="pp' + (pp >= 50 ? ' hi' : '') + '">' + I('drop') + num(pp, 0) + '%</span></div>'; }).join('') + '</div></div>';
  h += '<div class="wxsec"><h3>' + esc(t('wx_7day')) + '</h3><div class="wxdays">' + d.time.map(function(day, i){ var kk = wmo(d.weather_code[i]), pp = d.precipitation_probability_max ? d.precipitation_probability_max[i] || 0 : 0;
    return '<div class="wxd"><b class="dn">' + esc(dayName(day, i)) + '</b><span class="di">' + I(kk[1]) + '<span>' + esc(t(kk[0])) + '</span></span><span class="dr' + (pp >= 50 ? ' hi' : '') + '">' + I('drop') + num(pp, 0) + '%' + (d.precipitation_sum[i] >= 0.5 ? ' · ' + num(d.precipitation_sum[i], 1) + ' mm' : '') + '</span><span class="dt"><b>' + num(Math.round(d.temperature_2m_max[i]), 0) + '°</b> / ' + num(Math.round(d.temperature_2m_min[i]), 0) + '°</span></div>'; }).join('') + '</div></div>';
  var ai = S.wxAI;
  h += '<div class="wxsec wxai">' + (S.sampleReady && !S.sample ? '' : (ai && ai.busy ? '<button class="btn bs bsm" data-act="ai-stop" data-k="wx">' + I('stop') + esc(t('stop_gen')) + '</button>' : '<button class="btn bp bsm" data-act="wxai"' + (S.sampleReady ? '' : ' disabled') + '>' + I('spark') + esc(t('wx_ai')) + '</button>')) +
    (ai && ai.text && !ai.busy ? dlBtn('wx') : '') + '<button class="btn bs bsm" data-act="menu">' + I('pin') + esc(t('wx_change')) + '</button>' + (compact ? '<a class="btn bg bsm" href="#weather">' + esc(t('wx_full')) + ' →</a>' : '') + '</div>';
  if(ai) h += '<div class="wxsec md" id="wxai-out">' + (ai.text ? md(ai.text) : '') + (ai.busy ? '<div class="load"><span class="spin"></span>' + esc(ai.text ? '' : t('thinking')) + '</div>' : '') + (ai.err ? '<div class="note r">' + I('alert') + esc(ai.err) + '</div>' : '') + '</div>';
  h += '<p class="xs mu2 wxsrc">' + esc(t('wx_src')) + ' · ' + esc(t('news_updated', {t: ago(w.got || w.at || Date.now())})) + '</p></div>';
  return h;
}
function vWeather(){
  loadWx(false);
  return '<div class="ph"><h1>' + esc(t('wx_h')) + '</h1><p>' + esc(t('wx_d')) + '</p></div><div id="wxbody">' + wxDetail(false) + '</div>';
}
function wxSummaryEn(w){
  var c = w.current, d = w.daily, k = wmo(c.weather_code);
  return 'Now ' + Math.round(c.temperature_2m) + '°C, ' + T.en[k[0]].toLowerCase() + ', humidity ' + c.relative_humidity_2m + '%, wind ' + Math.round(c.wind_speed_10m) + ' km/h. Forecast: ' +
    d.time.slice(0, 5).map(function(day, i){ return day + ' ' + Math.round(d.temperature_2m_max[i]) + '/' + Math.round(d.temperature_2m_min[i]) + '°C, rain ' + (d.precipitation_sum[i] || 0) + ' mm (' + (d.precipitation_probability_max ? d.precipitation_probability_max[i] : '?') + '%)'; }).join('; ');
}
function wxCtx(){ var w = wxFresh(); return w && Date.now() - w.got < 6 * 3600000 ? ' Local weather (' + wxPlace() + '): ' + wxSummaryEn(w) + '.' : ''; }
function runWxAI(){
  var w = wxFresh(); if(!w || !S.sample) return;
  var mine = S.cycles.slice(0, 6).map(function(c){ var x = cycInfo(c); return x.cr.n.en + ' (' + (x.cur ? T.en['st_' + x.cur.k] : 'not sown') + ')'; }).join(', ');
  var prompt = 'TASK: Give farm work advice for the next 5 days based on this weather forecast.\n' + (mine ? 'Crops the farmer is growing now: ' + mine + '.\n' : 'The farmer has not added crops — give advice for the main crops of this district in this season.\n') +
    'Write Markdown: ## Next 5 days — a short day-wise plan (spraying, irrigation, fertilizer, sowing/harvest timing); ## Risks to watch — pests/diseases favoured by this weather and early signs; ## Protect crops and animals — only if there is heat, cold, heavy rain or strong wind. Keep it short and practical; base everything on the forecast given in the context.';
  S.wxAI = {text: '', busy: true}; patchWx();
  ctl.wx = new AbortController();
  S.sample(prompt, {system: sysPrompt(), task: 'guide', signal: ctl.wx.signal, onText: function(u){ S.wxAI.text = u.text; var el = $('#wxai-out'); if(el) el.innerHTML = md(u.text) + '<div class="load"><span class="spin"></span></div>'; }})
    .then(function(r){ S.wxAI = {text: r.text}; patchWx(); saveReport('wx'); })
    .catch(function(e){ var g = S.wxAI; g.busy = false; g.text = e.text || g.text || ''; if(e.code !== 'cancelled') g.err = aiMsg(e); patchWx(); });
}

/* ================= PRECISE LOCATION (GPS → village, taluka, district) ================= */
function normName(s){ return String(s || '').toLowerCase().replace(/district|जिल्हा|ज़िला|जिला/g, '').replace(/[^a-zऀ-ॿ]/g, ''); }
function matchState(name){ var n = normName(name); for(var i = 0; i < STATES.length; i++) if(normName(STATES[i]) === n) return STATES[i]; return ''; }
function matchDistrict(state, name){
  var list = DISTRICTS[state] || [], n = normName(name); if(!n) return '';
  for(var i = 0; i < list.length; i++){ var parts = list[i].split(/[()]/).map(normName).filter(Boolean); if(parts.indexOf(n) > -1) return list[i]; }
  for(var j = 0; j < list.length; j++){ var m = normName(list[j]); if(m.indexOf(n) > -1 || n.indexOf(m.split('(')[0]) > -1) return list[j]; }
  return list.length ? '' : name;
}
function gpsName(){ var g = S.gps; if(!g) return ''; var l = (g.local && g.local.place) ? g.local : (g.en || {}); return l.place || ''; }
function gpsLabel(){ var g = S.gps; if(!g) return ''; var l = (g.local && g.local.place) ? g.local : (g.en || {}); return [l.place, l.taluka && l.taluka !== l.place ? l.taluka : '', l.district, l.state].filter(Boolean).filter(function(x, i, a){ return a.indexOf(x) === i; }).join(', '); }
function applyPlace(g){
  S.gps = g; lsSet('gps', g);
  var st = matchState(g.en && g.en.state); if(st){ S.state = st; lsSet('state', st); }
  var d = matchDistrict(S.state, g.en && g.en.district); if(d){ S.district = d; lsSet('district', d); }
  S.reco = null; S.locBusy = false; S.locErr = null;
  loadWx(true); refreshMenu(); softRender();
  toast('📍 ' + (gpsLabel() || t('my_location')));
}
function locateMe(){
  if(!navigator.geolocation){ S.locErr = t('gps_fail'); refreshMenu(); return; }
  if(window.isSecureContext === false){ S.locErr = t('gps_https'); refreshMenu(); return; }
  S.locBusy = true; S.locErr = null; refreshMenu();
  var best = null, done = false, wid = null;
  function finish(){
    if(done) return; done = true; if(wid != null) navigator.geolocation.clearWatch(wid);
    if(!best){ S.locBusy = false; S.locErr = S.locErr || t('gps_fail'); refreshMenu(); return; }
    var lat = best.coords.latitude, lon = best.coords.longitude, acc = Math.round(best.coords.accuracy || 0);
    fetch('/api/revgeo?lat=' + lat.toFixed(5) + '&lon=' + lon.toFixed(5) + '&lang=' + S.lang).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
      .then(function(j){ applyPlace({lat: lat, lon: lon, acc: acc, en: (j && j.en) || {}, local: (j && j.local) || {}, src: 'gps', at: Date.now()}); });
  }
  /* watch for up to 12 s and keep the most accurate fix (stop early when within 50 m) */
  wid = navigator.geolocation.watchPosition(function(p){ if(!best || p.coords.accuracy < best.coords.accuracy) best = p; if(p.coords.accuracy <= 50) finish(); },
    function(err){ if(err.code === 1){ S.locErr = t('gps_denied'); best = null; finish(); } },
    {enableHighAccuracy: true, timeout: 20000, maximumAge: 0});
  setTimeout(finish, 12000);
}
function searchPlace(q){
  q = String(q || '').trim(); if(q.length < 2) return;
  S.placeRes = {busy: true}; refreshMenu();
  fetch('/api/geosearch?lang=' + S.lang + '&q=' + encodeURIComponent(q)).then(function(r){ return r.json(); })
    .then(function(j){ S.placeRes = {list: (j && j.results) || []}; refreshMenu(); })
    .catch(function(){ S.placeRes = {list: [], err: true}; refreshMenu(); });
}
function pickPlace(i){
  var r = S.placeRes && S.placeRes.list && S.placeRes.list[i]; if(!r) return;
  S.placeRes = null;
  fetch('/api/revgeo?lat=' + r.lat.toFixed(5) + '&lon=' + r.lon.toFixed(5) + '&lang=' + S.lang).then(function(x){ return x.ok ? x.json() : null; }).catch(function(){ return null; })
    .then(function(j){ var e = (j && j.en) || {place: r.name, district: r.district, state: r.state}; if(!e.place) e.place = r.name; applyPlace({lat: r.lat, lon: r.lon, acc: null, en: e, local: (j && j.local && j.local.place) ? j.local : {place: r.name, taluka: r.taluka, district: r.district, state: r.state}, src: 'search', at: Date.now()}); });
}
function locSection(){
  var h = '<div class="msec"><h3>' + I('pin') + esc(t('location')) + '</h3>';
  if(S.gps){ h += '<div class="curloc">' + I(S.gps.src === 'search' ? 'pin' : 'gps') + '<div><b>' + esc(gpsLabel() || (S.gps.lat.toFixed(4) + ', ' + S.gps.lon.toFixed(4))) + '</b>' + (S.gps.acc ? '<small>' + esc(t('accuracy', {m: num(S.gps.acc, 0)})) + '</small>' : '') + '</div><button class="btn bg bsm" data-act="gpsoff">' + esc(t('remove')) + '</button></div>'; }
  h += '<button class="btn bp locbtn" data-act="gps"' + (S.locBusy ? ' disabled' : '') + '>' + (S.locBusy ? '<span class="spin" style="width:16px;height:16px;border-width:2px;border-color:rgba(255,255,255,.4);border-top-color:#fff"></span>' + esc(t('gps_finding')) : I('gps') + esc(S.gps && S.gps.src === 'gps' ? t('gps_update') : t('use_gps'))) + '</button>';
  if(S.locErr) h += '<div class="note r" style="margin-top:10px">' + I('alert') + esc(S.locErr) + '</div>';
  h += '<div class="psearch"><input class="inp" id="placeq" placeholder="' + esc(t('place_search_ph')) + '" enterkeyhint="search"><button class="btn bs" data-act="placesearch" aria-label="' + esc(t('place_search')) + '">' + I('search') + '</button></div>';
  var pr = S.placeRes;
  if(pr){ h += '<div class="presults">' + (pr.busy ? '<div class="load" style="padding:8px"><span class="spin"></span></div>' : (pr.list.length ? pr.list.map(function(r, i){ return '<button class="mrow" data-act="placepick" data-v="' + i + '">' + I('pin') + '<span><b>' + esc(r.name) + '</b><small>' + esc([r.taluka, r.district, r.state].filter(Boolean).join(', ')) + '</small></span></button>'; }).join('') : '<p class="sm mu" style="margin:8px 4px">' + esc(t('place_none')) + '</p>')) + '</div>'; }
  var ds = DISTRICTS[S.state];
  h += '<details class="manual"' + (S.gps ? '' : ' open') + '><summary>' + esc(t('choose_manual')) + I('chev', 'chev') + '</summary><div class="grid g2" style="gap:10px;margin-top:10px"><label class="f">' + esc(t('state')) + '<select class="inp" data-act="state">' + STATES.map(function(s){ return '<option' + (s === S.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('district')) + (ds ? '<select class="inp" data-act="district"><option value="">' + esc(t('select')) + '</option>' + ds.map(function(d){ return '<option' + (d === S.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>' : '<input class="inp" data-act="district-t" value="' + esc(S.district) + '" placeholder="' + esc(t('type_district')) + '">') + '</label></div></details>';
  h += '<p class="xs mu2" style="margin:10px 0 0">' + esc(t('loc_why')) + '</p></div>';
  return h;
}

/* ================= SETTINGS MENU (⋮) ================= */
function openMenu(){ modal('<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(t('menu')) + '"><div class="box menu">' + menuBody() + '</div></div>'); }
function refreshMenu(){ var m = $('#modalwrap .menu'); if(m) m.innerHTML = menuBody(); }
function menuBody(){
  var ds = DISTRICTS[S.state];
  var h = '<div class="mhead"><h2>' + esc(t('menu')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>';
  h += locSection();
  h += '<div class="msec"><h3>' + I('globe') + esc(t('language')) + '</h3><div class="seg" role="group">' + [['mr','मराठी'],['hi','हिंदी'],['en','English']].map(function(l){ return '<button type="button" data-act="lang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '" lang="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div></div>';
  h += '<div class="msec"><a class="mrow" href="#reports" data-act="close">' + I('file') + '<span><b>' + esc(t('rep_h')) + (S.reports.length ? ' <em class="mbadge">' + num(S.reports.length, 0) + '</em>' : '') + '</b><small>' + esc(t('rep_menu_d')) + '</small></span>' + I('chev', 'chev') + '</a><a class="mrow" href="#weather" data-act="close">' + I('cloudsun') + '<span><b>' + esc(t('wx_h')) + '</b><small>' + esc(t('t_wx_d')) + '</small></span>' + I('chev', 'chev') + '</a>' +
    '<label class="mrow">' + I('text') + '<span><b>' + esc(t('big_text')) + '</b><small>' + esc(t('big_text_d')) + '</small></span><input type="checkbox" class="sw" data-act="bigtext"' + (S.bigText ? ' checked' : '') + '></label>' +
    '<a class="mrow" href="tel:18001801551">' + I('phone') + '<span><b>' + esc(t('helpline')) + ' · 1800-180-1551</b><small>' + esc(t('helpline_d')) + '</small></span></a>' +
    '<a class="mrow" href="https://agmarknet.gov.in" target="_blank" rel="noopener">' + I('rupee') + '<span><b>' + esc(t('link_mandi')) + '</b></span>' + I('ext') + '</a>' +
    '<a class="mrow" href="https://enam.gov.in" target="_blank" rel="noopener">' + I('rupee') + '<span><b>' + esc(t('link_enam')) + '</b></span>' + I('ext') + '</a>' +
    '<a class="mrow" href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">' + I('layers') + '<span><b>' + esc(t('link_shc')) + '</b></span>' + I('ext') + '</a></div>';
  h += '<div class="msec"><a class="mrow" href="#photos" data-act="close">' + I('camera') + '<span><b>' + esc(t('ph_h')) + '</b><small>' + esc(t('ph_menu_d')) + '</small></span>' + I('chev', 'chev') + '</a></div>';
  h += '<div class="msec"><button class="mrow danger" data-act="cleardata">' + I('trash') + '<span><b>' + esc(t('clear_data')) + '</b><small>' + esc(t('clear_data_d')) + '</small></span></button>' +
    '<p class="xs mu2" style="margin:12px 4px 0">' + esc(t('about_d')) + '</p></div>';
  return h;
}
function applyBigText(){ document.documentElement.classList.toggle('bigtext', !!S.bigText); }

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
    case 'organic': html = vOrganic(); break; case 'ai': html = vAI(); break;
    case 'news': html = vNews(); break; case 'market': html = vMarket(); break; case 'reports': html = vReports(); break; case 'photos': html = vPhotos(); break; case 'report': html = vReport(r.id); break; case 'soil': html = vSoil(); break; case 'weather': html = vWeather(); break; default: html = vHome();
  }
  var keepReel = r.v === 'news' && $('#reels') ? $('#reels').scrollTop : null;
  v.innerHTML = html;
  refreshMenu();
  if(r.v === 'ai') scrollChat();
  document.body.classList.toggle('newsmode', r.v === 'news'); document.body.classList.toggle('nonav', r.v === 'news' || r.v === 'ai'); document.body.classList.toggle('homemode', r.v === 'home'); if(r.v === 'home') botAfterRender();
  if(r.v === 'news'){ setupReels(); if(keepReel != null && !S.newsFocus){ $('#reels').scrollTop = keepReel; } if(S.newsFocus){ var fe = document.getElementById('n-' + S.newsFocus); S.newsFocus = null; if(fe){ var rr = $('#reels'); rr.scrollTop = (+fe.getAttribute('data-i')) * rr.clientHeight; } } }
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
    case 'bot': S.botOpen = !S.botOpen; S.botHello = false; botAfterRender(); if(S.botOpen){ var bi = $('#chatin'); if(bi && window.innerWidth > 600) bi.focus(); } break;
    case 'botclose': S.botOpen = false; botAfterRender(); break;
    case 'bothide': S.botHello = false; botAfterRender(); break;
    case 'popclose': var sp = $('#savepop'); if(sp) sp.remove(); break;
    case 'phcrop': photoModal(v); break;
    case 'phpick': var pp = v.split('|'); S.photoPick[pp[0]] = el.getAttribute('data-u'); lsSet('photoPick', S.photoPick); closeModal(); render(); toast(t('ph_saved')); break;
    case 'phreset': delete S.photoPick[v]; lsSet('photoPick', S.photoPick); closeModal(); render(); break;
    case 'phexport': photoExport(); break;
    case 'repfilter': S.repFilter = v; render(); break;
    case 'repmenu': repMenu(v); break;
    case 'repren': repRename(v); break;
    case 'repsave': var rr = repById(v), nm = ($('#repname') || {}).value; if(rr && nm && nm.trim()){ rr.title = nm.trim().slice(0, 90); saveReports(); } closeModal(); var sp2 = $('#savepop'); if(sp2) sp2.remove(); softRender(); break;
    case 'repdel': repDelete(v); break;
    case 'repdelok': S.reports = S.reports.filter(function(x){ return x.id !== v; }); saveReports(); closeModal(); if(route().v === 'report') location.hash = '#reports'; else softRender(); break;
    case 'savechat': saveReport('chat' + v); break;
    case 'mkcrop': S.mkCrop = v; lsSet('mkCrop', v); render(); break;
    case 'mkretry': loadMandi(true); render(); break;
    case 'mkloc': mkLocModal(); break;
    case 'mkcur': S.mk = null; lsSet('mk', null); closeModal(); render(); break;
    case 'mklocsave': var ms = $('#mkstate').value, md2 = $('#mkdist').value; S.mk = {state: ms, district: md2, name: md2}; lsSet('mk', S.mk); closeModal(); render(); break;
    case 'mkpick': modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:440px"><div class="mhead" style="padding:0 0 12px"><h2>' + esc(t('crop')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div><select class="inp" id="mkpicksel">' + cropOptions(S.mkCrop) + '</select><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn bp" data-act="mkpickok">' + I('check') + esc(t('save')) + '</button></div></div></div>'); break;
    case 'mkpickok': S.mkCrop = $('#mkpicksel').value; lsSet('mkCrop', S.mkCrop); closeModal(); render(); break;
    case 'newsgo': var nl = newsList(), ni = -1; nl.forEach(function(n, i){ if(n.id === v) ni = i; }); if(ni < 0){ S.newsCat = 'all'; render(); nl = newsList(); nl.forEach(function(n, i){ if(n.id === v) ni = i; }); } if(ni >= 0){ if(ni >= S.reelN){ S.reelN = ni + 5; patchNews(); } var rr2 = $('#reels'); if(rr2) rr2.scrollTo({top: ni * rr2.clientHeight, behavior: 'smooth'}); } break;
    case 'plwater': S.plWater = v; render(); break;
    case 'reco': runReco(); break;
    case 'analyze': S.scanCrop = $('#scancrop').value; S.scanNote = $('#scannote').value; runScan(); break;
    case 'scansave': saveScanToDiary(); break;
    case 'newcycle': e.preventDefault(); modal(cycleForm(null, v)); break;
    case 'editcycle': modal(cycleForm(cyc(v))); break;
    case 'close': closeModal(); break;
    case 'menu': openMenu(); break;
    case 'wxtoggle': S.wxOpen = !S.wxOpen; loadWx(false); render(); break;
    case 'wxretry': loadWx(true); patchWx(); break;
    case 'wxai': runWxAI(); break;
    case 'gps': locateMe(); break;
    case 'placesearch': searchPlace(($('#placeq') || {}).value); break;
    case 'placepick': pickPlace(+v); break;
    case 'gpsoff': S.gps = null; S.placeRes = null; lsSet('gps', null); loadWx(true); refreshMenu(); softRender(); break;
    case 'cleardata': if(!S.clearArm){ S.clearArm = true; el.querySelector('b').textContent = t('clear_confirm'); setTimeout(function(){ S.clearArm = false; }, 5000); } else { try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('ank') === 0 || k.indexOf('shetimitra') === 0) localStorage.removeItem(k); }); }catch(_){} location.hash = '#home'; location.reload(); } break;
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
    case 'exofit': S.exoFit = v === '1'; render(); break;
    case 'newscat': S.newsCat = v; S.reelN = 0; $$('[data-act="newscat"]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-v') === v); }); patchNews(); el.scrollIntoView && el.scrollIntoView({inline: 'center', block: 'nearest', behavior: 'smooth'}); break;
    case 'newsref': closeModal(); loadNews(true); break;
    case 'newsmore': S.newsShown += 12; patchNews(); break;
    case 'newsai': runNewsAI(v); break;
    case 'newsairetry': runNewsAI(v, true); break;
    case 'nsclose': S.newsSheet = null; if(S.speakingId && S.speakingId.indexOf('newsai') === 0) stopSpeak(); patchSheet(); break;
    case 'newsshare': shareNews(v); break;
    case 'newsfilter': openNewsFilter(); break;
    case 'newslangpick': S.newsLang = v; S.reelN = 0; closeModal(); render(); break;
    case 'reelnext': reelScrollTo(+v); break;
    case 'download': downloadReport(v); break;
    case 'newsopen': S.newsCat = 'all'; S.newsSheet = null; S.newsLang = 'all'; S.newsFocus = v; var ix = newsList().findIndex(function(n){ return n.id === v; }); if(ix >= (S.reelN || 25)) S.reelN = ix + 5; break;
    case 'soiltab': S.soilTab = v; render(); break;
    case 'soilsave': saveSoil(); break;
    case 'soilclear': S.soilForm = {_pu: S.soilForm._pu}; S.soilRead = null; S.soilPlan = null; saveSoilDraft(); render(); break;
    case 'soilopen': var sr = S.soils.filter(function(x){ return x.id === v; })[0]; if(sr){ S.soilForm = Object.assign({}, sr.v, {_pu: sr.pu, _plot: sr.plot, _date: sr.date}); S.soilPlan = null; S.soilRead = null; saveSoilDraft(); S.soilTab = 'card'; render(); window.scrollTo(0, 0); } break;
    case 'soildel': S.soils = S.soils.filter(function(x){ return x.id !== v; }); lsSet('soils', S.soils); render(); break;
    case 'soilplan': runSoilPlan(); break;
    case 'soilhome': S.soilHomeQ.crop = ($('#hq-crop') || {}).value || S.soilHomeQ.crop; runSoilHome(); break;
    case 'hometest': S.openTest = S.openTest === v ? null : v; render(); break;
  }
});
document.addEventListener('change', function(e){
  var el = e.target, a = el.getAttribute('data-act'); if(!a) return;
  if(a === 'state'){ S.state = el.value; S.district = ''; lsSet('state', S.state); lsSet('district', ''); S.reco = null; if(!S.gps) loadWx(true); refreshMenu(); softRender(); }
  if(a === 'district'){ S.district = el.value; lsSet('district', S.district); S.reco = null; if(!S.gps) loadWx(true); refreshMenu(); softRender(); }
  if(a === 'district-t'){ if(!S.gps) loadWx(true); }
  if(a === 'bigtext'){ S.bigText = el.checked; lsSet('bigText', S.bigText); applyBigText(); }
  if(a === 'district-t'){ S.district = el.value.trim().slice(0, 60); lsSet('district', S.district); S.reco = null; }
  if(a === 'plseason'){ S.plSeason = el.value; S.reco = null; render(); }
  if(a === 'plexotic'){ S.plExotic = el.checked; S.reco = null; }
  if(a === 'newslang'){ S.newsLang = el.value; S.newsShown = 12; patchNews(); }
  if(a === 'soilpu'){ S.soilForm._pu = el.value; saveSoilDraft(); patchSoil(); }
  if(a === 'soilscan'){ var sf = el.files && el.files[0]; if(sf) runSoilRead(sf); el.value = ''; }
  if(a === 'soilq'){ S.soilHomeQ[el.getAttribute('data-k')] = el.value; }
  if(a === 'soilmeta'){ S.soilForm[el.getAttribute('data-k')] = el.value; saveSoilDraft(); }
  if(a === 'calc'){ var id = el.getAttribute('data-v'), k = el.getAttribute('data-k'); S.calc[id] = S.calc[id] || (RECIPES.filter(function(r){ return r.id === id; })[0].base === 'acre' ? {a: 1, u: 'acre'} : {a: 100}); S.calc[id][k] = k === 'u' ? el.value : Math.max(0, parseFloat(el.value) || 0); softRender(); }
  if(a === 'scanfile'){ var f = el.files && el.files[0]; if(f){ if(S.scanUrl) URL.revokeObjectURL(S.scanUrl); S.scanFile = f; S.scanUrl = URL.createObjectURL(f); S.scanRes.one = null; S.scanCrop = $('#scancrop') && $('#scancrop').value; S.scanNote = $('#scannote') && $('#scannote').value; render(); } }
});
document.addEventListener('input', function(e){
  var el = e.target, a = el.getAttribute('data-act');
  if(a === 'libq'){ S.libQ = el.value; updLib(); }
  if(a === 'soilv'){ var sk = el.getAttribute('data-k'); S.soilForm[sk] = el.value === '' ? '' : parseFloat(el.value); S.soilRead = null; saveSoilDraft(); clearTimeout(S.soilT); S.soilT = setTimeout(patchSoil, 200); }
  if(a === 'soilmeta'){ S.soilForm[el.getAttribute('data-k')] = el.value; saveSoilDraft(); }
  if(a === 'soilq' && el.tagName === 'INPUT'){ S.soilHomeQ[el.getAttribute('data-k')] = el.value; }
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
document.addEventListener('drop', function(e){ var d = e.target.closest && e.target.closest('#drop'); if(d && e.dataTransfer.files[0]){ e.preventDefault(); var f = e.dataTransfer.files[0]; if(S.scanUrl) URL.revokeObjectURL(S.scanUrl); S.scanFile = f; S.scanUrl = URL.createObjectURL(f); S.scanRes.one = null; render(); } });
window.addEventListener('hashchange', function(){ closeModal(); stopSpeak(); S.newsSheet = null; var sp = $('#savepop'); if(sp) sp.remove(); S.botOpen = false; S.cycTab = route().v === 'cycle' ? S.cycTab : 'overview'; render(); window.scrollTo(0, 0); });
window.addEventListener('scroll', function(){ var tp = $('#top'); if(tp) tp.classList.toggle('sc', window.scrollY > 4); }, {passive: true});

function updLib(){
  var g = $('#cgrid'); if(!g) return;
  g.innerHTML = cropCards(libList());
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
  var r = S.scanRes.one; if(!r || !r.data) return; var id = $('#diarycyc').value, c = clone(cyc(id)); if(!c) return; var d = r.data;
  var note = (d.problem || t('healthy')) + (d.organic && d.organic.length ? '\n• ' + d.organic.slice(0, 4).join('\n• ') : '');
  c.log = (c.log || []).concat([{id: uid('r'), date: isoDate(today0()), act: 'scan', note: note.slice(0, 600)}]); writeCycle(c); r.saved = true; render();
}

/* speech */
function speechText(sid){
  if(sid.indexOf('guide') === 0){ var g = S.guides[sid.slice(5) + '|' + S.lang + '|' + place()]; return g ? g.text : ''; }
  if(sid.indexOf('review') === 0){ var r = S.reviews[sid.slice(6)]; return r ? r.text : ''; }
  if(sid.indexOf('scan') === 0) return scanSpeech(sid.slice(4));
  if(sid.indexOf('chat') === 0){ var m = S.chat[+sid.slice(4)]; return m ? m.content : ''; }
  if(sid === 'soilplan') return S.soilPlan ? S.soilPlan.text : '';
  if(sid === 'soilhome') return S.soilHome ? S.soilHome.text : '';
  if(sid.indexOf('rep:') === 0){ var sr = repById(sid.slice(4)); return sr ? sr.md : ''; }
  if(sid.indexOf('nread') === 0){ var nr = newsById(sid.slice(5)); return nr ? nr.title + '. ' + (nr.summary || '') : ''; }
  if(sid.indexOf('newsai') === 0){ var na = S.newsAI[sid.slice(6)]; return na ? na.text : ''; }
  return '';
}
function newsSpeakPatch(){ if(route().v !== 'news'){ softRender(); return; } (S.news && S.news.items || []).forEach(function(n){ var el = document.getElementById('n-' + n.id); if(el && el.querySelector('[data-act="speak"]')){ var on = el.querySelector('[data-act="speak"]').classList.contains('on'); if(on !== (S.speakingId === 'nread' + n.id)) patchCard(n.id); } }); patchSheet(); }
function stopSpeak(){ if(S.tts && S.speakingId){ try{ S.tts.stop(); }catch(e){} } S.speakingId = null; }
function toggleSpeak(sid){
  if(!S.tts) return;
  if(S.speakingId === sid){ stopSpeak(); if(sid.indexOf('nread') === 0 || sid.indexOf('newsai') === 0) newsSpeakPatch(); else softRender(); return; }
  if(S.speakingId){ var prev = S.speakingId; stopSpeak(); if(prev.indexOf('nread') === 0) patchCard(prev.slice(5)); }
  var txt = stripMd(speechText(sid)).slice(0, 1990); if(!txt) return;
  var lng = S.lang; if(sid.indexOf('nread') === 0){ var nn = newsById(sid.slice(5)); if(nn && nn.lang) lng = nn.lang; }
  S.speakingId = sid; if(sid.indexOf('nread') === 0 || sid.indexOf('newsai') === 0) newsSpeakPatch(); else softRender();
  var p; try{ p = S.tts.speak(txt, {language: lng}); }catch(e){ p = Promise.reject(e); }
  p.catch(function(e){ if(S.speakingId !== sid || (e && e.code === 'viewer_stopped')) return; return S.tts.speak(txt, {language: lng}); }).catch(function(){}).then(function(){ if(S.speakingId === sid){ S.speakingId = null; if(sid.indexOf('nread') === 0 || sid.indexOf('newsai') === 0) newsSpeakPatch(); else softRender(); } });
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

/* ===================================================================
   v5 — crop-wise tasks, reports, market prices, Ankur AI bot
   =================================================================== */
function tasksFor(c){
  var now = today0(), x = cycInfo(c), out = [];
  if(x.done) return out;
  for(var k = 15; k < x.dur * 0.85; k += 15){ var d = addDays(x.sow, k); var dd = diffDays(d, now); if(dd >= 0){ out.push({d: d, dd: dd, title: t('task_jeev'), ic: 'leaf'}); break; } }
  x.stages.forEach(function(s, i){ if(i === 0) return; var d = addDays(x.sow, s.start), dd = diffDays(d, now); if(dd >= 0 && dd <= 30) out.push({d: d, dd: dd, title: t('task_stage', {s: t('st_' + s.k)}), ic: 'sprout'}); });
  if(x.day >= 1){ var nxt = 7 - ((x.day - 1) % 7); if(nxt === 7) nxt = 0; out.push({d: addDays(now, nxt), dd: nxt, title: t('task_scout'), ic: 'bug'}); }
  var hd = diffDays(x.h1, now); if(hd >= 0 && hd <= 45) out.push({d: x.h1, dd: hd, title: t('task_harvest'), sub: fmtDs(x.h1) + ' – ' + fmtDs(x.h2), ic: 'cal'});
  out.sort(function(a, b){ return a.dd - b.dd; });
  return out;
}
function cropTaskCards(){
  var list = S.cycles.map(function(c){ var x = cycInfo(c); return {c: c, x: x, tk: tasksFor(c)}; }).filter(function(o){ return !o.x.done; });
  if(!list.length) return '<div class="card tasks"><div class="empty"><span class="ico g">' + I('cal') + '</span><p style="margin:0 0 14px">' + esc(t('no_tasks')) + '</p><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div></div>';
  list.sort(function(a, b){ return (a.tk[0] ? a.tk[0].dd : 999) - (b.tk[0] ? b.tk[0].dd : 999); });
  return '<div class="ctasks">' + list.map(function(o){ var c = o.c, x = o.x;
    var st = x.cur ? t('st_' + x.cur.k) : t('not_sown');
    return '<div class="card ctask"><a class="cth" href="#cycle-' + c.id + '">' + cropDot(x.cr) + '<span class="ctt"><b>' + esc(L(x.cr.n)) + (c.plot ? ' · ' + esc(c.plot) : '') + '</b><small>' + esc(num(c.area) + ' ' + t('acres_short')) + ' · ' + esc(t('day_n', {n: num(Math.max(0, x.day), 0)})) + ' · ' + esc(st) + '</small></span><span class="ctp">' + num(Math.round(x.pct), 0) + '%</span></a>' +
      '<div class="prog ctprog"><i style="width:' + x.pct + '%"></i></div>' +
      (o.tk.length ? o.tk.slice(0, 3).map(function(k){ return '<a class="task" href="#cycle-' + c.id + '"><span class="when' + (k.dd === 0 ? ' today' : '') + '"><b>' + k.d.getDate() + '</b><small>' + esc(MONTHS[S.lang][k.d.getMonth()]) + '</small></span><span class="tx"><b>' + esc(k.title) + '</b><span>' + esc((k.sub ? k.sub + ' · ' : '') + (k.dd === 0 ? t('today') : t('in_days', {n: k.dd}))) + '</span></span></a>'; }).join('')
        : '<div class="task"><span class="tx"><span>' + esc(t('no_task_30')) + '</span></span></div>') + '</div>'; }).join('') + '</div>';
}

/* ---------------- reports (saved AI answers) ---------------- */
var REPKIND = {scan: ['g', 'scan', 'rk_scan'], soil: ['o', 'layers', 'rk_soil'], guide: ['g', 'book', 'rk_guide'], wx: ['b', 'cloudsun', 'rk_wx'], chat: ['b', 'chat', 'rk_chat'], news: ['s', 'news', 'rk_news'], other: ['s', 'spark', 'rk_other']};
function repKind(sid){ if(sid.indexOf('scan') === 0) return 'scan'; if(sid.indexOf('soil') === 0) return 'soil'; if(sid.indexOf('guide') === 0 || sid.indexOf('review') === 0 || sid === 'reco') return 'guide'; if(sid === 'wx') return 'wx'; if(sid.indexOf('chat') === 0) return 'chat'; if(sid.indexOf('news') === 0) return 'news'; return 'other'; }
function saveReports(){ if(S.reports.length > 80) S.reports = S.reports.slice(0, 80); lsSet('reports', S.reports); }
function saveReport(sid, quiet){
  var r = reportFor(sid); if(!r || !r.md) return null;
  var dup = S.reports.filter(function(x){ return x.sid === sid && x.md === r.md; })[0]; if(dup){ if(!quiet) savedPop(dup); return dup; }
  var rep = {id: uid('r-'), sid: sid, kind: repKind(sid), title: r.title, md: r.md, date: Date.now(), lang: S.lang};
  S.reports.unshift(rep); saveReports();
  if(r.img) thumb(r.img, function(d){ rep.img = d; saveReports(); });
  if(!quiet) savedPop(rep);
  return rep;
}
function thumb(src, cb){ var im = new Image(); im.onload = function(){ try{ var s = Math.min(1, 480 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/jpeg', 0.72)); }catch(e){} }; im.src = src; }
function repById(id){ return S.reports.filter(function(x){ return x.id === id; })[0]; }
function savedPop(rep){
  var old = $('#savepop'); if(old) old.remove();
  var d = document.createElement('div'); d.id = 'savepop'; d.className = 'savepop'; d.setAttribute('role', 'status');
  d.innerHTML = '<span class="ico g">' + I('check') + '</span><div class="spt"><b>' + esc(t('rep_saved')) + '</b><small>' + esc(rep.title) + '</small></div><a class="btn bp bsm" href="#report-' + rep.id + '" data-act="popclose">' + esc(t('open')) + '</a><button class="btn bs bsm" data-act="repren" data-v="' + rep.id + '">' + I('edit') + '</button><button class="xbtn" data-act="popclose" aria-label="' + esc(t('close')) + '">' + I('x') + '</button>';
  document.body.appendChild(d);
  clearTimeout(savedPop.tm); savedPop.tm = setTimeout(function(){ var p = $('#savepop'); if(p) p.remove(); }, 7000);
}
function fmtWhen(ts){ var d = new Date(ts); return fmtD(d) + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function vReports(){
  var kinds = ['all', 'scan', 'soil', 'guide', 'wx', 'chat'];
  var list = S.reports.filter(function(r){ return S.repFilter === 'all' || r.kind === S.repFilter || (S.repFilter === 'guide' && r.kind === 'other'); });
  var h = '<div class="dhead"><a class="btn bs bsm" href="#home">' + I('arrowl') + esc(t('back')) + '</a></div><div class="ph"><h1>' + esc(t('rep_h')) + '</h1><p>' + esc(t('rep_d')) + '</p></div>';
  h += '<div class="chips" role="group" style="margin-bottom:14px">' + kinds.map(function(k){ var n = k === 'all' ? S.reports.length : S.reports.filter(function(r){ return r.kind === k; }).length; return '<button type="button" data-act="repfilter" data-v="' + k + '" aria-pressed="' + (S.repFilter === k) + '">' + esc(k === 'all' ? t('all') : t(REPKIND[k][2])) + (n ? ' · ' + num(n, 0) : '') + '</button>'; }).join('') + '</div>';
  if(!list.length) return h + '<div class="card"><div class="empty"><span class="ico g">' + I('file') + '</span><p style="margin:0">' + esc(t('rep_empty')) + '</p></div></div>';
  h += '<div class="card lst replist">' + list.map(function(r){ var k = REPKIND[r.kind] || REPKIND.other;
    return '<div class="li rep"><a class="repa" href="#report-' + r.id + '">' + (r.img ? '<span class="repimg"><img src="' + r.img + '" alt=""></span>' : '<span class="ico ' + k[0] + '" style="width:44px;height:44px;border-radius:12px">' + I(k[1]) + '</span>') + '<span class="tx"><b>' + esc(r.title) + '</b><span>' + esc(t(k[2])) + ' · ' + esc(fmtWhen(r.date)) + '</span></span></a><button class="xbtn" data-act="repmenu" data-v="' + r.id + '" aria-label="' + esc(t('menu')) + '">' + I('dots') + '</button></div>'; }).join('') + '</div>';
  h += '<p class="xs mu2" style="margin-top:12px">' + esc(t('rep_local')) + '</p>';
  return h;
}
function vReport(id){
  var r = repById(id); if(!r) return vReports();
  var k = REPKIND[r.kind] || REPKIND.other;
  var h = '<div class="dhead"><a class="btn bs bsm" href="#reports">' + I('arrowl') + esc(t('rep_h')) + '</a></div>';
  h += '<div class="card pad"><div class="row" style="align-items:flex-start;gap:12px"><span class="ico ' + k[0] + '">' + I(k[1]) + '</span><div style="flex:1;min-width:0"><h1 style="font-size:22px">' + esc(r.title) + '</h1><div class="sm mu">' + esc(t(k[2])) + ' · ' + esc(fmtWhen(r.date)) + '</div></div></div>' +
    '<div class="row wrap" style="margin:14px 0 4px">' + speakBtn('rep:' + r.id) + '<button class="btn bs bsm" data-act="repren" data-v="' + r.id + '">' + I('edit') + esc(t('rename')) + '</button><button class="btn bd bsm" data-act="repdel" data-v="' + r.id + '">' + I('trash') + esc(t('delete')) + '</button></div>' +
    (r.img ? '<img class="repbig" src="' + r.img + '" alt="">' : '') + '<div class="md" style="margin-top:10px">' + md(r.md) + '</div><p class="xs mu2" style="margin:14px 0 0">' + esc(t('disclaimer')) + '</p></div>';
  return h;
}
function repMenu(id){
  var r = repById(id); if(!r) return;
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box sheet"><div class="mhead" style="padding:0 0 8px"><h2 style="font-size:18px">' + esc(r.title) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<a class="mrow" href="#report-' + id + '" data-act="close">' + I('file') + '<span><b>' + esc(t('open')) + '</b></span></a>' +
    '<button class="mrow" data-act="repren" data-v="' + id + '">' + I('edit') + '<span><b>' + esc(t('rename')) + '</b></span></button>' +
    '<button class="mrow" data-act="download" data-v="rep:' + id + '">' + I('download') + '<span><b>' + esc(t('download')) + '</b></span></button>' +
    '<button class="mrow danger" data-act="repdel" data-v="' + id + '">' + I('trash') + '<span><b>' + esc(t('delete')) + '</b></span></button></div></div>');
}
function repRename(id){
  var r = repById(id); if(!r) return;
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:440px"><div class="mhead" style="padding:0 0 12px"><h2>' + esc(t('rename')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div><input class="inp" id="repname" value="' + esc(r.title) + '" maxlength="90"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bp" data-act="repsave" data-v="' + id + '">' + I('check') + esc(t('save')) + '</button></div></div></div>');
  var i = $('#repname'); if(i){ i.focus(); i.select(); }
}
function repDelete(id){
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:400px"><h2 style="font-size:19px;margin-bottom:8px">' + esc(t('rep_del_q')) + '</h2><p class="mu" style="margin:0 0 16px">' + esc((repById(id) || {}).title || '') + '</p><div class="row" style="justify-content:flex-end"><button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bd" data-act="repdelok" data-v="' + id + '">' + I('trash') + esc(t('delete')) + '</button></div></div></div>');
}

/* ---------------- market prices (Agmarknet via data.gov.in) ---------------- */
var MKTOP = ['onion','soybean','cotton','tomato','wheat','chana','tur','pomegranate','grapes','maize','potato','jowar'];
function mkPlace(){ var m = S.mk; if(m && m.district) return m; return {state: S.state, district: S.district, name: S.gps ? (gpsName() || S.district) : S.district, lat: S.gps && S.gps.lat, lon: S.gps && S.gps.lon, cur: true}; }
function mkCrops(){ var mine = []; S.cycles.forEach(function(c){ if(mine.indexOf(c.crop) < 0 && crop(c.crop)) mine.push(c.crop); }); var rest = MKTOP.filter(function(id){ return mine.indexOf(id) < 0 && crop(id); }); if(S.mkCrop && mine.indexOf(S.mkCrop) < 0 && rest.indexOf(S.mkCrop) < 0) rest.unshift(S.mkCrop); return {mine: mine, rest: rest}; }
function mkKey(){ var p = mkPlace(); return S.mkCrop + '|' + p.state + '|' + p.district; }
function loadMandi(force){
  var p = mkPlace(), k = mkKey(), cur = S.mkData[k];
  if(!S.mkCrop || (cur && (cur.busy || (!force && Date.now() - (cur.at || 0) < 1800000)))) return;
  S.mkData[k] = {busy: true};
  var q = 'crop=' + encodeURIComponent(S.mkCrop) + '&state=' + encodeURIComponent(p.state || '') + '&district=' + encodeURIComponent(p.district || '') + (p.lat ? '&lat=' + p.lat + '&lon=' + p.lon : '');
  fetch('/api/mandi?' + q).then(function(r){ return r.json().then(function(j){ if(!r.ok) { var e = new Error(j.error || 'HTTP ' + r.status); e.code = j.code; throw e; } return j; }); })
    .then(function(j){ S.mkData[k] = {at: Date.now(), d: j}; if(route().v === 'market') softRender(); })
    .catch(function(e){ S.mkData[k] = {at: Date.now(), err: e.code === 'no_key' ? t('mk_nokey') : (e.message || t('mk_err'))}; if(route().v === 'market') softRender(); });
}
function rsq(v){ return '₹' + num(Math.round(v), 0); }
function spark(arr){
  if(!arr || arr.length < 2) return '';
  var vs = arr.map(function(x){ return x.p; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), W = 300, H = 56, rg = (mx - mn) || 1;
  var pts = arr.map(function(x, i){ return [Math.round(i * W / (arr.length - 1)), Math.round(H - 6 - (x.p - mn) / rg * (H - 14))]; });
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
  return '<svg class="spark" viewBox="-4 0 308 ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + ' L300 ' + H + ' L0 ' + H + 'Z" fill="rgba(47,143,87,.12)"/><path d="' + d + '" fill="none" stroke="#2F8F57" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="4" fill="#14532F"/></svg>';
}
function dayLbl(iso){ var d = parseD(iso), dd = diffDays(today0(), d); return dd <= 0 ? t('today') : (dd === 1 ? t('yesterday') : fmtDs(d)); }
function vMarket(){
  var cs = mkCrops(); if(!S.mkCrop) S.mkCrop = cs.mine[0] || 'onion';
  var p = mkPlace(), c = crop(S.mkCrop), k = mkKey(), st = S.mkData[k];
  if(!st) setTimeout(function(){ loadMandi(false); }, 0);
  var h = '<div class="ph"><h1>' + esc(t('mk_h')) + '</h1><p>' + esc(t('mk_d')) + '</p></div>';
  h += '<div class="curloc">' + I('pin') + '<div><b>' + esc(p.name || p.district || p.state) + (p.district && p.name !== p.district ? ', ' + esc(p.district) : '') + '</b><small>' + esc(p.cur ? t('mk_curloc') : t('mk_chosen')) + '</small></div><button class="btn bs bsm" data-act="mkloc">' + I('edit') + esc(t('change')) + '</button></div>';
  h += '<div class="mkcrops">' + cs.mine.concat(cs.rest).map(function(id){ var cr = crop(id), mine = cs.mine.indexOf(id) > -1; return '<button type="button" data-act="mkcrop" data-v="' + id + '" aria-pressed="' + (S.mkCrop === id) + '">' + cropDot(cr) + esc(L(cr.n)) + (mine ? '<i title="' + esc(t('nav_farm')) + '">' + I('sprout') + '</i>' : '') + '</button>'; }).join('') + '<button type="button" class="mkmore" data-act="mkpick">' + I('plus') + esc(t('crop')) + '</button></div>';
  if(!st || st.busy) return h + '<div class="card pad"><div class="load"><span class="spin"></span>' + esc(t('mk_loading')) + '</div></div>';
  if(st.err) return h + '<div class="card pad"><div class="note r">' + I('alert') + esc(st.err) + '</div><div class="row wrap" style="margin-top:12px"><button class="btn bs bsm" data-act="mkretry">' + I('refresh') + esc(t('news_refresh')) + '</button><a class="btn bg bsm" href="https://agmarknet.gov.in" target="_blank" rel="noopener">agmarknet.gov.in' + I('ext') + '</a></div></div>';
  var d = st.d, rows = d.markets || [];
  if(!rows.length) return h + '<div class="card pad"><div class="note">' + I('info') + esc(t('mk_none', {crop: L(c.n), state: p.state})) + '</div></div>';
  var best = rows[0], hi = rows.reduce(function(a, b){ return b.modal > a.modal ? b : a; }, rows[0]);
  var chg = best.prev ? best.modal - best.prev : null;
  h += '<div class="card mkbest"><div class="mkh"><span class="chip g">' + I('pin').replace('<svg', '<svg width="13" height="13" stroke="currentColor"') + esc(t('mk_nearest')) + '</span><span class="chip">' + esc(dayLbl(best.date)) + '</span></div>' +
    '<h2>' + esc(best.market) + '</h2><div class="sm mu">' + esc(best.district) + (best.km != null ? ' · ' + num(best.km, 0) + ' km' : '') + (best.variety ? ' · ' + esc(best.variety) : '') + '</div>' +
    '<div class="mkp"><div><small>' + esc(t('mk_modal')) + '</small><b>' + rsq(best.modal) + '</b><span>' + esc(t('mk_perq')) + '</span></div>' + (chg != null ? '<span class="mkchg ' + (chg >= 0 ? 'up' : 'dn') + '">' + (chg >= 0 ? '▲ ' : '▼ ') + rsq(Math.abs(chg)) + '<small>' + esc(t('mk_vsprev')) + '</small></span>' : '') + '</div>' +
    '<div class="mkmm"><div><small>' + esc(t('mk_min')) + '</small><b>' + rsq(best.min) + '</b></div><div><small>' + esc(t('mk_max')) + '</small><b>' + rsq(best.max) + '</b></div>' + (best.arrival ? '<div><small>' + esc(t('mk_arr')) + '</small><b>' + num(best.arrival, 0) + ' ' + esc(t('quintal_s')) + '</b></div>' : '') + '</div>' +
    (best.trend && best.trend.length > 1 ? '<div class="mktr"><small>' + esc(t('mk_trend')) + '</small>' + spark(best.trend) + '</div>' : '') + '</div>';
  h += '<div class="h-sec" style="margin-top:18px"><h2 style="font-size:18px">' + esc(t('mk_nearby')) + '</h2><span class="xs mu2">' + esc(t('mk_perq')) + '</span></div>';
  h += '<div class="card lst mklist">' + rows.slice(1, 12).map(function(m){ return '<div class="li"><div class="tx"><b>' + esc(m.market) + (m === hi ? ' <span class="chip s" style="font-size:11px;padding:0 7px">' + esc(t('mk_high')) + '</span>' : '') + '</b><span>' + esc(m.district) + (m.km != null ? ' · ' + num(m.km, 0) + ' km' : '') + ' · ' + esc(dayLbl(m.date)) + '</span></div><div class="mkr"><b>' + rsq(m.modal) + '</b><small>' + rsq(m.min) + '–' + rsq(m.max).slice(1) + '</small></div></div>'; }).join('') + '</div>';
  h += '<p class="xs mu2" style="margin-top:12px">' + esc(t('mk_src')) + ' · ' + esc(t('news_updated', {t: ago(st.at)})) + '</p>';
  return h;
}
function mkLocModal(){
  var p = mkPlace(), ds = DISTRICTS[p.state];
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:440px"><div class="mhead" style="padding:0 0 12px"><h2>' + esc(t('mk_loc_h')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<button class="btn bp locbtn" data-act="mkcur">' + I('gps') + esc(t('mk_usecur')) + '</button>' +
    '<div class="grid g2" style="gap:10px;margin-top:12px"><label class="f">' + esc(t('state')) + '<select class="inp" id="mkstate">' + STATES.map(function(s){ return '<option' + (s === p.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('district')) + (ds ? '<select class="inp" id="mkdist">' + ds.map(function(d){ return '<option' + (d === p.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>' : '<input class="inp" id="mkdist" value="' + esc(p.district || '') + '">') + '</label></div>' +
    '<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn bp" data-act="mklocsave">' + I('check') + esc(t('save')) + '</button></div></div></div>');
}

/* ---------------- Ankur AI (floating assistant, home page only) ---------------- */
var BOTLOGO = '<svg class="botlogo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="bgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3DA568"/><stop offset="1" stop-color="#14532F"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#bgA)"/><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' +
  '<path d="M19 18h26a7 7 0 0 1 7 7v11a7 7 0 0 1-7 7H31l-8.5 7.2a1 1 0 0 1-1.6-.8V43H19a7 7 0 0 1-7-7V25a7 7 0 0 1 7-7z" fill="#fff"/>' +
  '<path d="M32 39v-9" stroke="#1D6F42" stroke-width="2.6" stroke-linecap="round"/><path d="M32 32.5c-.6-4.4-3.4-6.8-8.2-6.9.2 4.6 3 7.3 8.2 6.9z" fill="#3DA568"/><path d="M32 30.5c.4-5.4 3.6-8.3 9.4-8.4-.1 5.6-3.4 8.7-9.4 8.4z" fill="#1D6F42"/>' +
  '<path d="M49.5 7.5l1.5 3.7 3.7 1.5-3.7 1.5-1.5 3.7-1.5-3.7-3.7-1.5 3.7-1.5z" fill="#F2C14E"/></svg>';
function botFab(){ return '<div id="botroot" class="botroot"></div>'; }
function botHTML(){
  var h = '';
  if(S.botOpen){
    var off = S.sampleReady && !S.sample, busy = S.chat.length && S.chat[S.chat.length - 1].busy;
    h += '<div class="botpanel" role="dialog" aria-label="' + esc(t('bot_name')) + '"><div class="bph">' + BOTLOGO + '<div class="bpt"><b>' + esc(t('bot_name')) + '</b><small><i></i>' + esc(t('bot_sub')) + '</small></div><a class="xbtn" href="#ai" aria-label="' + esc(t('bot_full')) + '" title="' + esc(t('bot_full')) + '">' + I('expand') + '</a><button class="xbtn" data-act="botclose" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
      '<div class="bpmsgs" id="msgs" aria-live="polite"><div class="msg a"><div class="md"><p>' + esc(t('bot_welcome')) + '</p></div></div>' +
      S.chat.slice(-8).map(function(m){ var i = S.chat.indexOf(m); return m.role === 'user' ? '<div class="msg u">' + esc(m.content) + '</div>' : '<div class="msg a"><div class="md">' + (m.content ? md(m.content) : '') + (m.busy ? '<div class="load" style="padding:4px 0"><span class="spin"></span>' + (m.content ? '' : esc(t('thinking'))) + '</div>' : '') + (m.err ? '<div class="note r" style="margin-top:8px">' + I('alert') + esc(m.err) + '</div>' : '') + '</div>' + (!m.busy && m.content ? '<div class="mact">' + speakBtn('chat' + i) + '</div>' : '') + '</div>'; }).join('') +
      (S.chat.length ? '' : '<div class="sugs">' + ['sug1','sug2','sug3'].map(function(k){ return '<button type="button" data-act="sug" data-v="' + k + '">' + esc(t(k)) + '</button>'; }).join('') + '</div>') + '</div>' +
      '<form class="composer" id="composer">' + (S.dict ? '<button type="button" class="iconbtn' + (S.listening ? ' rec' : '') + '" data-act="mic" aria-label="' + esc(t('speak')) + '">' + I('mic') + '</button>' : '') + '<textarea id="chatin" rows="1" placeholder="' + esc(S.listening ? t('listening') : t('ai_ph')) + '"' + (off ? ' disabled' : '') + '>' + esc(S.draft || '') + '</textarea>' + (busy ? '<button type="button" class="iconbtn" data-act="ai-stop" data-k="chat" aria-label="' + esc(t('stop_gen')) + '">' + I('stop') + '</button>' : '<button type="submit" class="iconbtn p" aria-label="' + esc(t('send')) + '"' + (off || !S.sampleReady ? ' disabled' : '') + '>' + I('send') + '</button>') + '</form></div>';
  } else if(S.botHello){
    h += '<div class="bothello" role="status"><button class="bhx" data-act="bothide" aria-label="' + esc(t('close')) + '">' + I('x') + '</button><b>' + esc(t('bot_hello')) + '</b><span>' + esc(t('bot_hello_d')) + '</span></div>';
  }
  h += '<button type="button" class="botfab' + (S.botOpen ? ' open' : '') + '" data-act="bot" aria-label="' + esc(t('bot_name')) + '" aria-expanded="' + !!S.botOpen + '">' + (S.botOpen ? '<span class="bfx">' + I('x') + '</span>' : BOTLOGO) + '<span class="bfl">' + esc(t('bot_short')) + '</span></button>';
  return h;
}
function botAfterRender(){
  var b = $('#botroot'); if(!b) return;
  b.innerHTML = botHTML();
  var m = $('#msgs', b); if(m) m.scrollTop = m.scrollHeight;
  if(S.botHello && !S.botOpen && !botAfterRender.tm) botAfterRender.tm = setTimeout(function(){ S.botHello = false; var bh = $('.bothello'); if(bh) bh.remove(); }, 9000);
}


/* ---------------- crop photo review (pick the right photo for each crop) ---------------- */
function vPhotos(){
  var n = Object.keys(S.photoPick).length;
  var h = '<div class="dhead"><a class="btn bs bsm" href="#home">' + I('arrowl') + esc(t('back')) + '</a></div><div class="ph"><h1>' + esc(t('ph_h')) + '</h1><p>' + esc(t('ph_d')) + '</p></div>';
  h += '<div class="card pad" style="margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>' + esc(t('ph_count', {n: num(n, 0)})) + '</b><div class="sm mu">' + esc(t('ph_how')) + '</div></div><button class="btn bp" data-act="phexport"' + (n ? '' : ' disabled') + '>' + I('download') + 'crop-photos.json</button></div>';
  h += '<div class="phgrid">' + CROPS.map(function(c){ var picked = !!S.photoPick[c.id];
    return '<button type="button" class="phc' + (picked ? ' ok' : '') + '" data-act="phcrop" data-v="' + c.id + '">' + cropPhoto(c) + '<b>' + esc(L(c.n)) + '</b>' + (picked ? '<i>' + I('check') + '</i>' : '') + '</button>'; }).join('') + '</div>';
  return h;
}
function photoModal(id){
  var c = crop(id); if(!c) return;
  function body(){ var st = S.photoCands[id];
    var g = !st || st.busy ? '<div class="load"><span class="spin"></span>' + esc(t('ph_loading')) + '</div>' : (st.err || !st.list.length ? '<div class="note">' + I('info') + esc(st.err || t('ph_none')) + '</div>' :
      '<div class="phcands">' + st.list.map(function(p, i){ var on = cropImg(c) === p.url; return '<button type="button" class="' + (on ? 'on' : '') + '" data-act="phpick" data-v="' + id + '|' + i + '" data-u="' + esc(p.url) + '"><img src="' + esc(p.url) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span>' + esc(p.title) + '</span></button>'; }).join('') + '</div>');
    return '<div class="mhead" style="padding:0 0 10px"><h2 style="font-size:19px">' + esc(L(c.n)) + ' · ' + esc(c.n.en) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div><p class="sm mu" style="margin:0 0 12px">' + esc(t('ph_pick')) + '</p>' + g + (S.photoPick[id] ? '<button class="btn bs bsm" style="margin-top:12px" data-act="phreset" data-v="' + id + '">' + I('refresh') + esc(t('ph_reset')) + '</button>' : ''); }
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" id="phbox">' + body() + '</div></div>');
  if(!S.photoCands[id] || S.photoCands[id].err){ S.photoCands[id] = {busy: true};
    fetch('/api/photocands?id=' + id).then(function(r){ return r.json(); }).then(function(j){ S.photoCands[id] = {list: j.photos || [], err: j.error}; }).catch(function(e){ S.photoCands[id] = {list: [], err: e.message}; })
      .then(function(){ var b = $('#phbox'); if(b) b.innerHTML = body(); }); }
}
function photoExport(){
  fetch('/img/crop-photos.json', {cache: 'no-store'}).then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; }).then(function(old){
    var all = Object.assign({}, old || {}, S.photoPick), txt = JSON.stringify(all, Object.keys(all).sort(), 1);
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'application/json'})); a.download = 'crop-photos.json'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
}

/* ---------- boot ---------- */
S.calc = {};
render();
initCaps();
window.addEventListener('resize', function(){ if(route().v === 'news'){ var rr = $('#reels'), i = reelIndex(); sizeReels(); if(rr) rr.scrollTop = i * rr.clientHeight; } });
document.addEventListener('keydown', function(e){ if(e.key === 'Enter' && e.target && e.target.id === 'placeq'){ e.preventDefault(); searchPlace(e.target.value); return; } if(route().v !== 'news' || $('#modalwrap') || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return; if(e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j'){ e.preventDefault(); reelScrollTo(reelIndex() + 1); } if(e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k'){ e.preventDefault(); reelScrollTo(Math.max(0, reelIndex() - 1)); } });
loadCropImgs();
applyBigText();
loadWx(false);

})();
