#version 460 core
// Post FX pass — SINGULARITY GARDEN
// Pipeline: chromatic aberration → dual bloom → lens flare → color grade → radial zoom blur → scanlines → grain → vignette → ACES → gamma

in vec2 v_uv;
out vec4 frag;

uniform sampler2D u_scene;
uniform float     u_time;
uniform vec2      u_res;
uniform float     u_beat;
uniform float     u_bar;
uniform float     u_act_norm;
uniform float     u_scene_norm;
uniform int       u_bar_cnt;
uniform int       u_scene_idx;   // current scene 0–6
uniform float     u_rms;         // audio RMS amplitude [0,1] from precomputed envelope

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

// ─── anamorphic lens streak ──────────────────────────────────────────────────
// Horizontal cinema-lens streaks from bright light sources (Acts III/IV).
// Samples horizontally left+right from each bright pixel, decaying with distance.
// Blue-shifted tint (0.72,0.88,1.0) replicates real anamorphic lens coating color.
// 24 samples per direction = 48 total per pixel when active.
vec3 anamorphic_streak(vec2 uv, float strength, float threshold) {
    if (strength < 0.001) return vec3(0.0);
    vec2 texel = vec2(1.0 / u_res.x, 0.0);   // horizontal only
    vec3 acc   = vec3(0.0);
    float decay = 1.0;
    for (int i = 1; i <= 24; i++) {
        float fi   = float(i);
        float step = fi * 2.5;
        vec3 sr    = texture(u_scene, clamp(uv + texel * step, 0.001, 0.999)).rgb;
        vec3 sl    = texture(u_scene, clamp(uv - texel * step, 0.001, 0.999)).rgb;
        float lr   = max(dot(sr, vec3(0.2126, 0.7152, 0.0722)) - threshold, 0.0);
        float ll   = max(dot(sl, vec3(0.2126, 0.7152, 0.0722)) - threshold, 0.0);
        acc       += (lr + ll) * exp(-fi * 0.18);
    }
    return acc * strength * 0.012 * vec3(0.72, 0.88, 1.00);
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

    // u_rms dynamic contrast: loud passages punch +9%, quiet passages relax −4%.
    // Centred at grey so darks get darker and brights get brighter together.
    // Gate to Acts II–IV only (demo_norm > 0.1875) — Act I stays consistently cold.
    if (t > 0.1875) {
        float rms_c = 0.96 + u_rms * 0.13;  // 0.96 at silence, 1.09 at peak RMS
        col = (col - 0.5) * rms_c + 0.5;
    }

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

// ─── Fractal lightning bolt ───────────────────────────────────────────────────
// Subdivides segment a→b into N jagged sub-segments with random perpendicular
// displacement (bell envelope). Returns per-pixel glow (exp falloff).
// Also spawns 2 forked branches off the main trunk for realistic lightning.
float lightning_segment(vec2 uv_asp, vec2 a, vec2 b, float width_inv) {
    vec2 pa = uv_asp - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    return exp(-d * width_inv);
}

float lightning_bolt(vec2 uv_asp, vec2 a, vec2 b, float seed) {
    const int N = 10;
    vec2 perp = normalize(vec2(-(b.y - a.y), b.x - a.x));
    float seg_len = length(b - a);
    float acc = 0.0;
    vec2 prev = a;
    // Precompute jagged points for trunk (needed by branches)
    vec2 pts[11];
    pts[0] = a;
    for (int i = 1; i <= N; i++) {
        float t    = float(i) / float(N);
        vec2  base = mix(a, b, t);
        float env  = t * (1.0 - t) * 4.0;
        float rnd  = hash21(vec2(seed + t * 11.3, seed * 0.5 + float(i) * 0.31)) * 2.0 - 1.0;
        pts[i] = base + perp * rnd * seg_len * 0.32 * env;
    }
    // Draw main trunk
    for (int i = 1; i <= N; i++) {
        acc += lightning_segment(uv_asp, pts[i-1], pts[i], 250.0) * (1.5 / float(N));
    }
    // Two forked branches — spawn from ~40% and ~65% along trunk, shorter+thinner
    for (int fi = 0; fi < 2; fi++) {
        float ft  = 0.38 + float(fi) * 0.27;
        int   si  = int(ft * float(N));
        vec2  fp  = pts[si];
        float fang = hash21(vec2(seed + float(fi) * 3.7, seed * 2.1 + 0.5)) * 2.0 - 1.0;
        vec2  fdir = normalize(b - a + perp * fang * 0.8);
        vec2  fe   = fp + fdir * seg_len * 0.30;
        // 5-segment branch, thinner (0.0026 vs 0.004 trunk)
        const int BN = 5;
        vec2 bprev = fp;
        vec2 bperp = normalize(vec2(-fdir.y, fdir.x));
        float blen = length(fe - fp);
        for (int bi = 1; bi <= BN; bi++) {
            float bt   = float(bi) / float(BN);
            vec2  bbase = mix(fp, fe, bt);
            float benv  = bt * (1.0 - bt) * 4.0;
            float brnd  = hash21(vec2(seed + float(fi)*5.1 + bt*7.3, float(bi)*0.57)) * 2.0 - 1.0;
            vec2  bpt   = bbase + bperp * brnd * blen * 0.40 * benv;
            acc += lightning_segment(uv_asp, bprev, bpt, 380.0) * (0.5 / float(BN));
            bprev = bpt;
        }
    }
    return acc;
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

    // 0. Scene 7 — two compound pre-sampling effects:
    //   a) "Big-bang" entry burst at scene_norm 0→0.055: UV expands outward from centre
    //      (inverted zoom), fades within ~1.3s. Contrasts the inward zoom-out that ended
    //      scene 6 — the universe-particle *explodes* into the cosmic garden of Act IV.
    //   b) Singularity vortex at scene_norm 0.50→0.875: centre-heavy spiral before logo.
    if (u_scene_idx == 6) {
        float bang = (1.0 - smoothstep(0.0, 0.055, u_scene_norm));
        if (bang > 0.001) {
            vec2  bd   = uv - 0.5;
            float br   = length(bd);
            // Expand UV radially outward: push pixels toward edges then snap back
            float push = bang * 0.065 * exp(-br * 3.5);
            uv = clamp(uv + normalize(bd + vec2(1e-5)) * push, 0.001, 0.999);
        }
        float sil  = smoothstep(0.870, 0.875, u_scene_norm);
        float ramp = smoothstep(0.50, 0.87, u_scene_norm) * (1.0 - sil);
        if (ramp > 0.001) {
            vec2  d      = uv - 0.5;
            float r      = length(d);
            float vkick  = exp(-u_beat * 8.0);
            // Rotation angle: center-heavy falloff (exp) so outer stars barely move.
            // u_rms: sustained loud passages accelerate the inward spiral independently
            // of individual kicks — the whole universe churns faster during climaxes.
            float rot    = ramp * (0.06 + u_rms * 0.05 + vkick * 0.14) * exp(-r * 4.0) * 3.14159;
            float c_r  = cos(rot), s_r = sin(rot);
            vec2  dw   = vec2(d.x * c_r - d.y * s_r, d.x * s_r + d.y * c_r);
            uv = clamp(0.5 + dw, 0.001, 0.999);
        }
        // Exit — singularity implosion (scene_norm 0.875→1.0): UV contracts toward centre
        // as the universe-particle crosses its event horizon. Picks up exactly where the
        // vortex ends (sil gate). Pairs with Scene 7 big-bang burst (UV expands outward)
        // for an inhale→exhale transition at the Act III→IV cut.
        float sing_pull = smoothstep(0.875, 1.0, u_scene_norm);
        if (sing_pull > 0.001) {
            vec2  spd  = uv - 0.5;
            float pull = sing_pull * sing_pull * 0.042 * exp(-length(spd) * 2.2);
            uv = clamp(uv - normalize(spd + vec2(1e-5)) * pull, 0.001, 0.999);
        }
    }

    // 0a-entry. Scene 3 entry — City Corruption onset at 0:45 bass drop.
    // Act II begins: the AI starts rewriting the city. UV explodes outward (city
    // geometry crystallising from a singularity point at screen centre), then snaps
    // back as the corruption takes hold. Duration ~2.4s (scene_norm 0→0.10).
    // Paired with an electric-blue flash in section 8e.
    if (u_scene_idx == 2) {
        float city_t = 1.0 - smoothstep(0.0, 0.10, u_scene_norm);
        if (city_t > 0.001) {
            vec2  d      = uv - 0.5;
            float r      = length(d);
            // Push pixels outward: city grid materialises from a collapsed point
            float push   = city_t * 0.055 * exp(-r * 2.0);
            uv = clamp(uv + normalize(d + vec2(1e-5)) * push, 0.001, 0.999);
        }
    }

    // 0a-exit. Scene 3 exit — city data death at 1:15 approach (scene_norm 0.80→0.98).
    // The AI's rewrite hits 100%: city strips detach and drift as the data collapses.
    // Row-based horizontal scatter + vertical chromatic drift. Paired with section 8h flash.
    if (u_scene_idx == 2) {
        float death_t = smoothstep(0.80, 0.98, u_scene_norm);
        if (death_t > 0.001) {
            float strip_h = 0.028;
            float si      = floor(uv.y / strip_h);
            float rshift  = (hash11(si * 3.71 + floor(u_time * 4.0)) - 0.5) * death_t * 0.042;
            uv.x = clamp(uv.x + rshift, 0.001, 0.999);
            // Vertical chroma drift: B channel "falls" as data stream crashes
            float vy = death_t * death_t * 0.014 * sin(uv.x * 37.0 + u_time * 1.3);
            uv.y = clamp(uv.y + vy, 0.001, 0.999);
        }
    }

    // 0a2-entry. Scene 4 entry — Time Fracture at 1:15.
    // Time shatters: rows of pixels are displaced horizontally by different amounts,
    // as if the frame is being torn apart by the temporal rupture. Duration ~2.1s
    // (scene_norm 0→0.09). Paired with a cold blue-white flash in section 8f.
    if (u_scene_idx == 3) {
        float frac_t = 1.0 - smoothstep(0.0, 0.09, u_scene_norm);
        if (frac_t > 0.001) {
            // Each row gets a different random horizontal offset — "tape-pull" tear
            float row    = floor(uv.y * u_res.y / 8.0);   // 8-pixel row blocks
            float rshift = (hash21(vec2(row, 7.3)) - 0.5) * frac_t * 0.045;
            uv.x = clamp(uv.x + rshift, 0.001, 0.999);
        }
    }

    // 0a2-exit. Scene 4 exit — temporal collapse: spacetime twists as time pressure builds.
    // Quadratic UV rotation from centre (scene_norm 0.82→0.97, ~4.5s) creates a growing
    // tension that snaps off cleanly at the Act III crossfade entry burst.
    if (u_scene_idx == 3) {
        float exit_t = smoothstep(0.82, 0.97, u_scene_norm);
        if (exit_t > 0.001) {
            vec2 d3  = uv - 0.5;
            float tw = exit_t * exit_t * 0.065;   // quadratic ramp → ~3.7° at peak
            float c3 = cos(tw), s3 = sin(tw);
            uv = clamp(0.5 + vec2(d3.x*c3 - d3.y*s3, d3.x*s3 + d3.y*c3), 0.001, 0.999);
        }
    }

    // 0b-entry. Scene 5 entry — geometry crystallisation implosion.
    // At the emotional Act III onset (t=1:45, 133 BPM peak), fractals erupt from nothingness.
    // UV is pulled inward (geometry rushing toward camera) over the first 3.6s (scene_norm 0→0.08),
    // creating an "implosion-bloom" before the heat shimmer takes over.
    // Paired with a magenta burst in section 8d.
    if (u_scene_idx == 4) {
        float crystal_t = 1.0 - smoothstep(0.0, 0.08, u_scene_norm);
        if (crystal_t > 0.001) {
            vec2  d      = uv - 0.5;
            float r      = length(d);
            // Inward pull — strongest at centre-edge boundary (exp(-r*2.5))
            float implode = crystal_t * 0.060 * exp(-r * 2.5);
            uv = clamp(uv - normalize(d + vec2(1e-5)) * implode, 0.001, 0.999);
        }
    }

    // 0b. Scene 5 — organic heat shimmer: reality warping as fractal geometry blooms.
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

    // 0e. Scene 5 exit — fractal ascension dissolution.
    // As the fractal flowers reach maximum bloom (2:30 cut approaching), a gentle CW
    // spiral winds the geometry field inward while UV slightly contracts — the scene
    // "inhales" before impossible space tears it open. scene_norm 0.82→0.98 (~4.3s).
    if (u_scene_idx == 4) {
        float asc_t = smoothstep(0.82, 0.98, u_scene_norm);
        if (asc_t > 0.001) {
            vec2 d = uv - 0.5;
            float r = length(d);
            // CW rotation (opposite of scene 4's CCW exit twist); centre-heavy so edges
            // stay readable while the core fractal spirals toward its singularity.
            float angle = asc_t * asc_t * 0.050 * exp(-r * 1.8);
            float sa = sin(angle), ca = cos(angle);
            d = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca);
            // Soft UV compression: portal inhaling the scene (~1.6% at full strength)
            uv = clamp(d * (1.0 - asc_t * 0.016) + 0.5, 0.001, 0.999);
        }
    }

    // 0c. Scene 6 entry — spacetime-fold shockwave.
    // Crossing into impossible space tears a radial ripple through the UV field.
    // A wavefront expands outward from screen centre, decaying over ~3.6s (scene_norm 0→0.12).
    // Applied pre-sampling so bloom + CA both ride the warped texture.
    if (u_scene_idx == 5) {
        float entry_t = 1.0 - smoothstep(0.0, 0.12, u_scene_norm);
        if (entry_t > 0.001) {
            vec2  d       = uv - 0.5;
            float r       = length(d);
            // Wavefront travels from centre outward; phase inverts at beat
            float wave_r  = (1.0 - entry_t) * 0.75 + exp(-u_beat * 6.0) * 0.04;
            float dist_to_front = r - wave_r;
            // Decaying oscillation behind the front (1 ring crest)
            float ripple  = sin(dist_to_front * 52.0) * exp(-abs(dist_to_front) * 28.0);
            float warp    = ripple * entry_t * 0.028;
            vec2  dir     = normalize(d + vec2(1e-5));
            uv = clamp(uv + dir * warp, 0.001, 0.999);
            // Second-pass chromatic bleed behind wavefront: R outward, B inward
            float behind  = step(0.0, -dist_to_front) * entry_t * entry_t;
            // Absorbed into later CA pass via slight UV nudge only — keeps this block cheap
        }
    }

    // 0c2. Scene 2 — monolith gravitational field: SDF mass bends spacetime.
    // As the monolith materialises and builds power (scene_norm 0.12→0.80) its
    // mass causes a subtle radial inward pull centred on the structure — same
    // 1/r² physics as Scene 6's universe-particle lensing, deliberately echoing
    // the "small seed of cosmic scale" theme. Beat-kicks surge the pull briefly.
    // Gated off before the exit shockwave (0d) to avoid conflicting distortions.
    if (u_scene_idx == 1) {
        float grav_t = smoothstep(0.12, 0.45, u_scene_norm)
                     * (1.0 - smoothstep(0.78, 0.90, u_scene_norm));
        if (grav_t > 0.001) {
            float beat_surge = 1.0 + exp(-u_beat * 8.0) * 0.55;
            vec2  d    = uv - vec2(0.5, 0.55);   // monolith centre: slightly above screen midpoint
            float r    = length(d);
            // 1/r² point-mass lens pull, clamped to avoid singularity at centre
            float pull = grav_t * beat_surge * 0.0042 / (r * r * 12.0 + 0.28);
            uv = clamp(uv - normalize(d + vec2(1e-5)) * pull, 0.001, 0.999);
        }
    }

    // 0d. Scene 2 exit — monolith opening shockwave: reality tears as the
    // monolith opens impossibly at 0:45. A radial UV ripple expands outward
    // from screen centre (scene_norm 0.84→1.0), creating a lens-distortion ring
    // that precedes the chromatic crack-light in section 1c. Strength fades as
    // the wave moves off-screen so the Act I→II crossfade transition reads clean.
    if (u_scene_idx == 1) {
        float open_t = smoothstep(0.84, 1.0, u_scene_norm);
        if (open_t > 0.001) {
            vec2  d2    = uv - 0.5;
            float r2    = length(d2 * vec2(u_res.x / u_res.y, 1.0));  // aspect-correct radius
            float wave_r = open_t * 0.90;
            float dtw   = r2 - wave_r;
            // Decaying ring: one oscillation crest behind the advancing wave front
            float ripple = sin(dtw * 38.0) * exp(-abs(dtw) * 18.0) * (1.0 - open_t) * 0.022;
            uv = clamp(uv + normalize(d2 + vec2(1e-5)) * ripple, 0.001, 0.999);
        }
    }

    // 1. Chromatic aberration (barrel-distorted)
    // u_rms: sustained audio energy swells the prismatic separation — loud passages
    // breathe with visible dispersion, quiet interludes sharpen to near-clean optics.
    float ca_base = 0.003 + demo_norm * 0.005 + u_rms * 0.003;
    float ca_beat = kick * 0.008;
    float ca_fade = 1.0 - smoothstep(0.75, 1.0, demo_norm);
    float ca_str  = (ca_base + ca_beat) * ca_fade;
    vec3 col = chroma(uv, ca_str);

    // 1b. Time echo — Scene 4 (Time Fracture): temporal ghost images.
    // Past (red-shifted) spirals CCW at 0.98× scale; future (blue-shifted) spirals CW
    // at 1.02× scale — the timelines appear to "peel apart" in opposite directions from
    // the frozen present. Beat-reactive: rotation grows 30% on kick for a snap-pull feel.
    // Gate clears entry row-tear (0→0.10) where UV is already distorted.
    if (u_scene_idx == 3) {
        float echo_gate = smoothstep(0.10, 0.22, u_scene_norm);
        float echo_str  = (0.18 + u_scene_norm * 0.22) * echo_gate;
        // Rotation angle: subtle (max ~1.5° at full scene_norm) so geometry stays readable
        float rot_base  = 0.026 * u_scene_norm;
        float rot_kick  = rot_base + exp(-u_beat * 8.0) * 0.010 * u_scene_norm;
        // Past: CCW rotation + slight shrink (time "contracting")
        float cp = cos(-rot_kick), sp = sin(-rot_kick);
        vec2  d_past = (uv - 0.5) * 0.978;
        vec2  past_uv = 0.5 + vec2(d_past.x * cp - d_past.y * sp,
                                    d_past.x * sp + d_past.y * cp);
        // Future: CW rotation + slight expand (time "dilating")
        float cf = cos( rot_kick), sf = sin( rot_kick);
        vec2  d_fut = (uv - 0.5) * 1.022;
        vec2  fut_uv = 0.5 + vec2(d_fut.x * cf - d_fut.y * sf,
                                   d_fut.x * sf + d_fut.y * cf);
        vec3 past   = texture(u_scene, clamp(past_uv, 0.001, 0.999)).rgb;
        vec3 future = texture(u_scene, clamp(fut_uv,  0.001, 0.999)).rgb;
        col += future * vec3(0.08, 0.22, 1.00) * echo_str;
        col += past   * vec3(1.00, 0.16, 0.06) * echo_str * 0.62;
    }

    // 1b2. Gravity mirage — Scene 4 body (Time Fracture, scene_norm 0.15→0.80).
    // The temporal singularity distorts space around it even in post-space: any light passing
    // near the black hole's screen-space projection shimmers as if passing through a heat
    // mirage — the same physical phenomenon as gravitational lensing but applied to the
    // post-processed 2D frame. Two-frequency sinusoidal UV turbulence grows in amplitude
    // as scene_norm increases (singularity gaining mass) and surges on each 133 BPM kick.
    // Black hole projects to approximately (0.5, 0.42) in UV space (camera orbits slightly
    // above, looking down at a gentle angle, placing the singularity a little below centre).
    if (u_scene_idx == 3) {
        float mg = smoothstep(0.15, 0.30, u_scene_norm)
                 * (1.0 - smoothstep(0.76, 0.82, u_scene_norm));
        if (mg > 0.001) {
            vec2 bh_uv = vec2(0.50, 0.42);  // black hole screen projection
            vec2 bh_d  = uv - bh_uv;
            float bh_r = length(bh_d) + 0.001;
            // Inverse-square mirage strength: strongest near the BH, falls off quickly
            float proximity = mg * 0.0028 / (bh_r * bh_r + 0.012);
            // Two-frequency sinusoidal shimmer (coprime frequencies to avoid periodicity)
            float sh1 = sin(bh_r * 42.0 - u_time * 1.7) * sin(bh_r * 27.3 + u_time * 2.1);
            float sh2 = sin(bh_r * 63.0 + u_time * 0.9) * cos(bh_r * 18.5 - u_time * 3.3);
            vec2 shimmer = normalize(bh_d) * (sh1 * 0.6 + sh2 * 0.4) * proximity;
            // Beat-surge: gravity "pulses" with each kick as the accretion disk flares
            shimmer *= 1.0 + exp(-u_beat * 7.0) * 0.80;
            uv = clamp(uv + shimmer, 0.001, 0.999);
        }
    }

    // 1c. Monolith fracture — Scene 2 (Awakening Core): vertical crack of white-blue
    // light tears the frame as the monolith "opens impossibly" before the Act I→II cut.
    if (u_scene_idx == 1) {
        float split_t = smoothstep(0.82, 1.0, u_scene_norm);
        if (split_t > 0.001) {
            float cx = abs(uv.x - 0.5);
            float crack = split_t * 0.0035 / (cx + split_t * 0.0035);
            col += crack * vec3(0.45, 0.75, 1.0) * split_t * 2.2;
            // Chromatic bleed: R drifts right, B left — prismatic tear effect
            float fr = texture(u_scene, clamp(uv + vec2(split_t * 0.020, 0.0), 0.001, 0.999)).r;
            float fb = texture(u_scene, clamp(uv - vec2(split_t * 0.015, 0.0), 0.001, 0.999)).b;
            float bleed = crack * split_t * 0.5;
            col.r = mix(col.r, col.r * 0.35 + fr * 0.65, bleed);
            col.b = mix(col.b, col.b * 0.35 + fb * 0.65, bleed);
        }
    }

    // 1d. Impossible-space chromatic fold — Scene 6 (Impossible Space, body: 0.08→0.78).
    // On each 133 BPM kick, R samples a UV reflected around a per-bar axis through screen
    // center (simulating a 4D fold plane opening briefly); B shifts radially outward from
    // center (chromatic separation as non-euclidean geometry bends wavelengths differently).
    // Axis rotates per bar (hash of u_bar_cnt): each bar has a unique fold direction so the
    // effect never looks repetitive across the 30-second impossible-space run.
    // Gate leaves entry burst (0→0.08) and zoom-out window (0.80+) clean.
    if (u_scene_idx == 5) {
        float fold_g = smoothstep(0.08, 0.22, u_scene_norm)
                     * (1.0 - smoothstep(0.70, 0.80, u_scene_norm));
        float fk = kick * fold_g;
        if (fk > 0.008) {
            // Per-bar fold axis: rotate unpredictably, consistently within a bar
            float ang  = hash11(float(u_bar_cnt) * 0.233) * 6.2832;
            vec2  ax   = vec2(cos(ang), sin(ang));
            vec2  d    = ctr;
            // Reflect UV d around axis: partial reflection = partial 4D fold
            vec2  refl = d - 2.0 * dot(d, ax) * ax;
            vec2  uv_r = clamp(0.5 + mix(d, refl, fk * 0.35), 0.001, 0.999);
            col.r = mix(col.r, texture(u_scene, uv_r).r, fk * 0.65);
            // B: radial outward — longer wavelength bends less in curved space
            vec2  uv_b = clamp(uv + normalize(d + vec2(1e-5)) * fk * 0.022, 0.001, 0.999);
            col.b = mix(col.b, texture(u_scene, uv_b).b, fk * 0.60);
        }
    }

    // 2. Dual-layer bloom (richer in Acts III/IV; audio-reactive via u_rms)
    // u_rms scales bloom strength: quiet passages bloom gently, loud peaks bloom hard.
    // rms_scale maps [0,1] → [0.6, 1.4] so there's always some bloom but loud moments
    // are noticeably more dramatic.
    float rms_scale      = 0.60 + u_rms * 0.80;
    float bloom_thresh   = mix(0.82, 0.50, demo_norm) + (1.0 - u_rms) * 0.12;
    float bloom_radius   = mix(5.0, 14.0, demo_norm) + kick * 6.0;
    float bloom_strength = mix(0.35, 1.10, demo_norm) * rms_scale;
    col += bloom(uv, bloom_thresh, bloom_radius, bloom_strength);

    // 2c. Zodiacal scatter — Scene 7 (Transcendence): soft luminous starfield haze.
    // Captures dim galaxy regions below the standard bloom threshold and scatters
    // them into a deep blue-violet atmospheric glow — like a real telescope image.
    // Gated out before logo reveal (scene_norm > 0.875) to keep the silence window clean.
    if (u_scene_idx == 6) {
        float zod = smoothstep(0.0, 0.25, u_scene_norm)
                  * (1.0 - smoothstep(0.875, 0.905, u_scene_norm));
        if (zod > 0.01) {
            vec3 scatter = bloom_layer(uv, 0.20, 28.0) * vec3(0.18, 0.22, 0.40);
            col += scatter * 0.45 * zod;
        }
    }

    // 2b. Radial zoom blur — Scene 6 holy-shit zoom-out (scene_norm 0.80→1.0)
    if (u_scene_idx == 5) {
        float zoom_t = smoothstep(0.78, 0.98, u_scene_norm);
        // Zoom center trails slightly off-axis to sell the "falling outward" feel
        vec2 zoom_center = vec2(0.5 + 0.04 * sin(u_time * 0.4), 0.5 + 0.03 * cos(u_time * 0.3));
        col = mix(col, radial_zoom_blur(uv, zoom_t, zoom_center), zoom_t * 0.85);

        // 2b-void. Intergalactic void deepening during zoom-out: as the camera retreats
        // into deep space the corners drain of colour — only the universe-particle and
        // the cosmic galaxies remain bright. Gives a sense of vast, empty scale.
        // Deep blue-violet at maximum (peaks at scene_norm 0.88, clears before exit glow).
        float void_t = smoothstep(0.80, 0.92, u_scene_norm)
                     * (1.0 - smoothstep(0.90, 0.96, u_scene_norm));
        if (void_t > 0.001) {
            float r_void = length(ctr * 1.6);
            float edge_mask = smoothstep(0.35, 0.80, r_void);  // 0=centre, 1=corners
            col *= 1.0 - edge_mask * void_t * 0.65;            // darken corners 65% max
            // Add faint deep-space chromatic scatter in the void region
            col += edge_mask * void_t * vec3(0.004, 0.006, 0.018) * 0.9;
        }
    }

    // 2d. Anamorphic lens streaks — Acts III/IV (Scenes 5,6,7): cinematic horizontal streaks
    // from bright light sources. Ramps in at the emotional peak (1:45), peaks through Act IV.
    // Gated out in Scene 6 zoom window (already has radial blur) and logo silence.
    {
        float streak_gate = smoothstep(0.4375, 0.55, demo_norm)
                          * (1.0 - smoothstep(0.95, 1.0, demo_norm));
        // Extra suppression in Scene 6 zoom-out and Scene 7 silence/logo
        if (u_scene_idx == 5) streak_gate *= (1.0 - smoothstep(0.75, 0.90, u_scene_norm));
        if (u_scene_idx == 6) streak_gate *= (1.0 - smoothstep(0.875, 0.93, u_scene_norm));
        if (streak_gate > 0.01) {
            float threshold = mix(0.70, 0.55, (demo_norm - 0.4375) / 0.3125);
            col += anamorphic_streak(uv, streak_gate, threshold);
        }
    }

    // 3. Color grading (demo-wide palette — monotonic, must not reset at act boundaries)
    col = color_grade(col, demo_norm, u_scene_norm);

    // 4. Lens flare on beat (Acts II/III only — infectious/transcendent)
    float flare_gate = smoothstep(0.1875, 0.30, demo_norm) *
                       (1.0 - smoothstep(0.80, 0.90, demo_norm));
    col += lens_flare(uv, kick * flare_gate);

    // 4b. Rain system — Scene 3 (City Corruption): tile-based falling drops.
    // 28 columns × 3 drop phases = 84 independent drops. Each drop: bright head +
    // vertical tail shape (exp falloff above head, sharp cutoff below).
    // Wind drift (AI-stirred atmosphere). Beat-reactive brightness surge.
    // Replaced 12-streak version: proper falling motion + full-screen coverage.
    if (u_scene_idx == 2) {
        float rain_fade = 1.0 - u_scene_norm * u_scene_norm;
        float rain_beat = 1.0 + kick * 0.70;
        float asp_r  = u_res.x / u_res.y;
        // Slow sinusoidal wind: AI electromagnetic field disturbs the rainfall
        float wind   = sin(u_time * 0.52) * 0.012 + sin(u_time * 0.31) * 0.006;
        float cw     = asp_r / 28.0;  // column cell width in ctr-x space

        for (int ri = 0; ri < 28; ri++) {
            float fi    = float(ri);
            // Column centre: evenly spaced across aspect-corrected X, drifting by wind
            float col_x = ((fi + 0.5) / 28.0) * asp_r - asp_r * 0.5 + wind;
            float px    = ctr.x * asp_r;
            float dx    = abs(px - col_x);
            if (dx > cw * 2.2) continue;            // fast-skip distant columns
            float gx    = exp(-dx * dx / (cw * cw * 0.55));  // per-column Gaussian width

            float spd   = 0.85 + hash21(vec2(fi * 7.31, 0.13)) * 2.40;

            // 3 independent drops per column — staggered phases for natural density
            for (int rj = 0; rj < 3; rj++) {
                float fj    = float(rj);
                float ph    = hash21(vec2(fi * 5.43, fj * 3.17 + 0.55));
                // Head Y descends: 0.58 (top margin) → -0.72 (below screen) then wraps
                float fall  = fract(ph + u_time * spd * 0.11);
                float head_y = 0.58 - fall * 1.42;
                float dy    = ctr.y - head_y;
                // Tail above head (dy>0): gentle exp decay → long luminous streak
                // Below head (dy<0): hard cutoff — the raindrop itself is a brief spark
                // tail_len scales with scene_norm: heavier rain as corruption deepens
                float tail_k = 14.0 + u_scene_norm * 10.0;
                float streak = exp(-max( dy, 0.0) * tail_k)
                             * exp(-max(-dy, 0.0) * 100.0);
                float br    = (0.10 + hash21(vec2(fi * 2.13, fj * 0.61)) * 0.22)
                            * rain_fade * rain_beat;
                col += gx * streak * br * vec3(0.14, 0.52, 1.00);
            }
        }

        // Wet megacity street reflections — screen-space mirror of buildings in rain-soaked asphalt.
        // FPV camera at y≈1.5 means street-level occupies the lower screen; pixels below the
        // "street horizon" (ctr.y < HORIZON) mirror the building content above it.
        // Two-frequency rain-ripple distortion. AI electric-blue tint. Fresnel falloff.
        // Beat-driven surface ring (raindrop impact). Dark-mask: only active where street is
        // dark (asphalt between buildings), not on lit building faces.
        {
            const float HORIZON = -0.15;    // screen-space horizon for reflections
            float below_h = smoothstep(HORIZON + 0.02, HORIZON - 0.02, ctr.y);
            if (below_h > 0.001) {
                float depth = clamp((HORIZON - ctr.y) / 0.38, 0.0, 1.0);

                // Rain-ripple distortion: two coprime sinusoids + beat-surge wave
                float rw1   = sin(ctr.x * 28.0 + u_time * 2.3) * 0.009;
                float rw2   = sin(ctr.x * 13.5 - u_time * 1.7 + ctr.y * 22.0) * 0.005;
                float bwave = exp(-u_beat * 4.5) * sin(ctr.x * 18.0 + u_time * 3.1) * 0.022;
                float rdist = rw1 + rw2 + bwave;

                // Reflected UV: mirror vertically across the street horizon
                vec2 refl_uv = vec2(
                    uv.x + rdist,
                    (0.5 + HORIZON) - (ctr.y - HORIZON)
                );
                refl_uv = clamp(refl_uv, 0.001, 0.999);
                vec3 refl_samp = texture(u_scene, refl_uv).rgb;

                // Electric-blue AI tint: the charged rainwater catches the signal
                refl_samp = refl_samp * vec3(0.32, 0.60, 1.05) * (0.7 + u_scene_norm * 0.55);

                // Fresnel: near-perfect at horizon (grazing angle), vanishes at screen bottom
                float fresnel = pow(1.0 - depth, 1.8) * 0.70;

                // Dark asphalt base — wet black tarmac between buildings
                vec3 asphalt = vec3(0.007, 0.012, 0.022);
                // Per-beat radial ripple ring on puddle surface (raindrop impact)
                float bq   = exp(-u_beat * 3.2);
                float br_r = length(vec2(ctr.x * (u_res.x/u_res.y), ctr.y - HORIZON));
                float bpud = bq * smoothstep(0.022, 0.0, abs(br_r - u_beat * 0.50));
                asphalt += bpud * vec3(0.04, 0.16, 0.42) * below_h;

                // Gate: reflections appear as the scene builds; fade with rain_fade
                float ref_gate = smoothstep(0.04, 0.22, u_scene_norm) * rain_fade;

                // Only blend onto dark pixels (streets/gaps), not lit building surfaces
                float slum = dot(col, vec3(0.2126, 0.7152, 0.0722));
                float dark_mask = smoothstep(0.20, 0.05, slum);

                vec3 wet_col = mix(asphalt, refl_samp, fresnel);
                col = mix(col, wet_col, dark_mask * ref_gate * below_h * 0.88);
            }
        }

        // Stormy megacity sky — FBM clouds + AI-corruption horizon glow.
        // Only affects dark sky areas between/above buildings (luminance gate).
        // Uses bilinear smooth value noise (2 octaves) for cloud structures.
        float scene_lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        float sky_mask  = smoothstep(0.12, 0.03, scene_lum);
        if (sky_mask > 0.001) {
            // Smooth 2D value noise: bilinear interpolation of hash lattice
            vec2  cp0 = ctr * vec2(1.8, 2.2) + vec2(u_time * 0.022, u_time * 0.009);
            vec2  cp1 = ctr * vec2(3.7, 4.5) + vec2(-u_time * 0.038, u_time * 0.017);
            // Octave 0
            vec2 i0 = floor(cp0), f0 = fract(cp0); f0 = f0*f0*(3.0-2.0*f0);
            float c00 = hash21(i0), c10 = hash21(i0+vec2(1,0));
            float c01 = hash21(i0+vec2(0,1)), c11 = hash21(i0+vec2(1,1));
            float n0  = mix(mix(c00,c10,f0.x), mix(c01,c11,f0.x), f0.y);
            // Octave 1 (finer detail)
            vec2 i1 = floor(cp1), f1 = fract(cp1); f1 = f1*f1*(3.0-2.0*f1);
            float d00 = hash21(i1), d10 = hash21(i1+vec2(1,0));
            float d01 = hash21(i1+vec2(0,1)), d11 = hash21(i1+vec2(1,1));
            float n1  = mix(mix(d00,d10,f1.x), mix(d01,d11,f1.x), f1.y);
            float cloud_n = n0 * 0.65 + n1 * 0.35;  // 2-octave cloud density

            float sky_h  = smoothstep(0.28, 0.78, uv.y);   // upper sky zone
            float horz_h = smoothstep(0.56, 0.28, uv.y);   // horizon glow zone

            // Dark storm cloud layer: visible blue-grey FBM structures
            float storm = sky_h * (0.35 + cloud_n * 0.65);
            col += sky_mask * storm
                 * vec3(0.010, 0.016, 0.055)
                 * (2.0 + u_scene_norm * 1.2);

            // AI-corruption horizon glow: electric-blue energy rising from city grid.
            // Grows with u_scene_norm as the AI takeover intensifies.
            float ai_glow = horz_h * (0.45 + cloud_n * 0.55) * u_scene_norm;
            col += sky_mask * ai_glow
                 * vec3(0.014, 0.038, 0.120)
                 * (0.9 + kick * 1.4);

            // Thin horizontal AI energy band just above the building skyline
            float energy_band = exp(-abs(ctr.y + 0.10) * 22.0);
            col += sky_mask * energy_band * (0.4 + cloud_n * 0.6) * u_scene_norm
                 * vec3(0.012, 0.055, 0.145) * (1.0 + kick * 3.0);

            // Cloud-lightning illumination: FBM-modulated, dramatically brighter.
            // Per-flash seed changes ~2× per second for unique cloud illumination.
            float flash_id  = hash11(floor(u_time * 2.1 + 0.5));
            float sky_flash = kick * kick * sky_mask * (0.50 + flash_id * 0.50);
            col += sky_flash * storm * (0.55 + u_scene_norm * 0.45)
                 * vec3(0.28, 0.48, 0.88);
        }
    }

    // 4b-sky. AI Intelligence Orb — Scene 3 (City Corruption): the awakened mind made visible.
    // A slowly drifting geometric sphere hangs in the storm sky as the AI takes over the city.
    // Appears scene_norm 0.30→0.82: from early corruption through the power-grid peak.
    // Concentric expanding rings + directional energy beam aimed at the grid below.
    // Beat-reactive core-pulse. Only drawn in dark sky pixels (above/between buildings).
    // The orb is the AI's physical avatar — its presence causes the corruption below.
    if (u_scene_idx == 2) {
        float orb_gate = smoothstep(0.30, 0.52, u_scene_norm)
                       * (1.0 - smoothstep(0.76, 0.86, u_scene_norm));
        if (orb_gate > 0.001) {
            float asp_o = u_res.x / u_res.y;
            // Slow sinusoidal drift across the sky: orb "patrols" the city
            vec2 orb_pos = vec2(sin(u_time * 0.045) * 0.30, 0.25 + sin(u_time * 0.031) * 0.04);
            vec2 od      = vec2((ctr.x - orb_pos.x) * asp_o, ctr.y - orb_pos.y);
            float or_r   = length(od);

            // Central glow core — bright nucleus marking the AI singularity
            float core = exp(-or_r * or_r * 70.0) * 3.2;

            // Two expanding concentric rings, animating outward at different rates
            float rp1  = fract(u_time * 0.14) * 0.28;
            float rp2  = fract(u_time * 0.14 + 0.55) * 0.28;
            float ring1 = exp(-pow(or_r - rp1, 2.0) * 520.0) * 0.9;
            float ring2 = exp(-pow(or_r - rp2, 2.0) * 520.0) * 0.5;

            // Outer atmospheric halo: faint blue-violet aura
            float halo = exp(-or_r * or_r * 10.0) * 0.28;

            // Directional beam: vertical column of AI energy projected onto the city grid.
            // Scanned sinusoidally to create a "searching" sweep across building tops.
            float bx     = (ctr.x - orb_pos.x) * asp_o;
            float bw     = 0.014 + u_scene_norm * 0.010;
            float beam_h = smoothstep(orb_pos.y + 0.01, orb_pos.y - 0.62, ctr.y);
            float beam   = exp(-bx * bx / (bw * bw))
                         * beam_h
                         * (0.40 + 0.60 * abs(sin(ctr.y * 22.0 - u_time * 5.0 + 1.2)));

            // Beat surge: orb flares bright on each 133 BPM kick
            float b_surge = 1.0 + kick * 2.2;

            float total = (core + ring1 + ring2) * b_surge + halo;
            vec3  orb_col = total * vec3(0.10, 0.48, 1.00) * orb_gate
                          + beam  * 0.50 * vec3(0.06, 0.32, 0.85) * u_scene_norm * orb_gate;

            // Gate: only add to dark sky pixels — never overwrite lit building surfaces
            float olum  = dot(col, vec3(0.2126, 0.7152, 0.0722));
            float sky_g = smoothstep(0.14, 0.03, olum);
            col += orb_col * sky_g;
        }
    }

    // 4b-ext. Electric lightning arcs — Scene 3 (City Corruption): AI overwhelms the
    // power grid. Fractal bolts strike on ~45% of beats, fading in under 0.1s.
    // Two simultaneous bolts from top-screen to random impact points in the lower half;
    // positions reseed every 2 beats so each lightning strike looks distinct.
    if (u_scene_idx == 2) {
        float asp    = u_res.x / u_res.y;
        vec2 uv_asp  = vec2(ctr.x * asp, ctr.y);
        // beat_id: integer beat index (4 beats per bar)
        float beat_id  = floor(u_bar * 4.0);
        // Gate: ~45% of beats trigger; uses per-beat hash so each beat independently decides
        float gate     = step(0.56, hash21(vec2(beat_id * 0.1337, 29.3)));
        float l_str    = gate * kick * kick * u_scene_norm;
        if (l_str > 0.004) {
            // Bolt seed changes every 2 beats so bolt positions stay constant for ~0.9s
            float bseed = floor(beat_id * 0.5) * 0.1333 + 37.77;
            for (int bi = 0; bi < 2; bi++) {
                float fi   = float(bi);
                // Top: near y=+0.55 (top edge in ctr space), random x
                float sx   = (hash21(vec2(bseed + fi * 0.71, 1.1)) * 2.0 - 1.0) * asp * 0.65;
                // Bottom: somewhere in lower portion of screen with random x drift
                float ex   = sx + (hash21(vec2(bseed + fi * 1.33, 2.2)) - 0.5) * asp * 0.50;
                float ey   = -0.20 - hash21(vec2(bseed + fi * 2.07, 3.3)) * 0.35;
                float bv   = lightning_bolt(uv_asp,
                                 vec2(sx,  0.52),
                                 vec2(ex,  ey),
                                 bseed + fi * 7.13);
                // White-hot bolt core; electric-blue halo (matches city color palette)
                col += bv * l_str * vec3(0.88, 0.94, 1.00) * 3.2;
                col += bv * l_str * kick * vec3(0.10, 0.52, 1.00) * 2.0;
            }
        }
    }

    // 4c-art. Light arteries — Scene 3 (City Corruption): AI infection spreading as a
    // glowing circuit-trace grid emanating outward from the city centre.
    // Regular screen-space grid (city block cadence) with a expanding infection wavefront
    // driven by scene_norm.  Grid intersections ("junctions") are extra bright — like power
    // nodes where the AI concentrates its routing.  Electric-blue, beat-reactive.
    // Active from first signs of corruption (0.12) through city dissolution (0.84).
    if (u_scene_idx == 2) {
        float art_gate = smoothstep(0.12, 0.32, u_scene_norm)
                       * (1.0 - smoothstep(0.70, 0.84, u_scene_norm));
        if (art_gate > 0.001) {
            float asp_a = u_res.x / u_res.y;
            vec2  ug    = vec2(ctr.x * asp_a, ctr.y);

            // Infection wavefront: radius grows from 0 to 1.7 (beyond screen corners)
            float spread  = smoothstep(0.12, 0.82, u_scene_norm);
            const float CS = 0.14;  // grid cell size

            vec2  cid  = floor(ug / CS);        // integer cell index
            vec2  cfr  = fract(ug / CS);        // fractional within cell
            float gx   = min(cfr.x, 1.0 - cfr.x);  // 0 at vertical grid lines
            float gy   = min(cfr.y, 1.0 - cfr.y);  // 0 at horizontal grid lines

            // Per-cell random offset: some cells activate slightly before/after front
            float ch     = hash21(cid * vec2(13.1, 47.7));
            // Cell activation: wavefront arrives when spread radius > cell distance
            float c_dist = length((cid + 0.5) * CS);   // dist from screen centre
            float lit    = smoothstep(spread * 1.65 + ch * 0.10,
                                      spread * 1.65 - CS * 2.0,
                                      c_dist);

            const float LW = 0.009;  // line half-width
            float gline  = smoothstep(LW, 0.0, min(gx, gy)) * lit;

            // Junction nodes: cross-point of horizontal + vertical lines — bright dots
            float junc   = smoothstep(LW * 2.8, 0.0, gx)
                         * smoothstep(LW * 2.8, 0.0, gy) * lit;

            // Beat surge: arteries pulse electric-bright on each 133 BPM kick
            float beat_b = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.85;

            col += (gline * 0.38 + junc * 0.65) * beat_b * art_gate
                 * vec3(0.04, 0.34, 1.00);
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

    // 4e. Fractal bloom beat pulse — Scene 5 (Geometry Bloom): dual ring on each kick.
    // Two concentric expanding rings — outer violet + inner cyan — on every 133 BPM beat.
    // Gated off during entry burst (0→0.05) and exit ascension (0.82→1.0).
    // Double-ring gives a "kaleidoscope heartbeat" matching the fold-snap in the scene shader:
    // outer violet = organic petal resonance, inner cyan = crystal refraction pulse.
    if (u_scene_idx == 4) {
        float bloom_gate = smoothstep(0.05, 0.20, u_scene_norm)
                         * (1.0 - smoothstep(0.82, 0.90, u_scene_norm));
        if (bloom_gate > 0.01) {
            float or_r  = u_beat * 1.65;
            float or_d  = abs(length(ctr * 2.1) - or_r);
            float outer = exp(-u_beat * 4.8) * smoothstep(0.022, 0.0, or_d);
            col += outer * bloom_gate * vec3(0.60, 0.10, 0.98) * 1.5;
            float ir_r  = u_beat * 1.00;
            float ir_d  = abs(length(ctr * 2.1) - ir_r);
            float inner = exp(-u_beat * 6.5) * smoothstep(0.015, 0.0, ir_d);
            col += inner * bloom_gate * vec3(0.12, 0.70, 0.98) * 0.90;
        }
    }

    // 4h. Monolith beat-pulse ring — Scene 2 (Awakening Core): energy radiates outward.
    // As the monolith charges between entry (0:18) and opening (0:45), each 133 BPM kick
    // fires an expanding ring from the monolith centre (UV 0.5, 0.55 — slightly above screen mid).
    // Primary cold-blue ring + echo ring: "gravitational pulse from the awakening core".
    // Paired with the gravitational lensing field (0c2) — lensing bends space, ring shows the beat.
    // Gated clear of entry flash (0→0.08) and exit shockwave (0.82+) to avoid compounding.
    if (u_scene_idx == 1) {
        float ring_gate = smoothstep(0.08, 0.25, u_scene_norm)
                        * (1.0 - smoothstep(0.75, 0.86, u_scene_norm));
        if (ring_gate > 0.01) {
            // Monolith sits slightly above screen centre — ring emanates from there
            vec2 mono_ctr = ctr - vec2(0.0, 0.05);
            float mr = length(mono_ctr * 2.0);
            // Primary ring: expands at 1.2× u_beat radius (deliberate, ponderous mass)
            float pr_d   = abs(mr - u_beat * 1.20);
            float pring  = exp(-u_beat * 5.5) * smoothstep(0.020, 0.0, pr_d);
            col += pring * ring_gate * vec3(0.22, 0.52, 1.00) * 1.10;
            // Echo ring: trails behind, slightly narrower — lingering harmonic resonance
            float er_d   = abs(mr - u_beat * 0.68);
            float ering  = exp(-u_beat * 7.0) * smoothstep(0.014, 0.0, er_d);
            col += ering * ring_gate * vec3(0.15, 0.40, 0.90) * 0.65;
        }
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

    // 4f. Screen-space god rays — Scene 2 (Awakening Core): light shafts from the monolith crack.
    // As the monolith opens (scene_norm 0.60→1.0), luminous matter erupts from the vertical crack.
    // We sample the rendered frame radially from the crack origin to accumulate scattered light —
    // classic screen-space crepuscular rays that sell the "impossible opening" moment of Act I.
    // 16 samples: balanced quality vs. cost; decay=0.93 for warm trailing shaft length.
    if (u_scene_idx == 1) {
        float shaft_t = smoothstep(0.60, 0.82, u_scene_norm);
        float shaft_peak = smoothstep(0.82, 1.00, u_scene_norm);
        float shaft_str = shaft_t + shaft_peak * 0.5;   // builds then holds strong at opening
        if (shaft_str > 0.01) {
            // Light source: top-centre of screen where the crack emerges (aspect-adjusted)
            vec2 light_uv = vec2(0.5, 0.72);
            vec2 delta    = (uv - light_uv) / 16.0 * 0.70;
            vec2 cur      = uv;
            float ill = 0.0, decay_acc = 1.0;
            for (int s = 0; s < 16; s++) {
                cur  -= delta;
                vec3  sc   = texture(u_scene, clamp(cur, 0.001, 0.999)).rgb;
                float lum  = dot(sc, vec3(0.2126, 0.7152, 0.0722));
                ill  += lum * decay_acc;
                decay_acc *= 0.93;
            }
            col += ill * shaft_str * 0.028 * vec3(0.40, 0.70, 1.00);
        }
    }

    // 4g. Logo god rays — Scene 7 (Transcendence): sacred light from SG monogram.
    // After the silence black-out (scene_norm 0.895+) the logo materialises and
    // begins to glow; we march outward from the logo centre accumulating scattered
    // luminance — the same screen-space crepuscular technique as Scene 2's monolith
    // shafts, deliberately bookending Act I opening with Act IV finalé. The rays
    // peak as the SG mark is fully lit, then hold through the credit sequence.
    // 12 samples, decay=0.91 (slightly softer than scene 2's 0.93).
    // Warm blue-white (0.45,0.68,1.0) matches logo colour palette.
    // Gated off after scene_norm 0.980 so they don't compete with the year stamp.
    if (u_scene_idx == 6) {
        float logo_ray_t = smoothstep(0.895, 0.935, u_scene_norm)
                         * (1.0 - smoothstep(0.970, 0.985, u_scene_norm));
        if (logo_ray_t > 0.01) {
            vec2 light_uv = vec2(0.5, 0.56);   // SG monogram centre (slight above screen midpoint)
            vec2 delta    = (uv - light_uv) / 12.0 * 0.65;
            vec2 cur      = uv;
            float ill = 0.0, decay_acc = 1.0;
            for (int s = 0; s < 12; s++) {
                cur  -= delta;
                vec3  sc   = texture(u_scene, clamp(cur, 0.001, 0.999)).rgb;
                float lum  = dot(sc, vec3(0.2126, 0.7152, 0.0722));
                ill  += lum * decay_acc;
                decay_acc *= 0.91;
            }
            col += ill * logo_ray_t * 0.022 * vec3(0.45, 0.68, 1.00);
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
    float vig_pulse = kick * 0.6 * smoothstep(0.1875, 0.75, demo_norm) * (0.4 + u_rms * 0.6);
    float vig = 1.0 - dot(ctr * 1.5, ctr * 1.5);
    vig = clamp(pow(clamp(vig, 0.0, 1.0), vig_str + vig_pulse), 0.0, 1.0);
    col *= vig;

    // 8. Beat-sync white flash (strong beats in Acts II/III; audio-reactive)
    // u_rms scales the flash: quiet passages barely flash, loud beats punch hard.
    float flash_str = smoothstep(0.1875, 0.75, demo_norm) * (0.5 + u_rms * 0.5);
    col += exp(-u_beat * 20.0) * flash_str * 0.08;

    // 8b. Scene 7 "big-bang" entry flash: universe-particle explodes at Act III→IV cut.
    // A brief white burst (peak at scene_norm≈0.008, gone by 0.06) with warm blue tint
    // marks the exact frame we transition from the cosmic zoom-out to the garden of light.
    if (u_scene_idx == 6) {
        float bang_flash = exp(-u_scene_norm * 120.0);   // peak at t=0, half-life ~0.5 frames
        col += bang_flash * vec3(0.55, 0.72, 1.0) * 3.5;
    }

    // 8c. Scene 6 entry chromatic explosion: brief R/B prismatic burst (adds to UV ripple).
    if (u_scene_idx == 5) {
        float entry_burst = exp(-u_scene_norm * 60.0);   // ~1s burst
        col += entry_burst * vec3(0.28, 0.45, 1.0) * 1.6;
    }

    // 4i. Scene 1 beat-pulse ring — neural grid activation pulse.
    // Faint cold-blue expanding ring on every 133 BPM kick during the boot body
    // (scene_norm 0.05→0.80, clear of exit lock-on at 0.84).
    // Reads as "data signal propagating through neural filament lattice" —
    // minimal to match Act I reserved palette, but makes boot feel alive.
    // Completes beat-ring coverage: all 7 scenes now have a dedicated body beat ring.
    if (u_scene_idx == 0) {
        float s1_body = smoothstep(0.05, 0.12, u_scene_norm) * smoothstep(0.80, 0.72, u_scene_norm);
        if (s1_body > 0.001) {
            float r_s1   = length(ctr * 2.0);
            float kick_s1 = exp(-u_beat * 8.0);
            // Primary ring: expands outward on kick
            float ring_s1 = smoothstep(0.06, 0.0, abs(r_s1 - u_beat * 1.40)) * kick_s1;
            col += ring_s1 * s1_body * vec3(0.35, 0.62, 1.00) * 0.80;
            // Echo ring: tighter decay, shorter radius — trailing signal echo
            float ring_s1b = smoothstep(0.08, 0.0, abs(r_s1 - u_beat * 0.85)) * exp(-u_beat * 12.0);
            col += ring_s1b * s1_body * vec3(0.20, 0.45, 0.90) * 0.45;
        }
    }

    // 4j. Impossible-space portal heartbeat ring — Scene 6 body (0.12→0.68).
    // A violet/teal expanding ring fires from screen centre on each 133 BPM kick.
    // Distinct from section 1d chromatic fold: that warps UV; this is a visible
    // spatial ring in post-space — the portals exert tangible spacetime pressure.
    // Dual-ring: outer violet (centre portal freq) + inner teal (wall portal resonance).
    // Gate clears the entry-ripple window (0→0.12) and the zoom-out window (0.70+).
    if (u_scene_idx == 5) {
        float portal_gate = smoothstep(0.12, 0.26, u_scene_norm)
                          * (1.0 - smoothstep(0.62, 0.70, u_scene_norm));
        if (portal_gate > 0.01) {
            float pr    = length(ctr * 2.0);
            // Primary ring: ponderous expansion — impossible-space feels heavy
            float p_d   = abs(pr - u_beat * 1.10);
            float pring = exp(-u_beat * 4.2) * smoothstep(0.022, 0.0, p_d);
            col += pring * portal_gate * vec3(0.55, 0.10, 0.95) * 1.20;
            // Echo ring: teal — portal system resonance at shorter radius
            float e_d   = abs(pr - u_beat * 0.65);
            float ering = exp(-u_beat * 6.0) * smoothstep(0.015, 0.0, e_d);
            col += ering * portal_gate * vec3(0.05, 0.75, 0.80) * 0.70;
        }
    }

    // 4k. Time-fracture temporal pressure ring — Scene 4 body (0.10→0.82).
    // Post-space ice-blue ring on each kick, layered above the scene-shader shockwave.
    // The scene-3D ring lives in frozen-shard world-space; this one is a screen-space
    // overlay — temporal pressure made visible on the display surface itself.
    // Fast expansion + high decay: temporal shockwaves are kinetic, not ponderous.
    // Gate clears entry row-tear (0→0.09) and exit UV-twist (0.82+).
    if (u_scene_idx == 3) {
        float time_gate = smoothstep(0.10, 0.22, u_scene_norm)
                        * (1.0 - smoothstep(0.78, 0.86, u_scene_norm));
        if (time_gate > 0.01) {
            float tr    = length(ctr * 2.2);
            // Primary ring: faster expansion than monolith — temporal kinetics
            float p_d   = abs(tr - u_beat * 1.80);
            float tring = exp(-u_beat * 5.5) * smoothstep(0.016, 0.0, p_d);
            col += tring * time_gate * vec3(0.45, 0.78, 1.00) * 1.00;
            // Echo: secondary freeze-rebound at shorter radius
            float e_d   = abs(tr - u_beat * 0.90);
            float ering = exp(-u_beat * 7.5) * smoothstep(0.011, 0.0, e_d);
            col += ering * time_gate * vec3(0.28, 0.58, 0.90) * 0.55;
        }
    }

    // 4n. Relativistic jet post-glow — Scene 4 body (0.35→0.82).
    // Soft vertical light column in screen-space amplifies the 3D jet beams in the scene
    // shader. Two polar plumes extend from the BH screen position (near ctr origin) up
    // and down; core white-blue → outer cyan, beat-surge on 133 BPM kicks.
    // Gate clear of entry row-tear (0→0.10) and exit UV-twist (0.82+).
    if (u_scene_idx == 3) {
        float jg = smoothstep(0.35, 0.55, u_scene_norm)
                 * (1.0 - smoothstep(0.76, 0.86, u_scene_norm));
        if (jg > 0.01) {
            // Horizontal Gaussian: narrow column centred at BH (ctr.x ≈ 0)
            float jet_w  = 0.038;
            float h_gaus = exp(-(ctr.x * ctr.x) / (jet_w * jet_w));
            // Vertical profile: dense near BH, fade to screen edge
            float v_prof = exp(-abs(ctr.y) * 1.80);
            // Beat surge
            float pulse  = 1.0 + exp(-u_beat * 4.5) * 1.10;
            // White-blue core (near BH), cyan outer (high latitude)
            vec3  jcol   = mix(vec3(0.90, 0.92, 1.00), vec3(0.12, 0.62, 1.00),
                               smoothstep(0.0, 0.45, abs(ctr.y)));
            col += jcol * h_gaus * v_prof * pulse * jg * 0.22;
        }
    }

    // 4o. Einstein ring — Scene 4 (Time Fracture, singularity body 0.45→0.80).
    // When background temporal-energy sources align with the Kerr black hole from
    // the camera's perspective, gravitational lensing focuses them into a complete
    // ring of light at the photon sphere radius. Occurs occasionally — every ~8s as
    // the orbiting camera sweeps through near-alignment — mimicking real lensing events.
    // Chromatic: R/G/B peaks at slightly different radii (wavelength-dependent deflection).
    // Beat-reactive: ring surges on each 133 BPM kick at peak alignment.
    if (u_scene_idx == 3) {
        float eg = smoothstep(0.45, 0.62, u_scene_norm)
                 * (1.0 - smoothstep(0.74, 0.82, u_scene_norm));
        if (eg > 0.01) {
            // BH projects slightly below centre (camera looks down at slight angle).
            // Aspect-correct the distance so the ring appears circular on screen.
            vec2 bh_c  = vec2(0.0, -0.08);
            float asp  = u_res.x / u_res.y;
            vec2  d_bh = vec2((ctr.x - bh_c.x) * asp, ctr.y - bh_c.y);
            float r_bh = length(d_bh);

            // Near-alignment pulse: slow sine with sharp exponent gives rare bright peaks.
            // sin period ~8.3s → ~3 full alignment events during the 30s scene window.
            float align_t  = pow(max(sin(u_time * 0.76 + 0.80), 0.0), 7.0);
            // Beat boost: ring brightens on each 133 BPM kick
            align_t *= 1.0 + exp(-u_beat * 6.0) * 0.55;
            float ering_str = align_t * eg;

            if (ering_str > 0.001) {
                // Chromatic Einstein ring radii: shorter wavelengths (blue) deflect more →
                // orbit closer; longer wavelengths (red) orbit wider — visible spectral split.
                const float r_E = 0.335;          // green photon sphere (mid wavelength)
                float w_ring    = 0.011;          // ring width (tight Gaussian)
                float ring_R = exp(-pow((r_bh - r_E * 1.040) / w_ring, 2.0));
                float ring_G = exp(-pow((r_bh - r_E         ) / w_ring, 2.0));
                float ring_B = exp(-pow((r_bh - r_E * 0.962) / w_ring, 2.0));
                // Compose into chromatic arc: full ring shows white with chromatic fringe
                col.r += ring_R * ering_str * 1.05;
                col.g += ring_G * ering_str * 0.92;
                col.b += ring_B * ering_str * 1.18;

                // Inner halo: scattered light inside the ring (source partially resolved)
                float halo_in = smoothstep(r_E * 1.04, 0.0, r_bh) * 0.08;
                col += vec3(0.30, 0.52, 1.00) * halo_in * ering_str;

                // Outer scatter: some photons deflected to wide angles (Airy-disk-like)
                float outer = exp(-pow((r_bh - r_E * 1.22) / 0.035, 2.0)) * 0.28;
                col += vec3(0.50, 0.68, 1.00) * outer * ering_str;
            }
        }
    }

    // 4m. City corruption AI power-grid beat ring — Scene 3 body (0.12→0.78).
    // Each 133 BPM kick propagates an electric-blue wavefront outward through
    // the corrupted city grid — "the AI cycling power through the urban network"
    // on beat. Primary ring: fast AI pulse. Echo ring: grid resonance bounce-back.
    // Color evolves electric-blue → cyan-white as corruption deepens with scene_norm.
    // Gate clears city materialisation entry (0→0.10) and city data-death (0.80+).
    if (u_scene_idx == 2) {
        float city_ring_gate = smoothstep(0.12, 0.26, u_scene_norm)
                             * (1.0 - smoothstep(0.72, 0.82, u_scene_norm));
        if (city_ring_gate > 0.01) {
            float cr    = length(ctr * 2.0);
            // Color arc: electric blue early → cyan-white at full corruption
            vec3 ring_col = mix(vec3(0.10, 0.48, 1.00), vec3(0.18, 0.80, 1.00),
                                u_scene_norm);
            // Primary ring: rapid AI power pulse — faster than monolith (kinetic city energy)
            float p_d   = abs(cr - u_beat * 1.58);
            float pring = exp(-u_beat * 5.2) * smoothstep(0.018, 0.0, p_d);
            col += pring * city_ring_gate * ring_col * 1.40;
            // Echo ring: secondary grid-return resonance at shorter radius
            float e_d   = abs(cr - u_beat * 0.88);
            float ering = exp(-u_beat * 7.5) * smoothstep(0.012, 0.0, e_d);
            col += ering * city_ring_gate * ring_col * 0.62;
        }
    }

    // 8i. Scene 1 exit — Boot sequence lock-on surge (scene_norm 0.84→1.0).
    // The boot progress ring completes its sweep; right before the 0:18 first kick
    // the system "acquires signal" — a sharp horizontal scan-sweep white-out and brief
    // CRT vertical-sync pulse sell the machine achieving consciousness before Scene 2
    // cuts in. Palette: pure white + faint cold-blue tint (Act I minimal).
    if (u_scene_idx == 0) {
        float lock_t = smoothstep(0.84, 1.0, u_scene_norm);
        if (lock_t > 0.001) {
            // Global brightness surge: CRT screen-flood as signal locks
            col += lock_t * lock_t * vec3(0.88, 0.93, 1.0) * 2.4;
            // Horizontal sync-sweep: a single bright scan line that drags from top to
            // bottom during the lock window — classic CRT V-sync tearing read
            float sweep_y = 1.0 - lock_t;                   // descends 1→0 (top to bottom)
            float scan_dist = abs(uv.y - sweep_y);
            float scan_line = exp(-scan_dist * 380.0) * lock_t;
            col += scan_line * vec3(0.70, 0.85, 1.0) * 3.2;
            // Trailing afterglow: brightens the band the scan line has already passed (above)
            float trail = smoothstep(0.025, 0.0, sweep_y - uv.y) * lock_t * 0.5;
            col += trail * vec3(0.60, 0.78, 1.0) * 0.9;
        }
    }

    // 8g. Scene 2 entry — Awakening Core first kick at 0:18.
    // The first beat of the whole demo. A cold-white monolith flash as the giant
    // structure sparks into existence from the black void. Colder than scene 3
    // (this is Act I — minimal palette), half-life ~0.6s. Paired with an outward
    // ring echoing the scene 1 boot ring completing its sweep.
    if (u_scene_idx == 1) {
        float mono_flash = exp(-u_scene_norm * 100.0);
        col += mono_flash * vec3(0.65, 0.80, 1.00) * 2.8;
        // Expanding ring: monolith materialising outward from a point
        float r_mono = length(ctr * 2.0);
        float ring_mono = exp(-u_scene_norm * 70.0) * smoothstep(0.05, 0.0, abs(r_mono - u_scene_norm * 2.2));
        col += ring_mono * vec3(0.40, 0.65, 1.00) * 2.0;
    }

    // 8e. Scene 3 entry — city materialisation flash at 0:45 bass drop.
    // Electric-blue/cyan burst as Act II begins and the megacity snaps into existence.
    // Peaks at frame 0, half-life ~0.7s, gone by ~2s.
    if (u_scene_idx == 2) {
        float city_flash = exp(-u_scene_norm * 90.0);
        col += city_flash * vec3(0.15, 0.65, 1.0) * 2.2;
        // Concentric ring: city grid radiating outward
        float r_city = length(ctr * 2.0);
        float ring_city = exp(-u_scene_norm * 60.0) * smoothstep(0.05, 0.0, abs(r_city - u_scene_norm * 2.0));
        col += ring_city * vec3(0.10, 0.90, 1.0) * 1.8;
    }

    // 8f. Scene 4 entry — temporal rupture flash at 1:15.
    // Cold blue-white "freeze" burst as time shatters at the Act II midpoint.
    // Colder than scene 3 (more ice-blue), half-life ~0.8s.
    if (u_scene_idx == 3) {
        float frac_flash = exp(-u_scene_norm * 80.0);
        col += frac_flash * vec3(0.50, 0.78, 1.0) * 2.8;
    }

    // 8h. Scene 3 exit flash — electric-blue system-death overload at city data collapse.
    // Grows quadratically toward 1:15 cut: city's light burns out in a pure electric surge.
    if (u_scene_idx == 2) {
        float death_f = smoothstep(0.82, 0.98, u_scene_norm);
        col += death_f * death_f * vec3(0.12, 0.55, 1.0) * 1.8;
    }

    // 8d. Scene 5 entry — geometry bloom burst: magenta/violet flash at Act III emotional peak.
    // The 1:45 mark is the demo's emotional apex; this burst sells the "reality flowers open"
    // moment as fractal geometry crystallises from the ruins of Scene 4's time fracture.
    // Peaks at scene_norm≈0 (frame 0 of scene 5), half-life ~0.5s, gone by ~2s.
    if (u_scene_idx == 4) {
        float bloom_burst = exp(-u_scene_norm * 75.0);
        col += bloom_burst * vec3(0.62, 0.18, 1.0) * 3.0;
        // Secondary cyan ring — geometry emerging outward from centre
        float r_burst = length(ctr * 2.0);
        float ring_burst = exp(-u_scene_norm * 50.0) * smoothstep(0.06, 0.0, abs(r_burst - u_scene_norm * 2.5));
        col += ring_burst * vec3(0.10, 0.80, 1.0) * 2.5;

        // Exit surge: fractal geometry transcends — violet brightening bell-curves around 90%.
        // As the UV spiral tightens the field, chromatic edge dissolution signals portal tear.
        float asc_t   = smoothstep(0.82, 0.98, u_scene_norm);
        float asc_bell = asc_t * (1.0 - asc_t) * 4.0;   // bell curve peaks at ~scene_norm 0.90
        col += asc_bell * vec3(0.42, 0.10, 0.95) * 2.0;
        // Chromatic edge dissolution: screen periphery blooms cyan/violet as portal tears
        float e_r   = length(ctr * 1.8);
        float e_glow = asc_t * exp(-e_r * e_r * 2.0) * (1.0 - exp(-e_r * 3.2));
        col += e_glow * vec3(0.22, 0.05, 0.80) * 2.8;
    }

    // 8k. Scene 4 exit — temporal overload collapse: spacetime fails before Act III ignites.
    // The UV twist (0a2-exit) peaks and snaps. A cold-white brightness surge sells the
    // "last freeze" of time before the warm magenta of Scene 5 explodes outward.
    // Quadratic ramp peaking at scene_norm 0.97 so it peaks just before the Act II→III cut.
    if (u_scene_idx == 3) {
        float collapse = smoothstep(0.88, 0.99, u_scene_norm);
        if (collapse > 0.001) {
            // Desaturated cold burst — Act II palette, not warm; Scene 5's magenta owns the warmth
            col += collapse * collapse * vec3(0.62, 0.80, 1.00) * 1.6;
            // Thin screen-edge corona: temporal pressure visible at frame boundary
            float edge = 1.0 - smoothstep(0.30, 0.50, min(length(ctr * 2.0), 1.0));
            col += edge * collapse * vec3(0.45, 0.65, 1.00) * 1.2;
        }
    }

    // 8j. Scene 6 exit — singularity implosion glow: universe-particle crosses event horizon.
    // Glowing core at screen centre grows as UV contracts (pre-sampling block above).
    // White-blue surge at scene_norm 1.0 pairs with Scene 7 big-bang burst for the
    // inhale→exhale transition: the universe collapses, then explodes into Act IV.
    if (u_scene_idx == 5) {
        float sing_t = smoothstep(0.875, 1.0, u_scene_norm);
        if (sing_t > 0.001) {
            float r_sing = length(ctr * 2.2);
            float core   = sing_t * exp(-r_sing * r_sing * 5.5);
            col += core * vec3(0.60, 0.78, 1.0) * 5.5 * sing_t;
            col += sing_t * sing_t * sing_t * vec3(0.75, 0.88, 1.0) * 3.0;
        }
    }

    // 4l. Gravitational wave cascade — Scene 6 holy-shit reveal (scene_norm ≥ 0.795).
    // The universe-particle's revelation as a gravitating mass sends spacetime ripples
    // outward through the cosmic background — LIGO-style expanding ring system.
    // Unlike periodic beat rings (section 4j), these fire ONCE from the particle position
    // at UV (0.3, 0.2) → ctr (-0.20, -0.30) and expand slowly over ~6 seconds.
    // 3 rings with gravitational redshift colors: inner blue-white → outer red-shifted.
    if (u_scene_idx == 5) {
        float gw_t = max(0.0, u_scene_norm - 0.795);
        if (gw_t < 0.20) {
            float norm_t  = gw_t / 0.20;
            vec2  pp      = vec2(-0.20, -0.30);        // particle_pos in ctr space
            vec2  asp_d   = ctr - pp;
            asp_d.x      *= u_res.x / u_res.y;        // aspect-correct distance
            float pp_r    = length(asp_d);
            // Ring speeds: inner races ahead (blue-shifted), outer lags (red-shifted)
            const float SPD[3] = float[3](1.20, 0.78, 0.48);
            const vec3  GWC[3] = vec3[3](
                vec3(0.65, 0.82, 1.00),   // inner — blue-white (short wavelength)
                vec3(1.00, 0.88, 0.52),   // mid   — amber/gold
                vec3(1.00, 0.52, 0.28)    // outer — red-shifted (long wavelength)
            );
            for (int wi = 0; wi < 3; wi++) {
                float wave_r   = norm_t * SPD[wi];
                float ring_str = smoothstep(0.028, 0.0, abs(pp_r - wave_r))
                               * exp(-norm_t * 4.0 - float(wi) * 0.55);
                col += ring_str * GWC[wi] * 1.9;
            }
        }
    }

    // 4p. Multiverse synaptic burst — Scene 6 revelation (scene_norm 0.798→0.93).
    // At the moment the universe-particle's true identity is revealed, quantum
    // entanglement threads snap into visibility radiating outward from the particle.
    // 8 radial filaments fan out; violet-blue palette; brief onset, slow fade.
    // Beat-reactive halo at particle origin on each 133 BPM kick.
    if (u_scene_idx == 5) {
        float syn_t = smoothstep(0.798, 0.806, u_scene_norm)
                    * smoothstep(0.930, 0.895, u_scene_norm);
        if (syn_t > 0.001) {
            float asp_r = u_res.x / u_res.y;
            vec2  src   = vec2(-0.20, -0.30);  // particle_pos in ctr space
            float bp    = 1.0 + smoothstep(0.07, 0.0, u_beat) * 0.70;

            for (int fi = 0; fi < 8; fi++) {
                float ff   = float(fi);
                float ang  = (ff + 0.5) / 8.0 * 6.28318 + 0.31;
                float lenV = 0.66 + 0.34 * hash11(ff * 3.71 + 0.53);
                vec2  dst  = src + vec2(cos(ang), sin(ang)) * lenV * 1.25;

                // Aspect-correct line SDF
                vec2 pa_a = vec2((ctr.x - src.x) * asp_r, ctr.y - src.y);
                vec2 ba_a = vec2((dst.x - src.x) * asp_r, dst.y - src.y);
                float ht  = clamp(dot(pa_a, ba_a) / dot(ba_a, ba_a), 0.0, 1.0);
                float d   = length(pa_a - ba_a * ht);

                float glow = exp(-d / 0.0022) * (1.0 - ht * 0.60);
                float hueR = hash11(ff * 5.31 + 1.7);
                vec3  tc   = mix(vec3(0.20, 0.14, 0.95), vec3(0.52, 0.06, 0.90), hueR);
                col += glow * tc * 0.20 * syn_t * bp;
            }
            // Bright origin halo when threads fire
            float src_r = length(vec2((ctr.x - src.x) * asp_r, ctr.y - src.y));
            col += exp(-src_r * src_r * 280.0) * vec3(0.55, 0.40, 1.00) * syn_t * 0.75 * bp;
        }
    }

    // 8m. Big-bang CMB expansion — Scene 7 opening: universe born from singularity.
    // Concentric expanding rings simulate the cosmic microwave background radiation
    // pattern, fired from screen centre as the demo erupts into Act IV.
    // Warm CMB palette (inner white → outer amber) fades over first ~3 seconds.
    // Layered above the UV burst (top of main) and bang_flash (8b) for compound effect.
    if (u_scene_idx == 6) {
        float cmb_t = 1.0 - smoothstep(0.0, 0.11, u_scene_norm);
        if (cmb_t > 0.001) {
            float r_cmb = length(ctr * 2.0);
            for (int ci = 0; ci < 4; ci++) {
                float fci      = float(ci);
                float ring_r   = u_scene_norm * (1.5 + fci * 0.50);
                float ring_str = cmb_t * smoothstep(0.020, 0.0, abs(r_cmb - ring_r))
                               * exp(-fci * 0.45);
                // CMB thermal spectrum: inner white-blue → outer warm amber
                vec3 cmb_col   = mix(vec3(1.00, 0.94, 0.82), vec3(1.00, 0.58, 0.18), fci * 0.36);
                col += ring_str * cmb_col * 2.8;
            }
        }
    }

    // 8n. Act IV mathematical concept transition flashes — Scene 7 (Transcendence).
    // Each mathematical structure in Act IV announces itself with a brief coloured flash.
    // Palette matches mathematical character: life=amber, chaos=orange, S³=violet,
    // bundle=cyan, complex=blue-violet, compactification=blue-white.
    // One-sided decay: fires at the scene_norm when the structure first appears, fades
    // over ~0.5 real seconds (K=220 on a 60s scene). Gated well below silence/logo.
    // u_rms: the music's energy envelope scales each flash — loud bass drops make the
    // mathematical arrivals unmissable; quiet passages let them emerge gently.
    if (u_scene_idx == 6) {
        float sn = u_scene_norm;
        float rms_boost = 0.65 + u_rms * 0.70;  // quiet≈0.65×, loud≈1.35×
        const float K = 220.0;
        // Fibonacci phyllotaxis (0.02): golden seeds born from the big-bang — pure gold
        // Distinct from helix amber: bright golden-yellow signals the φ origin of all spirals.
        if (sn >= 0.02 && sn < 0.11) col += exp(-(sn - 0.02) * K) * vec3(1.00, 0.88, 0.22) * 0.45 * rms_boost;
        // Helix (0.05): life structure / DNA — warm amber-gold
        if (sn >= 0.05 && sn < 0.14) col += exp(-(sn - 0.05) * K) * vec3(0.95, 0.65, 0.18) * 0.55 * rms_boost;
        // Penrose quasicrystal (0.15): φ²-aperiodic 5-fold tiling — iridescent gold-cyan split
        if (sn >= 0.15 && sn < 0.24) col += exp(-(sn - 0.15) * K) * mix(vec3(0.95, 0.68, 0.18), vec3(0.12, 0.65, 1.00), 0.5) * 0.50 * rms_boost;
        // Lorenz (0.22): deterministic chaos — amber-orange heat
        if (sn >= 0.22 && sn < 0.31) col += exp(-(sn - 0.22) * K) * vec3(0.92, 0.38, 0.10) * 0.60 * rms_boost;
        // Clifford torus (0.40): flat T² in S³ — deep violet (S³ topology)
        if (sn >= 0.40 && sn < 0.49) col += exp(-(sn - 0.40) * K) * vec3(0.52, 0.06, 0.92) * 0.60 * rms_boost;
        // Hopf fibration (0.44): S³→S² fiber bundle — cyan (ordered structure)
        if (sn >= 0.44 && sn < 0.53) col += exp(-(sn - 0.44) * K) * vec3(0.10, 0.72, 0.95) * 0.55 * rms_boost;
        // Julia set (0.52): complex boundary — blue-violet (complex analysis)
        if (sn >= 0.52 && sn < 0.61) col += exp(-(sn - 0.52) * K) * vec3(0.38, 0.10, 0.96) * 0.60 * rms_boost;
        // Riemann sphere (0.67): ℂ∪{∞} compactification — blue-white (pure topology)
        if (sn >= 0.67 && sn < 0.76) col += exp(-(sn - 0.67) * K) * vec3(0.62, 0.80, 1.00) * 0.65 * rms_boost;
    }

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
