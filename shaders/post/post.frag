#version 460 core
// Post FX pass — SINGULARITY GARDEN
// Pipeline: chromatic aberration → dual bloom → lens flare → color grade → radial zoom blur → scanlines → grain → vignette → ACES → gamma

in vec2 v_uv;
out vec4 frag;

uniform sampler2D u_scene;
uniform float     u_time;
uniform vec2      u_res;
uniform float     u_beat;
uniform float     u_act_norm;
uniform float     u_scene_norm;
uniform int       u_bar_cnt;
uniform int       u_scene_idx;   // current scene 0–6

// ─── hash ─────────────────────────────────────────────────────────────────────
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash11(float n) { return fract(sin(n) * 43758.5453); }

// ─── chromatic aberration ─────────────────────────────────────────────────────
// Barrel-distorted: stronger at edges, varies by beat
vec3 chroma(vec2 uv, float strength) {
    vec2 dir  = uv - 0.5;
    float d   = length(dir);
    // Barrel warp: offset grows quadratically from center
    vec2 offs = normalize(dir + vec2(0.001)) * d * d * strength * 3.0;
    float r = texture(u_scene, uv + offs).r;
    float g = texture(u_scene, uv).g;
    float b = texture(u_scene, uv - offs).b;
    return vec3(r, g, b);
}

// ─── dual-layer Gaussian bloom ────────────────────────────────────────────────
// Two bloom layers: tight (inner glow) + wide (atmospheric halo)
// Uses a 13-point radial Gaussian kernel per layer — balanced quality vs cost.

vec3 bloom_layer(vec2 uv, float threshold, float radius) {
    vec2 texel = 1.0 / u_res;
    vec3 acc = vec3(0.0);
    float total_w = 0.0;

    // 13-tap radial kernel (Gaussian sigma ~= radius/3)
    // Arranged as center + 4 rings for good angular coverage
    const int N = 13;
    const vec2 DIRS[13] = vec2[13](
        vec2( 0.000,  0.000),  // center
        vec2( 1.000,  0.000),  // ring 1 (cardinal)
        vec2(-1.000,  0.000),
        vec2( 0.000,  1.000),
        vec2( 0.000, -1.000),
        vec2( 0.707,  0.707),  // ring 1 (diagonal)
        vec2(-0.707,  0.707),
        vec2( 0.707, -0.707),
        vec2(-0.707, -0.707),
        vec2( 1.848,  0.765),  // ring 2 (offset for less aliasing)
        vec2(-1.848,  0.765),
        vec2( 0.765, -1.848),
        vec2(-0.765, -1.848)
    );
    const float W[13] = float[13](
        0.200,  // center (lower to avoid over-brightening)
        0.110, 0.110, 0.110, 0.110,
        0.085, 0.085, 0.085, 0.085,
        0.040, 0.040, 0.040, 0.040
    );

    for (int i = 0; i < N; i++) {
        vec2 suv = uv + DIRS[i] * texel * radius;
        vec3 s   = texture(u_scene, clamp(suv, vec2(0.001), vec2(0.999))).rgb;
        vec3 bright = max(s - vec3(threshold), vec3(0.0));
        acc        += bright * W[i];
        total_w    += W[i];
    }
    return acc / (total_w + 0.001);
}

vec3 bloom(vec2 uv, float threshold, float radius, float strength) {
    // Tight layer: inner glow, contributes sharpness to bright spots
    vec3 tight = bloom_layer(uv, threshold + 0.1, radius * 0.4);
    // Wide layer: atmospheric halo, soft and large
    vec3 wide  = bloom_layer(uv, threshold,        radius * 1.0);
    // Combine: tight gets 40%, wide gets 60% — wide carries the "dreamy" quality
    return (tight * 0.4 + wide * 0.6) * strength;
}

// ─── lens flare ───────────────────────────────────────────────────────────────
// Appears on strong beats (kick drum hits). Uses a 5-ghost streak pattern.
float flare_streak(vec2 uv, vec2 src, float angle, float width, float len) {
    vec2 d   = uv - src;
    float c  = cos(angle), s_a = sin(angle);
    float along  = d.x * c + d.y * s_a;
    float across = -d.x * s_a + d.y * c;
    float streak = smoothstep(width, 0.0, abs(across));
    float falloff = exp(-abs(along / len) * 3.0);
    return streak * falloff * float(along > -len && along < len);
}

