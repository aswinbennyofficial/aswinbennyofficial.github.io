// Shared sound: everything is synthesised (no audio files). One mute switch for the whole page.
const Sound = (function () {
  let ctx = null, muted = false;
  try { muted = JSON.parse(localStorage.getItem('farm-muted') || 'false'); } catch (e) {}
  function ac() { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function beep(freqs, dur = 0.09, type = 'square', vol = 0.05) {
    if (muted) return;
    try {
      const c = ac();
      freqs.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * dur;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
      });
    } catch (e) {}
  }
  // a meow is mostly vowel shape: a closed "m", opening through "ee" to "ow".
  // a buzzy source at cat pitch goes through three formant filters that glide like a mouth opening and closing.
  function meow(pitch = 1, len = 0.7) {
    if (muted) return;
    try {
      const c = ac(), t = c.currentTime, end = t + len;
      const src = c.createOscillator();
      src.type = 'sawtooth';
      src.frequency.setValueAtTime(560 * pitch, t);
      src.frequency.linearRampToValueAtTime(760 * pitch, t + len * 0.3);
      src.frequency.linearRampToValueAtTime(700 * pitch, t + len * 0.55);
      src.frequency.exponentialRampToValueAtTime(430 * pitch, end);
      const vib = c.createOscillator(), vibAmt = c.createGain();   // slight wobble
      vib.frequency.value = 6; vibAmt.gain.value = 12 * pitch;
      vib.connect(vibAmt).connect(src.frequency);
      const mouth = c.createBiquadFilter();                         // lips: closed for the "m", then open
      mouth.type = 'lowpass';
      mouth.frequency.setValueAtTime(350, t);
      mouth.frequency.exponentialRampToValueAtTime(4500, t + len * 0.18);
      mouth.frequency.exponentialRampToValueAtTime(1400, end);
      src.connect(mouth);
      const out = c.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
      out.gain.setValueAtTime(0.5, t + len * 0.6);
      out.gain.exponentialRampToValueAtTime(0.0001, end);
      // formants: [start (m), middle (ee/a), end (ow)] in Hz, plus loudness
      [[[350, 1000, 600], 1.0], [[1200, 2300, 1000], 0.6], [[2600, 3300, 2400], 0.25]].forEach(([[a, b, d], gain]) => {
        const f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'bandpass'; f.Q.value = 9;
        f.frequency.setValueAtTime(a, t);
        f.frequency.linearRampToValueAtTime(b, t + len * 0.35);
        f.frequency.linearRampToValueAtTime(d, end);
        g.gain.value = gain;
        mouth.connect(f).connect(g).connect(out);
      });
      // a little breath
      const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.04;
      n.buffer = buf;
      const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2500; nf.Q.value = 1;
      n.connect(nf).connect(out);
      const master = c.createGain(); master.gain.value = 0.35;
      out.connect(master).connect(c.destination);
      [src, vib, n].forEach(o => { o.start(t); o.stop(end + 0.05); });
    } catch (e) {}
  }
  // a purr: a low rumble pulsing about 25 times a second
  function purr(len = 0.9) {
    if (muted) return;
    try {
      const c = ac(), t = c.currentTime;
      const o = c.createOscillator(), lfo = c.createOscillator(), depth = c.createGain(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = 55;
      lfo.frequency.value = 24; depth.gain.value = 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.15);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      lfo.connect(depth).connect(g.gain);
      o.connect(g).connect(c.destination);
      o.start(t); lfo.start(t); o.stop(t + len); lfo.stop(t + len);
    } catch (e) {}
  }
  return {
    beep, meow, purr,
    get muted() { return muted; },
    set muted(m) { muted = m; try { localStorage.setItem('farm-muted', JSON.stringify(m)); } catch (e) {} }
  };
})();

