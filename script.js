// ── Node Definitions ─────────────────────────────────────────────────────────
const nodes = {
  splash: {
    theme: 'dark',
    image: 'jake.png',
    imageType: 'photo',
    text: 'hi kristen\nthis is definitely jake\nwould u like to go on a date',
    subtext: null,
    buttons: [
      { label: 'yes 😼', next: 'celebrate', type: 'yes' },
      { label: 'no... 😦', next: 'persuade_1', type: 'no' }
    ]
  },

  persuade_1: {
    theme: 'dark',
    image: 'p1.png',
    imageType: 'photo',
    text: 'wait really??\nare u sure, like sure sure?',
    subtext: null,
    buttons: [
      { label: 'ok fine yes 💕', next: 'celebrate', type: 'yes' },
      { label: 'still no', next: 'persuade_2', type: 'no' }
    ]
  },

  persuade_2: {
    theme: 'chaos',
    image: 'p2a.png',
    imageType: 'photo',
    text: 'ermmmmmm wait. fr?',
    subtext: null,
    noStates: [
      { text: 'are u sure?',   image: 'p2b.png' },
      { text: 'like positive?', image: 'p2c.png' },
      { text: 'ok im bringing u back\nto the start to try again', image: 'p2d.png', hideButtons: true, redirect: 'splash', redirectDelay: 2200 }
    ],
    buttons: [
      { label: 'YES ok wow yes', next: 'celebrate', type: 'yes' },
      { label: 'absolutely not', type: 'no' }
    ]
  },

  persuade_3: {
    theme: 'horror',
    image: '👁️',
    imageType: 'emoji',
    text: 'i have been\nwaiting\nfor this moment',
    subtext: '(please say yes)',
    buttons: [
      { label: 'YES 🎉 YES', next: 'celebrate', type: 'yes' },
      { label: 'fine i guess no', next: 'splash', type: 'no' }
    ]
  },

  celebrate: {
    theme: 'celebrate',
    text: 'SHE SAID YES\n!!!!!',
    subtext: 'jake is doing a little dance right now',
    buttons: [],
    onEnter: 'bounce'
  },

  schedule: {
    theme: 'dark',
    type: 'schedule'
  },

  confirmed: {
    theme: 'celebrate',
    type: 'confirmed'
  }
};

// ── Global State ──────────────────────────────────────────────────────────────
let currentNode = null;
let isTransitioning = false;
let persuade2NoIndex = 0;

let scheduleState = { selectedDays: [], times: {} };

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_KEYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES  = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

// ── Confetti ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];
let confettiActive = false;
let confettiRAF = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function startConfetti() {
  resizeCanvas();
  confettiActive = true;
  confettiParticles = [];

  const colors = ['#000', '#1a1a1a', '#333', '#555', '#888', '#bbb', '#fff',
                  '#8b0000', '#a30000', '#c0392b', '#dc143c', '#e74c3c', '#ff0000'];
  for (let i = 0; i < 160; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 200,
      w: 6 + Math.random() * 10,
      h: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3
    });
  }
  animateConfetti();
}

function animateConfetti() {
  if (!confettiActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  confettiParticles = confettiParticles.filter(p => p.y < canvas.height + 20);
  if (confettiParticles.length > 0) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiActive = false;
  }
}

