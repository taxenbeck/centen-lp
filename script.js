const form = document.querySelector('#waitlist-form');
const status = document.querySelector('#form-status');
// Brevo signup form URL (Contacts → Forms → Share → "Embed" HTML, the <form action="…sibforms.com/serve/…">).
const waitlistEndpoint = 'https://0c77da1f.sibforms.com/serve/MUIFAM4BngZqaxqSKPM52-DrQQeLfLaVI5ci-8-YVsRzcgNuahUVoEWnyESQqexB-3DHAPhE-VxYGcuDfRyDQkRkhxmAlPbBZn6eNSZQE4MjYuGMYE7OSv0ZHaz5Ps5zgLeossh0Kvpped6USmFf9M7HStTtgGVFUE7fS9IAB9cWQOPNtIZhRzfRfRdG6oEakYA9fyeqQu9W_c8Asg==';

document.querySelector('#year').textContent = new Date().getFullYear();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = form.elements.EMAIL;
  if (!email.validity.valid) {
    status.textContent = 'Please enter a valid email address.';
    email.focus();
    return;
  }
  const data = new FormData(form);
  if (data.get('email_address_check')) return; // honeypot filled: quietly ignore bots
  if (!waitlistEndpoint) {
    localStorage.setItem('centen-waitlist-preview', JSON.stringify({ ...Object.fromEntries(data), submittedAt: new Date().toISOString() }));
    form.reset();
    status.textContent = 'Preview saved on this device. Connect the waitlist service to start collecting registrations.';
    return;
  }
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    // isAjax=1 makes Brevo answer with JSON instead of redirecting to its own success page.
    const response = await fetch(`${waitlistEndpoint}?isAjax=1`, { method: 'POST', body: data });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) throw new Error('Waitlist submission failed');
    form.reset();
    status.textContent = 'Almost there: please confirm the email we just sent you.';
  } catch {
    status.textContent = 'Something went wrong. Please try again in a moment.';
  } finally {
    button.disabled = false;
  }
});

const dialog = document.querySelector('#explainer');
document.querySelectorAll('[data-open-explainer]').forEach((button) => button.addEventListener('click', () => dialog.showModal()));
document.querySelectorAll('[data-close-explainer]').forEach((button) => button.addEventListener('click', () => dialog.close()));

// Tree (A2 §5.1a colours): a glass sphere whose tree takes on each new colour from the trunk out (tree-sphere.js).
const LEVELS = [
  ['Sage', '#9DB7A6'], ['Mint', '#4FA383'], ['Forest', '#2E6A4F'], ['Teal', '#2A8C8C'],
  ['Petrol', '#1F6F7F'], ['Ocean', '#2F6FA8'], ['Indigo', '#3F51A0'], ['Lavender', '#7B6CC4'],
  ['Violet', '#6E4A9A'], ['Plum', '#7E3F7E'], ['Berry', '#9A3D6A'], ['Ruby', '#B33A3A'],
  ['Coral', '#D0644A'], ['Copper', '#B8622E'], ['Amber', '#D08A2A'], ['Gold', '#E0B53A'],
].map(([name, color]) => ({ name, color }));
const PALETTE = LEVELS.map((l) => l.color);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The sphere needs WebGL2; without it a soft glass circle stands in.
function sphere(canvas, opts) {
  try { return new TreeSphere(canvas, { palette: PALETTE, ...opts }); } catch { canvas.classList.add('tree-fallback'); return null; }
}

function buildPath(el) {
  el.innerHTML = LEVELS.map((l, i) => `<span style="--c:${l.color}" title="${i + 1} · ${l.name}"></span>`).join('');
  return [...el.children];
}

function setPath(dots, level) {
  dots.forEach((dot, i) => {
    dot.className = i + 1 < level ? 'earned' : i + 1 === level ? 'current' : 'upcoming';
  });
}

const ease = (t) => 1 - Math.pow(1 - t, 3);

