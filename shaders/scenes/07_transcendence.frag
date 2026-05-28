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

vec3 galaxy(vec3 rd) {
    vec3 col = vec3(0.0);
    // Starfield
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec3 p = rd * (50.0 + fi * 30.0);
        vec3 id = floor(p);
        vec3 fr = fract(p);
        vec3 h = hash3(id);
        float size = h.x * 0.003;
        float d = length(fr - 0.5);
        float brightness = size / (d*d + size*size) * 0.5;
        col += h * brightness;
    }
    // Nebula
    float neb = fbm(rd * 3.0 + vec3(u_time * 0.02));
    col += neb * vec3(0.1, 0.0, 0.2) * 0.5;
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

float tendril(vec2 uv, float seed, float t) {
    float acc = 0.0;
    vec2 p = uv;
    vec2 dir = normalize(vec2(cos(seed * 6.28), sin(seed * 6.28)));
    float w = 0.003;

    for (int i = 0; i < 8; i++) {
        // Grow along direction with branching
        vec2 next = p + dir * 0.08;
        float d_line = length(uv - (p + dir * 0.04)) - length(next - p) * 0.04;
        // Rotate direction slightly each step
        float angle = sin(float(i) * 1.3 + seed + t * 0.5) * 0.4;
        float c = cos(angle), s = sin(angle);
        dir = normalize(vec2(dir.x*c - dir.y*s, dir.x*s + dir.y*c));

        float segment_d = length(uv - (p + dir*0.04));
        acc += w / (segment_d + w);
        w *= 0.7;
        p = next;
    }
    return acc * u_scene_norm;
}

// ─── logo formation (final 10 seconds) ───────────────────────────────────────

// Simple "SINGULARITY GARDEN" text render via SDF approximation
float char_S(vec2 p) {
    // Very rough S shape using circles and boxes
    vec2 pp = p - vec2(0.0, 0.0);
    float top = length(pp - vec2(0.0, 0.15)) - 0.12;
    float bot = length(pp - vec2(0.0, -0.15)) - 0.12;
    return min(
        length(vec2(max(abs(pp.x)-0.08, 0.0), pp.y)) - 0.03,
        min(abs(top) - 0.025, abs(bot) - 0.025)
    );
}

float logo_sdf(vec2 uv) {
    // "SG" monogram centered
    vec2 p = uv;
    float s = char_S(p + vec2(0.12, 0.0)) * 0.7;
    float g = length(p - vec2(-0.12, 0.0)) - 0.15;  // circle for G
    float gc = length(p - vec2(-0.02, 0.0)) - 0.08; // cutout
    float g_shape = max(g, -gc);
    return min(s, g_shape);
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

    // Logo appears (streams of data converging)
    float logo_appear = smoothstep(0.905, 0.93, u_scene_norm);
    float logo_d = logo_sdf(uv * 2.0);
    float logo_mask = smoothstep(0.01, 0.0, logo_d);
    // Data streams converging to logo
    float streams = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 stream_dir = normalize(vec2(cos(fi * 1.047), sin(fi * 1.047)));
        float along = dot(uv, stream_dir);
        float across = abs(dot(uv, vec2(-stream_dir.y, stream_dir.x)));
        streams += smoothstep(0.005, 0.0, across) *
                   step(0.0, along) *
                   fract(along * 8.0 - u_time * 3.0) * logo_appear;
    }
    vec3 logo_col = mix(vec3(0.6, 0.8, 1.0), vec3(1.0), logo_appear);
    col += (logo_mask + streams * 0.3) * logo_col * logo_appear * 3.0;

    // Vignette
    float vig = 1.0 - dot(uv * 0.35, uv * 0.35);
    col *= vig;

    frag_color = vec4(col, 1.0);
}