function stopConfetti() {
  confettiActive = false;
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Bouncing Image ─────────────────────────────────────────────────────────────
let bounceRAF = null;
let bounceEl = null;
let bx, by, bvx, bvy, bScale, bScaleDir;
const BOUNCE_SIZE = 120;

function startBouncing() {
  const app = document.getElementById('app');
  if (!app) return;

  bounceEl = document.createElement('img');
  bounceEl.src = 'jake2.png';
  bounceEl.className = 'bounce-img';
  app.appendChild(bounceEl);

  const maxX = app.offsetWidth  - BOUNCE_SIZE;
  const maxY = app.offsetHeight - BOUNCE_SIZE;

  bx = Math.random() * maxX;
  by = Math.random() * maxY;
  bvx = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 3);
  bvy = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 3);
  bScale = 1.0;
  bScaleDir = (Math.random() < 0.5 ? 1 : -1) * 0.01;

  function animate() {
    if (!bounceEl) return;
    const app = document.getElementById('app');
    if (!app) return;

    const maxX = app.offsetWidth  - BOUNCE_SIZE;
    const maxY = app.offsetHeight - BOUNCE_SIZE;

    bx += bvx;
    by += bvy;

    if (bx <= 0)    { bvx = Math.abs(bvx);  bx = 0; }
    if (bx >= maxX) { bvx = -Math.abs(bvx); bx = maxX; }
    if (by <= 0)    { bvy = Math.abs(bvy);  by = 0; }
    if (by >= maxY) { bvy = -Math.abs(bvy); by = maxY; }

    // Random velocity nudge
    if (Math.random() < 0.02) {
      bvx += (Math.random() - 0.5) * 2;
      bvy += (Math.random() - 0.5) * 2;
      const speed = Math.sqrt(bvx * bvx + bvy * bvy);
      const clamped = Math.max(2, Math.min(speed, 8));
      if (speed > 0) { bvx = (bvx / speed) * clamped; bvy = (bvy / speed) * clamped; }
    }

    // Scale oscillation
    bScale += bScaleDir;
    if (bScale >= 1.8) { bScale = 1.8; bScaleDir = -Math.abs(bScaleDir) * (0.7 + Math.random() * 0.6); }
    if (bScale <= 0.5) { bScale = 0.5; bScaleDir =  Math.abs(bScaleDir) * (0.7 + Math.random() * 0.6); }

    bounceEl.style.left      = `${bx}px`;
    bounceEl.style.top       = `${by}px`;
    bounceEl.style.transform = `scale(${bScale})`;

    bounceRAF = requestAnimationFrame(animate);
  }

  bounceRAF = requestAnimationFrame(animate);
}

function stopBouncing() {
  if (bounceRAF) cancelAnimationFrame(bounceRAF);
  bounceRAF = null;
  if (bounceEl && bounceEl.parentNode) bounceEl.parentNode.removeChild(bounceEl);
  bounceEl = null;
}

// ── Schedule Logic ────────────────────────────────────────────────────────────
function renderSchedule() {
  const screen = document.getElementById('screen');
  screen.className = 'screen theme-dark';
  scheduleState = { selectedDays: [], times: {} };

  screen.innerHTML = `
    <div class="schedule-wrap">
      <div class="node-text" id="node-text">when are u free? 🗓️</div>
      <div class="days-row">
        ${DAY_KEYS.map((key, i) => `
          <button class="day-btn" data-key="${key}" data-name="${DAY_NAMES[key]}">${DAY_LABELS[i]}</button>
        `).join('')}
      </div>
      <div id="time-slots" class="time-slots"></div>
      <div class="schedule-footer">
        <button class="btn btn-yes schedule-submit" id="schedule-submit">ok!! 🌸</button>
      </div>
    </div>
  `;

  screen.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleDay(btn));
  });

  document.getElementById('schedule-submit').addEventListener('click', () => goTo('confirmed'));

  // Fade in title
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const text = document.getElementById('node-text');
    if (text) text.classList.add('visible');
  }));
}

function toggleDay(btn) {
  const key  = btn.getAttribute('data-key');
  const name = btn.getAttribute('data-name');

  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    scheduleState.selectedDays = scheduleState.selectedDays.filter(d => d !== key);
    delete scheduleState.times[key];
    const card = document.querySelector(`.time-slot-card[data-key="${key}"]`);
    if (card) {
      card.classList.add('collapsing');
      setTimeout(() => card.remove(), 250);
    }
  } else {
    btn.classList.add('selected');
    scheduleState.selectedDays.push(key);
    scheduleState.times[key] = new Set();
    addTimeSlotCard(key, name);
  }

  const submit = document.getElementById('schedule-submit');
  if (submit) {
    submit.style.display = scheduleState.selectedDays.length > 0 ? 'block' : 'none';
  }
}

