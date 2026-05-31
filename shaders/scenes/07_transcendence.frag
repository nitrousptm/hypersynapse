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

float tendril(vec2 uv, float seed, float t) {
    float acc = 0.0;
    vec2 p = vec2(0.0);  // grow from origin; uv-relative so tendrils radiate outward
    vec2 dir = normalize(vec2(cos(seed * 6.28), sin(seed * 6.28)));
    float w = 0.003;

    for (int i = 0; i < 8; i++) {
        // Rotate direction before stepping (branching / curling)
        float angle = sin(float(i) * 1.3 + seed + t * 0.5) * 0.4;
        float c = cos(angle), s = sin(angle);
        dir = normalize(vec2(dir.x * c - dir.y * s, dir.x * s + dir.y * c));

        vec2 next = p + dir * 0.08;

        // Proper line-segment SDF — gives each tendril segment its correct thickness
        float d = sdSeg2D(uv, p, next);
        acc += w / (d + w);

        w *= 0.72;
        p = next;
    }
    return acc * u_scene_norm;
}

// ─── 5×7 pixel font — "SINGULARITY GARDEN" ──────────────────────────────────
// Row bitmasks (bit4=leftmost). 13 unique chars: S=0 I=1 N=2 G=3 U=4 L=5 A=6
// R=7 T=8 Y=9 D=10 E=11 SP=12.
const int FONT_DATA[91] = int[91](
    14,17,16,14, 1,17,14,  // S
    31, 4, 4, 4, 4, 4,31,  // I
    17,25,21,19,17,17,17,  // N
    14,17,16,23,17,17,14,  // G
    17,17,17,17,17,17,14,  // U
    16,16,16,16,16,16,31,  // L
    14,17,17,31,17,17,17,  // A
    30,17,17,30,20,18,17,  // R
    31, 4, 4, 4, 4, 4, 4,  // T
    17,17,10, 4, 4, 4, 4,  // Y
    30,17,17,17,17,17,30,  // D
    31,16,16,30,16,16,31,  // E
     0, 0, 0, 0, 0, 0, 0   // SP
);
// SINGULARITY GARDEN
const int TITLE_STR[18] = int[18](0,1,2,3,4,5,6,7,1,8,9,12,3,6,7,10,11,2);

float render_title_text(vec2 uv, float appear) {
    if (appear < 0.001) return 0.0;
    const float CW   = 0.060;    // cell width  (5 cols)
    const float CH   = 0.084;    // cell height (7 rows)
    const float GAP  = 0.015;    // inter-char gap
    const float STEP = CW + GAP;
    float x0 = -(18.0 * STEP - GAP) * 0.5;
    const float TY   = -0.22;    // vertical center (below SG logo)

    float acc = 0.0;
    for (int ci = 0; ci < 18; ci++) {
        int ch_idx = TITLE_STR[ci];
        float cx   = x0 + float(ci) * STEP;
        vec2 local = uv - vec2(cx, TY + CH * 0.5);
        // flip y so row 0 = top
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
                acc += (1.0 - smoothstep(0.26, 0.52, d)) * appear;
            }
        }
    }
    return min(acc, 2.5);
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

    // Camera pulling back to infinite distance
    float pullback = u_scene_norm * u_scene_norm;

    // Space background (galaxy + nebulae)
    vec3 rd = normalize(vec3(uv, 2.0));  // simple sky direction
    vec3 col = galaxy(rd) * 2.0;
    col += vec3(0.005, 0.003, 0.015);

    // Geometric star connections (like a cosmic graph)
    float geo = geo_connection(uv * (1.0 - pullback * 0.3));
    col += geo * vec3(0.3, 0.6, 1.0) * (0.5 + 0.5 * u_scene_norm);

    // Light tendrils growing outward from center
    float tendrils_total = 0.0;
    for (int i = 0; i < 8; i++) {
        float seed = float(i) / 8.0;
        float t_offset = hash(float(i) * 7.3) * 2.0;
        tendrils_total += tendril(uv, seed, u_time + t_offset);
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

    // ─── Silence + Logo (final ~10s, scene_norm > 0.875) ─────────────────────
    float logo_t = smoothstep(0.875, 0.92, u_scene_norm);

    // Everything fades to black for the silence
    float silence_fade = smoothstep(0.875, 0.895, u_scene_norm);
    col *= 1.0 - silence_fade;

    // Single light pulse (scene_norm ~0.895)
    float pulse = smoothstep(0.0, 1.0, fract((u_scene_norm - 0.895) * 10.0)) *
                  step(0.895, u_scene_norm) * step(u_scene_norm, 0.905);
    col += pulse * 2.0;

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
                   fract(along * 6.0 - u_time * 3.0 + fi * 0.4) * logo_appear;
    }

    // Two-layer logo glow: inner tight edge + outer atmospheric halo
    vec3 logo_col   = mix(vec3(0.5, 0.75, 1.0), vec3(1.0, 1.0, 1.0), logo_appear);
    float logo_halo = exp(-max(logo_d * 2.0, 0.0) * 6.0) * logo_appear;  // wide soft halo
    col += (logo_mask + streams * 0.25) * logo_col * logo_appear * 3.5;
    col += logo_halo * vec3(0.3, 0.5, 1.0) * 1.5;

    // Breathing pulse — logo "breathes" once it's up (slow sine, 0.5 Hz)
    float logo_breath = logo_appear * (0.85 + 0.15 * sin(u_time * 3.14));
    col *= mix(1.0, logo_breath, logo_appear * 0.3);

    // Full title: "SINGULARITY GARDEN" in 5×7 pixel font (fades in just after SG logo)
    float title_appear = smoothstep(0.920, 0.945, u_scene_norm);
    float title_px = render_title_text(uv, title_appear);
    vec3 title_col = mix(vec3(0.55, 0.78, 1.0), vec3(0.85, 0.92, 1.0), title_appear);
    col += title_px * title_col * 2.0;

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
