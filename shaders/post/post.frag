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
            // Rotation angle: center-heavy falloff (exp) so outer stars barely move
            float rot    = ramp * (0.06 + vkick * 0.14) * exp(-r * 4.0) * 3.14159;
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

    // 2. Dual-layer bloom (richer in Acts III/IV)
    float bloom_thresh   = mix(0.82, 0.50, demo_norm);
    float bloom_radius   = mix(5.0, 14.0, demo_norm) + kick * 6.0;
    float bloom_strength = mix(0.35, 1.10, demo_norm);
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
    float vig_pulse = kick * 0.6 * smoothstep(0.1875, 0.75, demo_norm);
    float vig = 1.0 - dot(ctr * 1.5, ctr * 1.5);
    vig = clamp(pow(clamp(vig, 0.0, 1.0), vig_str + vig_pulse), 0.0, 1.0);
    col *= vig;

    // 8. Beat-sync white flash (strong beats in Acts II/III)
    float flash_str = smoothstep(0.1875, 0.75, demo_norm);
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
