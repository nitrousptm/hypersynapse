#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;

// ─── noise / SDF utils ────────────────────────────────────────────────────────

float hash(float n) { return fract(sin(n) * 43758.5453); }
vec3  hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(dot(i, vec3(1,57,113))),
                       hash(dot(i+vec3(1,0,0), vec3(1,57,113))), f.x),
                   mix(hash(dot(i+vec3(0,1,0), vec3(1,57,113))),
                       hash(dot(i+vec3(1,1,0), vec3(1,57,113))), f.x), f.y),
               mix(mix(hash(dot(i+vec3(0,0,1), vec3(1,57,113))),
                       hash(dot(i+vec3(1,0,1), vec3(1,57,113))), f.x),
                   mix(hash(dot(i+vec3(0,1,1), vec3(1,57,113))),
                       hash(dot(i+vec3(1,1,1), vec3(1,57,113))), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.1; a *= 0.5; }
    return v;
}

// ─── SDF monolith ─────────────────────────────────────────────────────────────

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Monolith: tall black obelisk with procedural surface detail
float sdf_monolith(vec3 p) {
    // Base shape: 2:1:5 box
    float base = sdBox(p, vec3(0.4, 1.6, 0.2));

    // Surface growth — noise pushes outward as scene progresses
    float growth = fbm(p * 3.0 + u_time * 0.15) * 0.12 * u_scene_norm;

    // Opening crack: at scene end the monolith splits on Y-axis
    float crack = abs(p.x) - 0.02 * smoothstep(0.7, 1.0, u_scene_norm);

    return min(base - growth, crack) ;
}

// ─── volumetric fog around base ───────────────────────────────────────────────

float fog_density(vec3 p) {
    float h = max(0.0, 1.5 - abs(p.y + 1.6)); // thicker near floor
    float n = fbm(p * 1.5 + vec3(u_time * 0.2, 0.0, u_time * 0.1));
    return h * n * 0.6;
}

// ─── raymarching ──────────────────────────────────────────────────────────────

const int MAX_STEPS = 96;
const float MAX_DIST = 20.0;
const float SURF_DIST = 0.001;

float march(vec3 ro, vec3 rd, out int steps) {
    float t = 0.0;
    for (steps = 0; steps < MAX_STEPS; steps++) {
        vec3 p = ro + rd * t;
        float d = sdf_monolith(p);
        if (d < SURF_DIST) return t;
        if (t > MAX_DIST)  return MAX_DIST;
        t += max(d * 0.8, 0.001);
    }
    return MAX_DIST;
}

vec3 normal(vec3 p) {
    float e = 0.001;
    return normalize(vec3(
        sdf_monolith(p + vec3(e,0,0)) - sdf_monolith(p - vec3(e,0,0)),
        sdf_monolith(p + vec3(0,e,0)) - sdf_monolith(p - vec3(0,e,0)),
        sdf_monolith(p + vec3(0,0,e)) - sdf_monolith(p - vec3(0,0,e))
    ));
}

// ─── particle sparks on surface ───────────────────────────────────────────────

float sparks(vec3 p, float scene_norm) {
    float density = scene_norm * scene_norm;
    vec3 h = hash3(floor(p * 40.0 + u_time * 0.5));
    return step(0.96 - density * 0.3, h.x) * smoothstep(0.3, 0.0, fract(p.y * 20.0 + u_time));
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // Camera slowly orbiting, pulling back on beat
    float cam_y = -0.3 + 0.2 * sin(u_time * 0.3);
    float cam_dist = 3.5 - 1.0 * u_scene_norm;
    float cam_angle = u_time * 0.08;
    vec3 ro = vec3(sin(cam_angle) * cam_dist, cam_y, cos(cam_angle) * cam_dist);
    vec3 ta = vec3(0.0, 0.0, 0.0);

    vec3 fw = normalize(ta - ro);
    vec3 ri = normalize(cross(fw, vec3(0,1,0)));
    vec3 up = cross(ri, fw);
    vec3 rd = normalize(uv.x * ri + uv.y * up + 1.8 * fw);

    // Sky: deep dark blue-black
    vec3 col = mix(vec3(0.005, 0.008, 0.02), vec3(0.002, 0.003, 0.01), uv.y * 0.5 + 0.5);

    int steps;
    float t = march(ro, rd, steps);

    if (t < MAX_DIST) {
        vec3 p = ro + rd * t;
        vec3 n = normal(p);

        // Base material: near-black obsidian
        vec3 mat = vec3(0.02, 0.02, 0.03);

        // Procedural surface noise coloring
        float surf_n = fbm(p * 8.0 + u_time * 0.1);
        mat += surf_n * vec3(0.0, 0.05, 0.15) * u_scene_norm;

        // Fresnel rim light — electric blue
        float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);
        mat += fresnel * vec3(0.0, 0.4, 1.0) * (0.3 + 0.7 * u_scene_norm);

        // Key light from above
        vec3 light = normalize(vec3(0.5, 2.0, 1.0));
        float diff = max(dot(n, light), 0.0);
        mat += diff * vec3(0.1, 0.15, 0.3) * 0.4;

        // Sparks on surface
        float sp = sparks(p, u_scene_norm);
        mat += sp * vec3(0.2, 0.6, 1.0) * 2.0;

        // Opening crack light — white/cyan at seam
        float crack_glow = smoothstep(0.04, 0.0, abs(p.x)) * smoothstep(0.7, 1.0, u_scene_norm);
        mat += crack_glow * vec3(0.8, 1.0, 1.0) * 4.0;

        // AO via step count
        float ao = 1.0 - float(steps) / float(MAX_STEPS) * 0.5;
        col = mat * ao;
    }

    // Volumetric fog at base
    {
        float fog_acc = 0.0;
        vec3 fp = ro;
        float ft = 0.0;
        for (int i = 0; i < 24; i++) {
            fp = ro + rd * ft;
            fog_acc += fog_density(fp) * 0.08;
            ft += 0.15;
            if (fog_acc > 1.0 || ft > 6.0) break;
        }
        vec3 fog_col = mix(vec3(0.0, 0.05, 0.2), vec3(0.1, 0.2, 0.5), u_scene_norm);
        col = mix(col, fog_col, clamp(fog_acc, 0.0, 0.8));
    }

    // Beat pulse: brief white flash on downbeat
    float beat_pulse = smoothstep(0.02, 0.0, u_beat) * 0.25 * u_scene_norm;
    col += beat_pulse;

    // Vignette
    float vig = 1.0 - dot(uv * 0.4, uv * 0.4);
    col *= vig;

    frag_color = vec4(col, 1.0);
}
