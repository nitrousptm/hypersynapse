#version 460 core
// Post FX pass
// Input:  u_scene (HDR RGBA16F from offscreen FBO)
// Output: final LDR sRGB frame
//
// Pipeline:
//   1. Chromatic aberration (radial per-channel UV offset)
//   2. Bloom  (13-sample star blur on bright extract, ~8px radius)
//   3. Scanlines
//   4. Film grain
//   5. Vignette
//   6. ACES tonemapping
//   7. sRGB gamma correction

in vec2 v_uv;
out vec4 frag;

uniform sampler2D u_scene;
uniform float     u_time;
uniform vec2      u_res;
uniform float     u_beat;
uniform float     u_act_norm;
uniform int       u_bar_cnt;

// ─── Hash ────────────────────────────────────────────────────────────────────
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// ─── Chromatic aberration ────────────────────────────────────────────────────
// Radial offset: R pushed outward, B pushed inward, G unchanged
vec3 chroma(vec2 uv, float strength) {
    vec2 dir   = uv - 0.5;
    float dist = length(dir);
    vec2  offs = normalize(dir + vec2(0.001)) * dist * strength;

    float r = texture(u_scene, uv + offs).r;
    float g = texture(u_scene, uv).g;
    float b = texture(u_scene, uv - offs).b;
    return vec3(r, g, b);
}

// ─── Bloom ───────────────────────────────────────────────────────────────────
// 13-tap cross + diagonal pattern; only bright pixels contribute.
// This is intentionally a single-pass approximation, not a true two-pass gaussian.
vec3 bloom(vec2 uv, float threshold, float radius) {
    vec2 texel = 1.0 / u_res;
    vec3 acc   = vec3(0.0);
    float w    = 0.0;

    // Offsets: axis-aligned (weight 1.0) + diagonal (weight 0.5)
    vec2 offsets[12] = vec2[12](
        vec2( 1, 0), vec2(-1,  0), vec2(0,  1), vec2( 0, -1),
        vec2( 2, 0), vec2(-2,  0), vec2(0,  2), vec2( 0, -2),
        vec2( 1, 1), vec2(-1,  1), vec2(1, -1), vec2(-1, -1)
    );
    float weights[12] = float[12](
        0.9, 0.9, 0.9, 0.9,
        0.4, 0.4, 0.4, 0.4,
        0.3, 0.3, 0.3, 0.3
    );

    for (int i = 0; i < 12; ++i) {
        vec2 suv  = uv + offsets[i] * texel * radius;
        vec3 s    = texture(u_scene, suv).rgb;
        vec3 bright = max(s - vec3(threshold), vec3(0.0));
        acc += bright * weights[i];
        w   += weights[i];
    }
    return acc / (w + 0.001);
}

// ─── ACES tonemapper ─────────────────────────────────────────────────────────
// Stephen Hill fit; maps HDR [0,∞) → [0,1]
vec3 aces(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x*(a*x+b)) / (x*(c*x+d)+e), 0.0, 1.0);
}

// ─── Main ────────────────────────────────────────────────────────────────────
void main() {
    // Centre-origin UV
    vec2 uv  = v_uv;
    vec2 ctr = uv - 0.5;

    // Beat kick drives effects dynamically
    float kick = exp(-u_beat * 10.0);

    // Act-specific effect intensity (stronger as demo progresses)
    float fx_intensity = mix(0.6, 1.2, u_act_norm);

    // 1. Chromatic aberration (stronger on beat, stronger in later acts)
    float ca_str = (0.006 + kick * 0.004) * mix(0.8, 1.5, u_act_norm);
    vec3 col     = chroma(uv, ca_str);

    // 2. Bloom (adaptive threshold + radius per act)
    // Act I: subtle glow, Act II: strong bloom, Act III: chaotic bloom
    float bloom_thresh  = mix(0.80, 0.65, u_act_norm);  // Lower threshold = more glow
    float bloom_radius  = mix(5.0, 10.0, u_act_norm) + kick * 4.0;
    float bloom_strength = mix(0.40, 0.80, u_act_norm);
    col += bloom(uv, bloom_thresh, bloom_radius) * bloom_strength;

    // 3. Scanlines — intensity increases toward collapse (Act III)
    float scanline = sin(uv.y * u_res.y * 3.14159) * 0.5 + 0.5;
    float scan_str = mix(0.04, 0.12, u_act_norm);  // Subtle→heavy
    col *= 1.0 - scan_str * (1.0 - scanline);

    // 4. Film grain — per-pixel, per-frame, stronger in final act
    float grain_strength = mix(0.03, 0.08, u_act_norm);
    float grain = (hash21(uv + fract(u_time * 7.37)) - 0.5) * grain_strength;
    col += vec3(grain);

    // 5. Vignette (morphs from subtle to extreme during collapse)
    // Act I: gentle vignette, Act III: heavy edge darkening (collapse effect)
    float vig_power = mix(1.5, 3.5, u_act_norm);
    float vig_radius = mix(1.6, 2.2, u_act_norm);
    float vig = 1.0 - dot(ctr, ctr) * vig_radius;
    vig = clamp(vig, 0.0, 1.0);
    vig = pow(vig, vig_power);  // Sharper falloff in Act III
    col *= vig;

    // 6. ACES tonemap
    col = aces(col);

    // 7. sRGB gamma (2.2 approx)
    col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

    frag = vec4(col, 1.0);
}
