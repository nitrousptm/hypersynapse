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
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(dot(i,vec3(1,57,113))),hash(dot(i+vec3(1,0,0),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,0),vec3(1,57,113))),hash(dot(i+vec3(1,1,0),vec3(1,57,113))),f.x),f.y),
               mix(mix(hash(dot(i+vec3(0,0,1),vec3(1,57,113))),hash(dot(i+vec3(1,0,1),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,1),vec3(1,57,113))),hash(dot(i+vec3(1,1,1),vec3(1,57,113))),f.x),f.y),f.z);
}

float fbm(vec3 p) {
    float v=0.0, a=0.5;
    for(int i=0;i<6;i++){v+=a*vnoise(p);p*=2.1;a*=0.5;}
    return v;
}

// ─── SDF primitives ───────────────────────────────────────────────────────────

float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x+p.y+p.z-s)*0.57735027;
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

// ─── fractal flower / temple SDF ─────────────────────────────────────────────

float sdf_flower(vec3 p) {
    // Petal rotation: 5-fold symmetry
    const float PI2 = 6.28318;
    float min_d = 1e9;
    for (int i = 0; i < 5; i++) {
        float angle = float(i) * PI2 / 5.0;
        vec3 pp = p;
        float c = cos(angle), s = sin(angle);
        pp.xz = mat2(c,-s,s,c) * pp.xz;
        pp -= vec3(0.5, 0.0, 0.0);
        float petal = sdBox(pp, vec3(0.18, 0.05, 0.12));
        // Petal curves inward
        petal -= 0.04 * sin(pp.x * 8.0 + u_time * 2.0);
        min_d = smin(min_d, petal, 0.08);
    }
    // Center sphere
    float center = sdSphere(p, 0.18);
    center -= fbm(p * 4.0 + u_time * 0.3) * 0.06;
    return smin(min_d, center, 0.06);
}

float sdf_temple(vec3 p) {
    // Recursive nested octahedra
    vec3 pp = p;
    float d = sdOctahedron(pp, 0.9);
    pp *= 2.5; pp = abs(pp) - 0.7;
    d = smin(d, sdOctahedron(pp, 0.35), 0.1);
    pp *= 2.5; pp = abs(pp) - 0.5;
    d = smin(d, sdOctahedron(pp, 0.14), 0.05);
    return d;
}

float sdf_world(vec3 p) {
    // Multiple flowers at different positions + temple in center
    float t = u_time * 0.15;

    float temple = sdf_temple(p * 0.7) / 0.7;

    float f1 = sdf_flower(p - vec3(1.2 * sin(t), 0.2, 1.2 * cos(t)));
    float f2 = sdf_flower(p - vec3(-1.0 * cos(t*1.3), -0.1, 0.8 * sin(t*1.1)));
    float f3 = sdf_flower(p - vec3(0.5 * sin(t*0.7), 0.8, -1.1 * cos(t*0.9)));

    float flowers = smin(smin(f1, f2, 0.15), f3, 0.15);
    return smin(temple, flowers, 0.2);
}

// ─── raymarching ──────────────────────────────────────────────────────────────

const int MAX_STEPS = 128;
const float SURF_DIST = 0.0008;
const float MAX_DIST = 12.0;

float march(vec3 ro, vec3 rd, out int steps) {
    float t = 0.02;
    for (steps = 0; steps < MAX_STEPS; steps++) {
        float d = sdf_world(ro + rd * t);
        if (d < SURF_DIST) return t;
        if (t > MAX_DIST) return MAX_DIST;
        t += max(d * 0.75, 0.0005);
    }
    return MAX_DIST;
}

vec3 normal_at(vec3 p) {
    float e = 0.001;
    return normalize(vec3(
        sdf_world(p+vec3(e,0,0))-sdf_world(p-vec3(e,0,0)),
        sdf_world(p+vec3(0,e,0))-sdf_world(p-vec3(0,e,0)),
        sdf_world(p+vec3(0,0,e))-sdf_world(p-vec3(0,0,e))
    ));
}

// ─── volumetric god rays ──────────────────────────────────────────────────────
// Two light sources: overhead magenta + orbiting cyan — 32 dithered steps.
// Dithering via interleaved gradient noise prevents banding at low cost.

float ign_dither(vec2 fcoord) {
    return fract(52.9829189 * fract(dot(fcoord, vec2(0.06711056, 0.00583715))));
}

// Henyey-Greenstein phase function for forward scattering
float hg_phase(float cos_theta, float g) {
    float g2 = g * g;
    return (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cos_theta, 1.5));
}

// SDF-based soft shadow along ray (AO approximation)
float vol_shadow(vec3 p, vec3 ldir) {
    float t = 0.08;
    float occ = 1.0;
    for (int i = 0; i < 6; i++) {
        float d = sdf_world(p + ldir * t);
        occ *= clamp(d / (0.4 * t), 0.0, 1.0);
        t += 0.15;
    }
    return occ;
}