vec3 lens_flare(vec2 uv, float kick) {
    if (kick < 0.01) return vec3(0.0);

    // Flare origin: brightest region (approximate center of screen slightly off-axis)
    vec2 src = vec2(0.5, 0.5) + vec2(0.05, 0.02) * sin(u_time * 0.7);
    vec2 texel = 1.0 / u_res;

    vec3 col = vec3(0.0);

    // 3 ghost streaks at different angles and colors
    float ang_base = atan(src.y - 0.5, src.x - 0.5);
    float w = texel.x * 1.5;

    col += flare_streak(uv, src, ang_base,              w, 0.35) * vec3(0.20, 0.40, 1.00);
    col += flare_streak(uv, src, ang_base + 1.047,      w, 0.25) * vec3(1.00, 0.20, 0.60);
    col += flare_streak(uv, src, ang_base - 1.047,      w, 0.30) * vec3(0.20, 1.00, 0.70);

    // Circular ghost: appears opposite side of center from src
    vec2 ghost_pos = 2.0 * vec2(0.5) - src;
    float ghost_r  = length(uv - ghost_pos);
    col += smoothstep(0.06, 0.02, ghost_r) * vec3(0.50, 0.70, 1.00) * 0.4;

    // Central starburst: 6 spikes radiating from src
    vec2 from_src = normalize(uv - src + vec2(0.00001));
    float star_angle = atan(from_src.y, from_src.x);
    float spikes = pow(max(0.0, cos(star_angle * 6.0)), 8.0);
    float sdist = length(uv - src);
    col += spikes * exp(-sdist * 18.0) * vec3(0.90, 0.95, 1.00) * 0.6;

    return col * kick * kick;  // Square for snappier response
}

// ─── ACES tonemapper ─────────────────────────────────────────────────────────
vec3 aces(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x*(a*x+b)) / (x*(c*x+d)+e), 0.0, 1.0);
}

// ─── color grade — evolves over full demo (t = demo_norm 0→1) ─────────────────
// Act I (0–0.1875):  desaturated cold (near-black, white lines)
// Act II (0.1875–0.4375):  electric blue / dark cyan
// Act III (0.4375–0.75):  magenta / violet richness
// Act IV (0.75–1.0):  pure white / cosmic
vec3 color_grade(vec3 col, float demo_norm, float scene_norm) {
    float t = demo_norm;

    vec3 tint;
    if      (t < 0.1875) tint = mix(vec3(0.92, 0.95, 1.05), vec3(0.80, 0.90, 1.20), t/0.1875);
    else if (t < 0.4375) tint = mix(vec3(0.80, 0.90, 1.20), vec3(0.75, 0.70, 1.30), (t-0.1875)/0.25);
    else if (t < 0.75)   tint = mix(vec3(0.75, 0.70, 1.30), vec3(1.10, 0.80, 1.25), (t-0.4375)/0.3125);
    else                  tint = mix(vec3(1.10, 0.80, 1.25), vec3(1.05, 1.05, 1.10), (t-0.75)/0.25);

    col *= tint;

    float sat = mix(0.8, 1.3, smoothstep(0.4375, 0.75, t));
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, sat);

    // Contrast S-curve (lifted shadows in Acts III/IV for richer look)
    float lift = mix(0.0, 0.015, smoothstep(0.4375, 0.75, t));
    col = col * col * (3.0 - 2.0 * col) + lift;

    return col;
}

// ─── radial zoom blur ─────────────────────────────────────────────────────────
// Used during Scene 6 holy-shit zoom-out (scene_norm 0.80–1.0).
// Samples radially outward from the zoom center, creating a sense of infinite
// acceleration as the universe shrinks to a particle.
vec3 radial_zoom_blur(vec2 uv, float strength, vec2 center) {
    if (strength < 0.001) return texture(u_scene, uv).rgb;

    vec3 acc = vec3(0.0);
    const int SAMPLES = 12;
    vec2 dir = uv - center;
    float step_scale = strength / float(SAMPLES);

    for (int i = 0; i < SAMPLES; i++) {
        float t = float(i) / float(SAMPLES - 1);
        // Sample along line from uv toward center, weighted toward center
        vec2 sample_uv = uv - dir * t * step_scale * 8.0;
        acc += texture(u_scene, clamp(sample_uv, 0.001, 0.999)).rgb;
    }
    return acc / float(SAMPLES);
}

