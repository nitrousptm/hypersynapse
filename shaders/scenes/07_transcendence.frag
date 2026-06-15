#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform int   u_bar_cnt;
uniform float u_act_norm;
uniform float u_scene_norm;

// ─── utils ────────────────────────────────────────────────────────────────────

float hash(float n) { return fract(sin(n) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
vec3  hash3(vec3 p) {
    p = fract(p*vec3(443.8975,397.2973,491.1871));
    p += dot(p,p.yzx+19.19);
    return fract((p.xxy+p.yxx)*p.zyx);
}

float vnoise(vec3 p) {
    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(dot(i,vec3(1,57,113))),hash(dot(i+vec3(1,0,0),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,0),vec3(1,57,113))),hash(dot(i+vec3(1,1,0),vec3(1,57,113))),f.x),f.y),
               mix(mix(hash(dot(i+vec3(0,0,1),vec3(1,57,113))),hash(dot(i+vec3(1,0,1),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,1),vec3(1,57,113))),hash(dot(i+vec3(1,1,1),vec3(1,57,113))),f.x),f.y),f.z);
}

float fbm(vec3 p) {
    float v=0.0,a=0.5;
    for(int i=0;i<6;i++){v+=a*vnoise(p);p*=2.1;a*=0.5;}
    return v;
}

// ─── procedural galaxy ───────────────────────────────────────────────────────

// Star rendered as a point glow in the direction field
float star_point(vec3 rd, vec3 dir, float size) {
    float d = length(rd - normalize(dir));
    return size / (d * d + size * size) * 0.6;
}

vec3 galaxy(vec3 rd) {
    vec3 col = vec3(0.0);

    // Multi-scale starfield — 6 layers for deep-field look
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float scale = 50.0 + fi * 25.0;
        vec3 p = rd * scale + vec3(fi * 31.7, fi * 17.3, fi * 43.1);
        vec3 id = floor(p);
        vec3 fr = fract(p);
        vec3 h = hash3(id);
        float size = h.x * mix(0.0018, 0.0035, fi / 5.0);
        // Slight twinkling
        float twinkle = 0.85 + 0.15 * sin(u_time * (1.5 + h.y * 4.0) + h.z * 40.0);
        float d = length(fr - 0.5);
        float brightness = size / (d*d + size*size) * 0.45 * twinkle;
        // Color temperature: mix from cool blue-white to warm yellow-white
        vec3 star_col = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.95, 0.7), h.z);
        col += star_col * brightness;
    }

    // Galactic plane — band of denser stars + dust along y≈0 in view space
    float plane_cos = abs(rd.y);  // 0 = on plane, 1 = at pole
    float plane_dens = exp(-plane_cos * plane_cos * 12.0);

    if (plane_dens > 0.01) {
        // Extra dense star layer for the galactic band
        for (int i = 0; i < 3; i++) {
            float fi = float(i);
            vec3 p = rd * (80.0 + fi * 40.0) + vec3(fi * 11.3, 0.0, fi * 23.7);
            vec3 id = floor(p);
            vec3 fr = fract(p);
            vec3 h = hash3(id);
            float size = h.x * 0.0025;
            float d = length(fr - 0.5);
            float b = size / (d*d + size*size) * 0.35;
            col += h * b * plane_dens * 2.0;
        }
        // Beat-reactive nebula: cosmic clouds breathe with the 133 BPM music.
        // Kicks cause a surge in emission intensity — the galaxy is alive to the beat.
        float beat_surge = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.55 * u_scene_norm;
        // Galactic dust: warm orange-red emission nebula
        float dust = fbm(rd * 4.5 + vec3(u_time * 0.008, 0.0, u_time * 0.005));
        col += dust * vec3(0.35, 0.10, 0.25) * plane_dens * 0.9 * beat_surge;
        // Blue HII emission regions
        float hii = fbm(rd * 7.0 + vec3(53.0, u_time * 0.012, 17.0));
        col += max(hii - 0.45, 0.0) * vec3(0.1, 0.3, 0.7) * plane_dens * 1.2 * beat_surge;
    }

    // Nebula background — deep color clouds
    float neb = fbm(rd * 2.5 + vec3(u_time * 0.015, 0.0, u_time * 0.01));
    col += neb * vec3(0.06, 0.0, 0.14) * 0.7;

    // Large emission nebula: bluish cloud in upper hemisphere
    float big_neb = fbm(rd * 1.2 + vec3(7.0, u_time * 0.005, 11.0));
    col += max(big_neb - 0.4, 0.0) * vec3(0.0, 0.08, 0.18) * 1.5;

    // Three named emission nebula clusters — visual anchors matching the tendril color arc.
    // Beat-reactive: kick surge makes them flash like real HII photoionisation pulses.
    // Color arc: hues evolve over the 60s finale with the tendril palette (amber→cyan→violet).
    {
        float neb_surge  = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.40 * u_scene_norm;
        float color_arc  = clamp(u_scene_norm / 0.875, 0.0, 1.0);  // 0→1 over active window

        // Nebula A — Magenta Rosette, drifts toward deep violet as transcendence deepens
        vec3 na = normalize(vec3( 0.30,  0.12, 1.0));
        float aa = dot(rd, na);
        if (aa > 0.88) {
            float cld_a = fbm(rd * 7.0 + vec3(3.1, 7.3, 0.5));
            float den_a = smoothstep(0.88, 0.97, aa) * max(cld_a - 0.30, 0.0) * 3.5;
            vec3  colA  = mix(vec3(0.65, 0.08, 0.42), vec3(0.42, 0.04, 0.80), color_arc * color_arc);
            col += den_a * colA * 0.70 * neb_surge;
        }
        // Nebula B — Amber supernova remnant, shifts warm-gold→cyan mid-scene (energy arc)
        vec3 nb = normalize(vec3(-0.38, -0.05, 1.0));
        float ab = dot(rd, nb);
        if (ab > 0.86) {
            float cld_b = fbm(rd * 5.5 + vec3(17.2, 0.8, 29.4));
            float den_b = smoothstep(0.86, 0.97, ab) * max(cld_b - 0.28, 0.0) * 4.0;
            vec3  colB  = mix(vec3(0.85, 0.42, 0.06), vec3(0.08, 0.60, 0.82), smoothstep(0.20, 0.72, color_arc));
            col += den_b * colB * 0.75 * neb_surge;
        }
        // Nebula C — Teal planetary shell, deepens toward cosmic indigo
        vec3 nc = normalize(vec3( 0.10, -0.22, 1.0));
        float ac = dot(rd, nc);
        if (ac > 0.87) {
            float cld_c = fbm(rd * 9.0 + vec3(41.7, 13.5, 6.2));
            float shell = smoothstep(0.87, 0.93, ac) * (1.0 - smoothstep(0.93, 0.975, ac));
            float fill  = smoothstep(0.93, 0.975, ac) * max(cld_c - 0.32, 0.0) * 3.0;
            vec3  colC  = mix(vec3(0.04, 0.65, 0.60), vec3(0.06, 0.28, 0.88), color_arc);
            col += (shell * 0.50 + fill) * colC * 0.65 * neb_surge;
        }
    }

    // Interstellar dust absorption — dark molecular cloud lanes crossing the galactic plane.
    // FBM texture where dense enough absorbs background starlight (Bok globules / dark nebulae).
    // Gives the galactic band that distinctive dusty-arm look seen in real galaxy images.
    if (plane_dens > 0.015) {
        float dark_lane = fbm(rd * 4.2 + vec3(0.0, u_time * 0.002, 0.0));
        float absorption = smoothstep(0.52, 0.64, dark_lane) * plane_dens * 0.70;
        col *= 1.0 - absorption;
    }

    return col;
}

