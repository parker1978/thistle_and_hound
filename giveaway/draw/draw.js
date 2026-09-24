(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const body = document.body;
  const params = new URLSearchParams(location.search);
  const DEMO = params.has('demo');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const safe = storage => ({
    get: key => { try { return storage().getItem(key); } catch { return null; } },
    set: (key, value) => { try { value === null ? storage().removeItem(key) : storage().setItem(key, value); } catch { /* private mode */ } }
  });
  const local = safe(() => localStorage);
  const session = safe(() => sessionStorage);
  const state = {key: session.get('th-staff-key'), events: [], event: null, entrants: [], draws: [], latest: null, busy: false, sound: local.get('th-draw-sound') !== 'off'};
  const scenes = {idle: $('scene-idle'), count: $('scene-count'), reel: $('scene-reel'), win: $('scene-win')};

  // ---------- Sound (synthesized, so there are no audio files to load) ----------
  const audio = (() => {
    let ctx;
    let noise;
    const ready = () => {
      if (!state.sound) return null;
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (!noise) {
        noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      return ctx;
    };
    const tone = (freq, start, length, {type = 'triangle', gain = .12, slide} = {}) => {
      const c = ready(); if (!c) return;
      const t = c.currentTime + start;
      const osc = c.createOscillator(); const amp = c.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + length);
      amp.gain.setValueAtTime(0.0001, t); amp.gain.exponentialRampToValueAtTime(gain, t + .01); amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(amp).connect(c.destination); osc.start(t); osc.stop(t + length + .02);
    };
    const hiss = (start, length, {gain = .12, from = 400, to = 3000, q = 1.2} = {}) => {
      const c = ready(); if (!c) return;
      const t = c.currentTime + start;
      const src = c.createBufferSource(); src.buffer = noise;
      const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = q;
      filter.frequency.setValueAtTime(from, t); filter.frequency.exponentialRampToValueAtTime(to, t + length);
      const amp = c.createGain(); amp.gain.setValueAtTime(0.0001, t); amp.gain.exponentialRampToValueAtTime(gain, t + .02); amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
      src.connect(filter).connect(amp).connect(ctx.destination); src.start(t); src.stop(t + length + .02);
    };
    return {
      unlock: () => ready(),
      tick: () => tone(1900, 0, .035, {type: 'square', gain: .035}),
      whoosh: () => hiss(0, .9, {gain: .22, from: 300, to: 5000}),
      boing: () => { tone(520, 0, .28, {type: 'sine', gain: .2, slide: 180}); hiss(0, .08, {gain: .12, from: 180, to: 120}); },
      drumroll: seconds => { for (let t = 0; t < seconds; t += .045) hiss(t, .05, {gain: .05 + .1 * (t / seconds), from: 160, to: 140, q: .8}); },
      fanfare: () => {
        [[523, 0], [659, .12], [784, .24], [1047, .36]].forEach(([f, s]) => tone(f, s, .3, {gain: .13}));
        [523, 659, 784, 1047].forEach(f => tone(f, .55, 1.4, {gain: .07}));
        for (let i = 0; i < 10; i++) tone(1400 + Math.random() * 1600, .7 + i * .09, .18, {type: 'sine', gain: .04});
      }
    };
  })();

  // ---------- Confetti: paws, bones, hearts and ribbons ----------
  const confetti = (() => {
    const canvas = $('confetti'); const g = canvas.getContext('2d');
    const colors = ['#e8b64c', '#f6dc93', '#c58fbf', '#9b5f93', '#8fb58f', '#5f8a66', '#fbf6ec', '#e98a6a'];
    let parts = []; let running = false; let dpr = 1;
    const size = () => { dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);
    const shapes = {
      paw: s => { g.beginPath(); g.ellipse(0, s * .25, s * .42, s * .36, 0, 0, 7); g.fill(); [[-.46, -.18], [-.17, -.46], [.17, -.46], [.46, -.18]].forEach(([x, y]) => { g.beginPath(); g.arc(x * s, y * s, s * .19, 0, 7); g.fill(); }); },
      bone: s => { g.fillRect(-s * .5, -s * .14, s, s * .28); [[-.5, -.16], [-.5, .16], [.5, -.16], [.5, .16]].forEach(([x, y]) => { g.beginPath(); g.arc(x * s, y * s, s * .2, 0, 7); g.fill(); }); },
      heart: s => { g.beginPath(); g.moveTo(0, s * .4); g.bezierCurveTo(-s * .8, -s * .1, -s * .35, -s * .7, 0, -s * .25); g.bezierCurveTo(s * .35, -s * .7, s * .8, -s * .1, 0, s * .4); g.fill(); },
      ribbon: s => g.fillRect(-s * .5, -s * .16, s, s * .32),
      dot: s => { g.beginPath(); g.arc(0, 0, s * .32, 0, 7); g.fill(); }
    };
    const kinds = ['paw', 'paw', 'bone', 'heart', 'ribbon', 'ribbon', 'ribbon', 'dot'];
    const add = (x, y, angle, spread, speed, count) => {
      for (let i = 0; i < count; i++) {
        const a = angle + (Math.random() - .5) * spread; const v = speed * (.45 + Math.random() * .75);
        parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: (10 + Math.random() * 16) * dpr,
          c: colors[Math.random() * colors.length | 0], k: kinds[Math.random() * kinds.length | 0], w: Math.random() * 6, life: 0, flip: Math.random() * 6});
      }
      if (!running) { running = true; requestAnimationFrame(frame); }
    };
    function frame() {
      g.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter(p => p.y < canvas.height + 60 && p.life < 900);
      for (const p of parts) {
        p.life++; p.vy += .16 * dpr; p.vx *= .985; p.vy *= .985; p.w += .08;
        p.x += p.vx + Math.sin(p.w) * .6 * dpr; p.y += p.vy; p.r += p.vr; p.flip += .12;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.abs(Math.cos(p.flip)) * .6 + .4); g.fillStyle = p.c; shapes[p.k](p.s); g.restore();
      }
      if (parts.length) requestAnimationFrame(frame); else { running = false; g.clearRect(0, 0, canvas.width, canvas.height); }
    }
    return {
      celebrate() {
        const w = canvas.width; const h = canvas.height; const n = reduced ? 40 : 1;
        if (reduced) { add(w / 2, h * .4, -Math.PI / 2, Math.PI * 2, 8 * dpr, n); return; }
        add(0, h, -Math.PI / 3.2, .7, 26 * dpr, 150);
        add(w, h, -Math.PI + Math.PI / 3.2, .7, 26 * dpr, 150);
        add(w / 2, h * .42, -Math.PI / 2, Math.PI * 2, 15 * dpr, 80);
        let bursts = 0;
        const rain = setInterval(() => { add(Math.random() * w, -30, Math.PI / 2, .6, 3 * dpr, 16); if (++bursts > 22) clearInterval(rain); }, 140);
      },
      clear() { parts = []; }
    };
  })();

  // ---------- Background floaters ----------
  (() => {
    const icons = ['paw', 'paw', 'bone', 'heart', 'ball', 'thistle', 'thistle'];
    const tints = ['var(--gold-soft)', 'var(--plum-200)', 'var(--green-200)', 'var(--sand-50)'];
    const box = $('floaters');
    const count = reduced ? 0 : Math.round(Math.min(22, innerWidth / 70));
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'floater';
      const icon = icons[i % icons.length];
      el.style.cssText = `--x:${Math.random() * 100}%;--s:${22 + Math.random() * 38}px;--c:${tints[i % tints.length]};--o:${icon === 'ball' || icon === 'thistle' ? .5 : .16 + Math.random() * .14};--t:${18 + Math.random() * 22}s;--d:${-Math.random() * 40}s;--r:${(Math.random() - .5) * 540}deg`;
      el.innerHTML = `<svg><use href="#i-${icon}"/></svg>`;
      box.appendChild(el);
    }
  })();

  // ---------- Data ----------
  const DEMO_DOGS = [['Maple', 'Taylor E.'], ['Biscuit', 'Jordan P.'], ['Olive', 'Sam R.'], ['Pickles', 'Morgan L.'], ['Waffles', 'Casey B.'], ['Juniper', 'Riley K.'], ['Moose', 'Avery D.'], ['Pepper', 'Quinn H.'], ['Tater Tot', 'Jamie S.'], ['Luna', 'Drew M.'], ['Gus', 'Alex T.'], ['Clover', 'Robin W.'], ['Noodle', 'Parker J.'], ['Hazel', 'Emerson C.'], ['Bear', 'Rowan F.'], ['Daisy', 'Skyler N.'], ['Ziggy', 'Jesse V.'], ['Poppy', 'Harper G.'], ['Chewie', 'Reese A.'], ['Bean', 'Charlie O.'], ['Winnie', 'Finley Y.'], ['Rocket', 'Sage Q.'], ['Mochi', 'Blake Z.'], ['Fig', 'Dakota I.'], ['Otis', 'Kendall U.'], ['Pretzel', 'River X.'], ['Sadie', 'Hayden E.'], ['Scout', 'Micah R.'], ['Beau', 'Jules P.'], ['Nacho', 'Lane B.'], ['Ruby', 'Ellis M.'], ['Toast', 'Arden S.'], ['Bruno', 'Remy L.'], ['Peaches', 'Shay K.'], ['Kona', 'Tatum H.'], ['Dumpling', 'Wren D.']];
  const demoEvent = {id: 'demo', name: 'Sample drawing (demo)', closesAt: new Date(Date.now() - 1000).toISOString(), status: 'open'};

  async function api(path, options = {}) {
    const response = await fetch(path, {...options, headers: {'content-type': 'application/json', authorization: 'Bearer ' + state.key}});
    if (response.status === 401) { signOut('That staff key didn’t work. Please sign in again.'); throw new Error('Please sign in again.'); }
    if (options.raw && response.ok) return response;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  async function loadEvents() {
    if (DEMO) { state.events = [demoEvent]; }
    else state.events = (await api('/api/admin/events')).events;
    const select = $('event-select');
    select.innerHTML = '';
    for (const e of state.events) {
      const option = document.createElement('option');
      option.value = e.id; option.textContent = e.name + (e.entries === undefined ? '' : ` (${e.entries})`);
      select.appendChild(option);
    }
    const wanted = params.get('event') || (window.GIVEAWAY_CONFIG || {}).defaultEvent;
    const pick = state.events.find(e => e.id === wanted) || state.events[0];
    if (!pick) { toast('No events yet. Add one to the database first.'); return; }
    select.value = pick.id;
    await loadEvent(pick.id, true);
  }

  async function loadEvent(id, choosePractice) {
    if (DEMO) {
      state.event = demoEvent;
      const drawn = new Set(state.draws.map(d => d.id));
      state.entrants = DEMO_DOGS.map(([petName, owner], i) => ({id: 'demo-' + i, petName, owner})).filter(e => !drawn.has(e.id));
    } else {
      const data = await api('/api/admin/entrants?event=' + encodeURIComponent(id));
      state.event = data.event; state.entrants = data.entrants; state.draws = data.draws;
    }
    if (choosePractice) $('practice').checked = DEMO || Date.now() < Date.parse(state.event.closesAt);
    $('practice').disabled = DEMO;
    $('event-label').textContent = state.event.name;
    updateMode();
    renderIdle();
    renderStaff();
  }

  // ---------- Idle scene ----------
  let rotation;
  function renderIdle() {
    const cloud = $('tag-cloud');
    cloud.innerHTML = '';
    clearInterval(rotation);
    const pool = shuffle(state.entrants);
    $('count').textContent = pool.length;
    $('count-label').textContent = pool.length === 1 ? 'pup in the running' : 'pups in the running';
    const rect = cloud.getBoundingClientRect();
    const cols = Math.max(2, Math.round(rect.width / 190)); const rows = Math.max(3, Math.round(rect.height / 58));
    const cells = shuffle(Array.from({length: cols * rows}, (_, i) => i)).slice(0, Math.min(pool.length, Math.round(cols * rows * .72)));
    const tints = ['var(--green-500)', 'var(--plum-400)', 'var(--gold)', 'var(--clay-500)', 'var(--green-300)'];
    const shown = [];
    cells.forEach((cell, i) => {
      // Keep tags (roughly 170px wide) fully inside the cloud on narrow screens.
      const padX = Math.min(40, 90 / rect.width * 100); const padY = Math.min(30, 22 / rect.height * 100);
      const x = padX + ((cell % cols) + .5 + (Math.random() - .5) * .5) / cols * (100 - 2 * padX);
      const y = padY + (Math.floor(cell / cols) + .5 + (Math.random() - .5) * .4) / rows * (100 - 2 * padY);
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.style.cssText = `--x:${x}%;--y:${y}%;--r:${(Math.random() - .5) * 14}deg;--i:${i};--b:${2.2 + Math.random() * 2}s;--d:${-Math.random() * 3}s;--c:${tints[i % tints.length]};` +
        `--tx:${rect.width / 2 - x / 100 * rect.width}px;--ty:${rect.height / 2 - y / 100 * rect.height}px`;
      tag.innerHTML = '<span class="tag-inner"><b></b><small></small></span>';
      fillTag(tag, pool[i]);
      cloud.appendChild(tag); shown.push(tag);
    });
    // With more entrants than space, gently cycle names so everyone appears on screen.
    if (pool.length > shown.length && !reduced) {
      let next = shown.length;
      rotation = setInterval(() => {
        const tag = shown[Math.random() * shown.length | 0];
        tag.classList.add('swap');
        setTimeout(() => { fillTag(tag, pool[next++ % pool.length]); tag.classList.remove('swap'); }, 380);
      }, 700);
    }
    $('fetch').disabled = !pool.length;
  }
  function fillTag(tag, entrant) {
    tag.querySelector('b').textContent = entrant.petName;
    tag.querySelector('small').textContent = entrant.owner;
  }

  // ---------- The draw ----------
  function setScene(name) {
    for (const [key, el] of Object.entries(scenes)) el.hidden = key !== name;
    body.classList.remove('is-idle', 'is-count', 'is-reel', 'is-win');
    body.classList.add('is-' + name);
    $('again').hidden = $('reset').hidden = name !== 'win';
  }

  async function startDraw() {
    if (state.busy || !state.event) return;
    if (!state.entrants.length) { toast('There are no eligible entries left to draw.'); return; }
    state.busy = true;
    audio.unlock();
    $('toast').hidden = true;
    $('controls').classList.remove('open'); $('controls-toggle').setAttribute('aria-expanded', 'false');
    $('fetch').disabled = true;
    $('staff').hidden = true;
    const practice = $('practice').checked;
    let result;
    try {
      if (DEMO) {
        const winner = state.entrants[Math.floor(Math.random() * state.entrants.length)];
        result = {practice: true, winner, poolSize: state.entrants.length, drawnAt: new Date().toISOString(), contact: {name: winner.owner.replace('.', '') + ' (sample)', email: 'sample@example.com', phone: '+14025550100', city: 'Omaha'}};
      } else {
        result = await api('/api/admin/draw', {method: 'POST', body: JSON.stringify({eventId: state.event.id, practice})});
      }
    } catch (error) {
      toast(error.message); state.busy = false; $('fetch').disabled = false; return;
    }
    state.latest = result;
    const pool = state.entrants;
    try {
      await vortex();
      await countdown();
      await spin(result.winner, pool);
      reveal(result);
    } finally {
      state.busy = false;
    }
    if (!result.practice) {
      if (!DEMO) {
        try { const data = await api('/api/admin/entrants?event=' + encodeURIComponent(state.event.id)); state.entrants = data.entrants; state.draws = data.draws; } catch (error) { toast(error.message); }
      }
    } else if (DEMO) {
      state.draws.push({...result.winner, number: state.draws.length + 1, drawnAt: result.drawnAt, contact: result.contact, sample: true});
      state.entrants = state.entrants.filter(e => e.id !== result.winner.id);
    }
    renderStaff();
  }

  async function vortex() {
    clearInterval(rotation);
    audio.whoosh();
    body.classList.add('is-vortex');
    await wait(reduced ? 150 : 1300);
    body.classList.remove('is-vortex');
  }

  async function countdown() {
    setScene('count');
    const ball = document.querySelector('.count-ball');
    audio.drumroll(reduced ? 1 : 2.6);
    for (const n of [3, 2, 1]) {
      $('count-num').textContent = n;
      ball.classList.remove('drop'); void ball.offsetWidth; ball.classList.add('drop');
      setTimeout(audio.boing, reduced ? 0 : 380);
      await wait(reduced ? 350 : 880);
    }
  }

  async function spin(winner, pool) {
    setScene('reel');
    const reel = $('reel'); const track = $('reel-track');
    reel.classList.remove('landed');
    track.innerHTML = ''; track.style.transform = 'translateY(0)'; track.style.filter = '';
    const source = pool.length ? pool : [winner];
    const count = reduced ? 10 : Math.max(38, Math.min(64, source.length * 3));
    const items = [];
    let order = shuffle(source);
    while (items.length < count) { items.push(order[items.length % order.length]); if (items.length % order.length === 0) order = shuffle(source); }
    // Don't let the winner flash by in the final stretch before landing.
    const others = source.filter(e => e.id !== winner.id);
    if (others.length) for (let i = count - 4; i < count; i++) if (items[i].id === winner.id) items[i] = others[i % others.length];
    const landing = items.length;
    items.push(winner, others.length ? others[0] : winner);
    for (const [i, e] of items.entries()) {
      const row = document.createElement('div');
      row.className = 'reel-item' + (i === landing ? ' win' : '');
      row.innerHTML = '<b></b><small></small>';
      row.querySelector('b').textContent = e.petName;
      row.querySelector('small').textContent = 'with ' + e.owner;
      track.appendChild(row);
    }
    await wait(reduced ? 50 : 350);
    const rowHeight = track.firstElementChild.getBoundingClientRect().height;
    const target = (landing - 1) * rowHeight;
    const overshoot = rowHeight * .38;
    const duration = reduced ? 1400 : 6800;
    const pointers = [...document.querySelectorAll('.pointer')];
    await new Promise(resolve => {
      const start = performance.now(); let lastRow = 0; let lastPos = 0; let lastTime = start;
      const frame = now => {
        const p = Math.min(1, (now - start) / duration);
        let pos;
        if (p < .9) pos = (target + overshoot) * (1 - Math.pow(1 - p / .9, 4));
        else { const q = (p - .9) / .1; pos = target + overshoot * (1 - (q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2)); }
        const speed = Math.abs(pos - lastPos) / Math.max(1, now - lastTime);
        lastPos = pos; lastTime = now;
        track.style.transform = `translateY(${-pos}px)`;
        track.style.filter = reduced ? '' : `blur(${Math.min(5, speed * 1.1).toFixed(2)}px)`;
        const rowNow = Math.round(pos / rowHeight);
        if (rowNow !== lastRow) {
          lastRow = rowNow; audio.tick();
          for (const el of pointers) { el.classList.remove('nudge'); void el.getBoundingClientRect(); el.classList.add('nudge'); }
        }
        if (p < 1) requestAnimationFrame(frame); else { track.style.filter = ''; resolve(); }
      };
      requestAnimationFrame(frame);
    });
    reel.classList.add('landed');
    await wait(reduced ? 200 : 900);
  }

  function reveal(result) {
    const pet = $('win-pet');
    pet.innerHTML = '';
    Array.from(result.winner.petName).forEach((ch, n) => {
      const span = document.createElement('span');
      span.className = 'ch'; span.style.setProperty('--n', n);
      span.textContent = ch === ' ' ? ' ' : ch;
      pet.appendChild(span);
    });
    $('win-owner').textContent = 'with ' + result.winner.owner;
    $('win-sub').textContent = result.practice ? 'Practice round · not an official result' : 'Congratulations! We’ll be in touch soon.';
    $('flash').classList.remove('go'); void $('flash').offsetWidth; $('flash').classList.add('go');
    setScene('win');
    audio.fanfare();
    setTimeout(() => confetti.celebrate(), reduced ? 0 : 250);
  }

  function backToIdle() {
    if (state.busy) return;
    confetti.clear();
    setScene('idle');
    renderIdle();
  }

  // ---------- Staff panel ----------
  function contactCard(entry, contact, label) {
    const card = document.createElement('div');
    card.className = 'staff-card';
    const lines = [['strong', entry.petName + ' · ' + contact.name]];
    if (label) lines.unshift(['span', label]);
    card.innerHTML = '';
    for (const [tag, text] of lines) { const el = document.createElement(tag); el.textContent = text; if (tag === 'span') el.className = 'tag-note'; card.appendChild(el); card.appendChild(document.createElement('br')); }
    const add = (text, href) => { const p = document.createElement('p'); if (href) { const a = document.createElement('a'); a.href = href; a.textContent = text; p.appendChild(a); } else p.textContent = text; card.appendChild(p); };
    add(contact.email, 'mailto:' + contact.email);
    add(contact.phone, 'tel:' + contact.phone);
    add([contact.city, entry.breed, entry.size].filter(Boolean).join(' · '));
    return card;
  }
  function renderStaff() {
    const latest = $('staff-latest'); latest.innerHTML = '';
    if (state.latest) latest.appendChild(contactCard(state.latest.winner, state.latest.contact, state.latest.practice ? 'Latest · practice, not recorded' : 'Latest · official winner'));
    else latest.innerHTML = '<p class="staff-note">No winner drawn in this session yet.</p>';
    const list = $('staff-history'); list.innerHTML = '';
    list.hidden = !state.draws.length;
    $('staff-empty').hidden = !!state.draws.length;
    for (const d of state.draws) {
      const li = document.createElement('li');
      li.appendChild(contactCard(d, d.contact, new Date(d.drawnAt).toLocaleString('en-US', {dateStyle: 'medium', timeStyle: 'short'}) + (d.poolSize ? ` · from ${d.poolSize} entries` : '')));
      list.appendChild(li);
    }
  }

  // ---------- Controls ----------
  function updateMode() {
    const practice = $('practice').checked;
    $('mode-badge').hidden = !practice;
    $('mode-badge').textContent = DEMO ? 'Demo · sample dogs' : 'Practice round';
  }
  let idleTimer;
  function wake() {
    const controls = $('controls'); const toggle = $('controls-toggle');
    controls.classList.remove('away'); toggle.classList.remove('away');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (controls.matches(':hover, :focus-within') || controls.classList.contains('open')) return;
      controls.classList.add('away'); toggle.classList.add('away');
    }, 3000);
  }
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 5000);
  }
  function setSound(on) {
    state.sound = on; local.set('th-draw-sound', on ? 'on' : 'off');
    $('sound').textContent = on ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(on));
  }
  function signOut(message) {
    state.key = null; session.set('th-staff-key', null);
    $('signin').hidden = false;
    $('signin-error').hidden = !message; $('signin-error').textContent = message || '';
    $('key').focus();
  }
  async function exportCsv() {
    if (DEMO) { toast('Export is available once you sign in with the staff key.'); return; }
    try {
      const response = await api('/api/admin/export?event=' + encodeURIComponent(state.event.id), {raw: true});
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement('a'); a.href = url; a.download = state.event.id + '-entries.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) { toast(error.message); }
  }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }

  $('fetch').addEventListener('click', startDraw);
  $('again').addEventListener('click', () => { backToIdle(); setTimeout(startDraw, 700); });
  $('reset').addEventListener('click', backToIdle);
  $('practice').addEventListener('change', updateMode);
  $('event-select').addEventListener('change', e => { state.latest = null; loadEvent(e.target.value, true).catch(error => toast(error.message)); });
  $('sound').addEventListener('click', () => setSound(!state.sound));
  $('fullscreen').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  $('hide').addEventListener('click', () => { $('controls').classList.add('gone'); $('controls-toggle').classList.add('gone'); toast('Controls hidden. Press H (or tap the top-left logo) to bring them back.'); });
  $('controls-toggle').addEventListener('click', () => {
    const open = $('controls').classList.toggle('open');
    $('controls-toggle').setAttribute('aria-expanded', String(open)); wake();
  });
  document.querySelector('.top .brand').addEventListener('click', () => { $('controls').classList.remove('gone'); $('controls-toggle').classList.remove('gone'); wake(); });
  $('staff-open').addEventListener('click', () => { renderStaff(); $('staff').hidden = false; $('staff-close').focus(); });
  $('staff-close').addEventListener('click', () => { $('staff').hidden = true; });
  $('export').addEventListener('click', exportCsv);
  $('signout').addEventListener('click', () => signOut());
  addEventListener('mousemove', wake); addEventListener('touchstart', wake, {passive: true});
  addEventListener('resize', () => { if (body.classList.contains('is-idle') && state.event) renderIdle(); });
  addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea, button') && e.key !== 'Escape') return;
    if (!$('signin').hidden) return;
    const key = e.key.toLowerCase();
    if (key === ' ' || key === 'enter') { e.preventDefault(); body.classList.contains('is-win') ? backToIdle() : body.classList.contains('is-idle') && startDraw(); }
    else if (key === 'h') { const hidden = $('controls').classList.toggle('gone'); $('controls-toggle').classList.toggle('gone', hidden); if (!hidden) wake(); }
    else if (key === 'f') $('fullscreen').click();
    else if (key === 'm') setSound(!state.sound);
    else if (key === 'escape') $('staff').hidden = true;
  });
  $('signin-form').addEventListener('submit', async e => {
    e.preventDefault();
    state.key = $('key').value.trim();
    $('signin-error').hidden = true;
    try {
      await loadEvents();
      session.set('th-staff-key', state.key);
      $('signin').hidden = true; $('key').value = '';
    } catch (error) {
      if (state.key) { $('signin-error').textContent = error.message; $('signin-error').hidden = false; }
    }
  });

  setSound(state.sound);
  setScene('idle');
  wake();
  if (DEMO || state.key) loadEvents().catch(error => toast(error.message));
  else signOut();
})();
