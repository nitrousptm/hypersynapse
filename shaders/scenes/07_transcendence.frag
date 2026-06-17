#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform int   u_bar_cnt;
uniform float u_act_norm;
uniform float u_scene_norm;
uniform float u_rms;         // audio RMS amplitude [0,1] from precomputed envelope

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

// ─── Lorenz chaotic attractor — butterfly effect: two diverging orbits ────────
// The Lorenz system (σ=10, ρ=28, β=8/3) generates a butterfly-shaped strange
// attractor: deterministic chaos that nonetheless obeys strict mathematical law.
// Appears between the cosmic helix and singularity rings (scene_norm 0.22→0.52).
// TWO simultaneous trajectories with different phase seeds fill both wings of the
// butterfly more densely. Trajectory B fades in at 0.29→0.37 — the attractor's
// full shape emerges as two independent chaotic orbits converge on the same manifold.
// Euler integration: Traj A = 40 warmup + 80 draw; Traj B = 40 warmup + 60 draw.
vec3 lorenz_attractor(vec2 uv, float scene_norm) {
    float gate = smoothstep(0.22, 0.34, scene_norm)
               * (1.0 - smoothstep(0.44, 0.54, scene_norm));
    if (gate < 0.001) return vec3(0.0);

    const float sigma = 10.0, rho = 28.0, beta = 8.0 / 3.0;
    const float dt    = 0.012;

    float ang = u_time * 0.07;
    float ca = cos(ang), sa = sin(ang);
    float beat_b  = 1.0 + exp(-u_beat * 7.0) * 0.60;
    const float inv_sx = 1.0 / 22.0;
    const float inv_sz = 1.0 / 25.0;
    const float scl    = 0.38;

    vec3 col = vec3(0.0);

    // ── Trajectory A: amber-gold (left wing) / electric cyan (right wing) ───────
    {
        float ts = u_time * 0.035;
        vec3 p = vec3(0.10 + sin(ts) * 0.14,
                      0.00 + cos(ts * 0.71) * 0.08,
                      14.0);
        for (int i = 0; i < 40; i++) {
            vec3 dp = vec3(sigma*(p.y-p.x), p.x*(rho-p.z)-p.y, p.x*p.y-beta*p.z);
            p += dp * dt;
        }
        vec2 prev_sc = vec2(-9.0);
        for (int i = 0; i < 80; i++) {
            vec3 dp = vec3(sigma*(p.y-p.x), p.x*(rho-p.z)-p.y, p.x*p.y-beta*p.z);
            p += dp * dt;
            float px_r = p.x*ca - p.y*sa;
            vec2  cur  = vec2(px_r*inv_sx, (p.z-25.0)*inv_sz) * scl;
            if (i > 0) {
                vec2 ab = cur-prev_sc, ap = uv-prev_sc;
                float tc = clamp(dot(ap,ab)/max(dot(ab,ab),1e-7), 0.0, 1.0);
                float d  = length(ap - ab*tc);
                float wing  = smoothstep(-3.0, 3.0, p.x);
                vec3  w_col = mix(vec3(0.95,0.62,0.12), vec3(0.08,0.72,0.98), wing);
                float depth = 0.55 + 0.45*clamp((p.x*sa+p.y*ca)/22.0*0.5+0.5, 0.0, 1.0);
                col += w_col * exp(-d*d*5000.0) * gate * beat_b * depth * 0.65;
            }
            prev_sc = cur;
        }
    }

    // ── Trajectory B: π phase-shifted seed — same manifold, different orbit ─────
    // Two independent chaotic orbits on the Lorenz attractor fill the butterfly
    // wings with denser coverage, making the fractal structure visible sooner.
    // Violet-rose tint distinguishes it from trajectory A's amber/cyan palette.
    float traj_b = smoothstep(0.29, 0.37, scene_norm);
    if (traj_b > 0.001) {
        float ts = u_time * 0.035 + 3.14159;  // π phase → fully decorrelated orbit
        vec3 p = vec3(0.10 + sin(ts) * 0.14,
                      0.00 + cos(ts * 0.71) * 0.08,
                      14.0);
        for (int i = 0; i < 40; i++) {
            vec3 dp = vec3(sigma*(p.y-p.x), p.x*(rho-p.z)-p.y, p.x*p.y-beta*p.z);
            p += dp * dt;
        }
        vec2 prev_sc = vec2(-9.0);
        for (int i = 0; i < 60; i++) {
            vec3 dp = vec3(sigma*(p.y-p.x), p.x*(rho-p.z)-p.y, p.x*p.y-beta*p.z);
            p += dp * dt;
            float px_r = p.x*ca - p.y*sa;
            vec2  cur  = vec2(px_r*inv_sx, (p.z-25.0)*inv_sz) * scl;
            if (i > 0) {
                vec2 ab = cur-prev_sc, ap = uv-prev_sc;
                float tc = clamp(dot(ap,ab)/max(dot(ab,ab),1e-7), 0.0, 1.0);
                float d  = length(ap - ab*tc);
                float wing  = smoothstep(-3.0, 3.0, p.x);
                // Violet-rose (left wing) / warm-gold (right wing) — contrasts with A
                vec3  w_col = mix(vec3(0.78,0.15,0.90), vec3(0.98,0.80,0.15), wing);
                float depth = 0.55 + 0.45*clamp((p.x*sa+p.y*ca)/22.0*0.5+0.5, 0.0, 1.0);
                col += w_col * exp(-d*d*5000.0) * gate * traj_b * beat_b * depth * 0.52;
            }
            prev_sc = cur;
        }
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

// ─── Mandelbrot mini-map (scene_norm 0.52→0.76) ──────────────────────────────
// Small corner visualization of the Mandelbrot parameter space shown alongside
// the Julia set window. A glowing amber dot marks the current c value used in
// julia_morph() as it orbits the seahorse valley (−0.73+0.19i).
// Demoscene viewers who know complex dynamics can read exactly which Julia set
// is displayed — a sophisticated nod to mathematical context.
// Position: lower-left corner in aspect-corrected UV space.
vec3 mandelbrot_minimap(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    const vec2  mm_center = vec2(-1.10, -0.68);  // center in aspect-corrected UV
    const float mm_hw     = 0.172;               // half-width (screen units)
    const float mm_hh     = 0.112;               // half-height

    vec2 mm_local = uv - mm_center;
    if (abs(mm_local.x) > mm_hw || abs(mm_local.y) > mm_hh)
        return vec3(0.0);

    // Map mm_local → Mandelbrot complex plane: x∈[−2.2, 0.8], y∈[−1.2, 1.2]
    const vec2 c_min = vec2(-2.2, -1.2);
    const vec2 c_max = vec2( 0.8,  1.2);
    vec2 t2 = mm_local / vec2(mm_hw, mm_hh) * 0.5 + 0.5;
    vec2 c  = mix(c_min, c_max, t2);

    // Mandelbrot escape-time (24 iterations: sufficient for boundary detail)
    vec2  zmb  = vec2(0.0);
    float si_mb = 0.0;
    bool  esc_mb = false;
    for (int i = 0; i < 24; i++) {
        zmb = vec2(zmb.x*zmb.x - zmb.y*zmb.y, 2.0*zmb.x*zmb.y) + c;
        float l2 = dot(zmb, zmb);
        if (l2 > 4.0) {
            si_mb = float(i) + 1.0 - log2(log2(l2));
            esc_mb = true;
            break;
        }
    }

    vec3 col = vec3(0.005, 0.010, 0.028) * gate;  // dim interior

    if (esc_mb) {
        float band  = si_mb / 24.0;
        float ripple = sin(band * 3.14159 * 6.0 - u_time * 0.45) * 0.5 + 0.5;
        float bright = pow(ripple, 3.5) * smoothstep(0.0, 0.07, band);
        col += vec3(0.04, 0.14, 0.48) * bright * 0.55 * gate;  // exterior: deep blue
    }

    // Current c orbit: same formula as julia_morph()
    float tj  = clamp((u_scene_norm - 0.52) / 0.24, 0.0, 1.0);
    float c_ang = u_time * 0.055 + tj * 1.80;
    vec2  c_val = vec2(-0.7269 + 0.13 * cos(c_ang),
                        0.1889 + 0.11 * sin(c_ang * 1.31));

    // Map c_val back to screen UV
    vec2 c_t    = (c_val - c_min) / (c_max - c_min);        // [0,1]×[0,1]
    vec2 c_scr  = (c_t - 0.5) * 2.0 * vec2(mm_hw, mm_hh) + mm_center;
    float c_dist = length(uv - c_scr);
    // Amber dot + soft halo
    col += exp(-c_dist * c_dist * 14000.0) * vec3(1.0, 0.82, 0.12) * 2.2 * gate;
    col += exp(-c_dist * 70.0) * vec3(0.88, 0.65, 0.08) * 0.55 * gate;

    // Subtle rectangle frame
    float bx = abs(mm_local.x) - mm_hw + 0.005;
    float by = abs(mm_local.y) - mm_hh + 0.005;
    float bframe = max(bx, by);
    col += smoothstep(0.005, 0.0, abs(bframe) + 0.001)
         * vec3(0.12, 0.22, 0.60) * 0.32 * gate;

    return col;
}

// ─── Julia set morphing fractal (scene_norm 0.52→0.76) ───────────────────────
// After the Lorenz attractor (chaos) and before singularity convergence: the Julia
// set morphs as its parameter c traces the Mandelbrot seahorse valley — spectacular
// filamentary shapes that are each unique, organically complex, and unmistakably
// mathematical. Narrative: "every chaotic orbit traces a Julia set — the boundary
// between stability and escape. All boundaries collapse into the singularity."
// Rendered as glowing filaments (escape bands near boundary) not a solid block,
// so it blends additively over the galaxy and tendril background.
vec3 julia_morph(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    float asp = u_res.x / u_res.y;
    float t   = clamp((u_scene_norm - 0.52) / 0.24, 0.0, 1.0);  // 0→1 over gate window

    // c traces a slow closed path near the Mandelbrot seahorse valley (−0.74, 0.11i)
    // — every point on this circle gives a visually distinct Julia fractal.
    float c_ang = u_time * 0.055 + t * 1.80;
    vec2  c_val = vec2(-0.7269 + 0.13 * cos(c_ang),
                        0.1889 + 0.11 * sin(c_ang * 1.31));

    // Square coordinates — Julia sets are symmetric, needs unscaled x for correct shape.
    float zoom = 1.08 + t * 0.70;   // zoom in gently over the gate window
    vec2  z    = vec2(uv.x / asp, uv.y) / zoom;

    // 48-step escape-time Julia iteration with smooth continuous coloring.
    const int MAX_IT = 48;
    float si   = 0.0;
    bool  esc  = false;
    for (int i = 0; i < MAX_IT; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c_val;
        float len2 = dot(z, z);
        if (len2 > 16.0) {
            // Normalized iteration count: continuous smooth banding (no boxy rings)
            si  = float(i) + 1.0 - log2(log2(len2) * 0.5);
            esc = true;
            break;
        }
    }

    // Interior (non-escaping orbit) = black/transparent in additive blend
    if (!esc) return vec3(0.0);

    float band = si / float(MAX_IT);

    // Filament coloring: high-contrast thin bands right at the boundary.
    // sin with high frequency picks out thin equi-escape rings;
    // pow sharpens them to fine glowing filaments (HYPERSYNAPSE neural-filament look).
    float ripple     = sin(band * 3.14159 * 14.0 - u_time * 1.60) * 0.5 + 0.5;
    float brightness = pow(ripple, 3.5)
                     * smoothstep(0.0, 0.04, band)           // suppress solid interior halo
                     * (1.0 - smoothstep(0.82, 1.0, band));  // keep filaments, fade outer noise

    // Color arc: electric cyan (Lorenz hand-off at 0.52) → violet-magenta (0.76)
    float color_t = smoothstep(0.28, 0.85, t);
    vec3 col_a    = vec3(0.10, 0.62, 1.00);   // electric cyan
    vec3 col_b    = vec3(0.60, 0.08, 0.96);   // violet-magenta (approaching singularity)
    vec3 fcol     = mix(col_a, col_b, color_t);

    float beat_boost = 1.0 + smoothstep(0.07, 0.0, u_beat) * 0.55;

    return fcol * brightness * 0.38 * gate * beat_boost;
}

// ─── Clifford torus — flat T² embedded in S³ ─────────────────────────────────
// The Clifford torus C_T ⊂ S³ ⊂ R⁴ is the preimage of the equator S¹ ⊂ S² under
// the Hopf map π.  It is parameterised as:
//   p(u,v) = ( cos u, sin u, cos v, sin v ) / √2,   u,v ∈ [0, 2π]
// It is equidistant from both poles of S³ and has zero intrinsic Gaussian curvature
// — the unique flat torus in S³.  Every u-circle is geometrically identical to
// every v-circle: pure S¹ × S¹.
//
// Two independent 4D rotations (XW-plane θ₁ and YZ-plane θ₂) visibly morph the
// projected wireframe — the torus appears to invert through itself, making the
// intrinsic geometry of S³ tangible. This cannot happen in flat R³.
//
// Wireframe: 16 U-rings (constant v) + 16 V-rings (constant u), 28 segments each.
// Gate: scene_norm 0.40→0.56 — bridges Lorenz (chaotic R³) to Hopf S³ topology.
vec3 clifford_torus(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    const float INV_SQRT2 = 0.70710678118;
    const float TAU = 6.28318530718;

    float beat_boost = 1.0 + smoothstep(0.08, 0.0, u_beat) * 0.65;

    // Independent 4D rotations: XW-plane (theta1) and YZ-plane (theta2)
    float c1 = cos(u_time * 0.18), s1 = sin(u_time * 0.18);
    float c2 = cos(u_time * 0.13), s2 = sin(u_time * 0.13);

    // 3D view: slow Y-axis rotation + gentle X-tilt
    float rot_y = u_time * 0.09;
    float rot_x = 0.28 + sin(u_time * 0.05) * 0.08;
    float cry = cos(rot_y), sry = sin(rot_y);
    float crx = cos(rot_x), srx = sin(rot_x);

    const float FOCAL  = 2.6;
    const int   N_RING = 16;
    const int   N_SEG  = 28;
    vec3 col = vec3(0.0);

    // U-circles (constant v, u sweeps 0 to 2pi)
    // Color: amber-gold (v near 0 or 2pi) to electric cyan (v near pi)
    for (int vi = 0; vi < N_RING; vi++) {
        float v   = float(vi) / float(N_RING) * TAU;
        float cv  = cos(v), sv = sin(v);
        vec3 rcol = mix(vec3(0.92, 0.60, 0.12), vec3(0.10, 0.80, 0.95),
                        abs(sin(v * 0.5)));

        vec2 prev_proj = vec2(0.0);
        bool have_prev = false;

        for (int si = 0; si <= N_SEG; si++) {
            float u  = float(si % N_SEG) / float(N_SEG) * TAU;
            vec4 p4  = vec4(cos(u), sin(u), cv, sv) * INV_SQRT2;

            // 4D rotation: XW then YZ
            float rx = p4.x*c1 - p4.w*s1,  rw = p4.x*s1 + p4.w*c1;
            float ry = p4.y*c2 - p4.z*s2,  rz = p4.y*s2 + p4.z*c2;

            // Stereographic projection S3 -> R3 from north pole (0,0,0,1)
            float dn = 1.0 - rw;
            if (abs(dn) < 0.08) { have_prev = false; continue; }
            vec3 q = vec3(rx, ry, rz) / dn;

            // 3D view rotation: X-tilt then Y-rotation
            float qy2 = q.y*crx + q.z*srx,  qz2 = -q.y*srx + q.z*crx;
            float qx3 = q.x*cry + qz2*sry,  qz3 = -q.x*sry + qz2*cry;

            float depth = qz3 + FOCAL;
            if (depth < 0.15) { have_prev = false; continue; }
            vec2 proj = vec2(qx3, qy2) * (FOCAL / depth) * 0.55;
            if (abs(proj.x) > 2.0 || abs(proj.y) > 1.9)
                { have_prev = false; continue; }

            float z_fade = 1.0 / (1.0 + max(qz3, 0.0) * 0.45);

            if (have_prev) {
                vec2 ab = proj - prev_proj;
                float len2 = dot(ab, ab);
                if (len2 > 1e-8) {
                    float tc = clamp(dot(uv - prev_proj, ab) / len2, 0.0, 1.0);
                    float d  = length(uv - prev_proj - ab * tc);
                    col += rcol * exp(-d*d*3500.0) * z_fade * gate * beat_boost * 0.50;
                }
            }
            prev_proj = proj;
            have_prev = true;
        }
    }

    // V-circles (constant u, v sweeps 0 to 2pi)
    // Color: teal (u near 0) to violet-magenta (u near pi)
    for (int ui = 0; ui < N_RING; ui++) {
        float u   = float(ui) / float(N_RING) * TAU;
        float cu  = cos(u), su = sin(u);
        vec3 rcol = mix(vec3(0.12, 0.72, 0.88), vec3(0.68, 0.08, 0.90),
                        abs(sin(u * 0.5)));

        vec2 prev_proj = vec2(0.0);
        bool have_prev = false;

        for (int si = 0; si <= N_SEG; si++) {
            float v  = float(si % N_SEG) / float(N_SEG) * TAU;
            vec4 p4  = vec4(cu, su, cos(v), sin(v)) * INV_SQRT2;

            float rx = p4.x*c1 - p4.w*s1,  rw = p4.x*s1 + p4.w*c1;
            float ry = p4.y*c2 - p4.z*s2,  rz = p4.y*s2 + p4.z*c2;

            float dn = 1.0 - rw;
            if (abs(dn) < 0.08) { have_prev = false; continue; }
            vec3 q = vec3(rx, ry, rz) / dn;

            float qy2 = q.y*crx + q.z*srx,  qz2 = -q.y*srx + q.z*crx;
            float qx3 = q.x*cry + qz2*sry,  qz3 = -q.x*sry + qz2*cry;

            float depth = qz3 + FOCAL;
            if (depth < 0.15) { have_prev = false; continue; }
            vec2 proj = vec2(qx3, qy2) * (FOCAL / depth) * 0.55;
            if (abs(proj.x) > 2.0 || abs(proj.y) > 1.9)
                { have_prev = false; continue; }

            float z_fade = 1.0 / (1.0 + max(qz3, 0.0) * 0.45);

            if (have_prev) {
                vec2 ab = proj - prev_proj;
                float len2 = dot(ab, ab);
                if (len2 > 1e-8) {
                    float tc = clamp(dot(uv - prev_proj, ab) / len2, 0.0, 1.0);
                    float d  = length(uv - prev_proj - ab * tc);
                    col += rcol * exp(-d*d*3500.0) * z_fade * gate * beat_boost * 0.50;
                }
            }
            prev_proj = proj;
            have_prev = true;
        }
    }

    return col;
}

// ─── Hopf Fibration (S³ → S²) ─────────────────────────────────────────────────
// π: S³ → S² is a principal circle-bundle: every point q on S² has exactly one
// preimage circle (fiber) in S³. Any two distinct fibers link exactly once
// (the Hopf link). Under stereographic projection S³ → R³, each fiber becomes a
// circle or line, and fibers over a latitude band of S² form a torus in R³.
// The full structure is S³ decomposed into a one-parameter family of linked tori.
//
// Mathematical bridge in Act IV:
//   Lorenz (chaotic orbits in R³) → Hopf (ordered S³ fibers over S²)
//   → Julia (ℂ-plane chaos boundary) → Riemann (S² compactification) → singularity
//
// The Riemann sphere IS the base space S² of this fibration — showing the fibers
// before showing S² gives the audience the full π: S³ → S² structure in sequence.
//
// Gate: scene_norm 0.44→0.67 — bridges the Lorenz fade-out and Julia's flat form.

vec3 hopf_fibration(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    vec3 col = vec3(0.0);

    // Camera: slow Y rotation reveals the interlocking ring structure over time
    float rot_y = u_time * 0.11;
    float rot_x = 0.35 + sin(u_time * 0.06) * 0.10;  // gentle nod
    float cry = cos(rot_y), sry = sin(rot_y);
    float crx = cos(rot_x), srx = sin(rot_x);

    const float FOCAL = 2.5;   // perspective focal length (camera at z = -FOCAL)
    const float SCALE = 0.28;  // world-space scale: south-pole fiber has radius 0.28
    const int   N_B   = 22;    // number of Hopf fibers to draw
    const int   N_T   = 52;    // discrete samples per fiber circle

    float beat_boost = 1.0 + exp(-u_beat * 5.5) * 0.55;

    // Distribute base directions uniformly on S² via Fibonacci sphere spiral.
    // The golden angle (≈2.3999 rad) ensures no two points share a meridian.
    for (int b = 0; b < N_B; b++) {
        float fb = (float(b) + 0.5) / float(N_B);

        float cos_lat = 1.0 - 2.0 * fb;   // uniform in solid angle: +1=north, -1=south
        float sin_lat = sqrt(max(0.0, 1.0 - cos_lat * cos_lat));
        float lon     = float(b) * 2.39996;  // golden angle

        // Fiber over the north pole of S² is a straight line (maps to infinity).
        // Skip its neighborhood to avoid unbounded stereographic projections.
        if (cos_lat > 0.85) continue;

        vec3 base_dir = vec3(sin_lat * cos(lon), sin_lat * sin(lon), cos_lat);

        // Hopf quaternion parametrisation: z₁ = cos(θ/2), z₂ = sin(θ/2)·e^{iφ}
        // The fiber over base_dir is the circle t → (z₁·eⁱᵗ, z₂·eⁱᵗ) on S³.
        float theta = acos(clamp(base_dir.z, -1.0, 1.0));
        float phi   = atan(base_dir.y, base_dir.x);
        float ar    = cos(theta * 0.5);             // z₁ (real, no im part)
        float br    = sin(theta * 0.5) * cos(phi); // z₂.re
        float bi    = sin(theta * 0.5) * sin(phi); // z₂.im

        // Color by latitude: south pole = electric cyan, equator = amber-gold,
        // north = violet-magenta — aligned with the active tendril color arc.
        float lt = (cos_lat + 1.0) * 0.5;  // 0 = south, 1 = north
        vec3 fc = lt < 0.5
            ? mix(vec3(0.08, 0.72, 0.98), vec3(0.95, 0.68, 0.18), lt * 2.0)
            : mix(vec3(0.95, 0.68, 0.18), vec3(0.65, 0.10, 0.90), (lt - 0.5) * 2.0);

        // Render fiber as connected glow segments (Lorenz-style segment SDF)
        vec2 prev_proj = vec2(-9.0);
        bool have_prev = false;

        for (int ti = 0; ti <= N_T; ti++) {
            // ti == N_T closes the circle back to t=0
            float t  = float(ti % N_T) * (6.28318 / float(N_T));
            float ct = cos(t), st = sin(t);

            // S³ point in R⁴: (z₁·eⁱᵗ, z₂·eⁱᵗ) split into real coords
            float x0 = ar * ct;
            float x1 = ar * st;
            float x2 = br * ct - bi * st;
            float x3 = br * st + bi * ct;

            // Stereographic projection from north pole (1,0,0,0) of S³ to R³:
            // p = (x1, x2, x3) / (1 - x0)
            float denom = 1.0 - x0;
            if (denom < 0.04) { have_prev = false; continue; }  // near-pole guard
            vec3 p = vec3(x1, x2, x3) * (SCALE / denom);

            // Camera rotation: Y-axis yaw then X-axis pitch
            float px2 = p.x * cry + p.z * sry;
            float pz2 = -p.x * sry + p.z * cry;
            p = vec3(px2, p.y, pz2);
            float py3 = p.y * crx - p.z * srx;
            float pz3 = p.y * srx + p.z * crx;
            p = vec3(p.x, py3, pz3);

            // Perspective projection (camera at z = -FOCAL)
            float depth = p.z + FOCAL;
            if (depth < 0.15) { have_prev = false; continue; }
            vec2 proj = p.xy * (FOCAL / depth);

            // Clip off-screen early — no glow contribution from distant projected points
            if (abs(proj.x) > 1.95 || abs(proj.y) > 1.75) { have_prev = false; continue; }

            // Depth attenuation: far points appear dimmer for 3D depth cue
            float z_fade = 1.0 / (1.0 + max(p.z, 0.0) * 0.40);

            if (have_prev) {
                vec2 ab = proj - prev_proj;
                vec2 ap = uv   - prev_proj;
                float tc = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-7), 0.0, 1.0);
                float d  = length(ap - ab * tc);
                col += fc * exp(-d * d * 3800.0) * z_fade * gate * beat_boost * 0.52;
            }
            prev_proj = proj;
            have_prev = true;
        }
    }

    return col;
}

