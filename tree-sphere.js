/*
 * Centen tree sphere for the web (WebGL2): the same tree, shaders and motion as the app
 * (shared-app TreeMesh/TreeSphereController/SphereMotion, app-android/src/main/assets/shaders).
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

  // ---------------------------------------------------------------- tree (port of TreeBuilder)
  function buildTree(seed = 1729, maxDepth = 12) {
    let st = seed >>> 0;
    const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const f = (lo, hi) => lo + rnd() * (hi - lo);
    const randUnit = () => { for (;;) { const v = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]; const l = len(v); if (l >= 0.05 && l <= 1) return mul(v, 1 / l); } };
    const branches = [];
    const trunkRadius = 0.05, minRadius = 0.0009, shell = 0.74;
    const centre = (t) => [0.15 * Math.sin(PI * 1.2 * t + 0.2) - 0.06, -0.82 + 0.81 * t, 0.05 * Math.sin(PI * t)];
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

    // tessellate: tubes with parallel-transport frames; 8 floats per vertex
    const sides = (r) => (r > 0.03 ? 14 : r > 0.012 ? 9 : r > 0.005 ? 6 : r > 0.0025 ? 4 : 3);
    let maxPath = 0, vCount = 0, iCount = 0;
    for (const b of branches) { maxPath = Math.max(maxPath, b.path[b.path.length - 1]); const s = sides(b.radii[0]); vCount += b.pts.length * s; iCount += (b.pts.length - 1) * s * 6; }
    const v = new Float32Array(vCount * 8), idx = new Uint32Array(iCount);
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
        }
      }
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < s; j++) {
        const a = base + i * s + j, bb = base + i * s + (j + 1) % s, c = a + s, dd = bb + s;
        idx[io++] = a; idx[io++] = c; idx[io++] = bb; idx[io++] = bb; idx[io++] = c; idx[io++] = dd;
      }
      base += pts.length * s;
    }
    return { vertices: v, indices: idx };
  }

  let sharedTree = null;
  const tree = () => sharedTree || (sharedTree = buildTree());

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
  "tree.vert": "// Tree sphere: the branches. One source for Vulkan (glslc -std=450core, which predefines VULKAN) and OpenGL ES 3.0\n// (the app prepends \"#version 300 es\"). Uniform layout: TreeSphereController (shared-app).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; } u;\n\nlayout(location = 0) in vec3 aPos;\nlayout(location = 1) in vec3 aNormal;\nlayout(location = 2) in vec2 aPathThick;\n\nVARY(0) out vec3 vNormal;\nVARY(1) out vec2 vPathThick;\nVARY(2) out float vDepth;\nVARY(3) out vec3 vPos;\n\nvoid main() {\n    gl_Position = u.mvp * vec4(aPos, 1.0);\n    vNormal = mat3(u.model) * aNormal;\n    vPathThick = aPathThick;\n    vDepth = (u.model * vec4(aPos, 1.0)).z;\n    vPos = aPos;\n}\n",
  "tree.frag": "// Tree sphere: branch shading and the colour replacement along the branches (mirrored in TreeSphere.metal).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; } u;\n\nVARY(0) in vec3 vNormal;\nVARY(1) in vec2 vPathThick;\nVARY(2) in float vDepth;\nVARY(3) in vec3 vPos;\nlayout(location = 0) out vec4 outColor;\n\nconst float EDGE = 0.06; // TreeSphereController.EDGE\n\nvoid main() {\n    float path = vPathThick.x;\n    float front = u.params.x;\n    // 1 where the incoming colour has arrived, 0 where the previous one still is, soft over EDGE\n    float arrived = 1.0 - smoothstep(front - EDGE, front, path);\n    vec3 base = mix(u.previous.rgb, u.incoming.rgb, arrived);\n\n    float progress = clamp(front / (1.0 + EDGE), 0.0, 1.0);\n    vec3 n = normalize(vNormal);\n    if (!gl_FrontFacing) n = -n;\n    vec3 l = normalize(vec3(-0.45, 0.75, 0.55));\n    vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));\n    float facing = abs(n.z);\n    float spec = pow(max(dot(n, h), 0.0), 48.0);\n    float rim = pow(1.0 - facing, 2.0);\n    float thin = 1.0 - clamp(vPathThick.y * 1.6, 0.0, 1.0);\n\n    // glassy, luminous tubes: light along the core, deeper colour at the edges\n    // the palette is soft; light inside glass reads more saturated\n    vec3 vivid = clamp(mix(vec3(dot(base, vec3(0.299, 0.587, 0.114))), base, 1.5), 0.0, 1.0);\n    vec3 col = mix(vivid * 0.82, mix(vivid, vec3(1.0), 0.32), pow(facing, 1.4));\n    col *= 0.86 + 0.24 * max(dot(n, l), 0.0);\n    col = mix(col, mix(vivid, vec3(1.0), 0.5) * 1.06, thin * 0.7); // twigs glow, light and airy\n    col += spec * 0.5 + rim * 0.16 * mix(vivid, vec3(1.0), 0.5);\n\n    // glints: a few points on the fine twigs catch the light and twinkle (cells fixed to the tree, so they turn with it)\n    vec3 cell = floor(vPos * 85.0);\n    float hsh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);\n    float glint = smoothstep(0.962, 1.0, hsh) * (0.55 + 0.45 * sin(u.params.w * 2.3 + hsh * 60.0));\n    col += glint * thin * thin * mix(vivid, vec3(1.0), 0.6) * 1.1; // twigs only, never the trunk\n\n    // the propagation front: a bright band of the incoming colour just behind the edge\n    float d = (path - (front - EDGE * 0.5)) / 0.035;\n    col += u.params.y * exp(-d * d) * (u.incoming.rgb * 0.55 + 0.35);\n\n    // branches at the back are seen through the tinted glass\n    float far = clamp(0.5 - 0.5 * vDepth, 0.0, 1.0);\n    vec3 haze = mix(vec3(1.0), mix(u.previous.rgb, u.incoming.rgb, progress), 0.22);\n    col = mix(col, haze, far * far * 0.6);\n    outColor = vec4(min(col, vec3(1.0)), 1.0);\n}\n",
  "sphere.vert": "// Tree sphere: one screen-aligned quad around the glass; the fragment shaders compute the sphere per pixel.\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#define VERTEX_ID gl_VertexIndex\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#define VERTEX_ID gl_VertexID\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; } u;\n\nVARY(0) out vec2 vUv;\n\nvoid main() {\n    // two triangles: (0,1,2) (2,1,3) over the corners (-1,-1) (1,-1) (-1,1) (1,1), slightly enlarged for the rim AA\n    int i = VERTEX_ID;\n    int c = i < 3 ? i : (i == 3 ? 2 : (i == 4 ? 1 : 3));\n    vec2 corner = vec2(float(c & 1) * 2.0 - 1.0, float(c >> 1) * 2.0 - 1.0) * 1.03;\n    vUv = corner;\n    gl_Position = vec4(corner.x * u.sphere.x, corner.y * u.sphere.y, u.sphere.w, 1.0);\n}\n",
  "sphere_back.frag": "// Tree sphere: the far side of the glass, drawn before the tree (alpha blended over the background).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; } u;\n\nVARY(0) in vec2 vUv;\nlayout(location = 0) out vec4 outColor;\n\nvoid main() {\n    float r = length(vUv);\n    float aa = u.params.z;\n    float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);\n    if (inside <= 0.0) discard;\n    float z = sqrt(max(0.0, 1.0 - r * r));\n    // the glass is faintly filled with the tree's colour, thicker towards the rim\n    float progress = clamp(u.params.x / 1.06, 0.0, 1.0);\n    vec3 hazeCol = mix(u.previous.rgb, u.incoming.rgb, progress);\n    vec3 tint = mix(vec3(0.94, 0.97, 1.0), hazeCol, 0.45);\n    float a = 0.06 + 0.30 * pow(1.0 - z, 2.2);\n    // caustic: light focused by the glass onto the lower inside\n    vec2 c = vUv - vec2(0.18, -0.62);\n    float caustic = exp(-dot(c, c) * 9.0) * 0.22;\n    vec3 col = mix(tint, vec3(1.0), caustic / max(a + caustic, 1e-3));\n    a += caustic;\n    // inner light: the crown glows softly in its colour, like the reference\n    vec2 g = vUv - vec2(0.0, 0.18);\n    float glow = exp(-dot(g, g) * 2.2) * 0.12;\n    col = mix(col, mix(hazeCol, vec3(1.0), 0.35), glow / max(a + glow, 1e-3));\n    a += glow;\n    outColor = vec4(col, a * inside);\n}\n",
  "sphere_front.frag": "// Tree sphere: the near side of the glass over the tree: fresnel rim, reflections and highlights. No outer glow:\n// everything outside the sphere's edge is discarded, the edge itself is anti-aliased over AA (\u2248 1.5 px).\n#ifdef VULKAN\n#define UBO layout(set = 0, binding = 0, std140) uniform\n#define VARY(n) layout(location = n)\n#else\n#define UBO layout(std140) uniform\n#define VARY(n)\n#endif\n\nUBO Frame { mat4 mvp; mat4 model; vec4 previous; vec4 incoming; vec4 params; vec4 sphere; } u;\n\nVARY(0) in vec2 vUv;\nlayout(location = 0) out vec4 outColor;\n\nvec4 over(vec4 dst, vec3 c, float a) { // \"c with alpha a\" over dst, straight alpha\n    float oa = a + dst.a * (1.0 - a);\n    vec3 oc = (c * a + dst.rgb * dst.a * (1.0 - a)) / max(oa, 1e-4);\n    return vec4(oc, oa);\n}\n\nvoid main() {\n    float r = length(vUv);\n    float aa = u.params.z;\n    float inside = 1.0 - smoothstep(1.0 - aa, 1.0, r);\n    if (inside <= 0.0) discard;\n    vec3 n = vec3(vUv, sqrt(max(0.0, 1.0 - r * r)));\n    vec3 v = vec3(0.0, 0.0, 1.0);\n    vec3 refl = reflect(-v, n);\n    float fres = pow(1.0 - n.z, 2.6);\n\n    float progress = clamp(u.params.x / 1.06, 0.0, 1.0);\n    vec3 hazeCol = mix(u.previous.rgb, u.incoming.rgb, progress);\n    float ang = atan(vUv.y, vUv.x);\n\n    vec4 acc = vec4(0.0);\n    // fresnel rim, cool white with the tree's colour\n    vec3 rimCol = mix(vec3(0.92, 0.96, 1.0), hazeCol, 0.35);\n    acc = over(acc, rimCol, fres * 0.55);\n    // thick glass: a bright refracting band inside the edge, faintly iridescent\n    float band = smoothstep(0.84, 0.97, r) * (1.0 - smoothstep(0.975, 1.0, r));\n    vec3 irid = 0.5 + 0.5 * cos(6.2832 * (ang / 6.2832 + vec3(0.0, 0.33, 0.67)));\n    acc = over(acc, mix(vec3(1.0), irid, 0.22), band * 0.38);\n    // a crisp coloured edge line so the glass reads on a white background\n    acc = over(acc, hazeCol * 0.65 + 0.2, smoothstep(0.965, 0.995, r) * 0.38);\n    // window reflection: a soft bright crescent along the upper left rim\n    float cres = smoothstep(0.72, 0.86, r) * (1.0 - smoothstep(0.90, 0.975, r)) * smoothstep(0.35, 1.0, cos(ang - 2.25));\n    acc = over(acc, vec3(1.0), cres * 0.75);\n    // key light: broad soft highlight and a small sharp one, upper left\n    vec3 l1 = normalize(vec3(-0.55, 0.62, 0.56));\n    float s = max(dot(refl, l1), 0.0);\n    acc = over(acc, vec3(1.0), pow(s, 9.0) * 0.30 + pow(s, 260.0) * 0.95);\n    // fill light glint, lower right\n    vec3 l2 = normalize(vec3(0.62, -0.50, 0.60));\n    acc = over(acc, vec3(1.0), pow(max(dot(refl, l2), 0.0), 120.0) * 0.55);\n    outColor = vec4(acc.rgb, acc.a * inside);\n}\n"
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
      this.stage = 1; this.target = 0; this.shown = 0; this.from = 0; this.animStart = -1; this.animDur = 0.9;
      this.u = new Float32Array(48); this.rotM = new Float32Array(16);
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
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
      this.vaoEmpty = gl.createVertexArray(); gl.bindVertexArray(null);
      this.ubo = gl.createBuffer(); gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubo); gl.bufferData(gl.UNIFORM_BUFFER, 192, gl.DYNAMIC_DRAW);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.ubo);
      gl.frontFace(gl.CW); gl.depthFunc(gl.LESS);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    /** stage 1..16, progress 0..1; animate: progress flows over 0.9 s, a new stage flows out from the trunk over 1.6 s. */
    setState(stage, progress, animate = true) {
      const s = Math.max(1, Math.min(this.palette.length || 1, stage)), p = Math.max(0, Math.min(1, progress));
      const anim = animate && !this.reduceMotion && this.started;
      if (s !== this.stage) { this.stage = s; this.from = 0; this.shown = anim ? 0 : p; this.animDur = 1.6; } else { this.from = this.shown; this.animDur = 0.9; }
      this.target = p; this.animStart = anim && this.shown !== p ? -2 : -1; if (!anim) this.shown = p;
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
        this.shown = this.from + (this.target - this.from) * e; transitioning = k < 1; if (!transitioning) this.animStart = -1;
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