// ─── geometric connecting lines between "stars" ───────────────────────────────

float geo_connection(vec2 uv) {
    float acc = 0.0;
    int N = 12;
    for (int i = 0; i < N; i++) {
        for (int j = i+1; j < N; j++) {
            float fi = float(i), fj = float(j);
            vec2 a = vec2(hash2(vec2(fi, 0.1)), hash2(vec2(fi, 0.2))) * 2.0 - 1.0;
            vec2 b = vec2(hash2(vec2(fj, 0.3)), hash2(vec2(fj, 0.4))) * 2.0 - 1.0;
            a *= u_res.x/u_res.y;
            b *= u_res.x/u_res.y;

            // Animate: stars slowly drift
            a += vec2(sin(u_time*0.05 + fi), cos(u_time*0.07 + fi)) * 0.1;
            b += vec2(cos(u_time*0.06 + fj), sin(u_time*0.04 + fj)) * 0.1;

            // Only connect close stars
            float dist_ab = length(a - b);
            if (dist_ab > 0.8) continue;

            // Line segment distance
            vec2 pa = uv - a, ba = b - a;
            float h2 = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
            float d = length(pa - ba*h2);
            float thickness = 0.0008;
            acc += (1.0 - dist_ab/0.8) * thickness / (d + thickness);
        }
    }
    return acc;
}

// ─── cosmic double helix ──────────────────────────────────────────────────────
// Two interleaved sinusoidal strands viewed from a slight angle: the mathematical
// structure of life seen at cosmic scale. Rises during early Act IV (scene_norm
// 0.05→0.42) before the tendrils consume all space. Connected by "rung" segments.
// Strand A: amber-gold (organic); Strand B: electric cyan (cosmic information).
// The helix slowly rotates around its vertical axis, revealing its 3D nature.
vec3 cosmic_helix(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    const float FREQ  = 3.8;   // spatial frequency of helix turns
    const float AMP   = 0.30;  // lateral amplitude in screen space
    const float W_STR = 0.0055;// strand tube half-width

    float rot_t = u_time * 0.12;
    float c_rot = cos(rot_t), s_rot = sin(rot_t);

    // uv.x is already aspect-corrected (×res.x/res.y) — use directly for iso distances.
    vec2  uv_h = uv;

    // Early exit: skip pixels outside helix bounding box
    if (abs(uv_h.x) > AMP * 2.2 || abs(uv_h.y) > 1.12) return vec3(0.0);

    vec3 col_h = vec3(0.0);

    // Two strands: 22 segments each (smooth enough for a 0.3-unit amplitude helix)
    const int NS = 22;
    for (int si = 0; si < 2; si++) {
        float phase = float(si) * 3.14159265;
        vec3  s_col = (si == 0)
            ? vec3(0.95, 0.68, 0.18)   // amber-gold — organic strand
            : vec3(0.12, 0.72, 0.98);  // electric cyan — information strand

        for (int k = 0; k < NS; k++) {
            float t1 = -1.0 + float(k)   / float(NS - 1) * 2.0;
            float t2 = -1.0 + float(k+1) / float(NS - 1) * 2.0;

            float x1 = AMP * cos(FREQ * t1 + rot_t + phase);
            float z1 = AMP * sin(FREQ * t1 + rot_t + phase);
            float x2 = AMP * cos(FREQ * t2 + rot_t + phase);
            float z2 = AMP * sin(FREQ * t2 + rot_t + phase);

            // Orthographic projection: z gives depth cue via brightness
            vec2  p1 = vec2(x1 * c_rot - z1 * s_rot * 0.35, t1);
            vec2  p2 = vec2(x2 * c_rot - z2 * s_rot * 0.35, t2);
            float dep = 0.62 + 0.38 * (z1 * c_rot + x1 * s_rot * 0.35 + 0.5);

            vec2  pa = uv_h - p1;
            vec2  ba = p2 - p1;
            float hf = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            float d  = length(pa - ba * hf);

            col_h += s_col * W_STR / (d + W_STR) * dep * gate * 0.20;
        }
    }

    // Rungs: 9 cross-links connecting the two strands (base-pair rungs)
    float beat_r = 1.0 + exp(-u_beat * 7.0) * 1.40;
    const int NR = 9;
    for (int r = 0; r < NR; r++) {
        float ty   = -0.85 + float(r) / float(NR - 1) * 1.70;
        float rp   = FREQ * ty + rot_t;

        vec2 pA = vec2( AMP * cos(rp)              * c_rot - AMP * sin(rp)              * s_rot * 0.35, ty);
        vec2 pB = vec2( AMP * cos(rp + 3.14159265) * c_rot - AMP * sin(rp + 3.14159265) * s_rot * 0.35, ty);

        vec2  pa  = uv_h - pA;
        vec2  ba  = pB - pA;
        float hf  = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float d   = length(pa - ba * hf);

        const float W_R = 0.0032;
        col_h += vec3(0.62, 0.70, 0.60) * W_R / (d + W_R) * gate * 0.24 * beat_r;

        // Node glows at rung endpoints
        vec2 dA = uv_h - pA, dB = uv_h - pB;
        col_h += vec3(0.95, 0.68, 0.18) * exp(-dot(dA,dA) * 80.0) * gate * beat_r * 0.15;
        col_h += vec3(0.12, 0.72, 0.98) * exp(-dot(dB,dB) * 80.0) * gate * beat_r * 0.15;
    }

    return col_h;
}

