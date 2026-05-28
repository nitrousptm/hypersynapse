#version 460 core
// SCENE 1 — BLACK VOID STARTUP (0:00–0:18)
// Mood: Kalt, minimalistisch, technisch. Spannung aufbauen.
// Visuals: schwarzer Void, GPU-Hex-Grid, Circuit-Traces, Debug-Lines,
//          floating numeric glyphs, CRT Noise, Scanlines, subtle CA.
// Camera: sehr langsam driftend, subtile Rotation.
// Musik: tiefer Drone, entfernte mechanische Klicks, first kick at 0:18.
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;  // 0→1 in 18 Sekunden

// ─── Hash / Noise ─────────────────────────────────────────────────────────────
float hash11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
float hash21(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2  hash22(vec2 p)  { return fract(sin(vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
               mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}

// ─── Hex Grid ─────────────────────────────────────────────────────────────────
// Returns (dist_to_edge, dist_to_center, hex_id.x, hex_id.y)
vec4 hex_info(vec2 p) {
    const float s = 1.0;
    const float sq3 = 1.7320508;
    vec2 q = vec2(p.x / (s * sq3), p.y / s - p.x / (s * sq3));
    vec2 pi = floor(q), pf = fract(q);
    float v = mod(pi.x + pi.y, 3.0);
    float ca = step(1.0, v), cb = step(2.0, v);
    vec2 ma = step(pf, pf.yx);
    vec2 hex_id = pi + ca*(1.0-ma) + cb*ma;
    vec2 center = hex_id * vec2(sq3, 1.0) + vec2(0.0, mod(hex_id.x, 2.0)*0.5);
    float dist_center = length(p - center * s);
    // Edge distance approximation
    vec2 r = p - center*s;
    vec2 ra = abs(r);
    float dist_edge = max(dot(ra, normalize(vec2(1.0, sq3))), ra.x) - s*0.5;
    return vec4(dist_edge, dist_center, hex_id);
}

// ─── Circuit Board Traces ─────────────────────────────────────────────────────
float circuit_trace(vec2 uv, float seed, float t) {
    // Orthogonal traces that grow over time
    float trace_t = fract(t * 0.3 + seed);
    float dir = step(0.5, hash11(seed));  // 0=horizontal, 1=vertical

    vec2 start = hash22(vec2(seed, 0.1)) * 2.0 - 1.0;
    float length_trace = 0.1 + hash11(seed*1.3) * 0.4;
    float progress = trace_t * length_trace;

    float w = 0.002;
    float d;
    if (dir < 0.5) {
        // Horizontal
        float x0 = start.x, x1 = start.x + progress;
        float y0 = start.y;
        d = abs(uv.y - y0);
        d = mix(d, 1e9, step(uv.x, x0) + step(x1, uv.x));
    } else {
        // Vertical
        float x0 = start.x;
        float y0 = start.y, y1 = start.y + progress;
        d = abs(uv.x - x0);
        d = mix(d, 1e9, step(uv.y, y0) + step(y1, uv.y));
    }
    return w / (d + w);
}

// Solder joints: bright dots at trace corners
float solder_joint(vec2 uv, float seed) {
    vec2 pos = hash22(vec2(seed, 0.5)) * 2.0 - 1.0;
    float d = length(uv - pos);
    return 0.008 / (d*d + 0.008*0.008) * 0.4;
}

// ─── Data / Numeric Glyphs ────────────────────────────────────────────────────
// Floating columns of scrolling hex-like characters
float data_column(vec2 uv, float col_x) {
    float cell_w = 0.018, cell_h = 0.022;
    float dist_x = abs(uv.x - col_x);
    if (dist_x > cell_w * 0.7) return 0.0;

    // Scroll speed varies per column
    float speed = 0.5 + hash11(col_x * 13.7) * 1.5;
    float scroll = fract(uv.y / cell_h + u_time * speed);
    vec2 cell_id = vec2(floor(uv.x / cell_w), floor(uv.y / cell_h));
    float h = hash21(cell_id + floor(u_time * speed * 0.1));

    float glyph = step(0.5, h) * step(scroll, 0.85);
    return glyph * (0.6 + 0.4 * h);
}

// ─── Debug Lines (horizontal, with tick marks) ───────────────────────────────
float debug_line_h(vec2 uv, float y) {
    float w = 0.0006;
    float line = w / (abs(uv.y - y) + w) * 0.7;
    // Tick marks every 0.05 units
    float ticks = step(0.0, sin(uv.x / 0.05 * 3.14159)) * smoothstep(0.003, 0.0, abs(uv.y - y - 0.004));
    return line + ticks * 0.4;
}

float debug_line_v(vec2 uv, float x) {
    float w = 0.0005;
    return w / (abs(uv.x - x) + w) * 0.5;
}

// ─── Crosshair / Targeting ────────────────────────────────────────────────────
float crosshair(vec2 uv, vec2 center, float size) {
    float h = smoothstep(0.0008, 0.0, abs(uv.y - center.y)) * step(abs(uv.x - center.x), size);
    float v = smoothstep(0.0008, 0.0, abs(uv.x - center.x)) * step(abs(uv.y - center.y), size);
    float corner_gap = 1.0 - smoothstep(size*0.3, size*0.5, length(uv - center));
    return (h + v) * (1.0 - corner_gap * 0.7);
}

// ─── CRT Distortion ───────────────────────────────────────────────────────────
vec2 crt_warp(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
    uv = uv + uv * offset * offset;
    return uv * 0.5 + 0.5;
}

float scanlines(vec2 uv) {
    return 0.88 + 0.12 * sin(uv.y * u_res.y * 3.14159);
}

float film_grain(vec2 uv) {
    return (hash21(uv + fract(u_time * 77.7)) - 0.5) * 0.06;
}

// ─── Temporal Glitch ──────────────────────────────────────────────────────────
vec2 glitch_offset(vec2 uv) {
    float gt = floor(u_time * 18.0);
    float g_chance = hash11(gt);
    if (g_chance < 0.88) return vec2(0.0);
    float band_y = hash11(gt + 1.0);
    float band_w = 0.02 + hash11(gt + 2.0) * 0.06;
    float in_band = step(abs(uv.y - band_y), band_w);
    float shift = (hash11(gt + 3.0) - 0.5) * 0.015;
    return vec2(shift * in_band, 0.0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
    // Camera: slow drift + subtle rotation
    vec2 uv0 = gl_FragCoord.xy / u_res;
    uv0 = crt_warp(uv0);

    float drift_angle = u_time * 0.015 + sin(u_time * 0.07) * 0.08;
    float c = cos(drift_angle), s = sin(drift_angle);
    vec2 center = vec2(0.5);
    vec2 uv_rot = mat2(c, -s, s, c) * (uv0 - center) + center;
    uv_rot += glitch_offset(uv_rot);

    vec2 uv  = uv_rot * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // ── Background ──
    float depth = 0.004 + 0.002 * vnoise(uv * 3.0 + u_time * 0.05);
    vec3 col = vec3(0.003, 0.005, depth * 3.0);

    // ── Hex Grid (two scales) ──
    float hex_scale = 8.0 + sin(u_time * 0.1) * 1.0;
    vec4 hi = hex_info(uv * hex_scale);
    float hex_edge = smoothstep(0.0, 0.04, -hi.x);

    // Inner glow per hex cell
    float cell_rand = hash21(hi.zw);
    float cell_glow = smoothstep(0.18, 0.0, hi.y / hex_scale) * step(0.88, cell_rand);
    float cell_pulse = 0.3 + 0.7 * abs(sin(u_time * (1.0 + cell_rand * 3.0) + cell_rand * 6.28));

    // Outer hex grid (larger, structural)
    vec4 hi2 = hex_info(uv * 3.5);
    float hex2_edge = smoothstep(0.0, 0.12 / 3.5, -hi2.x);

    vec3 hex_col = mix(vec3(0.04, 0.08, 0.20), vec3(0.02, 0.05, 0.14), cell_rand);
    col += hex_edge * hex_col * (0.5 + 0.5 * u_scene_norm);
    col += cell_glow * cell_pulse * vec3(0.1, 0.25, 0.9) * 0.4 * u_scene_norm;
    col += hex2_edge * vec3(0.015, 0.025, 0.08) * 0.6;

    // ── Circuit Traces (growing in as scene progresses) ──
    float trace_density = u_scene_norm * u_scene_norm;
    float traces = 0.0;
    for (int i = 0; i < 12; i++) {
        traces += circuit_trace(uv, float(i) * 0.13, u_time) * trace_density;
    }
    col += traces * vec3(0.05, 0.3, 0.8) * 0.8;

    // Solder joints
    for (int i = 0; i < 8; i++) {
        col += solder_joint(uv, float(i) * 0.23) * vec3(0.2, 0.6, 1.0) * trace_density;
    }

    // ── Data Columns (matrix-like) ──
    float data = 0.0;
    for (int i = 0; i < 16; i++) {
        float cx = (float(i) / 15.0) * 2.4 - 1.2;
        data += data_column(uv, cx);
    }
    col += data * vec3(0.0, 0.35, 0.15) * 0.5 * u_scene_norm;

    // ── Debug Lines ──
    float dl = 0.0;
    dl += debug_line_h(uv, 0.35);
    dl += debug_line_h(uv, -0.35);
    dl += debug_line_h(uv,  0.0) * 0.4;
    dl += debug_line_v(uv,  0.0) * 0.5;
    dl += debug_line_v(uv,  0.6) * 0.3;
    dl += debug_line_v(uv, -0.6) * 0.3;
    col += dl * vec3(0.7, 0.85, 1.0) * (0.3 + 0.7 * u_scene_norm);

    // ── Crosshair (targeting reticle, slowly drifting) ──
    vec2 reticle_pos = vec2(
        sin(u_time * 0.11) * 0.3,
        cos(u_time * 0.09) * 0.2
    );
    col += crosshair(uv, reticle_pos, 0.07) * vec3(0.5, 0.8, 1.0) * 0.6;

    // ── Corner HUD boxes ──
    vec2 au = abs(uv);
    float corner_l = smoothstep(0.003, 0.0, abs(max(au.x, au.y) - 0.9)) * step(abs(au.x - au.y), 0.15);
    col += corner_l * vec3(0.3, 0.6, 1.0) * 0.4;

    // ── Scanlines + CRT ──
    col *= scanlines(uv_rot);
    col += film_grain(uv_rot);

    // ── Chromatic Aberration ──
    float ca = 0.0015 + 0.001 * sin(u_time * 2.3);
    col.r += hex_info(uv * hex_scale + vec2(ca, 0.0)).x < 0.04 ? 0.02 : 0.0;
    col.b += hex_info(uv * hex_scale - vec2(ca, 0.0)).x < 0.04 ? 0.02 : 0.0;

    // ── Vignette ──
    float vig = 1.0 - dot(uv * 0.38, uv * 0.38);
    col *= max(vig, 0.0);

    // ── First kick anticipation: bright pulse at end of scene ──
    float kick_flash = smoothstep(0.85, 1.0, u_scene_norm) * 0.4;
    col += kick_flash * vec3(0.4, 0.6, 1.0);

    // ── Overall brightness ramp ──
    col *= 0.2 + 0.8 * smoothstep(0.0, 0.4, u_scene_norm);

    frag_color = vec4(col, 1.0);
}
