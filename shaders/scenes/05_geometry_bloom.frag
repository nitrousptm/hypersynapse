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

// ─── sky background (Act III: deep violet starfield + aurora curtains) ────────

vec3 sky_background(vec3 rd) {
    // Base gradient: zenith (deep indigo) → horizon (near-black)
    float horizon = smoothstep(-0.15, 0.40, rd.y);
    vec3 sky = mix(vec3(0.010, 0.004, 0.028), vec3(0.038, 0.0, 0.110), horizon);

    // Nebula haze from DESIGN.md Act III palette
    sky += fbm(rd * 2.2 + u_time * 0.04) * vec3(0.020, 0.0, 0.048);
    sky += max(fbm(rd * 4.5 + vec3(7.1, u_time*0.025, 2.3)) - 0.45, 0.0)
           * vec3(0.06, 0.02, 0.12);

    // Multi-layer starfield (3 scales, magenta/violet tint for Act III)
    for (int si = 0; si < 3; si++) {
        float fi = float(si);
        float scale = 55.0 + fi * 35.0;
        vec3 p  = rd * scale + vec3(fi * 21.7, fi * 13.3, fi * 37.1);
        vec3 id = floor(p);
        vec3 fr = fract(p);
        vec2 ha = vec2(hash2(id.xy + fi * 0.3), hash2(id.yz + fi * 0.7));
        float hz = hash2(id.xz + fi * 1.1);
        if (ha.x < 0.20) {
            float size    = 0.0014 + ha.x * 0.004;
            float twinkle = 0.80 + 0.20 * sin(u_time * (1.8 + ha.y * 4.0) + hz * 30.0);
            float d       = length(fr - 0.5);
            vec3  sc      = mix(vec3(0.90, 0.72, 1.0), vec3(0.65, 0.80, 1.0), hz);
            sky += sc * size / (d * d + size * size) * 0.32 * twinkle;
        }
    }

    // Aurora curtains — two shimmering bands of violet/magenta/cyan.
    // Only rendered in upper hemisphere; intensity grows with scene_norm so
    // the sky "awakens" progressively as the fractals bloom into view.
    float aurora_gate = smoothstep(0.10, 0.45, rd.y);
    if (aurora_gate > 0.001) {
        float beat_flare = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.9 * u_scene_norm;
        float t_a = u_time * 0.055;
        float az_base = atan(rd.z, rd.x);
        for (int ci = 0; ci < 2; ci++) {
            float coff = float(ci) * 2.094;  // 120° apart
            float az   = az_base + coff;
            float wave = vnoise(vec3(az * 1.6,  rd.y * 3.0, t_a + float(ci) * 5.7)) * 0.50
                       + vnoise(vec3(az * 3.2,  rd.y * 6.0, t_a * 1.8 + float(ci) * 3.1)) * 0.25;
            float sway = sin(t_a * 0.35 + float(ci) * 2.1) * 0.75;
            float curtain = smoothstep(0.32, 0.0, abs(az - sway)) * wave;
            vec3 aurora_col = (ci == 0)
                ? mix(vec3(0.30, 0.0, 0.90), vec3(0.90, 0.12, 0.70), wave)
                : mix(vec3(0.05, 0.45, 0.90), vec3(0.50, 0.0, 0.80), wave);
            sky += aurora_col * curtain * aurora_gate * 0.22 * beat_flare * u_scene_norm;
        }
    }

    return sky;
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
    // Tetrahedron method: 4 SDF evaluations vs 6 for central differences
    const float e = 0.001;
    const vec2 k = vec2(1, -1);
    return normalize(
        k.xyy * sdf_world(p + k.xyy * e) +
        k.yyx * sdf_world(p + k.yyx * e) +
        k.yxy * sdf_world(p + k.yxy * e) +
        k.xxx * sdf_world(p + k.xxx * e)
    );
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
    float transmittance = 1.0;  // Beer-Lambert: starts at 1, decays multiplicatively

    for (int i = 0; i < 32; i++) {
        float tt = dither + float(i) * step_size;
        vec3 p = ro + rd * tt;

        // Media density from fbm — modulated to scene time for "growing" effect
        float dens = fbm(p * 1.2 + u_time * 0.08) * mix(0.15, 0.35, u_scene_norm);
        if (dens < 0.02) continue;

        float sigma_t = dens * 2.5;   // extinction coefficient

        // Phase for both lights
        float cos1 = dot(rd, light1);
        float cos2 = dot(rd, light2);
        float ph1 = hg_phase(cos1, 0.4);
        float ph2 = hg_phase(cos2, 0.3);

        // Soft shadow
        float shad1 = vol_shadow(p, light1);
        float shad2 = vol_shadow(p, light2);

        // Scatter contribution weighted by current transmittance (Beer-Lambert)
        vec3 scatter = col1 * ph1 * shad1 + col2 * ph2 * shad2 * 0.6;
        acc += scatter * dens * transmittance * step_size;

        // Multiplicative transmittance decay — physically correct
        transmittance *= exp(-sigma_t * step_size);
        if (transmittance < 0.005) break;  // early exit when medium is opaque
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

    // Kaleidoscope sky: 6-fold azimuthal mirror emerges as scene blooms.
    // Folds aurora curtains and nebulae into a symmetric mandala backdrop.
    float kaleido_sky = smoothstep(0.38, 0.60, u_scene_norm);
    vec3 col;
    if (kaleido_sky > 0.001) {
        float az  = atan(rd.z, rd.x);
        float el  = atan(rd.y, length(rd.xz));
        const float SECTOR = 1.047197551;   // π/3 — 6-fold symmetry
        az = mod(az + 3.14159265, 2.0 * SECTOR);
        if (az > SECTOR) az = 2.0 * SECTOR - az;
        az -= SECTOR * 0.5;
        float cel = cos(el);
        vec3 rd_k = normalize(vec3(cel * cos(az), sin(el), cel * sin(az)));
        col = mix(sky_background(rd), sky_background(rd_k), kaleido_sky);
    } else {
        col = sky_background(rd);
    }

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
