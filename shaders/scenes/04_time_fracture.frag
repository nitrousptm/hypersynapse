#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;
uniform sampler2D u_prev_frame;  // previous frame feedback

// ─── utils ────────────────────────────────────────────────────────────────────

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n) { return fract(sin(n) * 43758.5453); }

vec3 hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.yzx, p + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

// ─── space fracture crack lines ──────────────────────────────────────────────
// Glowing fractures in the fabric of spacetime — literal "time fracture" visual.
// Branching crack pattern grows outward from impact points, pulsing on beats.

float crack_seg(vec2 uv, vec2 a, vec2 b, float w) {
    vec2 pa = uv - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return w / (length(pa - ba * h) + w);
}

float fracture_arm(vec2 uv, vec2 origin, float seed, float spread) {
    float acc = 0.0;
    vec2 p = origin;
    vec2 dir = normalize(vec2(cos(seed * 6.28318), sin(seed * 6.28318)));
    float w = 0.0005;

    for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float bend = (hash1(seed * 13.7 + fi * 5.3) - 0.5) * 0.65;
        float c = cos(bend), s = sin(bend);
        dir = normalize(vec2(dir.x*c - dir.y*s, dir.x*s + dir.y*c));

        float seg_len = (0.05 + hash1(seed * 7.1 + fi * 3.7) * 0.10) * spread;
        vec2 next = p + dir * seg_len;

        acc += crack_seg(uv, p, next, w);

        // Secondary branch at ~55% chance
        if (hash1(seed * 11.3 + fi * 2.9) > 0.45) {
            float ba = bend + (hash1(seed * 1.7 + fi * 0.3) - 0.5) * 1.4;
            float bc = cos(ba), bs = sin(ba);
            vec2 bdir = normalize(vec2(dir.x*bc - dir.y*bs, dir.x*bs + dir.y*bc));
            acc += crack_seg(uv, p, p + bdir * seg_len * 0.45, w * 0.5);
        }

        w *= 0.77;
        p = next;
    }
    return acc;
}

float space_cracks(vec2 uv, float beat_boost) {
    // Three impact sites in screen space (aspect-ratio adjusted to ~1.78)
    const vec2 IMP0 = vec2( 0.14,  0.10);
    const vec2 IMP1 = vec2(-0.30,  0.22);
    const vec2 IMP2 = vec2( 0.06, -0.33);
    float acc = 0.0;
    for (int ci = 0; ci < 3; ci++) {
        vec2 imp = (ci==0) ? IMP0 : (ci==1) ? IMP1 : IMP2;
        float sb = float(ci) * 0.37;
        float spread = u_scene_norm * (1.0 + beat_boost * float(3-ci) * 0.15);
        for (int ai = 0; ai < 5; ai++) {
            acc += fracture_arm(uv, imp, sb + float(ai) * 0.19 + 0.03, spread);
        }
    }
    return clamp(acc, 0.0, 2.0);
}

// ─── debris field (frozen particles) ─────────────────────────────────────────

float debris(vec2 uv, float time_offset) {
    // Each time-copy gets unique particle positions via seed_offset.
    // Positions stay frozen (no time dependence) to sell "time stopped" effect.
    float seed = time_offset * 100.0;
    float acc = 0.0;
    for (int i = 0; i < 12; i++) {
        float fi = float(i) + seed;
        vec2 center = vec2(hash1(fi * 3.1), hash1(fi * 7.3)) * 2.0 - 1.0;
        float size = 0.004 + hash1(fi * 11.7) * 0.008;
        float d = length(uv - center);
        acc += size / (d * d + size * size) * 0.3;
    }
    return acc;
}

// ─── reversed particle stream ─────────────────────────────────────────────────

float reversed_stream(vec2 uv) {
    // Particles flowing upward (reversed gravity)
    float y = fract(uv.y - u_time * 0.5);  // reversed direction
    float x_spread = vnoise(vec2(uv.x * 8.0, floor(uv.y * 40.0)));
    float w = 0.002 / (abs(uv.x - (x_spread * 2.0 - 1.0) * 0.8) + 0.002);
    return w * y * (1.0 - y) * 4.0;
}

// ─── reprojection feedback distortion ────────────────────────────────────────

vec3 feedback_sample(vec2 uv) {
    // Sample previous frame with temporal distortion
    float jitter = vnoise(uv * 20.0 + u_time * 3.0) * 0.008;
    vec2 motion = vec2(sin(uv.y * 3.14 + u_time) * 0.003, cos(uv.x * 3.14 + u_time) * 0.002);
    vec2 sample_uv = uv + motion + jitter;
    return texture(u_prev_frame, clamp(sample_uv, 0.001, 0.999)).rgb;
}

// ─── time fracture portal rings ───────────────────────────────────────────────

float portal_ring(vec2 uv, vec2 center, float r, float time_offset) {
    float d = length(uv - center);
    float ring = smoothstep(0.012, 0.0, abs(d - r));
    float phase = fract(d / r - u_time * 0.8 + time_offset);
    return ring * (0.5 + 0.5 * sin(phase * 6.28 * 8.0));
}