// ─── Lorenz chaotic attractor — order emerging from chaos ────────────────────
// The Lorenz system (σ=10, ρ=28, β=8/3) generates a butterfly-shaped strange
// attractor: deterministic chaos that nonetheless obeys strict mathematical law.
// Appears between the cosmic helix and singularity rings (scene_norm 0.22→0.52)
// as a visual metaphor for the AI discovering that chaos *is* mathematics.
// Euler integration, 80 visible steps after 40 warmup — all pixels run the same
// loop so there is zero warp divergence; total ~1500 float ops per pixel.
vec3 lorenz_attractor(vec2 uv, float scene_norm) {
    float gate = smoothstep(0.22, 0.34, scene_norm)
               * (1.0 - smoothstep(0.44, 0.54, scene_norm));
    if (gate < 0.001) return vec3(0.0);

    const float sigma = 10.0, rho = 28.0, beta = 8.0 / 3.0;
    const float dt    = 0.012;

    // Slowly rotate the projection to reveal the 3D butterfly shape over time.
    float ang = u_time * 0.07;
    float ca = cos(ang), sa = sin(ang);

    // Seed drifts gently so the visible segment shifts without sudden jumps.
    float ts = u_time * 0.035;
    vec3 p = vec3(0.10 + sin(ts) * 0.14,
                  0.00 + cos(ts * 0.71) * 0.08,
                  14.0);

    // Warmup: push point onto the attractor manifold before drawing.
    for (int i = 0; i < 40; i++) {
        vec3 dp = vec3(sigma * (p.y - p.x),
                       p.x * (rho - p.z) - p.y,
                       p.x * p.y - beta * p.z);
        p += dp * dt;
    }

    vec3  col     = vec3(0.0);
    vec2  prev_sc = vec2(-9.0);   // previous segment endpoint in screen space
    float beat_b  = 1.0 + exp(-u_beat * 7.0) * 0.60;

    // Scale: attractor occupies x≈±22, z≈1-49 (centre z≈25). Map to ±0.40 screen.
    const float inv_sx = 1.0 / 22.0;
    const float inv_sz = 1.0 / 25.0;
    const float scl    = 0.38;

    for (int i = 0; i < 80; i++) {
        vec3 dp = vec3(sigma * (p.y - p.x),
                       p.x * (rho - p.z) - p.y,
                       p.x * p.y - beta * p.z);
        p += dp * dt;

        // Project: rotate in XY plane, use Z as screen-Y.
        float px_r = p.x * ca - p.y * sa;
        vec2  cur  = vec2(px_r * inv_sx, (p.z - 25.0) * inv_sz) * scl;

        if (i > 0) {
            // Segment SDF (shared helper sdSeg2D not yet defined — inline here).
            vec2 ab = cur - prev_sc, ap = uv - prev_sc;
            float tc = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-7), 0.0, 1.0);
            float d  = length(ap - ab * tc);

            // Left wing (x < 0) amber-gold; right wing (x > 0) electric cyan.
            float wing   = smoothstep(-3.0, 3.0, p.x);
            vec3  w_col  = mix(vec3(0.95, 0.62, 0.12),    // amber-gold
                               vec3(0.08, 0.72, 0.98),    // electric cyan
                               wing);

            // Depth cue: points behind the projection plane (rotated y < 0) dimmer.
            float depth = 0.55 + 0.45 * clamp((p.x * sa + p.y * ca) / 22.0 * 0.5 + 0.5, 0.0, 1.0);

            col += w_col * exp(-d * d * 5000.0) * gate * beat_b * depth * 0.65;
        }
        prev_sc = cur;
    }
    return col;
}

// ─── Fibonacci phyllotaxis — the golden seed spiral ──────────────────────────
// The n-th seed sits at angle n × GA (golden angle, 2π/φ²) and radius sqrt(n).
// This is the mathematical pattern behind sunflower seeds, pinecones, and all
// natural spiraling growth. Two interlocking Fibonacci spiral families emerge:
// 8-arm (clockwise) and 13-arm (counter-clockwise) — consecutive Fibonacci nums.
// Gate: scene_norm 0.0→0.26 — the FIRST mathematical structure in Act IV,
// the golden seed from which all later patterns (helix, Lorenz, tendrils) grow.
//
// Uses sdSeg2D — declared right after this function.
float sdSeg2D(vec2 q, vec2 a, vec2 b);  // forward-declare for phyllotaxis use

vec3 fibonacci_phyllotaxis(vec2 uv, float snorm) {
    float gate = smoothstep(0.0, 0.09, snorm)
               * (1.0 - smoothstep(0.17, 0.28, snorm));
    if (gate < 0.001) return vec3(0.0);

    const float GA   = 2.39996322972865332;  // golden angle = 2π(2−φ) ≈ 137.508°
    float beat_b     = 1.0 + exp(-u_beat * 6.0) * 0.60;
    float rot        = u_time * 0.038;          // slow rotation reveals 3D nature
    const float r0   = 0.055;                  // radial scale factor
    const int   N    = 65;                     // seed count (13th Fibonacci after 55)

    // Pre-compute all seed screen positions
    vec2 seeds[65];
    for (int i = 0; i < N; i++) {
        float fi  = float(i);
        float ang = fi * GA + rot;
        float rad = sqrt(fi + 0.5) * r0;
        seeds[i]  = vec2(cos(ang), sin(ang)) * rad;
    }

    vec3 col = vec3(0.0);

    for (int i = 0; i < N; i++) {
        float t     = float(i) / float(N - 1);
        // Amber-gold (inner, organic origin) → electric cyan (outer, cosmic extent)
        vec3  scol  = mix(vec3(0.95, 0.62, 0.12), vec3(0.12, 0.72, 0.98), t);

        // 8-arm Fibonacci spiral connections (8 = Fib(6))
        if (i + 8 < N) {
            float d8 = sdSeg2D(uv, seeds[i], seeds[i + 8]);
            col += scol * exp(-d8 * 390.0) * 0.18 * gate * beat_b;
        }
        // 13-arm Fibonacci spiral connections (13 = Fib(7))
        if (i + 13 < N) {
            float d13 = sdSeg2D(uv, seeds[i], seeds[i + 13]);
            col += scol * exp(-d13 * 350.0) * 0.16 * gate * beat_b;
        }

        // Seed node glow — inner seeds larger, outer smaller (natural packing density)
        float d  = length(uv - seeds[i]);
        float sz = mix(0.028, 0.011, t);
        col += scol * (sz / (d + sz)) * sz * gate * beat_b * 0.85;
    }
    return col;
}

// ─── light grows like plants (fractal tendrils) ───────────────────────────────

