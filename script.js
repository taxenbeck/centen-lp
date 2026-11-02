const form = document.querySelector('#waitlist-form');
const status = document.querySelector('#form-status');
// Brevo signup form URL (Contacts → Forms → Share → "Embed" HTML, the <form action="…sibforms.com/serve/…">).
const waitlistEndpoint = '';

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

// Heart (A2 §5.1a colours, P1 §10.4 geometry). The heart only ever rises.
const LEVELS = [
  ['Sage', '#9DB7A6'], ['Mint', '#4FA383'], ['Forest', '#2E6A4F'], ['Teal', '#2A8C8C'],
  ['Petrol', '#1F6F7F'], ['Ocean', '#2F6FA8'], ['Indigo', '#3F51A0'], ['Lavender', '#7B6CC4'],
  ['Violet', '#6E4A9A'], ['Plum', '#7E3F7E'], ['Berry', '#9A3D6A'], ['Ruby', '#B33A3A'],
  ['Coral', '#D0644A'], ['Copper', '#B8622E'], ['Amber', '#D08A2A'], ['Gold', '#E0B53A'],
].map(([name, color]) => ({ name, color }));
const HEART = 'M150 262 C150 262 22 180 22 98 C22 52 58 22 98 22 C124 22 141 36 150 54 C159 36 176 22 202 22 C242 22 278 52 278 98 C278 180 150 262 150 262 Z';
const MARK = 'M88.3 31.7 A40 40 0 1 0 88.3 88.3';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Wave drawn at the empty line (y = 262) and wider than the heart, so it can drift sideways.
let wave = 'M-150 262';
for (let x = -150; x < 450; x += 75) wave += x === -150 ? ' Q -112.5 257 -75 262' : ` T ${x + 75} 262`;
wave += ' V 540 H -150 Z';

function buildHeart(svg) {
  const id = `heart-clip-${svg.dataset.heart}`;
  svg.innerHTML = `
    <defs><clipPath id="${id}"><path d="${HEART}"/></clipPath></defs>
    <path d="${HEART}" fill="#FFFFFF"/>
    <g clip-path="url(#${id})">
      <rect class="h-prev" width="300" height="280"/>
      <g class="h-rise"><g class="h-wave"><path class="h-fill" d="${wave}"/></g><rect class="h-week" x="0" y="262" width="300" height="0" fill="#FFFFFF" fill-opacity="0.22"/></g>
    </g>
    <path class="h-outline" d="${HEART}" fill="none" stroke-width="2.5"/>
    <circle cx="150" cy="132" r="38" fill="#FFFFFF" stroke="#E3E6E0" stroke-width="1"/>
    <g transform="translate(124 106) scale(0.433)"><path d="${MARK}" fill="none" stroke="#16211C" stroke-width="12.65" stroke-linecap="round"/><circle class="h-dot" cx="60" cy="60" r="10.3"/></g>`;
  const q = (s) => svg.querySelector(s);
  return { prev: q('.h-prev'), rise: q('.h-rise'), fill: q('.h-fill'), week: q('.h-week'), outline: q('.h-outline'), dot: q('.h-dot') };
}

// fill 0..1 within the current level; week = this week's share of the heart height.
function drawHeart(h, level, fill, week = 0) {
  const cur = LEVELS[level - 1];
  const prev = LEVELS[level - 2];
  const lift = 240 * fill + 10 * Math.max(0, (fill - 0.95) / 0.05); // cover the wave crest when full
  h.prev.setAttribute('fill', prev ? prev.color : '#FFFFFF');
  h.fill.setAttribute('fill', cur.color);
  h.dot.setAttribute('fill', cur.color);
  h.outline.setAttribute('stroke', prev ? prev.color : fill < 0.05 ? '#C9D3CB' : cur.color);
  h.rise.setAttribute('transform', `translate(0 ${-lift})`);
  h.week.setAttribute('height', 240 * Math.min(week, fill));
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

// Hero phone: Tom, week 11 — level 3, 86 % filled, 1,284 HP, +86 this week.
const heroSvg = document.querySelector('[data-heart="hero"]');
if (heroSvg) {
  const h = buildHeart(heroSvg);
  setPath(buildPath(document.querySelector('[data-level-path="hero"]')), 3);
  const hp = document.querySelector('[data-hp]');
  const target = { fill: 0.86, week: 0.072, hp: 1284 };
  if (reduceMotion) {
    drawHeart(h, 3, target.fill, target.week);
  } else {
    const start = performance.now();
    const duration = 1800;
    const step = (now) => {
      const t = ease(Math.min(1, (now - start) / duration));
      drawHeart(h, 3, target.fill * t, target.week * t);
      hp.textContent = Math.round(target.hp * t).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    };
    drawHeart(h, 3, 0);
    hp.textContent = '0';
    setTimeout(() => requestAnimationFrame(step), 350);
  }
}

// Heart section: the sixteen colours, each rising over the one before, sped up.
const journeySvg = document.querySelector('[data-heart="journey"]');
if (journeySvg) {
  const h = buildHeart(journeySvg);
  const dots = buildPath(document.querySelector('[data-level-path="journey"]'));
  const title = document.querySelector('[data-journey-title]');
  const toggle = document.querySelector('[data-journey-toggle]');
  const perLevel = 1700;
  const hold = 3200;
  let elapsed = 0;
  let last = null;
  let playing = !reduceMotion;
  let visible = false;
  let shownLevel = 0;

  const show = (level, fill) => {
    drawHeart(h, level, fill);
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
    if (elapsed >= total) { elapsed = 0; journeySvg.classList.add('restart'); setTimeout(() => journeySvg.classList.remove('restart'), 500); }
    const levelTime = Math.min(elapsed, perLevel * 16 - 1);
    const level = Math.floor(levelTime / perLevel) + 1;
    show(level, ease(Math.min(1, (levelTime % perLevel) / (perLevel * 0.85))));
    requestAnimationFrame(frame);
  };
  const run = () => { if (playing && visible && last === null) requestAnimationFrame(frame); };

  if (reduceMotion) {
    show(3, 0.86);
    toggle.textContent = 'Play';
  } else {
    show(1, 0);
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); }, { threshold: 0.3 }).observe(journeySvg);
  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Pause' : 'Play';
    run();
  });
}