// Portal interior: shows a time-shifted reflection of the current scene.
// Sampling the prev_frame at a compressed+distorted coordinate creates the
// "window into another timeframe" illusion without requiring an extra FBO.
vec3 portal_interior(vec2 uv, vec2 center, float r, float time_offset) {
    vec2 local = uv - center;
    float d = length(local);
    if (d >= r * 0.98) return vec3(0.0);

    // Map inside-portal to a distorted prev_frame region.
    // Each portal gets a unique spatial offset so they show "different times".
    vec2 offset = vec2(sin(time_offset * 4.1), cos(time_offset * 3.7)) * 0.15;
    // Flip Y to reinforce the mirror/temporal-reversal concept.
    vec2 portal_uv = (local * vec2(1.0, -1.0)) / (r * 2.2) + 0.5 + offset;

    // Subtle time-wobble: coordinates shift slowly over time
    portal_uv += vec2(sin(u_time * 0.4 + time_offset * 6.28),
                      cos(u_time * 0.35 + time_offset * 4.0)) * 0.012;

    vec3 content = texture(u_prev_frame, clamp(portal_uv, 0.001, 0.999)).rgb;

    // Tint each portal a distinct colour to reinforce "different time streams"
    vec3 tint;
    if      (time_offset < 0.5) tint = vec3(0.6, 0.85, 1.0);  // cold blue  (copy 1)
    else if (time_offset < 1.5) tint = vec3(1.0, 0.55, 0.2);  // hot orange (copy 2)
    else                        tint = vec3(0.3, 1.0, 0.55);  // acid green (copy 3)

    content *= tint;

    // Vignetted fade toward the ring edge so interior blends into ring glow
    float edge_fade = smoothstep(r * 0.98, r * 0.55, d);
    return content * edge_fade * 0.75;
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;
    vec2 uv01 = gl_FragCoord.xy / u_res;

    // Temporal feedback base — decay over time
    vec3 prev = feedback_sample(uv01);
    vec3 col = prev * 0.7;  // feedback decay

    // Background: deep dark space-like void
    col += vec3(0.003, 0.005, 0.015);

    // Three time-offset copies of the same explosion
    float d1 = debris(uv, 0.0);
    float d2 = debris(uv * 1.1 + vec2(0.1, -0.1), 2.0);
    float d3 = debris(uv * 0.9 + vec2(-0.15, 0.05), -1.5);

    col += d1 * vec3(0.5, 0.7, 1.0) * 1.5;
    col += d2 * vec3(1.0, 0.4, 0.2) * 0.8;
    col += d3 * vec3(0.3, 1.0, 0.6) * 0.6;

    // Reversed particle streams
    float rs = reversed_stream(uv);
    col += rs * vec3(0.1, 0.4, 1.0) * 0.8;

    // Time portal rings — glowing edge + interior showing a time-shifted reflection
    float pr1 = portal_ring(uv, vec2(0.0, 0.0), 0.6, 0.0);
    float pr2 = portal_ring(uv, vec2(-0.4, 0.2), 0.35, 0.33);
    float pr3 = portal_ring(uv, vec2(0.5, -0.3), 0.2, 0.67);
    col += pr1 * vec3(0.0, 0.6, 1.0) * 1.2;
    col += pr2 * vec3(1.0, 0.2, 0.8) * 0.8;
    col += pr3 * vec3(0.2, 1.0, 0.5) * 0.6;

    // Portal interiors: actual time-shifted scene content visible through each ring
    col += portal_interior(uv, vec2(0.0, 0.0), 0.6, 0.0);
    col += portal_interior(uv, vec2(-0.4, 0.2), 0.35, 0.33);
    col += portal_interior(uv, vec2(0.5, -0.3), 0.2, 0.67);

    // Motion vector abuse: warp space based on velocity field
    float warp = vnoise(uv * 4.0 + vec2(u_time * 0.3, -u_time * 0.2)) * 0.04;
    vec2 warped_uv = uv01 + vec2(warp, -warp * 0.5);
    vec3 warped_sample = texture(u_prev_frame, clamp(warped_uv, 0.001, 0.999)).rgb;
    col += warped_sample * 0.2;

    // Beat sync: reality "shatters" on downbeat
    float beat_shatter = smoothstep(0.03, 0.0, u_beat);
    col += beat_shatter * vec3(0.2, 0.5, 1.0) * 0.4;

    // Fracture crack lines — glowing spacetime tears spreading with the scene
    float cracks = space_cracks(uv, beat_shatter);
    col += cracks * vec3(0.12, 0.45, 1.00) * (0.7 + beat_shatter * 1.2);
    col += cracks * beat_shatter * vec3(0.80, 0.90, 1.00) * 0.5;  // white-hot on beat

    // Scanlines subtle
    col *= 0.9 + 0.1 * sin(gl_FragCoord.y * 2.0);

    // Vignette
    float vig = 1.0 - dot(uv * 0.45, uv * 0.45);
    col *= vig;

    // Chromatic aberration increasing with scene progress
    float ca = 0.003 + u_scene_norm * 0.008;
    vec2 ca_uv = uv01;
    float r = texture(u_prev_frame, ca_uv + vec2(ca, 0)).r;
    float b = texture(u_prev_frame, ca_uv - vec2(ca, 0)).b;
    col.r = mix(col.r, col.r * 0.5 + r * 0.5, 0.3);
    col.b = mix(col.b, col.b * 0.5 + b * 0.5, 0.3);

    frag_color = vec4(col, 1.0);
}