// Bug hunt: point the laser, the cat chases it and pounces on bugs.
// Bug types unlock as you go; a few fight dirty. No timer and no losing.
(function () {
  const yard = document.getElementById('yard');
  if (!yard) return;
  const $ = id => document.getElementById(id);
  const hunter = $('hunter'), cat = $('catsvg'), laser = $('laser'), hint = $('yardHint'), bubble = $('bubble'), status = $('huntStatus');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // label, colour, unlocks after N squashes, speed multiplier, catch lines
  const TYPES = {
    nil:   { label: 'nil pointer',    color: '#b03f24', at: 0, speed: 1,   lines: ['nil? Not anymore.', 'Dereferenced.', 'Got it.'] },
    off:   { label: 'off-by-one',     color: '#6a8f3c', at: 0, speed: 1.1, lines: ['Off by none.', 'Counted it. Once.', 'Mrrp.'] },
    race:  { label: 'race condition', color: '#c47a1e', at: 3, speed: 1.4, lines: ['It split!', 'Two of them now.'] },
    half:  { label: 'race (half)',    color: '#c47a1e', at: 99, speed: 1.9, lines: ['One half down.', 'Race won.'] },
    leak:  { label: 'memory leak',    color: '#5c7fa6', at: 5, speed: .7,  lines: ['Leak plugged.', 'Garbage collected. GC is jealous.'] },
    flaky: { label: 'flaky test',     color: '#8a6aa6', at: 7, speed: 1.2, lines: ['Caught it while it was passing.', 'Not flaky now.'] },
    heisen:{ label: 'heisenbug',      color: '#2e7a5a', at: 10, speed: 1.3, lines: ["Caught it without looking at it. Big brain.", 'Observed AND squashed.'] }
  };
  const bugSvg = c => `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 12l-6-4M8 20H1M8 28l-6 4M32 12l6-4M32 20h7M32 28l6 4" stroke="#1c1a16" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="20" cy="22" rx="12" ry="14" fill="${c}"/><path d="M20 9v27" stroke="rgba(0,0,0,.35)" stroke-width="2"/><circle cx="20" cy="8" r="6" fill="#1c1a16"/><path d="M17 3l-3-4M23 3l3-4" stroke="#1c1a16" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="18" r="2.4" fill="rgba(255,255,255,.4)"/></svg>`;

  let W = 0, H = 0, running = false, last = 0, raf = 0;
  const catPos = { x: 80, y: 0 }, target = { x: 0, y: 0, on: false };
  let bugs = [], squashed = 0, best = store.get('hunt-best', 0), racePending = 0, pounceUntil = 0, facing = 1;
  const got = new Set(store.get('hunt-badges', []));

  function size() { const r = yard.getBoundingClientRect(); W = r.width; H = r.height; catPos.y = catPos.y || H - 70; }
  function catSize() { return W < 500 ? 64 : 92; }
  const edge = () => (W < 500 ? 56 : 64); // keep bugs (and their name tags) inside the clearing

  function say(text) { status.textContent = text; }
  let bubbleT;
  function speak(text) { bubble.textContent = text; bubble.classList.add('show'); clearTimeout(bubbleT); bubbleT = setTimeout(() => bubble.classList.remove('show'), 1400); }

  function award(id, name) {
    if (got.has(id)) return;
    got.add(id); store.set('hunt-badges', [...got]);
    const li = document.querySelector(`[data-badge="${id}"]`);
    if (li) { li.classList.add('got', 'new'); setTimeout(() => li.classList.remove('new'), 600); }
    $('badgecount').textContent = got.size;
    say(`Stamp collected: ${name}!`);
  }
  function renderBadges() {
    document.querySelectorAll('[data-badge]').forEach(li => li.classList.toggle('got', got.has(li.dataset.badge)));
    $('badgecount').textContent = got.size;
  }

  function spawn(type, x, y) {
    const t = TYPES[type];
    const el = document.createElement('div');
    el.className = 'bug bug-' + type;
    el.innerHTML = bugSvg(t.color) + `<span>${t.label}</span>`;
    yard.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const m = edge();
    const b = { type, el, x: x ?? m + Math.random() * (W - 2 * m), y: y ?? 30 + Math.random() * (H - 90), a, size: type === 'half' ? .75 : 1, born: performance.now(), hop: 0 };
    if (Math.hypot(b.x - catPos.x, b.y - catPos.y) < 120) b.x = catPos.x > W / 2 ? m : W - m; // don't spawn on her nose
    bugs.push(b);
    return b;
  }
  function pickType() {
    const open = Object.entries(TYPES).filter(([k, t]) => t.at <= squashed && k !== 'half').map(([k]) => k);
    const fresh = open.filter(k => TYPES[k].at > 0 && TYPES[k].at > squashed - 3); // newly unlocked types show up first
    return fresh.length && Math.random() < .6 ? fresh[Math.floor(Math.random() * fresh.length)] : open[Math.floor(Math.random() * open.length)];
  }
  const wanted = () => Math.min(2 + Math.floor(squashed / 4), 6);

  function squash(b) {
    const t = TYPES[b.type];
    b.el.classList.add('squashed');
    setTimeout(() => b.el.remove(), 400);
    bugs = bugs.filter(x => x !== b);
    squashed++;
    if (squashed > best) { best = squashed; store.set('hunt-best', best); }
    $('squashed').textContent = squashed; $('best').textContent = best;
    pounceUntil = performance.now() + 350;
    cat.classList.remove('happy'); void cat.getBoundingClientRect(); cat.classList.add('happy');
    if (typeof Sound !== 'undefined') Sound.meow(1.35, .3);
    speak(t.lines[Math.floor(Math.random() * t.lines.length)]);
    award('first', 'First bug');
    if (b.type === 'race') {
      racePending = 2;
      spawn('half', b.x - 20, b.y); spawn('half', b.x + 20, b.y);
      say('The race condition split in two. Get both!');
    } else if (b.type === 'half') {
      racePending--;
      if (racePending <= 0) award('race', 'Race won');
    } else if (b.type === 'heisen') {
      award('heisen', 'Heisenbug');
    } else {
      say(`${t.label} squashed. ${squashed} down.`);
    }
  }

  function step(now) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    const cs = catSize();
    // the cat chases the laser (or idles near the middle if it's off)
    // she aims her body (not her feet) at the dot
    const gx = target.on ? target.x : W * .5, gy = target.on ? target.y + cs * .5 : H - 60;
    const dx = gx - catPos.x, dy = gy - catPos.y, d = Math.hypot(dx, dy);
    const sp = (target.on ? 300 : 60) * (reduced ? .6 : 1);
    if (d > 4) { catPos.x += dx / d * Math.min(d, sp * dt); catPos.y += dy / d * Math.min(d, sp * dt); }
    if (Math.abs(dx) > 6) facing = dx > 0 ? -1 : 1;
    catPos.x = Math.max(cs / 2, Math.min(W - cs / 2, catPos.x));
    catPos.y = Math.max(cs * .6, Math.min(H - 10, catPos.y));
    hunter.style.transform = `translate(${catPos.x - cs / 2}px, ${catPos.y - cs}px)`;
    cat.style.transform = `scaleX(${facing})` + (now < pounceUntil ? ' translateY(-10px) scale(1.08)' : '');
    if (target.on) laser.style.transform = `translate(${target.x - 20}px, ${target.y - 20}px)`;

    const level = 1 + squashed / 10;
    for (const b of bugs) {
      const t = TYPES[b.type];
      b.a += (Math.random() - .5) * 3 * dt * 2; // wander
      // bugs nervously scurry away from the cat when she's close
      const cx = b.x - catPos.x, cy = b.y - (catPos.y - cs / 2), cd = Math.hypot(cx, cy);
      if (cd < 110) b.a = Math.atan2(cy, cx) + (Math.random() - .5) * .6;
      const v = 38 * t.speed * level * (reduced ? .6 : 1) * (cd < 110 ? 1.6 : 1);
      b.x += Math.cos(b.a) * v * dt; b.y += Math.sin(b.a) * v * dt;
      const m = edge();
      if (b.x < m || b.x > W - m) { b.a = Math.PI - b.a; b.x = Math.max(m, Math.min(W - m, b.x)); }
      if (b.y < 20 || b.y > H - 30) { b.a = -b.a; b.y = Math.max(20, Math.min(H - 30, b.y)); }
      if (b.type === 'leak') b.size = Math.min(1.9, b.size + dt * .04);
      let visible = true;
      if (b.type === 'flaky') { visible = Math.floor((now - b.born) / 1100) % 2 === 0; b.el.classList.toggle('blink', !visible); }
      if (b.type === 'heisen' && target.on && Math.hypot(b.x - target.x, b.y - target.y) < 70 && now - b.hop > 900) {
        b.hop = now; b.x = m + Math.random() * (W - 2 * m); b.y = 30 + Math.random() * (H - 90); // it knows you're looking
        b.el.classList.remove('poof'); void b.el.offsetWidth; b.el.classList.add('poof');
      }
      b.el.style.transform = `translate(${b.x - 20}px, ${b.y - 20}px) rotate(${b.a + Math.PI / 2}rad) scale(${b.size})`;
      b.el.querySelector('span').style.transform = `rotate(${-(b.a + Math.PI / 2)}rad)`;
      if (visible && cd < 40 + 12 * b.size) { squash(b); break; }
    }
    while (bugs.length < wanted() && racePending <= 0) spawn(pickType());
  }

  function start() { if (running) return; running = true; size(); last = performance.now(); raf = requestAnimationFrame(step); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  // only run while the yard is on screen (observer, plus a cheap scroll check as a fallback)
  function check() { const r = yard.getBoundingClientRect(); (r.bottom > 0 && r.top < innerHeight) ? start() : stop(); }
  new IntersectionObserver(check, { threshold: [0, .2] }).observe(yard);
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', () => { size(); check(); });
  check();

  function aim(e) {
    start();
    const r = yard.getBoundingClientRect();
    target.x = Math.max(8, Math.min(r.width - 8, e.clientX - r.left));
    target.y = Math.max(8, Math.min(r.height - 8, e.clientY - r.top));
    if (!target.on) { target.on = true; yard.classList.add('lasering'); hint.hidden = true; }
  }
  yard.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) aim(e); });
  yard.addEventListener('pointerdown', aim);
  yard.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { target.on = false; yard.classList.remove('lasering'); } });
  yard.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!k) return;
    e.preventDefault();
    if (!target.on) { target.x = catPos.x; target.y = catPos.y - 40; target.on = true; yard.classList.add('lasering'); hint.hidden = true; }
    target.x = Math.max(8, Math.min(W - 8, target.x + k[0] * 28));
    target.y = Math.max(8, Math.min(H - 8, target.y + k[1] * 28));
  });
  yard.addEventListener('blur', () => { if (!yard.matches(':hover')) { target.on = false; yard.classList.remove('lasering'); } });

  // self-check: every bug type has a label and lines
  console.assert(Object.values(TYPES).every(t => t.label && t.lines.length), 'bug types need labels and lines');
  $('best').textContent = best;
  renderBadges();
})();

