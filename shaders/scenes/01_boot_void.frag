#version 460 core
// SCENE 1 — BLACK VOID STARTUP (0:00–0:18) [EXTENDED]
// Mood: Kalt, minimalistisch, technisch. Spannung aufbauen.
// Visuals: schwarzer Void, 7-layer Hex-Grid, branching Circuit-Traces,
//          Debug-Lines mit harmonischen Patterns, flowing data columns,
//          CRT Noise, Scanlines, CA, Glitch-Feedback, Portal-Rings
// Camera: spiraling drift, recursive rotation, time-warped parallax.
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform int   u_bar_cnt;
uniform float u_act_norm;
uniform float u_scene_norm;
uniform float u_rms;

// ─── Multi-layer Hash / Noise ─────────────────────────────────────────────────
float hash11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
float hash21(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2  hash22(vec2 p)  { return fract(sin(vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)))) * 43758.5453); }
vec3  hash31(vec3 p)  {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.yzx, p + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
               mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}

float vnoise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash11(dot(i,vec3(1,57,113))), hash11(dot(i+vec3(1,0,0),vec3(1,57,113))), f.x),
                   mix(hash11(dot(i+vec3(0,1,0),vec3(1,57,113))), hash11(dot(i+vec3(1,1,0),vec3(1,57,113))), f.x), f.y),
               mix(mix(hash11(dot(i+vec3(0,0,1),vec3(1,57,113))), hash11(dot(i+vec3(1,0,1),vec3(1,57,113))), f.x),
                   mix(hash11(dot(i+vec3(0,1,1),vec3(1,57,113))), hash11(dot(i+vec3(1,1,1),vec3(1,57,113))), f.x), f.y), f.z);
}

float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for(int i=0; i<6; i++) { v += a*vnoise(p); p = rot*p*2.1 + vec2(0.9, 1.7); a *= 0.5; }
    return v;
}

float fbm3(vec3 p) {
    float v = 0.0, a = 0.5;
    mat3 rot = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
    for(int i=0; i<6; i++) { v += a*vnoise3(p); p = rot*p*2.1 + vec3(0.9, 1.7, 2.3); a *= 0.5; }
    return v;
}

// ─── 7-Layer Hex Grid System ──────────────────────────────────────────────────
// Multi-scale hexagonal lattices with recursive feedback
vec4 hex_info(vec2 p, float scale) {
    const float sq3 = 1.7320508;
    vec2 q = vec2(p.x / (scale * sq3), p.y / scale - p.x / (scale * sq3));
    vec2 pi = floor(q), pf = fract(q);
    float v = mod(pi.x + pi.y, 3.0);
    float ca = step(1.0, v), cb = step(2.0, v);
    vec2 ma = step(pf, pf.yx);
    vec2 hex_id = pi + ca*(1.0-ma) + cb*ma;
    vec2 center = hex_id * vec2(sq3, 1.0) + vec2(0.0, mod(hex_id.x, 2.0)*0.5);
    float dist_center = length(p - center * scale);
    vec2 r = p - center*scale;
    vec2 ra = abs(r);
    float dist_edge = max(dot(ra, normalize(vec2(1.0, sq3))), ra.x) - scale*0.5;
    return vec4(dist_edge, dist_center, hex_id);
}

// Recursive hex grid with temporal evolution
vec4 hex_recursive(vec2 p, float depth) {
    vec4 result = hex_info(p, 1.0);
    for(int i = 1; i < 5; i++) {
        float sc = pow(2.3, float(i));
        float wt = pow(0.6, float(i));
        vec4 hi = hex_info(p, sc);
        result.x = min(result.x, hi.x * wt);
        result.y = min(result.y, hi.y * wt);
    }
    return result;
}

