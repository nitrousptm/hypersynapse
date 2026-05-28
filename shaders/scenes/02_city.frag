#version 460 core
// Act II — Lattice / City
// Raymarched cyberpunk city: repeating box towers on a neon grid,
// camera flies through at ground level, beat-synced window flicker.

#include "include/sdf_lib.glsl"

in vec2 v_uv;
out vec4 frag;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform int   u_beat_cnt;
uniform int   u_bar_cnt;

#define PI  3.14159265358979323846
#define TAU 6.28318530717958647692

// ─── Helpers ─────────────────────────────────────────────────────────────────
float hash11(float n) { return fract(sin(n) * 43758.5453123); }
vec2  hash21(float n) { return fract(sin(vec2(n, n + 1.0)) * vec2(43758.5453, 22578.1459)); }

// ─── City scene ──────────────────────────────────────────────────────────────
// One city cell: ground plane + tower of random height
float city_cell(vec3 p, vec2 id) {
    float seed = dot(id, vec2(13.7, 7.3));
    vec2  h2   = hash21(seed);

    // Building: width varies, height 1–8 units
    float bw   = 0.25 + h2.x * 0.3;
    float bh   = 0.8  + h2.y * 7.2;

    // Random XZ offset within cell (keep street clear in center)
    float ox = (hash11(seed + 0.1) - 0.5) * 0.5;
    float oz = (hash11(seed + 0.2) - 0.5) * 0.5;

    vec3 bp   = p - vec3(ox, 0.0, oz);
    float box = sdBox(bp - vec3(0.0, bh * 0.5, 0.0), vec3(bw, bh * 0.5, bw));

    // Ground slab
    float ground = p.y + 0.01;

    return min(box, ground);
}

float scene(vec3 p) {
    const float cell = 3.0;
    vec2  p2  = p.xz;
    vec2  rep = mod(p2 + cell * 0.5, cell) - cell * 0.5;
    vec2  id  = floor(p2 / cell + 0.5);
    return city_cell(vec3(rep.x, p.y, rep.y), id);
}

vec3 calc_normal(vec3 p) {
    const vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)));
}

// ─── Color ───────────────────────────────────────────────────────────────────
// Window: warm amber flicker; street: cold blue-purple
vec3 window_color(float seed) {
    // Animated per-window flicker on beat grid
    float flick = hash11(seed + float(u_beat_cnt) * 0.37);
    float on    = step(0.3, flick);
    vec3 warm   = vec3(1.0, 0.75, 0.3) * (0.6 + 0.4 * on);
    vec3 teal   = vec3(0.2, 0.9, 0.85) * (0.4 + 0.6 * on);
    return mix(warm, teal, hash11(seed * 3.7)) * (0.5 + 0.5 * on);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
    vec2 uv = (v_uv * u_res - 0.5 * u_res) / u_res.y;

    // Camera: fly forward through city, with gentle weave
    float speed   = 4.0 + u_act_norm * 3.0;  // accelerates through act
    float fly_z   = u_time * speed;
    float weave_x = sin(u_time * 0.21) * 0.6;
    float weave_y = 0.8 + sin(u_time * 0.13) * 0.25;

    vec3 ro = vec3(weave_x, weave_y, fly_z);
    vec3 fw = normalize(vec3(sin(u_time * 0.08) * 0.3, -0.05, 1.0));
    vec3 right = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up    = cross(right, fw);
    vec3 rd    = normalize(fw + 1.6 * (uv.x * right + uv.y * up));

    // Beat kick
    float kick = exp(-u_beat * 10.0) * 0.4;

    // ── Raymarch ─────────────────────────────────────────────────────────────
    float t   = 0.05;
    float fog = 0.0;
    bool  hit = false;
    vec3  hit_p;

    for (int i = 0; i < 100; ++i) {
        vec3 p = ro + rd * t;
        float d = scene(p);

        fog += 0.003 / (d * d + 0.003);

        if (d < 0.001) { hit = true; hit_p = p; break; }
        if (t > 30.0)  break;
        t += max(d * 0.8, 0.002);
    }

    vec3 col = vec3(0.0);

    if (hit) {
        vec3  n    = calc_normal(hit_p);
        float diff = max(dot(n, normalize(vec3(0.3, 1.0, 0.5))), 0.0) * 0.5 + 0.1;

        // Identify cell for coloring
        const float cell = 3.0;
        vec2 cell_id = floor(hit_p.xz / cell + 0.5);
        float seed   = dot(cell_id, vec2(13.7, 7.3));

        // Is this a building face (not ground)?
        float is_building = step(0.05, hit_p.y);

        // Window grid on building faces
        vec2  face_uv   = hit_p.xz * 2.5 + hit_p.yy * 1.8;
        vec2  win_grid  = fract(face_uv);
        float win_mask  = step(0.15, win_grid.x) * step(0.15, win_grid.y)
                        * step(win_grid.x, 0.85) * step(win_grid.y, 0.85);
        float win_seed  = floor(face_uv.x) * 17.0 + floor(face_uv.y) * 43.0 + seed;
        vec3  win_col   = window_color(win_seed) * win_mask * is_building;

        // Building surface: dark concrete tint
        vec3 surface = vec3(0.04, 0.05, 0.08) * diff;
        col = surface + win_col * 1.8;

        // Ground: wet neon reflection
        float is_ground = 1.0 - is_building;
        float refl = pow(max(0.0, dot(n, -rd)), 3.0);
        col += vec3(0.2, 0.5, 1.0) * refl * 0.4 * is_ground;
    }

    // Street neon glow fog
    fog  = clamp(fog, 0.0, 3.0);
    col += vec3(0.1, 0.25, 0.8) * fog * (0.5 + kick * 2.0);

    // Atmospheric distance fade to deep blue
    float dist_fog = 1.0 - exp(-t * 0.035);
    col  = mix(col, vec3(0.02, 0.03, 0.10), dist_fog);

    // Horizontal scan flare at camera level
    float scan_flare = exp(-pow(uv.y + 0.15, 2.0) * 80.0) * 0.15;
    col += vec3(0.3, 0.6, 1.0) * scan_flare * (1.0 + kick * 3.0);

    frag = vec4(col, 1.0);
}