// The server farm: Aswin's backend team. Tap any animal and it tells you about him from its own job.
// No timer, nothing to fail: meet all seven and you've heard the whole story.
(function () {
  const scene = document.getElementById('scene');
  if (!scene) return;
  const $ = id => document.getElementById(id);
  const world = $('world'), who = $('who'), say = $('say'), actions = $('actions'), note = $('note'), live = $('live');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const STAFF = {
    elephant: { name: 'Postgres', kind: 'the elephant', job: 'Database', rz: -52 },
    cow:      { name: 'Nginx', kind: 'the cow', job: 'Front door', rz: -38 },
    goat:     { name: 'GC', kind: 'the goat', job: 'Garbage collector', rz: -24 },
    croc:     { name: 'Redis', kind: 'the crocodile', job: 'Cache', rz: -48 },
    snake:    { name: 'Kafka', kind: 'the snake', job: 'Event stream', rz: -36 },
    fox:      { name: 'WAF', kind: 'the fox', job: 'Firewall', rz: -26 },
    gopher:   { name: 'Gopher', kind: 'the Go dev', job: 'Go services', rz: -40 }
  };
  const ORDER = Object.keys(STAFF);
  const critters = Object.fromEntries(ORDER.map(k => [k, world.querySelector(`[data-who="${k}"]`)]));

  // each animal talks about Aswin from its own job; the first line is its running joke
  const LINES = {
    elephant: [
      n => `I'm Postgres, the database. I remember everything. For the record, you've tapped me ${n} time${n === 1 ? '' : 's'}.`,
      () => "He's an Associate Software Engineer at GreedyGame, on PubScale's backend. Started as an intern. I have the records.",
      () => "He moved a 30-million-row table of mine to a new home with zero downtime. I didn't even feel it."
    ],
    cow: [
      () => "Nginx. Front door. I'd normally send you to someone else, but fine, you can stay.",
      () => 'He lives in Bangalore. Grew up in Wayanad, up in the hills of Kerala.',
      () => 'He rides a hybrid bike, early, before the city wakes up. Moo.'
    ],
    goat: [
      () => "GC. I eat whatever nobody's using. I tried eating the old versions of this site. He kept backups. Rude.",
      () => 'He treks. Uphill, sweaty, worth it for the view. Goat-approved.',
      () => 'He studied Computer Science at LPU, in Punjab.'
    ],
    croc: [
      (n, forgot) => forgot ? "Redis. Sorry, have we met? I forget things after a few seconds. It's a feature." : 'Redis, the cache. Ask me the same thing twice and I answer in a snap.',
      () => "He thinks every animal is cute. Even crocodiles. Even me. The man has taste.",
      () => '2nd place at his company hackathon, with a prototype he built in 3 days. I cached the trophy.'
    ],
    snake: [
      () => 'Kafka. Messages go in one end and come out the other. In order. Always.',
      () => 'He designed a pipeline that takes in over 7 million events a day. Relatable.',
      () => 'Before GreedyGame he did backend at a stealth startup: live updates over Redis Streams. Very hush-hush.'
    ],
    fox: [
      () => "WAF. Firewall. Sketchy requests don't get past me. You seem fine.",
      () => "He loves Fantastic Mr. Fox. That's how I got this job. Don't tell anyone.",
      () => 'He travels solo and watches way too many movies. His ratings are down the trail.'
    ],
    gopher: [
      () => 'Gopher. I write the Go that holds this whole place together.',
      () => "He builds the bits nobody notices until they break: queues, pipelines, the money stuff. Basically our boss.",
      () => 'He built SuSHi: SSH from your browser, even on your phone. My favourite project.'
    ]
  };

  // ---- sound ----
  const muteBtn = $('mute');
  function setMute(m) { Sound.muted = m; muteBtn.setAttribute('aria-pressed', m); muteBtn.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound'); }
  setMute(Sound.muted);
  muteBtn.addEventListener('click', () => setMute(!Sound.muted));
  const blip = () => Sound.beep([660], 0.05, 'square', 0.03);
  const chime = () => Sound.beep([523, 659, 784, 1047], 0.08, 'triangle', 0.05);

  // ---- camera ----
  let baseS = 1, zoom = 1, rz = -38, rx = 58;
  function fit() {
    const r = scene.getBoundingClientRect();
    // fit the floor plus the name sign into the space above the dialog box
    baseS = Math.max(0.5, Math.min(1.4, Math.min(r.width / 720, (r.height - 240) / 600)));
    cam();
  }
  function cam() {
    world.style.setProperty('--s', (baseS * zoom).toFixed(3));
    world.style.setProperty('--inv', (1 / (baseS * zoom)).toFixed(3)); // keeps nameplates readable when the scene shrinks
    world.style.setProperty('--rz', rz + 'deg');
    world.style.setProperty('--rx', rx + 'deg');
    world.style.setProperty('--ty', (110 * baseS * zoom - 80) + 'px');
  }
  addEventListener('resize', fit);
  fit();
  let dragX = null;
  if (!reduced) {
    scene.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') {
        const r = scene.getBoundingClientRect();
        world.style.setProperty('--rz', (rz + ((e.clientX - r.left) / r.width - 0.5) * 24) + 'deg');
      } else if (dragX !== null) {
        rz = Math.max(-75, Math.min(-5, rz + (e.clientX - dragX) * 0.35)); dragX = e.clientX; cam();
      }
    });
    scene.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') dragX = e.clientX; });
    addEventListener('pointerup', () => { dragX = null; });
  }
  function look(k) { rz = STAFF[k].rz; zoom = 1.06; cam(); }

  // ---- dialog ----
  let typing = null;
  function talk(k, text) {
    Object.values(critters).forEach(c => c.classList.toggle('talking', c === critters[k]));
    who.textContent = k ? `${STAFF[k].name} ${STAFF[k].kind} · ${STAFF[k].job}` : 'Forest Backend Co.';
    live.textContent = (k ? STAFF[k].name + ': ' : '') + text;
    clearInterval(typing);
    if (reduced) { say.textContent = text; return; }
    let n = 0;
    say.textContent = '';
    typing = setInterval(() => { n += 2; say.textContent = text.slice(0, n); if (n >= text.length) clearInterval(typing); }, 16);
  }
  function buttons(list) {
    const hadFocus = actions.contains(document.activeElement); // rebuilding must not drop keyboard focus
    actions.innerHTML = '';
    list.forEach(([label, fn, quiet]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = quiet ? 'text-action' : 'btn'; b.textContent = label;
      b.addEventListener('click', () => { blip(); fn(); });
      actions.appendChild(b);
    });
    if (hadFocus && actions.firstChild) actions.firstChild.focus();
  }
  function toTrail() { document.getElementById('who').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }

  // ---- interview state (remembered per browser) ----
  const met = new Set(store.get('farm-met', []));
  const step = Object.fromEntries(ORDER.map(k => [k, 0]));
  let taps = store.get('farm-taps', 0), crocLast = 0;
  function progress() {
    ORDER.forEach(k => critters[k].classList.toggle('met', met.has(k)));
    note.textContent = met.size === ORDER.length ? 'You met the whole team. Respect.' : `Met ${met.size} of ${ORDER.length}. Tap anyone to ask about Aswin.`;
  }

  function ask(k) {
    const lines = LINES[k];
    const i = step[k] % lines.length;
    step[k]++;
    if (k === 'elephant') { taps++; store.set('farm-taps', taps); }
    const forgot = k === 'croc' && Date.now() - crocLast > 5000; // Redis expires you after 5 seconds
    if (k === 'croc') crocLast = Date.now();
    look(k);
    talk(k, lines[i](taps, forgot));
    const firstMeet = !met.has(k);
    met.add(k);
    store.set('farm-met', [...met]);
    progress();
    if (firstMeet && met.size === ORDER.length) {
      chime();
      buttons([['Walk the trail', toTrail]]);
    } else {
      buttons([[`Ask ${STAFF[k].name} more`, () => ask(k)], ['Walk the trail', toTrail, true]]);
    }
  }
  ORDER.forEach(k => critters[k].addEventListener('click', () => ask(k)));

  // ---- welcome: one line, then the farm is yours to explore ----
  talk('elephant', met.size
    ? `Welcome back! We remember you. You've met ${met.size} of us so far. Tap anyone to keep the gossip going.`
    : "Welcome to Forest Backend Co. We're Aswin's backend team. Tap any of us to ask about him, or just walk the trail.");
  buttons([['Walk the trail', toTrail, true]]);
  progress();
})();