float sdSeg2D(vec2 q, vec2 a, vec2 b) {
    vec2 pa = q - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// Beat-reactive leaf-tip glow: tips flare on each 133 BPM kick.
// Returns softcircle brightness centred at bp.
float tip_glow(vec2 uv, vec2 bp) {
    float beat_boost = 1.0 + smoothstep(0.08, 0.0, u_beat) * 2.0;
    return exp(-dot(uv - bp, uv - bp) * 220.0) * 0.055 * beat_boost;
}

// Helper: draw a 3-segment leaflet sub-branch from point bp in direction bd.
// fork_sign: +1 or -1 selects which side the leaflet forks toward.
// gate: scene-progress factor [0,1] so leaflets grow in over time.
float leaflet(vec2 uv, vec2 bp, vec2 bd, float sw, float fork_sign,
              float seed_l, float t_l, float gate) {
    float fa  = fork_sign * (0.28 + hash(seed_l) * 0.22);
    float fc  = cos(fa), fs = sin(fa);
    vec2  ld  = vec2(bd.x * fc - bd.y * fs, bd.x * fs + bd.y * fc);
    float lw  = sw * 1.5;
    float lacc = 0.0;
    for (int i = 0; i < 3; i++) {
        float angle = sin(float(i) * 1.9 + seed_l + t_l * 0.7) * 0.28;
        float c2 = cos(angle), s2 = sin(angle);
        ld = vec2(ld.x * c2 - ld.y * s2, ld.x * s2 + ld.y * c2);
        vec2 next = bp + ld * 0.040;
        lacc += lw / (sdSeg2D(uv, bp, next) + lw);
        lw  *= 0.68;
        bp   = next;
    }
    lacc += tip_glow(uv, bp);
    return lacc * gate;
}

float tendril(vec2 uv, float seed, float t) {
    float acc = 0.0;
    // Sub-branches fade in from scene_norm 0.18→0.38 so leaflets "grow in" progressively.
    float leaf_gate = smoothstep(0.18, 0.38, u_scene_norm);

    // ── Trunk: 4 segments radiating outward from centre ──────────────────────
    vec2 p   = vec2(0.0);
    vec2 dir = normalize(vec2(cos(seed * 6.28318), sin(seed * 6.28318)));
    float w  = 0.0038;

    for (int i = 0; i < 4; i++) {
        float angle = sin(float(i) * 1.3 + seed + t * 0.5) * 0.40;
        float c = cos(angle), s = sin(angle);
        dir = vec2(dir.x * c - dir.y * s, dir.x * s + dir.y * c);
        vec2 next = p + dir * 0.078;
        acc += w / (sdSeg2D(uv, p, next) + w);
        w *= 0.78;
        p = next;
    }

    // ── Left branch: fork at trunk tip with a positive rotation ──────────────
    {
        float ba = 0.42 + hash(seed + 1.7) * 0.28;
        float bc = cos(ba), bs = sin(ba);
        vec2 bp  = p;
        vec2 bd  = vec2(dir.x * bc - dir.y * bs, dir.x * bs + dir.y * bc);
        float bw = w;
        for (int i = 0; i < 4; i++) {
            float angle = sin(float(i) * 1.6 + seed * 2.1 + t * 0.6) * 0.35;
            float c = cos(angle), s = sin(angle);
            bd = vec2(bd.x * c - bd.y * s, bd.x * s + bd.y * c);
            vec2 next = bp + bd * 0.058;
            acc += bw / (sdSeg2D(uv, bp, next) + bw);
            bw *= 0.72;
            bp = next;
        }
        acc += tip_glow(uv, bp);
        // Leaflet pair off left-branch tip — only compute when visible (leaf_gate > 0)
        if (leaf_gate > 0.001) {
            acc += leaflet(uv, bp, bd, bw, +1.0, seed + 5.3, t, leaf_gate);
            acc += leaflet(uv, bp, bd, bw, -1.0, seed + 6.1, t, leaf_gate);
        }
    }

    // ── Right branch: fork at trunk tip with a negative rotation ─────────────
    {
        float ba = -(0.42 + hash(seed + 2.3) * 0.28);
        float bc = cos(ba), bs = sin(ba);
        vec2 bp  = p;
        vec2 bd  = vec2(dir.x * bc - dir.y * bs, dir.x * bs + dir.y * bc);
        float bw = w;
        for (int i = 0; i < 4; i++) {
            float angle = sin(float(i) * 1.8 + seed * 1.7 + t * 0.45) * 0.35;
            float c = cos(angle), s = sin(angle);
            bd = vec2(bd.x * c - bd.y * s, bd.x * s + bd.y * c);
            vec2 next = bp + bd * 0.058;
            acc += bw / (sdSeg2D(uv, bp, next) + bw);
            bw *= 0.72;
            bp = next;
        }
        acc += tip_glow(uv, bp);
        // Leaflet pair off right-branch tip — only compute when visible
        if (leaf_gate > 0.001) {
            acc += leaflet(uv, bp, bd, bw, +1.0, seed + 7.3, t, leaf_gate);
            acc += leaflet(uv, bp, bd, bw, -1.0, seed + 8.1, t, leaf_gate);
        }
    }

    return acc * u_scene_norm;
}

// ─── 5×7 pixel font — title + subtitle + year ────────────────────────────────
// Row bitmasks (bit4=leftmost). 18 unique chars: S=0 I=1 N=2 G=3 U=4 L=5 A=6
// R=7 T=8 Y=9 D=10 E=11 SP=12 B=13 X=14  |  digits: 2=15 0=16 6=17
const int FONT_DATA[126] = int[126](
    14,17,16,14, 1,17,14,  // S=0
    31, 4, 4, 4, 4, 4,31,  // I=1
    17,25,21,19,17,17,17,  // N=2
    14,17,16,23,17,17,14,  // G=3
    17,17,17,17,17,17,14,  // U=4
    16,16,16,16,16,16,31,  // L=5
    14,17,17,31,17,17,17,  // A=6
    30,17,17,30,20,18,17,  // R=7
    31, 4, 4, 4, 4, 4, 4,  // T=8
    17,17,10, 4, 4, 4, 4,  // Y=9
    30,17,17,17,17,17,30,  // D=10
    31,16,16,30,16,16,31,  // E=11
     0, 0, 0, 0, 0, 0, 0,  // SP=12
    30,17,17,30,17,17,30,  // B=13
    17,17,10, 4,10,17,17,  // X=14
    14,17, 1, 6, 8,16,31,  // 2=15
    14,17,17,17,17,17,14,  // 0=16
    14,16,16,30,17,17,14   // 6=17
);
// SINGULARITY GARDEN
const int TITLE_STR[18] = int[18](0,1,2,3,4,5,6,7,1,8,9,12,3,6,7,10,11,2);
// BY AGENTIX
const int SUB_STR[10] = int[10](13,9,12,6,3,11,2,8,1,14);
// 2026
const int YEAR_STR[4] = int[4](15,16,15,17);

// Per-character stagger: each char fades in 0.0015 scene_norm after the previous.
// Total stagger across 18 chars = 0.027 (1.62s at 60s/scene). Each char fades
// over 0.016 (0.96s). First char at scene_norm 0.920; last fully visible ~0.962.
// Birth flash: when a char first appears it briefly bleeds white, then settles.
float render_title_text(vec2 uv, float scene_norm) {
    const float BASE    = 0.920;  // scene_norm when first char starts appearing
    const float CHAR_DUR= 0.016;  // fade-in duration per char
    const float STAGGER = 0.0015; // scene_norm delay between chars
    if (scene_norm < BASE - 0.001) return 0.0;

    const float CW   = 0.060;
    const float CH   = 0.084;
    const float GAP  = 0.015;
    const float STEP = CW + GAP;
    float x0 = -(18.0 * STEP - GAP) * 0.5;
    const float TY   = -0.22;

    float acc = 0.0;
    for (int ci = 0; ci < 18; ci++) {
        float char_t = BASE + float(ci) * STAGGER;
        float appear = smoothstep(char_t, char_t + CHAR_DUR, scene_norm);
        if (appear < 0.001) continue;

        int ch_idx = TITLE_STR[ci];
        float cx   = x0 + float(ci) * STEP;
        vec2 local = uv - vec2(cx, TY + CH * 0.5);
        float gx = local.x * (5.0 / CW);
        float gy = -local.y * (7.0 / CH);
        int col  = int(floor(gx));
        int row  = int(floor(gy));
        if (col >= 0 && col < 5 && row >= 0 && row < 7) {
            int mask = FONT_DATA[ch_idx * 7 + row];
            if (((mask >> (4 - col)) & 1) != 0) {
                float dx = gx - float(col) - 0.5;
                float dy = gy - float(row) - 0.5;
                float d  = length(vec2(dx, dy));
                // Birth flash: white-hot burst when char first materialises
                float birth = exp(-max(scene_norm - char_t, 0.0) * 45.0);
                acc += (1.0 - smoothstep(0.26, 0.52, d)) * (appear + birth * 1.8);
            }
        }
    }
    return min(acc, 2.5);
}

// Subtitle: "BY AGENTIX" — group tag, smaller, below separator.
// Per-char stagger (0.0012 scene_norm apart) + birth flash — mirrors the title's
// typewriter feel so the credit sequence reads as a single unified choreography.
float render_subtitle(vec2 uv, float scene_norm) {
    const float BASE    = 0.960;   // first char starts appearing
    const float CHAR_DUR= 0.014;   // fade-in duration per char
    const float STAGGER = 0.0012;  // scene_norm delay between chars
    if (scene_norm < BASE - 0.001) return 0.0;

    const float CW   = 0.038;
    const float CH   = 0.053;
    const float GAP  = 0.009;
    const float STEP = CW + GAP;
    float x0 = -(10.0 * STEP - GAP) * 0.5;
    const float TY   = -0.350;  // between separator (−0.30) and credit dots (−0.40)

    float acc = 0.0;
    for (int ci = 0; ci < 10; ci++) {
        float char_t = BASE + float(ci) * STAGGER;
        float appear = smoothstep(char_t, char_t + CHAR_DUR, scene_norm);
        if (appear < 0.001) continue;

        int ch_idx = SUB_STR[ci];
        float cx   = x0 + float(ci) * STEP;
        vec2 local = uv - vec2(cx, TY + CH * 0.5);
        float gx = local.x * (5.0 / CW);
        float gy = -local.y * (7.0 / CH);
        int col  = int(floor(gx));
        int row  = int(floor(gy));
        if (col >= 0 && col < 5 && row >= 0 && row < 7) {
            int mask = FONT_DATA[ch_idx * 7 + row];
            if (((mask >> (4 - col)) & 1) != 0) {
                float dx = gx - float(col) - 0.5;
                float dy = gy - float(row) - 0.5;
                float d  = length(vec2(dx, dy));
                // Brief birth flash — char materialises white-hot then settles to blue-white
                float birth = exp(-max(scene_norm - char_t, 0.0) * 55.0);
                acc += (1.0 - smoothstep(0.30, 0.55, d)) * (appear + birth * 1.2);
            }
        }
    }
    return min(acc, 1.8);
}

// Year "2026" — demoscene standard production year stamp.
// Appears just after the subtitle, small and centred, gentle white glow.
float render_year(vec2 uv, float scene_norm) {
    const float BASE    = 0.976;
    const float CHAR_DUR= 0.010;
    const float STAGGER = 0.0015;
    if (scene_norm < BASE - 0.001) return 0.0;

    const float CW   = 0.030;
    const float CH   = 0.042;
    const float GAP  = 0.007;
    const float STEP = CW + GAP;
    float x0 = -(4.0 * STEP - GAP) * 0.5;
    const float TY   = -0.455;

    float acc = 0.0;
    for (int ci = 0; ci < 4; ci++) {
        float char_t = BASE + float(ci) * STAGGER;
        float appear = smoothstep(char_t, char_t + CHAR_DUR, scene_norm);
        if (appear < 0.001) continue;

        int ch_idx = YEAR_STR[ci];
        float cx   = x0 + float(ci) * STEP;
        vec2 local = uv - vec2(cx, TY + CH * 0.5);
        float gx = local.x * (5.0 / CW);
        float gy = -local.y * (7.0 / CH);
        int col  = int(floor(gx));
        int row  = int(floor(gy));
        if (col >= 0 && col < 5 && row >= 0 && row < 7) {
            int mask = FONT_DATA[ch_idx * 7 + row];
            if (((mask >> (4 - col)) & 1) != 0) {
                float dx = gx - float(col) - 0.5;
                float dy = gy - float(row) - 0.5;
                float d  = length(vec2(dx, dy));
                float birth = exp(-max(scene_norm - char_t, 0.0) * 70.0);
                acc += (1.0 - smoothstep(0.32, 0.58, d)) * (appear + birth * 0.9);
            }
        }
    }
    return min(acc, 1.2);
}

// ─── Act IV shooting-star comets ─────────────────────────────────────────────
// Bright streaks animate across the galaxy field on every other 133 BPM kick.
// The head travels FROM one screen edge TO the opposite side over ~0.35s.
// Tail fades behind the head.  Positions reseed per bar so each bar is unique.
// Gated out before the silence window so the logo reveal stays clean.

vec3 scene7_comets(vec2 uv, float scene_norm) {
    float gate = smoothstep(0.04, 0.12, scene_norm)
               * (1.0 - smoothstep(0.78, 0.84, scene_norm));
    if (gate < 0.002) return vec3(0.0);

    vec3 col = vec3(0.0);
    float asp = u_res.x / u_res.y;

    // u_beat: 0 = just fired, grows toward 1.  Use as travel position (0 = entry, 1 = exit).
    // We only show the comet while beat < 0.55 (roughly 0.25s from beat impact).
    float trav = smoothstep(0.0, 0.55, u_beat);
    float fade = (1.0 - smoothstep(0.28, 0.55, u_beat));   // brightness envelope
    if (fade < 0.003) return vec3(0.0);

    // Fire on every other beat (beat 1 and 3 of each bar)
    float beat_id = floor(u_bar * 4.0);
    if (mod(beat_id, 2.0) < 0.5) return vec3(0.0);

    // Seed changes per bar so positions differ each bar
    float bar_seed = float(u_bar_cnt) * 7.31 + beat_id * 1.13;

    // 3 simultaneous comets, each with its own trajectory
    for (int ci = 0; ci < 3; ci++) {
        float fi    = float(ci);
        float s0    = bar_seed + fi * 4.71;

        // Entry point: near one screen edge (aspect-corrected)
        float eang  = hash2(vec2(s0 * 0.13, 1.0)) * 6.28318;
        vec2  entry = vec2(cos(eang), sin(eang));
        entry.x    *= asp;
        entry      *= 1.5 + hash2(vec2(s0 * 0.27, 2.0)) * 0.4;  // just off-screen

        // Exit point: opposite-ish side, across the center
        vec2  exit_pt = -entry * (0.7 + hash2(vec2(s0 * 0.41, 3.0)) * 0.6);
        exit_pt      += vec2((hash2(vec2(s0 * 0.55, 4.0)) - 0.5) * asp * 0.5,
                             (hash2(vec2(s0 * 0.63, 5.0)) - 0.5) * 0.4);

        // Animate head along the entry→exit path
        vec2  head   = mix(entry, exit_pt, trav);
        vec2  td     = normalize(exit_pt - entry);    // travel direction (forward)

        // Trail: project uv relative to head onto the travel axis
        vec2  pa     = uv - head;
        float along  = dot(pa, td);                   // + ahead, - behind
        float across = length(pa - td * along);

        // Only render tail behind the head (along < 0)
        float tail_len = 0.28 + hash2(vec2(s0 * 0.79, 6.0)) * 0.22;
        float tc       = clamp(-along / tail_len, 0.0, 1.0);
        float radius   = 0.007 + hash2(vec2(s0 * 0.91, 7.0)) * 0.009;
        float width    = radius * (1.0 + tc * 2.2);   // tail widens rearward
        float streak   = exp(-across * across / (width * width)) * (1.0 - tc * tc);

        // Bright head point
        float hr = length(pa);
        streak  += exp(-hr * hr / (radius * radius * 0.22)) * 2.0;

        // Color: warm-white head → cyan-blue tail
        vec3  ccol = mix(vec3(0.70, 0.88, 1.0), vec3(0.40, 0.65, 1.0), tc);
        col += streak * ccol * fade * (0.15 + scene_norm * 0.20) * 0.7;
    }
    return col * gate;
}

// ─── Act IV aurora ribbons — cosmic vertical light curtains ──────────────────
// 5 tall sinusoidal ribbons sway between the galactic background and the
// foreground tendrils during Act IV. Colors: teal-cyan at base → violet mid →
// white-blue apex. Beat-surge on each 133 BPM kick (+45%). Gate fades out at
// scene_norm 0.76→0.86 so the silence/logo window is completely clear.

float aurora_ribbon(vec2 uv, float cx, float seed, float t) {
    float xwave = sin(uv.y * 2.8 + t * 0.40 + seed * 6.28) * 0.10
                + sin(uv.y * 5.3 - t * 0.22 + seed * 2.17) * 0.05;
    float dx  = uv.x - (cx + xwave);
    float w   = 0.018 + 0.010 * sin(seed * 4.1 + t * 0.12);
    // Vertical mask: fade in from bottom, out toward top
    float vm  = smoothstep(-0.95, -0.55, uv.y)
              * (1.0 - smoothstep(0.55, 0.90, uv.y));
    // Upward-propagating shimmer bands: two coprime frequencies give non-repeating curtain pattern
    float shim1 = 0.5 + 0.5 * sin(uv.y * 7.3  - t * (1.55 + seed * 0.45) + seed * 3.14);
    float shim2 = 0.5 + 0.5 * sin(uv.y * 13.7 + t * (0.80 + seed * 0.33) + seed * 1.77);
    float shimmer = mix(1.0, shim1 * shim2, 0.35);   // 35% depth — noticeable but not strobing
    return exp(-dx * dx / (w * w)) * vm * shimmer;
}

vec3 scene7_auroras(vec2 uv, float scene_norm) {
    float gate = smoothstep(0.05, 0.22, scene_norm)
               * (1.0 - smoothstep(0.76, 0.86, scene_norm));
    if (gate < 0.002) return vec3(0.0);

    float beat_surge = 1.0 + smoothstep(0.07, 0.0, u_beat) * 0.45 * scene_norm;

    // 5 ribbons spread across the screen (aspect-corrected uv.x ≈ ±1.78 @ 16:9)
    const float PX[5] = float[5](-1.20, -0.55, 0.05, 0.62, 1.25);
    const float SD[5] = float[5](1.31,   2.74, 0.57, 3.88, 4.21);

    vec3 col = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float g   = aurora_ribbon(uv, PX[i], SD[i], u_time);
        // Color ramp: teal at base → violet mid → white-blue apex
        float yf  = clamp(uv.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 rcol = mix(
            vec3(0.06, 0.55, 0.75),
            mix(vec3(0.52, 0.08, 0.88), vec3(0.60, 0.78, 1.00), yf),
            yf * 0.85
        );
        float shim = 0.75 + 0.25 * sin(u_time * (0.5 + SD[i] * 0.3) + SD[i] * 4.0);
        col += g * rcol * shim * 0.092;
    }
    return col * gate * beat_surge;
}

// ─── logo formation (final 10 seconds) ───────────────────────────────────────

float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p-a, ba = b-a;
    return length(pa - ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.));
}