function addTimeSlotCard(key, name) {
  const slotsEl = document.getElementById('time-slots');
  const card = document.createElement('div');
  card.className = 'time-slot-card';
  card.setAttribute('data-key', key);
  card.innerHTML = `
    <div class="time-slot-name">${name}</div>
    <div class="time-options">
      <button class="time-opt" data-time="mornings">mornings</button>
      <button class="time-opt" data-time="afternoons">afternoons</button>
      <button class="time-opt" data-time="evenings">evenings</button>
    </div>
  `;

  card.querySelectorAll('.time-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const time = opt.getAttribute('data-time');
      if (opt.classList.contains('selected')) {
        opt.classList.remove('selected');
        scheduleState.times[key].delete(time);
      } else {
        opt.classList.add('selected');
        scheduleState.times[key].add(time);
      }
    });
  });

  // Insert in weekday order
  const newIdx = DAY_KEYS.indexOf(key);
  const existing = [...slotsEl.querySelectorAll('.time-slot-card')];
  let inserted = false;
  for (const el of existing) {
    if (DAY_KEYS.indexOf(el.getAttribute('data-key')) > newIdx) {
      slotsEl.insertBefore(card, el);
      inserted = true;
      break;
    }
  }
  if (!inserted) slotsEl.appendChild(card);
}

// ── Confirmed Logic ───────────────────────────────────────────────────────────
function renderConfirmed() {
  const screen = document.getElementById('screen');
  screen.className = 'screen theme-celebrate';

  const textStr = formatSchedule();

  screen.innerHTML = `
    <div class="node-text" id="node-text">yay!! copy this and send it to definitely jake 🌹</div>
    <div class="confirmed-preview">${textStr.replace(/\n/g, '<br>')}</div>
    <button class="btn copy-btn" id="copy-btn">copy to send 📋</button>
    <div class="copied-toast" id="copied-toast">copied! ✓</div>
  `;

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(textStr).then(() => {
      const toast = document.getElementById('copied-toast');
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2000);
    });
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const text = document.getElementById('node-text');
    if (text) text.classList.add('visible');
  }));
}

function formatSchedule() {
  const lines = [];
  for (const key of DAY_KEYS) {
    if (!scheduleState.selectedDays.includes(key)) continue;
    const times = [...(scheduleState.times[key] || [])];
    if (times.length > 0) {
      lines.push(`- ${DAY_NAMES[key]} (${times.join(', ')})`);
    } else {
      lines.push(`- ${DAY_NAMES[key]}`);
    }
  }
  if (lines.length === 0) return "hey!! i'm actually free anytime 😊";
  return `hey!! i'm free:\n${lines.join('\n')}`;
}