// The trail itself: sections rise into place in 3D, the cyclist rides the line, and reaching each checkpoint stamps it.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops = [...document.querySelectorAll('.stop')];
  const seen = new Set();

  if (!reduced) stops.forEach(s => { s.classList.add('rise'); if (s.getBoundingClientRect().top > innerHeight) s.classList.add('pre'); });

  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const s = en.target;
    s.classList.remove('pre');
    if (seen.has(s.id)) return;
    seen.add(s.id);
    if (!reduced) s.querySelector('.stamp')?.classList.add('stamped');
  }), { threshold: 0.2 });
  stops.forEach(s => io.observe(s));
  // the rider: position follows scroll progress through the trail; wheels turn with distance travelled
  const trail = document.querySelector('.trail'), rider = document.getElementById('rider');
  const wheels = [['wheelR', 15], ['wheelF', 57]].map(([id, cx]) => [document.getElementById(id), cx]);
  let ticking = false;
  function ride() {
    ticking = false;
    const r = trail.getBoundingClientRect();
    const travel = r.height - rider.offsetHeight - 60;
    const y = Math.max(0, Math.min(travel, innerHeight * 0.45 - r.top));
    rider.style.setProperty('--ride', y + 'px');
    const deg = (y / (2 * Math.PI * 12)) * 360; // 12 = wheel radius in svg units
    wheels.forEach(([w, cx]) => w.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} 38)`));
  }
  // wind: scrolling fast makes the trail signs sway in 3D, then they settle
  let lastY = scrollY, sway = 0, swayTimer;
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(ride); }
    if (reduced) return;
    sway = Math.max(-22, Math.min(22, (scrollY - lastY) * 0.6));
    lastY = scrollY;
    document.documentElement.style.setProperty('--sway', sway.toFixed(1) + 'deg');
    clearTimeout(swayTimer);
    swayTimer = setTimeout(() => document.documentElement.style.setProperty('--sway', '0deg'), 120);
  }, { passive: true });
  addEventListener('resize', ride);
  ride();

})();

// Fake captcha: "select all the cute animals". The trick: every animal is cute, so the answer is all of them.
// Shows once per browser; always skippable.
(function () {
  const box = document.getElementById('captcha');
  if (!box) return;
  let done = false;
  try { done = localStorage.getItem('captcha-done') === '1'; } catch (e) {}
  if (done || /[?&]nocaptcha/.test(location.search)) return;
  const msg = document.getElementById('capMsg');
  const tiles = [...box.querySelectorAll('.tile')];
  const before = document.activeElement;
  const ROASTS = {
    crocodile: 'Crocodiles are cute. Look at that smile.',
    snake: 'Snakes are cute. Little danger noodles.',
    bug: 'Bugs are cute too. (The cat down the trail thinks they are also snacks.)',
    goat: 'Goats are cute. Chaotic, but cute.',
    cow: 'Cows are cute. This is not up for debate.',
    gopher: 'The gopher is cute and writes Go. Double cute.',
    fox: 'The fox is cute and knows it.',
    elephant: 'Elephants are cute. Big, but cute.',
    cat: 'You skipped the CAT? Bold.'
  };

  function close(text) {
    try { localStorage.setItem('captcha-done', '1'); } catch (e) {}
    msg.textContent = text || '';
    setTimeout(() => { box.hidden = true; if (before && before.focus) before.focus(); }, text ? 1500 : 0);
  }
  tiles.forEach(t => t.addEventListener('click', () => {
    t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    t.classList.remove('missed');
  }));
  document.getElementById('capVerify').addEventListener('click', () => {
    const missed = tiles.filter(t => t.getAttribute('aria-pressed') !== 'true');
    msg.className = 'captcha-msg';
    if (missed.length === tiles.length) { msg.textContent = 'Bestie, you have to pick at least one.'; return; }
    if (!missed.length) {
      if (typeof Sound !== 'undefined') Sound.meow(1.3, .35);
      msg.textContent = "Correct. They're ALL cute. You're human, no cap.";
      return close(msg.textContent);
    }
    missed.forEach(t => { t.classList.remove('missed'); void t.offsetWidth; t.classList.add('missed'); });
    msg.classList.add('bad');
    const name = missed[0].dataset.name;
    msg.textContent = `You missed the ${name}. ${ROASTS[name]} Try again.`;
  });
  document.getElementById('capSkip').addEventListener('click', () => close('Fine. Bots welcome too, I guess.'));
  box.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the card
      const f = [...box.querySelectorAll('button')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  box.hidden = false;
  tiles[0].focus();
})();