// Distance to a circular arc from angle a0 to a1 (radians), stroke width w
float sdArcStroke(vec2 p, vec2 c, float r, float a0, float a1, float w) {
    p -= c;
    float a = atan(p.y, p.x);
    if (a < a0 - 0.001) a += 6.28318530718;
    a = clamp(a, a0, a1);
    return length(p - r*vec2(cos(a), sin(a))) - w;
}

// S glyph: two opposite arcs (upper opens right, lower opens left)
float glyph_S(vec2 p) {
    float w = 0.024;
    float r = 0.105;
    // Upper arc: center upper-right, runs from ~200° to ~355°
    float top = sdArcStroke(p, vec2(0.030,  r), r, 3.49, 6.20, w);
    // Lower arc: center lower-left, runs from ~20° to ~160°
    float bot = sdArcStroke(p, vec2(-0.030, -r), r, 0.35, 2.79, w);
    return min(top, bot);
}

// G glyph: large C arc + short inward bar at 3 o'clock
float glyph_G(vec2 p) {
    float w = 0.024;
    float r = 0.125;
    // C arc: 35° to 325°, leaving a gap on the right
    float arc = sdArcStroke(p, vec2(0.0, 0.0), r, 0.611, 5.672, w);
    // Horizontal spur pointing inward from the right edge
    float bar = sdSeg(p, vec2(r, 0.0), vec2(r * 0.25, 0.0)) - w;
    // Short closing vertical to give the G its shelf
    float shelf = sdSeg(p, vec2(r, 0.0), vec2(r, -r * 0.28)) - w;
    return min(arc, min(bar, shelf));
}