// ── In-place text swap (persuade_2 escalation) ────────────────────────────────
function swapText(newText, hideButtons = false) {
  const textEl = document.getElementById('node-text');
  const btnsEl = document.getElementById('node-buttons');
  if (!textEl) return;

  textEl.classList.remove('visible');
  setTimeout(() => {
    textEl.innerHTML = newText.replace(/\n/g, '<br>');
    requestAnimationFrame(() => requestAnimationFrame(() => textEl.classList.add('visible')));
  }, 400);

  if (hideButtons && btnsEl) {
    btnsEl.style.transition = 'opacity 0.4s ease';
    btnsEl.style.opacity = '0';
    setTimeout(() => btnsEl.remove(), 400);
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderNode(node) {
  // Delegate special screens
  if (node.type === 'schedule')  { renderSchedule();  return; }
  if (node.type === 'confirmed') { renderConfirmed(); return; }

  const screen = document.getElementById('screen');
  if (currentNode !== 'persuade_2') persuade2NoIndex = 0;

  screen.className = `screen theme-${node.theme}`;

  let imageHTML = '';
  if (node.image) {
    if (node.imageType === 'emoji') {
      imageHTML = `<div class="node-image emoji-image" id="node-img">${node.image}</div>`;
    } else {
      imageHTML = `<img class="node-image" id="node-img" src="${node.image}" alt="" />`;
    }
  }

  const isHorror = node.theme === 'horror';
  const mainText = node.text || '';
  let textHTML = `<div class="node-text${isHorror ? ' anim-glitch' : ''}" id="node-text" data-text="${mainText}">${mainText.replace(/\n/g, '<br>')}</div>`;
  let subtextHTML = node.subtext ? `<div class="node-subtext" id="node-subtext">${node.subtext}</div>` : '';

  let buttonsHTML = '';
  if (node.buttons && node.buttons.length > 0) {
    const btnItems = node.buttons.map(b =>
      `<button class="btn btn-${b.type}" data-next="${b.next || ''}">${b.label}</button>`
    ).join('');
    buttonsHTML = `<div class="node-buttons" id="node-buttons">${btnItems}</div>`;
  }

  screen.innerHTML = imageHTML + textHTML + subtextHTML + buttonsHTML;

  screen.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-next');
      const isNo = btn.classList.contains('btn-no');

      if (currentNode === 'persuade_2' && isNo) {
        handlePersuade2No();
        return;
      }

      if (isNo) {
        const scr = btn.closest('.screen');
        scr.classList.remove('anim-shake');
        void scr.offsetWidth;
        scr.classList.add('anim-shake');
        setTimeout(() => goTo(next), 500);
      } else {
        goTo(next);
      }
    });
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const img     = document.getElementById('node-img');
    const text    = document.getElementById('node-text');
    const subtext = document.getElementById('node-subtext');
    const buttons = document.getElementById('node-buttons');

    if (img)     img.classList.add('visible');
    if (text)    text.classList.add('visible');
    if (subtext) subtext.classList.add('visible');
    if (buttons) buttons.classList.add('visible');

    if (node.onEnter === 'bounce') {
      setTimeout(startConfetti, 300);
      setTimeout(startBouncing, 200);
      // Delayed "so when are u free?" button
      setTimeout(() => {
        const scr = document.getElementById('screen');
        if (!scr) return;
        const btn = document.createElement('button');
        btn.className = 'btn btn-yes schedule-btn';
        btn.textContent = 'so when are u free? 👀';
        btn.style.opacity = '0';
        btn.style.transition = 'opacity 0.6s ease';
        btn.addEventListener('click', () => goTo('schedule'));
        scr.appendChild(btn);
        requestAnimationFrame(() => { btn.style.opacity = '1'; });
      }, 2000);
    }
  }));
}

// ── Persuade 2 escalation ─────────────────────────────────────────────────────
function handlePersuade2No() {
  const state = nodes.persuade_2.noStates[persuade2NoIndex];
  if (!state) return;

  const screen = document.getElementById('screen');
  screen.classList.remove('anim-shake');
  void screen.offsetWidth;
  screen.classList.add('anim-shake');

  swapText(state.text, state.hideButtons || false);

  if (state.image) {
    const imgEl = document.getElementById('node-img');
    if (imgEl) {
      imgEl.classList.remove('visible');
      setTimeout(() => {
        imgEl.src = state.image;
        imgEl.onload = () => imgEl.classList.add('visible');
      }, 350);
    }
  }

  if (state.redirect) {
    setTimeout(() => goTo(state.redirect), state.redirectDelay || 2000);
  } else {
    persuade2NoIndex++;
  }
}

// ── Transition ────────────────────────────────────────────────────────────────
function goTo(nodeId) {
  if (isTransitioning) return;
  const node = nodes[nodeId];
  if (!node) { console.warn('Unknown node:', nodeId); return; }

  isTransitioning = true;
  stopConfetti();
  stopBouncing();
  persuade2NoIndex = 0;

  const screen = document.getElementById('screen');
  screen.classList.add('anim-fade-out');

  setTimeout(() => {
    screen.classList.remove('anim-fade-out');
    currentNode = nodeId;
    renderNode(node);
    screen.classList.add('anim-fade-in');
    setTimeout(() => {
      screen.classList.remove('anim-fade-in');
      isTransitioning = false;
    }, 400);
  }, 300);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
goTo('splash');
