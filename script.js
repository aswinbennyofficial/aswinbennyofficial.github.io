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

// The trail cat: a bounded FIFO queue with one consumer who has moods.
// Hunger rises over time; eating lowers it. A stuffed cat eats slower, so the line backs up.
(function () {
  const CAP = 8;
  const $ = id => document.getElementById(id);
  const queueEl = $('queue');
  if (!queueEl) return;
  const cat = $('catsvg'), catBtn = $('catbtn'), bubble = $('bubble'), hearts = $('hearts');
  const status = $('status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fishSvg = '<svg aria-hidden="true"><use href="#fish"/></svg>';
  const heartSvg = '<svg viewBox="0 0 20 18" aria-hidden="true"><path d="M10 17S1 11 1 5.5A4.5 4.5 0 0 1 10 3a4.5 4.5 0 0 1 9 2.5C19 11 10 17 10 17z" fill="currentColor"/></svg>';

  const state = { queue: [], eaten: 0, pets: 0, hunger: 80, busy: false, asleep: false, lastPoke: Date.now(), petTimes: [] };
  let nextId = 1;

  // ---- badges (remembered per browser; the page works without storage) ----
  const BADGES = ['first', 'purr', 'golden', 'backpressure', 'nap', 'regular'];
  let got = new Set();
  try { got = new Set(JSON.parse(localStorage.getItem('trailcat-badges') || '[]')); } catch (e) {}
  function award(id, msg) {
    if (got.has(id)) return;
    got.add(id);
    try { localStorage.setItem('trailcat-badges', JSON.stringify([...got])); } catch (e) {}
    const li = document.querySelector(`[data-badge="${id}"]`);
    li.classList.add('got', 'new');
    if (!reduced) s.querySelector('.stamp')?.classList.add('stamped');
    setTimeout(() => li.classList.remove('new'), 600);
    renderBadges();
    say(`Stamp collected: ${msg}!`);
  }
  function renderBadges() {
    BADGES.forEach(id => document.querySelector(`[data-badge="${id}"]`).classList.toggle('got', got.has(id)));
    $('badgecount').textContent = got.size;
  }

  // ---- mood ----
  function mood() {
    if (state.asleep) return 'Asleep';
    if (state.hunger > 65) return 'Hungry';
    if (state.hunger > 20) return 'Content';
    return 'Stuffed';
  }
  const eatMs = () => (mood() === 'Stuffed' ? 2200 : 900); // stuffed consumer = slow consumer

  // ---- queue ----
  // returns false when the line is full (backpressure)
  function offer(gold) {
    if (state.queue.length >= CAP) return false;
    state.queue.push({ id: nextId++, gold });
    return true;
  }

  function render() {
    let html = '';
    for (let i = 0; i < CAP; i++) {
      const f = state.queue[i];
      html += f ? `<li class="fish${f.gold ? ' gold' : ''}">${fishSvg}</li>` : '<li class="slot"></li>';
    }
    queueEl.innerHTML = html;
    queueEl.classList.toggle('full', state.queue.length >= CAP);
    $('qcount').textContent = state.queue.length;
    $('eaten').textContent = state.eaten;
    $('pets').textContent = state.pets;
    $('mood').textContent = mood();
  }

  function say(msg, warn) {
    status.textContent = msg;
    status.classList.toggle('warn', !!warn);
  }
  let bubbleTimer;
  function speak(text, ms = 1600) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function flash(cls, ms) {
    cat.classList.add(cls);
    setTimeout(() => cat.classList.remove(cls), ms);
  }

  function wake() {
    state.lastPoke = Date.now();
    if (!state.asleep) return false;
    state.asleep = false;
    cat.classList.remove('asleep');
    speak('!?');
    Sound.meow(1.5, 0.25);
    render();
    return true;
  }

  function eatLoop() {
    if (state.busy || !state.queue.length || state.asleep) return;
    state.busy = true;
    cat.classList.add('eating');
    setTimeout(() => {
      const f = state.queue.shift();
      state.eaten++;
      state.hunger = Math.max(0, state.hunger - (f.gold ? 30 : 12));
      cat.classList.remove('eating');
      if (f.gold) { flash('happy', 500); speak('GOLDEN!'); Sound.meow(1.4, 0.4); award('golden', 'Golden'); }
      award('first', 'First bite');
      if (state.eaten >= 50) award('regular', 'Regular');
      render();
      const m = mood();
      if (m === 'Stuffed' && state.queue.length) say(`She's stuffed, so she's eating slower. ${state.queue.length} still waiting. That's how queues back up.`);
      else if (state.queue.length) say(`Ate fish #${f.id}. ${state.queue.length} still in line.`);
      else say(m === 'Stuffed' ? 'Line empty. She is very, very full.' : `Fish #${f.id}, gone. She's staring at you now.`);
      state.busy = false;
      setTimeout(eatLoop, 250);
    }, eatMs());
  }

  function toss(n) {
    const woke = wake();
    let accepted = 0, golds = 0;
    for (let i = 0; i < n; i++) {
      const gold = Math.random() < 0.1;
      if (offer(gold)) { accepted++; if (gold) golds++; }
    }
    render();
    const turnedAway = n - accepted;
    if (turnedAway) {
      say(`Line's full. ${turnedAway} fish turned away. That's backpressure. Slow down, she'll catch up.`, true);
      speak('TOO MANY');
      Sound.meow(0.8, 0.7);
      award('backpressure', 'Backpressure');
    } else if (golds) {
      say('A golden fish! She has definitely noticed.');
    } else if (!woke) {
      say(n === 1 ? 'Fish in line. She has noticed.' : `${n} fish in line. She is very interested.`);
    }
    eatLoop();
  }

  function pet(e) {
    if (wake()) { say('You woke her up. She forgives you. Probably.'); return; }
    const now = Date.now();
    state.petTimes = state.petTimes.filter(t => now - t < 2500).concat(now);
    if (state.petTimes.length > 6) {
      flash('swat', 700);
      speak('ENOUGH.');
      Sound.beep([220, 160], 0.1, 'sawtooth', 0.05);
      say("Okay, that's enough petting for now.", true);
      state.petTimes = [];
      return;
    }
    state.pets++;
    cat.classList.add('purring');
    clearTimeout(pet.t);
    pet.t = setTimeout(() => cat.classList.remove('purring'), 900);
    speak(state.hunger > 65 ? 'mrrp? fish?' : 'prrrr', 1100);
    if (state.hunger > 65) Sound.meow(1.3, 0.3); else Sound.purr();
    if (!reduced) spawnHeart(e);
    if (state.pets >= 10) award('purr', 'Purr');
    say(state.hunger > 65 ? 'She purrs, then glances at the bowl.' : 'Purring.');
    render();
  }

  function spawnHeart(e) {
    const box = hearts.getBoundingClientRect();
    const h = document.createElement('span');
    h.className = 'heart';
    const x = e && e.clientX ? e.clientX - box.left : box.width / 2;
    h.style.left = Math.max(0, Math.min(box.width - 20, x - 10 + (Math.random() * 30 - 15))) + 'px';
    h.style.top = box.height * 0.25 + 'px';
    h.innerHTML = heartSvg;
    hearts.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }

  // eyes follow the pointer
  if (!reduced) {
    const pupils = cat.querySelector('.pupils');
    addEventListener('pointermove', e => {
      const r = cat.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.35);
      const d = Math.hypot(dx, dy) || 1;
      pupils.style.transform = `translate(${(dx / d) * 2.5}px, ${(dy / d) * 2}px)`;
    }, { passive: true });
  }

  // she only meows when you can see her
  let catVisible = false;
  new IntersectionObserver(([e]) => { catVisible = e.isIntersecting; }, { threshold: 0.25 }).observe(document.querySelector('.cat-yard'));
  function meow(text, pitch) {
    flash('meow', 700);
    speak(text, 1300);
    Sound.meow(pitch || (state.hunger > 90 ? 0.95 : 1.1));
  }

  // the clock: hunger rises, idle cats nap, hungry cats meow
  setInterval(() => {
    if (!state.asleep) state.hunger = Math.min(100, state.hunger + 1.5);
    const idle = Date.now() - state.lastPoke;
    if (!state.asleep && !state.queue.length && !state.busy && idle > 20000) {
      state.asleep = true;
      cat.classList.add('asleep');
      say('Nobody was paying attention, so she fell asleep. Tap her or toss a fish.');
      award('nap', 'Nap time');
    } else if (!state.asleep && catVisible && state.hunger > 65 && !state.queue.length && !state.busy && Math.random() < 0.3) {
      meow(state.hunger > 90 ? 'MEOW!' : 'meow?');
    }
    render();
  }, 1500);

  catBtn.addEventListener('click', pet);
  $('toss').addEventListener('click', () => toss(1));
  $('burst').addEventListener('click', () => toss(12));

  // self-check: the line is FIFO and bounded
  (function () {
    for (let i = 0; i < CAP + 3; i++) offer(false);
    console.assert(state.queue.length === CAP, 'line should cap at', CAP);
    console.assert(state.queue[0].id < state.queue[1].id, 'line should be FIFO');
    state.queue.length = 0; nextId = 1;
  })();
  renderBadges();
  render();
})();


