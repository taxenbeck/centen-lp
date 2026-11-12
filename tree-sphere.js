/*
 * Centen tree sphere for the web (WebGL2): the same tree, shaders and motion as the app
 * (shared-app TreeMesh/Seedling/TreeGrowth/TreeSphereController/SphereMotion, app-android/src/main/assets/shaders).
 * Usage: const s = new TreeSphere(canvas, { palette, stage, progress, interactive, idle }); s.setState(stage, progress, animate).
 */
(() => {
  'use strict';
  const PI = Math.PI;
  const EDGE = 0.06, FILL = 0.94, BASE = [0xB4 / 255, 0xC6 / 255, 0xD6 / 255], INNER = 0.92;

  // ---------------------------------------------------------------- vectors
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.sqrt(dot(a, a));
  const norm = (a) => { const l = len(a); return l < 1e-6 ? [0, 1, 0] : mul(a, 1 / l); };
  const perp = (a) => norm(Math.abs(a[1]) < 0.9 ? cross(a, [0, 1, 0]) : cross(a, [1, 0, 0]));
  const rot = (v, axis, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c))); };

  // ---------------------------------------------------------------- growth (port of TreeGrowth)
  // Growth G counts stages: stage s at progress p is G = s − 1 + p (0 = the seed, N = the full tree). The seedling
  // grows in stages 1–4, the tree from TREE_START on; the camera zooms out as the plant grows.
  const F = 12; // floats per vertex: position, normal, path, thickness, anchor, timing
  const TRUNK_RADIUS = 0.05, TREE_START = 4, STEP = 0.25, TIP = 0.06, TIP_SHARE = 0.2, YOUNG_THICK = 0.07, YOUNG_WIDTH = 0.1;
  const SEED = [-0.03, -0.836, 0], FRAME_SEED = 0.42, FRAME_PLANT = 0.86;
  const timing = (birth, death) => birth + 1.5 + 20 * Math.round(death * 4);
  const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const treeGrowth = (g, stages) => { const start = Math.min(TREE_START, Math.max(0, stages - 1)); return Math.max(0, Math.min(1, (g - start) / Math.max(1e-3, stages - start))); };
  const centre = (t) => [0.15 * Math.sin(PI * 1.2 * t + 0.2) - 0.06, -0.82 + 0.81 * t, 0.05 * Math.sin(PI * t)];
  const makeRng = (seed) => { let st = seed >>> 0; return () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /** World position of the vertex at offset o (as tree.vert computes it before the camera) into out; false if not grown. */
  function worldInto(v, o, g, tree, out) {
    const path = v[o + 6], thick = v[o + 7], tm = v[o + 11];
    if (tm < 0) {
      if (tree <= 0) return false;
      const tip = Math.max(1e-4, Math.min(TIP, TIP_SHARE * tree)), reach = tree + tip;
      if (path > reach) return false;
      const r = thick * TRUNK_RADIUS, grown = 1 - smoothstep(reach - tip, reach, path);
      const k = r * grown * (YOUNG_THICK + (1 - YOUNG_THICK) * tree) - r, q = YOUNG_WIDTH + (1 - YOUNG_WIDTH) * tree;
      out[0] = SEED[0] + (v[o] + v[o + 3] * k - SEED[0]) * q;
      out[1] = v[o + 1] + v[o + 4] * k;
      out[2] = SEED[2] + (v[o + 2] + v[o + 5] * k - SEED[2]) * q;
      return true;
    }
    const kd = Math.floor(tm / 20), birth = tm - 20 * kd - 1.5, death = kd * 0.25;
    const born = smoothstep(birth, birth + STEP, g), gone = smoothstep(death, death + STEP, g);
    if (born <= 0 || gone >= 1) return false;
    for (let c = 0; c < 3; c++) {
      const anchor = v[o + 8 + c];
      if (thick < 0) out[c] = anchor + (v[o + c] - anchor) * (born * (1 - gone));
      else { const r = thick * TRUNK_RADIUS, n = v[o + 3 + c]; out[c] = anchor + (v[o + c] - n * r - anchor) * born + n * (r * born * (1 - gone)); }
    }
    return true;
  }

  /** Camera per stage boundary k = 0..stages: zoom about SEED, the height SEED is drawn at, the seedling colour reach. */
  function computeFraming(mesh, n) {
    const v = mesh.vertices, count = v.length / F, w = [0, 0, 0], ax = SEED[0];
    const zoom = new Float64Array(n + 1), seedY = new Float64Array(n + 1), reach = new Float64Array(n + 1);
    for (let k = 0; k <= n; k++) {
      if (k > 0 && zoom[k - 1] === 1) { zoom[k] = 1; seedY[k] = SEED[1]; reach[k] = reach[k - 1]; continue; }
      const g = k, tree = treeGrowth(g, n);
      let yMin = Infinity, yMax = -Infinity, pathMax = 0;
      for (let o = 0; o < v.length; o += F) {
        if (!worldInto(v, o, g, tree, w)) continue;
        if (w[1] < yMin) yMin = w[1]; if (w[1] > yMax) yMax = w[1];
        if (v[o + 11] >= 0 && v[o + 6] > pathMax) pathMax = v[o + 6];
      }
      const radius = k <= 1 ? FRAME_SEED : FRAME_PLANT, yMid = (yMin + yMax) / 2, c = ax * ax - radius * radius;
      let z = 200;
      for (let o = 0; o < v.length; o += F) {
        if (!worldInto(v, o, g, tree, w)) continue;
        const dx = w[0] - ax, dy = w[1] - yMid, dz = w[2] - SEED[2], q = dx * dx + dy * dy + dz * dz;
        if (q < 1e-12) continue;
        const b = ax * dx;
        z = Math.min(z, (-b + Math.sqrt(Math.max(0, b * b - q * c))) / q);
      }
      if (k > 0) z = Math.min(z, zoom[k - 1]); // never zoom back in
      if (z <= 1 || k === n) { zoom[k] = 1; seedY[k] = SEED[1]; } else { zoom[k] = z; seedY[k] = -(yMid - SEED[1]) * z; }
      reach[k] = pathMax > 0 || k === 0 ? Math.max(1e-3, pathMax) : reach[k - 1];
    }
    const at = (a, g, log) => {
      const last = a.length - 1; if (last === 0) return a[0];
      const x = Math.max(0, Math.min(last, g)), k = Math.max(0, Math.min(Math.floor(x), last - 1)), f = x - k;
      return log ? Math.exp(Math.log(a[k]) * (1 - f) + Math.log(a[k + 1]) * f) : a[k] * (1 - f) + a[k + 1] * f;
    };
    return { zoomAt: (g) => at(zoom, g, true), seedYAt: (g) => at(seedY, g, false), reachAt: (g) => at(reach, g, false) };
  }

  // ---------------------------------------------------------------- seedling (port of SeedlingBuilder)
  // A seed, a root with rootlets, a stem along the trunk line, seed leaves, true leaves and the first branches; every
  // part carries its anchor and timing (growth in stages).
  function buildSeedling() {
    const rnd = makeRng(31), f = (lo, hi) => lo + rnd() * (hi - lo);
    const v = [], idx = [];
    const vertex = (p, n, path, thick, anchor, tm) => { const i = v.length / F; v.push(p[0], p[1], p[2], n[0], n[1], n[2], path, thick, anchor[0], anchor[1], anchor[2], tm); return i; };
    const quad = (a, b, c, d) => idx.push(a, c, b, b, c, d);
    const births = (from, count) => Array.from({ length: count }, (_, i) => from + i * STEP);
    const fill = (count, x) => new Array(count).fill(x);

    // the seed: almond-shaped, slightly tilted, there from the start; the coat is shed in stage 3
    {
      const lon = 28, lat = 18, a = 0.0105, b = 0.0145, tilt = 0.35, c = Math.cos(tilt), s = Math.sin(tilt), tm = timing(-1, 2.5);
      const base = v.length / F;
      for (let i = 0; i <= lat; i++) {
        const phi = PI * i / lat;
        for (let j = 0; j < lon; j++) {
          const th = 2 * PI * j / lon, ux = Math.sin(phi) * Math.cos(th), uy = Math.cos(phi), uz = Math.sin(phi) * Math.sin(th);
          const point = 1 + 0.22 * Math.max(0, uy) * Math.max(0, uy), flat = 0.82;
          const e = [a * ux, b * uy * point, a * flat * uz], n = norm([ux / a, uy / (b * point), uz / (a * flat)]);
          const p = add(SEED, [e[0] * c - e[1] * s, e[0] * s + e[1] * c, e[2]]);
          vertex(p, [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]], len(sub(p, SEED)), -0.6, SEED, tm);
        }
      }
      for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) { const p = base + i * lon + j, q = base + i * lon + (j + 1) % lon; quad(p, q, p + lon, q + lon); }
    }

    // a tube cut into segments of `per` points that grow one after another (segment j from births[j]) and thin out
    function tube(pts, radii, path0, per, bs, ds, sides = 7) {
      const path = [path0];
      for (let i = 1; i < pts.length; i++) path.push(path[i - 1] + len(sub(pts[i], pts[i - 1])));
      const normals = [], tangents = [];
      let normal = perp(norm(sub(pts[1], pts[0])));
      for (let i = 0; i < pts.length; i++) {
        const t = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]));
        normal = norm(sub(normal, mul(t, dot(normal, t)))); normals.push(normal); tangents.push(t);
      }
      for (let j = 0; j < bs.length; j++) {
        const i0 = j * per, i1 = Math.min(pts.length - 1, (j + 1) * per), anchor = pts[i0], tm = timing(bs[j], ds[j]), first = v.length / F;
        for (let i = i0; i <= i1; i++) {
          const bin = cross(tangents[i], normals[i]);
          for (let k = 0; k < sides; k++) {
            const a = k * 2 * PI / sides, dir = add(mul(normals[i], Math.cos(a)), mul(bin, Math.sin(a)));
            vertex(add(pts[i], mul(dir, radii[i])), dir, path[i], radii[i] / TRUNK_RADIUS, anchor, tm);
          }
        }
        for (let i = 0; i < i1 - i0; i++) for (let k = 0; k < sides; k++) {
          const a = first + i * sides + k, b = first + i * sides + (k + 1) % sides;
          idx.push(a, a + sides, b, b, a + sides, b + sides);
        }
      }
      return path;
    }

    // a leaf on an axis along `up`: out at azimuth az, raised by elevation, a short stalk, a pointed (or round) blade,
    // cupped and drooping a little; unfolds from birth and falls (shrinks back to its stalk) from death
    function leaf(base, up, az, elevation, length, width, path0, birth, death, round = false) {
      const axisUp = norm(up), out = rot(perp(axisUp), axisUp, az + f(-0.08, 0.08));
      const d = norm(add(mul(out, Math.cos(elevation)), mul(axisUp, Math.sin(elevation))));
      const side = norm(cross(d, axisUp)), nrm = norm(cross(side, d));
      const nu = 10, nv = 6, stalk = round ? 0.12 : 0.2, tm = timing(birth, death);
      const wd = (u) => {
        if (u < stalk) return width * 0.09;
        const w = (u - stalk) / (1 - stalk), shape = Math.max(0, Math.sin(PI * Math.pow(w, round ? 0.8 : 0.65)));
        return width * (round ? Math.pow(shape, 0.7) : shape) + width * 0.03;
      };
      const point = (u, s) => { const w = wd(u); return add(add(add(base, mul(d, length * u)), mul(side, s * w)), mul(nrm, 0.35 * w * s * s - 0.22 * length * u * u)); };
      const first = v.length / F;
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        for (let j = 0; j <= nv; j++) {
          const s = j / nv * 2 - 1, p = point(u, s);
          const du = sub(point(Math.min(1, u + 0.01), s), point(Math.max(0, u - 0.01), s));
          const dv = sub(point(u, Math.min(1, s + 0.01)), point(u, Math.max(-1, s - 0.01)));
          const c = cross(dv, du);
          vertex(p, len(c) < 1e-9 ? nrm : norm(c), path0 + length * u, -0.22, base, tm);
        }
      }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = first + i * (nv + 1) + j; quad(a, a + 1, a + nv + 1, a + nv + 2); }
    }

    // the root grows down out of the seed in stage 2, two rootlets in stage 3; gone in stage 6
    {
      const per = 3, segs = 4, n = segs * per, rl = 0.062, pts = [], radii = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        pts.push(add(SEED, [0.006 * Math.sin(u * 2.2) + 0.003 * u, -rl * u, 0.004 * u * u]));
        radii.push(0.0026 * Math.pow(1 - u, 0.7) + 0.00045);
      }
      const path = tube(pts, radii, 0, per, births(1, segs), fill(segs, 5.75));
      [5, 8].forEach((at, k) => {
        const side = k === 0 ? norm([1, -0.45, 0.3]) : norm([-0.9, -0.5, -0.4]), m = 6, l = 0.026 - 0.006 * k, rp = [], rr = [];
        for (let i = 0; i <= m; i++) { const u = i / m; rp.push(add(add(pts[at], mul(side, l * u)), [0, -0.4 * l * u * u, 0])); rr.push(radii[at] * 0.55 * (1 - u) + 0.00035); }
        tube(rp, rr, path[at], 3, births(2 + 0.25 * k, 2), fill(2, 5.5), 5);
      });
    }

    // the stem: at the trunk's height but nearly upright (a quarter of its S); below the foot straight into the seed
    const STEM_FROM = 0.02;
    const stemAt = (t) => {
      if (t < 0) return add(SEED, mul(sub(stemAt(0), SEED), (t + STEM_FROM) / STEM_FROM));
      const c = centre(t), c0 = centre(0);
      return [SEED[0] + (c[0] - c0[0]) * 0.25, c[1], SEED[2] + (c[2] - c0[2]) * 0.25];
    };
    const stemRadius = (t) => Math.max(0.0013, 0.0027 - 0.0045 * Math.max(0, t));
    // pieces: hypocotyl (stage 2), epicotyl (stage 3), the stage-4 shoot: t range, segments, first birth
    const pieces = [[-STEM_FROM, 0.07, 3, 1], [0.07, 0.17, 4, 2], [0.17, 0.30, 4, 3]];
    const per = 3, pts = [], radii = [], ts = [], bs = [];
    pieces.forEach(([t0, t1, segs, from], pi) => {
      const n = segs * per;
      for (let i = pi === 0 ? 0 : 1; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; pts.push(stemAt(t)); radii.push(stemRadius(t)); ts.push(t); }
      for (let s = 0; s < segs; s++) bs.push(from + s * STEP);
    });
    const path = tube(pts, radii, 0, per, bs, fill(bs.length, 5.75));
    const node = (t) => { const i = ts.findIndex((x) => x >= t - 1e-4); return [pts[i], path[i], norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]))]; };

    // a side branch from the stem, rising and curving up, with a leaf at each segment end
    function branch(t, az, segs, length, birth) {
      const [p0, path0, up] = node(t), side = [Math.cos(az), 0, Math.sin(az)], n = segs * per, bp = [], br = [], r0 = stemRadius(t) * 0.75;
      for (let i = 0; i <= n; i++) {
        const u = i / n, d = norm(add(mul(side, 1 - 0.3 * u), mul(up, 0.35 + 0.55 * u)));
        bp.push(i === 0 ? p0 : add(bp[bp.length - 1], mul(d, length / n))); br.push(r0 * (1 - 0.55 * u));
      }
      const bpath = tube(bp, br, path0, per, births(birth, segs), fill(segs, 5.5), 6);
      for (let s = 1; s <= segs; s++) {
        const i = s * per, tip = s === segs, dir = norm(sub(bp[i], bp[i - 1]));
        const leafAz = az + (s % 2 === 0 ? 0.9 : -0.9) * (tip ? 0 : 1);
        leaf(bp[i], dir, leafAz, tip ? 0.75 : 0.35, tip ? 0.042 : 0.05, tip ? 0.02 : 0.024, bpath[i], birth + s * STEP, 5 + f(0, 0.3));
      }
    }

    const az0 = 0.35;
    const pair = (t, az, el, l, w, birth, death, dk, round) => { const [p, p0, up] = node(t); for (let k = 0; k < 2; k++) leaf(p, up, az + k * PI, el, l, w, p0, birth, death + dk * k, round); };
    pair(0.07, az0, 0.25, 0.04, 0.024, 1.75, 4.75, 0, true);          // stage 2: seed leaves
    pair(0.12, az0 + PI / 2, 0.45, 0.06, 0.027, 2.5, 5, 0.25);        // stage 3: true leaves
    pair(0.17, az0 + 0.2, 0.65, 0.046, 0.021, 2.75, 5.25, 0);         // and a young pair at the tip
    branch(0.12, az0 + 0.9, 3, 0.12, 3);                              // stage 4: branches
    branch(0.2025, az0 + 0.9 + 2.3, 2, 0.095, 3.25);
    branch(0.2675, az0 + 0.9 + 4.4, 1, 0.06, 3.5);
    pair(0.235, az0 + 1.4, 0.55, 0.052, 0.024, 3.5, 5, 0.25);
    pair(0.30, az0 + 0.5, 0.9, 0.036, 0.017, 3.75, 5.25, 0);
    return { vertices: v, indices: idx };
  }

  // ---------------------------------------------------------------- tree (port of TreeBuilder)
  function buildTree(seed = 1729, maxDepth = 12) {
    let st = seed >>> 0;
    const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const f = (lo, hi) => lo + rnd() * (hi - lo);
    const randUnit = () => { for (;;) { const v = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]; const l = len(v); if (l >= 0.05 && l <= 1) return mul(v, 1 / l); } };
    const branches = [];
    const trunkRadius = 0.05, minRadius = 0.0009, shell = 0.74;
    const bendAxis = (d, towards) => { const c = cross(d, towards); return len(c) < 1e-4 ? perp(d) : norm(c); };

    function grow(start, dir0, rStart, r0, length, depth, path0, axis0, kappa) {
      const stepLen = r0 > 0.006 ? 0.022 : 0.03;
      const n = Math.min(22, Math.max(2, Math.floor(length / stepLen)));
      const step = length / n;
      const taper0 = depth < 3 ? 0.24 : 0.08;
      const terminal = depth >= maxDepth || r0 * (1 - taper0) < minRadius * 1.15;
      const taper = terminal ? 0.75 : taper0;
      const rEnd = r0 * (1 - taper);
      const pts = [start], radii = [rStart], path = [path0];
      let p = start, d = dir0, axis = axis0;
      const wobble = 0.03 + 0.05 * depth / maxDepth;
      for (let i = 1; i <= n; i++) {
        d = rot(d, axis, kappa * step);
        d = norm(add(d, mul(randUnit(), wobble)));
        axis = norm(sub(axis, mul(d, dot(axis, d))));
        const dist = len(p);
        if (dist > shell) { const nr = mul(p, 1 / dist); const out = dot(d, nr); if (out > 0) d = norm(sub(d, mul(nr, out * Math.min(1, (dist - shell) * 7)))); }
        if (p[1] < -0.84 && d[1] < 0) d = norm(add(d, [0, -d[1] * 1.5, 0]));
        p = add(p, mul(d, step));
        const l = len(p);
        if (l > INNER) p = mul(p, INNER / l);
        pts.push(p);
        const k = i / n;
        radii.push((rStart + (r0 - rStart) * Math.min(1, k / 0.33)) * (1 - taper * k));
        path.push(path0 + step * i);
      }
      branches.push({ pts, radii, path });
      if (depth >= 1 && depth <= maxDepth - 5 && r0 < 0.018) {
        for (let i = 1; i < n - 1; i += 2) {
          if (rnd() < 0.85) {
            const side = rot(perp(d), d, rnd() * 2 * PI);
            const td = rot(norm(sub(pts[i + 1], pts[i])), side, f(0.7, 1.1));
            const tr = Math.max(minRadius, radii[i] * 0.5);
            grow(pts[i], td, tr * 1.2, tr, length * f(0.32, 0.48), maxDepth - 3, path[i], side, kappa * f(0.8, 1.4));
          }
        }
      }
      if (terminal) return;
      const forks = depth >= 2 && rnd() < 0.28 ? 3 : 2;
      const shares = Array.from({ length: forks }, () => f(0.65, 1.35));
      const sum = shares.reduce((a, b) => a + b, 0);
      const bend = norm(cross(axis, d));
      const plane = rot(axis, d, f(-0.6, 0.6));
      for (let k = 0; k < forks; k++) {
        const share = shares[k] / sum;
        const rc = Math.max(minRadius, rEnd * Math.pow(share, 1 / 2.5));
        const spread = f(0.42, 0.70) * (1.3 - share);
        const cd = norm(k === 0 ? rot(d, plane, spread) : k === 1 ? rot(d, plane, -spread) : rot(d, bend, f(0.5, 0.8)));
        const cl = length * f(0.78, 0.90) * Math.pow(rc / rEnd, 0.2);
        const cAxis = k === 1 ? mul(plane, -1) : plane;
        const cKappa = Math.min(3.2, kappa * f(0.95, 1.12));
        grow(sub(p, mul(d, rc * 0.5)), cd, Math.min(rEnd, rc * 1.3), rc, cl, depth + 1, path[path.length - 1], norm(sub(cAxis, mul(cd, dot(cAxis, cd)))), cKappa);
      }
    }

    const strands = 5, n = 30, twist = 1.4 * PI, r0 = 0.085;
    for (let k = 0; k < strands; k++) {
      const phase = k * 2 * PI / strands + f(-0.2, 0.2);
      const pts = [], radii = [], path = [];
      let L = 0, radial = [1, 0, 0], tangent = [0, 1, 0];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const c = centre(t);
        tangent = norm(sub(centre(Math.min(1, t + 0.01)), centre(Math.max(0, t - 0.01))));
        const nx = norm(cross(tangent, [0, 0, 1]));
        const by = cross(tangent, nx);
        const theta = phase + twist * t;
        radial = add(mul(nx, Math.cos(theta)), mul(by, Math.sin(theta)));
        const base = Math.pow(1 - t, 4);
        const part = Math.max(0, (t - 0.8) / 0.2);
        const rho = r0 * 0.58 * (1 + 1.5 * base) * (1 - 0.2 * t) * (1 + 2.2 * part * part);
        const p = add(c, mul(radial, rho));
        if (i > 0) L += len(sub(p, pts[pts.length - 1]));
        pts.push(p);
        radii.push(r0 * 0.47 * (1 + 0.7 * base) * (1 - 0.22 * t));
        path.push(L);
      }
      const foot = sub(pts[0], mul(norm(sub(pts[1], pts[0])), radii[0] * 0.6));
      pts.unshift(foot); radii.unshift(radii[0] * 0.35); path.unshift(0);
      branches.push({ pts, radii, path });
      const top = pts[pts.length - 1];
      const dir = norm(add(mul(tangent, 0.85), mul(radial, 0.75)));
      const rEnd = radii[radii.length - 1];
      grow(sub(top, mul(dir, rEnd * 0.5)), dir, rEnd, rEnd * 0.95, f(0.28, 0.34), 0, path[path.length - 1], bendAxis(dir, radial), f(0.8, 1.1));
      const j = Math.floor(n * (0.42 + 0.08 * k + f(-0.03, 0.03)));
      const sideRadial = norm(sub(pts[j], centre(j / n)));
      const sd = norm(add(mul(sideRadial, 0.9), [0, 0.55, 0]));
      grow(pts[j], sd, radii[j] * 0.7, radii[j] * 0.52, f(0.24, 0.30), 1, path[j], bendAxis(sd, norm(add(sideRadial, [0, -0.6, 0]))), f(1.1, 1.4));
      const rootRadial = norm(sub(pts[1], centre(0)));
      const rd = rot(rootRadial, [0, 1, 0], f(-0.3, 0.3));
      const d = norm(add(rd, [0, -0.35, 0]));
      grow(pts[1], d, radii[1] * 0.8, radii[1] * 0.42, f(0.15, 0.19), maxDepth - 3, 0, bendAxis(d, [0, -1, 0]), f(1.2, 1.8));
    }

    // tessellate: tubes with parallel-transport frames, then the seedling; F floats per vertex (tree: timing -1)
    const sides = (r) => (r > 0.03 ? 14 : r > 0.012 ? 9 : r > 0.005 ? 6 : r > 0.0025 ? 4 : 3);
    const sl = buildSeedling();
    let maxPath = 0, vCount = sl.vertices.length / F, iCount = sl.indices.length;
    for (const b of branches) { maxPath = Math.max(maxPath, b.path[b.path.length - 1]); const s = sides(b.radii[0]); vCount += b.pts.length * s; iCount += (b.pts.length - 1) * s * 6; }
    const v = new Float32Array(vCount * F), idx = new Uint32Array(iCount);
    let vo = 0, io = 0, base = 0;
    for (const b of branches) {
      const s = sides(b.radii[0]), pts = b.pts;
      let normal = perp(norm(sub(pts[1], pts[0])));
      for (let i = 0; i < pts.length; i++) {
        const t = norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]));
        normal = norm(sub(normal, mul(t, dot(normal, t))));
        const bin = cross(t, normal);
        const r = b.radii[i], pn = b.path[i] / maxPath, th = r / trunkRadius;
        for (let j = 0; j < s; j++) {
          const a = j * 2 * PI / s, ca = Math.cos(a), sa = Math.sin(a);
          const dx = normal[0] * ca + bin[0] * sa, dy = normal[1] * ca + bin[1] * sa, dz = normal[2] * ca + bin[2] * sa;
          v[vo++] = pts[i][0] + dx * r; v[vo++] = pts[i][1] + dy * r; v[vo++] = pts[i][2] + dz * r;
          v[vo++] = dx; v[vo++] = dy; v[vo++] = dz; v[vo++] = pn; v[vo++] = th;
          v[vo++] = 0; v[vo++] = 0; v[vo++] = 0; v[vo++] = -1;
        }
      }
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < s; j++) {
        const a = base + i * s + j, bb = base + i * s + (j + 1) % s, c = a + s, dd = bb + s;
        idx[io++] = a; idx[io++] = c; idx[io++] = bb; idx[io++] = bb; idx[io++] = c; idx[io++] = dd;
      }
      base += pts.length * s;
    }
    v.set(sl.vertices, vo);
    for (const i of sl.indices) idx[io++] = base + i;
    return { vertices: v, indices: idx };
  }

  let sharedTree = null;
  const tree = () => sharedTree || (sharedTree = buildTree());
  const framings = new Map();
  const framing = (stages) => framings.get(stages) || framings.set(stages, computeFraming(tree(), stages)).get(stages);

  // ---------------------------------------------------------------- motion (port of SphereMotion)
  class Motion {
    constructor() { this.q = [0, Math.sin(0.3), 0, Math.cos(0.3)]; this.w = [0, 0, 0]; this.dragging = false; this.idleSpeed = 0.18; this.friction = 2.4; this.settle = 1.1; }
    rotate(ax, ay, az) {
      const ang = Math.hypot(ax, ay, az); if (ang < 1e-7) return;
      const s = Math.sin(ang / 2) / ang, dx = ax * s, dy = ay * s, dz = az * s, dw = Math.cos(ang / 2);
      const [qx, qy, qz, qw] = this.q;
      const nx = dw * qx + dx * qw + dy * qz - dz * qy, ny = dw * qy - dx * qz + dy * qw + dz * qx;
      const nz = dw * qz + dx * qy - dy * qx + dz * qw, nw = dw * qw - dx * qx - dy * qy - dz * qz;
      const n = 1 / Math.hypot(nx, ny, nz, nw); this.q = [nx * n, ny * n, nz * n, nw * n];
    }
    matrix(out = new Float32Array(16)) {
      const [x, y, z, w] = this.q;
      out.set([1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]);
      return out;
    }
    startDrag() { this.dragging = true; this.w = [0, 0, 0]; }
    dragBy(dx, dy, radius, dt) {
      const ax = dy / radius, ay = dx / radius; this.rotate(ax, ay, 0);
      if (dt > 1e-4) { const k = Math.min(1, dt / 0.05); this.w[0] += (ax / dt - this.w[0]) * k; this.w[1] += (ay / dt - this.w[1]) * k; }
    }
    endDrag() { this.dragging = false; const sp = Math.hypot(this.w[0], this.w[1]); if (sp > 9) { this.w[0] *= 9 / sp; this.w[1] *= 9 / sp; } }
    step(dt, idle) {
      if (this.dragging) return true;
      const iw = idle ? this.idleSpeed : 0, decay = Math.exp(-this.friction * dt);
      this.w[0] *= decay; this.w[1] = iw + (this.w[1] - iw) * decay; this.w[2] *= decay;
      this.rotate(this.w[0] * dt, this.w[1] * dt, this.w[2] * dt);
      const m = this.matrix(), ux = m[4], uy = m[5], uz = m[6];
      const cx = -uz, cz = ux, s = Math.hypot(cx, cz);
      let tilted = false;
      if (s > 1e-4) { const a = uy > 0 ? Math.asin(Math.min(1, s)) : PI - Math.asin(Math.min(1, s)); this.rotate(cx / s * a * Math.min(1, this.settle * dt), 0, cz / s * a * Math.min(1, this.settle * dt)); tilted = a > 0.003; }
      return Math.abs(this.w[0]) > 0.003 || Math.abs(this.w[1] - iw) > 0.003 || Math.abs(this.w[2]) > 0.003 || tilted || iw !== 0;
    }
  }

  // ---------------------------------------------------------------- shaders (generated from the app's GLSL)
  const PROLOGUE = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
  const SRC = {
    "tree.vert": "// Tree sphere: the branches. One source for Vulkan (glslc -std=450core, which predefines VULKAN) and OpenGL ES 3.0\n// (the app prepends \"#version 300 es\"). Uniform layout: TreeSphereController (shared-app).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; vec4 growth; vec4 view; } u;\n\nlayout(location = 0) in vec3 aPos;\nlayout(location = 1) in vec3 aNormal;\nlayout(location = 2) in vec2 aPathThick;\nlayout(location = 3) in vec4 aGrow; // anchor xyz, timing (TreeMesh)\n\nVARY(0) out vec3 vNormal;\nVARY(1) out vec2 vPathThick;\nVARY(2) out float vDepth;\nVARY(3) out vec3 vPos;\n\n// Growth (TreeGrowth, mirrored in TreeGrowth.world; keep in step). u.growth: x = growth in stages, y = tree growth\n// 0..1, z = seedling colour reach; u.view: x = zoom about SEED, y = height SEED is drawn at.\nconst vec3 SEED = vec3(-0.03, -0.836, 0.0); // TreeGrowth.SEED\nconst float TRUNK_RADIUS = 0.05;            // TreeMesh.TRUNK_RADIUS\nconst float TIP = 0.06;                     // TreeGrowth.TIP\nconst float TIP_SHARE = 0.2;                // TreeGrowth.TIP_SHARE\nconst float YOUNG_THICK = 0.07;             // TreeGrowth.YOUNG_THICK\nconst float YOUNG_WIDTH = 0.1;              // TreeGrowth.YOUNG_WIDTH\nconst float STEP = 0.25;                    // TreeGrowth.STEP\n\nvoid main() {\n    float thick = abs(aPathThick.y);\n    float r = thick * TRUNK_RADIUS;\n    vec3 world;\n    float path;\n    if (aGrow.w < 0.0) {\n        // the tree: exists up to the growth front along its branches, tips tapering to a point; vertices past the\n        // front collapse onto the centre line (zero-area triangles draw nothing); young trees are slim and narrow\n        float g = u.growth.y;\n        float tip = max(1e-4, min(TIP, TIP_SHARE * g));\n        float reach = g + tip;\n        float grown = g > 0.0 ? 1.0 - smoothstep(reach - tip, reach, aPathThick.x) : 0.0; // nothing before the tree starts\n        world = aPos - aNormal * r + aNormal * (r * grown * mix(YOUNG_THICK, 1.0, g));\n        float q = mix(YOUNG_WIDTH, 1.0, g); // a young tree is narrow and upright\n        world.xz = SEED.xz + (world.xz - SEED.xz) * q;\n        path = aPathThick.x / max(reach, 1e-3); // the colour flows over the grown part\n    } else {\n        // a seedling part: grows out of its anchor from its birth, then solids shrink back and tubes thin out\n        float k = floor(aGrow.w / 20.0);\n        float birth = aGrow.w - 20.0 * k - 1.5;\n        float born = smoothstep(birth, birth + STEP, u.growth.x);\n        float gone = smoothstep(k * 0.25, k * 0.25 + STEP, u.growth.x);\n        if (aPathThick.y < 0.0) {\n            world = aGrow.xyz + (aPos - aGrow.xyz) * (born * (1.0 - gone));\n        } else {\n            vec3 centre = aGrow.xyz + (aPos - aNormal * r - aGrow.xyz) * born;\n            world = centre + aNormal * (r * born * (1.0 - gone));\n        }\n        path = aPathThick.x / u.growth.z;\n    }\n    // the camera: zoomed about the seed so the plant fills the glass\n    vec3 pos = vec3(SEED.x, u.view.y, SEED.z) + (world - SEED) * u.view.x;\n    gl_Position = u.mvp * vec4(pos, 1.0);\n    vNormal = mat3(u.model) * aNormal;\n    vPathThick = vec2(path, thick);\n    vDepth = (u.model * vec4(pos, 1.0)).z;\n    vPos = aPos;\n}\n",
    "tree.frag": "// Tree sphere: branch shading and the colour replacement along the branches (mirrored in TreeSphere.metal).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; vec4 growth; vec4 view; } u;\n\nVARY(0) in vec3 vNormal;\nVARY(1) in vec2 vPathThick;\nVARY(2) in float vDepth;\nVARY(3) in vec3 vPos;\nlayout(location = 0) out vec4 outColor;\n\nconst float EDGE = 0.06; // TreeSphereController.EDGE\n\nvoid main() {\n    float path = vPathThick.x;\n    float front = u.params.x;\n    // 1 where the incoming colour has arrived, 0 where the previous one still is, soft over EDGE\n    float arrived = 1.0 - smoothstep(front - EDGE, front, path);\n    vec3 base = mix(u.previous.rgb, u.incoming.rgb, arrived);\n\n    float progress = clamp(front / (1.0 + EDGE), 0.0, 1.0);\n    vec3 n = normalize(vNormal);\n    if (!gl_FrontFacing) n = -n;\n    vec3 l = normalize(vec3(-0.45, 0.75, 0.55));\n    vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));\n    float facing = abs(n.z);\n    float spec = pow(max(dot(n, h), 0.0), 48.0);\n    float rim = pow(1.0 - facing, 2.0);\n    float thin = 1.0 - clamp(vPathThick.y * 1.6, 0.0, 1.0);\n\n    // glassy, luminous tubes: light along the core, deeper colour at the edges\n    // the palette is soft; light inside glass reads more saturated\n    vec3 vivid = clamp(mix(vec3(dot(base, vec3(0.299, 0.587, 0.114))), base, 1.5), 0.0, 1.0);\n    vec3 col = mix(vivid * 0.82, mix(vivid, vec3(1.0), 0.32), pow(facing, 1.4));\n    col *= 0.86 + 0.24 * max(dot(n, l), 0.0);\n    col = mix(col, mix(vivid, vec3(1.0), 0.5) * 1.06, thin * 0.7); // twigs glow, light and airy\n    col += spec * 0.5 + rim * 0.16 * mix(vivid, vec3(1.0), 0.5);\n\n    // glints: a few points on the fine twigs catch the light and twinkle (cells fixed to the tree, so they turn with it)\n    vec3 cell = floor(vPos * 85.0);\n    float hsh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);\n    float glint = smoothstep(0.962, 1.0, hsh) * (0.55 + 0.45 * sin(u.params.w * 2.3 + hsh * 60.0));\n    col += glint * thin * thin * mix(vivid, vec3(1.0), 0.6) * 1.1; // twigs only, never the trunk\n\n    // the propagation front: a bright band of the incoming colour just behind the edge\n    float d = (path - (front - EDGE * 0.5)) / 0.035;\n    col += u.params.y * exp(-d * d) * (u.incoming.rgb * 0.55 + 0.35);\n\n    // branches at the back are seen through the tinted glass\n    float far = clamp(0.5 - 0.5 * vDepth, 0.0, 1.0);\n    vec3 haze = mix(vec3(1.0), mix(u.previous.rgb, u.incoming.rgb, progress), 0.22);\n    col = mix(col, haze, far * far * 0.6);\n    outColor = vec4(min(col, vec3(1.0)), 1.0);\n}\n",
    "sphere.vert": "// Tree sphere: one screen-aligned quad around the glass; the fragment shaders compute the sphere per pixel.\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#define VERTEX_ID gl_VertexIndex\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#define VERTEX_ID gl_VertexID\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; vec4 growth; vec4 view; } u;\n\nVARY(0) out vec2 vUv;\n\nvoid main() {\n    // two triangles: (0,1,2) (2,1,3) over the corners (-1,-1) (1,-1) (-1,1) (1,1), slightly enlarged for the rim AA\n    int i = VERTEX_ID;\n    int c = i < 3 ? i : (i == 3 ? 2 : (i == 4 ? 1 : 3));\n    vec2 corner = vec2(float(c & 1) * 2.0 - 1.0, float(c >> 1) * 2.0 - 1.0) * 1.03;\n    vUv = corner;\n    gl_Position = vec4(corner.x * u.sphere.x, corner.y * u.sphere.y, u.sphere.w, 1.0);\n}\n",
    "sphere_back.frag": "// Tree sphere: the far side of the glass, drawn before the tree (alpha blended over the background).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; vec4 growth; vec4 view; } u;\n\nVARY(0) in vec2 vUv;\nlayout(location = 0) out vec4 outColor;\n\nvoid main() {\n    float r = length(vUv);\n    float aa = u.params.z;\n    float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);\n    if (inside <= 0.0) discard;\n    float z = sqrt(max(0.0, 1.0 - r * r));\n    // the glass is faintly filled with the tree's colour, thicker towards the rim\n    float progress = clamp(u.params.x / 1.06, 0.0, 1.0);\n    vec3 hazeCol = mix(u.previous.rgb, u.incoming.rgb, progress);\n    vec3 tint = mix(vec3(0.94, 0.97, 1.0), hazeCol, 0.45);\n    float a = 0.06 + 0.30 * pow(1.0 - z, 2.2);\n    // caustic: light focused by the glass onto the lower inside\n    vec2 c = vUv - vec2(0.18, -0.62);\n    float caustic = exp(-dot(c, c) * 9.0) * 0.22;\n    vec3 col = mix(tint, vec3(1.0), caustic / max(a + caustic, 1e-3));\n    a += caustic;\n    // inner light: the crown glows softly in its colour, like the reference\n    vec2 g = vUv - vec2(0.0, 0.18);\n    float glow = exp(-dot(g, g) * 2.2) * 0.12;\n    col = mix(col, mix(hazeCol, vec3(1.0), 0.35), glow / max(a + glow, 1e-3));\n    a += glow;\n    outColor = vec4(col, a * inside);\n}\n",
    "sphere_front.frag": "// Tree sphere: the near side of the glass over the tree: fresnel rim, reflections and highlights. No outer glow:\n// everything outside the sphere's edge is discarded, the edge itself is anti-aliased over AA (\u2248 1.5 px).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; vec4 growth; vec4 view; } u;\n\nVARY(0) in vec2 vUv;\nlayout(location = 0) out vec4 outColor;\n\nvec4 over(vec4 dst, vec3 c, float a) { // \"c with alpha a\" over dst, straight alpha\n    float oa = a + dst.a * (1.0 - a);\n    vec3 oc = (c * a + dst.rgb * dst.a * (1.0 - a)) / max(oa, 1e-4);\n    return vec4(oc, oa);\n}\n\nvoid main() {\n    float r = length(vUv);\n    float aa = u.params.z;\n    float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);\n    if (inside <= 0.0) discard;\n    vec3 n = vec3(vUv, sqrt(max(0.0, 1.0 - r * r)));\n    vec3 v = vec3(0.0, 0.0, 1.0);\n    vec3 refl = reflect(-v, n);\n    float fres = pow(1.0 - n.z, 2.6);\n\n    float progress = clamp(u.params.x / 1.06, 0.0, 1.0);\n    vec3 hazeCol = mix(u.previous.rgb, u.incoming.rgb, progress);\n    float ang = atan(vUv.y, vUv.x);\n\n    vec4 acc = vec4(0.0);\n    // fresnel rim, cool white with the tree's colour\n    vec3 rimCol = mix(vec3(0.92, 0.96, 1.0), hazeCol, 0.35);\n    acc = over(acc, rimCol, fres * 0.55);\n    // thick glass: a bright refracting band inside the edge, faintly iridescent\n    float band = smoothstep(0.84, 0.97, r) * (1.0 - smoothstep(0.975, 1.0, r));\n    vec3 irid = 0.5 + 0.5 * cos(6.2832 * (ang / 6.2832 + vec3(0.0, 0.33, 0.67)));\n    acc = over(acc, mix(vec3(1.0), irid, 0.22), band * 0.38);\n    // a crisp coloured edge line so the glass reads on a white background\n    acc = over(acc, hazeCol * 0.65 + 0.2, smoothstep(0.965, 0.995, r) * 0.38);\n    // window reflection: a soft bright crescent along the upper left rim\n    float cres = smoothstep(0.72, 0.86, r) * (1.0 - smoothstep(0.90, 0.975, r)) * smoothstep(0.35, 1.0, cos(ang - 2.25));\n    acc = over(acc, vec3(1.0), cres * 0.75);\n    // key light: broad soft highlight and a small sharp one, upper left\n    vec3 l1 = normalize(vec3(-0.55, 0.62, 0.56));\n    float s = max(dot(refl, l1), 0.0);\n    acc = over(acc, vec3(1.0), pow(s, 9.0) * 0.30 + pow(s, 260.0) * 0.95);\n    // fill light glint, lower right\n    vec3 l2 = normalize(vec3(0.62, -0.50, 0.60));\n    acc = over(acc, vec3(1.0), pow(max(dot(refl, l2), 0.0), 120.0) * 0.55);\n    outColor = vec4(acc.rgb, acc.a * inside);\n}\n"
  };

  const hex = (c) => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];

  class TreeSphere {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.palette = (opts.palette || []).map(hex);
      this.interactive = opts.interactive !== false;
      this.idle = opts.idle !== false;
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.motion = new Motion();
      this.stage = 1; this.target = 0; this.shown = 0; this.from = 0; this.growth = 0; this.growthFrom = 0; this.growthTarget = 0; this.animStart = -1; this.animDur = 0.9;
      this.u = new Float32Array(56); this.rotM = new Float32Array(16);
      this.visible = true; this.raf = 0; this.last = -1;
      const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true });
      if (!gl) throw new Error('WebGL2 unavailable');
      this.gl = gl;
      this.setup();
      this.setState(opts.stage || 1, opts.progress || 0, false);
      if (this.interactive) this.bindPointer();
      new ResizeObserver(() => this.request()).observe(canvas);
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.request(); }).observe(canvas);
    }

    setup() {
      const gl = this.gl;
      const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, PROLOGUE + src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const program = (vs, fs) => {
        const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, SRC[vs])); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, SRC[fs])); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        gl.uniformBlockBinding(p, gl.getUniformBlockIndex(p, 'Frame'), 0); return p;
      };
      this.pTree = program('tree.vert', 'tree.frag');
      this.pBack = program('sphere.vert', 'sphere_back.frag');
      this.pFront = program('sphere.vert', 'sphere_front.frag');
      const t = tree();
      this.count = t.indices.length;
      this.vaoTree = gl.createVertexArray(); gl.bindVertexArray(this.vaoTree);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, t.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t.indices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, F * 4, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, F * 4, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, F * 4, 24);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, F * 4, 32);
      this.vaoEmpty = gl.createVertexArray(); gl.bindVertexArray(null);
      this.ubo = gl.createBuffer(); gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo); gl.bufferData(gl.UNIFORM_BUFFER, this.u.byteLength, gl.DYNAMIC_DRAW);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo);
      gl.frontFace(gl.CW); gl.depthFunc(gl.LESS);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    /**
     * stage 1..16, progress 0..1; animate: progress flows over 0.9 s, a new stage flows out from the trunk over 1.6 s.
     * The plant grows with them: a seed at stage 1, 0 %, the full tree at the last stage, 100 %.
     */
    setState(stage, progress, animate = true) {
      const s = Math.max(1, Math.min(this.palette.length || 1, stage)), p = Math.max(0, Math.min(1, progress));
      const anim = animate && !this.reduceMotion && this.started;
      if (s !== this.stage) { this.stage = s; this.from = 0; this.shown = anim ? 0 : p; this.animDur = 1.6; } else { this.from = this.shown; this.animDur = 0.9; }
      const stages = Math.max(1, this.palette.length);
      this.growthFrom = this.growth; this.growthTarget = Math.max(0, Math.min(stages, s - 1 + p));
      this.target = p; this.animStart = anim && (this.shown !== p || this.growth !== this.growthTarget) ? -2 : -1;
      if (!anim) { this.shown = p; this.growth = this.growthTarget; }
      this.request();
    }

    bindPointer() {
      const c = this.canvas; let id = null, sx = 0, sy = 0, lx = 0, ly = 0, lt = 0, dragging = false;
      c.style.touchAction = 'pan-y'; // vertical swipes still scroll the page
      c.addEventListener('pointerdown', (e) => { id = e.pointerId; sx = lx = e.clientX; sy = ly = e.clientY; lt = e.timeStamp; dragging = false; });
      c.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        if (!dragging) {
          if (Math.abs(e.clientX - sx) > 6 && Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy)) { dragging = true; c.setPointerCapture(id); this.motion.startDrag(); lx = e.clientX; ly = e.clientY; lt = e.timeStamp; }
          else if (Math.abs(e.clientY - sy) > 6) id = null;
          return;
        }
        const dpr = window.devicePixelRatio || 1;
        this.motion.dragBy((e.clientX - lx) * dpr, (e.clientY - ly) * dpr, this.radiusPx || 100, Math.max(1, e.timeStamp - lt) / 1000);
        lx = e.clientX; ly = e.clientY; lt = e.timeStamp; this.request();
      });
      const end = (e) => { if (e.pointerId !== id) return; if (dragging) this.motion.endDrag(); dragging = false; id = null; this.request(); };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    }

    request() { if (!this.raf && this.visible) this.raf = requestAnimationFrame((t) => this.frame(t)); }

    frame(now) {
      this.raf = 0; this.started = true;
      const gl = this.gl, c = this.canvas, dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const time = now / 1000, dt = this.last < 0 ? 0 : Math.min(0.1, time - this.last); this.last = time;
      let transitioning = false;
      if (this.animStart === -2) this.animStart = time;
      if (this.animStart >= 0) {
        const k = Math.min(1, (time - this.animStart) / this.animDur), e = 1 - Math.pow(1 - k, 3);
        this.shown = this.from + (this.target - this.from) * e;
        this.growth = this.growthFrom + (this.growthTarget - this.growthFrom) * e; transitioning = k < 1; if (!transitioning) this.animStart = -1;
      }
      const moving = this.motion.step(dt, this.idle && !this.reduceMotion);
      // uniforms, layout as TreeSphereController (OpenGL conventions)
      const u = this.u, R = this.motion.matrix(this.rotM), short = Math.min(w, h), sx = FILL * short / w, sy = FILL * short / h;
      for (let k = 0; k < 4; k++) { u[k * 4] = sx * R[k * 4]; u[k * 4 + 1] = sy * R[k * 4 + 1]; u[k * 4 + 2] = -0.8 * R[k * 4 + 2]; u[k * 4 + 3] = R[k * 4 + 3]; }
      u.set(R, 16);
      const prev = this.stage > 1 ? this.palette[this.stage - 2] : BASE, inc = this.palette[this.stage - 1] || BASE;
      u.set([...prev, 1], 32); u.set([...inc, 1], 36);
      this.radiusPx = FILL * short / 2;
      u[40] = this.shown * (1 + EDGE); u[41] = this.shown > 0.001 && this.shown < 0.999 ? (transitioning ? 1 : 0.7) : 0; u[42] = 1.5 / this.radiusPx; u[43] = time % 3600;
      u[44] = sx; u[45] = sy; u[46] = -0.8; u[47] = 0;
      const stages = this.palette.length, fr = stages ? framing(stages) : null, g = this.growth;
      u[48] = fr ? g : -1; u[49] = fr ? treeGrowth(g, stages) : 0; u[50] = fr ? fr.reachAt(g) : 1; u[51] = 0;
      u[52] = fr ? fr.zoomAt(g) : 1; u[53] = fr ? fr.seedYAt(g) : SEED[1]; u[54] = 0; u[55] = 0;

      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo); gl.bufferSubData(gl.UNIFORM_BUFFER, 0, u);
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.bindVertexArray(this.vaoEmpty); gl.useProgram(this.pBack); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.bindVertexArray(this.vaoTree); gl.useProgram(this.pTree); gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_INT, 0);
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.bindVertexArray(this.vaoEmpty); gl.useProgram(this.pFront); gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (transitioning || moving) this.request(); else this.last = -1; // resume with dt = 0
    }
  }

  window.TreeSphere = TreeSphere;
})();
