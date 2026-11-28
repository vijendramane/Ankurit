/* Ankurit service worker — keeps the app opening and showing the last good data when the network is weak or gone.
   - App files: network first (so a new deploy is seen at once), cached copy if the network is slow (>4 s) or offline.
   - GET /api/*: network first; on failure the last good answer is returned with header X-Ankurit-Stale: <saved time>.
   - POST requests, AI streaming and health checks are never cached. */
var V = 'ankurit-v7.8.0';
var SHELL = 'shell-' + V, DATA = 'data-' + V;
var FILES = ['/', '/css/style.css?v=7.8.0', '/js/adapters.js?v=7.8.0', '/js/data.js?v=7.8.0', '/js/i18n.js?v=7.8.0', '/js/app.js?v=7.8.0', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];
var NO_CACHE = /^\/api\/(ai|status|ai-check|photocands)\b/;
var MAX_DATA = 120;

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(SHELL).then(function(c){
    return Promise.all(FILES.map(function(u){ return c.add(new Request(u, {cache: 'reload'})).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== SHELL && k !== DATA; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function timeout(p, ms){ return new Promise(function(res, rej){ var t = setTimeout(function(){ rej(new Error('timeout')); }, ms); p.then(function(v){ clearTimeout(t); res(v); }, function(er){ clearTimeout(t); rej(er); }); }); }

function trim(cache){
  return cache.keys().then(function(keys){ if(keys.length <= MAX_DATA) return; return Promise.all(keys.slice(0, keys.length - MAX_DATA).map(function(k){ return cache.delete(k); })); });
}

function apiFetch(req){
  return fetch(req).then(function(res){
    if(res && res.ok){
      var copy = res.clone();
      copy.blob().then(function(b){
        var h = new Headers(copy.headers); h.set('X-Ankurit-Saved', String(Date.now()));
        return caches.open(DATA).then(function(c){ return c.put(req, new Response(b, {status: 200, headers: h})).then(function(){ return trim(c); }); });
      }).catch(function(){});
    }
    return res;
  }).catch(function(err){
    return caches.open(DATA).then(function(c){ return c.match(req); }).then(function(hit){
      if(!hit) throw err;
      return hit.blob().then(function(b){
        var h = new Headers(hit.headers); h.set('X-Ankurit-Stale', hit.headers.get('X-Ankurit-Saved') || '1');
        return new Response(b, {status: 200, headers: h});
      });
    });
  });
}

function shellFetch(req, isNav){
  var key = isNav ? '/' : req;
  var net = fetch(req).then(function(res){
    if(res && res.ok && res.type === 'basic'){ var copy = res.clone(); caches.open(SHELL).then(function(c){ c.put(key, copy); }); }
    return res;
  });
  return timeout(net, isNav ? 5000 : 4000).catch(function(){
    return caches.open(SHELL).then(function(c){ return c.match(key, {ignoreSearch: !isNav}); }).then(function(hit){ return hit || net; });
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(url.pathname.indexOf('/api/') === 0){
    if(NO_CACHE.test(url.pathname)) return;
    e.respondWith(apiFetch(req));
    return;
  }
  if(url.pathname === '/sw.js') return;
  e.respondWith(shellFetch(req, req.mode === 'navigate'));
});

self.addEventListener('message', function(e){ if(e.data === 'skip') self.skipWaiting(); });
