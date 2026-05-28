#version 460 core
// Act III — Bloom / Collapse
// Mandelbox fractal SDF + volumetric overload → single point of light.
// Camera pulls in toward origin as u_act_norm → 1.0 (collapse).

in vec2 v_uv;
out vec4 frag;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;  // 0→1 during Act III: bloom→collapse
uniform int   u_beat_cnt;
uniform int   u_bar_cnt;

#define PI  3.14159265358979323846
#define TAU 6.28318530717958647692

// ─── Helpers ─────────────────────────────────────────────────────────────────
float hash11(float n) { return fract(sin(n) * 43758.5453123); }

mat2 rot2(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// ─── Mandelbox SDF ──────────────────────────────────────────────────────────
// Classic Mandelbox distance estimator.
// scale=2.0, fixed_r=1.0, min_r=0.5, 8 iterations.
float mandelbox(vec3 p0) {
    const float mb_scale    = 2.0;
    const float fixed_r2    = 1.0;   // fixedRadius^2
    const float min_r2      = 0.25;  // minRadius^2

    vec3  p  = p0;
    float dr = 1.0;

    for (int i = 0; i < 8; ++i) {
        // Box fold: reflect components outside [-1,1] back inward
        p  = clamp(p, -1.0, 1.0) * 2.0 - p;

        // Sphere fold
        float r2 = dot(p, p);
        if (r2 < min_r2) {
            float k = fixed_r2 / min_r2;
            p  *= k;
            dr *= k;
        } else if (r2 < fixed_r2) {
            float k = fixed_r2 / r2;
            p  *= k;
            dr *= k;
        }

        // Scale and translate back to original point
        p  = mb_scale * p + p0;
        dr = dr * abs(mb_scale) + 1.0;
    }

    return length(p) / abs(dr) - 0.002;
}

// ─── Normal ───────────────────────────────────────────────────────────────────
vec3 calc_normal(vec3 p) {
    const vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
        mandelbox(p+e.xyy) - mandelbox(p-e.xyy),
        mandelbox(p+e.yxy) - mandelbox(p-e.yxy),
        mandelbox(p+e.yyx) - mandelbox(p-e.yyx)));
}

// ─── Palette ─────────────────────────────────────────────────────────────────
// White-hot overload; desaturates toward collapse
vec3 palette(float t, float sat) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5) * sat;
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.55, 0.45, 0.35);
    return a + b * cos(TAU * (c * t + d));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
    vec2 uv = (v_uv * u_res - 0.5 * u_res) / u_res.y;

    // Slow global rotation to animate the fractal
    float ang  = u_time * 0.04;

    // Camera: pulls toward origin as act nears collapse
    float cam_dist = mix(3.2, 0.18, smoothstep(0.55, 0.96, u_act_norm));
    float cam_t    = u_time * 0.035;
    vec3  ro       = vec3(cos(cam_t), sin(cam_t * 0.5) * 0.5, sin(cam_t)) * cam_dist;

    // Rotate scene around Y axis
    float sa = sin(ang), ca = cos(ang);
    mat3 rotY = mat3(ca, 0, sa, 0, 1, 0, -sa, 0, ca);

    vec3 fw    = normalize(-ro);
    vec3 right = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up    = cross(right, fw);
    vec3 rd    = normalize(fw + 1.4 * (uv.x * right + uv.y * up));

    float kick = exp(-u_beat * 10.0) * 0.4;

    // ── Raymarch ─────────────────────────────────────────────────────────────
    float t    = 0.01;
    float glow = 0.0;
    bool  hit  = false;
    vec3  hit_p;

    for (int i = 0; i < 80; ++i) {
        vec3  p = rotY * (ro + rd * t);
        float d = mandelbox(p);

        glow += 0.003 / (d * d + 0.0015);

        if (d < 0.0012) { hit = true; hit_p = ro + rd * t; break; }
        if (t > 12.0)   break;
        t += max(abs(d) * 0.55, 0.001);
    }

    vec3 col = vec3(0.0);

    if (hit) {
        vec3 n  = calc_normal(rotY * hit_p);
        float fr = pow(1.0 - abs(dot(n, normalize(-rd))), 4.0);
        float hue = u_act_norm * 0.35 + float(u_bar_cnt) * 0.025;
        float sat = mix(1.0, 0.03, smoothstep(0.72, 1.0, u_act_norm));
        vec3 base = palette(hue, sat);
        col  = base * 0.25;
        col += base * fr * 2.0;
        col += vec3(1.0) * fr * 0.9;
    }

    // Volumetric glow
    glow = clamp(glow, 0.0, 10.0);
    float sat2 = mix(1.0, 0.0, smoothstep(0.78, 0.99, u_act_norm));
    col += palette(u_act_norm * 0.4 + u_bar * 0.08, sat2) * glow * (0.55 + kick * 3.0);

    // Final collapse: white singularity flash
    float collapse = smoothstep(0.90, 1.0, u_act_norm);
    float center   = exp(-length(uv) * mix(6.0, 1.5, collapse)) * collapse * 8.0;
    col += vec3(1.0) * center;

    float vig = 1.0 - 0.3 * dot(uv, uv);
    col *= clamp(vig, 0.0, 1.0);

    frag = vec4(col, 1.0);
}