// ─── main ─────────────────────────────────────────────────────────────────────
void main() {
    vec2 uv  = v_uv;
    vec2 ctr = uv - 0.5;

    // Global demo progress 0→1 over full 240s.
    // u_act_norm resets to 0 at each act boundary — it cannot be used for
    // cross-act transitions. Use demo_norm for any effect that must evolve
    // monotonically across the whole demo.
    float demo_norm = clamp(u_time / 240.0, 0.0, 1.0);

    float kick = exp(-u_beat * 10.0);

    // 0. Scene 5 — organic heat shimmer: reality warping as fractal geometry blooms.
    // Applied before any sampling so CA, bloom, and grading all inherit the warp.
    // Layered sinusoidal displacement: 4 terms at coprime frequencies → turbulent feel.
    if (u_scene_idx == 4) {
        float hd = smoothstep(0.05, 0.45, u_scene_norm);
        float beat_amp = 1.0 + exp(-u_beat * 9.0) * 0.75 * u_scene_norm;
        float wx = sin(uv.y * 33.7 + u_time * 1.55) * 0.0026
                 + sin(uv.y * 18.1 - u_time * 0.85 + uv.x * 6.3) * 0.0017;
        float wy = cos(uv.x * 27.3 + u_time * 1.20) * 0.0021
                 + cos(uv.x * 11.7 - u_time * 0.65 + uv.y * 8.1) * 0.0013;
        uv = clamp(uv + vec2(wx, wy) * hd * beat_amp, 0.001, 0.999);
    }

    // 1. Chromatic aberration (barrel-distorted)
    float ca_base = 0.003 + demo_norm * 0.005;
    float ca_beat = kick * 0.008;
    float ca_fade = 1.0 - smoothstep(0.75, 1.0, demo_norm);
    float ca_str  = (ca_base + ca_beat) * ca_fade;
    vec3 col = chroma(uv, ca_str);

    // 1b. Time echo — Scene 4 (Time Fracture): temporal ghost images.
    // Two scene copies at offset UVs — blue-shifted (future) + red-shifted (past)
    // Doppler-like read: parallel timelines visible as translucent afterimages.
    if (u_scene_idx == 3) {
        float echo_str = 0.18 + u_scene_norm * 0.22;
        vec2 e = vec2(sin(u_time * 0.23) * 0.008, cos(u_time * 0.19) * 0.005);
        vec3 past   = texture(u_scene, clamp(uv - e, 0.001, 0.999)).rgb;
        vec3 future = texture(u_scene, clamp(uv + e, 0.001, 0.999)).rgb;
        col += future * vec3(0.10, 0.25, 1.00) * echo_str;
        col += past   * vec3(1.00, 0.18, 0.08) * echo_str * 0.60;
    }

    // 2. Dual-layer bloom (richer in Acts III/IV)
    float bloom_thresh   = mix(0.82, 0.50, demo_norm);
    float bloom_radius   = mix(5.0, 14.0, demo_norm) + kick * 6.0;
    float bloom_strength = mix(0.35, 1.10, demo_norm);
    col += bloom(uv, bloom_thresh, bloom_radius, bloom_strength);

    // 2b. Radial zoom blur — Scene 6 holy-shit zoom-out (scene_norm 0.80→1.0)
    if (u_scene_idx == 5) {
        float zoom_t = smoothstep(0.78, 0.98, u_scene_norm);
        // Zoom center trails slightly off-axis to sell the "falling outward" feel
        vec2 zoom_center = vec2(0.5 + 0.04 * sin(u_time * 0.4), 0.5 + 0.03 * cos(u_time * 0.3));
        col = mix(col, radial_zoom_blur(uv, zoom_t, zoom_center), zoom_t * 0.85);
    }

    // 3. Color grading (demo-wide palette — monotonic, must not reset at act boundaries)
    col = color_grade(col, demo_norm, u_scene_norm);

    // 4. Lens flare on beat (Acts II/III only — infectious/transcendent)
    float flare_gate = smoothstep(0.1875, 0.30, demo_norm) *
                       (1.0 - smoothstep(0.80, 0.90, demo_norm));
    col += lens_flare(uv, kick * flare_gate);

    // 4b. Rain streaks — Scene 3 (City Corruption): dystopian megacity atmosphere.
    // Thin vertical dashes catching electric-blue city light; vanish as buildings dissolve.
    if (u_scene_idx == 2) {
        float rain_fade = 1.0 - u_scene_norm * u_scene_norm;
        float rain_str  = rain_fade * (0.45 + kick * 0.65);
        if (rain_str > 0.005) {
            float asp = u_res.x / u_res.y;
            for (int ri = 0; ri < 12; ri++) {
                float fi  = float(ri);
                float xp  = (hash21(vec2(fi * 7.31, 0.13)) - 0.5) * asp;
                float xw  = 0.0006 + hash21(vec2(fi * 3.17, 0.27)) * 0.0010;
                float spd = 1.0 + hash21(vec2(fi * 11.3, 0.41)) * 2.5;
                float ph  = fract(hash21(vec2(fi * 5.43, 0.55)) + u_time * spd * 0.08);
                float cx  = ctr.x * asp;
                float dx  = abs(cx - xp);
                float glo = xw / (dx + xw);
                float sy  = fract(ctr.y * 0.4 + ph);
                float win = clamp(1.0 - abs(sy - 0.5) * 7.0, 0.0, 1.0);
                float br  = 0.15 + hash21(vec2(fi * 2.13, 0.61)) * 0.25;
                col      += glo * win * br * rain_str * vec3(0.18, 0.52, 1.00);
            }
        }
    }

    // 4d. Cosmic beat ripple — Scene 7 (Transcendence): expanding ring on each kick.
    // Starts at screen center and races outward between beats — "universe heartbeat".
    if (u_scene_idx == 6) {
        float rr   = u_beat * 1.8;
        float ring = smoothstep(0.018, 0.0, abs(length(ctr * 2.2) - rr));
        float fade = exp(-u_beat * 2.2) * u_scene_norm;
        col += ring * fade * vec3(0.35, 0.55, 1.0) * 1.4;
    }

    // 4c. Digital glitch — Scene 3 (City Corruption): AI rewriting the city data stream.
    // Row displacement + R/B channel-split fringe; grows with scene_norm² + kick beat-spike.
    // Strips narrow as corruption builds — visual read: city data collapsing into noise.
    if (u_scene_idx == 2) {
        float gs = u_scene_norm * u_scene_norm * 0.75 + kick * 0.5 * u_scene_norm;
        if (gs > 0.006) {
            float strip_h = mix(0.055, 0.016, u_scene_norm);
            float si      = floor(uv.y / strip_h);
            float st      = floor(u_time * 9.0);
            float r1      = hash21(vec2(si, st));
            float r2      = hash21(vec2(si * 5.7, st * 0.5 + 1.0));
            float thresh  = 1.0 - gs * 0.55;
            if (r1 > thresh) {
                float shift = (r2 - 0.5) * 0.036 * gs;
                // R and B shift by different amounts → analog color fringe on glitch edge
                float gr = texture(u_scene, clamp(vec2(uv.x + shift * 1.5, uv.y), 0.001, 0.999)).r;
                float gg = texture(u_scene, clamp(vec2(uv.x + shift,       uv.y), 0.001, 0.999)).g;
                float gb = texture(u_scene, clamp(vec2(uv.x + shift * 0.3, uv.y), 0.001, 0.999)).b;
                float bf = smoothstep(thresh, thresh + 0.18, r1);
                col = mix(col, vec3(gr, gg, gb), bf * 0.90);
            }
            // Occasional white-noise band (magnetic tape dropout)
            float bst  = floor(u_time * 5.0);
            float br   = hash21(vec2(73.1, bst));
            if (br > 0.88 && gs > 0.20) {
                float by   = hash21(vec2(11.7, bst));
                float bw   = 0.003 + hash21(vec2(31.3, bst)) * 0.008;
                float band = smoothstep(bw, 0.0, abs(uv.y - by));
                float nx   = hash21(vec2(uv.x * u_res.x * 0.5, bst * 7.3));
                col = mix(col, vec3(nx * 0.5, nx * 0.75, nx), band * gs * 0.75);
            }
        }
    }

    // 5. Scanlines — only Acts I/II, fade out in III/IV
    float scan_fade = 1.0 - smoothstep(0.3, 0.5, demo_norm);
    float scanline  = sin(uv.y * u_res.y * 3.14159) * 0.5 + 0.5;
    col *= 1.0 - 0.08 * (1.0 - scanline) * scan_fade;

    // 6. Film grain (slightly more in Act I for CRT texture)
    float grain_base = mix(0.045, 0.018, demo_norm);
    col += (hash21(uv + fract(u_time * 7.37)) - 0.5) * grain_base;

    // 7. Vignette — intense in I/II, open in III/IV + beat-pulse heartbeat
    float vig_str = mix(2.0, 0.8, smoothstep(0.4375, 0.75, demo_norm));
    // Beat-driven tightening: vignette briefly clamps inward on strong kicks
    float vig_pulse = kick * 0.6 * smoothstep(0.1875, 0.75, demo_norm);
    float vig = 1.0 - dot(ctr * 1.5, ctr * 1.5);
    vig = clamp(pow(clamp(vig, 0.0, 1.0), vig_str + vig_pulse), 0.0, 1.0);
    col *= vig;

    // 8. Beat-sync white flash (strong beats in Acts II/III)
    float flash_str = smoothstep(0.1875, 0.75, demo_norm);
    col += exp(-u_beat * 20.0) * flash_str * 0.08;

    // 9. ACES tonemapping
    col = aces(col);

    // 10. Triangular dither — prevents banding in dark areas before gamma
    // Two uniform samples combined via triangle distribution for ~1/256 noise floor
    float d1 = hash21(uv + fract(u_time * 43.31));
    float d2 = hash21(uv + fract(u_time * 73.79 + 0.5));
    col += (d1 + d2 - 1.0) / 255.0;

    // 11. sRGB gamma
    col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

    frag = vec4(col, 1.0);
}
