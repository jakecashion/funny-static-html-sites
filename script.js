// ── Expressions ──────────────────────────────────────────────────────────────
// rot: brow tilt in deg (+ angry, - worried)   browY: brow lift in px
// lid: % of the eye covered from the top       pupil/eyeScale: sizes
// gaze: fixed look direction [x, y] in px (overrides cursor tracking)
// loading: ms to show a spinner-only button, then auto-advance to the next expression
// button: label for the button on this step (defaults to DO NOT PRESS)
// smile: % of the eye covered from the bottom by an arched lid (happy ^ eyes)
// rotR: separate tilt for the right brow/eye (defaults to rot)
// choice: show the yes/no pair instead of the button; "yes" dodges, only "no" advances
const expressions = [
  { line: 'please do not press the button',           rot: 0,   browY: 0,   lid: 0,  pupil: 1,    eyeScale: 1 },
  { line: 'hey!! stop that',                          rot: 14,  browY: 2,   lid: 18, pupil: 0.9,  eyeScale: 1 },
  { line: '…okay. that was your one warning.',        rot: 26,  browY: 4,   lid: 34, pupil: 0.7,  eyeScale: 1 },
  { line: 'Processing order...', rot: 0,   browY: -14, lid: 0,  pupil: 0.4,  eyeScale: 1.15, loading: 2500 },
  { line: 'thanks! you just sent jake a dominos pizza.', rot: -2, browY: -8, lid: 0, smile: 40, pupil: 1.2, eyeScale: 1.05, gaze: [0, -4], button: 'what?' },
  { line: 'do you want to cancel?',                   rot: -14, browY: -4,  lid: 0,  pupil: 1.2,  eyeScale: 1, choice: true },
  { line: 'oh good! thank you i was worried you wanted to take it back for some reason', rot: -6, browY: -7, lid: 0, smile: 44, pupil: 1.15, eyeScale: 1.05, gaze: [0, -2], button: 'no fr cancel it' },
  { line: "okay it's been canceled.. here's some sad confetti. Taking the button away.",           rot: -10, browY: -6,  lid: 46, pupil: 1.1,  eyeScale: 1, gaze: [0, 0], final: true }
];

// ── Elements & state ─────────────────────────────────────────────────────────
const face = document.getElementById('face');
const line = document.getElementById('line');
const btn = document.getElementById('btn');
const eyes = face.querySelectorAll('.eye');
const frog = document.querySelector('.frog');
const choice = document.getElementById('choice');
const yesBtn = document.getElementById('yes');
const noBtn = document.getElementById('no');
let presses = 0;
let gazeOverride = null;

// ── Apply one expression to the face ─────────────────────────────────────────
// The CSS variables live on #face so brows, eyes, and lids all inherit them.
function apply(expr) {
  face.style.setProperty('--rot', expr.rot + 'deg');
  face.style.setProperty('--rot-r', (expr.rotR ?? expr.rot) + 'deg');
  face.style.setProperty('--brow-y', expr.browY + 'px');
  face.style.setProperty('--lid', expr.lid);
  face.style.setProperty('--smile', expr.smile || 0);
  face.style.setProperty('--pupil', expr.pupil);
  face.style.setProperty('--eye-scale', expr.eyeScale);
  gazeOverride = expr.gaze || null;
  if (gazeOverride) setPupils(gazeOverride[0], gazeOverride[1]);

  line.textContent = expr.line;
  line.classList.remove('shake');
  void line.offsetWidth; // restart the animation
  line.classList.add('shake');

  // Spinner-only button while loading, then move on by itself
  btn.hidden = Boolean(expr.choice || expr.final);
  choice.hidden = !expr.choice;
  btn.textContent = expr.button || 'DO NOT PRESS';
  btn.classList.toggle('loading', Boolean(expr.loading));
  btn.disabled = Boolean(expr.loading);
  if (expr.loading) setTimeout(advance, expr.loading);
}

function setPupils(x, y) {
  eyes.forEach(e => {
    e.style.setProperty('--px', x + 'px');
    e.style.setProperty('--py', y + 'px');
  });
}

// ── Eyes follow the cursor / finger ──────────────────────────────────────────
function look(clientX, clientY) {
  if (gazeOverride) return;
  eyes.forEach(e => {
    const r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const ang = Math.atan2(clientY - cy, clientX - cx);
    const d = Math.min(10, Math.hypot(clientX - cx, clientY - cy) / 6);
    e.style.setProperty('--px', Math.cos(ang) * d + 'px');
    e.style.setProperty('--py', Math.sin(ang) * d + 'px');
  });
}
document.addEventListener('mousemove', e => look(e.clientX, e.clientY));
document.addEventListener('touchmove', e => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

// ── Button ───────────────────────────────────────────────────────────────────
function advance() {
  presses = Math.min(presses + 1, expressions.length - 1);
  const expr = expressions[presses];
  apply(expr);
  if (expr.final) launchConfetti();
}
btn.addEventListener('click', advance);

// ── Yes / No ─────────────────────────────────────────────────────────────────
// "no" is the only way forward. "yes" jumps to a random spot that doesn't overlap
// the frog + lily pad, the text, or the "no" button.
noBtn.addEventListener('click', advance);

const overlaps = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

yesBtn.addEventListener('click', () => {
  // Switch to fixed positioning where it currently sits, so the move can animate
  if (!yesBtn.classList.contains('dodging')) {
    const r = yesBtn.getBoundingClientRect();
    yesBtn.style.left = r.left + 'px';
    yesBtn.style.top = r.top + 'px';
    yesBtn.classList.add('dodging');
  }
  const w = yesBtn.offsetWidth, h = yesBtn.offsetHeight, edge = 12, gap = 10;
  const avoid = [frog, line, noBtn].map(el => el.getBoundingClientRect());
  let x = edge, y = edge; // fallback: top-left corner
  for (let i = 0; i < 80; i++) {
    const tx = edge + Math.random() * (innerWidth - w - edge * 2);
    const ty = edge + Math.random() * (innerHeight - h - edge * 2);
    const box = { left: tx - gap, right: tx + w + gap, top: ty - gap, bottom: ty + h + gap };
    if (!avoid.some(a => overlaps(box, a))) { x = tx; y = ty; break; }
  }
  yesBtn.style.left = x + 'px';
  yesBtn.style.top = y + 'px';
});

// ── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const colors = ['#ff8fab', '#ffc4a3', '#b8e8d0', '#bfe3ff', '#fff0a8'];
  const bits = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height * 0.5,
    vy: 2 + Math.random() * 3,
    vx: (Math.random() - 0.5) * 2,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.size, b.size);
    });
    if (bits.some(b => b.y < canvas.height)) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

apply(expressions[0]);
