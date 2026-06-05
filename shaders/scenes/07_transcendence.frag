#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
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
        // Galactic dust: warm orange-red emission nebula
        float dust = fbm(rd * 4.5 + vec3(u_time * 0.008, 0.0, u_time * 0.005));
        col += dust * vec3(0.35, 0.10, 0.25) * plane_dens * 0.9;
        // Blue HII emission regions
        float hii = fbm(rd * 7.0 + vec3(53.0, u_time * 0.012, 17.0));
        col += max(hii - 0.45, 0.0) * vec3(0.1, 0.3, 0.7) * plane_dens * 1.2;
    }

    // Nebula background — deep color clouds
    float neb = fbm(rd * 2.5 + vec3(u_time * 0.015, 0.0, u_time * 0.01));
    col += neb * vec3(0.06, 0.0, 0.14) * 0.7;

    // Large emission nebula: bluish cloud in upper hemisphere
    float big_neb = fbm(rd * 1.2 + vec3(7.0, u_time * 0.005, 11.0));
    col += max(big_neb - 0.4, 0.0) * vec3(0.0, 0.08, 0.18) * 1.5;

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

float tendril(vec2 uv, float seed, float t) {
    float acc = 0.0;

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
    vec3 tendril_col = mix(vec3(0.1, 0.5, 1.0), vec3(0.8, 0.3, 1.0), sin(u_time * 0.5) * 0.5 + 0.5);
    col += tendrils_total * tendril_col * 1.5;

    // Massive particle fluid: instanced stars in motion
    // (handled by particle system in renderer — here we add screen-space haze)
    float haze = fbm(vec3(uv * 2.0, u_time * 0.05)) * 0.15;
    col += haze * vec3(0.05, 0.02, 0.1);

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

    // ─── Silence + Logo (final ~10s, scene_norm > 0.875) ─────────────────────
    float logo_t = smoothstep(0.875, 0.92, u_scene_norm);

    // Everything fades to black for the silence
    float silence_fade = smoothstep(0.875, 0.895, u_scene_norm);
    col *= 1.0 - silence_fade;

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