// ─── Advanced Branching Circuit Traces ────────────────────────────────────────
// Multi-generation fractaling traces with dynamic branching
float circuit_branch(vec2 uv, vec2 start, vec2 dir, float progress, float width, float gen) {
    float acc = 0.0;
    vec2 p = start;
    vec2 d = dir;

    for(int i = 0; i < 8; i++) {
        vec2 end = p + d * progress * pow(0.7, gen + float(i)*0.3);

        vec2 pa = uv - p, ba = end - p;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dist = length(pa - ba * h);
        float w = width * pow(0.8, float(i));
        acc += w / (dist + w) * (1.0 - float(i)/8.0);

        // Branch off
        float angle = (hash11(float(i) * 7.3 + gen) - 0.5) * 0.8;
        float c = cos(angle), s = sin(angle);
        d = normalize(vec2(d.x*c - d.y*s, d.x*s + d.y*c));
        p = end;
    }
    return acc;
}

float circuit_trace(vec2 uv, float seed, float t) {
    float trace_t = fract(t * 0.3 + seed);
    float dir_mode = step(0.5, hash11(seed));

    vec2 start = hash22(vec2(seed, 0.1)) * 2.0 - 1.0;
    float length_trace = 0.15 + hash11(seed*1.3) * 0.5;
    float progress = trace_t * length_trace;

    vec2 trace_dir = (dir_mode < 0.5)
        ? vec2(1.0, hash11(seed*0.7)*0.3 - 0.15)
        : vec2(hash11(seed*0.7)*0.3 - 0.15, 1.0);
    trace_dir = normalize(trace_dir);

    float acc = circuit_branch(uv, start, trace_dir, progress, 0.003, 0.0);
    acc += circuit_branch(uv, start + vec2(0.05, 0.05), trace_dir, progress*0.8, 0.002, 1.0) * 0.6;

    return min(acc, 1.0);
}

// Advanced Solder Joint Network
float solder_joint(vec2 uv, float seed) {
    vec2 pos = hash22(vec2(seed, 0.5)) * 2.0 - 1.0;
    float d = length(uv - pos);
    float joint = 0.008 / (d*d + 0.008*0.008) * 0.4;

    // Glow halo
    float pulse = 0.3 + 0.7 * abs(sin(u_time * (1.0 + hash11(seed)*2.0) + seed*6.28));
    joint += exp(-d*d*20.0) * 0.15 * pulse;

    // Connection threads to nearby joints
    for(int i = 0; i < 3; i++) {
        vec2 other_pos = hash22(vec2(seed + float(i)*0.3, 0.5)) * 2.0 - 1.0;
        vec2 to_other = other_pos - pos;
        vec2 pa = uv - pos, ba = to_other;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float thread_dist = length(pa - ba*h);
        joint += 0.0015 / (thread_dist + 0.0015) * 0.2;
    }

    return joint;
}

// ─── Advanced Data Column System ───────────────────────────────────────────────
// Multi-layer scrolling data with corruption effects
float data_column(vec2 uv, float col_x, float layer) {
    float cell_w = 0.018, cell_h = 0.022;
    float dist_x = abs(uv.x - col_x - layer*0.02);
    if (dist_x > cell_w * 0.8) return 0.0;

    float speed = (0.5 + hash11(col_x * 13.7 + layer) * 1.8) * (0.80 + u_rms * 0.45);
    float offset = layer * 0.5;
    float scroll = fract(uv.y / cell_h + u_time * speed + offset);
    vec2 cell_id = vec2(floor(uv.x / cell_w), floor(uv.y / cell_h));
    float h = hash21(cell_id + floor(u_time * speed * 0.1) + vec2(layer, 0.0));

    float glyph = step(0.4, h) * step(scroll, 0.8);
    float corruption = vnoise(vec2(col_x * 7.3, u_time * 0.5 + layer)) * 0.3;

    return glyph * (0.6 + 0.4 * h) * (1.0 + corruption);
}

// Cascading data waves
float data_cascade(vec2 uv) {
    float acc = 0.0;
    for(int i = 0; i < 24; i++) {
        float cx = (float(i) / 23.0) * 2.4 - 1.2;
        for(int l = 0; l < 3; l++) {
            acc += data_column(uv, cx, float(l)) * pow(0.85, float(l));
        }
    }
    return acc;
}