// Hero phone: Tom, level 6 (Ocean), 86 % coloured, 11,704 HP, +86 this week (level 6 spans 6,200–12,600 HP).
const heroCanvas = document.querySelector('[data-tree="hero"]');
if (heroCanvas) {
  const s = sphere(heroCanvas, { stage: 6, progress: reduceMotion ? 0.86 : 0 });
  setPath(buildPath(document.querySelector('[data-level-path="hero"]')), 6);
  const hp = document.querySelector('[data-hp]');
  const target = { fill: 0.86, hp: 11704 };
  if (!reduceMotion) {
    const start = performance.now() + 500;
    const duration = 2600;
    const step = (now) => {
      const t = ease(Math.max(0, Math.min(1, (now - start) / duration)));
      if (s) s.setState(6, target.fill * t, false);
      hp.textContent = Math.round(target.hp * t).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    };
    hp.textContent = '0';
    requestAnimationFrame(step);
  }
}

// Tree section: the sixteen colours, each flowing out over the one before, sped up.
const journeyCanvas = document.querySelector('[data-tree="journey"]');
if (journeyCanvas) {
  const s = sphere(journeyCanvas, { stage: 1, progress: 0 });
  const dots = buildPath(document.querySelector('[data-level-path="journey"]'));
  const title = document.querySelector('[data-journey-title]');
  const toggle = document.querySelector('[data-journey-toggle]');
  const perLevel = 2200;
  const hold = 3200;
  let elapsed = 0;
  let last = null;
  let playing = !reduceMotion;
  let visible = false;
  let shownLevel = 0;

  const show = (level, fill) => {
    if (s) s.setState(level, fill, false);
    if (level !== shownLevel) {
      shownLevel = level;
      setPath(dots, level);
      title.textContent = `Level ${level} of 16 · ${LEVELS[level - 1].name}`;
    }
  };

  const frame = (now) => {
    if (!playing || !visible) { last = null; return; }
    if (last !== null) elapsed += now - last;
    last = now;
    const total = perLevel * 16 + hold;
    if (elapsed >= total) { elapsed = 0; journeyCanvas.classList.add('restart'); setTimeout(() => journeyCanvas.classList.remove('restart'), 500); }
    const levelTime = Math.min(elapsed, perLevel * 16 - 1);
    const level = Math.floor(levelTime / perLevel) + 1;
    show(level, ease(Math.min(1, (levelTime % perLevel) / (perLevel * 0.85))));
    requestAnimationFrame(frame);
  };
  const run = () => { if (playing && visible && last === null) requestAnimationFrame(frame); };

  if (reduceMotion) {
    show(6, 0.86);
    toggle.textContent = 'Play';
  } else {
    show(1, 0);
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); }, { threshold: 0.3 }).observe(journeyCanvas);
  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Pause' : 'Play';
    run();
  });
}

// Token (armband): plan glow → press to commit → rest, on a slow loop. A press jumps to the next state.
const tokenStage = document.querySelector('[data-token-stage]');
if (tokenStage) {
  const steps = tokenStage.querySelectorAll('[data-step]');
  const press = tokenStage.querySelector('[data-token-press]');
  const durations = { plan: 4600, done: 2400, rest: 3000 };
  const next = { plan: 'done', done: 'rest', rest: 'plan' };
  let timer;
  const show = (state) => {
    tokenStage.dataset.state = state;
    steps.forEach((s) => s.classList.toggle('active', s.dataset.step === state));
    press.setAttribute('aria-label', state === 'plan' ? 'Press the token to accept today’s plan' : 'Show the token glowing when today’s plan is ready');
    clearTimeout(timer);
    if (!reduceMotion) timer = setTimeout(() => advance(next[state]), durations[state]);
  };
  const advance = (state) => {
    if (state === 'done') {
      tokenStage.classList.add('pressing');
      setTimeout(() => tokenStage.classList.remove('pressing'), 180);
    }
    show(state);
  };
  press.addEventListener('click', () => advance(tokenStage.dataset.state === 'plan' ? 'done' : 'plan'));
  tokenStage.querySelectorAll('[data-band]').forEach((b) => b.addEventListener('click', () => {
    tokenStage.style.setProperty('--band', b.dataset.band);
    tokenStage.querySelectorAll('[data-band]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
  show('plan');
}