// The server farm: the animals introduce themselves; play the incident game and every 3 fixes one of them tells you something about Aswin.
(function () {
  const scene = document.getElementById('scene');
  if (!scene) return;
  const $ = id => document.getElementById(id);
  const world = $('world'), dialog = $('dialog'), who = $('who'), say = $('say'), actions = $('actions');
  const hud = $('hud'), timer = $('timer'), timerbar = $('timerbar'), live = $('live');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const STAFF = {
    elephant: { name: 'Postgres', kind: 'the elephant', job: 'Database', does: 'remembers everything, forever', rz: -52 },
    cow:      { name: 'Nginx', kind: 'the cow', job: 'Front door', does: 'herds incoming traffic across the servers', rz: -38 },
    goat:     { name: 'GC', kind: 'the goat', job: 'Garbage collector', does: 'eats anything nobody is using anymore', rz: -24 },
    croc:     { name: 'Redis', kind: 'the crocodile', job: 'Cache', does: 'answers the same questions in a snap', rz: -48 },
    snake:    { name: 'Kafka', kind: 'the snake', job: 'Event stream', does: 'carries messages end to end, in order', rz: -36 },
    fox:      { name: 'Vault', kind: 'the fox', job: 'Security', does: 'checks every ID and guards every secret', rz: -26 },
    gopher:   { name: 'Gopher', kind: 'the Go dev', job: 'Go services', does: 'writes the code that ties it all together', rz: -40 }
  };
  const ORDER = ['elephant', 'cow', 'goat', 'croc', 'snake', 'fox', 'gopher'];
  const critters = Object.fromEntries(ORDER.map(k => [k, world.querySelector(`[data-who="${k}"]`)]));

  const INTRO = [
    ['elephant', "Oh hey, a visitor! Welcome to Aswin's server farm. Animals run everything here. I'm Postgres, the database. I never forget. Ever."],
    ['cow', "Moo. Nginx. Front door. I herd the traffic so no server gets trampled."],
    ['goat', "GC. Garbage collector. If nobody's using it, I'm eating it."],
    ['croc', "Redis. Cache. Ask me twice and I'll answer in a snap."],
    ['snake', "Kafka. Messages go in one end and out the other. In order. Always."],
    ['fox', "Vault. Security. I check IDs and keep secrets. A few of them are about Aswin."],
    ['gopher', "Gopher. I write the Go that holds this whole place together."],
    ['elephant', "Want the tea on Aswin? Play a quick game. Stuff breaks, you send the right one of us to fix it. Every 3 fixes, someone spills."]
  ];
  const FACTS = [
    ['cow', "He lives in Bangalore. Grew up in Wayanad, up in the hills of Kerala."],
    ['gopher', "He builds backend systems: pipelines, queues, the bits that move money around. Basically, he's our boss."],
    ['goat', "He climbs hills for fun. Treks, long walks, early bike rides. Respect."],
    ['elephant', "He's an Associate Software Engineer at GreedyGame, on PubScale's backend. Started there as an intern."],
    ['croc', "He thinks every animal is cute. Even me. The man has taste."],
    ['elephant', "He moved a 30-million-row Postgres table and nobody noticed. Zero downtime. I remember every row."],
    ['fox', "He loves Fantastic Mr. Fox. That's how I got this job. Don't tell anyone."],
    ['snake', "He designed a pipeline that swallows 7 million+ events a day. Relatable."],
    ['snake', "He travels solo and watches way too many movies. His ratings are down the trail."],
    ['fox', "Before GreedyGame he was at a stealth startup. I'd tell you more, but, you know. Stealth."],
    ['gopher', "He built SuSHi: SSH from your browser, even on your phone. It's on his GitHub."],
    ['croc', "2nd place at his company hackathon, with a prototype he built in 3 days."],
    ['elephant', "Computer Science at LPU, Punjab. Oh, and there's a cat down the trail. Go say hi, she's lowkey the main character."]
  ];
  const INCIDENTS = [
    ['elephant', 'Queries are crawling. Someone forgot an index.'],
    ['elephant', 'A customer says their order history vanished.'],
    ['elephant', 'A report takes 40 seconds to load.'],
    ['elephant', 'Two tables disagree about how many users exist.'],
    ['elephant', 'Someone ran DELETE without a WHERE. We need yesterday\'s backup.'],
    ['cow', 'Traffic just went 10x. One server is melting while the others nap.'],
    ['cow', 'Every request is hitting the same poor server.'],
    ['cow', 'A flash sale just started. Everyone arrived at once.'],
    ['cow', 'One server died and requests keep getting sent to it anyway.'],
    ['cow', 'Users in one region are getting all the lag.'],
    ['goat', 'Memory keeps creeping up and never comes back down.'],
    ['goat', 'The app freezes for a moment every few minutes, then recovers.'],
    ['goat', 'Old sessions from last year are still hogging memory.'],
    ['goat', 'Thousands of abandoned uploads are filling up storage.'],
    ['goat', 'Leftover temp files have filled the whole disk.'],
    ['croc', 'The homepage asks the database for the same data 1,000 times a second.'],
    ['croc', 'Every page load recalculates the same leaderboard from scratch.'],
    ['croc', 'Prices changed an hour ago but users still see the old ones.'],
    ['croc', 'The product page takes 2 seconds, and its data barely ever changes.'],
    ['croc', 'Every user\'s profile is fetched fresh on every single click.'],
    ['snake', 'Messages are arriving faster than anyone can read them.'],
    ['snake', 'Two services are shouting at each other directly. They need a go-between.'],
    ['snake', 'Welcome emails are being sent twice.'],
    ['snake', 'Orders are being processed out of order.'],
    ['snake', 'A slow payment service is making every request wait. Let the work line up instead.'],
    ['fox', 'Someone is trying 10,000 passwords a minute.'],
    ['fox', 'A login token from 2019 just showed up. Suspicious.'],
    ['fox', 'Someone signed up with the name "; DROP TABLE users;".'],
    ['fox', 'An API key was pushed to a public repo.'],
    ['fox', 'Someone can see other people\'s accounts by changing the ID in the URL.'],
    ['gopher', 'Product wants a new API endpoint by Friday.'],
    ['gopher', 'A bug in the code applies the discount twice.'],
    ['gopher', 'A function panics on an empty list. Someone forgot a nil check.'],
    ['gopher', 'The build is red. A test is failing on main.'],
    ['gopher', 'A loop makes one database call per item. Rewrite it to batch.']
  ];

  // ---- sound effects (shared Sound module) ----
  const muteBtn = $('mute');
  function setMute(m) { Sound.muted = m; muteBtn.setAttribute('aria-pressed', m); muteBtn.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound'); }
  setMute(Sound.muted);
  muteBtn.addEventListener('click', () => setMute(!Sound.muted));
  const beep = Sound.beep;
  const sfx = {
    blip: () => beep([660], 0.05, 'square', 0.03),
    right: () => beep([523, 659, 784], 0.07),
    wrong: () => beep([180, 140], 0.12, 'sawtooth', 0.04),
    alarm: () => beep([880, 660], 0.08, 'square', 0.03),
    down: () => beep([300, 200, 120], 0.14, 'sawtooth', 0.05),
    level: () => beep([523, 659, 784, 1047], 0.09, 'triangle', 0.06)
  };

  // ---- camera ----
  let baseS = 1, zoom = 1, rz = -38, rx = 58;
  function fit() {
    const r = scene.getBoundingClientRect();
    // fit the floor plus the name sign into the space between the HUD and the dialog box
    baseS = Math.max(0.5, Math.min(1.4, Math.min(r.width / 720, (r.height - 280) / 600)));
    cam();
  }
  function cam() {
    world.style.setProperty('--s', (baseS * zoom).toFixed(3));
    world.style.setProperty('--inv', (1 / (baseS * zoom)).toFixed(3)); // keeps nameplates readable when the scene shrinks
    world.style.setProperty('--rz', rz + 'deg');
    world.style.setProperty('--rx', rx + 'deg');
    world.style.setProperty('--ty', (110 * baseS * zoom - 60) + 'px');
  }
  addEventListener('resize', fit);
  fit();
  let mouseRz = 0, dragX = null;
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
  function look(k, z) { rz = STAFF[k].rz; zoom = z || 1.08; cam(); }
  function lookHome() { rz = -38; zoom = 1; cam(); }

  // ---- dialog ----
  let typing = null;
  function talk(k, text, { alert = false, label } = {}) {
    Object.values(critters).forEach(c => c.classList.toggle('talking', c === critters[k]));
    scene.classList.toggle('scene-dim', !!k && !alert);
    dialog.classList.toggle('alert', alert);
    who.textContent = label || (k ? `${STAFF[k].name} ${STAFF[k].kind} · ${STAFF[k].job}` : '');
    live.textContent = (k ? STAFF[k].name + ': ' : '') + text;
    clearInterval(typing);
    if (reduced) { say.textContent = text; return; }
    let n = 0;
    say.textContent = '';
    typing = setInterval(() => { n += 2; say.textContent = text.slice(0, n); if (n >= text.length) clearInterval(typing); }, 16);
  }
  const note = $('note');
  function feedback(text, bad) {
    note.textContent = text;
    note.classList.toggle('bad', !!bad);
    live.textContent = text;
  }
  function buttons(list, focusTo) {
    const hadFocus = actions.contains(document.activeElement); // rebuilding must not drop keyboard focus
    actions.innerHTML = '';
    list.forEach(([label, fn, quiet]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn' + (quiet ? ' btn-quiet' : ''); b.textContent = label;
      b.addEventListener('click', () => { sfx.blip(); fn(); });
      actions.appendChild(b);
    });
    if (hadFocus) (focusTo || actions.firstChild)?.focus();
  }

  // ---- intro ----
  let step = 0;
  function intro() {
    const [k, text] = INTRO[step];
    note.textContent = '';
    look(k);
    talk(k, text);
    const last = step === INTRO.length - 1;
    buttons(last ? [['Play to get to know me', startGame], ['Just walk the trail', toTrail, true]]
                 : [['Next', () => { step++; intro(); }], ['Skip intro', () => { step = INTRO.length - 1; intro(); }, true]]);
  }
  function toTrail() { document.getElementById('who').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }

  // ---- the game ----
  const racks = [...world.querySelectorAll('.rack')];
  const g = { on: false, score: 0, lives: 3, level: 1, combo: 1, solved: 0, inc: null, raf: 0, facts: store.get('farm-facts', 0) };
  function hudRender() {
    $('score').textContent = g.score;
    $('level').textContent = g.level;
    $('combo').textContent = 'x' + g.combo;
    const toNext = g.solved % 3;
    document.querySelectorAll('#nextbar i').forEach((el, i) => el.classList.toggle('on', i < toNext));
    $('nextbar').setAttribute('aria-valuenow', toNext);
    $('lives').innerHTML = [0, 1, 2].map(i => `<svg class="pip${i < g.lives ? '' : ' off'}" viewBox="0 0 12 16" aria-hidden="true"><rect x="1" y="1" width="10" height="14" rx="1"/><circle cx="6" cy="5" r="1.6"/></svg>`).join('') + `<span class="sr-only">${g.lives} of 3 servers up</span>`;
  }
  function startGame() {
    Object.assign(g, { on: true, score: 0, lives: 3, level: 1, combo: 1, solved: 0 });
    racks.forEach(r => r.classList.remove('down', 'alarm'));
    hud.hidden = false; timer.hidden = false;
    scene.classList.add('playing');
    lookHome();
    hudRender();
    nextIncident();
  }
  const limit = () => Math.max(3, 9 - (g.level - 1) * 1.2); // seconds per incident, shrinking each level
  function nextIncident() {
    const up = racks.filter(r => !r.classList.contains('down'));
    // shuffle-bag: every incident comes up once before any repeats
    if (!g.bag || !g.bag.length) g.bag = INCIDENTS.slice().sort(() => Math.random() - 0.5);
    const [owner, text] = g.bag.pop();
    const rack = up[Math.floor(Math.random() * up.length)];
    racks.forEach(r => r.classList.remove('alarm'));
    rack.classList.add('alarm');
    g.inc = { owner, rack, t0: performance.now(), ms: limit() * 1000 };
    arm(g.inc.ms);
    talk(null, text, { alert: true, label: `Incident · level ${g.level}` });
    feedback(`Who fixes this? ${coarse ? 'Tap' : 'Click or press 1-7 for'} the right animal.`);
    live.textContent = `Incident: ${text} Who fixes this?`;
    buttons([['Stop playing', () => gameOver(true), true]], critters[ORDER[0]]); // focus the animals, not the quit button
    sfx.alarm();
    cancelAnimationFrame(g.raf);
    tick();
  }
  // the deadline is a plain timer; animation frames only draw the bar
  function arm(ms) { clearTimeout(g.deadline); g.deadline = setTimeout(timeout, Math.max(0, ms)); }
  function tick() {
    if (!g.on || !g.inc) return;
    const left = 1 - (performance.now() - g.inc.t0) / g.inc.ms;
    timerbar.style.transform = `scaleX(${Math.max(0, left)})`;
    g.raf = requestAnimationFrame(tick);
  }
  function timeout() {
    if (!g.on || !g.inc) return;
    g.inc.rack.classList.remove('alarm');
    g.inc.rack.classList.add('down');
    g.lives--; g.combo = 1; g.inc = null;
    sfx.down();
    hudRender();
    if (g.lives <= 0) return gameOver();
    talk(null, 'Too slow. A server went down. That one\'s an L. The animals are judging you.', { alert: true, label: 'Server down' });
    feedback(`${g.lives} of 3 servers still up.`, true);
    setTimeout(() => g.on && nextIncident(), 1400);
  }
  function assign(k) {
    if (!g.on || !g.inc) return;
    const c = critters[k];
    if (k === g.inc.owner) {
      const left = Math.max(0, 1 - (performance.now() - g.inc.t0) / g.inc.ms);
      g.score += 100 * g.combo + Math.round(left * 100);
      g.combo = Math.min(5, g.combo + 1);
      g.solved++;
      g.inc.rack.classList.remove('alarm');
      g.inc = null;
      clearTimeout(g.deadline);
      c.classList.add('right'); setTimeout(() => c.classList.remove('right'), 600);
      hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
      sfx.right();
      hudRender();
      if (g.solved % 3 === 0) return levelUp(); // a new fact every 3 answers
      talk(k, `${STAFF[k].name} fixed it. ${['Easy.', 'W.', 'Clean.', 'We love to see it.', 'Slay.'][Math.floor(Math.random() * 5)]} Combo x${g.combo}.`, { alert: false });
      feedback(`${3 - (g.solved % 3)} more fix${3 - (g.solved % 3) === 1 ? '' : 'es'} until the next secret.`);
      setTimeout(() => g.on && nextIncident(), 700);
    } else {
      g.combo = 1;
      g.inc.t0 -= 1000; // wrong page costs a second
      arm(g.inc.ms - (performance.now() - g.inc.t0));
      c.classList.add('wrong'); setTimeout(() => c.classList.remove('wrong'), 700);
      sfx.wrong();
      hudRender();
      feedback(`${STAFF[k].name} looks at the problem, then at you. Not a ${STAFF[k].job.toLowerCase()} problem. Try again.`, true);
    }
  }
  function levelUp() {
    cancelAnimationFrame(g.raf);
    clearTimeout(g.deadline);
    g.level++;
    hudRender();
    sfx.level();
    let k, text;
    if (g.facts < FACTS.length) {
      [k, text] = FACTS[g.facts];
      g.facts++;
      store.set('farm-facts', g.facts);
      text = `Level ${g.level}! ${text}`;
    } else {
      [k, text] = FACTS[Math.floor(Math.random() * FACTS.length)];
      text = `Level ${g.level}! You've heard all our gossip. A rerun: ${text}`;
    }
    look(k);
    feedback(`Secret ${g.facts} of ${FACTS.length} unlocked.`);
    talk(k, text); // last, so screen readers announce the fact itself
    timerbar.style.transform = 'scaleX(1)';
    buttons([['Keep playing', () => { lookHome(); nextIncident(); }], ['Read the rest on the trail', () => { gameOver(true); toTrail(); }, true]]);
  }
  function gameOver(quit) {
    g.on = false; g.inc = null;
    clearTimeout(g.deadline);
    cancelAnimationFrame(g.raf);
    racks.forEach(r => r.classList.remove('alarm'));
    timer.hidden = true;
    scene.classList.remove('playing');
    const best = store.get('farm-best', 0);
    const isBest = g.score > best;
    if (isBest) store.set('farm-best', g.score);
    look('elephant', 1);
    talk('elephant', quit && g.score === 0
      ? 'Stopped already? No judgement. Well, a little.'
      : `${quit ? 'Game over' : 'Game over. Every server is down, it\'s giving outage'}. Score ${g.score}${isBest ? ' (a new best!)' : `, best ${Math.max(best, g.score)}`}. Secrets unlocked: ${g.facts} of ${FACTS.length}. I'll remember where you left off.`);
    const verdictLine = live.textContent;
    feedback(g.facts < FACTS.length ? 'Play again for more secrets.' : 'You know everything we know. Honestly impressive.');
    live.textContent = verdictLine + ' ' + note.textContent;
    buttons([['Play again', startGame], ['Walk the trail', toTrail, true]]);
    if (!quit) sfx.down();
  }

  ORDER.forEach((k, i) => critters[k].addEventListener('click', () => {
    if (g.on) return assign(k);
    look(k);
    talk(k, `I'm ${STAFF[k].name}, ${STAFF[k].kind}. ${STAFF[k].job}: I ${STAFF[k].does}. Play the game and I might spill something about Aswin.`);
    buttons([['Play to get to know me', startGame], ['Hear the intro again', () => { step = 0; intro(); }, true]]);
  }));
  addEventListener('keydown', e => {
    if (!g.on || e.target.closest('input, textarea')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= ORDER.length) { e.preventDefault(); assign(ORDER[n - 1]); }
  });

  // self-checks
  console.assert(INCIDENTS.every(([o]) => STAFF[o]) && FACTS.every(([o]) => STAFF[o]), 'every line needs a speaker on staff');
  intro();
})();

// The trail itself: sections rise into place in 3D, signs tilt toward the pointer, and reaching each checkpoint stamps it.
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops = [...document.querySelectorAll('.stop')];
  const names = { who: 'Hello', trail: 'Work', cat: 'Cat', find: 'Summit' };
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<p>Trail<b id="trailcount">0/${stops.length}</b></p><ol>${stops.map(s => `<li data-stop="${s.id}" title="${names[s.id] || s.id}"></li>`).join('')}</ol>`;
  document.body.appendChild(bar);
  const seen = new Set();

  if (!reduced) stops.forEach(s => { s.classList.add('rise'); if (s.getBoundingClientRect().top > innerHeight) s.classList.add('pre'); });

  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const s = en.target;
    s.classList.remove('pre');
    if (seen.has(s.id)) return;
    seen.add(s.id);
    const li = bar.querySelector(`[data-stop="${s.id}"]`);
    li.classList.add('got', 'new');
    if (!reduced) s.querySelector('.stamp')?.classList.add('stamped');
    bar.querySelector('#trailcount').textContent = seen.size === stops.length ? 'Done!' : `${seen.size}/${stops.length}`;
  }), { threshold: 0.2 });
  stops.forEach(s => io.observe(s));
  // show the trail counter once you leave the farm
  const hero = document.querySelector('.hero');
  new IntersectionObserver(([e]) => bar.classList.toggle('on', !e.isIntersecting), { threshold: 0.15 }).observe(hero);

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

  if (!reduced && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.wayside li, .sushi, .cat-yard').forEach(el => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${y * -10}deg) translateZ(10px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();

// Fake captcha: "sus traffic detected", build the PC to get in. Shows once; always skippable.
(function () {
  const box = document.getElementById('captcha');
  if (!box) return;
  let done = false;
  try { done = localStorage.getItem('captcha-done') === '1'; } catch (e) {}
  if (done || /[?&]nocaptcha/.test(location.search)) return;
  const msg = document.getElementById('capMsg');
  const parts = [...box.querySelectorAll('.part')], slots = [...box.querySelectorAll('.slot')];
  const before = document.activeElement;
  let picked = null, placed = 0;
  const NOPE = ["nah, that's not it chief", 'respectfully, no', "it's giving wrong slot", 'close. but no'];

  function close(text) {
    try { localStorage.setItem('captcha-done', '1'); } catch (e) {}
    msg.textContent = text || '';
    setTimeout(() => { box.hidden = true; if (before && before.focus) before.focus(); }, text ? 1300 : 0);
  }
  function pick(p) {
    parts.forEach(x => x.setAttribute('aria-pressed', x === p ? 'true' : 'false'));
    picked = p;
    msg.className = 'captcha-msg';
    msg.textContent = `${p.dataset.part.toUpperCase()} selected. Where does it go?`;
  }
  function drop(slot) {
    if (slot.classList.contains('filled')) return;
    if (!picked) { msg.textContent = 'Pick a part first, bestie.'; return; }
    if (picked.dataset.part !== slot.dataset.slot) {
      slot.classList.remove('nope'); void slot.offsetWidth; slot.classList.add('nope');
      msg.className = 'captcha-msg bad';
      msg.textContent = NOPE[Math.floor(Math.random() * NOPE.length)];
      return;
    }
    slot.classList.add('filled');
    slot.innerHTML = picked.querySelector('svg').outerHTML;
    slot.setAttribute('aria-label', picked.dataset.part.toUpperCase() + ' installed');
    picked.classList.add('used');
    picked.setAttribute('aria-pressed', 'false');
    picked = null;
    placed++;
    msg.className = 'captcha-msg';
    if (placed === slots.length) {
      if (typeof Sound !== 'undefined') Sound.beep([523, 659, 784, 1047], 0.08, 'triangle', 0.05);
      close("PC built. You're human, no cap. Come on in.");
    } else {
      msg.textContent = ['Clean.', 'Slay.', 'Okay, engineer.'][placed - 1] || 'Nice.';
      const next = parts.find(x => !x.classList.contains('used'));
      if (next) next.focus();
    }
  }
  parts.forEach(p => p.addEventListener('click', () => pick(p)));
  slots.forEach(sl => sl.addEventListener('click', () => drop(sl)));
  document.getElementById('capSkip').addEventListener('click', () => close("Fine. Bots welcome too, I guess."));
  box.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the card
      const f = [...box.querySelectorAll('button:not(.used):not([disabled])')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  box.hidden = false;
  parts[0].focus();
})();
