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
  reports: lsGet('reports', []), repFilter: 'all', mk: lsGet('mk', null), mkCrop: lsGet('mkCrop', ''), mkData: {}, botOpen: false, botHello: false, photoPick: lsGet('photoPick', {}), photoCands: {},
  cphoto: {}, prCache: lsGet('pr', {}), yprof: lsGet('yprof', null), yres: lsGet('yres', null), yBusy: false, yErr: null, yEdit: false, yOpen: 0, ydocs: lsGet('ydocs', {}), mkR: lsGet('mkR', 100), mkSort: 'km', mkNear: lsGet('mkNear', false), mkOpen: null, mkList: null
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
 plus:'M12 5v14M5 12h14', list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', fire:'M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 3s1-4 0-7z', file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5', expand:'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7', star:'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z', cow:'M5 6c0 2 1 3 3 3h8c2 0 3-1 3-3M7 9v6a5 5 0 0 0 10 0V9M10 17h.01M14 17h.01M9 12h.01M15 12h.01', trend:'M3 17l6-6 4 4 8-8M15 7h6v6', arrowr:'M5 12h14M13 6l6 6-6 6', arrowl:'M19 12H5M11 18l-6-6 6-6', check:'M20 6 9 17l-5-5', x:'M18 6 6 18M6 6l12 12',
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
function removeCycle(id){ photoDel(id);
  S.cycles = S.cycles.filter(function(x){ return x.id !== id; }); lsSet('cycles', S.cycles);
  if(S.store === 'cloud' && S.db && S.uid){ wq[id] = (wq[id] || Promise.resolve()).then(function(){ return S.db.collection('data/users/' + S.uid).doc(id).delete(); }).catch(function(){}); }
}
function cyc(id){ for(var i = 0; i < S.cycles.length; i++) if(S.cycles[i].id === id) return S.cycles[i]; return null; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ---------- cycle maths ---------- */
function cycInfo(c){
  var cr = crop(c.crop) || CROPS[0], dur = avgDur(cr), sow = parseD(c.sow), now = today0();
  var day = diffDays(now, sow) + 1, st = stagesFor(cr, dur), cur = null;
  if(c.stg && typeof c.stg === 'object'){ st.forEach(function(s){ var v = c.stg[s.k]; if(typeof v === 'number' && isFinite(v) && v >= 0 && v < 1500) s.start = Math.round(v); s.edited = typeof v === 'number'; }); st.sort(function(a, b){ return a.start - b.start; }); st.forEach(function(s, i){ s.end = i < st.length - 1 ? Math.max(s.start + 1, st[i + 1].start) : Math.max(s.start + 1, dur); }); }
  st.forEach(function(s){ if(day - 1 >= s.start) cur = s; });
  var hv1 = cr.d[0], hv2 = cr.d[1]; if(Array.isArray(c.hv) && c.hv.length === 2 && c.hv[0] > 0 && c.hv[1] >= c.hv[0] && c.hv[1] < 1500){ hv1 = c.hv[0]; hv2 = c.hv[1]; }
  var spent = (c.exp || []).reduce(function(a, e){ return a + (+e.amt || 0); }, 0);
  var inc = (c.inc || []).reduce(function(a, e){ return a + (+e.qty || 0) * (+e.rate || 0); }, 0);
  return {cr: cr, dur: dur, sow: sow, day: day, stages: st, cur: cur, pct: Math.max(0, Math.min(100, (day - 1) / dur * 100)), spent: spent, inc: inc, profit: inc - spent,
    h1: addDays(sow, hv1), h2: addDays(sow, hv2), hvEdited: hv1 !== cr.d[0] || hv2 !== cr.d[1], done: day > hv2 + 15};
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
  if(h === 'market' && !FEATURES.market) return {v:'home'};
  if(['home','crops','planner','scan','farm','organic','ai','news','soil','weather','market','reports','photos','rakshak','yojana'].indexOf(h) > -1) return {v:h};
  return {v:'home'};
}
/* Feature switches. बाजारभाव (market prices) is turned off for now — all its code stays; set market: true to bring it back. */
var FEATURES = {market: false};
var NAV = [['home','home','nav_home'],['farm','sprout','nav_farm'],['crops','book','nav_crops'],['news','news','nav_news'],['weather','cloudsun','nav_wx'],['market','rupee','nav_market'],'-',['rakshak','shield','pr_h'],['yojana','file','y_h'],['scan','scan','t_doctor'],['soil','layers','nav_soil'],['planner','map','nav_planner'],['organic','leaf','org_nav'],['ai','chat','nav_ai'],['reports','file','nav_reports']];
NAV = NAV.filter(function(n){ return n === '-' || FEATURES.market || n[0] !== 'market'; });
function navKey(v){ return v === 'crop' ? 'crops' : (v === 'cycle' ? 'farm' : (v === 'report' ? 'reports' : v)); }

/* ---------- shell ---------- */
function shell(){
  var r = route(), nk = navKey(r.v);
  var side = '<aside class="side" aria-label="' + esc(t('app')) + '"><a class="logo" href="#home"><span class="mk">' + MARK + '</span><span><b>' + esc(t('app')) + '</b><small>' + esc(t('tagline')) + '</small></span></a><nav class="snav">' +
    NAV.map(function(n){ if(n === '-') return '<div class="sep"></div>'; return '<a href="#' + n[0] + '" class="' + (nk === n[0] ? 'on' : '') + '"' + (nk === n[0] ? ' aria-current="page"' : '') + '>' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') +
    '</nav><div class="foot"><b>' + esc(t('helpline')) + '</b><a href="tel:18001801551" style="color:#4D3706;font-weight:700;text-decoration:none">1800-180-1551</a></div></aside>';
  var titles = {home:t('app'), crops:t('nav_crops'), crop:t('nav_crops'), planner:t('nav_planner'), scan:t('scan_title'), farm:t('nav_farm'), cycle:t('nav_farm'), organic:t('org_nav'), ai:t('bot_name'), news:t('news_h'), soil:t('soil_h'), weather:t('wx_h'), market:t('mk_h'), reports:t('rep_h'), report:t('rep_h'), photos:t('ph_h'), rakshak:t('pr_h'), yojana:t('y_h')};
  var top = '<header class="top" id="top"><div class="ttl">' + esc(titles[r.v]) + '</div><a class="logo mlogo" href="#home" style="padding:0"><span class="mk" style="width:36px;height:36px;border-radius:11px">' + MARK + '</span><span><b style="font-size:19px">' + esc(t('app')) + '</b></span></a>' +
    '<div class="topr"><div class="lang" role="group" aria-label="' + esc(t('language')) + '">' + [['mr','मरा'],['hi','हिं'],['en','EN']].map(function(l){ return '<button type="button" data-act="lang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '" lang="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div><button type="button" class="kebab" data-act="menu" aria-label="' + esc(t('menu')) + '" title="' + esc(t('menu')) + '">' + I('dots') + '</button></div></header>';
  var bn = [['home','home','nav_home'],['crops','book','nav_crops'],['farm','sprout','nav_farm'],['news','news','nav_news'], FEATURES.market ? ['market','rupee','nav_market'] : ['organic','leaf','org_nav']];
  var bnav = '<nav class="bnav" aria-label="Main">' + bn.map(function(n){ var on = nk === n[0]; if(n[0] === 'farm') return '<a href="#farm" class="mid' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '><span class="sc">' + I('sprout') + '</span><span>' + esc(t(n[2])) + '</span></a>'; return '<a href="#' + n[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + I(n[1]) + '<span>' + esc(t(n[2])) + '</span></a>'; }).join('') + '</nav>';
  return '<div class="app">' + side + '<div class="main">' + top + '<main class="view" id="view"></main></div></div>' + bnav + (r.v === 'home' ? botFab() : '');
}

/* ---------- views ---------- */
function cropImg(c){ return S.photoPick && S.photoPick[c.id] ? S.photoPick[c.id] : (S.cimg && S.cimg[c.id] ? S.cimg[c.id] : ''); }
function imgTag(src, cls){ return '<img src="' + esc(src) + '" alt="" loading="lazy" referrerpolicy="no-referrer"' + (cls ? ' class="' + cls + '"' : '') + ' onerror="this.remove()">'; }
function cropDot(c, big){ var src = sized(cropImg(c), big ? 500 : 330); return '<span class="' + (big ? 'cbig' : 'cdot') + '" style="background:' + CATCOL[c.cat] + '" aria-hidden="true">' + esc(first(L(c.n))) + (src ? imgTag(src) : '') + '</span>'; }
function cropPhoto(c){ var src = sized(cropImg(c), 960); return '<div class="cph" style="background:' + CATCOL[c.cat] + '"><span>' + esc(first(L(c.n))) + '</span>' + (src ? imgTag(src) : '') + '</div>'; }
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
  var tiles = [['scan','scan','g','t_doctor','t_doctor_d',1],['rakshak','shield','g','pr_h','pr_tile_d',1],['soil','layers','o','t_soil','t_soil_d',1],['farm','sprout','s','t_farm','t_farm_d',0],['yojana','file','o','y_h','y_tile_d',1],['market','rupee','s','mk_h','mk_tile_d',0],
    ['weather','cloudsun','b','t_wx','t_wx_d',0],['news','news','b','t_news','t_news_d',0],['ai','chat','b','t_ai','t_ai_d',1],
    ['crops','book','g','t_lib','t_lib_d',0],['planner','map','o','t_planner','t_planner_d',1],['organic','leaf','s','org_nav','t_organic_d',0]];
  tiles = tiles.filter(function(x){ return FEATURES.market || x[0] !== 'market'; });
  var h = '<section class="hero"><div style="position:relative;z-index:1">' + wxWidget(se) + '<h1 style="margin-top:16px">' + esc(t('greet')) + '!</h1><p>' + esc(t('greet_sub')) + '</p><div class="row wrap"><a class="btn" style="background:#fff;color:var(--g2)" href="#scan">' + I('camera') + esc(t('t_doctor')) + '</a><a class="btn" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)" href="#ai">' + I('chat') + esc(t('t_ai')) + '</a></div></div>' + HEROART + '</section>';
  h += prHomeCard();
  h += '<div class="tiles">' + tiles.map(function(x, i){ return '<a class="tile' + (i === 0 ? ' feat' : '') + '" href="#' + x[0] + '"><span class="ico ' + x[2] + '">' + I(x[1]) + '</span><b>' + esc(t(x[3])) + (x[5] ? ' <span class="ai-dot">AI</span>' : '') + '</b><span class="d">' + esc(t(x[4], {n: CROPS.length})) + '</span></a>'; }).join('') + '</div>';
  h += '<div class="h-sec"><h2>' + esc(t('crops_season')) + ' · ' + esc(t(se)) + '</h2><a href="#crops" data-act="libseason" data-v="' + se + '">' + esc(t('see_all')) + ' →</a></div><p class="mu sm" style="margin:-8px 0 12px">' + esc(t('season_' + se + '_d')) + '</p><div class="cropstrip">' + sc.map(function(c){ return '<a class="cmini" href="#crop-' + c.id + '">' + cropDot(c) + esc(L(c.n)) + '</a>'; }).join('') + '</div>';
  h += '<div class="grid g2" style="margin-top:26px;align-items:start"><div><div class="h-sec" style="margin-top:0"><h2>' + esc(t('tasks')) + '</h2><a href="#farm">' + esc(t('nav_farm')) + ' →</a></div>' + cropTaskCards() + '</div>';
  h += '<div style="display:flex;flex-direction:column;gap:16px"><div class="help"><span class="ico s" style="background:#fff">' + I('phone') + '</span><div><b style="display:block">' + esc(t('helpline')) + '</b><a class="num" href="tel:18001801551">1800-180-1551</a><div class="sm" style="color:#6B4D0B">' + esc(t('helpline_d')) + '</div></div></div>' +
    '<div class="card"><div class="pad" style="padding-bottom:6px"><h2 style="font-size:18px">' + esc(t('links')) + '</h2></div><div class="linkrow"><a href="https://agmarknet.gov.in" target="_blank" rel="noopener">' + esc(t('link_mandi')) + I('ext') + '</a><a href="https://enam.gov.in" target="_blank" rel="noopener">' + esc(t('link_enam')) + I('ext') + '</a><a href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">' + esc(t('link_shc')) + I('ext') + '</a></div></div></div></div>';
  h += '<div class="h-sec"><h2>' + esc(t('latest_news')) + '</h2><a href="#news">' + esc(t('see_all')) + ' →</a></div><div id="homenews">' + homeNews() + '</div>';
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
  if(cropImg(c)) h += '<div class="cbanner">' + imgTag(sized(cropImg(c), 1280)) + '</div>';
  h += '<div class="dhead" style="margin-top:0">' + cropDot(c, true) + '<div style="flex:1;min-width:200px"><h1>' + esc(L(c.n)) + '</h1><div class="mu">' + esc(S.lang === 'en' ? c.n.mr + ' · ' + c.n.hi : c.n.en) + ' · ' + esc(t('cat_' + c.cat)) + '</div></div><button class="btn bp" data-act="newcycle" data-v="' + c.id + '">' + I('plus') + esc(t('start_track')) + '</button></div>';
  h += '<div class="facts">' + [['season', c.s.map(function(s){ return t(s); }).join(', ')], ['duration', c.d[0] + '–' + c.d[1] + ' ' + t('days')], ['sowing', sowText(c)], ['soil', c.soil.map(function(s){ return t('soil_' + s); }).join(', ')], ['water', t(c.w)], ['temp', c.t]].map(function(f){ return '<div class="fact"><small>' + esc(t(f[0])) + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>';
  if(c.x) h += exoEcon(c);
  h += '<div class="card pad" style="margin-top:16px"><h2 style="font-size:19px">' + esc(t('stages')) + '</h2><div class="stagebar">' + st.map(function(s, i){ return '<i style="flex:' + Math.max(1, s.end - s.start) + ';background:' + STAGECOL[i] + '"></i>'; }).join('') + '</div><div class="stagelist">' + st.map(function(s, i){ return '<div><i style="background:' + STAGECOL[i] + '"></i><span>' + esc(t('st_' + s.k)) + '<small>' + esc(t('day_n', {n: s.start + 1})) + ' – ' + s.end + '</small></span></div>'; }).join('') + '</div><p class="xs mu2" style="margin:12px 0 0">' + esc(t('approx')) + '</p></div>';
  h += '<div class="grid g2" style="margin-top:16px"><div class="card pad"><h2 style="font-size:19px;margin-bottom:12px;display:flex;gap:8px;align-items:center"><span class="ico r" style="width:36px;height:36px;border-radius:10px">' + I('bug') + '</span>' + esc(t('pests')) + '</h2><div class="pdgrid">' + c.p.map(function(p){ return pdCard(c, 'pest', p); }).join('') + '</div><h2 style="font-size:19px;margin:20px 0 12px;display:flex;gap:8px;align-items:center"><span class="ico s" style="width:36px;height:36px;border-radius:10px">' + I('alert') + '</span>' + esc(t('diseases')) + '</h2><div class="pdgrid">' + c.ds.map(function(d){ return pdCard(c, 'disease', d); }).join('') + '</div><p class="xs mu2" style="margin:10px 0 0">' + esc(t('pd_tap')) + '</p><div class="row wrap" style="margin-top:18px"><a class="btn bs bsm" href="#scan" data-act="scanmode" data-v="leaf">' + I('leaf') + esc(t('t_doctor')) + '</a><a class="btn bs bsm" href="#scan" data-act="scanmode" data-v="insect">' + I('bug') + esc(t('t_pest')) + '</a></div></div>';
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
    return '<a class="cyc" href="#cycle-' + c.id + '">' + (cycImg(c) ? '<div class="cycph"><img src="' + cycImg(c) + '" alt=""></div>' : '') + '<div class="hd">' + cycDot(c, true) + '<div style="flex:1;min-width:0"><h3>' + esc(L(x.cr.n)) + '</h3><div class="sm mu">' + esc((c.plot || '') + (c.plot ? ' · ' : '') + num(c.area) + ' ' + t('acres_short')) + '</div></div></div><div><div class="row" style="justify-content:space-between;font-size:14px;margin-bottom:6px"><span>' + esc(stTxt) + '</span><span class="mu2">' + Math.round(x.pct) + '%</span></div><div class="prog"><i style="width:' + x.pct + '%"></i></div></div><div class="row" style="justify-content:space-between;font-size:14px"><span class="mu">' + esc(t('spent')) + ' <b style="color:var(--ink)">' + rs(x.spent) + '</b></span><span class="mu">' + esc(t('exp_harvest')) + ' <b style="color:var(--ink)">' + esc(fmtDs(x.h1)) + '</b></span></div></a>'; }).join('') + '</div>';
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
  h += cycBanner(c);
  h += '<div class="dhead" style="margin-top:0">' + cycDot(c, true) + '<div style="flex:1;min-width:200px"><h1>' + esc(L(x.cr.n)) + (c.plot ? ' · ' + esc(c.plot) : '') + '</h1><div class="mu">' + esc(num(c.area) + ' ' + t('acres_short') + (c.variety ? ' · ' + c.variety : '') + ' · ' + t('irr_' + (c.irr || 'rainfed')) + ' · ' + fmtD(x.sow)) + '</div></div><div class="row"><button class="btn bs bsm" data-act="editcycle" data-v="' + c.id + '">' + I('edit') + esc(t('edit')) + '</button><button class="btn bd bsm" data-act="delcycle" data-v="' + c.id + '">' + I('trash') + esc(t('delete')) + '</button></div></div>';
  var pos = x.profit >= 0;
  h += '<div class="kpis"><div class="kpi"><small>' + esc(t('cur_stage')) + '</small><b style="font-size:19px">' + esc(x.day < 1 ? t('not_sown', {n: 1 - x.day}) : (x.done ? t('done_cycle') : t('st_' + (x.cur ? x.cur.k : 'germ')))) + '</b><small>' + (x.day >= 1 ? esc(t('day_n', {n: x.day})) : '') + '</small></div><div class="kpi"><small>' + esc(t('spent')) + '</small><b>' + rs(x.spent) + '</b><small>' + esc(t('per_acre')) + ': ' + rs(c.area ? x.spent / c.area : 0) + '</small></div><div class="kpi"><small>' + esc(t('income')) + '</small><b>' + rs(x.inc) + '</b><small>' + esc(t('exp_harvest')) + ': ' + esc(fmtDs(x.h1)) + '</small></div><div class="kpi ' + (x.inc || x.spent ? (pos ? 'pos' : 'neg') : '') + '"><small>' + esc(pos ? t('profit') : t('loss')) + '</small><b>' + rs(Math.abs(x.profit)) + '</b><small>' + (c.budget ? esc(t('budget_used')) + ': ' + Math.round(x.spent / c.budget * 100) + '%' : esc(t('no_budget'))) + '</small></div></div>';
  h += '<div class="tabs" role="tablist">' + [['overview','tab_overview'],['plan','tab_plan'],['exp','tab_exp'],['inc','tab_inc'],['diary','tab_diary']].map(function(k){ var due = k[0] === 'plan' ? planDueCount(c) : 0; return '<button type="button" role="tab" data-act="cyctab" data-v="' + k[0] + '" aria-selected="' + (tab === k[0]) + '">' + (k[0] === 'plan' ? I('spark') : '') + esc(t(k[1])) + (due ? '<span class="tbadge">' + num(due, 0) + '</span>' : '') + '</button>'; }).join('') + '</div>';
  if(tab === 'overview'){
    h += '<div class="grid g2" style="align-items:start"><div class="card pad"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><h2 style="font-size:19px">' + esc(t('timeline')) + '</h2><button class="btn bs bsm" data-act="stgedit" data-v="' + c.id + '">' + I('edit') + esc(t('edit')) + '</button></div><div class="prog" style="margin:10px 0 18px"><i style="width:' + x.pct + '%"></i></div><div class="tl">' + x.stages.map(function(s){ var d = addDays(x.sow, s.start), st = (x.day - 1) >= s.end ? 'done' : ((x.cur && x.cur.k === s.k && !x.done) ? 'now' : ''); return '<div class="it ' + st + '"><span class="dt"></span><div><b>' + esc(t('st_' + s.k)) + (s.edited ? ' <span class="edtag">' + esc(t('pl_mine')) + '</span>' : '') + '</b><small>' + esc(fmtDs(d)) + ' · ' + esc(t('day_n', {n: s.start + 1})) + '</small></div></div>'; }).join('') + '<div class="it ' + (x.done ? 'done' : '') + '"><span class="dt"></span><div><b>' + esc(t('exp_harvest')) + (x.hvEdited ? ' <span class="edtag">' + esc(t('pl_mine')) + '</span>' : '') + '</b><small>' + esc(fmtDs(x.h1) + ' – ' + fmtDs(x.h2)) + '</small></div></div></div><p class="xs mu2" style="margin:10px 0 0">' + esc(c.stg || c.hv ? t('stg_edited_note') : t('approx')) + '</p>' + planPeek(c) + '</div>';
    var rv = S.reviews[c.id];
    h += '<div style="display:flex;flex-direction:column;gap:16px"><div class="card pad"><h2 style="font-size:19px;margin-bottom:14px">' + esc(t('by_cat')) + '</h2>' + catBars(c) + '</div><div class="aibox"><div class="hd"><div style="display:flex;gap:12px"><span class="ico s">' + I('spark') + '</span><div><h2 style="font-size:19px">' + esc(t('ai_review')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('ai_review_d')) + '</p></div></div>' + aiButtons('review', c.id, rv) + '</div><div class="md" id="review-out" style="margin-top:' + (rv ? '12px' : '0') + '">' + (rv ? (rv.text ? md(rv.text) : '') + (rv.busy ? '<div class="load"><span class="spin"></span>' + esc(rv.text ? '' : t('thinking')) + '</div>' : '') + (rv.err ? '<div class="note r">' + I('alert') + esc(rv.err) + '</div>' : '') : '') + '</div></div></div></div>';
  }
  if(tab === 'plan') h += planTab(c);
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
  S.chat.forEach(function(m, i){ h += chatMsgHTML(m, i); });
  if(!S.chat.length) h += '<div class="sugs">' + ['sug1','sug2','sug3','sug4'].map(function(k){ return '<button type="button" data-act="sug" data-v="' + k + '">' + esc(t(k)) + '</button>'; }).join('') + '</div>';
  h += '</div>';
  var off = S.sampleReady && !S.sample;
  if(off) h += '<div class="note" style="margin-bottom:10px">' + I('info') + esc(t('ai_off')) + '</div>';
  var busy = S.chat.length && S.chat[S.chat.length - 1].busy;
  h += '<form class="composer" id="composer">' + (S.dict ? '<button type="button" class="iconbtn' + (S.listening ? ' rec' : '') + '" data-act="mic" aria-label="' + esc(S.listening ? t('listening') : t('speak')) + '">' + I('mic') + '</button>' : '') + '<textarea id="chatin" rows="1" placeholder="' + esc(S.listening ? t('listening') : t('ai_ph')) + '" aria-label="' + esc(t('ai_ph')) + '"' + (off ? ' disabled' : '') + '>' + esc(S.draft || '') + '</textarea>' + (busy ? '<button type="button" class="iconbtn" data-act="ai-stop" data-k="chat" aria-label="' + esc(t('stop_gen')) + '">' + I('stop') + '</button>' : '<button type="submit" class="iconbtn p" aria-label="' + esc(t('send')) + '"' + (off || !S.sampleReady ? ' disabled' : '') + '>' + I('send') + '</button>') + '</form></div>';
  return h;
}
function chatMsgHTML(m, i){
  if(m.role === 'user') return '<div class="msg u' + (m.detail ? ' ask' : '') + '">' + (m.detail ? I('file') : '') + esc(m.content) + '</div>';
  var last = i === S.chat.length - 1, done = !m.busy && m.content && !m.err;
  return '<div class="msg a' + (m.detail ? ' long' : '') + '"><div class="md">' + (m.content ? md(m.content) : '') + (m.busy ? '<div class="load" style="padding:4px 0"><span class="spin"></span>' + (m.content ? '' : esc(t(m.detail ? 'chat_detail_busy' : 'thinking'))) + '</div>' : '') + (m.err ? '<div class="note r" style="margin-top:8px">' + I('alert') + esc(m.err) + '</div>' : '') + '</div>' +
    (done ? '<div class="mact">' + speakBtn('chat' + i) + (!m.detail && last && !(S.chat[i + 1]) ? '<button type="button" class="mdet" data-act="chatdetail" data-v="' + i + '">' + I('file') + esc(t('chat_detail')) + '</button>' : '') + (m.detail ? '<button type="button" class="mdet" data-act="download" data-v="chat' + i + '">' + I('download') + 'PDF</button>' : '') + '</div>' : '') + '</div>';
}
function chatRules(){
  var mine = S.cycles.slice(0, 6).map(function(c){ var x = cycInfo(c); return x.cr.n.en + ' (' + c.area + ' acre, day ' + x.day + ', stage ' + (x.cur ? T.en['st_' + x.cur.k] : 'not sown') + ', spent ₹' + Math.round(x.spent) + ')'; }).join('; ');
  return sysPrompt((mine ? 'The farmer is currently growing: ' + mine + '.\n' : '') +
    'Always reply in the language above, even if the farmer writes in another language or in Roman script.\n' +
    'ANSWER STYLE (very important): reply like a short chat message from an expert friend, easy for a farmer to read on a phone. ' +
    'Default = SHORT: one direct answer line, then at most 3–4 short bullet points with the key quantity, dose and timing. About 40–90 words. No headings, no tables, no long introductions, no repeating the question. ' +
    'Give a LONG, detailed, well-structured answer (short headings, bullets, a small table if useful) ONLY when the farmer clearly asks for detail, a report, a full plan or schedule (words like detail, सविस्तर, विस्तार से, अहवाल, रिपोर्ट, report, plan, वेळापत्रक, full). ' +
    'If key information is missing (crop, stage, symptoms, area), give the most likely answer and ask ONE short follow-up question at the end.\n' +
    (S.webSearch ? 'LIVE DATA: You may use Google Search for current prices, weather, scheme news and dates — mention the source and date, and keep it short.' : 'LIVE DATA: You cannot see live mandi prices, weather forecasts or the latest scheme news. If asked, say so briefly and suggest agmarknet.gov.in / eNAM, the IMD Meghdoot app, or the Kisan Call Centre 1800-180-1551 — then still give useful general advice.'));
}
function sendChat(text, detail){
  text = String(text || '').trim(); if(!text || !S.sample) return;
  if(S.chat.length && S.chat[S.chat.length - 1].busy) return;
  S.draft = ''; S.chat.push({role: 'user', content: text, detail: !!detail}); var a = {role: 'assistant', content: '', busy: true, detail: !!detail}; S.chat.push(a); softRender(); botAfterRender(); scrollChat();
  var hist = S.chat.filter(function(m){ return m !== a && !m.err; }).slice(-14).map(function(m){ return {role: m.role, content: m.content || '…'}; });
  while(hist.length && hist[0].role !== 'user') hist.shift();
  if(detail && hist.length) hist[hist.length - 1] = {role: 'user', content: 'Give me the DETAILED report on the topic we just discussed (my previous question and your short answer). Use short headings, numbered steps, exact doses per litre / per acre, timing by crop stage or days, organic and chemical options, precautions and cost where useful. Write it clearly for a farmer.'};
  ctl.chat = new AbortController();
  S.sample(hist, {system: chatRules(), task: detail ? 'guide' : 'chat', cache: false, signal: ctl.chat.signal, onText: function(u){ a.content = u.text; var el = $$('#msgs .msg.a'); el = el[el.length - 1]; if(el && route().v === 'ai'){ $('.md', el).innerHTML = md(u.text); scrollChat(); } }})
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
  S.newsBusy = true; S.newsErr = null; S.newsTry = Date.now(); if(route().v === 'news' && (force || !had)) patchNews();
  use('news').then(function(fn){
    if(!fn) throw new Error('no news');
    return fn(force);
  }).then(function(d){ S.news = {items: (d && d.items) || [], updated: (d && d.updated) || Date.now(), at: Date.now()}; S.newsErr = null; })
    .catch(function(){ S.newsErr = t('news_err'); })
    .then(function(){ S.newsBusy = false; var v = route().v; if(v === 'news' && (force || !had)) render(); if(v === 'home'){ var hn = $('#homenews'); if(hn) hn.innerHTML = homeNews(); } });
}
function newsAuto(){ if(newsNeeded() && !S.newsBusy && !(S.newsErr && Date.now() - (S.newsTry || 0) < 30000)) setTimeout(function(){ loadNews(false); }, 0); }
function newsNeeded(){ return !S.news || Date.now() - S.news.at > 10 * 60000; }
function newsList(){
  var items = ((S.news && S.news.items) || []).filter(function(n){ return S.newsLang === 'all' || n.lang === S.newsLang; });
  if(S.newsCat === 'top') return topNews(20);
  return items.filter(function(n){ return S.newsCat === 'all' || n.cat === S.newsCat; });
}
function newsImg(n, cls){
  var col = NEWSCOL[n.cat] || NEWSCOL.other, ph = '<div class="nph" style="background:' + col + '">' + I(n.cat === 'weather' ? 'sun' : (n.cat === 'market' ? 'rupee' : (n.cat === 'livestock' ? 'drop' : (n.cat === 'tech' ? 'spark' : 'news')))) + '<span>' + esc(n.source) + '</span></div>';
  if(!n.image) return '<div class="' + cls + '">' + ph + '</div>';
  var eager = cls === 'rbg' && n.__i < 2;
  return '<div class="' + cls + '"><img src="' + esc(sized(n.image, 1280)) + '" alt="" ' + (eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">' + ph + '</div>';
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
  newsAuto();
  var items = ((S.news && S.news.items) || []).slice(0, 10);
  if(!items.length){
    if(S.newsErr) return '<div class="note">' + I('info') + esc(S.newsErr) + '</div>';
    return '<div class="nstrip">' + [0, 1, 2, 3].map(function(){ return '<div class="nmini skel"><div class="nimg"></div><div class="nbody"><i></i><i></i></div></div>'; }).join('') + '</div>';
  }
  return '<div class="nstrip">' + items.map(function(n){ return '<a class="nmini" href="#news" data-act="newsopen" data-v="' + esc(n.id) + '">' + newsImg(n, 'nimg') + '<div class="nbody">' + newsChip(n) + '<b class="clamp3">' + esc(n.title) + '</b><small>' + esc(n.source) + ' · ' + esc(ago(n.date)) + '</small></div></a>'; }).join('') + '</div>';
}
function vNews(){
  newsAuto();
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
  n.__i = i;
  return '<article class="reel rB" id="n-' + esc(n.id) + '" data-i="' + i + '">' + newsImg(n, 'rbg') + '<div class="rsh"></div>' +
    '<div class="rtx"><div class="rmeta"><span class="rcat" style="background:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '">' + esc(t('nc_' + n.cat)) + '</span><span class="rcnt">' + num(i + 1, 0) + ' / ' + num(total, 0) + '</span></div>' +
      '<button type="button" class="rtap" data-act="nread" data-v="' + esc(n.id) + '"><h2>' + esc(n.title) + '</h2>' + (n.summary ? '<p>' + esc(n.summary) + '</p>' : '') + '</button>' +
      '<button type="button" class="rsrc" data-act="nread" data-v="' + esc(n.id) + '">' + esc(n.source) + ' · ' + esc(ago(n.date)) + ' · <u>' + esc(t('nr_read')) + ' ›</u></button></div>' +
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
function patchSheet(){ var nr = $('#nrai'); if(nr && S.nread) nr.innerHTML = nrAI(S.nread); var s = $('#nsheet'); if(!s) return; var b = $('#nsbody'), st = b ? b.scrollTop : 0, nearEnd = b && b.scrollTop + b.clientHeight >= b.scrollHeight - 30; s.innerHTML = newsSheet(); var nb = $('#nsbody'); if(nb) nb.scrollTop = nearEnd ? nb.scrollHeight : st; }
function nextHeads(i){ var l = newsList().slice(i + 1, i + 4); if(!l.length) return ''; return '<div class="rnext"><small>' + esc(t('news_next_h')) + '</small>' + l.map(function(n, j){ return '<button type="button" data-act="reelnext" data-v="' + (i + 1 + j) + '"><span class="rnd" style="background:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '"></span><span>' + esc(n.title) + '</span></button>'; }).join('') + '</div>'; }
/* v7.8 — the news page is a fixed full-screen stage sized by the browser itself (CSS), so nothing is measured here.
   Each card's text is fitted from the bottom up: summary 3 → 2 → 1 → 0 lines, then title 3 → 2, so the source line is always on screen. */
function sizeReels(){ var r = $('#reels'); if(!r) return; if(r.style.height) r.style.height = ''; fitReels(); }
var FITS = ['f1', 'f2', 'f3', 'f4'];
function fitReel(el){
  var tx = el.querySelector('.rtx'); if(!tx || !el.clientHeight) return;
  var top = document.querySelector('.rtop'), topH = top ? top.getBoundingClientRect().height : 60;
  var avail = el.clientHeight - topH - 12;
  FITS.forEach(function(f){ el.classList.remove(f); });
  for(var i = 0; i < FITS.length && tx.getBoundingClientRect().top - el.getBoundingClientRect().top < topH + 4; i++) el.classList.add(FITS[i]);
  el.classList.toggle('fitok', tx.offsetHeight <= avail);
}
function fitReels(){ var r = $('#reels'); if(!r) return; Array.prototype.forEach.call(r.querySelectorAll('.reel'), fitReel); }
var reelObs = null;
function setupReels(){
  sizeReels(); requestAnimationFrame(sizeReels); setTimeout(sizeReels, 250); setTimeout(sizeReels, 1200);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(sizeReels);
  if(window.ResizeObserver && !setupReels.ro){ setupReels.ro = new ResizeObserver(function(){ if(route().v === 'news') fitReels(); }); setupReels.ro.observe(document.documentElement); }
  var rr = $('#reels'); if(rr && window.MutationObserver){ if(setupReels.mo) setupReels.mo.disconnect(); setupReels.mo = new MutationObserver(function(){ requestAnimationFrame(fitReels); }); setupReels.mo.observe(rr, {childList: true}); }
  if(window.visualViewport && !setupReels.vv){ setupReels.vv = true; visualViewport.addEventListener('resize', function(){ if(route().v === 'news') sizeReels(); }); }
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
var lastToast = {m: '', at: 0};
function toast(msg, kind){ var now = Date.now(); if(msg === lastToast.m && now - lastToast.at < 2500) return; lastToast = {m: msg, at: now}; var old = document.querySelectorAll('.toast'); for(var i = 0; i < old.length; i++) old[i].remove(); var d = document.createElement('div'); d.className = 'toast' + (kind ? ' ' + kind : ''); d.setAttribute('role', 'status'); d.setAttribute('aria-live', 'polite'); d.textContent = msg; document.body.appendChild(d); setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); }, 260); }, kind === 'long' ? 4200 : 2400); }

/* ================= DOWNLOAD AI REPORTS (PDF via the phone's "Save as PDF") ================= */
function reportFor(sid){
  var c, x;
  if(sid.indexOf('rep:') === 0){ var sr = repById(sid.slice(4)); return sr ? {title: sr.title, md: sr.md, img: sr.img} : null; }
  if(sid === 'yojana') return yReport();
  if(/^prc-/.test(sid)) return prReport(sid.slice(2));
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
    S.sample(prompt, {system: EXPERT + '\n' + aiLangRule(), task: 'short', onText: function(u){ S.newsAI[id].text = u.text; if(S.newsSheet === id || S.nread === id) patchSheet(); }})
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
  prPatch();
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
  h += '<div class="msec"><a class="mrow" href="#rakshak" data-act="close">' + I('shield') + '<span><b>' + esc(t('pr_h')) + '</b><small>' + esc(t('pr_tile_d')) + '</small></span>' + I('chev', 'chev') + '</a><a class="mrow" href="#yojana" data-act="close">' + I('file') + '<span><b>' + esc(t('y_h')) + '</b><small>' + esc(t('y_tile_d')) + '</small></span>' + I('chev', 'chev') + '</a></div>';
  h += '<div class="msec"><a class="mrow" href="#reports" data-act="close">' + I('file') + '<span><b>' + esc(t('rep_h')) + (S.reports.length ? ' <em class="mbadge">' + num(S.reports.length, 0) + '</em>' : '') + '</b><small>' + esc(t('rep_menu_d')) + '</small></span>' + I('chev', 'chev') + '</a><a class="mrow" href="#weather" data-act="close">' + I('cloudsun') + '<span><b>' + esc(t('wx_h')) + '</b><small>' + esc(t('t_wx_d')) + '</small></span>' + I('chev', 'chev') + '</a>' +
    '<label class="mrow">' + I('text') + '<span><b>' + esc(t('big_text')) + '</b><small>' + esc(t('big_text_d')) + '</small></span><input type="checkbox" class="sw" data-act="bigtext"' + (S.bigText ? ' checked' : '') + '></label>' +
    '<a class="mrow" href="tel:18001801551">' + I('phone') + '<span><b>' + esc(t('helpline')) + ' · 1800-180-1551</b><small>' + esc(t('helpline_d')) + '</small></span></a>' +
    '<a class="mrow" href="https://agmarknet.gov.in" target="_blank" rel="noopener">' + I('rupee') + '<span><b>' + esc(t('link_mandi')) + '</b></span>' + I('ext') + '</a>' +
    '<a class="mrow" href="https://enam.gov.in" target="_blank" rel="noopener">' + I('rupee') + '<span><b>' + esc(t('link_enam')) + '</b></span>' + I('ext') + '</a>' +
    '<a class="mrow" href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">' + I('layers') + '<span><b>' + esc(t('link_shc')) + '</b></span>' + I('ext') + '</a></div>';
  if(installEvt && !isStandalone()) h += '<div class="msec"><button class="mrow inst" data-act="install">' + I('download') + '<span><b>' + esc(t('v7_install')) + '</b><small>' + esc(t('v7_install_d')) + '</small></span>' + I('chev', 'chev') + '</button></div>';
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
  var v = $('#view'), html, routeKey = r.v + '|' + (r.id || '');
  try{
  switch(r.v){
    case 'crops': html = vCrops(); break; case 'crop': html = vCrop(r.id); break; case 'planner': html = vPlanner(); break;
    case 'scan': html = vScan(); break; case 'farm': html = vFarm(); break; case 'cycle': html = vCycle(r.id); break;
    case 'organic': html = vOrganic(); break; case 'ai': html = vAI(); break;
    case 'news': html = vNews(); break; case 'market': html = vMarket(); break; case 'reports': html = vReports(); break; case 'photos': html = vPhotos(); break; case 'rakshak': html = vRakshak(); break; case 'yojana': html = vYojana(); break; case 'report': html = vReport(r.id); break; case 'soil': html = vSoil(); break; case 'weather': html = vWeather(); break; default: html = vHome();
  }
  }catch(err){ html = crashView(err, r.v); }
  var keepReel = r.v === 'news' && $('#reels') ? $('#reels').scrollTop : null;
  v.innerHTML = html;
  if(r.v === 'news') v.classList.remove('enter');
  if(routeKey !== lastRouteKey){ lastRouteKey = routeKey; if(r.v !== 'news' && !reduceMotion()){ v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); } }
  imgSettle(v);
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
    case 'install': doInstall(); break;
    case 'installx': lsSet('instx', Date.now()); var ic = $('#instcard'); if(ic) ic.remove(); break;
    case 'crashretry': lastShellKey = ''; render(); break;
    case 'offx': S.offHide = true; offBanner(); break;
    case 'prrefresh': loadWx(true); S.prCache = {}; lsSet('pr', {}); prPatch(); break;
    case 'prrun': var pc = cyc(v); if(pc) prRun(pc, true); break;
    case 'claimkit': claimKit(); break;
    case 'ckshare': var ct = claimText(); if(navigator.share){ navigator.share({text: ct}).catch(function(){}); } else { try{ navigator.clipboard.writeText(ct); toast(t('copied')); }catch(e){} } break;
    case 'cycphotodel': photoDel(v).then(function(){ render(); }); break;
    case 'yneed': S.yprof = yRead(); var nd = S.yprof.need, ni2 = nd.indexOf(v); if(ni2 > -1) nd.splice(ni2, 1); else nd.push(v); el.setAttribute('aria-pressed', ni2 < 0); lsSet('yprof', S.yprof); break;
    case 'yfind': yFind(); break;
    case 'yfind2': if(!S.yprof) S.yprof = yDefault(); S.yEdit = true; render(); yFind(); break;
    case 'yedit': S.yEdit = true; render(); break;
    case 'ycancel': S.yEdit = false; render(); break;
    case 'yopen': S.yOpen = S.yOpen === +v ? -1 : +v; render(); break;
    case 'mkr': S.mkR = +v; lsSet('mkR', S.mkR); render(); break;
    case 'mkopen': S.mkOpen = S.mkOpen === v ? null : v; render(); break;
    case 'mknearon': S.mkNear = true; lsSet('mkNear', true); render(); break;
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
  if(a === 'cycphoto'){ var pf = el.files && el.files[0], pid = el.getAttribute('data-v'); if(pf) photoSave(pid, pf).then(function(){ toast(t('ph_saved')); render(); }).catch(function(){ toast(t('ph_err')); }); el.value = ''; }
  if(a === 'mksort'){ S.mkSort = el.value; render(); }
  if(a === 'mknear'){ S.mkNear = el.checked; lsSet('mkNear', S.mkNear); render(); }
  if(a === 'ydoc'){ S.ydocs[el.getAttribute('data-v')] = el.checked; lsSet('ydocs', S.ydocs); }
  if(a === 'ystate'){ S.yprof = yRead(); S.yprof.state = el.value; S.yprof.district = ''; render(); }
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
window.addEventListener('hashchange', function(e){ var from = String(e.oldURL || '').split('#')[1] || 'home', to = location.hash.slice(1) || 'home'; navScroll[from] = window.scrollY; var back = navStack.length > 1 && navStack[navStack.length - 2] === to; if(back) navStack.pop(); else { navStack.push(to); if(navStack.length > 40) navStack.shift(); } closeModal(); stopSpeak(); S.newsSheet = null; var sp = $('#savepop'); if(sp) sp.remove(); S.botOpen = false; S.cycTab = route().v === 'cycle' ? S.cycTab : 'overview'; render(); var y = back ? (navScroll[to] || 0) : 0; window.scrollTo(0, y); if(back && y) setTimeout(function(){ if(Math.abs(window.scrollY - y) > 40) window.scrollTo(0, y); }, 350); });
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
  if(id && c.crop !== fd.get('crop')){ delete c.stg; delete c.hv; if(c.plan) c.plan.items = (c.plan.items || []).filter(function(x){ return x.src === 'me'; }); }
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
  if(sid === 'yojana'){ var yr = yReport(); return yr ? yr.md : ''; }
  if(/^prc-/.test(sid)){ var prr = prReport(sid.slice(2)); return prr ? prr.md : ''; }
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
  var pl = planItems(c).filter(function(it){ return !it.done; });
  if(pl.length){ out = out.filter(function(o){ return o.ic !== 'leaf'; }); pl.forEach(function(it){ var d = addDays(x.sow, it.day), dd = diffDays(d, now); if((dd >= 0 || (dd >= -2 && planBorn(c, it))) && dd <= 30) out.push({d: d, dd: Math.max(0, dd), late: dd < 0, title: it.title, sub: PLTYPE[it.type] ? t('pt_' + it.type) : '', ic: (PLTYPE[it.type] || PLTYPE.other)[0]}); }); }
  out.sort(function(a, b){ return a.dd - b.dd; });
  return out;
}
function cropTaskCards(){
  var list = S.cycles.map(function(c){ var x = cycInfo(c); return {c: c, x: x, tk: tasksFor(c)}; }).filter(function(o){ return !o.x.done; });
  if(!list.length) return '<div class="card tasks"><div class="empty"><span class="ico g">' + I('cal') + '</span><p style="margin:0 0 14px">' + esc(t('no_tasks')) + '</p><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div></div>';
  list.sort(function(a, b){ return (a.tk[0] ? a.tk[0].dd : 999) - (b.tk[0] ? b.tk[0].dd : 999); });
  return '<div class="ctasks">' + list.map(function(o){ var c = o.c, x = o.x;
    var st = x.cur ? t('st_' + x.cur.k) : t('not_sown');
    return '<div class="card ctask"><a class="cth" href="#cycle-' + c.id + '">' + cycDot(c) + '<span class="ctt"><b>' + esc(L(x.cr.n)) + (c.plot ? ' · ' + esc(c.plot) : '') + '</b><small>' + esc(num(c.area) + ' ' + t('acres_short')) + ' · ' + esc(t('day_n', {n: num(Math.max(0, x.day), 0)})) + ' · ' + esc(st) + '</small></span><span class="ctp">' + num(Math.round(x.pct), 0) + '%</span></a>' +
      '<div class="prog ctprog"><i style="width:' + x.pct + '%"></i></div>' +
      (o.tk.length ? o.tk.slice(0, 3).map(function(k){ return '<a class="task" href="#cycle-' + c.id + '"><span class="when' + (k.dd === 0 ? ' today' : '') + '"><b>' + k.d.getDate() + '</b><small>' + esc(MONTHS[S.lang][k.d.getMonth()]) + '</small></span><span class="tx"><b>' + esc(k.title) + '</b><span>' + esc((k.sub ? k.sub + ' · ' : '') + (k.dd === 0 ? t('today') : t('in_days', {n: k.dd}))) + '</span></span></a>'; }).join('')
        : '<div class="task"><span class="tx"><span>' + esc(t('no_task_30')) + '</span></span></div>') + '</div>'; }).join('') + '</div>';
}

/* ---------------- reports (saved AI answers) ---------------- */
var REPKIND = {scan: ['g', 'scan', 'rk_scan'], soil: ['o', 'layers', 'rk_soil'], guide: ['g', 'book', 'rk_guide'], wx: ['b', 'cloudsun', 'rk_wx'], chat: ['b', 'chat', 'rk_chat'], news: ['s', 'news', 'rk_news'], yojana: ['o', 'file', 'rk_yojana'], guard: ['g', 'shield', 'rk_guard'], other: ['s', 'spark', 'rk_other']};
function repKind(sid){ if(sid.indexOf('scan') === 0) return 'scan'; if(sid.indexOf('soil') === 0) return 'soil'; if(sid.indexOf('guide') === 0 || sid.indexOf('review') === 0 || sid === 'reco') return 'guide'; if(sid === 'wx') return 'wx'; if(sid.indexOf('chat') === 0) return 'chat'; if(sid.indexOf('news') === 0) return 'news'; if(sid === 'yojana') return 'yojana'; if(/^prc-/.test(sid)) return 'guard'; return 'other'; }
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
  var kinds = ['all', 'scan', 'soil', 'guide', 'guard', 'yojana', 'wx', 'chat'];
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
function mkPlace(){ var m = S.mk; if(m && m.district) return m; if(!S.district && S.gps && S.gps.en && S.gps.en.district){ var dd = matchDistrict(S.state, S.gps.en.district); if(dd){ S.district = dd; lsSet('district', dd); } } return {state: S.state, district: S.district, name: S.gps ? (gpsName() || S.district) : S.district, lat: S.gps && S.gps.lat, lon: S.gps && S.gps.lon, cur: true}; }
function mkCrops(){ var mine = []; S.cycles.forEach(function(c){ if(mine.indexOf(c.crop) < 0 && crop(c.crop)) mine.push(c.crop); }); var rest = MKTOP.filter(function(id){ return mine.indexOf(id) < 0 && crop(id); }); if(S.mkCrop && mine.indexOf(S.mkCrop) < 0 && rest.indexOf(S.mkCrop) < 0) rest.unshift(S.mkCrop); return {mine: mine, rest: rest}; }
function rsq(v){ return '₹' + num(Math.round(v), 0); }
function spark(arr){
  if(!arr || arr.length < 2) return '';
  var vs = arr.map(function(x){ return x.p; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), W = 300, H = 56, rg = (mx - mn) || 1;
  var pts = arr.map(function(x, i){ return [Math.round(i * W / (arr.length - 1)), Math.round(H - 6 - (x.p - mn) / rg * (H - 14))]; });
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
  return '<svg class="spark" viewBox="-4 0 308 ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + ' L300 ' + H + ' L0 ' + H + 'Z" fill="rgba(47,143,87,.12)"/><path d="' + d + '" fill="none" stroke="#2F8F57" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="4" fill="#14532F"/></svg>';
}
function dayLbl(iso){ var d = parseD(iso), dd = diffDays(today0(), d); return dd <= 0 ? t('today') : (dd === 1 ? t('yesterday') : fmtDs(d)); }
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
      S.chat.slice(-8).map(function(m){ return chatMsgHTML(m, S.chat.indexOf(m)); }).join('') +
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
  var fab = $('.botfab', b); if(fab && !S.botOpen && !botAfterRender.flashed){ botAfterRender.flashed = true; if(!reduceMotion()){ fab.classList.add('flash'); setTimeout(function(){ fab.classList.remove('flash'); }, 2600); } }
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

function mkKey(){ var p = mkPlace(); return S.mkCrop + '|' + p.state + '|' + p.district + '|' + (p.lat ? (+p.lat).toFixed(2) : '') + '|' + (S.mkNear ? 1 : 0); }
function loadMandiCrops(){
  if(S.mkList || S.mkListBusy) return; S.mkListBusy = true;
  fetch('/api/mandi?crops=1').then(function(r){ return r.json(); }).then(function(j){ S.mkList = j.crops || []; }).catch(function(){ S.mkList = MKTOP.slice(); })
    .then(function(){ S.mkListBusy = false; if(route().v === 'market') softRender(); });
}
function loadMandi(force){
  var p = mkPlace(), k = mkKey(), cur = S.mkData[k];
  if(!S.mkCrop || (cur && (cur.busy || (!force && Date.now() - (cur.at || 0) < 1800000)))) return;
  S.mkData[k] = {busy: true};
  var q = 'crop=' + encodeURIComponent(S.mkCrop) + '&state=' + encodeURIComponent(p.state || '') + '&district=' + encodeURIComponent(p.district || '') + (p.lat ? '&lat=' + p.lat + '&lon=' + p.lon : '') + (S.mkNear ? '&near=1' : '');
  fetch('/api/mandi?' + q).then(function(r){ return r.json().then(function(j){ if(!r.ok){ var e = new Error(j.error || 'HTTP ' + r.status); e.code = j.code; throw e; } return j; }); })
    .then(function(j){ S.mkData[k] = {at: Date.now(), d: j}; if(route().v === 'market') softRender(); })
    .catch(function(e){ S.mkData[k] = {at: Date.now(), err: e.code === 'no_key' ? t('mk_nokey') : (e.code === 'bad_key' ? t('mk_badkey') : (e.message || t('mk_err')))}; if(route().v === 'market') softRender(); });
}
function mkChange(m){ if(!m.prev) return ''; var c = m.modal - m.prev; if(!c) return '<span class="mkd eq">=</span>'; return '<span class="mkd ' + (c > 0 ? 'up' : 'dn') + '">' + (c > 0 ? '▲' : '▼') + num(Math.abs(Math.round(c)), 0) + '</span>'; }
function mkKm(m){ return m.km == null ? '' : (m.exact ? '' : '≈') + num(m.km, 0) + ' ' + t('km'); }
function vMarket(){
  loadMandiCrops();
  var cs = mkCrops(), avail = S.mkList;
  if(avail){ cs.mine = cs.mine.filter(function(id){ return avail.indexOf(id) > -1; }); cs.rest = cs.rest.filter(function(id){ return avail.indexOf(id) > -1; }); }
  if(!S.mkCrop || (avail && avail.indexOf(S.mkCrop) < 0)) S.mkCrop = cs.mine[0] || 'onion';
  var p = mkPlace(), c = crop(S.mkCrop), k = mkKey(), st = S.mkData[k];
  if(!st) setTimeout(function(){ loadMandi(false); }, 0);
  var h = '<div class="ph"><h1>' + esc(t('mk_h')) + '</h1><p>' + esc(t('mk_d')) + '</p></div>';
  h += '<div class="curloc">' + I('pin') + '<div><b>' + esc(p.name || p.district || p.state) + (p.district && p.name !== p.district ? ', ' + esc(p.district) : '') + '</b><small>' + esc(p.cur ? (p.lat ? t('mk_curloc') : t('mk_curdist')) : t('mk_chosen')) + '</small></div><button class="btn bs bsm" data-act="mkloc">' + I('edit') + esc(t('change')) + '</button></div>';
  h += '<div class="mkcrops">' + cs.mine.concat(cs.rest).map(function(id){ var cr = crop(id), mine = cs.mine.indexOf(id) > -1; return '<button type="button" data-act="mkcrop" data-v="' + id + '" aria-pressed="' + (S.mkCrop === id) + '">' + cropDot(cr) + esc(L(cr.n)) + (mine ? '<i title="' + esc(t('nav_farm')) + '">' + I('sprout') + '</i>' : '') + '</button>'; }).join('') + '<button type="button" class="mkmore" data-act="mkpick">' + I('plus') + esc(t('crop')) + '</button></div>';
  if(!st || st.busy) return h + '<div class="card pad">' + loadBox(t('mk_loading'), 4) + '<p class="xs mu2" style="margin:6px 0 0">' + esc(t('mk_loading_d')) + '</p></div>';
  if(st.err) return h + '<div class="card pad"><div class="note r">' + I('alert') + esc(st.err) + '</div><div class="row wrap" style="margin-top:12px"><button class="btn bs bsm" data-act="mkretry">' + I('refresh') + esc(t('news_refresh')) + '</button><a class="btn bg bsm" href="https://agmarknet.gov.in" target="_blank" rel="noopener">agmarknet.gov.in' + I('ext') + '</a></div></div>';
  var d = st.d, all = d.markets || [];
  var R = S.mkR == null ? 100 : S.mkR, sort = S.mkSort || 'km';
  var rows = all.filter(function(m){ return !R || !d.located || (m.km != null && m.km <= R); });
  if(sort === 'price') rows = rows.slice().sort(function(a, b){ return b.modal - a.modal; });
  if(sort === 'date') rows = rows.slice().sort(function(a, b){ return b.date.localeCompare(a.date) || (a.km || 1e9) - (b.km || 1e9); });
  /* controls */
  h += '<div class="mkctl"><div class="chips" role="group" aria-label="' + esc(t('mk_radius')) + '">' + (d.located ? [25, 50, 100, 200, 0].map(function(r){ return '<button type="button" data-act="mkr" data-v="' + r + '" aria-pressed="' + (R === r) + '">' + esc(r ? num(r, 0) + ' ' + t('km') : t('all')) + '</button>'; }).join('') : '') + '</div>' +
    '<div class="row wrap" style="gap:6px"><select class="inp mksort" data-act="mksort" aria-label="' + esc(t('mk_sort')) + '">' + ['km', 'price', 'date'].map(function(s){ return '<option value="' + s + '"' + (sort === s ? ' selected' : '') + '>' + esc(t('mks_' + s)) + '</option>'; }).join('') + '</select>' +
    '<label class="mknear"><input type="checkbox" data-act="mknear"' + (S.mkNear ? ' checked' : '') + '>' + esc(t('mk_near')) + '</label></div></div>';
  if(!all.length) return h + '<div class="card pad"><div class="note">' + I('info') + esc(t('mk_none', {crop: L(c.n), state: (d.states || [p.state]).join(', ')})) + '</div>' + (!S.mkNear ? '<button class="btn bs bsm" style="margin-top:10px" data-act="mknearon">' + esc(t('mk_near')) + '</button>' : '') + '</div>';
  if(!rows.length) return h + '<div class="card pad"><div class="note">' + I('info') + esc(t('mk_none_r', {r: num(R, 0)})) + '</div><button class="btn bs bsm" style="margin-top:10px" data-act="mkr" data-v="0">' + esc(t('mk_showall')) + '</button></div>';
  /* summary */
  var near = rows.reduce(function(a, m){ return (m.km != null && (a == null || m.km < a.km)) ? m : a; }, null) || rows[0];
  var best = rows.reduce(function(a, m){ return m.modal > a.modal ? m : a; }, rows[0]);
  var avg = Math.round(rows.reduce(function(a, m){ return a + m.modal; }, 0) / rows.length);
  h += '<div class="mksum"><div class="mks"><small>' + esc(t('mk_count')) + '</small><b>' + num(rows.length, 0) + '</b><span>' + esc(R && d.located ? t('mk_within', {r: num(R, 0)}) : (d.states || []).join(', ')) + '</span></div>' +
    '<div class="mks"><small>' + esc(t('mk_avg')) + '</small><b>' + rsq(avg) + '</b><span>' + esc(t('mk_perq')) + '</span></div>' +
    '<div class="mks hi"><small>' + esc(t('mk_high')) + '</small><b>' + rsq(best.modal) + '</b><span>' + esc(best.market) + (best.km != null ? ' · ' + mkKm(best) : '') + '</span></div></div>';
  /* nearest mandi card */
  var chg = near.prev ? near.modal - near.prev : null;
  if(!d.located) h += '<div class="note" style="margin-bottom:12px">' + I('pin') + '<span>' + esc(t('mk_setloc')) + ' <button class="btn bs bsm" data-act="mkloc">' + esc(t('change')) + '</button></span></div>';
  h += '<div class="card mkbest"><div class="mkh"><span class="chip g">' + esc(d.located ? t('mk_nearest') : t('mk_latest')) + '</span><span class="chip">' + esc(dayLbl(near.date)) + '</span></div>' +
    '<h2>' + esc(near.market) + '</h2><div class="sm mu">' + esc([near.taluka && near.taluka !== near.market ? near.taluka : '', near.district, near.state !== p.state ? near.state : ''].filter(Boolean).join(' · ')) + (near.km != null ? ' · ' + mkKm(near) : '') + '</div>' +
    '<div class="mkp"><div><small>' + esc(t('mk_modal')) + '</small><b>' + rsq(near.modal) + '</b><span>' + esc(t('mk_perq')) + '</span></div>' + (chg != null ? '<span class="mkchg ' + (chg >= 0 ? 'up' : 'dn') + '">' + (chg >= 0 ? '▲ ' : '▼ ') + rsq(Math.abs(chg)) + '<small>' + esc(t('mk_vsprev_d', {d: dayLbl(near.prevDate)})) + '</small></span>' : '') + '</div>' +
    '<div class="mkmm"><div><small>' + esc(t('mk_min')) + '</small><b>' + rsq(near.min) + '</b></div><div><small>' + esc(t('mk_max')) + '</small><b>' + rsq(near.max) + '</b></div><div><small>' + esc(t('mk_vars')) + '</small><b>' + num(near.varieties.length, 0) + '</b></div></div>' +
    (near.trend && near.trend.length > 1 ? '<div class="mktr"><small>' + esc(t('mk_trend')) + '</small>' + spark(near.trend) + '<div class="mktrl"><span>' + esc(dayLbl(near.trend[0].d)) + ' ' + rsq(near.trend[0].p) + '</span><span>' + esc(dayLbl(near.trend[near.trend.length - 1].d)) + ' ' + rsq(near.trend[near.trend.length - 1].p) + '</span></div></div>' : '') + '</div>';
  /* list */
  h += '<div class="h-sec" style="margin-top:18px"><h2 style="font-size:18px">' + esc(t('mk_nearby')) + '</h2><span class="xs mu2">' + esc(t('mk_tapmore')) + '</span></div>';
  h += '<div class="card lst mklist">' + rows.slice(0, 60).map(function(m){ var key = m.market + '|' + m.district, open = S.mkOpen === key;
    return '<div class="mki' + (open ? ' open' : '') + '"><button type="button" class="li mkrow" data-act="mkopen" data-v="' + esc(key) + '" aria-expanded="' + open + '"><div class="tx"><b>' + esc(m.market) + (m === best ? ' <span class="chip s" style="font-size:11px;padding:0 7px">' + esc(t('mk_high')) + '</span>' : '') + '</b><span>' + esc([m.taluka && m.taluka !== m.market ? m.taluka : '', m.district, m.state !== p.state ? m.state : ''].filter(Boolean).join(' · ')) + (m.km != null ? ' · ' + mkKm(m) : '') + ' · ' + esc(dayLbl(m.date)) + '</span></div><div class="mkr"><b>' + rsq(m.modal) + ' ' + mkChange(m) + '</b><small>' + rsq(m.min) + '–' + rsq(m.max).slice(1) + '</small></div></button>' +
      (open ? '<div class="mkx">' + '<table class="mkvt"><thead><tr><th>' + esc(t('mk_variety')) + '</th><th>' + esc(t('mk_min')) + '</th><th>' + esc(t('mk_max')) + '</th><th>' + esc(t('mk_modal_s')) + '</th></tr></thead><tbody>' + m.varieties.map(function(v){ return '<tr><td>' + esc(v.variety + (v.grade && v.grade !== 'FAQ' ? ' · ' + v.grade : '')) + '</td><td>' + rsq(v.min) + '</td><td>' + rsq(v.max) + '</td><td><b>' + rsq(v.modal) + '</b></td></tr>'; }).join('') + '</tbody></table>' +
        (m.trend && m.trend.length > 1 ? '<div class="mktr"><small>' + esc(t('mk_trend')) + '</small>' + spark(m.trend) + '<div class="mktrl">' + m.trend.map(function(x){ return '<span>' + esc(dayLbl(x.d)) + '<br><b>' + rsq(x.p) + '</b></span>'; }).join('') + '</div></div>' : '') +
        '<div class="row wrap" style="margin-top:8px"><a class="btn bs bsm" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m.market + ' APMC, ' + m.district + ', ' + m.state) + '" target="_blank" rel="noopener">' + I('pin') + esc(t('mk_map')) + '</a></div></div>' : '') + '</div>'; }).join('') + '</div>';
  /* district summary */
  var byD = {}; rows.forEach(function(m){ var dk = m.district + '|' + m.state; (byD[dk] = byD[dk] || []).push(m); });
  var dl = Object.keys(byD).map(function(dk){ var l = byD[dk]; return {d: l[0].district, s: l[0].state, n: l.length, avg: Math.round(l.reduce(function(a, m){ return a + m.modal; }, 0) / l.length), hi: Math.max.apply(null, l.map(function(m){ return m.modal; })), km: Math.min.apply(null, l.map(function(m){ return m.km == null ? 1e9 : m.km; }))}; }).sort(function(a, b){ return a.km - b.km; });
  if(dl.length > 1) h += '<div class="h-sec" style="margin-top:18px"><h2 style="font-size:18px">' + esc(t('mk_bydist')) + '</h2></div><div class="card"><table class="mkvt mkdt"><thead><tr><th>' + esc(t('district')) + '</th><th>' + esc(t('mk_count_s')) + '</th><th>' + esc(t('mk_avg_s')) + '</th><th>' + esc(t('mk_high_s')) + '</th></tr></thead><tbody>' + dl.map(function(x){ return '<tr><td>' + esc(x.d + (x.s !== p.state ? ' (' + x.s + ')' : '')) + '</td><td>' + num(x.n, 0) + '</td><td>' + rsq(x.avg) + '</td><td><b>' + rsq(x.hi) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  h += '<p class="xs mu2" style="margin-top:12px">' + esc(t('mk_src')) + ' ' + esc(t('mk_dist_note')) + ' · ' + esc(t('news_updated', {t: ago(st.at)})) + '</p>';
  return h;
}

/* ===================================================================
   v6 — पीक रक्षक (Crop Guardian), own crop photos, HD images, schemes
   =================================================================== */

/* ---------- image sizes (Wikimedia thumbnails come in standard widths) ---------- */
function sized(src, w){
  if(!src) return src;
  if(/upload\.wikimedia\.org\/.+\/thumb\//.test(src)) return src.replace(/\/\d+px-([^/?]+)$/, '/' + w + 'px-$1');
  return src;
}

/* ---------- own photo for a crop you are growing (kept on this phone, IndexedDB) ---------- */
var PDB = null;
function pdb(){
  if(PDB) return PDB;
  PDB = new Promise(function(res, rej){
    try{ var r = indexedDB.open('ankurit-photos', 1); r.onupgradeneeded = function(){ r.result.createObjectStore('p'); }; r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }catch(e){ rej(e); }
  });
  return PDB;
}
function pdbDo(mode, fn){ return pdb().then(function(db){ return new Promise(function(res, rej){ var tx = db.transaction('p', mode), st = tx.objectStore('p'), out = fn(st); tx.oncomplete = function(){ res(out && out.result); }; tx.onerror = function(){ rej(tx.error); }; }); }); }
function photoLoadAll(){
  return pdb().then(function(db){ return new Promise(function(res){ var map = {}, tx = db.transaction('p', 'readonly'), cur = tx.objectStore('p').openCursor();
    cur.onsuccess = function(){ var c = cur.result; if(c){ map[c.key] = c.value; c.continue(); } else res(map); }; cur.onerror = function(){ res(map); }; }); })
    .then(function(map){ S.cphoto = map; render(); }).catch(function(){});
}
function photoSave(id, file){
  return new Promise(function(res, rej){
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function(){ try{
      var s = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      var d = cv.toDataURL('image/jpeg', 0.86);
      pdbDo('readwrite', function(st){ return st.put(d, id); }).then(function(){ S.cphoto[id] = d; res(d); }).catch(rej);
    }catch(e){ rej(e); } };
    im.onerror = function(){ rej(new Error('bad image')); }; im.src = url;
  });
}
function photoDel(id){ delete S.cphoto[id]; return pdbDo('readwrite', function(st){ return st.delete(id); }).catch(function(){}); }
function cycImg(c){ return (S.cphoto && S.cphoto[c.id]) || ''; }
function cycDot(c, big){
  var cr = crop(c.crop) || CROPS[0], own = cycImg(c);
  if(!own) return cropDot(cr, big);
  return '<span class="' + (big ? 'cbig' : 'cdot') + ' own" style="background:' + CATCOL[cr.cat] + '" aria-hidden="true">' + esc(first(L(cr.n))) + '<img src="' + own + '" alt=""></span>';
}
function cycBanner(c){
  var own = cycImg(c), cr = crop(c.crop) || CROPS[0], src = own || sized(cropImg(cr), 1280);
  return '<div class="cbanner cyb">' + (src ? '<img src="' + esc(src) + '" alt=""' + (own ? '' : ' referrerpolicy="no-referrer" onerror="this.remove()"') + '>' : '') +
    '<div class="cybtn">' + (own ? '<span class="chip g">' + I('camera').replace('<svg', '<svg width="13" height="13" stroke="currentColor"') + esc(t('ph_own')) + '</span>' : '') +
    '<label class="btn bsm cyup">' + I('camera') + esc(own ? t('ph_change') : t('ph_add')) + '<input type="file" accept="image/*" data-act="cycphoto" data-v="' + c.id + '" hidden></label>' +
    (own ? '<button class="btn bsm cyrm" data-act="cycphotodel" data-v="' + c.id + '" aria-label="' + esc(t('ph_remove')) + '">' + I('trash') + '</button>' : '') + '</div></div>';
}

/* ---------- पीक रक्षक: weather numbers for the next hours/days ---------- */
var PR_LS = 'pr';
function wxHours(){
  var h = S.wx && S.wx.hourly; if(!h || !h.time) return [];
  var now = Date.now() - 3600000, out = [];
  for(var i = 0; i < h.time.length; i++){
    var tm = new Date(h.time[i]).getTime(); if(tm < now) continue;
    out.push({t: new Date(tm), T: h.temperature_2m[i], rh: h.relative_humidity_2m[i], dp: h.dew_point_2m ? h.dew_point_2m[i] : null, p: h.precipitation[i] || 0, pp: h.precipitation_probability ? (h.precipitation_probability[i] || 0) : 0,
      ws: h.wind_speed_10m[i], wg: h.wind_gusts_10m ? h.wind_gusts_10m[i] : null, code: h.weather_code[i]});
  }
  return out;
}
function prMetrics(hs){
  var m = {hours: hs.length, wet: 0, humid: 0, warmHumid: 0, rain: 0, rainHours: 0, maxPP: 0, maxT: -99, minT: 99, maxGust: 0, storm: 0, hail: 0, heat: 0, cold: 0};
  hs.forEach(function(x){
    var wet = x.rh >= 90 || (x.dp != null && x.T - x.dp <= 2);
    if(wet) m.wet++; if(x.rh >= 85) m.humid++; if(x.rh >= 85 && x.T >= 15 && x.T <= 30) m.warmHumid++;
    m.rain += x.p; if(x.p >= 0.5) m.rainHours++; m.maxPP = Math.max(m.maxPP, x.pp);
    m.maxT = Math.max(m.maxT, x.T); m.minT = Math.min(m.minT, x.T); if(x.wg != null) m.maxGust = Math.max(m.maxGust, x.wg);
    if(x.code >= 95) m.storm++; if(x.code === 96 || x.code === 99) m.hail++; if(x.T >= 35) m.heat++; if(x.T <= 10) m.cold++;
  });
  m.rain = Math.round(m.rain * 10) / 10;
  return m;
}
/* Good spraying hours: daylight, no rain now or in the next 4 h, light wind (3–15 km/h), not too hot. */
function sprayWindows(hs){
  var slots = hs.slice(0, 48).map(function(x, i){
    var hr = x.t.getHours(), next = hs.slice(i, i + 5);
    var dry = next.every(function(y){ return y.p < 0.2 && y.pp < 50; });
    var ok = hr >= 6 && hr <= 18 && dry && x.ws >= 3 && x.ws <= 15 && (x.wg == null || x.wg < 25) && x.T <= 32;
    var why = !dry ? 'rain' : (x.ws > 15 || (x.wg != null && x.wg >= 25) ? 'wind' : (x.ws < 3 ? 'calm' : (x.T > 32 ? 'hot' : (hr < 6 || hr > 18 ? 'night' : ''))));
    return {t: x.t, ok: ok, why: why};
  });
  var wins = [], cur = null;
  slots.forEach(function(s){ if(s.ok){ if(!cur){ cur = {from: s.t, to: s.t, n: 0}; wins.push(cur); } cur.to = s.t; cur.n++; } else cur = null; });
  return {slots: slots, wins: wins.filter(function(w){ return w.n >= 2; })};
}
/* Weather alerts — IMD terms: heavy rain ≥ 64.5 mm/day, very heavy ≥ 115.6 mm/day. */
function prAlerts(){
  var d = S.wx && S.wx.daily; if(!d || !d.time) return [];
  var out = [], hs = wxHours();
  d.time.forEach(function(day, i){
    var dt = new Date(day + 'T00:00:00'), code = d.weather_code[i], rain = d.precipitation_sum[i] || 0;
    if(diffDays(dt, today0()) < 0) return;
    if(code === 96 || code === 99) out.push({k: 'hail', d: dt, sev: 3});
    else if(code === 95) out.push({k: 'storm', d: dt, sev: 2});
    if(rain >= 115.6) out.push({k: 'vheavy', d: dt, v: rain, sev: 3}); else if(rain >= 64.5) out.push({k: 'heavy', d: dt, v: rain, sev: 2});
    if(d.temperature_2m_max[i] >= 40) out.push({k: 'heat', d: dt, v: d.temperature_2m_max[i], sev: 2});
    if(d.temperature_2m_min[i] <= 8) out.push({k: 'cold', d: dt, v: d.temperature_2m_min[i], sev: 2});
  });
  var gust = 0, gd = null; hs.forEach(function(x){ if(x.wg != null && x.wg > gust){ gust = x.wg; gd = x.t; } });
  if(gust >= 50) out.push({k: 'wind', d: gd, v: Math.round(gust), sev: 2});
  out.sort(function(a, b){ return a.d - b.d || b.sev - a.sev; });
  var seen = {}; out = out.filter(function(a){ if(seen[a.k]) return false; seen[a.k] = 1; return true; });
  return out.slice(0, 6);
}
function prDaily(){
  var d = S.wx && S.wx.daily; if(!d || !d.time) return [];
  return d.time.map(function(day, i){ return {date: day, tmax: d.temperature_2m_max[i], tmin: d.temperature_2m_min[i], rain_mm: d.precipitation_sum[i], rain_prob: d.precipitation_probability_max[i], wind_max: d.wind_speed_10m_max[i], et0: d.et0_fao_evapotranspiration ? d.et0_fao_evapotranspiration[i] : null, code: d.weather_code[i]}; });
}
function prKey(c){ return c.id + '|' + isoDate(today0()) + '|' + S.lang; }
function prGet(c){ var all = S.prCache || {}; return all[prKey(c)]; }
function prRun(c, force){
  var k = prKey(c); S.prCache = S.prCache || {};
  if(!force && S.prCache[k] && (S.prCache[k].busy || S.prCache[k].data || (S.prCache[k].err && Date.now() - (S.prCache[k].at || 0) < 5 * 60000))) return;
  if(!S.sample){ return; }
  var hs = wxHours(); if(!hs.length){ if(!S.wxBusy && !S.wxErr) loadWx(false); return; }
  var x = cycInfo(c), cr = x.cr, m72 = prMetrics(hs.slice(0, 72)), m7 = prMetrics(hs);
  S.prCache[k] = {busy: true}; prPatch();
  var stage = x.day < 1 ? 'not sown yet (sowing in ' + (1 - x.day) + ' days)' : (x.done ? 'harvest finished' : (T.en['st_' + (x.cur ? x.cur.k : 'germ')] + ', day ' + x.day + ' of about ' + x.dur));
  var prompt = 'TASK: Crop-protection forecast (पीक रक्षक) for ONE plot for the next 7 days. Base every risk ONLY on the weather numbers below and the crop stage.\n' +
    'Crop: ' + cr.n.en + (c.variety ? ' (variety ' + c.variety + ')' : '') + '. Stage: ' + stage + '. Irrigation: ' + (c.irr || 'rainfed') + '. Area: ' + c.area + ' acre.\n' +
    'Next 72 h: hours with leaf wetness (RH≥90% or dew-point gap ≤2°C) = ' + m72.wet + '; hours RH≥85% at 15–30°C = ' + m72.warmHumid + '; rain = ' + m72.rain + ' mm in ' + m72.rainHours + ' h; max rain chance = ' + m72.maxPP + '%; temperature ' + m72.minT + '–' + m72.maxT + '°C; max gust = ' + m72.maxGust + ' km/h; thunderstorm hours = ' + m72.storm + ' (hail-code hours ' + m72.hail + ').\n' +
    'Next 7 days: leaf-wet hours = ' + m7.wet + '; rain = ' + m7.rain + ' mm; hours ≥35°C = ' + m7.heat + '; hours ≤10°C = ' + m7.cold + '.\n' +
    'Daily forecast (JSON): ' + JSON.stringify(prDaily()) + '\n\n' +
    'Rules: list only diseases/pests that really attack ' + cr.n.en + ' at this stage in this region, and say how the given numbers raise or lower each risk (quote the numbers). Max 4 risks, highest first. If weather is not favourable, say risk is low — do not alarm. ' +
    'Organic/biological option first. For chemicals give only the active ingredient and the label dose per litre (or per 15-litre pump) that is approved (CIB&RC label) for this crop and problem; if unsure write that the farmer should check the label or ask the agriculture officer. Add the pre-harvest waiting days when the crop is near harvest. ' +
    'Water: use rain and ET0 to say whether to irrigate in the next 3 days (for ' + (c.irr || 'rainfed') + ').\n' +
    'Write for a farmer in VERY SIMPLE words: short sentences, no jargon, each field at most about 20 words. "watch" must describe exactly what the farmer will see on the leaves/plant. ' +
    'For "id" use one of these known ids when the risk matches: ' + cr.p.concat(cr.ds).join(', ') + ' — otherwise leave it empty.\n' +
    'Reply with ONLY JSON: {"summary":"<one short line>","risks":[{"id":"","name":"","kind":"disease|pest|weather|nutrient","level":"high|medium|low","why":"","watch":"<what to look for in the field>","organic":"","chemical":"","when":""}],"today":["<2-4 short actions for today/tomorrow>"],"water":"","harvest":"<only if within 20 days of harvest, else empty>"}\n' +
    'Keep JSON keys and the fixed values (disease, pest, weather, nutrient, high, medium, low) in English; write all other values in the answer language.';
  S.sample.json(prompt, {system: sysPrompt('Reply with JSON only.'), task: 'json'}).then(function(d){
    S.prCache[k] = {data: d && Array.isArray(d.risks) ? d : {risks: [], today: [], summary: ''}, at: Date.now(), m72: m72};
    prStore(); prPatch();
  }).catch(function(e){ S.prCache[k] = {err: aiMsg(e), at: Date.now()}; prPatch(); });
}
function prStore(){ var keep = {}, today = isoDate(today0()); Object.keys(S.prCache || {}).forEach(function(k){ var v = S.prCache[k]; if(v && v.data && k.indexOf('|' + today + '|') > 0) keep[k] = v; }); lsSet(PR_LS, keep); }
function prPatch(){ var v = route().v; if(v === 'rakshak'){ var b = $('#prbody'); if(b){ b.innerHTML = prBody(); return; } } if(v === 'home'){ var hc = $('#prhome'); if(hc){ hc.outerHTML = prHomeCard(); } } }
var PRLEV = {high: ['r', 'pr_high'], medium: ['s', 'pr_med'], low: ['g', 'pr_low']};
function prLevel(lv){ var l = PRLEV[lv] || PRLEV.low; return '<span class="chip ' + l[0] + ' prlv">' + esc(t(l[1])) + '</span>'; }
function hhmm(d){ return String(d.getHours()).padStart(2, '0') + ':00'; }
function dayWord(d){ var dd = diffDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), today0()); return dd === 0 ? t('today') : (dd === 1 ? t('tomorrow') : fmtDs(d)); }
function alertText(a){ return t('pra_' + a.k, {v: a.v != null ? num(Math.round(a.v), 0) : '', d: dayWord(a.d)}); }
function prHomeCard(){
  var hs = wxHours(), active = S.cycles.filter(function(c){ return !cycInfo(c).done; });
  var h = '<a class="card prhome" id="prhome" href="#rakshak"><div class="prh"><span class="ico g">' + I('shield') + '</span><div style="flex:1;min-width:0"><b>' + esc(t('pr_h')) + '</b><small>' + esc(t('pr_home_d')) + '</small></div>' + I('chev', 'chev') + '</div>';
  if(!hs.length) return h + '<div class="prline mu">' + esc(S.wxErr || t('wx_loading')) + '</div></a>';
  var al = prAlerts().filter(function(a){ return diffDays(new Date(a.d.getFullYear(), a.d.getMonth(), a.d.getDate()), today0()) <= 3; });
  if(al.length) h += '<div class="pralert sev' + al[0].sev + '">' + I('alert') + '<span>' + esc(alertText(al[0])) + '</span></div>';
  var sw = sprayWindows(hs), w0 = sw.wins[0];
  h += '<div class="prline">' + I('drop') + '<span>' + (w0 ? esc(t('pr_spray_ok', {d: dayWord(w0.from), a: hhmm(w0.from), b: hhmm(new Date(w0.to.getTime() + 3600000))})) : esc(t('pr_spray_none'))) + '</span></div>';
  if(!active.length) return h + '<div class="prline mu">' + esc(t('pr_nocrops')) + '</div></a>';
  if(S.sample) setTimeout(function(){ active.slice(0, 4).forEach(function(c){ prRun(c, false); }); }, 600);
  h += '<div class="prcrops">' + active.slice(0, 4).map(function(c){ var r = prGet(c), cr = crop(c.crop) || CROPS[0], top = r && r.data && r.data.risks && r.data.risks[0];
    return '<span class="prc">' + cycDot(c) + '<span class="prcn">' + esc(L(cr.n)) + '</span>' + (top ? prLevel(top.level) : (r && r.busy ? '<span class="spin sm"></span>' : '<span class="chip">' + esc(t('pr_check')) + '</span>')) + '</span>'; }).join('') + '</div></a>';
  return h;
}
function vRakshak(){
  if(S.wx && S.wx.hourly && !S.wx.hourly.dew_point_2m && !S.wxBusy) setTimeout(function(){ loadWx(true); }, 0);
  var h = '<div class="ph"><h1>' + esc(t('pr_h')) + '</h1><p>' + esc(t('pr_d')) + '</p></div>';
  return h + '<div id="prbody">' + prBody() + '</div>';
}
function prReport(cid){
  var c = cyc(cid); if(!c) return null; var r = prGet(c); if(!r || !r.data) return null; var d = r.data, cr = crop(c.crop) || CROPS[0];
  var md = '## ' + L(cr.n) + (c.plot ? ' · ' + c.plot : '') + '\n' + (d.summary ? d.summary + '\n' : '');
  (d.risks || []).forEach(function(k){ md += '\n### ' + k.name + ' — ' + t((PRLEV[k.level] || PRLEV.low)[1]) + '\n' + (k.why ? '- **' + t('pr_why') + ':** ' + k.why + '\n' : '') + (k.watch ? '- **' + t('pr_watch') + ':** ' + k.watch + '\n' : '') + (k.organic ? '- **' + t('pr_org') + ':** ' + k.organic + '\n' : '') + (k.chemical ? '- **' + t('pr_chem') + ':** ' + k.chemical + '\n' : '') + (k.when ? '- **' + t('pr_when') + ':** ' + k.when + '\n' : ''); });
  if(d.today && d.today.length) md += '\n### ' + t('pr_today') + '\n' + d.today.map(function(s){ return '- ' + s; }).join('\n') + '\n';
  if(d.water) md += '\n**' + t('pr_water') + ':** ' + d.water + '\n';
  return {title: t('pr_h') + ' — ' + L(cr.n) + ' · ' + fmtD(today0()), md: md};
}
/* 72-hour crop-loss claim helper (PMFBY: report localised loss within 72 hours) */
function claimKit(){
  var opts = S.cycles.map(function(c){ var cr = crop(c.crop) || CROPS[0]; return '<option value="' + c.id + '">' + esc(L(cr.n) + (c.plot ? ' · ' + c.plot : '')) + '</option>'; }).join('');
  modal('<div class="modal" role="dialog" aria-modal="true"><div class="box" style="max-width:560px"><div class="mhead" style="padding:0 0 10px"><h2>' + esc(t('ck_h')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="note r" style="margin-bottom:12px">' + I('alert') + esc(t('ck_72')) + '</div>' +
    '<ol class="ckl"><li>' + esc(t('ck_s1')) + '</li><li>' + esc(t('ck_s2')) + '</li><li>' + esc(t('ck_s3')) + '</li><li>' + esc(t('ck_s4')) + '</li></ol>' +
    '<div class="row wrap" style="margin:12px 0"><a class="btn bp" href="tel:14447">' + I('phone') + esc(t('ck_call')) + ' 14447</a><a class="btn bs" href="https://pmfby.gov.in" target="_blank" rel="noopener">pmfby.gov.in' + I('ext') + '</a></div>' +
    '<h3 style="font-size:16px;margin:14px 0 8px">' + esc(t('ck_note_h')) + '</h3>' +
    '<div class="formgrid">' + (opts ? '<label class="f full">' + esc(t('f_crop')) + '<select class="inp" id="ckcrop">' + opts + '</select></label>' : '') +
    '<label class="f">' + esc(t('ck_date')) + '<input class="inp" type="date" id="ckdate" value="' + isoDate(today0()) + '"></label>' +
    '<label class="f">' + esc(t('ck_cause')) + '<select class="inp" id="ckcause">' + ['hail', 'heavy', 'flood', 'wind', 'animal', 'pest', 'other'].map(function(k){ return '<option value="' + k + '">' + esc(t('ckc_' + k)) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('ck_survey')) + '<input class="inp" id="cksurvey" maxlength="40"></label><label class="f">' + esc(t('ck_loss')) + '<input class="inp" type="number" id="ckloss" min="0" max="100" step="5"></label></div>' +
    '<div class="acts"><button class="btn bs" data-act="close">' + esc(t('close')) + '</button><button class="btn bp" data-act="ckshare">' + I('share') + esc(t('ck_share')) + '</button></div></div></div>');
}
function claimText(){
  var c = cyc(($('#ckcrop') || {}).value), cr = c && crop(c.crop);
  var lines = [t('ck_msg_h'), t('ck_name') + ': ______', t('ck_place') + ': ' + place(), t('ck_survey') + ': ' + (($('#cksurvey') || {}).value || '______'),
    t('f_crop') + ': ' + (cr ? cr.n.en + ' / ' + L(cr.n) : '______') + (c ? ' · ' + num(c.area) + ' ' + t('acres_short') : ''), t('ck_cause') + ': ' + t('ckc_' + (($('#ckcause') || {}).value || 'other')),
    t('ck_date') + ': ' + (($('#ckdate') || {}).value || ''), t('ck_loss') + ': ' + ((($('#ckloss') || {}).value) || '__') + '%', t('ck_msg_f')];
  return lines.join('\n');
}

/* ---------- योजना (government schemes) ---------- */
var Y_NEEDS = ['income', 'insurance', 'credit', 'drip', 'well', 'solar', 'machine', 'horti', 'poly', 'dairy', 'storage', 'organic', 'seed', 'women'];
function yDefault(){
  var crops = []; S.cycles.forEach(function(c){ var cr = crop(c.crop); if(cr && crops.indexOf(cr.n.en) < 0) crops.push(cr.n.en); });
  var area = S.cycles.reduce(function(a, c){ return a + (+c.area || 0); }, 0);
  return {state: S.state, district: (S.gps && S.gps.en && S.gps.en.district) || S.district || '', taluka: (S.gps && S.gps.en && S.gps.en.taluka) || '', land: area ? Math.round(area * 100) / 100 : '', own: 'own', cat: 'general', gender: 'male', age: '', crops: crops, irr: 'well', fid: 'dk', kcc: 'no', bank: 'yes', income: 'l1', need: ['income', 'insurance'], stock: '', already: ''};
}
function vYojana(){
  var p = S.yprof || yDefault(), r = S.yres;
  var h = '<div class="ph"><h1>' + esc(t('y_h')) + '</h1><p>' + esc(t('y_d')) + '</p></div>' + yUpdates();
  if(S.yBusy) return h + '<div class="card pad"><div class="load"><span class="spin"></span>' + esc(t('y_busy')) + '</div><p class="sm mu" style="margin:8px 0 0">' + esc(t('y_busy_d')) + '</p></div>';
  if(r && !S.yEdit) return h + yResults(r);
  if(S.yErr) h += '<div class="note r" style="margin-bottom:12px">' + I('alert') + esc(S.yErr) + '</div>';
  var sel = function(id, list, cur, pre){ return '<select class="inp" id="' + id + '">' + list.map(function(k){ return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + esc(t((pre || 'y_') + k)) + '</option>'; }).join('') + '</select>'; };
  var ds = DISTRICTS[p.state];
  h += '<form class="card pad yform" id="yform"><h2 style="font-size:18px">' + esc(t('y_form_h')) + '</h2><p class="sm mu" style="margin:2px 0 12px">' + esc(t('y_form_d')) + '</p><div class="formgrid">' +
    '<label class="f">' + esc(t('state')) + '<select class="inp" id="ystate" data-act="ystate">' + STATES.map(function(s){ return '<option' + (s === p.state ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f">' + esc(t('district')) + (ds ? '<select class="inp" id="ydist"><option value=""></option>' + ds.map(function(d){ return '<option' + (d === p.district ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') + '</select>' : '<input class="inp" id="ydist" value="' + esc(p.district) + '">') + '</label>' +
    '<label class="f">' + esc(t('y_taluka')) + '<input class="inp" id="ytaluka" value="' + esc(p.taluka || '') + '" maxlength="40"></label>' +
    '<label class="f">' + esc(t('y_land')) + '<input class="inp" type="number" id="yland" min="0" step="0.05" value="' + esc(p.land) + '"></label>' +
    '<label class="f">' + esc(t('y_own')) + sel('yown', ['own', 'lease', 'share', 'landless'], p.own, 'yo_') + '</label>' +
    '<label class="f">' + esc(t('y_cat')) + sel('ycat', ['general', 'obc', 'sc', 'st', 'nt', 'ews'], p.cat, 'yc_') + '</label>' +
    '<label class="f">' + esc(t('y_gender')) + sel('ygender', ['male', 'female', 'other'], p.gender, 'yg_') + '</label>' +
    '<label class="f">' + esc(t('y_age')) + '<input class="inp" type="number" id="yage" min="14" max="100" value="' + esc(p.age) + '"></label>' +
    '<label class="f">' + esc(t('y_irr')) + sel('yirr', ['well', 'bore', 'canal', 'pond', 'river', 'rainfed'], p.irr, 'yi_') + '</label>' +
    '<label class="f">' + esc(t('y_income')) + sel('yincome', ['l1', 'l2', 'l3', 'l4'], p.income, 'yn_') + '</label>' +
    '<label class="f">' + esc(t('y_fid')) + sel('yfid', ['yes', 'no', 'dk'], p.fid, 'yy_') + '</label>' +
    '<label class="f">' + esc(t('y_kcc')) + sel('ykcc', ['yes', 'no'], p.kcc, 'yy_') + '</label>' +
    '<label class="f">' + esc(t('y_bank')) + sel('ybank', ['yes', 'no', 'dk'], p.bank, 'yy_') + '</label>' +
    '<label class="f full">' + esc(t('y_crops')) + '<input class="inp" id="ycrops" value="' + esc((p.crops || []).join(', ')) + '" placeholder="' + esc(t('y_crops_ph')) + '"></label>' +
    '<label class="f full">' + esc(t('y_stock')) + '<input class="inp" id="ystock" value="' + esc(p.stock || '') + '" placeholder="' + esc(t('y_stock_ph')) + '"></label>' +
    '<div class="f full">' + esc(t('y_need')) + '<div class="chips ychips" role="group">' + Y_NEEDS.map(function(k){ return '<button type="button" data-act="yneed" data-v="' + k + '" aria-pressed="' + ((p.need || []).indexOf(k) > -1) + '">' + esc(t('yd_' + k)) + '</button>'; }).join('') + '</div></div>' +
    '<label class="f full">' + esc(t('y_already')) + '<input class="inp" id="yalready" value="' + esc(p.already || '') + '" placeholder="' + esc(t('y_already_ph')) + '"></label>' +
    '</div><div class="acts" style="margin-top:14px">' + (r ? '<button type="button" class="btn bs" data-act="ycancel">' + esc(t('cancel')) + '</button>' : '') + '<button type="button" class="btn bp" data-act="yfind">' + I('search') + esc(t('y_find')) + '</button></div>' +
    '<p class="xs mu2" style="margin:10px 0 0">' + esc(t('y_privacy')) + '</p></form>';
  return h;
}
function yRead(){
  var v = function(id){ var e = $('#' + id); return e ? String(e.value || '').trim() : ''; };
  var p = S.yprof || yDefault();
  return {state: v('ystate') || p.state, district: v('ydist'), taluka: v('ytaluka'), land: v('yland'), own: v('yown'), cat: v('ycat'), gender: v('ygender'), age: v('yage'), irr: v('yirr'), income: v('yincome'),
    fid: v('yfid'), kcc: v('ykcc'), bank: v('ybank'), crops: v('ycrops').split(/[,،]/).map(function(s){ return s.trim(); }).filter(Boolean), stock: v('ystock'), already: v('yalready'), need: (p.need || []).slice()};
}
function yFind(){
  var p = yRead(); S.yprof = p; lsSet('yprof', p);
  var prof = Object.assign({}, p, {own: T.en['yo_' + p.own], cat: T.en['yc_' + p.cat], gender: T.en['yg_' + p.gender], irr: T.en['yi_' + p.irr], income: T.en['yn_' + p.income],
    fid: T.en['yy_' + p.fid], kcc: T.en['yy_' + p.kcc], bank: T.en['yy_' + p.bank], need: p.need.map(function(k){ return T.en['yd_' + k]; })});
  S.yBusy = true; S.yErr = null; S.yEdit = false; render();
  fetch('/api/schemes', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({profile: prof, lang: S.lang})})
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j; }); })
    .then(function(j){ j.lang = S.lang; S.yres = j; lsSet('yres', j); S.yOpen = 0; saveReport('yojana'); })
    .catch(function(e){ S.yErr = e.message || t('err'); })
    .then(function(){ S.yBusy = false; if(route().v === 'yojana') render(); });
}
var YMATCH = {eligible: ['g', 'ym_eligible'], likely: ['s', 'ym_likely'], check: ['', 'ym_check']};
function yResults(r){
  var h = '<div class="card pad ytop">' + (r.grounded ? '<div class="note g">' + I('check') + '<span>' + esc(t('y_live', {d: fmtD(new Date(r.date + 'T00:00:00'))})) + '</span></div>' : '<div class="note r">' + I('alert') + '<span>' + esc(t(r.note === 'search_off' ? 'y_nolive_key' : 'y_nolive')) + '</span></div>') +
    '<div class="row wrap" style="margin-top:12px"><button class="btn bs bsm" data-act="yedit">' + I('edit') + esc(t('y_edit')) + '</button><button class="btn bs bsm" data-act="yfind2">' + I('refresh') + esc(t('news_refresh')) + '</button>' + dlBtn('yojana') + '</div></div>';
  if(r.lang && r.lang !== S.lang) h += '<div class="note" style="margin:10px 0">' + I('info') + esc(t('y_lang')) + ' <button class="btn bs bsm" data-act="yfind2">' + esc(t('news_refresh')) + '</button></div>';
  if(!r.schemes || !r.schemes.length) return h + '<div class="card pad" style="margin-top:12px"><p class="mu" style="margin:0">' + esc(t('y_none')) + '</p></div>';
  h += '<div class="ylist">' + r.schemes.map(function(s, i){ var mm = YMATCH[s.match] || YMATCH.check, open = S.yOpen === i;
    var rows = [['y_time', s.time], ['y_cost', s.cost], ['y_deadline', s.deadline]].filter(function(x){ return x[1]; });
    return '<div class="card yscheme' + (open ? ' open' : '') + '"><button type="button" class="yhead" data-act="yopen" data-v="' + i + '" aria-expanded="' + open + '"><span class="ynum">' + (i + 1) + '</span><span class="ytt"><b>' + esc(s.name) + '</b>' + (s.name_en && s.name_en !== s.name ? '<small>' + esc(s.name_en) + '</small>' : '') +
      '<span class="ychips2"><span class="chip ' + mm[0] + '">' + esc(t(mm[1])) + '</span><span class="chip">' + esc(t(s.level === 'state' ? 'y_state' : 'y_central')) + '</span>' + (s.status !== 'unknown' ? '<span class="chip ' + (s.status === 'closed' ? 'r' : '') + '">' + esc(t('ys_' + s.status)) + '</span>' : '') + '</span></span>' + I('chev', 'chev') + '</button>' +
      (s.amount || s.benefit ? '<div class="yamt">' + I('rupee') + '<span>' + esc(s.amount || s.benefit) + '</span></div>' : '') +
      (open ? '<div class="ybody">' + (s.why ? '<p class="ywhy"><b>' + esc(t('y_why')) + ':</b> ' + esc(s.why) + '</p>' : '') + (s.benefit && s.amount ? '<p><b>' + esc(t('y_benefit')) + ':</b> ' + esc(s.benefit) + '</p>' : '') +
        (rows.length ? '<div class="ygrid">' + rows.map(function(x){ return '<div><small>' + esc(t(x[0])) + '</small><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' : '') +
        (s.documents.length ? '<h4>' + I('file') + esc(t('y_docs')) + '</h4><ul class="ydocs">' + s.documents.map(function(d, j){ var k = 'yd|' + (s.name_en || s.name) + '|' + j; return '<li><label><input type="checkbox" data-act="ydoc" data-v="' + esc(k) + '"' + ((S.ydocs || {})[k] ? ' checked' : '') + '><span>' + esc(d) + '</span></label></li>'; }).join('') + '</ul>' : '') +
        (s.steps.length ? '<h4>' + I('list') + esc(t('y_steps')) + '</h4><ol class="ysteps">' + s.steps.map(function(d){ return '<li>' + esc(d) + '</li>'; }).join('') + '</ol>' : '') +
        (s.apply_where ? '<p><b>' + esc(t('y_where')) + ':</b> ' + esc(s.apply_where) + '</p>' : '') + (s.helpline ? '<p><b>' + esc(t('y_help')) + ':</b> ' + esc(s.helpline) + '</p>' : '') + (s.notes ? '<p class="sm mu">' + esc(s.notes) + '</p>' : '') +
        '<div class="row wrap" style="margin-top:10px">' + (s.apply_link ? '<a class="btn bp bsm" href="' + esc(s.apply_link) + '" target="_blank" rel="noopener">' + esc(t('y_apply')) + I('ext') + '</a>' : '') + '<a class="btn bs bsm" href="https://www.myscheme.gov.in/search?keyword=' + encodeURIComponent(s.name_en || s.name) + '" target="_blank" rel="noopener">myScheme' + I('ext') + '</a></div></div>' : '') + '</div>'; }).join('') + '</div>';
  if(r.common_documents && r.common_documents.length) h += '<div class="card pad" style="margin-top:12px"><h2 style="font-size:18px">' + I('file') + esc(t('y_common')) + '</h2><ul class="ydocs plain">' + r.common_documents.map(function(d){ return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>';
  if(r.tips && r.tips.length) h += '<div class="card pad" style="margin-top:12px"><h2 style="font-size:18px">' + I('info') + esc(t('y_tips')) + '</h2><ul class="ydocs plain">' + r.tips.map(function(d){ return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>';
  if(r.sources && r.sources.length) h += '<div class="card pad ysrc" style="margin-top:12px"><h2 style="font-size:16px">' + esc(t('y_sources')) + '</h2>' + r.sources.map(function(s){ return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + I('ext') + esc(s.title || s.url) + '</a>'; }).join('') + '</div>';
  h += '<p class="xs mu2" style="margin-top:12px">' + esc(t('y_disclaimer')) + '</p>';
  return h;
}
function yReport(){
  var r = S.yres; if(!r || !r.schemes || !r.schemes.length) return null;
  var md = '';
  r.schemes.forEach(function(s, i){
    md += '## ' + (i + 1) + '. ' + s.name + (s.name_en && s.name_en !== s.name ? ' (' + s.name_en + ')' : '') + '\n' + t((YMATCH[s.match] || YMATCH.check)[1]) + ' · ' + t(s.level === 'state' ? 'y_state' : 'y_central') + '\n\n';
    if(s.why) md += '**' + t('y_why') + ':** ' + s.why + '\n\n';
    if(s.benefit) md += '**' + t('y_benefit') + ':** ' + s.benefit + (s.amount ? ' — ' + s.amount : '') + '\n\n';
    [['y_time', s.time], ['y_cost', s.cost], ['y_deadline', s.deadline], ['y_where', s.apply_where], ['y_help', s.helpline]].forEach(function(x){ if(x[1]) md += '- **' + t(x[0]) + ':** ' + x[1] + '\n'; });
    if(s.documents.length) md += '\n**' + t('y_docs') + ':**\n' + s.documents.map(function(d){ return '- ' + d; }).join('\n') + '\n';
    if(s.steps.length) md += '\n**' + t('y_steps') + ':**\n' + s.steps.map(function(d, j){ return (j + 1) + '. ' + d; }).join('\n') + '\n';
    if(s.apply_link) md += '\n' + t('y_apply') + ': ' + s.apply_link + '\n';
    md += '\n';
  });
  if(r.sources && r.sources.length) md += '\n### ' + t('y_sources') + '\n' + r.sources.map(function(s){ return '- ' + (s.title || '') + ' ' + s.url; }).join('\n') + '\n';
  return {title: t('y_h') + ' — ' + fmtD(new Date(r.date + 'T00:00:00')), md: md};
}


/* ---------- v7: reliability + polish ---------- */
/* saved data is checked once at start, so a damaged phone storage can never break a page */
(function sanitize(){
  function arr(v){ return Array.isArray(v) ? v : []; }
  function obj(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  function numOk(v){ return typeof v === 'number' && isFinite(v); }
  if(['mr', 'hi', 'en'].indexOf(S.lang) < 0) S.lang = 'mr';
  if(typeof S.state !== 'string' || !S.state) S.state = 'Maharashtra';
  if(typeof S.district !== 'string') S.district = '';
  var before = JSON.stringify(S.cycles);
  S.cycles = arr(S.cycles).filter(function(c){ return obj(c) && typeof c.id === 'string' && c.id && typeof c.crop === 'string' && crop(c.crop); }).map(function(c){
    c.exp = arr(c.exp).filter(obj); c.inc = arr(c.inc).filter(obj); c.log = arr(c.log).filter(obj);
    if(!numOk(+c.area) || +c.area <= 0) c.area = 1; else c.area = +c.area;
    if(typeof c.sow !== 'string' || isNaN(new Date(c.sow).getTime())) c.sow = isoDate(today0());
    if(c.plan != null){ if(!obj(c.plan)) delete c.plan; else { c.plan.items = arr(c.plan.items).filter(function(it){ return obj(it) && typeof it.id === 'string' && typeof it.day === 'number' && isFinite(it.day) && typeof it.title === 'string' && it.title; }); } }
    if(c.stg != null && !obj(c.stg)) delete c.stg;
    if(c.hv != null && !(Array.isArray(c.hv) && c.hv.length === 2)) delete c.hv;
    return c; });
  if(JSON.stringify(S.cycles) !== before) lsSet('cycles', S.cycles);
  S.reports = arr(S.reports).filter(function(r){ return obj(r) && r.id; });
  S.soils = arr(S.soils).filter(obj);
  var g = obj(S.gps); S.gps = g && numOk(g.lat) && numOk(g.lon) && Math.abs(g.lat) <= 90 && Math.abs(g.lon) <= 180 ? g : null;
  if(S.gps){ S.gps.en = obj(S.gps.en) || {}; S.gps.local = obj(S.gps.local) || {}; }
  var w = obj(S.wx); S.wx = w && obj(w.current) && obj(w.hourly) && obj(w.daily) ? w : null;
  S.mk = obj(S.mk) && S.mk.district ? S.mk : null;
  ['cimg', 'photoPick', 'prCache', 'ydocs', 'soilForm'].forEach(function(k){ S[k] = obj(S[k]) || {}; });
  S.yprof = obj(S.yprof); S.yres = obj(S.yres);
  if(S.yres && !Array.isArray(S.yres.schemes)) S.yres = null;
  if([0, 25, 50, 100, 200].indexOf(S.mkR) < 0) S.mkR = 100;
  S.bigText = S.bigText === true; S.mkNear = S.mkNear === true;
  if(typeof S.mkCrop !== 'string') S.mkCrop = '';
})();
var lastRouteKey = '', navScroll = {}, navStack = [location.hash.slice(1) || 'home'], installEvt = null, lastClickAt = 0;
function reduceMotion(){ try{ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
function isStandalone(){ try{ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }catch(e){ return false; } }
function loadBox(text, n){ var b = ''; for(var i = 0; i < (n || 3); i++) b += '<i style="width:' + [92, 78, 64, 85, 70][i % 5] + '%"></i>'; return '<div class="load"><span class="spin"></span>' + esc(text) + '</div><div class="skel" aria-hidden="true">' + b + '</div>'; }
function crashView(err, v){
  try{ console.error('[Ankurit] view "' + v + '" failed:', err); lsSet('lastErr', {v: v, m: String(err && err.message || err).slice(0, 300), at: Date.now()}); }catch(e){}
  return '<div class="card pad crash"><span class="ico r">' + I('alert') + '</span><h2>' + esc(t('v7_oops_h')) + '</h2><p class="mu">' + esc(t('v7_oops_d')) + '</p><div class="row wrap" style="justify-content:center"><button class="btn bp" data-act="crashretry">' + I('refresh') + esc(t('v7_retry')) + '</button><a class="btn bs" href="#home">' + I('home') + esc(t('nav_home')) + '</a></div></div>';
}
/* images fade in once loaded; broken images never leave an invisible hole */
function imgSettle(root){ var im = (root || document).querySelectorAll('img:not(.ld)'); for(var i = 0; i < im.length; i++){ if(im[i].complete) im[i].classList.add('ld'); } }
document.addEventListener('load', function(e){ var el = e.target; if(el && el.tagName === 'IMG') el.classList.add('ld'); }, true);
document.addEventListener('error', function(e){ var el = e.target; if(el && el.tagName === 'IMG') el.classList.add('ld', 'bad'); }, true);

/* network: timeout + one retry for GET /api, marks answers that came from the offline copy */
(function(){
  if(!window.fetch || window.fetch.__ank) return;
  var raw = window.fetch.bind(window);
  var LIMIT = {mandi: 70000, schemes: 100000, news: 30000, article: 20000, weather: 25000, revgeo: 15000, geosearch: 15000, cropimgs: 20000};
  function one(input, init, ms){
    var ctrl = window.AbortController ? new AbortController() : null, outer = init && init.signal, timer = null, opts = {};
    for(var k in (init || {})) opts[k] = init[k];
    if(ctrl){ opts.signal = ctrl.signal; if(outer){ if(outer.aborted) ctrl.abort(); else outer.addEventListener('abort', function(){ ctrl.abort(); }); } timer = setTimeout(function(){ ctrl.timedOut = true; ctrl.abort(); }, ms); }
    return raw(input, opts).then(function(r){ clearTimeout(timer); return r; }, function(e){ clearTimeout(timer); if(ctrl && ctrl.timedOut && !(outer && outer.aborted)){ var te = new Error(t('v7_slow')); te.name = 'TimeoutError'; throw te; } throw e; });
  }
  var f = function(input, init){
    var url = typeof input === 'string' ? input : (input && input.url) || '', m = url.match(/\/api\/([a-z-]+)/), method = String((init && init.method) || 'GET').toUpperCase();
    if(!m || method !== 'GET' || m[1] === 'ai') return raw(input, init);
    var ms = LIMIT[m[1]] || 25000;
    return one(input, init, ms).then(function(r){
      if(r.status >= 502 && r.status <= 504) return new Promise(function(res){ setTimeout(res, 900); }).then(function(){ return one(input, init, ms); });
      return r;
    }, function(e){
      if(e && (e.name === 'AbortError' || e.name === 'TimeoutError')) throw e;
      return new Promise(function(res){ setTimeout(res, 900); }).then(function(){ return one(input, init, ms); });
    }).then(function(r){
      var st = r.headers && r.headers.get('X-Ankurit-Stale');
      if(st){ S.staleAt = Math.max(S.staleAt || 0, +st || Date.now()); S.staleSeen = true; offBanner(); }
      else if(r.ok && S.staleSeen && navigator.onLine !== false){ S.staleSeen = false; offBanner(); }
      return r;
    });
  };
  f.__ank = true; window.fetch = f;
})();

/* offline / saved-data banner */
function offBanner(){
  var off = navigator.onLine === false, show = (off || S.staleSeen) && !S.offHide, b = document.getElementById('offbar');
  if(!show){ if(b) b.remove(); document.body.classList.remove('isoff'); return; }
  var txt = off ? t('v7_off') : t('v7_saved', {t: ago(S.staleAt || Date.now())});
  if(!b){ b = document.createElement('div'); b.id = 'offbar'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = '<span class="dot"></span><span>' + esc(txt) + '</span><button type="button" data-act="offx" aria-label="' + esc(t('close')) + '">' + I('x') + '</button>';
  document.body.classList.add('isoff');
}
window.addEventListener('offline', function(){ S.offHide = false; offBanner(); });
window.addEventListener('online', function(){ S.staleSeen = false; S.offHide = false; offBanner(); toast(t('v7_online')); var v = route().v; if(v === 'home' || v === 'weather' || v === 'rakshak') loadWx(true); if(v === 'market'){ var k = mkKey(); if(S.mkData[k] && S.mkData[k].err) delete S.mkData[k]; } if(v === 'news' && S.news && S.news.err) S.news = null; softRender(); });

/* errors never leave the user stuck: log, and if it followed a tap tell them gently */
document.addEventListener('click', function(){ lastClickAt = Date.now(); }, true);
function softFail(msg){ try{ console.error('[Ankurit]', msg); }catch(e){} if(Date.now() - lastClickAt < 1500) toast(t('v7_oops_t')); var sp = document.querySelectorAll('#modalwrap .spin'); if(sp.length && Date.now() - lastClickAt < 1500){ /* leave modals usable */ } }
window.addEventListener('error', function(e){ if(e && e.target && e.target !== window) return; softFail((e && e.message) || 'error'); });
window.addEventListener('unhandledrejection', function(e){ var r = e && e.reason; if(r && (r.name === 'AbortError')) return; try{ console.warn('[Ankurit] unhandled', r); }catch(x){} });

/* light touch feedback on main actions (phones only, never with reduced motion) */
document.addEventListener('click', function(e){
  if(!navigator.vibrate || reduceMotion() || !window.matchMedia || !matchMedia('(pointer: coarse)').matches) return;
  var el = e.target.closest && e.target.closest('.bp, .bnav a, .botfab, [data-act="send"], [data-act="analyze"]');
  if(el) try{ navigator.vibrate(8); }catch(x){}
}, true);

/* install as app */
window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); installEvt = e; refreshMenu(); });
window.addEventListener('appinstalled', function(){ installEvt = null; var ic = $('#instcard'); if(ic) ic.remove(); toast(t('v7_installed')); refreshMenu(); });
function doInstall(){ if(!installEvt) return; var ev = installEvt; closeModal(); ev.prompt(); (ev.userChoice || Promise.resolve({})).then(function(c){ if(c && c.outcome === 'accepted'){ installEvt = null; } else lsSet('instx', Date.now()); var ic = $('#instcard'); if(ic) ic.remove(); refreshMenu(); }); }
function instCard(){
  if(!installEvt || isStandalone() || $('#instcard')) return;
  var x = lsGet('instx', 0); if(x && Date.now() - x < 14 * 86400000) return;
  var visits = lsGet('visits', 0); if(visits < 2) return;
  var host = $('#view'); if(!host) return;
  var d = document.createElement('div'); d.id = 'instcard'; d.className = 'instcard';
  d.innerHTML = '<span class="mk">' + MARK + '</span><span class="tx"><b>' + esc(t('v7_install')) + '</b><small>' + esc(t('v7_install_d')) + '</small></span><button class="btn bp bsm" data-act="install">' + esc(t('v7_install_btn')) + '</button><button class="xbtn" data-act="installx" aria-label="' + esc(t('close')) + '">' + I('x') + '</button>';
  host.insertBefore(d, host.firstChild);
}

/* service worker: offline app + last good data */
if('serviceWorker' in navigator && location.protocol !== 'file:' && !/[?&]nosw\b/.test(location.search)){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      reg.addEventListener('updatefound', function(){ var w = reg.installing; if(!w) return; w.addEventListener('statechange', function(){ if(w.state === 'activated' && navigator.serviceWorker.controller && S.hadSW){ S.swUpdated = true; } }); });
    }).catch(function(e){ try{ console.warn('[Ankurit] offline mode unavailable', e && e.message); }catch(x){} });
    S.hadSW = !!navigator.serviceWorker.controller;
  });
}
lsSet('visits', lsGet('visits', 0) + 1);
if(!S.district && S.gps && S.gps.en && S.gps.en.district){ (function(){ var dd = matchDistrict(S.state, S.gps.en.district); if(dd){ S.district = dd; lsSet('district', dd); } })(); }


/* =====================================================================
   v7.7 — AI वेळापत्रक (crop timetable): spraying, water, fertiliser, organic inputs, weeding, scouting, harvest.
   Stored in the crop record as c.plan = {at, lang, mode, items:[{id, day (days after sowing), type, title, detail, dose, done, doneAt, note, src, logId}]}
   ===================================================================== */
ICONS.note = 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5';
ICONS.spray = 'M8 10h7v11H8zM11.5 10V6M9 6h6l2.5-2M18 7h2.5M18 10h2.5M17.5 13H20';
ICONS.sack = 'M7.5 7C7 5 9 3 12 3s5 2 4.5 4L19 19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM8 7h8M10 13h4';
ICONS.eye = 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';
ICONS.cut = 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12';
ICONS.hand = 'M7 11V5.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4.3 14a1.5 1.5 0 0 1 2.4-1.8L7 12.5';
var PLTYPE = {spray: ['spray', 'r', 'spray'], water: ['drop', 'b', 'irrigate'], fert: ['sack', 'o', 'manure'], organic: ['leaf', 'g', 'manure'], weed: ['cut', 's', 'weed'], scout: ['eye', 'g', 'scout'], harvest: ['star', 's', 'harvest'], other: ['dots', '', 'other']};
var PLTYPES = ['spray', 'water', 'fert', 'organic', 'weed', 'scout', 'harvest', 'other'];
S.planBusy = {}; S.planErr = {}; S.planF = 'all'; S.planDone = false;

function planItems(c){ var p = c && c.plan; if(!p || !Array.isArray(p.items)) return []; return p.items.filter(function(it){ return it && typeof it.day === 'number' && isFinite(it.day) && it.title; }).slice().sort(function(a, b){ return a.day - b.day || (a.type < b.type ? -1 : 1); }); }
function planDate(c, it){ return addDays(parseD(c.sow), it.day); }
function planDD(c, it){ return diffDays(planDate(c, it), today0()); }
function planBorn(c, it){ var at = it.src === 'me' ? (it.at || 0) : ((c.plan && c.plan.at) || 0); if(!at) return true; var b = new Date(at); b.setHours(0, 0, 0, 0); return planDate(c, it) >= b; }
function planPast(c, it){ return !it.done && planDD(c, it) < 0 && !planBorn(c, it); }
function planDueCount(c){ return planItems(c).filter(function(it){ return !it.done && planDD(c, it) <= 0 && planBorn(c, it); }).length; }
function planDayLbl(it){ return it.day >= 0 ? t('day_n', {n: it.day + 1}) : t('pl_before', {n: -it.day}); }
function plIcon(type, big){ var p = PLTYPE[type] || PLTYPE.other; return '<span class="plic ' + p[1] + (big ? ' big' : '') + '">' + I(p[0]) + '</span>'; }
function planPeek(c){
  var its = planItems(c).filter(function(it){ return !it.done && (planDD(c, it) >= 0 || planBorn(c, it)); }).slice(0, 3);
  if(!c.plan || !planItems(c).length) return '<div class="plpeek empty"><span class="ico g">' + I('spark') + '</span><div><b>' + esc(t('pl_cta')) + '</b><small>' + esc(t('pl_cta_d')) + '</small></div><button class="btn bp bsm" data-act="cyctab" data-v="plan">' + esc(t('pl_open')) + '</button></div>';
  return '<div class="plpeek"><div class="row" style="justify-content:space-between;align-items:center"><b class="sm">' + esc(t('pl_next')) + '</b><button class="lnk" data-act="cyctab" data-v="plan">' + esc(t('pl_all')) + ' →</button></div>' + (its.length ? its.map(function(it){ return planRow(c, it, true); }).join('') : '<p class="sm mu" style="margin:6px 0 0">' + esc(t('pl_none_next')) + '</p>') + '</div>';
}
function planWhen(c, it){ var dd = planDD(c, it); return dd === 0 ? t('today') : (dd === 1 ? t('tomorrow') : (dd < 0 ? t('pl_late', {n: -dd}) : t('in_days', {n: dd}))); }
function planRow(c, it, mini){
  var d = planDate(c, it), dd = planDD(c, it), late = !it.done && dd < 0 && planBorn(c, it);
  return '<div class="plrow' + (it.done ? ' done' : '') + (late ? ' late' : '') + (dd === 0 && !it.done ? ' today' : '') + (mini ? ' mini' : '') + '" id="pl-' + esc(it.id) + '">' +
    '<span class="pldate"><b>' + d.getDate() + '</b><small>' + esc(MONTHS[S.lang][d.getMonth()]) + '</small></span>' + plIcon(it.type) +
    '<span class="pltx"' + (mini ? '' : ' role="button" tabindex="0" data-act="pledit" data-v="' + c.id + '" data-k="' + esc(it.id) + '" title="' + esc(t('edit')) + '"') + '><b>' + esc(it.title) + (mini ? '' : ' ' + I('edit', 'pled')) + '</b>' + (!mini && it.detail ? '<span>' + esc(it.detail) + '</span>' : '') + (!mini && it.dose ? '<span class="pldose">' + I('flask') + esc(it.dose) + '</span>' : '') +
      '<small>' + esc(t('pt_' + (PLTYPE[it.type] ? it.type : 'other'))) + ' · ' + esc(it.done ? t('pl_done_on', {d: it.doneAt ? fmtDs(new Date(it.doneAt)) : ''}) : planWhen(c, it)) + ' · ' + esc(planDayLbl(it)) + (it.src === 'me' ? ' · ' + esc(t('pl_mine')) : '') + '</small>' +
      (!mini && it.note ? '<span class="plnote">' + I('note') + esc(it.note) + '</span>' : '') + '</span>' +
    (mini ? '' : '<button type="button" class="plb' + (it.note ? ' has' : '') + '" data-act="plnote" data-v="' + c.id + '" data-k="' + esc(it.id) + '" aria-label="' + esc(t('pl_note')) + '" title="' + esc(t('pl_note')) + '">' + I('note') + '</button>') +
    '<button type="button" class="plchk' + (it.done ? ' on' : '') + '" data-act="pldone" data-v="' + c.id + '" data-k="' + esc(it.id) + '" aria-pressed="' + !!it.done + '" aria-label="' + esc(t('pl_mark')) + '">' + I('check') + '</button></div>';
}
function planTab(c){
  var its = planItems(c), busy = S.planBusy[c.id], err = S.planErr[c.id], mode = (c.plan && c.plan.mode) || 'mixed';
  var h = '<div class="card pad plhead"><div class="row" style="gap:12px;align-items:flex-start"><span class="ico g">' + I('spark') + '</span><div style="flex:1;min-width:0"><h2 style="font-size:19px">' + esc(t('pl_h')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('pl_d')) + '</p></div></div>' +
    '<div class="plmode" role="group" aria-label="' + esc(t('pl_mode')) + '"><span class="sm mu">' + esc(t('pl_mode')) + ':</span>' + ['mixed', 'organic'].map(function(m){ return '<button type="button" data-act="plmode" data-v="' + c.id + '" data-k="' + m + '" aria-pressed="' + (mode === m) + '">' + (m === 'organic' ? I('leaf') : I('flask')) + esc(t('pl_m_' + m)) + '</button>'; }).join('') + '</div>' +
    '<div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn bp" data-act="plrun" data-v="' + c.id + '"' + (busy || !S.sample ? ' disabled' : '') + '>' + I(its.length ? 'refresh' : 'spark') + esc(its.length ? t('pl_regen') : t('pl_make')) + '</button><button class="btn bs" data-act="pladd" data-v="' + c.id + '">' + I('plus') + esc(t('pl_add')) + '</button></div>' +
    (its.length && c.plan && c.plan.at ? '<p class="xs mu2" style="margin:8px 0 0">' + esc(t('pl_made', {t: ago(c.plan.at)})) + '</p>' : '') + '</div>';
  if(!S.sample && S.sampleReady) h += '<div class="note r" style="margin-top:12px">' + I('alert') + esc(t('ai_off')) + '</div>';
  if(busy) h += '<div class="card pad" style="margin-top:12px">' + loadBox(t('pl_busy'), 5) + '<p class="xs mu2" style="margin:6px 0 0">' + esc(t('pl_busy_d')) + '</p></div>';
  if(err) h += '<div class="note r" style="margin-top:12px">' + I('alert') + esc(err) + '</div>';
  if(!its.length){ if(!busy) h += '<div class="card" style="margin-top:12px"><div class="empty"><span class="ico g">' + I('cal') + '</span><p style="margin:0 0 6px"><b>' + esc(t('pl_empty')) + '</b></p><p class="sm mu" style="margin:0">' + esc(t('pl_empty_d')) + '</p></div></div>'; return h; }
  var counts = {all: 0}; its.forEach(function(it){ counts.all++; counts[it.type] = (counts[it.type] || 0) + 1; });
  var doneN = its.filter(function(it){ return it.done; }).length;
  h += '<div class="card pad plprog"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><b>' + esc(t('pl_prog', {d: num(doneN, 0), n: num(its.length, 0)})) + '</b><button type="button" class="btn bs bsm" data-act="pltoday">' + I('cal') + esc(t('pl_gotoday')) + '</button></div><div class="prog" style="margin-top:10px"><i style="width:' + Math.round(doneN / its.length * 100) + '%"></i></div></div>';
  h += '<div class="chips plchips" role="group" style="margin:14px 0 4px">' + ['all'].concat(PLTYPES).filter(function(k){ return counts[k]; }).map(function(k){ return '<button type="button" data-act="plf" data-v="' + k + '" aria-pressed="' + (S.planF === k) + '">' + (k === 'all' ? '' : I((PLTYPE[k] || PLTYPE.other)[0])) + esc(k === 'all' ? t('all') : t('pt_' + k)) + ' <span class="cnt">' + num(counts[k], 0) + '</span></button>'; }).join('') + '</div>';
  h += planFlow(c, its.filter(function(it){ return S.planF === 'all' || it.type === S.planF; }));
  h += '<p class="xs mu2" style="margin:12px 0 0">' + esc(t('pl_disc')) + '</p>';
  return h;
}
function planPrompt(c){
  var x = cycInfo(c), cr = x.cr, mode = (c.plan && c.plan.mode) || 'mixed';
  var soil = (S.soils || [])[0], wx = prDaily().slice(0, 7);
  return 'TASK: Make a complete, practical crop timetable (वेळापत्रक) for ONE plot, from land preparation to harvest.\n' +
    'Crop: ' + cr.n.en + (c.variety ? ' (variety ' + c.variety + ')' : '') + '. Sowing/transplanting date: ' + c.sow + ' (today is day ' + x.day + '). Expected duration about ' + x.dur + ' days; harvest about day ' + diffDays(x.h1, x.sow) + ' to ' + diffDays(x.h2, x.sow) + '.\n' +
    'Growth stages (start day): ' + x.stages.map(function(s){ return T.en['st_' + s.k] + ' ' + s.start; }).join(', ') + '.\n' +
    'Area: ' + c.area + ' acre. Irrigation: ' + (c.irr || 'rainfed') + '. Place: ' + place() + '. Season now: ' + seasonNow() + '.\n' +
    (soil ? 'Latest soil test (JSON): ' + JSON.stringify(soil).slice(0, 600) + '\n' : 'No soil test available — use the general recommended dose for this crop and region (state the basis).\n') +
    (wx.length ? 'Next 7 days weather (JSON): ' + JSON.stringify(wx) + ' — adjust the first week (no spraying or fertiliser on heavy-rain days).\n' : '') +
    'Method: ' + (mode === 'organic' ? 'ORGANIC ONLY — use only organic and biological inputs (FYM, vermicompost, Jeevamrut, Ghanjeevamrut, Panchagavya, neem products, Trichoderma, Pseudomonas, Beauveria, Metarhizium, pheromone/yellow sticky traps, etc.). No chemical fertiliser or pesticide.' : 'INTEGRATED — recommended fertiliser schedule (basal + top dressings, split by stage) plus IPM; prefer organic/biological options first and use chemicals only where usually needed.') + '\n' +
    'Include: basal dose and every top dressing (with quantity per acre), irrigation rhythm by stage (one entry per change of interval, with interval in days and critical stages), weeding/hoeing, scouting checks for the main pests/diseases of this crop at the right stages, preventive or common sprays at the stages they are usually needed, micronutrient/foliar sprays if commonly recommended, and harvest.\n' +
    'Rules: 22 to 45 items in date order. "day" = whole number of days after sowing (negative for land preparation, e.g. -10). Doses per acre or per 15-litre pump; for chemicals give the active ingredient and the label dose approved (CIB&RC) for this crop and problem; if not sure, write "check label". Add the pre-harvest waiting days for sprays near harvest. Keep each title under 7 words and each detail to one short simple sentence.\n' +
    'Reply with ONLY JSON: {"items":[{"day":0,"type":"spray|water|fert|organic|weed|scout|harvest|other","title":"","detail":"","dose":""}]}\n' +
    'Keep JSON keys and the fixed type values in English; write title, detail and dose in the answer language.';
}
function planRun(cid){
  var c = cyc(cid); if(!c || !S.sample || S.planBusy[cid]) return;
  S.planBusy[cid] = true; S.planErr[cid] = null; softRender();
  S.sample.json(planPrompt(c), {system: sysPrompt('Reply with JSON only.'), task: 'guide'}).then(function(d){
    var raw = d && Array.isArray(d.items) ? d.items : [];
    var items = raw.map(function(r){ var day = Math.round(+r.day); return {id: uid('p'), day: isFinite(day) ? Math.max(-60, Math.min(1500, day)) : NaN, type: PLTYPE[r.type] ? r.type : 'other', title: String(r.title || '').trim().slice(0, 90), detail: String(r.detail || '').trim().slice(0, 300), dose: String(r.dose || '').trim().slice(0, 160), src: 'ai', done: false}; }).filter(function(it){ return isFinite(it.day) && it.title; }).slice(0, 60);
    if(!items.length) throw {code: 'empty', message: t('pl_err_empty')};
    var cc = clone(cyc(cid)); if(!cc) return;
    var keep = ((cc.plan && cc.plan.items) || []).filter(function(it){ return it.src === 'me' || it.done || it.note; });
    cc.plan = {at: Date.now(), lang: S.lang, mode: (cc.plan && cc.plan.mode) || 'mixed', items: keep.concat(items)};
    writeCycle(cc); S.planBusy[cid] = false; S.planF = 'all'; softRender(); toast(t('pl_ready', {n: num(items.length, 0)}));
  }).catch(function(e){ S.planBusy[cid] = false; S.planErr[cid] = e && e.code === 'empty' ? e.message : aiMsg(e); softRender(); });
}
function planFind(c, id){ var its = (c.plan && c.plan.items) || []; for(var i = 0; i < its.length; i++) if(its[i].id === id) return its[i]; return null; }
function planToggle(cid, id){
  var c = clone(cyc(cid)); if(!c) return; var it = planFind(c, id); if(!it) return;
  it.done = !it.done;
  if(it.done){ it.doneAt = Date.now(); var lg = {id: uid('r'), date: isoDate(today0()), act: (PLTYPE[it.type] || PLTYPE.other)[2], note: (it.title + (it.dose ? ' — ' + it.dose : '') + (it.note ? '\n' + it.note : '')).slice(0, 300), plan: it.id}; c.log = (c.log || []).concat([lg]); it.logId = lg.id; }
  else { var lid = it.logId; delete it.doneAt; delete it.logId; if(lid) c.log = (c.log || []).filter(function(l){ return l.id !== lid; }); }
  writeCycle(c);
  if(it.done){ toast(t('pl_done_t')); }
  softRender();
}
function planSheet(cid, id){
  var c = cyc(cid); if(!c) return; var it = id ? planFind(c, id) : null, isNew = !it;
  it = it || {day: Math.max(0, cycInfo(c).day - 1), type: 'spray', title: '', detail: '', dose: '', note: ''};
  var d = isoDate(addDays(parseD(c.sow), it.day));
  modal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="plh"><div class="box"><div class="mhead" style="padding:0 0 12px"><h2 id="plh">' + esc(isNew ? t('pl_add') : t('pl_edit')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div><form id="plform" class="formgrid">' +
    '<label class="f">' + esc(t('date')) + '<input class="inp" type="date" name="date" value="' + esc(d) + '" required></label>' +
    '<label class="f">' + esc(t('pl_type')) + '<select class="inp" name="type">' + PLTYPES.map(function(k){ return '<option value="' + k + '"' + (k === it.type ? ' selected' : '') + '>' + esc(t('pt_' + k)) + '</option>'; }).join('') + '</select></label>' +
    '<label class="f full">' + esc(t('pl_title')) + '<input class="inp" name="title" maxlength="90" value="' + esc(it.title) + '" required placeholder="' + esc(t('pl_title_ph')) + '"></label>' +
    '<label class="f full">' + esc(t('pl_detail')) + '<textarea class="inp" name="detail" rows="2" maxlength="300">' + esc(it.detail || '') + '</textarea></label>' +
    '<label class="f full">' + esc(t('pl_dose')) + '<input class="inp" name="dose" maxlength="160" value="' + esc(it.dose || '') + '" placeholder="' + esc(t('pl_dose_ph')) + '"></label>' +
    '<label class="f full">' + I('note') + ' ' + esc(t('pl_note')) + '<textarea class="inp" name="note" rows="2" maxlength="500">' + esc(it.note || '') + '</textarea></label>' +
    '</form><div class="acts">' + (isNew ? '' : '<button class="btn bd" data-act="pldel" data-v="' + cid + '" data-k="' + esc(it.id) + '" style="margin-right:auto">' + I('trash') + esc(t('delete')) + '</button>') + '<button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bp" data-act="plsave" data-v="' + cid + '" data-k="' + esc(it.id || '') + '">' + I('check') + esc(t('save')) + '</button></div></div></div>');
}
function planSave(cid, id){
  var f = $('#plform'); if(!f) return; var fd = new FormData(f), title = String(fd.get('title') || '').trim(), date = fd.get('date');
  if(!title || !date){ f.reportValidity && f.reportValidity(); return; }
  var c = clone(cyc(cid)); if(!c) return; c.plan = c.plan || {at: 0, lang: S.lang, mode: 'mixed', items: []}; c.plan.items = c.plan.items || [];
  var it = id ? planFind(c, id) : null; if(!it){ it = {id: uid('p'), src: 'me', done: false, at: Date.now()}; c.plan.items.push(it); }
  it.day = diffDays(parseD(date), parseD(c.sow)); it.type = PLTYPE[fd.get('type')] ? fd.get('type') : 'other'; it.title = title.slice(0, 90);
  it.detail = String(fd.get('detail') || '').trim().slice(0, 300); it.dose = String(fd.get('dose') || '').trim().slice(0, 160); it.note = String(fd.get('note') || '').trim().slice(0, 500);
  writeCycle(c); closeModal(); toast(t('saved')); softRender();
}
function planDel(cid, id){ var c = clone(cyc(cid)); if(!c || !c.plan) return; c.plan.items = (c.plan.items || []).filter(function(x){ return x.id !== id; }); writeCycle(c); closeModal(); softRender(); }
function noteSheet(cid, id){
  var c = cyc(cid); if(!c) return; var it = planFind(c, id); if(!it) return;
  modal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="nth"><div class="box" style="max-width:480px"><div class="mhead" style="padding:0 0 10px"><h2 id="nth" style="display:flex;gap:8px;align-items:center">' + I('note') + esc(t('pl_note')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="plrow mini" style="border:0;padding:0 0 10px">' + plIcon(it.type) + '<span class="pltx"><b>' + esc(it.title) + '</b><small>' + esc(fmtD(planDate(c, it))) + '</small></span></div>' +
    '<textarea class="inp" id="plnotein" rows="4" maxlength="500" placeholder="' + esc(t('pl_note_ph')) + '">' + esc(it.note || '') + '</textarea>' +
    '<div class="acts"><button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bp" data-act="plnotesave" data-v="' + cid + '" data-k="' + esc(id) + '">' + I('check') + esc(t('save')) + '</button></div></div></div>');
  var ta = $('#plnotein'); if(ta){ ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}
function noteSave(cid, id){ var c = clone(cyc(cid)); if(!c) return; var it = planFind(c, id); if(!it) return; it.note = String(($('#plnotein') || {}).value || '').trim().slice(0, 500); writeCycle(c); closeModal(); toast(t('saved')); softRender(); }

/* flow chart: growth stages as milestones, tasks as nodes under them (same look as the आढावा timeline) */
function planFlow(c, list){
  var x = cycInfo(c), st = x.stages.slice(), today = x.day - 1;
  var groups = [{k: 'prep', name: t('pl_prep'), start: -9999, end: 0}];
  st.forEach(function(s2, i){ groups.push({k: s2.k, name: t('st_' + s2.k), start: s2.start, end: i < st.length - 1 ? st[i + 1].start : Math.max(s2.end, 9999), stage: s2}); });
  var hv = diffDays(x.h1, x.sow);
  var h = '<div class="plflow">';
  groups.forEach(function(g, gi){
    var items = list.filter(function(it){ return it.day >= g.start && it.day < g.end; });
    if(g.k === 'prep' && !items.length) return;
    var state = today >= g.end ? 'done' : (today >= g.start ? 'now' : '');
    var from = g.k === 'prep' ? null : addDays(x.sow, g.start);
    h += '<div class="fstage ' + state + '"><span class="fdot big">' + (state === 'done' ? I('check') : '') + '</span><div class="fst"><b>' + esc(g.name) + (state === 'now' ? ' <span class="fnow">' + esc(t('pl_now')) + '</span>' : '') + '</b><small>' + (from ? esc(fmtDs(from)) + ' · ' + esc(t('day_n', {n: g.start + 1})) : esc(t('pl_prep_d'))) + (g.k !== 'prep' && g.start <= hv && hv < g.end ? ' · ' + esc(t('exp_harvest')) + ' ' + esc(fmtDs(x.h1)) : '') + '</small></div></div>';
    items.forEach(function(it){ h += planNode(c, it); });
    if(!items.length) h += '<div class="fnode empty"><span class="fdot sm"></span><p class="xs mu2">' + esc(t('pl_stage_none')) + '</p></div>';
  });
  h += '<div class="fstage end' + (x.done ? ' done' : '') + '"><span class="fdot big">' + I('star') + '</span><div class="fst"><b>' + esc(t('exp_harvest')) + '</b><small>' + esc(fmtDs(x.h1) + ' – ' + fmtDs(x.h2)) + '</small></div></div></div>';
  return h;
}
function planNode(c, it){
  var d = planDate(c, it), dd = planDD(c, it), p = PLTYPE[it.type] || PLTYPE.other;
  var cls = it.done ? 'done' : (dd === 0 ? 'today' : (dd < 0 ? (planBorn(c, it) ? 'late' : 'past') : ''));
  return '<div class="fnode ' + cls + '" id="pl-' + esc(it.id) + '"><span class="fdot ' + p[1] + '">' + I(p[0]) + '</span><div class="fcard">' +
    '<div class="ftop"><label class="fdate" title="' + esc(t('pl_change_date')) + '">' + I('cal') + '<span>' + esc(fmtDs(d)) + '</span><input type="date" data-act="pldate" data-v="' + c.id + '" data-k="' + esc(it.id) + '" value="' + esc(isoDate(d)) + '" aria-label="' + esc(t('pl_change_date')) + '"></label>' +
      '<span class="fwhen">' + esc(it.done ? t('pl_done_on', {d: it.doneAt ? fmtDs(new Date(it.doneAt)) : ''}) : (cls === 'past' ? t('pl_pastlbl') : planWhen(c, it))) + '</span><span class="ftype ' + p[1] + '">' + esc(t('pt_' + (PLTYPE[it.type] ? it.type : 'other'))) + '</span></div>' +
    '<b class="ftitle">' + esc(it.title) + (it.src === 'me' ? ' <span class="edtag">' + esc(t('pl_mine')) + '</span>' : '') + '</b>' + (it.detail ? '<p class="fdet">' + esc(it.detail) + '</p>' : '') + (it.dose ? '<p class="pldose">' + I('flask') + esc(it.dose) + '</p>' : '') +
    (it.note ? '<p class="plnote">' + I('note') + esc(it.note) + '</p>' : '') +
    '<div class="fnact"><button type="button" class="fchk' + (it.done ? ' on' : '') + '" data-act="pldone" data-v="' + c.id + '" data-k="' + esc(it.id) + '" aria-pressed="' + !!it.done + '"><span class="bx">' + I('check') + '</span>' + esc(it.done ? t('pl_isdone') : t('pl_markdone')) + '</button>' +
      '<button type="button" class="fbtn' + (it.note ? ' has' : '') + '" data-act="plnote" data-v="' + c.id + '" data-k="' + esc(it.id) + '" aria-label="' + esc(t('pl_note')) + '" title="' + esc(t('pl_note')) + '">' + I('note') + '</button>' +
      '<button type="button" class="fbtn" data-act="pledit" data-v="' + c.id + '" data-k="' + esc(it.id) + '" aria-label="' + esc(t('edit')) + '" title="' + esc(t('edit')) + '">' + I('edit') + '</button></div></div></div>';
}
function planSetDate(cid, id, val){
  if(!val) return; var c = clone(cyc(cid)); if(!c) return; var it = planFind(c, id); if(!it) return;
  var nd = diffDays(parseD(val), parseD(c.sow)); if(!isFinite(nd) || nd === it.day) return;
  it.day = Math.max(-120, Math.min(1500, nd)); it.moved = true; writeCycle(c); toast(t('pl_moved', {d: fmtDs(parseD(val))})); softRender();
  setTimeout(function(){ var el = document.getElementById('pl-' + id); if(el){ el.scrollIntoView({block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth'}); el.classList.add('flash'); setTimeout(function(){ el.classList.remove('flash'); }, 1400); } }, 60);
}
function planGoToday(){
  var el = document.querySelector('.plflow .fnode.today') || document.querySelector('.plflow .fnode.late') || document.querySelector('.plflow .fnode:not(.done):not(.past):not(.empty)') || document.querySelector('.plflow .fstage.now');
  if(el){ el.scrollIntoView({block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth'}); el.classList.add('flash'); setTimeout(function(){ el.classList.remove('flash'); }, 1400); }
}
document.addEventListener('change', function(e){ var el = e.target; if(el && el.getAttribute && el.getAttribute('data-act') === 'pldate') planSetDate(el.getAttribute('data-v'), el.getAttribute('data-k'), el.value); });
/* edit stage dates (पीक वेळापत्रक) */
function stageSheet(cid){
  var c = cyc(cid); if(!c) return; var x = cycInfo(c);
  modal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="sgh"><div class="box" style="max-width:520px"><div class="mhead" style="padding:0 0 10px"><h2 id="sgh">' + esc(t('stg_h')) + '</h2><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div><p class="sm mu" style="margin:0 0 12px">' + esc(t('stg_d')) + '</p><form id="stgform" class="stglist">' +
    x.stages.map(function(s){ return '<label class="stgrow"><span><b>' + esc(t('st_' + s.k)) + '</b><small>' + esc(t('day_n', {n: s.start + 1})) + '</small></span><input class="inp" type="date" name="st_' + s.k + '" value="' + esc(isoDate(addDays(x.sow, s.start))) + '" min="' + esc(c.sow) + '"></label>'; }).join('') +
    '<label class="stgrow"><span><b>' + esc(t('exp_harvest')) + '</b><small>' + esc(t('stg_from')) + '</small></span><input class="inp" type="date" name="h1" value="' + esc(isoDate(x.h1)) + '" min="' + esc(c.sow) + '"></label>' +
    '<label class="stgrow"><span><b>' + esc(t('exp_harvest')) + '</b><small>' + esc(t('stg_to')) + '</small></span><input class="inp" type="date" name="h2" value="' + esc(isoDate(x.h2)) + '" min="' + esc(c.sow) + '"></label></form>' +
    '<div class="acts">' + (c.stg || c.hv ? '<button class="btn bs" data-act="stgreset" data-v="' + cid + '" style="margin-right:auto">' + I('refresh') + esc(t('stg_reset')) + '</button>' : '') + '<button class="btn bs" data-act="close">' + esc(t('cancel')) + '</button><button class="btn bp" data-act="stgsave" data-v="' + cid + '">' + I('check') + esc(t('save')) + '</button></div></div></div>');
}
function stageSave(cid){
  var f = $('#stgform'); if(!f) return; var c = clone(cyc(cid)); if(!c) return; var x = cycInfo(cyc(cid)), fd = new FormData(f), sow = parseD(c.sow), stg = {};
  x.stages.forEach(function(s){ var v = fd.get('st_' + s.k); if(v){ var dd = diffDays(parseD(v), sow); if(dd >= 0) stg[s.k] = dd; } });
  var h1 = fd.get('h1') ? diffDays(parseD(fd.get('h1')), sow) : 0, h2 = fd.get('h2') ? diffDays(parseD(fd.get('h2')), sow) : 0;
  if(h1 > 0 && h2 >= h1) c.hv = [h1, h2]; else if(h1 > 0 && h2 < h1){ toast(t('stg_bad')); return; }
  c.stg = stg; writeCycle(c); closeModal(); toast(t('saved')); softRender();
}
function stageReset(cid){ var c = clone(cyc(cid)); if(!c) return; delete c.stg; delete c.hv; writeCycle(c); closeModal(); softRender(); }
/* add an item from elsewhere (Crop Guardian, organic recipes) */
function planAddQuick(cid, it){
  var c = clone(cyc(cid)); if(!c) return false; c.plan = c.plan || {at: 0, lang: S.lang, mode: 'mixed', items: []}; c.plan.items = c.plan.items || [];
  var dup = c.plan.items.some(function(x){ return x.title === it.title && x.day === it.day; }); if(dup){ toast(t('pl_already')); return false; }
  c.plan.items.push({id: uid('p'), day: it.day, type: it.type, title: String(it.title).slice(0, 90), detail: String(it.detail || '').slice(0, 300), dose: String(it.dose || '').slice(0, 160), src: 'me', done: false, at: Date.now()});
  writeCycle(c); toast(t('pl_added')); return true;
}

/* =====================================================================
   v7.7 — photo library (your own folders) + pest / disease info sheet
   ===================================================================== */
S.lib = lsGet('lib', {crops: {}, pests: {}, diseases: {}}); if(!S.lib || typeof S.lib !== 'object') S.lib = {crops: {}, pests: {}, diseases: {}};
S.pdInfo = lsGet('pdinfo', {}); if(!S.pdInfo || typeof S.pdInfo !== 'object' || Array.isArray(S.pdInfo)) S.pdInfo = {};
function loadLib(){ fetch('/api/cropimgs?lib=1').then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(!j || typeof j !== 'object') return; var nl = {crops: j.crops || {}, pests: j.pests || {}, diseases: j.diseases || {}}; var ch = JSON.stringify(nl) !== JSON.stringify(S.lib); S.lib = nl; lsSet('lib', nl); if(ch) softRender(); }).catch(function(){}); }
function pdName(kind, id){ var m = kind === 'pest' ? PESTS[id] : DISEASES[id]; return m ? L(m) : id; }
function pdPhotos(cropId, kind, id){ var lib = (S.lib && S.lib[kind === 'pest' ? 'pests' : 'diseases']) || {}; return (lib[cropId + '-' + id] || []).concat(lib[id] || []); }
function pdCard(c, kind, id){
  var ph = pdPhotos(c.id, kind, id);
  return '<button type="button" class="pdc ' + kind + '" data-act="pdopen" data-c="' + c.id + '" data-k="' + kind + '" data-v="' + esc(id) + '"><span class="pdimg">' + (ph.length ? imgTag(ph[0]) : I(kind === 'pest' ? 'bug' : 'alert')) + '</span><span class="pdn"><b>' + esc(pdName(kind, id)) + '</b><small>' + esc(t(kind === 'pest' ? 'pd_pest' : 'pd_dis')) + '</small></span>' + I('chev', 'chev') + '</button>';
}
function pdKey(cropId, kind, id){ return cropId + '|' + kind + '|' + id + '|' + S.lang; }
function pdRun(cropId, kind, id, force){
  var k = pdKey(cropId, kind, id), cur = S.pdInfo[k]; if(!S.sample) return;
  if(!force && cur && (cur.busy || cur.data || (cur.err && Date.now() - (cur.at || 0) < 120000))) return;
  var cr = crop(cropId); if(!cr) return;
  S.pdInfo[k] = {busy: true}; pdPatch();
  var nm = kind === 'pest' ? PESTS[id] : DISEASES[id], en = nm ? nm.en : id;
  var prompt = 'TASK: Explain the ' + (kind === 'pest' ? 'insect pest' : 'crop disease') + ' "' + en + '" on ' + cr.n.en + ' for a farmer in ' + place() + ', in very simple words.\n' +
    'Reply with ONLY JSON: {"look":["<3-5 short signs to recognise it in the field>"],"cause":"<one line: what causes it / which insect>","when":"<when and in which weather/stage it comes>","loss":"<one line: what damage it does>","prevent":["<2-4 prevention steps>"],"organic":["<2-3 organic/biological controls with dose>"],"chemical":["<1-3 chemical options: active ingredient + label dose per litre or per 15 L pump, approved for this crop; if unsure write: check label>"],"threshold":"<when to act, e.g. economic threshold>"}\n' +
    'Keep each item under 18 words. Keep JSON keys in English; write values in the answer language.';
  S.sample.json(prompt, {system: sysPrompt('Reply with JSON only.'), task: 'json', cache: {gcTime: 7 * 86400000}}).then(function(d){
    S.pdInfo[k] = {data: d && typeof d === 'object' ? d : {}, at: Date.now()};
    var keep = {}, keys = Object.keys(S.pdInfo).filter(function(x){ return S.pdInfo[x] && S.pdInfo[x].data; }).slice(-60); keys.forEach(function(x){ keep[x] = S.pdInfo[x]; }); lsSet('pdinfo', keep); pdPatch();
  }).catch(function(e){ S.pdInfo[k] = {err: aiMsg(e), at: Date.now()}; pdPatch(); });
}
function pdBody(cropId, kind, id){
  var r = S.pdInfo[pdKey(cropId, kind, id)];
  if(!S.sample && S.sampleReady) return '<div class="note r">' + I('alert') + esc(t('ai_off')) + '</div>';
  if(!r || r.busy) return loadBox(t('pd_busy'), 4);
  if(r.err) return '<div class="note r">' + I('alert') + esc(r.err) + '</div><button class="btn bs bsm" style="margin-top:8px" data-act="pdretry" data-c="' + cropId + '" data-k="' + kind + '" data-v="' + esc(id) + '">' + I('refresh') + esc(t('v7_retry')) + '</button>';
  var d = r.data || {}, arr = function(v){ return Array.isArray(v) ? v : (v ? [v] : []); };
  var sec = function(ic, cls, key, v){ var a = arr(v); return a.length ? '<div class="pdsec ' + cls + '"><h4>' + I(ic) + esc(t(key)) + '</h4><ul>' + a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : ''; };
  return (d.cause ? '<p class="pdcause">' + esc(d.cause) + '</p>' : '') + sec('eye', 'g', 'pd_look', d.look) +
    (d.when || d.loss ? '<div class="pdmeta">' + (d.when ? '<span>' + I('cloudsun') + esc(d.when) + '</span>' : '') + (d.loss ? '<span>' + I('alert') + esc(d.loss) + '</span>' : '') + (d.threshold ? '<span>' + I('info') + esc(d.threshold) + '</span>' : '') + '</div>' : '') +
    sec('shield', 'b', 'pd_prevent', d.prevent) + sec('leaf', 'g', 'pd_org', d.organic) + sec('flask', 'r', 'pd_chem', d.chemical) +
    '<p class="xs mu2" style="margin:10px 0 0">' + esc(t('pd_note')) + '</p>';
}
function pdSheet(cropId, kind, id){
  var cr = crop(cropId); if(!cr) return; var ph = pdPhotos(cropId, kind, id), nm = kind === 'pest' ? PESTS[id] : DISEASES[id];
  S.pdOpen = [cropId, kind, id];
  modal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pdh"><div class="box pdbox"><div class="mhead" style="padding:0 0 10px"><div><h2 id="pdh">' + esc(pdName(kind, id)) + '</h2><small class="mu">' + esc(L(cr.n)) + ' · ' + esc(t(kind === 'pest' ? 'pd_pest' : 'pd_dis')) + (nm && S.lang !== 'en' ? ' · ' + esc(nm.en) : '') + '</small></div><button class="xbtn" data-act="close" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    (ph.length ? '<div class="pdgal">' + ph.map(function(u){ return '<div class="pdph">' + imgTag(u) + '</div>'; }).join('') + '</div>' + (ph.length > 1 ? '<p class="xs mu2" style="margin:4px 0 0;text-align:center">' + esc(t('pd_swipe', {n: ph.length})) + '</p>' : '') : '<div class="pdnoph">' + I(kind === 'pest' ? 'bug' : 'alert') + '<span>' + esc(t('pd_nophoto')) + '</span></div>') +
    '<div id="pdbody" class="pdbody">' + pdBody(cropId, kind, id) + '</div>' +
    '<div class="acts"><a class="btn bs" href="#scan" data-act="scanmode" data-v="' + (kind === 'pest' ? 'insect' : 'leaf') + '">' + I('camera') + esc(t('pd_scan')) + '</a><button class="btn bp" data-act="close">' + esc(t('close')) + '</button></div></div></div>');
  pdRun(cropId, kind, id, false);
}
function pdPatch(){ var b = $('#pdbody'); if(b && S.pdOpen) b.innerHTML = pdBody(S.pdOpen[0], S.pdOpen[1], S.pdOpen[2]); }

/* =====================================================================
   v7.7 — पीक रक्षक (Crop Guardian), simpler and interactive
   ===================================================================== */
S.prDay = 0; S.prUI = lsGet('prui', {}); if(!S.prUI || typeof S.prUI !== 'object' || S.prUI.day !== isoDate(today0())) S.prUI = {day: isoDate(today0()), seen: {}, tick: {}};
S.prOpen = {};
function prUISave(){ lsSet('prui', S.prUI); }
function dayHours(i){ var d0 = addDays(today0(), i), d1 = addDays(today0(), i + 1); return wxHoursAll().filter(function(x){ return x.t >= d0 && x.t < d1; }); }
function wxHoursAll(){ var h = S.wx && S.wx.hourly; if(!h || !h.time) return []; var out = []; for(var i = 0; i < h.time.length; i++){ out.push({t: new Date(h.time[i]), T: h.temperature_2m[i], rh: h.relative_humidity_2m[i], dp: h.dew_point_2m ? h.dew_point_2m[i] : null, p: h.precipitation[i] || 0, pp: h.precipitation_probability ? (h.precipitation_probability[i] || 0) : 0, ws: h.wind_speed_10m[i], wg: h.wind_gusts_10m ? h.wind_gusts_10m[i] : null, code: h.weather_code[i]}); } return out; }
function sprayOK(hs, i){ var x = hs[i], hr = x.t.getHours(), next = hs.slice(i, i + 5); var dry = next.every(function(y){ return y.p < 0.2 && y.pp < 50; }); var ok = hr >= 6 && hr <= 18 && dry && x.ws >= 3 && x.ws <= 15 && (x.wg == null || x.wg < 25) && x.T <= 32; return {ok: ok, why: !dry ? 'rain' : (x.ws > 15 || (x.wg != null && x.wg >= 25) ? 'wind' : (x.ws < 3 ? 'calm' : (x.T > 32 ? 'hot' : (hr < 6 || hr > 18 ? 'night' : ''))))}; }
function dayWindows(i){
  var all = wxHoursAll(), d0 = addDays(today0(), i), d1 = addDays(today0(), i + 1), wins = [], cur = null, why = {};
  all.forEach(function(x, j){ if(x.t < d0 || x.t >= d1 || x.t.getTime() < Date.now() - 3600000) return; var s = sprayOK(all, j); if(s.ok){ if(!cur){ cur = {from: x.t, to: x.t, n: 0}; wins.push(cur); } cur.to = x.t; cur.n++; } else { cur = null; if(s.why && s.why !== 'night') why[s.why] = (why[s.why] || 0) + 1; } });
  var top = Object.keys(why).sort(function(a, b){ return why[b] - why[a]; })[0];
  return {wins: wins.filter(function(w){ return w.n >= 2; }), why: top || ''};
}
function dayRisk(i){
  var hs = dayHours(i), m = prMetrics(hs), al = prAlerts().filter(function(a){ return diffDays(new Date(a.d.getFullYear(), a.d.getMonth(), a.d.getDate()), today0()) === i; });
  var sev = al.reduce(function(a, b){ return Math.max(a, b.sev); }, 0);
  var lv = sev >= 3 || m.rain >= 20 || m.wet >= 9 ? 'high' : (sev >= 2 || m.rain >= 5 || m.wet >= 4 || m.maxGust >= 40 ? 'medium' : 'low');
  return {lv: lv, m: m, al: al};
}
function winText(w){ return hhmm(w.from) + '–' + hhmm(new Date(w.to.getTime() + 3600000)); }
function prHero(){
  var DMG = ['hail', 'vheavy', 'heavy', 'wind', 'storm'];
  var al = prAlerts().filter(function(a){ return diffDays(new Date(a.d.getFullYear(), a.d.getMonth(), a.d.getDate()), today0()) <= 2 && a.sev >= 2; }).sort(function(a, b){ return (DMG.indexOf(b.k) > -1) - (DMG.indexOf(a.k) > -1) || b.sev - a.sev; });
  var w0 = dayWindows(0), w1 = dayWindows(1);
  var severeToday = al.some(function(a){ return a.sev >= 3 && diffDays(new Date(a.d.getFullYear(), a.d.getMonth(), a.d.getDate()), today0()) === 0; });
  var canToday = w0.wins.length > 0 && !severeToday;
  var cls = severeToday ? 'red' : (canToday ? 'green' : 'amber');
  var big = canToday ? t('prh_spray_yes', {w: w0.wins.map(winText).slice(0, 2).join(', ')}) : t('prh_spray_no', {why: severeToday ? alertText(al.filter(function(a){ return a.sev >= 3; })[0]) : (w0.why ? t('sw_' + w0.why) : t('prh_nowin'))});
  var sub = !canToday && w1.wins.length ? t('prh_next', {d: t('tomorrow'), w: winText(w1.wins[0])}) : '';
  var h = '<div class="prhero ' + cls + '"><div class="prhi">' + I(canToday ? 'check' : 'x') + '</div><div class="prht"><small>' + esc(t('prh_today')) + '</small><b>' + esc(big) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div></div>';
  if(al.length){ var dmg = ['hail', 'vheavy', 'heavy', 'wind', 'storm'].indexOf(al[0].k) > -1; h += '<div class="pralert sev' + al[0].sev + ' big">' + I('alert') + '<span>' + esc(alertText(al[0])) + '</span>' + (dmg ? '<button class="btn bsm ' + (al[0].sev >= 3 ? 'bd' : 'bs') + '" data-act="claimkit">' + esc(t('prh_claim')) + '</button>' : '') + '</div>'; }
  /* planned sprays in the next 3 days, checked against the weather */
  var plan = [];
  S.cycles.forEach(function(c){ if(cycInfo(c).done) return; planItems(c).forEach(function(it){ if(it.done || it.type !== 'spray' && it.type !== 'fert' && it.type !== 'organic') return; var dd = planDD(c, it); if(dd >= 0 && dd <= 2) plan.push({c: c, it: it, dd: dd}); }); });
  if(plan.length) h += '<div class="card pad prplan"><h3>' + I('cal') + esc(t('prh_plan')) + '</h3>' + plan.slice(0, 4).map(function(p){ var w = dayWindows(p.dd), ok = p.it.type !== 'spray' ? dayRisk(p.dd).m.rain < 10 : w.wins.length > 0, cr = crop(p.c.crop) || CROPS[0];
    return '<div class="prpl ' + (ok ? 'ok' : 'no') + '">' + plIcon(p.it.type) + '<span class="pltx"><b>' + esc(p.it.title) + '</b><small>' + esc(L(cr.n) + ' · ' + (p.dd === 0 ? t('today') : (p.dd === 1 ? t('tomorrow') : fmtDs(addDays(today0(), p.dd))))) + '</small><span class="prv">' + I(ok ? 'check' : 'alert') + esc(ok ? (p.it.type === 'spray' ? t('prh_ok_w', {w: winText(w.wins[0])}) : t('prh_ok')) : t('prh_move', {why: w.why ? t('sw_' + w.why) : t('sw_rain')})) + '</span></span><a class="lnk" href="#cycle-' + p.c.id + '" data-act="cyctab" data-v="plan">' + I('chev', 'chev') + '</a></div>'; }).join('') + '</div>';
  return h;
}
function prWeek(){
  var d = S.wx && S.wx.daily; if(!d || !d.time) return '';
  var n = Math.min(7, d.time.length), days = [];
  for(var i = 0; i < n; i++){ var dt = addDays(today0(), i), idx = d.time.indexOf(isoDate(dt)); if(idx < 0) continue; days.push({i: i, dt: dt, idx: idx, r: dayRisk(i)}); }
  if(!days.length) return '';
  var sel = days.filter(function(x){ return x.i === S.prDay; })[0] || days[0];
  var h = '<div class="card pad prweek"><h2>' + I('cal') + esc(t('prw_h')) + '</h2><p class="sm mu" style="margin:0 0 10px">' + esc(t('prw_d')) + '</p><div class="prdays" role="tablist">' + days.map(function(x){ var code = d.weather_code[x.idx], rain = d.precipitation_sum[x.idx] || 0;
    return '<button type="button" role="tab" class="prday lv-' + x.r.lv + '" data-act="prday" data-v="' + x.i + '" aria-selected="' + (x.i === sel.i) + '"><small>' + esc(x.i === 0 ? t('today') : (x.i === 1 ? t('tomorrow') : wkday(x.dt))) + '</small>' + I(code >= 95 ? 'storm' : (code >= 51 || rain >= 1 ? 'rain' : (code >= 3 ? 'cloud' : 'sun'))) + '<b>' + Math.round(d.temperature_2m_max[x.idx]) + '°</b><span class="dot"></span><em>' + (rain >= 1 ? num(Math.round(rain), 0) + ' mm' : '&nbsp;') + '</em></button>'; }).join('') + '</div>';
  var r = sel.r, w = dayWindows(sel.i), di = sel.idx;
  h += '<div class="prdet"><div class="prdh"><b>' + esc(sel.i === 0 ? t('today') : (sel.i === 1 ? t('tomorrow') : fmtD(sel.dt))) + '</b>' + prLevel(r.lv) + '</div><div class="prfacts">' +
    '<span>' + I('thermo') + esc(Math.round(d.temperature_2m_min[di]) + '–' + Math.round(d.temperature_2m_max[di]) + '°C') + '</span>' +
    '<span>' + I('rain') + esc(num(Math.round((d.precipitation_sum[di] || 0) * 10) / 10) + ' mm · ' + (d.precipitation_probability_max ? (d.precipitation_probability_max[di] || 0) : 0) + '%') + '</span>' +
    '<span>' + I('wind') + esc(Math.round(d.wind_speed_10m_max[di] || 0) + ' km/h') + '</span>' +
    '<span>' + I('drop') + esc(t('prw_wet', {n: r.m.wet})) + '</span></div>' +
    (r.al.length ? r.al.map(function(a){ return '<div class="pralert sev' + a.sev + ' big">' + I('alert') + '<span>' + esc(alertText(a)) + '</span>' + (['hail', 'vheavy', 'heavy', 'wind', 'storm'].indexOf(a.k) > -1 ? '<button class="btn bsm bs" data-act="claimkit">' + esc(t('prh_claim')) + '</button>' : '') + '</div>'; }).join('') : '') +
    '<p class="prsw">' + I('spray') + '<span><b>' + esc(t('prw_spray')) + ':</b> ' + esc(w.wins.length ? w.wins.map(winText).join(', ') : t('prw_nospray', {why: w.why ? t('sw_' + w.why) : t('prh_nowin')})) + '</span></p>' +
    '<p class="xs mu2" style="margin:6px 0 0">' + esc(t(r.lv === 'high' ? 'prw_tip_high' : (r.lv === 'medium' ? 'prw_tip_med' : 'prw_tip_low'))) + '</p></div></div>';
  return h;
}
function wkday(d){ try{ return d.toLocaleDateString(S.lang === 'en' ? 'en-IN' : (S.lang === 'hi' ? 'hi-IN' : 'mr-IN'), {weekday: 'short'}); }catch(e){ return fmtDs(d); } }
function prBody(){
  var hs = wxHours();
  if(!hs.length){
    if(S.wxErr && !S.wxBusy) return '<div class="card pad"><div class="note r">' + I('alert') + esc(S.wxErr) + '</div><p class="sm mu" style="margin:10px 0 0">' + esc(t('v7_wx_need')) + '</p><div class="row wrap" style="margin-top:12px"><button class="btn bp bsm" data-act="prrefresh">' + I('refresh') + esc(t('v7_retry')) + '</button><button class="btn bs bsm" data-act="menu">' + I('pin') + esc(t('my_location')) + '</button></div></div>';
    if(!S.wxBusy) setTimeout(function(){ loadWx(true); }, 0);
    return '<div class="card pad">' + loadBox(t('wx_loading'), 3) + '</div>'; }
  var h = '<div class="curloc">' + I('pin') + '<div><b>' + esc(wxPlace()) + '</b><small>' + esc(t('pr_wxsrc', {t: ago(S.wx.got || Date.now())})) + '</small></div><button class="btn bs bsm" data-act="prrefresh">' + I('refresh') + esc(t('news_refresh')) + '</button></div>';
  h += prHero();
  var active = S.cycles.filter(function(c){ return !cycInfo(c).done; });
  if(!active.length) h += '<div class="card"><div class="empty"><span class="ico g">' + I('sprout') + '</span><p style="margin:0 0 14px">' + esc(t('pr_nocrops')) + '</p><button class="btn bp" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div></div>';
  else {
    if(!S.sample && S.sampleReady) h += '<div class="note r">' + I('alert') + esc(t('ai_off')) + '</div>';
    active.forEach(function(c){ if(S.sample) prRun(c, false); });
    h += '<div class="h-sec" style="margin-top:18px"><h2>' + esc(t('pr_mycrops')) + '</h2></div>' + active.map(function(c){ return prCropCard(c); }).join('');
  }
  h += prWeek();
  h += '<p class="xs mu2" style="margin-top:12px">' + esc(t('pr_note')) + '</p>';
  return h;
}
var PRSCORE = {high: 85, medium: 55, low: 20};
function prGauge(lv){ var p = PRSCORE[lv] || 20, col = lv === 'high' ? '#C0392B' : (lv === 'medium' ? '#D9920E' : '#2F8F57'); return '<span class="prg" style="--p:' + p + ';--c:' + col + '"><b>' + esc(t((PRLEV[lv] || PRLEV.low)[1])) + '</b></span>'; }
function prRiskId(c, k){ var ids = (crop(c.crop) || {p: [], ds: []}); var id = String(k.id || '').toLowerCase(); if(ids.p.indexOf(id) > -1) return {kind: 'pest', id: id}; if(ids.ds.indexOf(id) > -1) return {kind: 'disease', id: id}; return null; }
function prCropCard(c){
  var x = cycInfo(c), cr = x.cr, r = prGet(c);
  var st = x.day < 1 ? t('not_sown', {n: 1 - x.day}) : t('day_n', {n: x.day}) + ' · ' + t('st_' + (x.cur ? x.cur.k : 'germ'));
  var top = r && r.data && r.data.risks && r.data.risks[0];
  var h = '<div class="card prcrop"><div class="cth">' + cycDot(c, true) + '<span class="ctt"><b>' + esc(L(cr.n)) + (c.plot ? ' · ' + esc(c.plot) : '') + '</b><small>' + esc(st) + '</small></span>' + (top ? prGauge(top.level) : '') +
    '<button class="xbtn" data-act="prrun" data-v="' + c.id + '" aria-label="' + esc(t('news_refresh')) + '" title="' + esc(t('news_refresh')) + '">' + I('refresh') + '</button></div><div class="prcb">';
  if(!r || r.busy) return h + loadBox(t('pr_thinking'), 3) + '</div></div>';
  if(r.err) return h + '<div class="note r">' + I('alert') + esc(r.err) + '</div><button class="btn bs bsm" style="margin-top:8px" data-act="prrun" data-v="' + c.id + '">' + I('refresh') + esc(t('v7_retry')) + '</button></div></div>';
  var d = r.data;
  if(d.summary) h += '<p class="prsum">' + esc(d.summary) + '</p>';
  if(d.risks && d.risks.length) h += '<div class="prthreats">' + d.risks.map(function(k, i){ return prThreat(c, k, i); }).join('') + '</div>';
  else h += '<div class="note g">' + I('check') + esc(t('pr_allok')) + '</div>';
  if(d.today && d.today.length) h += '<div class="prtoday"><b>' + I('hand') + esc(t('pr_today')) + '</b>' + d.today.map(function(s, i){ var key = c.id + '|' + i, on = !!S.prUI.tick[key]; return '<button type="button" class="prtick' + (on ? ' on' : '') + '" data-act="prtick" data-v="' + esc(key) + '" aria-pressed="' + on + '"><span class="bx">' + I('check') + '</span><span>' + esc(s) + '</span></button>'; }).join('') + '</div>';
  if(d.water) h += '<p class="prw">' + I('drop') + '<span><b>' + esc(t('pr_water')) + ':</b> ' + esc(d.water) + '</span></p>';
  if(d.harvest) h += '<p class="prw">' + I('cal') + '<span><b>' + esc(t('pr_harvest')) + ':</b> ' + esc(d.harvest) + (FEATURES.market ? ' <a href="#market" data-act="mkcrop" data-v="' + cr.id + '">' + esc(t('mk_h')) + ' →</a>' : '') + '</span></p>';
  h += '<div class="row wrap" style="margin-top:10px">' + speakBtn('pr' + c.id) + '</div>';
  return h + '</div></div>';
}
function prThreat(c, k, i){
  var key = c.id + '|' + i + '|' + (k.name || ''), open = !!S.prOpen[key], seen = S.prUI.seen[key], ref = prRiskId(c, k), ph = ref ? pdPhotos(c.crop, ref.kind, ref.id) : [];
  var h = '<div class="prth lv-' + esc(k.level || 'low') + (open ? ' open' : '') + '"><button type="button" class="prthh" data-act="prthr" data-v="' + esc(key) + '" aria-expanded="' + open + '"><span class="prthimg">' + (ph.length ? imgTag(ph[0]) : I(k.kind === 'pest' ? 'bug' : (k.kind === 'weather' ? 'cloudsun' : (k.kind === 'nutrient' ? 'leaf' : 'alert')))) + '</span><span class="prtht"><b>' + esc(k.name) + '</b><small>' + esc(t('prk_' + (k.kind || 'disease'))) + (seen === 'yes' ? ' · ' + esc(t('pr_seen_yes_s')) : (seen === 'no' ? ' · ' + esc(t('pr_seen_no_s')) : '')) + '</small></span>' + prLevel(k.level) + I('chev', 'chev') + '</button>';
  if(!open) return h + '</div>';
  h += '<div class="prthb">' + (k.watch ? '<p class="prq">' + I('eye') + '<span><b>' + esc(t('pr_watch')) + ':</b> ' + esc(k.watch) + '</span></p>' : '') + (k.why ? '<p class="prq mu">' + I('info') + '<span><b>' + esc(t('pr_why')) + ':</b> ' + esc(k.why) + '</span></p>' : '');
  if(k.kind === 'pest' || k.kind === 'disease'){
    h += '<div class="prask"><b>' + esc(t('pr_seen_q')) + '</b><div class="row" style="gap:8px"><button type="button" class="btn bsm ' + (seen === 'yes' ? 'bd' : 'bs') + '" data-act="prseen" data-v="' + esc(key) + '" data-k="yes" data-c="' + c.id + '" data-n="' + esc(k.name) + '">' + I('alert') + esc(t('pr_seen_yes')) + '</button><button type="button" class="btn bsm ' + (seen === 'no' ? 'bp' : 'bs') + '" data-act="prseen" data-v="' + esc(key) + '" data-k="no">' + I('check') + esc(t('pr_seen_no')) + '</button></div></div>';
    if(seen === 'no') h += '<div class="note g">' + I('check') + esc(t('pr_seen_no_d')) + '</div>';
    if(seen === 'yes') h += '<div class="note r">' + I('alert') + esc(t('pr_seen_yes_d')) + '</div>';
  }
  h += '<div class="prfix' + (seen === 'yes' ? ' hot' : '') + '">' + (k.organic ? '<p><b>🌿 ' + esc(t('pr_org')) + ':</b> ' + esc(k.organic) + '</p>' : '') + (k.chemical ? '<p><b>🧪 ' + esc(t('pr_chem')) + ':</b> ' + esc(k.chemical) + '</p>' : '') + (k.when ? '<p><b>⏰ ' + esc(t('pr_when')) + ':</b> ' + esc(k.when) + '</p>' : '') + '</div>';
  h += '<div class="row wrap" style="gap:8px;margin-top:10px">' + ((k.organic || k.chemical) ? '<button type="button" class="btn bs bsm" data-act="pradd" data-c="' + c.id + '" data-v="' + i + '">' + I('cal') + esc(t('pr_addplan')) + '</button>' : '') + (ref ? '<button type="button" class="btn bs bsm" data-act="pdopen" data-c="' + c.crop + '" data-k="' + ref.kind + '" data-v="' + esc(ref.id) + '">' + I('book') + esc(t('pr_more')) + '</button>' : '') + '<a class="btn bs bsm" href="#scan" data-act="scanmode" data-v="' + (k.kind === 'pest' ? 'insect' : 'leaf') + '">' + I('camera') + esc(t('pd_scan')) + '</a></div>';
  return h + '</div></div>';
}

/* =====================================================================
   v7.7 — योजना: new / upcoming scheme updates (live Google Search only)
   ===================================================================== */
S.yupd = lsGet('yupd', null); if(!S.yupd || typeof S.yupd !== 'object' || !Array.isArray(S.yupd.updates)) S.yupd = null;
S.yupdBusy = false; S.yupdAll = false;
function yUpdLoad(force){
  if(S.yupdBusy) return; var st = (S.yprof && S.yprof.state) || S.state;
  if(!force && S.yupd && S.yupd.date === isoDate(today0()) && S.yupd.lang === S.lang && S.yupd.state === st) return;
  if(!force && S.yupdTry && Date.now() - S.yupdTry < 60000) return;
  S.yupdBusy = true; S.yupdTry = Date.now(); yUpdPatch();
  fetch('/api/schemes', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mode: 'updates', state: st, lang: S.lang})})
    .then(function(r){ return r.json().catch(function(){ return {}; }); })
    .then(function(j){ S.yupdBusy = false; if(j && Array.isArray(j.updates)){ S.yupd = {date: isoDate(today0()), lang: S.lang, state: st, grounded: !!j.grounded, note: j.note || '', updates: j.updates, sources: j.sources || [], at: Date.now()}; if(j.updates.length) lsSet('yupd', S.yupd); } else S.yupd = {date: isoDate(today0()), lang: S.lang, state: st, updates: [], note: 'search_failed', at: Date.now()}; yUpdPatch(); })
    .catch(function(){ S.yupdBusy = false; S.yupd = S.yupd && S.yupd.updates.length ? S.yupd : {date: isoDate(today0()), lang: S.lang, state: st, updates: [], note: 'search_failed', at: Date.now()}; yUpdPatch(); });
}
function yUpdPatch(){ var b = $('#yupd'); if(b) b.outerHTML = yUpdates(); }
var YUKIND = {new: 'g', open: 'g', upcoming: 'b', deadline: 'r', change: 's', instalment: 'o'};
function yUpdates(){
  setTimeout(function(){ yUpdLoad(false); }, 0);
  var u = S.yupd, h = '<div class="card pad yupd" id="yupd"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><h2>' + I('fire') + esc(t('yu_h')) + '</h2><button class="xbtn" data-act="yupdref" aria-label="' + esc(t('news_refresh')) + '" title="' + esc(t('news_refresh')) + '"' + (S.yupdBusy ? ' disabled' : '') + '>' + I('refresh') + '</button></div>';
  if(S.yupdBusy && !(u && u.updates.length)) return h + '<p class="sm mu" style="margin:2px 0 10px">' + esc(t('yu_busy')) + '</p>' + loadBox(t('yu_busy_s'), 3) + '</div>';
  if(!u || !u.updates.length){ return h + '<p class="sm mu" style="margin:6px 0 0">' + esc(u && u.note === 'no_gemini' ? t('ai_off') : (u && u.note === 'search_off' ? t('yu_nosearch') : t('yu_none'))) + '</p></div>'; }
  var list = S.yupdAll ? u.updates : u.updates.slice(0, 3);
  h += '<p class="xs mu2" style="margin:2px 0 10px">' + esc(t('yu_src', {s: u.state || S.state, t: ago(u.at || Date.now())})) + '</p><div class="yulist">' + list.map(function(x){ return '<div class="yuit"><div class="row wrap" style="gap:6px;margin-bottom:4px"><span class="chip ' + (YUKIND[x.kind] || 'g') + '">' + esc(t('yk_' + x.kind)) + '</span><span class="chip">' + esc(t('yu_lv_' + x.level)) + '</span>' + (x.date ? '<span class="xs mu2">' + esc(x.date) + '</span>' : '') + '</div><b>' + esc(x.title) + '</b>' + (x.name_en && x.name_en !== x.title ? '<small class="mu"> (' + esc(x.name_en) + ')</small>' : '') + (x.what ? '<p>' + esc(x.what) + '</p>' : '') +
    (x.benefit ? '<p class="yub">' + I('rupee') + esc(x.benefit) + '</p>' : '') + (x.deadline ? '<p class="yud">' + I('clock') + esc(t('y_deadline')) + ': ' + esc(x.deadline) + '</p>' : '') + (x.link ? '<a class="btn bs bsm" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + esc(t('yu_open')) + I('ext') + '</a>' : '') + '</div>'; }).join('') + '</div>';
  if(u.updates.length > 3) h += '<button class="btn bs bsm" style="margin-top:10px" data-act="yupdall">' + esc(S.yupdAll ? t('yu_less') : t('yu_more', {n: num(u.updates.length - 3, 0)})) + '</button>';
  if(u.sources && u.sources.length) h += '<details class="ysrc" style="margin-top:10px"><summary class="xs">' + esc(t('y_sources')) + ' (' + u.sources.length + ')</summary>' + u.sources.slice(0, 10).map(function(s){ return '<a class="xs" href="' + esc(s.url || s.uri || '') + '" target="_blank" rel="noopener">' + esc(s.title || s.url || '') + '</a>'; }).join('') + '</details>';
  return h + '</div>';
}

/* =====================================================================
   v7.7 — जैविक (organic inputs) section
   ===================================================================== */
S.orgK = 'all'; S.orgQ = ''; S.orgAI = lsGet('orgai', null);
var ORGKIND = {soil: ['layers', 'g'], growth: ['sprout', 's'], pest: ['bug', 'r'], disease: ['shield', 'b'], seed: ['leaf', 'o']};
function recKind(r){ return ORGKIND[r.kind] ? r.kind : (r.base === 'seed' ? 'seed' : (r.base === 'dilute' ? 'pest' : 'soil')); }
function vOrganic(){
  var q = S.orgQ.toLowerCase(), counts = {all: RECIPES.length};
  RECIPES.forEach(function(r){ var k = recKind(r); counts[k] = (counts[k] || 0) + 1; });
  var list = RECIPES.filter(function(r){ return (S.orgK === 'all' || recKind(r) === S.orgK) && (!q || (r.n.en + ' ' + r.n.hi + ' ' + r.n.mr + ' ' + L(r.purpose)).toLowerCase().indexOf(q) > -1); });
  var h = '<div class="ph"><h1>' + esc(t('org_h2')) + '</h1><p>' + esc(t('org_d2')) + '</p></div>';
  h += orgAICard();
  h += '<div class="toolbar" style="margin-top:16px"><div class="search">' + I('search') + '<input class="inp" type="search" data-act="orgq" value="' + esc(S.orgQ) + '" placeholder="' + esc(t('org_search')) + '" aria-label="' + esc(t('org_search')) + '"></div></div>';
  h += '<div class="chips" role="group" style="margin:10px 0 14px">' + ['all', 'soil', 'growth', 'pest', 'disease', 'seed'].filter(function(k){ return counts[k]; }).map(function(k){ return '<button type="button" data-act="orgk" data-v="' + k + '" aria-pressed="' + (S.orgK === k) + '">' + (k === 'all' ? '' : I(ORGKIND[k][0])) + esc(t('ok_' + k)) + ' <span class="cnt">' + num(counts[k], 0) + '</span></button>'; }).join('') + '</div>';
  h += '<div class="note" style="margin-bottom:14px">' + I('info') + esc(t('org_note')) + '</div><div id="orglist" style="display:flex;flex-direction:column;gap:12px">' + orgList(list) + '</div>';
  return h;
}
function orgList(list){
  if(!list.length) return '<div class="empty">' + esc(t('org_none')) + '</div>';
  return list.map(function(r){ var open = S.openRecipe === r.id, k = recKind(r), ic = ORGKIND[k];
    return '<div class="rcard' + (open ? ' open' : '') + '" id="rc-' + r.id + '"><button type="button" data-act="recipe" data-v="' + r.id + '" aria-expanded="' + open + '"><span class="ico ' + ic[1] + '">' + I(ic[0]) + '</span><span class="tx"><b>' + esc(L(r.n)) + '</b><span>' + esc(L(r.purpose)) + '</span><em class="rk ' + ic[1] + '">' + esc(t('ok_' + k)) + ' · ' + esc(L(r.time)) + '</em></span>' + I('chev', 'chev') + '</button><div class="body">' + (open ? recipeBody(r) + orgPlanRow(r) : '') + '</div></div>'; }).join('');
}
function orgPlanRow(r){
  var act = S.cycles.filter(function(c){ return !cycInfo(c).done; });
  if(!act.length) return '';
  return '<div class="orgplan"><b>' + I('cal') + esc(t('org_toplan')) + '</b><div class="row wrap" style="gap:8px">' + act.slice(0, 6).map(function(c){ var cr = crop(c.crop) || CROPS[0]; return '<button type="button" class="btn bs bsm" data-act="orgadd" data-v="' + r.id + '" data-c="' + c.id + '">' + I('plus') + esc(L(cr.n) + (c.plot ? ' · ' + c.plot : '')) + '</button>'; }).join('') + '</div></div>';
}
function orgAICard(){
  var act = S.cycles.filter(function(c){ return !cycInfo(c).done; });
  var h = '<div class="aibox orgai" id="orgai"><div class="hd"><div style="display:flex;gap:12px"><span class="ico g">' + I('spark') + '</span><div><h2 style="font-size:18px">' + esc(t('org_ai_h')) + '</h2><p class="sm mu" style="margin:4px 0 0">' + esc(t('org_ai_d')) + '</p></div></div></div>';
  if(!act.length) return h + '<div class="row wrap" style="margin-top:10px"><button class="btn bs bsm" data-act="newcycle">' + I('plus') + esc(t('add_crop')) + '</button></div></div>';
  var a = S.orgAI, key = orgKey();
  if(!a || a.key !== key) return h + '<div class="row wrap" style="margin-top:10px"><button class="btn bp bsm" data-act="orgai"' + (S.sample ? '' : ' disabled') + '>' + I('spark') + esc(t('org_ai_btn')) + '</button></div></div>';
  if(a.busy) return h + '<div style="margin-top:10px">' + loadBox(t('org_ai_busy'), 3) + '</div></div>';
  if(a.err) return h + '<div class="note r" style="margin-top:10px">' + I('alert') + esc(a.err) + '</div><button class="btn bs bsm" style="margin-top:8px" data-act="orgai">' + I('refresh') + esc(t('v7_retry')) + '</button></div>';
  var d = a.data || {};
  h += '<div class="orgres">' + (d.crops || []).map(function(o){ var c = cyc(o.cid), cr = c && crop(c.crop); if(!cr) return ''; return '<div class="orgc"><div class="orgch">' + cycDot(c) + '<b>' + esc(L(cr.n) + (c.plot ? ' · ' + c.plot : '')) + '</b></div>' + (o.items || []).map(function(it){ var r = RECIPES.filter(function(x){ return x.id === it.recipe; })[0]; if(!r) return ''; return '<div class="orgit"><button type="button" class="lnk" data-act="orgopen" data-v="' + r.id + '"><b>' + esc(L(r.n)) + '</b></button><span>' + esc(it.why || '') + '</span>' + (it.when ? '<small>' + I('clock') + esc(it.when) + '</small>' : '') + '</div>'; }).join('') + '</div>'; }).join('') + '</div>';
  if(d.tip) h += '<p class="sm" style="margin:10px 0 0">👉 ' + esc(d.tip) + '</p>';
  return h + '<div class="row wrap" style="margin-top:10px"><button class="btn bs bsm" data-act="orgai">' + I('refresh') + esc(t('news_refresh')) + '</button></div></div>';
}
function orgKey(){ return isoDate(today0()) + '|' + S.lang + '|' + S.cycles.filter(function(c){ return !cycInfo(c).done; }).map(function(c){ return c.id + ':' + c.crop + ':' + c.sow; }).join(','); }
function orgAIRun(){
  if(!S.sample) return; var act = S.cycles.filter(function(c){ return !cycInfo(c).done; }).slice(0, 6); if(!act.length) return;
  var key = orgKey(); S.orgAI = {key: key, busy: true}; var b = $('#orgai'); if(b) b.outerHTML = orgAICard();
  var prompt = 'TASK: Choose organic inputs from the list below for each crop the farmer is growing now, matched to its current stage and the season.\n' +
    'Organic inputs available (id: name — purpose): ' + RECIPES.map(function(r){ return r.id + ': ' + r.n.en + ' — ' + r.purpose.en; }).join(' | ') + '\n' +
    'Crops: ' + act.map(function(c){ var x = cycInfo(c); return c.id + ' = ' + x.cr.n.en + ', day ' + x.day + ', stage ' + (x.cur ? T.en['st_' + x.cur.k] : 'not sown') + ', irrigation ' + (c.irr || 'rainfed'); }).join('; ') + '. Place: ' + place() + '.\n' +
    'For each crop pick 2 or 3 inputs ONLY from the list ids. Reply with ONLY JSON: {"crops":[{"cid":"<crop id from above>","items":[{"recipe":"<id>","why":"<one short line>","when":"<when / how often, short>"}]}],"tip":"<one practical organic tip>"}\nKeep keys and ids in English; write why, when and tip in the answer language.';
  S.sample.json(prompt, {system: sysPrompt('Reply with JSON only.'), task: 'json'}).then(function(d){ S.orgAI = {key: key, data: d || {}}; lsSet('orgai', S.orgAI); var bb = $('#orgai'); if(bb) bb.outerHTML = orgAICard(); })
    .catch(function(e){ S.orgAI = {key: key, err: aiMsg(e)}; var bb = $('#orgai'); if(bb) bb.outerHTML = orgAICard(); });
}

/* =====================================================================
   v7.7 — one polished picker for every dropdown (crops get photos, groups and search)
   The real <select> stays in the page (hidden) so forms and existing handlers keep working.
   ===================================================================== */
function pickLabel(sel){ var o = sel.options[sel.selectedIndex]; return o ? o.text : ''; }
function isCropSelect(sel){ var n = 0, tot = 0; for(var i = 0; i < sel.options.length && tot < 12; i++){ var v = sel.options[i].value; if(!v) continue; tot++; if(crop(v)) n++; } return tot > 3 && n / tot > 0.8; }
function enhanceSelect(sel){
  if(sel.__pk || sel.multiple || sel.closest('.nopick')) return; sel.__pk = true;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'pkbtn' + (sel.classList.contains('unitsel') ? ' sm' : '') + (sel.classList.contains('mksort') ? ' sm' : ''); b.setAttribute('aria-haspopup', 'listbox');
  var lab = sel.getAttribute('aria-label') || ''; if(!lab){ var lb = sel.closest('label'); if(lb) lab = (lb.firstChild && lb.firstChild.nodeType === 3 ? lb.firstChild.textContent : lb.textContent).trim().split('\n')[0]; }
  b.__lab = lab; if(lab) b.setAttribute('aria-label', lab);
  sel.classList.add('pkhid'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); sel.parentNode.insertBefore(b, sel.nextSibling); b.__sel = sel;
  syncPick(b);
  if(sel.disabled) b.disabled = true;
  sel.addEventListener('change', function(){ syncPick(b); });
}
function syncPick(b){ var sel = b.__sel; if(!sel) return; var v = sel.value, cr = isCropSelect(sel) ? crop(v) : null; b.innerHTML = (cr ? cropDot(cr) : '') + '<span class="pkv">' + esc(pickLabel(sel) || '—') + '</span>' + I('chev', 'chev'); b.disabled = sel.disabled; }
function enhanceAll(root){ var l = (root || document).querySelectorAll('select.inp'); for(var i = 0; i < l.length; i++) enhanceSelect(l[i]); }
if(window.MutationObserver){ new MutationObserver(function(ms){ for(var i = 0; i < ms.length; i++){ var m = ms[i]; for(var j = 0; j < m.addedNodes.length; j++){ var n = m.addedNodes[j]; if(n.nodeType !== 1) continue; if(n.tagName === 'SELECT' && n.classList.contains('inp')) enhanceSelect(n); else if(n.querySelector && n.querySelector('select.inp')) enhanceAll(n); } } var bs = document.querySelectorAll('.pkbtn'); for(var k = 0; k < bs.length; k++){ var s = bs[k].__sel; if(!s || !document.body.contains(s)) bs[k].remove(); else if(bs[k].previousSibling !== s) bs[k].remove(); } }).observe(document.body, {childList: true, subtree: true}); }
var pickCur = null;
function openPick(b){
  var sel = b.__sel; if(!sel || sel.disabled) return; pickCur = b; syncPick(b);
  var crops = isCropSelect(sel), items = [], n = 0;
  Array.prototype.forEach.call(sel.children, function(ch){
    if(ch.tagName === 'OPTGROUP'){ items.push({g: ch.label}); Array.prototype.forEach.call(ch.children, function(o){ items.push({o: o}); n++; }); }
    else if(ch.tagName === 'OPTION'){ items.push({o: ch}); n++; }
  });
  var search = n > 9;
  var h = '<div class="pkbg" data-act="pkclose"></div><div class="pksheet" role="dialog" aria-modal="true" aria-label="' + esc(b.__lab || '') + '"><div class="pkhd"><b>' + esc(b.__lab || t('select')) + '</b><button type="button" class="xbtn" data-act="pkclose" aria-label="' + esc(t('close')) + '">' + I('x') + '</button></div>' +
    (search ? '<div class="pksearch">' + I('search') + '<input type="search" id="pkq" placeholder="' + esc(t('pk_search')) + '" autocomplete="off" aria-label="' + esc(t('pk_search')) + '"></div>' : '') +
    '<div class="pklist" role="listbox" id="pklist">' + items.map(function(x, i){
      if(x.g != null) return '<div class="pkg" data-g="' + i + '">' + esc(x.g) + '</div>';
      var o = x.o, cr = crops ? crop(o.value) : null, on = o.selected, alt = cr ? (S.lang === 'en' ? cr.n.mr : cr.n.en) : '';
      return '<button type="button" role="option" class="pkopt' + (on ? ' on' : '') + (cr ? ' crop' : '') + '" data-act="pkpick" data-v="' + i + '" aria-selected="' + on + '"' + (o.disabled ? ' disabled' : '') + ' data-s="' + esc((o.text + ' ' + (cr ? cr.n.en + ' ' + cr.n.hi + ' ' + cr.n.mr : '')).toLowerCase()) + '">' + (cr ? cropDot(cr) : '') + '<span class="pkt"><b>' + esc(o.text || '—') + '</b>' + (alt && alt !== o.text ? '<small>' + esc(alt) + '</small>' : '') + '</span>' + (on ? I('check', 'pkck') : '') + '</button>';
    }).join('') + '<div class="pkempty" hidden>' + esc(t('org_none')) + '</div></div></div>';
  var w = document.createElement('div'); w.id = 'pickwrap'; w.innerHTML = h; w.__items = items; document.body.appendChild(w); document.body.classList.add('pkopen');
  var on = $('.pkopt.on', w); if(on) on.scrollIntoView({block: 'center'});
  var q = $('#pkq', w); if(q && window.innerWidth > 700) q.focus();
}
function closePick(){ var w = $('#pickwrap'); if(w) w.remove(); document.body.classList.remove('pkopen'); if(pickCur){ try{ pickCur.focus({preventScroll: true}); }catch(e){} } pickCur = null; }
function pickChoose(i){
  var w = $('#pickwrap'), b = pickCur; if(!w || !b) return closePick(); var x = w.__items[+i]; if(!x || !x.o) return;
  var sel = b.__sel; if(sel.value !== x.o.value){ sel.value = x.o.value; sel.dispatchEvent(new Event('input', {bubbles: true})); sel.dispatchEvent(new Event('change', {bubbles: true})); }
  if(document.body.contains(b)) syncPick(b); closePick();
}
document.addEventListener('input', function(e){
  if(e.target.id !== 'pkq') return; var q = e.target.value.trim().toLowerCase(), w = $('#pickwrap'); if(!w) return; var shown = 0;
  $$('.pkopt', w).forEach(function(o){ var hit = !q || o.getAttribute('data-s').indexOf(q) > -1; o.hidden = !hit; if(hit) shown++; });
  $$('.pkg', w).forEach(function(g){ var nx = g.nextElementSibling, any = false; while(nx && !nx.classList.contains('pkg')){ if(nx.classList.contains('pkopt') && !nx.hidden) any = true; nx = nx.nextElementSibling; } g.hidden = !any; });
  var em = $('.pkempty', w); if(em) em.hidden = shown > 0;
});

/* =====================================================================
   v7.7 — news: full-page reader inside the app (whole article, never cut)
   ===================================================================== */
S.nread = null; S.nart = {};
function openReader(id){
  var n = newsById(id); if(!n) return; S.nread = id; S.newsSheet = null; var sh = $('#nsheet'); if(sh) sh.innerHTML = '';
  var w = $('#nreader'); if(!w){ w = document.createElement('div'); w.id = 'nreader'; document.body.appendChild(w); }
  document.body.classList.add('readmode'); w.innerHTML = readerHTML(); w.scrollTop = 0;
  try{ history.pushState({nread: id}, '', location.href); }catch(e){}
  if(!S.nart[id]){
    S.nart[id] = {busy: true}; patchReader();
    fetch('/api/article?url=' + encodeURIComponent(n.url)).then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; })
      .then(function(a){ S.nart[id] = {text: String((a && a.text) || '')}; patchReader(); });
  }
}
function closeReader(fromPop){ var w = $('#nreader'); if(w) w.remove(); document.body.classList.remove('readmode'); var was = S.nread; S.nread = null; if(!fromPop){ try{ if(history.state && history.state.nread) history.back(); }catch(e){} } if(was){ var el = document.getElementById('n-' + was); if(el && route().v === 'news') el.scrollIntoView({block: 'start'}); } }
window.addEventListener('popstate', function(){ if(S.nread) closeReader(true); });
function paras(txt){ return String(txt).split(/\n{1,}/).map(function(p){ return p.trim(); }).filter(function(p){ return p.length > 1; }); }
function readerHTML(){
  var id = S.nread, n = id && newsById(id); if(!n) return '';
  var a = S.nart[id] || {}, ai = S.newsAI[id], spk = S.speakingId === 'nread' + id;
  var body = a.busy ? loadBox(t('nr_loading'), 6) : (a.text && a.text.length > 200 ? paras(a.text).map(function(p){ return '<p>' + esc(p) + '</p>'; }).join('') : (n.summary ? '<p>' + esc(n.summary) + '</p>' : '') + '<div class="note" style="margin-top:12px">' + I('info') + esc(t('nr_short')) + '</div>');
  return '<div class="nrbar"><button type="button" class="xbtn" data-act="nrclose" aria-label="' + esc(t('back')) + '">' + I('arrowl') + '</button><b>' + esc(n.source) + '</b><button type="button" class="xbtn" data-act="newsshare" data-v="' + esc(id) + '" aria-label="' + esc(t('share')) + '">' + I('share') + '</button></div>' +
    '<article class="nrart">' + (n.image ? '<div class="nrimg">' + imgTag(sized(n.image, 1280)) + '</div>' : '') +
    '<div class="nrin"><span class="rcat" style="background:' + (NEWSCOL[n.cat] || NEWSCOL.other) + '">' + esc(t('nc_' + n.cat)) + '</span><h1>' + esc(n.title) + '</h1><p class="nrmeta">' + esc(n.source) + ' · ' + esc(ago(n.date)) + '</p>' +
    '<div class="nracts">' + (S.sample ? '<button class="btn bp bsm" data-act="nrai" data-v="' + esc(id) + '">' + I('spark') + esc(t('news_ai_btn2')) + '</button>' : '') + (S.tts ? '<button class="btn bs bsm" data-act="speak" data-v="nread' + esc(id) + '">' + I(spk ? 'stop' : 'vol') + esc(spk ? t('stop') : t('listen')) + '</button>' : '') + '</div>' +
    '<div id="nrai">' + nrAI(id) + '</div><div class="nrbody">' + body + '</div>' +
    '<a class="btn bs" style="margin-top:18px;width:100%" href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(t('nr_orig', {s: n.source})) + I('ext') + '</a><div class="nrend">' + I('check') + esc(t('nr_end')) + '</div></div></article>';
}
function nrAI(id){ var ai = S.newsAI[id]; if(!ai) return ''; return '<div class="nraibox"><b>' + I('spark') + esc(t('news_ai_s')) + '</b><div class="md">' + (ai.text ? md(ai.text) : '') + (ai.busy ? '<div class="load" style="padding:4px 0"><span class="spin"></span>' + (ai.text ? '' : esc(t('thinking'))) + '</div>' : '') + (ai.err ? '<div class="note r">' + I('alert') + esc(ai.err) + '</div>' : '') + '</div></div>'; }
function patchReader(){ var w = $('#nreader'); if(!w || !S.nread) return; var st = w.scrollTop; w.innerHTML = readerHTML(); w.scrollTop = st; }

/* =====================================================================
   v7.7 — "Install app / Continue on web" screen (first visit, then every 7 days, never once installed)
   ===================================================================== */
function gateDue(){ if(isStandalone() || location.protocol === 'file:' || /[?&]nogate\b/.test(location.search)) return false; var at = lsGet('gateAt', 0); return !at || Date.now() - at > 7 * 86400000; }
function platform(){ var ua = navigator.userAgent || ''; if(/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'; if(/Android/i.test(ua)) return 'android'; return 'desktop'; }
function gateHTML(steps){
  var p = platform();
  return '<div class="gate" role="dialog" aria-modal="true" aria-labelledby="gth"><div class="gbox"><div class="glang">' + [['mr','मरा'],['hi','हिं'],['en','EN']].map(function(l){ return '<button type="button" data-act="gatelang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '">' + l[1] + '</button>'; }).join('') + '</div>' +
    '<div class="gicon"><img src="/icon-192.png" alt="" width="84" height="84"></div><h1 id="gth">' + esc(t('app')) + '</h1><p class="gsub">' + esc(t('g_sub')) + '</p>' +
    '<ul class="gfeat"><li>' + I('scan') + esc(t('g_f1')) + '</li><li>' + I('shield') + esc(t('g_f2')) + '</li><li>' + I('cal') + esc(t('g_f3')) + '</li><li>' + I('globe') + esc(t('g_f4')) + '</li></ul>' +
    (steps ? '<div class="gsteps"><b>' + esc(t('g_how')) + '</b><ol>' + (p === 'ios' ? '<li>' + esc(t('g_ios1')) + '</li><li>' + esc(t('g_ios2')) + '</li><li>' + esc(t('g_ios3')) + '</li>' : (p === 'android' ? '<li>' + esc(t('g_and1')) + '</li><li>' + esc(t('g_and2')) + '</li><li>' + esc(t('g_and3')) + '</li>' : '<li>' + esc(t('g_desk1')) + '</li><li>' + esc(t('g_desk2')) + '</li>')) + '</ol></div>' : '') +
    '<button type="button" class="btn bp glg" data-act="gateinstall">' + I('download') + esc(t('g_install')) + '</button><button type="button" class="btn bs glg" data-act="gateweb">' + I('globe') + esc(t('g_web')) + '</button><p class="xs mu2" style="margin:10px 0 0;text-align:center">' + esc(t('g_note')) + '</p></div></div>';
}
function showGate(steps){ var g = $('#gatewrap'); if(!g){ g = document.createElement('div'); g.id = 'gatewrap'; document.body.appendChild(g); } g.innerHTML = gateHTML(steps); document.body.classList.add('gated'); }
function hideGate(){ var g = $('#gatewrap'); if(g) g.remove(); document.body.classList.remove('gated'); lsSet('gateAt', Date.now()); }
function gateInstall(){ if(installEvt){ var ev = installEvt; ev.prompt(); (ev.userChoice || Promise.resolve({})).then(function(c){ if(c && c.outcome === 'accepted'){ installEvt = null; hideGate(); } else showGate(false); }); return; } showGate(true); var s = $('.gsteps'); if(s) s.scrollIntoView({block: 'center', behavior: 'smooth'}); }
window.addEventListener('appinstalled', function(){ lsSet('gateAt', Date.now()); var g = $('#gatewrap'); if(g){ g.remove(); document.body.classList.remove('gated'); } });

/* ---------- v7.7 click / change handlers ---------- */
document.addEventListener('click', function(e){
  var pb = e.target.closest && e.target.closest('.pkbtn'); if(pb){ e.preventDefault(); openPick(pb); return; }
  var el = e.target.closest && e.target.closest('[data-act]'); if(!el) return;
  var a = el.getAttribute('data-act'), v = el.getAttribute('data-v'), k = el.getAttribute('data-k'), cc = el.getAttribute('data-c');
  switch(a){
    case 'pkclose': closePick(); break;
    case 'pkpick': pickChoose(v); break;
    case 'plrun': planRun(v); break;
    case 'pladd': planSheet(v, null); break;
    case 'pledit': planSheet(v, k); break;
    case 'plsave': planSave(v, k); break;
    case 'pldel': planDel(v, k); break;
    case 'pldone': planToggle(v, k); break;
    case 'plnote': noteSheet(v, k); break;
    case 'plnotesave': noteSave(v, k); break;
    case 'plf': S.planF = v; softRender(); break;
    case 'pltoday': planGoToday(); break;
    case 'pldonetoggle': S.planDone = !S.planDone; break;
    case 'plmode': var pc = clone(cyc(v)); if(pc){ pc.plan = pc.plan || {at: 0, lang: S.lang, items: []}; pc.plan.mode = k; writeCycle(pc); softRender(); } break;
    case 'stgedit': stageSheet(v); break;
    case 'stgsave': stageSave(v); break;
    case 'stgreset': stageReset(v); break;
    case 'pdopen': e.preventDefault(); pdSheet(cc, k, v); break;
    case 'pdretry': pdRun(cc, k, v, true); break;
    case 'prday': S.prDay = +v || 0; prPatch(); break;
    case 'prthr': S.prOpen[v] = !S.prOpen[v]; prPatch(); break;
    case 'prtick': S.prUI.tick[v] = !S.prUI.tick[v]; prUISave(); el.classList.toggle('on'); el.setAttribute('aria-pressed', !!S.prUI.tick[v]); break;
    case 'prseen':
      S.prUI.seen[v] = S.prUI.seen[v] === k ? '' : k; prUISave();
      if(S.prUI.seen[v] === 'yes' && cc){ var sc = clone(cyc(cc)); if(sc){ sc.log = (sc.log || []).concat([{id: uid('r'), date: isoDate(today0()), act: 'scout', note: t('pr_log_seen', {n: el.getAttribute('data-n') || ''})}]); writeCycle(sc); toast(t('pr_logged')); } }
      prPatch(); break;
    case 'pradd': var ac = cyc(cc), rr = ac && prGet(ac), rk = rr && rr.data && rr.data.risks && rr.data.risks[+v];
      if(rk){ var todayOff = Math.max(0, cycInfo(ac).day - 1), plusD = dayWindows(0).wins.length ? 0 : 1; if(planAddQuick(cc, {day: todayOff + plusD, type: 'spray', title: rk.name, detail: rk.organic || rk.chemical || '', dose: rk.organic && rk.chemical ? rk.chemical : ''})) prPatch(); } break;
    case 'yupdref': yUpdLoad(true); break;
    case 'yupdall': S.yupdAll = !S.yupdAll; yUpdPatch(); break;
    case 'orgk': S.orgK = v; softRender(); break;
    case 'orgai': orgAIRun(); break;
    case 'orgopen': S.openRecipe = v; S.orgK = 'all'; S.orgQ = ''; render(); setTimeout(function(){ var r = document.getElementById('rc-' + v); if(r) r.scrollIntoView({block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth'}); }, 60); break;
    case 'orgadd': var rc = RECIPES.filter(function(x){ return x.id === v; })[0], oc = cyc(cc); if(rc && oc){ var kk = recKind(rc); planAddQuick(cc, {day: Math.max(0, cycInfo(oc).day), type: kk === 'pest' || kk === 'disease' ? 'spray' : 'organic', title: L(rc.n), detail: L(rc.purpose), dose: L(rc.use).slice(0, 160)}); } break;
    case 'nread': e.preventDefault(); openReader(v); break;
    case 'nrclose': closeReader(false); break;
    case 'nrai': var ex = S.newsAI[v]; if(!(ex && (ex.busy || ex.text))) runNewsAI(v); S.newsSheet = null; var shh = $('#nsheet'); if(shh) shh.innerHTML = ''; patchReader(); setTimeout(function(){ var b = $('#nrai'); if(b) b.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }, 50); break;
    case 'chatdetail': var src = S.chat[+v - 1]; if(src && src.role === 'user') sendChat(t('chat_detail_q'), true); break;
    case 'gateinstall': gateInstall(); break;
    case 'gateweb': hideGate(); break;
    case 'gatelang': S.lang = v; lsSet('lang', v); document.documentElement.lang = v; render(); showGate(!!$('.gsteps')); break;
  }
});
document.addEventListener('input', function(e){
  if(e.target.getAttribute && e.target.getAttribute('data-act') === 'orgq'){ S.orgQ = e.target.value; var q = S.orgQ.toLowerCase(); var list = RECIPES.filter(function(r){ return (S.orgK === 'all' || recKind(r) === S.orgK) && (!q || (r.n.en + ' ' + r.n.hi + ' ' + r.n.mr + ' ' + L(r.purpose)).toLowerCase().indexOf(q) > -1); }); var ol = $('#orglist'); if(ol) ol.innerHTML = orgList(list); }
});
document.addEventListener('keydown', function(e){ if((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pltx') && e.target.getAttribute('data-act')){ e.preventDefault(); e.target.click(); return; } if(e.key === 'Escape'){ if($('#pickwrap')){ closePick(); e.stopPropagation(); } else if(S.nread) closeReader(false); } }, true);

/* ---------- boot ---------- */
S.calc = {};
render();
initCaps();
window.addEventListener('resize', function(){ if(route().v === 'news'){ var rr = $('#reels'), i = reelIndex(); sizeReels(); if(rr) rr.scrollTop = i * rr.clientHeight; } });
document.addEventListener('keydown', function(e){ if(e.key === 'Enter' && e.target && e.target.id === 'placeq'){ e.preventDefault(); searchPlace(e.target.value); return; } if(route().v !== 'news' || $('#modalwrap') || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return; if(e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j'){ e.preventDefault(); reelScrollTo(reelIndex() + 1); } if(e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k'){ e.preventDefault(); reelScrollTo(Math.max(0, reelIndex() - 1)); } });
loadCropImgs();
photoLoadAll();
applyBigText();
loadWx(false);
offBanner();
setTimeout(function(){ if(gateDue()) showGate(false); }, 400); loadLib();

})();
