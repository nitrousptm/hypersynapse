#version 460 core
// Act I — Boot / Synapse
// Raymarched SDF: neural filament lattice.
// Neurons: hash-placed soma + dendrites via smooth-min blended capsules.
// Volumetric filament glow accumulated during march.
// Beat-reactive pulse on BPM grid.

#include "include/sdf_lib.glsl"

in vec2 v_uv;
out vec4 frag;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;      // [0,1] phase within current beat
uniform float u_bar;       // [0,1] phase within current bar (4 beats)
uniform float u_act_norm;  // [0,1] within Act I
uniform int   u_beat_cnt;
uniform int   u_bar_cnt;

// ─── Constants ───────────────────────────────────────────────────────────────
#define PI  3.14159265358979323846
#define TAU 6.28318530717958647692

// ─── Hashing & math ──────────────────────────────────────────────────────────
float hash11(float n) { return fract(sin(n) * 43758.5453123); }

// ─── Scene ───────────────────────────────────────────────────────────────────
// One neuron cluster: soma sphere + 4 branching dendrite capsules
float neuron(vec3 p, float seed) {
    vec3 h0 = hash33(vec3(seed, 1.1, 2.2)) * 2.0 - 1.0;
    vec3 h1 = hash33(vec3(seed, 3.3, 4.4)) * 2.0 - 1.0;
    vec3 h2 = hash33(vec3(seed, 5.5, 6.6)) * 2.0 - 1.0;
    vec3 h3 = hash33(vec3(seed, 7.7, 8.8)) * 2.0 - 1.0;

    // Soma — pulses gently with beat
    float pulse = 0.02 * sin(u_beat * TAU);
    float d = sdSphere(p, 0.11 + pulse);

    // Primary dendrites
    d = smin(d, sdCapsule(p, vec3(0.0), h0 * 0.65, 0.022), 0.04);
    d = smin(d, sdCapsule(p, vec3(0.0), h1 * 0.80, 0.018), 0.04);

    // Secondary branches from primary tips
    d = smin(d, sdCapsule(p, h0 * 0.65, h0 * 0.65 + h2 * 0.38, 0.014), 0.03);
    d = smin(d, sdCapsule(p, h1 * 0.80, h1 * 0.80 + h3 * 0.30, 0.012), 0.03);

    return d;
}

// Scene: repeating 3-D lattice of neurons
float scene(vec3 p) {
    const float cell = 2.4;
    // Slight domain warp for organic feel
    p += 0.12 * sin(p.yzx * 1.3 + u_time * 0.2);

    vec3 rep = mod(p + cell * 0.5, cell) - cell * 0.5;
    vec3 id  = floor(p / cell + 0.5);
    float seed = dot(id, vec3(13.7, 7.3, 17.1));

    return neuron(rep, seed);
}

// Gradient-based normal
vec3 calc_normal(vec3 p) {
    const vec2 e = vec2(0.0008, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)));
}

// ─── Palette ─────────────────────────────────────────────────────────────────
// Evolves from pure magenta → teal-cyan over Act I
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);  // magenta/cyan/blue phase offsets
    return a + b * cos(TAU * (c * t + d));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
    vec2 uv = (v_uv * u_res - 0.5 * u_res) / u_res.y;

    // Beat kick: sharp flash at beat boundary, fades in ~0.05 s
    float kick = exp(-u_beat * 12.0) * 0.35;

    // Camera: slow orbit + gentle pitch drift
    float cam_t = u_time * 0.055;
    vec3 ro = vec3(cos(cam_t) * 3.0,
                   sin(cam_t * 0.37) * 0.9 + 0.2,
                   sin(cam_t) * 3.0);

    // Act intro: pull camera from far to near over first 20 s
    float pull = mix(5.0, 0.0, smoothstep(0.0, 0.15, u_act_norm));
    ro *= 1.0 + pull / max(length(ro), 0.001);

    vec3 fw    = normalize(-ro);
    vec3 right = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up    = cross(right, fw);
    vec3 rd    = normalize(fw + 1.5 * (uv.x * right + uv.y * up));

    // ── Raymarch ─────────────────────────────────────────────────────────────
    float t    = 0.02;
    float glow = 0.0;
    bool  hit  = false;
    vec3  hit_p;

    for (int i = 0; i < 120; ++i) {
        vec3 p = ro + rd * t;
        float d = scene(p);

        // Soft volumetric glow: accumulate near-surface contribution
        glow += 0.004 / (d * d + 0.0015);

        if (d < 0.0008) {
            hit   = true;
            hit_p = p;
            break;
        }
        if (t > 14.0) break;
        t += max(d * 0.72, 0.001);
    }

    // ── Surface shading ──────────────────────────────────────────────────────
    vec3 col = vec3(0.0);

    if (hit) {
        vec3 n   = calc_normal(hit_p);
        vec3 l   = normalize(vec3(0.5, 1.0, 0.6));
        float d  = max(dot(n, l), 0.0) * 0.6 + 0.4;  // wrapped diffuse

        // Fresnel rim
        float fr = pow(1.0 - abs(dot(n, -rd)), 3.5);

        // Palette evolves with act progress and bar rhythm
        float hue = u_act_norm * 0.5 + float(u_bar_cnt) * 0.04 + fr * 0.25;
        vec3 base = palette(hue);

        col  = base * d;
        col += base * fr * 1.8;       // neon rim
        col += vec3(0.9, 0.95, 1.0) * fr * 0.6;  // white hot edge
    }

    // ── Volumetric filament glow ──────────────────────────────────────────────
    glow = clamp(glow, 0.0, 6.0);
    float glow_hue = u_act_norm * 0.6 + u_bar * 0.12 + float(u_bar_cnt) * 0.045;
    vec3  glow_col = palette(glow_hue);
    col += glow_col * glow * (0.75 + kick * 2.5);

    // ── Sparse starfield in deep background ───────────────────────────────────
    vec2 star_uv = uv * 14.0;
    float star = pow(hash11(floor(star_uv.x) * 127.1 + floor(star_uv.y) * 311.7), 60.0) * 0.5;
    col += vec3(0.7, 0.85, 1.0) * star;

    // ── Vignette (applied in post too, but a mild one here controls far glow) ─
    float vig = 1.0 - 0.3 * dot(uv, uv);
    col *= vig;

    // Output HDR — post.frag will tonemap
    frag = vec4(col, 1.0);
}