float logo_sdf(vec2 uv) {
    float s = glyph_S(uv + vec2(0.20, 0.0));
    float g = glyph_G(uv - vec2(0.20, 0.0));
    return min(s, g);
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;
    vec2 uv01 = gl_FragCoord.xy / u_res;

    // Camera pulling back to infinite distance — grows quadratically over the minute
    float pullback = u_scene_norm * u_scene_norm;

    // Zoom-out: dividing uv by zoom narrows each pixel's ray angle, compressing
    // the galaxy toward the horizon exactly as a receding camera would see it.
    float zoom = 1.0 + pullback * 2.5;
    // Slow lateral drift as the universe recedes (parallax across cosmic structures)
    float cam_drift = u_time * 0.022;
    float cd_c = cos(cam_drift), cd_s = sin(cam_drift);
    vec2 uv_drift = vec2(uv.x * cd_c - uv.y * cd_s * 0.15,
                         uv.x * cd_s * 0.15 + uv.y);
    vec3 rd = normalize(vec3(uv_drift / zoom, 2.0));
    // Cosmos brightens as cosmic scale is revealed during the pullback
    vec3 col = galaxy(rd) * mix(2.0, 4.5, pullback);
    col += vec3(0.005, 0.003, 0.015);

    // Geometric star connections (like a cosmic graph)
    float geo = geo_connection(uv * (1.0 - pullback * 0.3));
    col += geo * vec3(0.3, 0.6, 1.0) * (0.5 + 0.5 * u_scene_norm);

    // Fibonacci phyllotaxis — golden seed spiral (scene_norm 0→0.26).
    // The golden angle GA=2π/φ² produces two interlocking Fibonacci spiral families
    // (8-arm CW + 13-arm CCW) — the same pattern sunflowers and galaxies share.
    // First mathematical structure of Act IV: the seed from which all patterns grow.
    col += fibonacci_phyllotaxis(uv, u_scene_norm);

    // Cosmic double helix — mathematical structure of life at cosmic scale.
    // Rises in early Act IV (scene_norm 0.05→0.42) before the tendrils take over.
    // Two counter-phased sinusoidal strands with rung cross-links, rotating slowly
    // to reveal their 3D helical nature. Strand A: amber (organic); B: cyan (data).
    {
        float helix_gate = smoothstep(0.05, 0.16, u_scene_norm)
                         * (1.0 - smoothstep(0.30, 0.44, u_scene_norm));
        col += cosmic_helix(uv, helix_gate);
    }

    // Lorenz strange attractor — chaos mathematics made visible.
    // Bridges the helix (life) → tendrils (growth) → singularity narrative.
    col += lorenz_attractor(uv, u_scene_norm);

    // Light tendrils growing outward from center.
    // Scale UV inward as scene progresses so tendrils expand to fill the frame —
    // "light grows like plants, eventually consuming all space" before the silence.
    float tendril_scale = 1.0 / (1.0 + u_scene_norm * 0.9);
    vec2  uv_t = uv * tendril_scale;
    float tendrils_total = 0.0;
    for (int i = 0; i < 8; i++) {
        float seed = float(i) / 8.0;
        float t_offset = hash(float(i) * 7.3) * 2.0;
        tendrils_total += tendril(uv_t, seed, u_time + t_offset);
    }
    // Color arc: warm amber-gold (organic birth) → electric cyan-blue (cosmic energy) → violet-magenta (transcendence).
    // Driven by scene_norm so the visual narrative evolves monotonically over the 60s finale.
    // A small time-oscillation rides on top for shimmer — but the dominant arc is scene-progress.
    float color_arc = clamp(u_scene_norm / 0.875, 0.0, 1.0);   // 0→1 over active scene window
    vec3 warm_col   = vec3(0.95, 0.70, 0.18);   // amber-gold (life / organic energy)
    vec3 mid_col    = vec3(0.08, 0.58, 1.00);   // electric cyan-blue (cosmic resonance)
    vec3 late_col   = vec3(0.72, 0.12, 0.92);   // violet-magenta (approaching singularity)
    vec3 tendril_col = mix(warm_col,
                           mix(mid_col, late_col, smoothstep(0.42, 0.88, color_arc)),
                           smoothstep(0.0, 0.42, color_arc));
    // Gentle shimmer on top — 8% hue oscillation so petals never look static
    tendril_col     = mix(tendril_col, tendril_col.bgr, sin(u_time * 0.28) * 0.04 + 0.04);
    col += tendrils_total * tendril_col * 1.5;

    // Massive particle fluid: instanced stars in motion
    // (handled by particle system in renderer — here we add screen-space haze)
    float haze = fbm(vec3(uv * 2.0, u_time * 0.05)) * 0.15;
    col += haze * vec3(0.05, 0.02, 0.1);

    // Aurora ribbons: tall cosmic light curtains filling Act IV depth
    col += scene7_auroras(uv, u_scene_norm);

    // Shooting-star comets: bright streaks zip across the galaxy on every other beat
    col += scene7_comets(uv, u_scene_norm);

    // Beat pulse: cosmic energy surge
    float beat_pulse = smoothstep(0.04, 0.0, u_beat) * u_scene_norm * 0.5;
    col += beat_pulse * vec3(0.3, 0.5, 1.0);

    // Beat-reactive cosmic flares: 4 semi-random positions pulse on each 133 BPM kick.
    // Positions shift slowly between bars so the galaxy reads as musically alive.
    {
        float beat_kick = exp(-u_beat * 7.0);
        for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float ns = floor(float(u_bar_cnt) * 0.5 + fi * 2.718);
            vec2 fp = vec2(hash(ns + 0.1) * 2.0 - 1.0,
                           hash(ns + 0.3) * 2.0 - 1.0) * 0.75;
            fp.x *= u_res.x / u_res.y;
            float r = length(uv - fp);
            float flare = beat_kick * exp(-r * 10.0) * 0.28;
            float ring  = exp(-abs(r - u_beat * 1.6) * 35.0) *
                          (1.0 - smoothstep(0.0, 0.30, u_beat)) * 0.18;
            col += (flare + ring) * vec3(0.72, 0.88, 1.0) * u_scene_norm;
        }
    }

    // ─── Singularity convergence rings (scene_norm 0.50→0.875) ───────────────
    // During the vortex window, concentric rings spiral inward toward screen centre
    // (the future SG logo position) — building tension and previewing the singularity.
    // Three simultaneous ring phases at offset intervals give a "tightening spiral" feel.
    // Gated off right before the silence/blackout so the logo reveal stays clean.
    {
        float vgate = smoothstep(0.50, 0.64, u_scene_norm)
                    * (1.0 - smoothstep(0.84, 0.875, u_scene_norm));
        if (vgate > 0.001) {
            float r_asp = length(uv);  // centre is SG logo position in screen space
            float beat_boost = 1.0 + exp(-u_beat * 5.5) * 0.55 * u_scene_norm;
            for (int ri = 0; ri < 3; ri++) {
                // Rings travel inward: phase starts at 1 (edge of screen) and falls to 0 (centre)
                float phase = fract(-u_time * 0.28 + float(ri) * 0.333 + u_scene_norm * 0.6);
                float ring_r = phase * 1.35;  // ring radius: 1.35 → 0.0 as phase 1→0
                float ring_d = abs(r_asp - ring_r);
                float ring   = smoothstep(0.020, 0.0, ring_d) * (1.0 - phase)
                             * beat_boost;
                // Color arc: blue-violet early (scene_norm 0.50) → violet-magenta late (0.875)
                vec3 rcol = mix(vec3(0.28, 0.42, 0.95), vec3(0.78, 0.18, 0.95),
                                smoothstep(0.50, 0.875, u_scene_norm));
                col += ring * rcol * vgate * 0.38;
            }
            // Rotating radial starburst: two counter-rotating spoke systems weave together
            // as the singularity pulls inward. The dual-rotation creates a "mandala collapsing"
            // read that builds tension toward the logo reveal.
            float ang0   = atan(uv.y, uv.x) - u_time * 0.32;  // CW slow primary
            float ang1   = atan(uv.y, uv.x) + u_time * 0.55;  // CCW faster secondary
            float spokes0 = pow(max(0.0, cos(ang0 * 8.0)), 12.0);
            float spokes1 = pow(max(0.0, cos(ang1 * 12.0)), 16.0);
            float star_r  = smoothstep(1.0, 0.0, r_asp) * exp(-r_asp * 3.5);
            col += spokes0 * star_r * vgate * vec3(0.35, 0.18, 0.88) * 0.16;
            col += spokes1 * star_r * vgate * vec3(0.60, 0.10, 0.96) * 0.09;
        }
    }

    // ─── Silence + Logo (final ~10s, scene_norm > 0.875) ─────────────────────
    float logo_t = smoothstep(0.875, 0.92, u_scene_norm);

    // Everything fades to black for the silence
    float silence_fade = smoothstep(0.875, 0.895, u_scene_norm);
    col *= 1.0 - silence_fade;

    // Faint star field re-emerges behind the logo: universe returns from void.
    // Blends in gently from scene_norm 0.905→0.930 so it never competes with the
    // logo — just gives the logo a cosmic backdrop rather than pure black.
    float star_return = smoothstep(0.905, 0.930, u_scene_norm) * 0.17;
    if (star_return > 0.001) col += galaxy(rd) * star_return;

    // Single light pulse (scene_norm ~0.895): instant peak, exponential decay + expanding ring.
    // The pulse is the "Big Bang" moment before the logo materialises — cinematic camera-flash.
    float pulse_t = max(u_scene_norm - 0.895, 0.0);
    float pulse   = exp(-pulse_t * 65.0) * step(0.895, u_scene_norm) * 4.5;
    float p_ring_r = pulse_t * 5.5;
    float p_ring   = smoothstep(0.04, 0.0, abs(length(uv) - p_ring_r));
    pulse += p_ring * exp(-pulse_t * 28.0) * 2.5;
    col += vec3(0.78, 0.90, 1.0) * pulse;

    // Logo appears (12 data streams converging from all angles)
    float logo_appear = smoothstep(0.905, 0.93, u_scene_norm);
    float logo_d = logo_sdf(uv * 2.0);
    float logo_mask = smoothstep(0.008, 0.0, logo_d);

    float streams = 0.0;
    for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float angle = fi * 0.5236;   // π/6 — evenly spaced
        vec2 stream_dir = normalize(vec2(cos(angle), sin(angle)));
        float along = dot(uv, stream_dir);
        float across = abs(dot(uv, vec2(-stream_dir.y, stream_dir.x)));
        float w = 0.003 + hash(fi * 2.3) * 0.002;  // slight width variation
        streams += smoothstep(w, 0.0, across) *
                   step(0.0, along) *
                   fract(along * 6.0 + u_time * 3.0 + fi * 0.4) * logo_appear;
    }

    // Two-layer logo glow: inner tight edge + outer atmospheric halo
    vec3 logo_col   = mix(vec3(0.5, 0.75, 1.0), vec3(1.0, 1.0, 1.0), logo_appear);
    float logo_halo = exp(-max(logo_d * 2.0, 0.0) * 6.0) * logo_appear;  // wide soft halo
    col += (logo_mask + streams * 0.25) * logo_col * logo_appear * 3.5;
    col += logo_halo * vec3(0.3, 0.5, 1.0) * 1.5;

    // Prismatic edge fringing: R/B channels sample logo SDF at ±offset UV.
    // The "fringe" is the region covered by the offset mask but not the centered
    // mask — exactly the chromatic aberration band at each letter edge.
    // Mimics light dispersion through crystalline letter forms.
    // Pulses with the breathing sine and fades with the halo.
    {
        float prism = logo_appear * (0.70 + 0.30 * sin(u_time * 3.14)) * 0.45;
        if (prism > 0.002) {
            const float off = 0.0065;
            float mask_r = smoothstep(0.009, 0.0, logo_sdf((uv + vec2(off, 0.0)) * 2.0));
            float mask_b = smoothstep(0.009, 0.0, logo_sdf((uv - vec2(off, 0.0)) * 2.0));
            float fringe_r = max(mask_r - logo_mask, 0.0);  // red halo on +x edge
            float fringe_b = max(mask_b - logo_mask, 0.0);  // blue halo on -x edge
            col.r += fringe_r * prism * 2.2;
            col.b += fringe_b * prism * 2.8;
            col.g += (fringe_r + fringe_b) * prism * 0.40;  // slight green for full spectrum
        }
    }

    // Breathing pulse — logo "breathes" once it's up (slow sine, 0.5 Hz)
    float logo_breath = logo_appear * (0.85 + 0.15 * sin(u_time * 3.14));
    col *= mix(1.0, logo_breath, logo_appear * 0.3);

    // Full title: "SINGULARITY GARDEN" — per-character stagger reveal
    // First char appears at scene_norm 0.920; last fully visible at ~0.962.
    float title_norm = smoothstep(0.920, 0.962, u_scene_norm);
    float title_px   = render_title_text(uv, u_scene_norm);
    vec3 title_col   = mix(vec3(0.55, 0.78, 1.0), vec3(0.85, 0.92, 1.0), title_norm);
    col += title_px * title_col * 2.0;

    // Subtitle: "BY AGENTIX" — per-char stagger from 0.960 (first) to ~0.975 (all fully up)
    float sub_appear = smoothstep(0.960, 0.975, u_scene_norm);
    float sub_px     = render_subtitle(uv, u_scene_norm);
    vec3  sub_col    = mix(vec3(0.38, 0.52, 0.88), vec3(0.55, 0.70, 0.95), sub_appear);
    col += sub_px * sub_col * 1.3;

    // Year "2026" — production year stamp below credit dots, demoscene standard.
    // Tiny, soft, blue-white — appears last, sealing the credits sequence.
    float year_appear = smoothstep(0.976, 0.992, u_scene_norm);
    float year_px     = render_year(uv, u_scene_norm);
    col += year_px * vec3(0.28, 0.42, 0.78) * year_appear * 0.9;

    // Decorative separator line below logo (scene_norm > 0.94)
    float sep_appear = smoothstep(0.950, 0.968, u_scene_norm);
    float sep_y      = uv.y + 0.30;
    float sep_mask   = smoothstep(0.0015, 0.0, abs(sep_y)) *
                       smoothstep(0.0, 0.55, 0.55 - abs(uv.x)) *
                       sep_appear;
    col += sep_mask * vec3(0.4, 0.6, 1.0) * 1.5;

    // Group credit dots: small glowing points below separator (scene_norm > 0.970)
    // Two groups of 10, each centered symmetrically around ±0.28 with a clear gap.
    for (int i = 0; i < 20; i++) {
        float fi = float(i);
        // Group 1 (i<10): center at -0.28; group 2 (i≥10): center at +0.28.
        // Each group spans ±0.243 → gap between groups is 0.037 each side = 0.074 wide.
        float xoff = (fi < 10.0) ? (fi - 4.5) * 0.054 - 0.28
                                  : (fi - 14.5) * 0.054 + 0.28;
        float yoff = -0.40;
        float h    = hash(fi * 5.91);
        float d    = length(uv - vec2(xoff, yoff));
        float sz   = 0.006 + h * 0.004;
        // Stagger the appear animation
        float dot_appear = smoothstep(0.970 + float(i) * 0.001, 0.990 + float(i) * 0.001, u_scene_norm);
        col += sz / (d + sz) * 0.07 * vec3(0.45 + fi * 0.012, 0.70, 1.0) * dot_appear;
    }

    // Vignette
    float vig = 1.0 - dot(uv * 0.35, uv * 0.35);
    col *= vig;

    frag_color = vec4(col, 1.0);
}