// ─── Enhanced Debug Line Grid System ──────────────────────────────────────────
// Multi-scale, harmonic debug grids with wave modulation
float debug_line_h(vec2 uv, float y, float freq) {
    float w = 0.0006;
    float line = w / (abs(uv.y - y) + w) * 0.7;

    // Harmonic tick marks
    float tick_space = 0.05;
    float ticks = step(0.0, sin(uv.x / tick_space * 3.14159));
    ticks *= smoothstep(0.003, 0.0, abs(uv.y - y - 0.004));

    // Wave modulation
    float wave = 0.5 + 0.5*sin(u_time * freq + uv.x * 8.0);
    ticks *= wave;

    // Secondary harmonic
    float harmonic = smoothstep(0.002, 0.0, abs(uv.y - y + 0.015)) * 0.3;

    return line + (ticks + harmonic) * 0.4;
}

float debug_line_v(vec2 uv, float x, float freq) {
    float w = 0.0005;
    float line = w / (abs(uv.x - x) + w) * 0.5;

    // Vertical wave
    float wave = 0.5 + 0.5*sin(u_time * freq + uv.y * 6.0);
    line *= wave;

    return line;
}

// Recursive harmonic grid
float debug_grid(vec2 uv) {
    float acc = 0.0;

    for(int i = 0; i < 6; i++) {
        float fi = float(i);
        float scale = pow(2.0, fi);
        float spacing = 0.35 / scale;
        float freq = 0.5 + fi * 0.3;

        // Horizontal lines
        float y_grid = floor(uv.y / spacing) * spacing;
        for(int j = 0; j < 3; j++) {
            float y_line = y_grid + float(j) * spacing - 0.35;
            acc += debug_line_h(uv, y_line, freq) * pow(0.7, fi);
        }

        // Vertical lines
        float x_grid = floor(uv.x / spacing) * spacing;
        for(int j = 0; j < 3; j++) {
            float x_line = x_grid + float(j) * spacing - 0.6;
            acc += debug_line_v(uv, x_line, freq) * pow(0.7, fi);
        }
    }

    return acc;
}

// ─── Advanced Targeting Systems ───────────────────────────────────────────────
// Multi-layer crosshairs with portal rings and tracking
float crosshair(vec2 uv, vec2 center, float size, float rotation) {
    vec2 rel = uv - center;
    float ang = atan(rel.y, rel.x);
    float mag = length(rel);

    // Rotated crosshair
    float rot_c = cos(rotation), rot_s = sin(rotation);
    vec2 rot_rel = vec2(rel.x*rot_c - rel.y*rot_s, rel.x*rot_s + rel.y*rot_c);

    float h = smoothstep(0.0008, 0.0, abs(rot_rel.y)) * step(abs(rot_rel.x), size);
    float v = smoothstep(0.0008, 0.0, abs(rot_rel.x)) * step(abs(rot_rel.y), size);

    // Corner markers
    float corner_gap = 1.0 - smoothstep(size*0.3, size*0.5, mag);

    // Portal ring
    float ring = smoothstep(0.008, 0.0, abs(mag - size*0.8));

    // Pulsing center dot
    float center_dot = 0.003 / (mag + 0.003) * (0.5 + 0.5*sin(u_time*3.0));

    return (h + v) * (1.0 - corner_gap * 0.7) + ring * 0.4 + center_dot;
}

