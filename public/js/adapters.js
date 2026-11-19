/* Ankurit — browser adapters: AI (via our own server), text-to-speech and voice input.
   The app calls these through window.ANK. No API key ever reaches the browser. */
(function(){
  'use strict';
  var statusP = null;
  function getStatus(){
    if(!statusP) statusP = fetch('/api/status').then(function(r){ return r.json(); }).catch(function(){ return {ai:false, vision:false}; });
    return statusP;
  }
  function err(code, message, text){ return {code: code, message: message || code, text: text}; }

  /* Downscale photos before upload: faster on mobile data, fewer tokens. */
  function shrink(blob){
    if(!window.createImageBitmap) return Promise.resolve(blob);
    return createImageBitmap(blob).then(function(bmp){
      var max = 1280, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function(res){ c.toBlob(function(b){ res(b || blob); }, 'image/jpeg', 0.85); });
    }).catch(function(){ return blob; });
  }
  function toB64(blob){
    return new Promise(function(res, rej){ var fr = new FileReader(); fr.onload = function(){ res(String(fr.result).split(',')[1]); }; fr.onerror = rej; fr.readAsDataURL(blob); });
  }
  function listImages(im){ if(!im) return []; if(im instanceof Blob) return [im]; return Array.prototype.slice.call(im); }

  async function call(input, opts, json){
    opts = opts || {};
    var st = await getStatus();
    if(!st.ai) throw err('not_granted', 'AI is not configured on the server');
    var messages = typeof input === 'string' ? [{role: 'user', content: input}] : input;
    var images = [];
    for(var f of listImages(opts.images)){ var s = await shrink(f); images.push({mime: s.type || 'image/jpeg', data: await toB64(s)}); }
    var res;
    try{
      res = await fetch('/api/ai', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({messages: messages, images: images, json: !!json}), signal: opts.signal});
    }catch(e){ if(e && e.name === 'AbortError') throw err('cancelled'); throw err('upstream_error', String(e)); }
    if(!res.ok){ var j = {}; try{ j = await res.json(); }catch(e){} throw err(j.code || (res.status === 429 ? 'rate_limited' : 'upstream_error'), j.message); }
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '', text = '';
    try{
      for(;;){
        var r = await reader.read(); if(r.done) break;
        buf += dec.decode(r.value, {stream: true});
        var i;
        while((i = buf.indexOf('\n\n')) > -1){
          var ev = buf.slice(0, i); buf = buf.slice(i + 2);
          var line = ev.split('\n').filter(function(l){ return l.indexOf('data:') === 0; }).map(function(l){ return l.slice(5).trim(); }).join('');
          if(!line) continue;
          var m = JSON.parse(line);
          if(m.error) throw err(m.error.code || 'upstream_error', m.error.message, text);
          if(m.delta){ text += m.delta; if(opts.onText){ try{ opts.onText({text: text, delta: m.delta}); }catch(e){} } }
        }
      }
    }catch(e){
      if(e && e.name === 'AbortError') throw err('cancelled', null, text);
      if(e && e.code) throw e;
      throw err('upstream_error', String(e), text);
    }
    if(!text.trim()) throw err('empty_completion');
    return {text: text, truncated: false};
  }
  function parseJSON(t){
    try{ return JSON.parse(t); }catch(e){}
    var m = t.match(/```(?:json)?\s*([\s\S]*?)```/); if(m){ try{ return JSON.parse(m[1]); }catch(e){} }
    var a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if(a > -1 && b > a){ try{ return JSON.parse(t.slice(a, b + 1)); }catch(e){} }
    throw err('invalid_json', 'Could not read the AI reply', t);
  }
  function sample(input, opts){ return call(input, opts, false); }
  sample.json = function(input, opts){ return call(input, opts, true).then(function(r){ return parseJSON(r.text); }); };
  sample.limits = function(){
    return getStatus().then(function(s){
      var out = {maxPromptBytes: 262144};
      if(s.ai && s.vision) out.images = {maxCount: 1, maxInputBytes: 20000000, mediaTypes: ['image/jpeg', 'image/png', 'image/webp']};
      return out;
    });
  };

  /* Text-to-speech with the browser's built-in voices (Hindi voice is used for Marathi when no Marathi voice exists). */
  function makeTTS(){
    if(!('speechSynthesis' in window)) return null;
    var synth = window.speechSynthesis, stopped = false;
    function pick(lang){
      var vs = synth.getVoices() || [];
      var want = {mr: ['mr-in', 'mr', 'hi-in', 'hi'], hi: ['hi-in', 'hi'], en: ['en-in', 'en-gb', 'en-us', 'en']}[lang] || ['en'];
      for(var w of want){ var v = vs.find(function(x){ return x.lang && x.lang.toLowerCase().replace('_', '-').indexOf(w) === 0; }); if(v) return v; }
      return null;
    }
    function chunks(text){
      var parts = String(text).replace(/\s+/g, ' ').split(/(?<=[.!?।])\s+/), out = [], cur = '';
      parts.forEach(function(p){ if((cur + ' ' + p).length > 220 && cur){ out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; });
      if(cur) out.push(cur); return out;
    }
    return {
      speak: function(text, o){
        var lang = (o && o.language) || document.documentElement.lang || 'en';
        synth.cancel(); stopped = false;
        var list = chunks(text), voice = pick(lang);
        return new Promise(function(res, rej){
          var idx = 0;
          function next(){
            if(stopped) return rej({code: 'viewer_stopped'});
            if(idx >= list.length) return res();
            var u = new SpeechSynthesisUtterance(list[idx++]);
            if(voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = {mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN'}[lang] || 'en-IN';
            u.rate = 0.95; u.onend = next; u.onerror = function(){ rej({code: 'error'}); };
            synth.speak(u);
          }
          next();
        });
      },
      stop: function(){ stopped = true; synth.cancel(); }
    };
  }

  /* Voice input with the Web Speech API (Chrome / Edge / Android Chrome). Needs https or localhost. */
  function makeDictation(){
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return null;
    var rec = null, onP = function(){}, onF = function(){}, onS = function(){};
    return {
      start: function(){
        rec = new SR();
        rec.lang = {mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN'}[document.documentElement.lang] || 'en-IN';
        rec.interimResults = true; rec.continuous = true;
        rec.onresult = function(e){
          var interim = '';
          for(var i = e.resultIndex; i < e.results.length; i++){ var r = e.results[i]; if(r.isFinal) onF({text: r[0].transcript.trim()}); else interim += r[0].transcript; }
          if(interim) onP({text: interim});
        };
        rec.onend = function(){ onS({state: 'idle', reason: 'stopped'}); };
        rec.onerror = function(e){ onS({state: 'idle', reason: e.error}); };
        try{ rec.start(); }catch(e){ return Promise.reject({code: 'error'}); }
        onS({state: 'listening'});
        return Promise.resolve();
      },
      stop: function(){ try{ if(rec) rec.stop(); }catch(e){} return Promise.resolve(); },
      onPartial: function(f){ onP = f; }, onFinal: function(f){ onF = f; }, onState: function(f){ onS = f; }
    };
  }

  window.ANK = {
    sample: function(){ return getStatus().then(function(s){ return s.ai ? sample : null; }); },
    tts: function(){ return makeTTS(); },
    dictation: function(){ return makeDictation(); }
  };
})();