vec3 god_rays(vec3 ro, vec3 rd, float t_hit) {
    // Two animated light sources for richness
    float lt = u_time * 0.25;
    vec3 light1 = normalize(vec3(sin(lt) * 0.6,        2.0, cos(lt) * 0.6));         // overhead sweep
    vec3 light2 = normalize(vec3(cos(lt * 0.7 + 1.3), -0.5, sin(lt * 0.7 + 1.3)));  // low opposing

    vec3 col1 = vec3(0.9, 0.3, 1.0);   // magenta
    vec3 col2 = vec3(0.2, 0.8, 1.0);   // cyan

    // Beat-driven intensity surge
    float beat_surge = 1.0 + smoothstep(0.06, 0.0, u_beat) * 1.8 * u_scene_norm;
    float march_dist = min(t_hit, 4.0);

    float step_size = march_dist / 32.0;
    float dither = ign_dither(gl_FragCoord.xy) * step_size;

    vec3 acc = vec3(0.0);
    float transmittance = 1.0;

    for (int i = 0; i < 32; i++) {
        float tt = dither + float(i) * step_size;
        vec3 p = ro + rd * tt;

        // Media density from fbm — modulated to scene time for "growing" effect
        float dens = fbm(p * 1.2 + u_time * 0.08) * mix(0.15, 0.35, u_scene_norm);
        if (dens < 0.02) continue;

        float sigma_t = dens * 2.5;   // extinction
        float weight = exp(-transmittance * sigma_t * step_size);

        // Phase for both lights
        float cos1 = dot(rd, light1);
        float cos2 = dot(rd, light2);
        float ph1 = hg_phase(cos1, 0.4);
        float ph2 = hg_phase(cos2, 0.3);

        // Soft shadow
        float shad1 = vol_shadow(p, light1);
        float shad2 = vol_shadow(p, light2);

        vec3 scatter = col1 * ph1 * shad1 + col2 * ph2 * shad2 * 0.6;
        acc += scatter * dens * weight * step_size;
        transmittance += sigma_t * step_size;
    }

    return acc * beat_surge * 1.5;
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // Camera slowly spiraling inward
    float angle = u_time * 0.18;
    float radius = 3.0 - 1.5 * u_scene_norm;
    float height = 0.3 + 0.5 * sin(u_time * 0.22);
    vec3 ro = vec3(sin(angle)*radius, height, cos(angle)*radius);
    vec3 ta = vec3(0.0);
    vec3 fw = normalize(ta - ro);
    vec3 ri = normalize(cross(fw, vec3(0,1,0)));
    vec3 up = cross(ri, fw);
    vec3 rd = normalize(uv.x*ri + uv.y*up + 2.0*fw);

    // Deep violet sky
    vec3 sky = mix(vec3(0.02, 0.0, 0.08), vec3(0.08, 0.0, 0.2), uv.y*0.5+0.5);
    sky += fbm(rd * 2.0 + u_time * 0.05) * vec3(0.03, 0.0, 0.06);
    vec3 col = sky;

    int steps;
    float t = march(ro, rd, steps);

    if (t < MAX_DIST) {
        vec3 p = ro + rd * t;
        vec3 n = normal_at(p);

        // Multi-colored surface material
        float mat_n = fbm(p * 5.0 + u_time * 0.2);
        vec3 col_a = vec3(0.8, 0.1, 0.9);   // magenta
        vec3 col_b = vec3(0.1, 0.5, 1.0);   // cyan
        vec3 col_c = vec3(1.0, 0.9, 0.2);   // gold
        vec3 mat = mix(mix(col_a, col_b, mat_n), col_c, sin(p.y*3.0+u_time)*0.5+0.5);
        mat *= 0.6;

        // Specular
        vec3 light = normalize(vec3(1.0, 2.0, 0.5));
        float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);
        mat += spec * vec3(1.0, 0.9, 1.0) * 0.8;

        // Fresnel glow
        float fresnel = pow(1.0-max(dot(n,-rd),0.0), 4.0);
        mat += fresnel * mix(col_a, col_b, u_scene_norm) * 1.2;

        // Self-glow pulse on beat
        float pulse = smoothstep(0.08, 0.0, u_beat) * u_scene_norm;
        mat += pulse * vec3(0.5, 0.2, 0.8) * 1.5;

        // AO
        float ao = 1.0 - float(steps)/float(MAX_STEPS) * 0.6;
        col = mat * ao;

        // Kaleidoscope overlay
        float kaleido = abs(sin(atan(p.x, p.z) * 6.0 + u_time)) * 0.2;
        col += kaleido * vec3(0.3, 0.0, 0.5);
    }

    // Volumetric light scattering — dual-source god rays
    col += god_rays(ro, rd, t);

    // Vignette
    float vig = 1.0 - dot(uv*0.4, uv*0.4);
    col *= vig;

    // HDR output (tonemapping in post)
    frag_color = vec4(col, 1.0);
}