// Portal ring system
float portal_ring(vec2 uv, vec2 center, float r, float seed) {
    float d = length(uv - center);
    float ring = smoothstep(0.012, 0.0, abs(d - r));

    // Wave along ring
    float phase = atan(uv.y - center.y, uv.x - center.x) / 6.28;
    float wave = sin(phase * 12.0 - u_time * 2.0 + seed * 6.28) * 0.5 + 0.5;
    ring *= wave;

    // Glow halo
    ring += exp(-d*d*20.0) * 0.15;

    return ring;
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

// ─── Boot Terminal Text ───────────────────────────────────────────────────────
// 5×7 pixel font, bit4=leftmost. 18 chars:
// 0=SP 1=A 2=C 3=D 4=E 5=H 6=I 7=L 8=N 9=O 10=P 11=R 12=S 13=T 14=U 15=V 16=X 17=Y
const int BOOT_FONT[126] = int[126](
     0, 0, 0, 0, 0, 0, 0,  // SP=0
    14,17,17,31,17,17,17,  // A=1
    14,17,16,16,16,17,14,  // C=2
    30,17,17,17,17,17,30,  // D=3
    31,16,16,30,16,16,31,  // E=4
    17,17,17,31,17,17,17,  // H=5
    31, 4, 4, 4, 4, 4,31,  // I=6
    16,16,16,16,16,16,31,  // L=7
    17,25,21,19,17,17,17,  // N=8
    14,17,17,17,17,17,14,  // O=9
    30,17,17,30,16,16,16,  // P=10
    30,17,17,30,20,18,17,  // R=11
    14,17,16,14, 1,17,14,  // S=12
    31, 4, 4, 4, 4, 4, 4,  // T=13
    17,17,17,17,17,17,14,  // U=14
    17,17,17,17,10,10, 4,  // V=15
    17,17,10, 4,10,17,17,  // X=16
    17,17,10, 4, 4, 4, 4   // Y=17
);
// "HYPERSYNAPSE"
const int BOOT_L1[12] = int[12](5,17,10,4,11,12,17,8,1,10,12,4);
// "NEURAL CORTEX ONLINE"
const int BOOT_L2[20] = int[20](8,4,14,11,1,7,0,2,9,11,13,4,16,0,9,8,7,6,8,4);
// "REALITY OVERRIDE ACTIVE"
const int BOOT_L3[23] = int[23](11,4,1,7,6,13,17,0,9,15,4,11,11,6,3,4,0,1,2,13,6,15,4);
// "PROTOCOL EXECUTED" — cold white completion stamp, scene_norm 0.91 → 0.978
// P=10 R=11 O=9 T=13 O=9 C=2 O=9 L=7 sp=0 E=4 X=16 E=4 C=2 U=14 T=13 E=4 D=3
const int BOOT_L4[17] = int[17](10,11,9,13,9,2,9,7,0,4,16,4,2,14,13,4,3);

float boot_char_px(vec2 uv, int ch, float cx, float cy) {
    const float CW = 0.055;
    const float CH = 0.077;
    float gx = (uv.x - cx) * (5.0 / CW);
    float gy = (cy + CH - uv.y) * (7.0 / CH);
    int ci = int(floor(gx));
    int ri = int(floor(gy));
    if (ci < 0 || ci >= 5 || ri < 0 || ri >= 7) return 0.0;
    int msk = BOOT_FONT[ch * 7 + ri];
    if (((msk >> (4 - ci)) & 1) == 0) return 0.0;
    float dx = gx - float(ci) - 0.5;
    float dy = gy - float(ri) - 0.5;
    return 1.0 - smoothstep(0.22, 0.50, length(vec2(dx, dy)));
}

// Renders 4-line boot terminal; uv_t is fixed screen-space (aspect-corrected, centered).
// Returns vec4: x=line1, y=line2, z=line3, w=line4 (separate for per-line coloring).
vec4 render_boot_terminal(vec2 uv_t, float sn) {
    const float CW   = 0.055;
    const float GAP  = 0.010;
    const float STEP = CW + GAP;
    const float LY1  =  0.69;  // bottom-edge y of line 1
    const float LY2  =  0.49;  // line 2
    const float LY3  =  0.29;  // line 3
    const float LY4  =  0.09;  // line 4 — "PROTOCOL EXECUTED"
    const float X0   = -1.58;  // left edge

    vec4 acc = vec4(0.0);

    // Line 1: HYPERSYNAPSE — types 0.04 → 0.30
    {
        const float BASE = 0.04; const float STG = 0.022; const float DUR = 0.016;
        for (int i = 0; i < 12; i++) {
            float ct = BASE + float(i) * STG;
            float ap = smoothstep(ct, ct + DUR, sn);
            if (ap < 0.001) continue;
            float bth = exp(-max(sn - ct, 0.0) * 38.0);
            acc.x += boot_char_px(uv_t, BOOT_L1[i], X0 + float(i) * STEP, LY1) * (ap + bth * 2.2);
        }
    }
    // Line 2: NEURAL CORTEX ONLINE — types 0.30 → 0.62
    {
        const float BASE = 0.30; const float STG = 0.016; const float DUR = 0.014;
        for (int i = 0; i < 20; i++) {
            float ct = BASE + float(i) * STG;
            float ap = smoothstep(ct, ct + DUR, sn);
            if (ap < 0.001) continue;
            float bth = exp(-max(sn - ct, 0.0) * 38.0);
            acc.y += boot_char_px(uv_t, BOOT_L2[i], X0 + float(i) * STEP, LY2) * (ap + bth * 2.2);
        }
    }
    // Line 3: REALITY OVERRIDE ACTIVE — types 0.55 → 0.89
    {
        const float BASE = 0.55; const float STG = 0.015; const float DUR = 0.014;
        for (int i = 0; i < 23; i++) {
            float ct = BASE + float(i) * STG;
            float ap = smoothstep(ct, ct + DUR, sn);
            if (ap < 0.001) continue;
            float bth = exp(-max(sn - ct, 0.0) * 38.0);
            acc.z += boot_char_px(uv_t, BOOT_L3[i], X0 + float(i) * STEP, LY3) * (ap + bth * 2.2);
        }
    }
    // Line 4: PROTOCOL EXECUTED — cold white stamp, fills the ~2s before 0:18 kick
    // Rapid type-in (STG=0.004) so all 17 chars appear quickly at scene_norm 0.91→0.978
    {
        const float BASE = 0.91; const float STG = 0.004; const float DUR = 0.008;
        for (int i = 0; i < 17; i++) {
            float ct = BASE + float(i) * STG;
            float ap = smoothstep(ct, ct + DUR, sn);
            if (ap < 0.001) continue;
            float bth = exp(-max(sn - ct, 0.0) * 55.0);  // faster flash for crisp readout
            acc.w += boot_char_px(uv_t, BOOT_L4[i], X0 + float(i) * STEP, LY4) * (ap + bth * 2.8);
        }
    }
    return min(acc, vec4(3.5));
}

// ─── Main Rendering Pipeline ──────────────────────────────────────────────────
void main() {
    // ── Advanced Camera System ──
    vec2 uv0 = gl_FragCoord.xy / u_res;
    uv0 = crt_warp(uv0);

    // Spiraling drift with recursive rotation
    float drift_angle = u_time * 0.015 + sin(u_time * 0.07) * 0.08;
    float spiral_depth = 0.08 * sin(u_time * 0.05);
    float c = cos(drift_angle), s = sin(drift_angle);
    vec2 center = vec2(0.5) + vec2(sin(u_time*0.03)*0.1, cos(u_time*0.025)*0.08);
    vec2 uv_rot = mat2(c, -s, s, c) * (uv0 - center) + center;
    uv_rot += glitch_offset(uv_rot);

    // Secondary rotation
    float secondary_angle = u_time * 0.007 + drift_angle * 0.3;
    c = cos(secondary_angle); s = sin(secondary_angle);
    uv_rot = mat2(c, -s, s, c) * (uv_rot - center) + center;

    vec2 uv = uv_rot * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // ── Procedural Background Depth ──
    float depth = 0.004 + 0.002 * vnoise(uv * 3.0 + u_time * 0.05);
    depth += fbm2(uv * 2.5 + u_time * 0.02) * 0.003;
    vec3 col = vec3(0.003, 0.005, depth * 3.0);

    // ── Recursive Hex Grid (7 layers) ──
    float hex_scale = 8.0 + sin(u_time * 0.1) * (1.0 + u_rms * 1.2);
    vec4 hi_main = hex_recursive(uv * hex_scale, 1.0);
    float hex_edge = smoothstep(0.0, 0.04, -hi_main.x);

    // Detailed cell glow
    float cell_rand = hash21(hi_main.zw);
    float cell_dist = hi_main.y / hex_scale;
    float cell_glow = smoothstep(0.18, 0.0, cell_dist) * step(0.85, cell_rand);
    float cell_pulse = 0.3 + 0.7 * abs(sin(u_time * (1.0 + cell_rand * 3.0) + cell_rand * 6.28));
    float inner_glow = smoothstep(0.05, 0.0, cell_dist) * 0.3;

    // Multi-scale hex structures
    vec4 hi2 = hex_recursive(uv * 3.5, 2.0);
    float hex2_edge = smoothstep(0.0, 0.12 / 3.5, -hi2.x);

    vec4 hi3 = hex_recursive(uv * 1.5, 0.5);
    float hex3_edge = smoothstep(0.0, 0.08 / 1.5, -hi3.x);

    vec3 hex_col = mix(vec3(0.04, 0.08, 0.20), vec3(0.02, 0.05, 0.14), cell_rand);
    vec3 hex_col2 = mix(vec3(0.05, 0.08, 0.16), vec3(0.03, 0.06, 0.12), hash21(hi2.zw));

    col += hex_edge * hex_col * (0.5 + 0.5 * u_scene_norm);
    col += cell_glow * cell_pulse * vec3(0.1, 0.25, 0.9) * 0.4 * u_scene_norm * (0.70 + u_rms * 0.65);
    col += inner_glow * vec3(0.15, 0.3, 1.0) * 0.3;
    col += hex2_edge * hex_col2 * 0.6;
    col += hex3_edge * vec3(0.02, 0.04, 0.1) * 0.3;

    // ── Advanced Circuit Traces (branching networks) ──
    float trace_density = u_scene_norm * u_scene_norm * (0.75 + u_rms * 0.65);
    float traces = 0.0;
    for (int i = 0; i < 18; i++) {
        traces += circuit_trace(uv, float(i) * 0.13, u_time) * trace_density;
    }
    col += traces * vec3(0.05, 0.3, 0.8) * 0.8;
    col += traces * fbm2(uv + u_time*0.1) * vec3(0.1, 0.15, 0.4) * 0.3;

    // Solder joints (extended network)
    for (int i = 0; i < 14; i++) {
        col += solder_joint(uv, float(i) * 0.23) * vec3(0.2, 0.6, 1.0) * trace_density;
    }

    // ── Synaptic Neural Activation (HYPERSYNAPSE effect) ──
    // On each 133 BPM kick, random circuit nodes "fire": brief bright burst + expanding ring.
    // Node count grows 3→8 over the scene; positions reseed per bar.
    // Directly embodies the HYPERSYNAPSE title: neurons activating in cascade.
    {
        float kick_gate = exp(-u_beat * 18.0);
        if (kick_gate > 0.004) {
            int node_count = 3 + int(u_scene_norm * 5.0);
            for (int i = 0; i < 8; i++) {
                if (i >= node_count) break;
                float fi = float(i);
                float seed = fi * 0.23 + float(u_bar_cnt) * 7.91;
                vec2 npos = hash22(vec2(seed, seed * 0.57)) * 2.4 - 1.2;
                npos.x *= u_res.x / u_res.y;
                float r = length(uv - npos);
                float flash = kick_gate * exp(-r * r * 55.0);
                float ring_r = u_beat * 0.42;
                float ring = kick_gate * exp(-abs(r - ring_r) * 30.0)
                           * (1.0 - smoothstep(0.0, 0.55, u_beat));
                col += (flash * 1.1 + ring * 0.45) * trace_density * vec3(0.28, 0.58, 1.00);
            }
        }
    }

    // ── Cascading Data Columns ──
    float data = data_cascade(uv);
    col += data * vec3(0.0, 0.35, 0.15) * 0.5 * u_scene_norm;
    col += data * fbm2(uv * 3.0 + u_time) * vec3(0.1, 0.2, 0.05) * 0.2;

    // ── Harmonic Debug Grid System ──
    float dl = debug_grid(uv);
    col += dl * vec3(0.7, 0.85, 1.0) * (0.3 + 0.7 * u_scene_norm);

    // ── Multi-layer Targeting System ──
    vec2 reticle_pos = vec2(
        sin(u_time * 0.11) * 0.3,
        cos(u_time * 0.09) * 0.2
    );
    float reticle_rot = u_time * (0.50 + u_rms * 0.50);
    col += crosshair(uv, reticle_pos, 0.07, reticle_rot) * vec3(0.5, 0.8, 1.0) * 0.6;

    // Portal rings at cardinal positions
    for(int i = 0; i < 4; i++) {
        float angle = float(i) * 1.5708;
        vec2 portal_center = vec2(cos(angle), sin(angle)) * 0.6;
        col += portal_ring(uv, portal_center, 0.15, float(i)*0.3) * vec3(0.1, 0.3, 0.8) * 0.3;
    }

    // ── Corner HUD Display ──
    vec2 au = abs(uv);
    float corner_l = smoothstep(0.003, 0.0, abs(max(au.x, au.y) - 0.9)) * step(abs(au.x - au.y), 0.15);
    col += corner_l * vec3(0.3, 0.6, 1.0) * 0.4;

    // Corner info boxes
    for(int i = 0; i < 4; i++) {
        float corner_ang = float(i) * 1.5708;
        vec2 corner_pos = normalize(vec2(cos(corner_ang), sin(corner_ang))) * 0.85;
        float corner_dist = length(uv - corner_pos);
        float corner_box = smoothstep(0.15, 0.13, corner_dist);
        col += corner_box * vec3(0.2 + float(i)*0.05, 0.5, 0.8) * 0.2;
    }

    // ── CRT Effects Layering ──
    col *= scanlines(uv_rot);
    col += film_grain(uv_rot) * 0.7;
    col += film_grain(uv_rot + vec2(u_time*0.1, 0.0)) * 0.3;

    // ── Advanced Chromatic Aberration ──
    float ca = 0.0015 + 0.001 * sin(u_time * 2.3);
    ca += vnoise(uv) * 0.0005;
    vec4 hi_r = hex_recursive(uv * hex_scale + vec2(ca, 0.0), 1.0);
    vec4 hi_b = hex_recursive(uv * hex_scale - vec2(ca, 0.0), 1.0);
    col.r += (hi_r.x < 0.04 ? 0.02 : 0.0) * u_scene_norm;
    col.b += (hi_b.x < 0.04 ? 0.02 : 0.0) * u_scene_norm;

    // ── Feedback loop visualization ──
    float feedback = fbm3(vec3(uv, u_time*0.1)) * 0.15;
    col += feedback * vec3(0.05, 0.1, 0.2) * u_scene_norm;

    // ── Dynamic Vignette ──
    float vig = 1.0 - dot(uv * 0.38, uv * 0.38);
    vig = mix(vig, 1.0 - dot(uv*0.5, uv*0.5), sin(u_time*0.3)*0.5+0.5);
    col *= max(vig, 0.0);

    // ── Boot Progress Ring — clockwise arc sweeping from top as boot completes ──
    // Use aspect-uncorrected centered UV so the ring stays circular.
    vec2 uv_c = uv_rot * 2.0 - 1.0;
    {
        const float RING_R = 0.45;
        float d_ring = abs(length(uv_c) - RING_R);
        // atan output: -π..π. Remap to 0=top, clockwise: fract((atan/2π) - 0.25) → 0..1
        float ang = fract(atan(uv_c.y, uv_c.x) / 6.28318 - 0.25);
        // Filled arc spans 0..scene_norm
        float arc = step(ang, u_scene_norm);
        float ring_glow = smoothstep(0.016, 0.0, d_ring) * arc;
        // Bright leading-edge tip
        float tip_phase = fract(ang - u_scene_norm + 0.5) - 0.5;  // 0 at tip
        float tip = exp(-tip_phase * tip_phase * 1800.0) * exp(-d_ring * d_ring * 2000.0);
        ring_glow += tip * 2.5;
        col += ring_glow * vec3(0.20, 0.50, 1.0) * (0.25 + 0.75 * u_scene_norm);
    }

    // ── Anticipation Pulse (kick flash) ──
    float kick_flash = smoothstep(0.85, 1.0, u_scene_norm) * 0.4;
    kick_flash += smoothstep(0.90, 0.75, u_scene_norm) * sin(u_time * 8.0) * 0.2;
    col += kick_flash * vec3(0.4, 0.6, 1.0);

    // Beat sync pulses
    float beat_pulse = smoothstep(0.04, 0.0, u_beat) * 0.2;
    col += beat_pulse * vec3(0.2, 0.4, 1.0);

    // ── Boot Terminal Text ──
    // Fixed screen-space UV (aspect-corrected, no camera drift) so text is stable.
    vec2 uv_txt = (gl_FragCoord.xy / u_res * 2.0 - 1.0);
    uv_txt.x *= u_res.x / u_res.y;
    vec4 term_px = render_boot_terminal(uv_txt, u_scene_norm);
    // Per-line colors: L1=electric-blue, L2=teal-green, L3=amber-violet, L4=cold white
    col += term_px.x * vec3(0.35, 0.68, 1.00) * 2.5;
    col += term_px.y * vec3(0.10, 0.85, 0.62) * 2.2;
    col += term_px.z * vec3(0.82, 0.42, 1.00) * 2.2;
    col += term_px.w * vec3(0.92, 0.96, 1.00) * 3.0;  // cold white — execution stamp
    // Cursor blink: small bar at the typing frontier of the active line
    {
        float sn = u_scene_norm;
        // Line 1 cursor: active 0.04→0.30
        float l1end = 0.04 + 11.0 * 0.022;
        float l1_typing = step(0.04, sn) * (1.0 - step(l1end + 0.03, sn));
        float l1_curx = 0.04 + clamp(sn - 0.04, 0.0, l1end - 0.04) / 0.022 * 0.065;
        float l1cx = -1.58 + clamp(floor((sn - 0.04) / 0.022) + 1.0, 0.0, 12.0) * 0.065;
        float l1_cur = l1_typing * step(0.5, sin(u_time * 14.0)) *
                       smoothstep(0.004, 0.0, abs(uv_txt.x - l1cx - 0.010)) *
                       smoothstep(0.041, 0.0, abs(uv_txt.y - 0.728));
        col += l1_cur * vec3(0.35, 0.68, 1.00) * 2.5;
        // Line 2 cursor: active 0.30→0.62
        float l2_typing = step(0.30, sn) * (1.0 - step(0.30 + 19.0 * 0.016 + 0.03, sn));
        float l2cx = -1.58 + clamp(floor((sn - 0.30) / 0.016) + 1.0, 0.0, 20.0) * 0.065;
        float l2_cur = l2_typing * step(0.5, sin(u_time * 14.0)) *
                       smoothstep(0.004, 0.0, abs(uv_txt.x - l2cx - 0.010)) *
                       smoothstep(0.041, 0.0, abs(uv_txt.y - 0.528));
        col += l2_cur * vec3(0.10, 0.85, 0.62) * 2.2;
        // Line 3 cursor: active 0.55→0.89
        float l3_typing = step(0.55, sn) * (1.0 - step(0.55 + 22.0 * 0.015 + 0.03, sn));
        float l3cx = -1.58 + clamp(floor((sn - 0.55) / 0.015) + 1.0, 0.0, 23.0) * 0.065;
        float l3_cur = l3_typing * step(0.5, sin(u_time * 14.0)) *
                       smoothstep(0.004, 0.0, abs(uv_txt.x - l3cx - 0.010)) *
                       smoothstep(0.041, 0.0, abs(uv_txt.y - 0.328));
        col += l3_cur * vec3(0.82, 0.42, 1.00) * 2.2;
        // Line 4 cursor: active 0.91→0.978 — faster blink (×1.4) for urgency
        float l4_typing = step(0.91, sn) * (1.0 - step(0.91 + 16.0 * 0.004 + 0.02, sn));
        float l4cx = -1.58 + clamp(floor((sn - 0.91) / 0.004) + 1.0, 0.0, 17.0) * 0.065;
        float l4_cur = l4_typing * step(0.5, sin(u_time * 19.6)) *
                       smoothstep(0.004, 0.0, abs(uv_txt.x - l4cx - 0.010)) *
                       smoothstep(0.041, 0.0, abs(uv_txt.y - 0.128));
        col += l4_cur * vec3(0.92, 0.96, 1.00) * 3.0;
    }

    // ── Overall Brightness and Tone ──
    col *= 0.2 + 0.8 * smoothstep(0.0, 0.4, u_scene_norm);
    // Audio energy: circuit traces and terminal text glow more during loud moments.
    col *= 0.85 + u_rms * 0.38;

    // HDR output — post.frag handles ACES tonemapping (no pre-tonemap here)
    frag_color = vec4(col, 1.0);
}