// ─── Riemann sphere — Julia set on the compactified complex plane ─────────────
// The Riemann sphere maps ℂ onto S² via stereographic projection from the south
// pole: w = (px + i·py) / (1 + pz).  The north pole is the unique point that
// maps to complex INFINITY.  A Julia set lives on this sphere — its escaping
// filaments spiral ever closer to the north pole, which IS the demo's singularity.
// The sphere rotates slowly so the audience understands 3D topology, then the
// bright north-pole cap locks onto screen center as the vortex takes over.
// Gate: scene_norm 0.67→0.87 — bridges Julia (0.52–0.76) → convergence (0.50+).
vec3 riemann_sphere(vec2 uv, float gate) {
    if (gate < 0.001) return vec3(0.0);

    float asp = u_res.x / u_res.y;

    // Collapse animation: sphere freezes rotation, north pole tilts toward viewer,
    // then shrinks to a singularity point at scene_norm 0.82→0.87.
    // The north pole = complex ∞ = this demo's singularity — the collapse makes
    // the mathematical abstraction physical: ∞ becomes the convergence rings' centre.
    float collapse_t = smoothstep(0.82, 0.87, u_scene_norm);

    // Work in circular (aspect-correct) space so the sphere looks round
    vec2  sc       = vec2(uv.x / asp, uv.y);
    // Sphere radius shrinks quadratically during collapse → 8% of full size at t=1
    float sphere_r = 0.36 * smoothstep(0.0, 0.30, gate)
                   * (1.0 - collapse_t * collapse_t * 0.92);
    if (sphere_r < 0.001) return vec3(0.0);

    float r2 = dot(sc, sc);
    // Extended coverage: Möbius background grid visible to 3.2× sphere radius
    if (r2 > sphere_r * sphere_r * 10.24) return vec3(0.0);  // 3.2² = 10.24

    bool  on_sphere = (r2 <= sphere_r * sphere_r);
    float dlen      = length(sc) / sphere_r;
    float z3        = on_sphere ? sqrt(max(0.0, 1.0 - dlen * dlen)) : 0.0;
    vec3  n3        = vec3(sc.x / sphere_r, sc.y / sphere_r, z3);

    // Y-axis rotation slows to a stop during collapse (freeze the axis)
    float rot_t = u_time * 0.13 * (1.0 - collapse_t * 0.96);
    float cr = cos(rot_t), sr = sin(rot_t);
    vec3 p3 = vec3(n3.x * cr + n3.z * sr, n3.y, -n3.x * sr + n3.z * cr);
    // Pitch gradually reduces during collapse: north pole tilts toward camera
    float pitch = mix(0.30, 0.0, collapse_t * 0.85);
    float cp = cos(pitch), sp_ = sin(pitch);
    p3 = vec3(p3.x, p3.y * cp - p3.z * sp_, p3.y * sp_ + p3.z * cp);

    // Stereographic projection → complex plane coordinate w
    float denom = max(1.0 + p3.z, 0.001);
    vec2  w     = p3.xy / denom * 1.55;

    // Julia set evaluation — same morphing c as julia_morph() for visual continuity.
    // Only run the 48-step iteration for sphere-surface pixels (not background).
    float t_j   = clamp((u_scene_norm - 0.52) / 0.24, 0.0, 1.0);
    float c_ang = u_time * 0.055 + t_j * 1.80;
    vec2  c_val = vec2(-0.7269 + 0.13 * cos(c_ang),
                        0.1889 + 0.11 * sin(c_ang * 1.31));
    float si  = 0.0;
    bool  esc = false;
    if (on_sphere) {
        vec2 zz = w;
        for (int i = 0; i < 48; i++) {
            zz = vec2(zz.x * zz.x - zz.y * zz.y, 2.0 * zz.x * zz.y) + c_val;
            float l2 = dot(zz, zz);
            if (l2 > 16.0) {
                si  = float(i) + 1.0 - log2(log2(l2) * 0.5);
                esc = true;
                break;
            }
        }
    }

    vec3  col      = vec3(0.0);
    float color_t  = smoothstep(0.28, 0.85, t_j);
    vec3  fcol     = mix(vec3(0.10, 0.62, 1.00), vec3(0.60, 0.08, 0.96), color_t);

    if (on_sphere) {
        // ── Julia filaments on sphere surface ──────────────────────────────────
        if (esc) {
            float band   = si / 48.0;
            float ripple = sin(band * 3.14159 * 14.0 - u_time * 1.60) * 0.5 + 0.5;
            float bright = pow(ripple, 3.5)
                         * smoothstep(0.0, 0.04, band)
                         * (1.0 - smoothstep(0.82, 1.0, band));
            col += fcol * bright * 0.60;
        }

        // ── Spherical coordinate grid (lat/lon lines every 30°) ────────────────
        // Makes the sphere's topology explicit: 7 latitude parallels + 12 meridians
        // laid over the Julia filaments as a faint coordinate framework.
        // Shows the viewer that these filaments are WRAPPING around a sphere, not flat.
        {
            float sph_lat = asin(clamp(p3.z, -0.999, 0.999));  // -π/2 to +π/2
            float sph_lon = atan(p3.y, p3.x);                   // -π to +π
            // sin(lat*6)=0 at each k*30° of latitude (7 parallels including poles)
            float par_line = smoothstep(0.14, 0.0, abs(sin(sph_lat * 6.0)));
            // sin(lon*6)=0 at each k*30° of longitude (12 meridians)
            float mer_line = smoothstep(0.14, 0.0, abs(sin(sph_lon * 6.0)));
            // Equator gets a slightly brighter accent line
            float eq_line  = smoothstep(0.05, 0.0, abs(sph_lat));
            float grid_val = max(par_line, mer_line) * 0.12 + eq_line * 0.06;
            col += mix(vec3(0.35, 0.58, 1.0), fcol, 0.40) * grid_val;
        }

        // Subtle sphere-surface ambient + diffuse
        vec3 ldir = normalize(vec3(-0.4, 0.7, 0.5));
        col += (0.06 + max(dot(n3, ldir), 0.0) * 0.18) * vec3(0.04, 0.02, 0.10);

        // North pole = ∞ = singularity: glowing bright cap where all orbits converge.
        float north_glow = smoothstep(0.50, 0.92, p3.z);
        col += vec3(0.82, 0.88, 1.00) * north_glow * north_glow * 2.8;

        // Fresnel rim — edge of the sphere silhouette
        float rim = pow(1.0 - z3, 3.5);
        col += fcol * rim * 0.52;
    } else {
        float bg_r = sqrt(r2);
        // ── Atmospheric corona (near edge) ────────────────────────────────────
        float edge_dist = bg_r - sphere_r;
        float corona    = exp(-edge_dist / (sphere_r * 0.06)) * 0.24;
        col += fcol * corona;

        // ── Möbius conformal grid (complex plane ℂ surrounding the sphere) ────
        // In stereographic projection, latitude circles on S² map to CONCENTRIC
        // CIRCLES in ℂ, and longitude meridians map to RADIAL LINES through the
        // origin. Together they form the Möbius coordinate grid — every circle
        // and line in ℂ is a Möbius circle, and this conformal structure is what
        // makes S²≅ℂ∪{∞} the foundation of complex analysis.
        // Meridian rays: great circles through poles → lines radiating from origin
        float bg_ang  = atan(sc.y, sc.x);
        float ray_v   = abs(sin(bg_ang * 6.0));  // 12 meridian lines at 30° spacing
        float ray_w   = 0.22 / (bg_r / sphere_r + 0.55);  // width tapers outward
        float ray_fade = exp(-edge_dist / sphere_r * 0.55)
                       * (1.0 - smoothstep(sphere_r * 2.4, sphere_r * 3.2, bg_r));
        float ray_val  = smoothstep(ray_w, 0.0, ray_v) * ray_fade;
        // Latitude circles: parallels on S² → concentric circles in ℂ
        // Approximate stereographic radii for 30°/60°/equator parallels
        float circles = 0.0;
        circles += smoothstep(0.016, 0.0, abs(bg_r - sphere_r * 1.60)) * 0.80;  // ~equator
        circles += smoothstep(0.016, 0.0, abs(bg_r - sphere_r * 2.20)) * 0.50;  // ~30° N
        circles += smoothstep(0.016, 0.0, abs(bg_r - sphere_r * 3.00)) * 0.28;  // ~60° N
        col += fcol * (ray_val * 0.052 + circles * 0.060);
    }

    float beat_boost = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.55;
    return col * gate * beat_boost;
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

    // Clifford torus — flat T² in S³, preimage of the equator under the Hopf map.
    // The 4D rotation reveals the intrinsic S³ geometry: the torus visibly inverts
    // through itself — impossible in flat R³. Bridges Lorenz chaos to Hopf order.
    {
        float ct_gate = smoothstep(0.40, 0.48, u_scene_norm)
                      * (1.0 - smoothstep(0.50, 0.56, u_scene_norm));
        col += clifford_torus(uv, ct_gate);
    }

    // Julia set morphing — the boundary between stability and chaos.
    // Appears as Lorenz fades (0.52) and dissolves before convergence rings dominate (0.76).
    // Parameter c orbits the Mandelbrot seahorse valley: each position yields a unique
    // fractal of glowing filaments — the attractor of "every complex orbit".
    {
        float julia_gate = smoothstep(0.52, 0.62, u_scene_norm)
                         * (1.0 - smoothstep(0.68, 0.76, u_scene_norm));
        col += julia_morph(uv, julia_gate);
        // Mandelbrot mini-map: lower-left corner shows the c-parameter orbit
        // in Mandelbrot space — viewers can "read" which Julia set they're seeing.
        float mm_gate = smoothstep(0.53, 0.60, u_scene_norm)
                      * (1.0 - smoothstep(0.69, 0.76, u_scene_norm));
        col += mandelbrot_minimap(uv, mm_gate);
    }

    // Hopf fibration — S³ fiber bundle over S².
    // Interlocking circles: each base point on S² determines one Hopf fiber (circle)
    // in S³. Stereographically projected to R³, the 22 fibers form a nested-tori
    // arrangement. Any two fibers in this drawing are topologically linked once.
    // Mathematical narrative: Lorenz chaos in R³ gives way to ordered S³ topology
    // before the complex plane's Julia boundary and Riemann compactification appear.
    // The S² base space of this fibration IS the Riemann sphere shown next.
    {
        float hopf_gate = smoothstep(0.44, 0.56, u_scene_norm)
                        * (1.0 - smoothstep(0.61, 0.67, u_scene_norm));
        col += hopf_fibration(uv, hopf_gate);
    }

    // Riemann sphere — the complex plane compactified.
    // The same Julia set from above now wraps onto a sphere via stereographic
    // projection from the south pole.  The north pole of the sphere = complex
    // infinity = the singularity.  Escaping orbits spiral toward the north pole;
    // the bright cap reveals where the singularity LIVES on the sphere.
    // Appears after Julia's 2D form fades (0.67) and bridges into the vortex (0.87).
    {
        float rs_gate = smoothstep(0.67, 0.74, u_scene_norm)
                      * (1.0 - smoothstep(0.82, 0.87, u_scene_norm));
        col += riemann_sphere(uv, rs_gate);
    }

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

    // ─── Audio-energy luminance scale ────────────────────────────────────────
    // Calibrated so 0.38 RMS (Concrete-Syncope track average) ≈ 1.0× (baseline).
    // Loud peaks push up to +28% above baseline; near-silence dims to 0.83×.
    // The silence_fade below already handles logo-reveal cleanliness.
    col *= 0.83 + u_rms * 0.45;

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
