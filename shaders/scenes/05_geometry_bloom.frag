#version 460 core
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;
uniform float u_rms;

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
        for (int ci = 0; ci < 3; ci++) {
            float coff = float(ci) * 2.094;  // 120° apart (2π/3): three curtains = full circle coverage
            float az   = az_base + coff;
            float wave = vnoise(vec3(az * 1.6,  rd.y * 3.0, t_a + float(ci) * 5.7)) * 0.50
                       + vnoise(vec3(az * 3.2,  rd.y * 6.0, t_a * 1.8 + float(ci) * 3.1)) * 0.25;
            float sway = sin(t_a * 0.35 + float(ci) * 2.1) * 0.75;
            float curtain = smoothstep(0.32, 0.0, abs(az - sway)) * wave;
            vec3 aurora_col;
            if      (ci == 0) aurora_col = mix(vec3(0.30, 0.0, 0.90), vec3(0.90, 0.12, 0.70), wave); // violet→magenta
            else if (ci == 1) aurora_col = mix(vec3(0.05, 0.45, 0.90), vec3(0.50, 0.0, 0.80), wave); // cyan→violet
            else               aurora_col = mix(vec3(0.80, 0.38, 0.05), vec3(0.95, 0.65, 0.0),  wave); // amber→gold
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
    // 9-fold petal symmetry with sub-petal detail
    const float PI2 = 6.28318;
    const int NUM_PETALS = 9;
    float min_d = 1e9;

    for (int i = 0; i < NUM_PETALS; i++) {
        float angle = float(i) * PI2 / float(NUM_PETALS);
        vec3 pp = p;
        float c = cos(angle), s = sin(angle);
        pp.xz = mat2(c,-s,s,c) * pp.xz;
        pp -= vec3(0.5, 0.0, 0.0);

        // Primary petal shape
        float petal = sdBox(pp, vec3(0.19, 0.038, 0.10)) - 0.018;
        petal -= 0.042 * sin(pp.x * 7.5 + u_time * 2.1);
        petal -= 0.016 * sin(pp.z * 5.5 + u_time * 1.4 + float(i) * 0.9);

        // Sub-petals (veins/ridges on each main petal)
        for(int j=0; j<3; j++) {
            float sub_angle = float(j) * 1.047 - 1.047;
            vec3 pps = pp;
            float sc = cos(sub_angle), ss = sin(sub_angle);
            pps.yz = mat2(sc,-ss,ss,sc) * pps.yz;
            float sub_petal = sdBox(pps + vec3(0.0, 0.05, 0.0), vec3(0.08, 0.02, 0.04)) - 0.008;
            petal = smin(petal, sub_petal, 0.05);
        }

        min_d = smin(min_d, petal, 0.07);
    }

    // Complex center structure
    float center = sdSphere(p, 0.17);
    center -= fbm(p * 8.0 + u_time * 0.28) * 0.07;
    center -= fbm(p * 15.0 + vec3(u_time*0.3)) * 0.03;

    // Multiple stamen rings
    float stamen_ring1 = length(vec2(length(p.xz) - 0.10, p.y)) - 0.025;
    float stamen_ring2 = length(vec2(length(p.xz) - 0.06, p.y - 0.05)) - 0.015;
    float stamen_ring3 = length(vec2(length(p.xz) - 0.14, p.y + 0.04)) - 0.018;

    center = smin(center, stamen_ring1, 0.04);
    center = smin(center, stamen_ring2, 0.03);
    center = smin(center, stamen_ring3, 0.035);

    return smin(min_d, center, 0.06);
}

float sdf_temple(vec3 p) {
    // Recursive nested octahedra — 4 levels for proper fractal depth
    vec3 pp = p;
    float d = sdOctahedron(pp, 0.9);
    pp *= 2.5; pp = abs(pp) - 0.7;
    d = smin(d, sdOctahedron(pp, 0.35), 0.1);
    pp *= 2.5; pp = abs(pp) - 0.5;
    d = smin(d, sdOctahedron(pp, 0.14), 0.05);
    pp *= 2.5; pp = abs(pp) - 0.38;  // 4th level: fine filigree detail
    d = smin(d, sdOctahedron(pp, 0.054), 0.018);
    return d;
}

float sdf_world(vec3 p) {
    // Beat-reactive geometry surge: on each kick the SDF space contracts slightly,
    // making all geometry appear to bloom outward toward the camera.
    float beat_surge = smoothstep(0.08, 0.0, u_beat) * u_scene_norm * 0.028;
    p *= 1.0 - beat_surge;

    // Multiple flowers at different positions + temple in center
    float t = u_time * 0.15;

    float temple = sdf_temple(p * 0.7) / 0.7;

    float f1 = sdf_flower(p - vec3(1.2 * sin(t), 0.2, 1.2 * cos(t)));
    float f2 = sdf_flower(p - vec3(-1.0 * cos(t*1.3), -0.1, 0.8 * sin(t*1.1)));
    float f3 = sdf_flower(p - vec3(0.5 * sin(t*0.7), 0.8, -1.1 * cos(t*0.9)));

    float flowers = smin(smin(f1, f2, 0.15), f3, 0.15);
    return smin(temple, flowers, 0.2);
}

// ─── Mandelbulb 3D fractal (power 8, 6 iterations) ───────────────────────────
// Classic demoscene fractal — infinite self-similar organic geometry via
// spherical-coordinate escape-time formula. Power oscillates ±0.5 for slow morph.
// Separate from sdf_world() so vol_shadow() in god_rays() stays cheap.

float mandelbulb_de(vec3 pos) {
    vec3  z   = pos;
    float dr  = 1.0, r = 0.0;
    float pwr = 8.0 + 0.5 * sin(u_time * 0.12);
    for (int i = 0; i < 6; i++) {
        r = length(z);
        if (r > 2.0) break;
        float theta = acos(clamp(z.z / r, -1.0, 1.0)) * pwr;
        float phi   = atan(z.y, z.x) * pwr;
        float zr    = pow(r, pwr - 1.0);
        dr = zr * pwr * dr + 1.0;
        z  = (zr * r) * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)) + pos;
    }
    return 0.5 * log(max(r, 1e-7)) * r / max(dr, 1e-7);
}

float bulb_de_sc(vec3 p, float sc) { return mandelbulb_de(p / sc) * sc; }

float march_bulb(vec3 ro, vec3 rd, float sc, out int steps) {
    float t = 0.01;
    for (steps = 0; steps < 72; steps++) {
        float d = bulb_de_sc(ro + rd * t, sc);
        if (d < 0.0005) return t;
        if (t > 5.0) break;
        t += max(d * 0.82, 0.0002);
    }
    return 6.0;
}

vec3 normal_at_bulb(vec3 p, float sc) {
    const float e = 0.0008;
    const vec2  k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * bulb_de_sc(p + k.xyy * e, sc) +
        k.yyx * bulb_de_sc(p + k.yyx * e, sc) +
        k.yxy * bulb_de_sc(p + k.yxy * e, sc) +
        k.xxx * bulb_de_sc(p + k.xxx * e, sc)
    );
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

// ─── SDF ambient occlusion ───────────────────────────────────────────────────
// Marches 5 steps along the surface normal; measures how much nearby geometry
// occludes the ambient sky. Gives true contact shadows in petal crevices and
// fractal filigree — far more accurate than step-count AO.
float sdf_ao(vec3 p, vec3 n) {
    float occ = 0.0, sca = 1.0;
    for (int i = 1; i <= 5; i++) {
        float h = float(i) * 0.025;
        float d = sdf_world(p + n * h);
        occ += (h - d) * sca;
        sca *= 0.5;
    }
    return clamp(1.0 - occ * 3.5, 0.0, 1.0);
}

// ─── flower/temple soft shadow on obsidian floor ─────────────────────────────
// 16-step penumbra march from the floor hit point toward the orbiting key light.
// Uses sdf_world() — flowers, temple, stamen rings all contribute shadow.
// k=4.5: moderate softness — contact region sharp, penumbra fans broadly.
// Returns 0 = fully shadowed, 1 = fully lit.
float floor_soft_shadow(vec3 p, vec3 ldir) {
    float shadow = 1.0;
    float t = 0.06;
    for (int i = 0; i < 16; i++) {
        float h = sdf_world(p + ldir * t);
        shadow = min(shadow, 4.5 * h / t);
        t += clamp(h, 0.015, 0.30);
        if (shadow < 0.001 || t > 4.5) break;
    }
    return clamp(shadow, 0.0, 1.0);
}

// ─── caustic projections from crystal petal refraction ────────────────────────
// Orbiting magenta key light passes through curved crystal petal surfaces (IOR 1.5)
// and focuses onto the obsidian floor as shimmering bright rings and arcs —
// the caustic shimmer classic to crystal/water/glass environments.
// Technique: two radial ring fields centered at the key light's floor-projection;
// their interference produces a moiré caustic pattern distorted by FBM turbulence
// for organic character.  Gated to the lit/shadow-edge zone (where refraction focuses
// most strongly) so caustics never appear under opaque shadow or in fully lit areas.
vec3 floor_caustics(vec3 gp, float fshad, float gd, float lt_sh) {
    // Key-light cast-point on floor: matches orbiting magenta shad_l direction
    vec2  focus = vec2(sin(lt_sh) * 0.52, cos(lt_sh) * 0.52);
    vec2  xz    = gp.xz - focus;

    // Two radial distances give different interference ring sets → moiré caustic
    float r1 = length(xz);
    float r2 = length(xz - focus * 0.36);  // secondary from offset focal point

    // Constructive interference only (bright bands): clamp negative to 0
    float ring = sin(r1 * 11.5 - u_time * 0.057) * sin(r2 * 7.8 + u_time * 0.048);
    ring = max(ring, 0.0);

    // FBM turbulence breaks algebraic symmetry — real caustics are irregular
    float turb = vnoise(vec3(gp.x * 3.9 + u_time * 0.038, 0.6, gp.z * 3.9 - u_time * 0.032));
    ring *= 0.60 + turb * 0.70;

    // Nonlinear compression: thin bright foci, dark between (caustics ≠ soft glow)
    float caus = pow(ring, 5.5) * 2.2;

    // Shadow-edge zone: refracted beams focus exactly where light exits the crystal
    // boundary.  Neither fully-lit (passed through straight) nor fully-shadowed (blocked).
    float edge = smoothstep(0.10, 0.38, fshad) * (1.0 - smoothstep(0.72, 0.95, fshad));

    // Beat boost: key light brightens on each 133 BPM kick
    float bb = 1.0 + smoothstep(0.07, 0.0, u_beat) * 0.75 * u_scene_norm;

    // Ramp in as flowers mature; floor-edge fade
    float gate = smoothstep(0.28, 0.58, u_scene_norm) * exp(-gd * 0.38);

    // Color: magenta-pink (key light tinted by translucent petal) → amber-gold at edges
    vec3 caus_col = mix(vec3(1.00, 0.52, 0.82), vec3(1.00, 0.82, 0.32), turb);

    return caus_col * caus * edge * bb * gate * 0.22;
}

// ─── kaleidoscope fold for sky ray directions ─────────────────────────────────
// Applies the same evolving azimuthal fold used for sky_background() to a ray
// direction. Used by crystal refraction to keep refracted sky and surface mandala
// in sync — aurora curtains appear *through* petals at the correct fold phase.
vec3 fold_sky_rd(vec3 rd, float fk) {
    float az = atan(rd.z, rd.x);
    float el = atan(rd.y, length(rd.xz));
    float S  = 6.28318530718 / fk;
    az = mod(az + 3.14159265359, 2.0 * S);
    if (az > S) az = 2.0 * S - az;
    az -= S * 0.5;
    float ce = cos(el);
    return normalize(vec3(ce * cos(az), sin(el), ce * sin(az)));
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
    // Three animated light sources — magenta overhead + cyan opposing + amber-gold sun
    float lt = u_time * 0.25;
    vec3 light1 = normalize(vec3(sin(lt) * 0.6,        2.0, cos(lt) * 0.6));          // overhead magenta sweep
    vec3 light2 = normalize(vec3(cos(lt * 0.7 + 1.3), -0.5, sin(lt * 0.7 + 1.3)));   // low cyan opposing
    vec3 light3 = normalize(vec3(sin(lt * 0.4 + 0.8) * 1.0, 1.5, cos(lt * 0.4 + 0.8)));  // mid amber sun

    // Colors evolve with scene_norm — magenta/cyan dominate early, amber emerges at bloom peak
    vec3 col1 = mix(vec3(0.9, 0.3, 1.0), vec3(0.6, 0.1, 1.0), u_scene_norm * 0.4);  // magenta→deep violet
    vec3 col2 = mix(vec3(0.2, 0.8, 1.0), vec3(0.0, 0.9, 0.8), u_scene_norm * 0.5);  // cyan→teal
    vec3 col3 = vec3(1.0, 0.75, 0.18) * smoothstep(0.25, 0.70, u_scene_norm);        // amber-gold: fades in mid-scene

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

        // Phase for all three lights
        float cos1 = dot(rd, light1);
        float cos2 = dot(rd, light2);
        float cos3 = dot(rd, light3);
        float ph1 = hg_phase(cos1, 0.4);
        float ph2 = hg_phase(cos2, 0.3);
        float ph3 = hg_phase(cos3, 0.6);  // tighter forward scatter for warm sunbeams

        // Soft shadow (skip amber shadow for cost savings; it's a fill light)
        float shad1 = vol_shadow(p, light1);
        float shad2 = vol_shadow(p, light2);

        // Scatter: tri-color rays with amber as a complementary warmth layer
        vec3 scatter = col1 * ph1 * shad1
                     + col2 * ph2 * shad2 * 0.6
                     + col3 * ph3 * 0.45;  // unshadowed for performance, still beautiful
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
        // Fold count evolves 6→12 over scene (aurora mandala crystallises to higher
        // symmetry as fractal geometry reaches peak bloom). Beat kicks add +2 folds
        // momentarily — the mandala "snaps" to higher order on each 133 BPM hit.
        float beat_snap = exp(-u_beat * 8.0) * 2.0;
        float fold_k = mix(6.0, 12.0, u_scene_norm * u_scene_norm) + beat_snap;
        float SECTOR = 6.28318530718 / fold_k;   // 2π/k
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

        // Animated diffuse lighting — same two sources as god_rays() for consistency
        float lt = u_time * 0.25;
        vec3 ldir1 = normalize(vec3(sin(lt) * 0.6,        2.0, cos(lt) * 0.6));   // overhead magenta
        vec3 ldir2 = normalize(vec3(cos(lt * 0.7 + 1.3), -0.5, sin(lt * 0.7 + 1.3))); // low cyan
        float diff  = max(dot(n, ldir1), 0.0) * 0.65 + max(dot(n, ldir2), 0.0) * 0.25;

        // Specular (static key light for sharp highlights)
        vec3 light = normalize(vec3(1.0, 2.0, 0.5));
        float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);
        mat += spec * vec3(1.0, 0.9, 1.0) * 0.8;

        // Fresnel glow
        float fresnel = pow(1.0-max(dot(n,-rd),0.0), 4.0);
        mat += fresnel * mix(col_a, col_b, u_scene_norm) * 1.2;

        // Iridescent prismatic rim: hue rotates with view angle using RGB cosine wheels.
        // At grazing angles the petals shimmer through cyan→magenta→gold — like beetle wings.
        float irid   = 0.5 + 0.5 * dot(n, -rd);
        float irid_h = irid * 3.14159;
        vec3 irid_col = vec3(
            0.5 + 0.5 * cos(irid_h + 0.0),
            0.5 + 0.5 * cos(irid_h + 2.094),
            0.5 + 0.5 * cos(irid_h + 4.189)
        );
        mat += irid_col * fresnel * 0.50 * u_scene_norm;

        // Subsurface scattering approximation: thin petal surfaces transmit light.
        // Back-lit petals (n faces away from both camera and key light) get a warm
        // magenta translucency glow — organic depth absent from opaque geometry.
        float sss = max(0.0, dot(-n, -rd)) * max(0.0, dot(ldir1, -rd));
        mat += sss * col_a * 0.28 * u_scene_norm;

        // Self-glow pulse on beat
        float pulse = smoothstep(0.08, 0.0, u_beat) * u_scene_norm;
        mat += pulse * vec3(0.5, 0.2, 0.8) * 1.5;

        // SDF-based ambient occlusion + diffuse: proper contact shadows in
        // petal crevices and fractal filigree (replaces inaccurate step-count AO).
        float ao_val = sdf_ao(p, n);
        col = mat * (0.15 + diff * ao_val);

        // Beat-reactive kaleidoscope sheen: fold count evolves 6→12 to match the sky
        // mandala so surface patterns and aurora curtains crystallise in unison.
        float beat_snap_k = exp(-u_beat * 8.0) * 2.0;
        float fold_k_srf  = mix(6.0, 12.0, u_scene_norm * u_scene_norm) + beat_snap_k;
        float az_srf  = atan(p.x, p.z) * fold_k_srf;
        float kaleido = abs(sin(az_srf + u_time * 0.8)) * 0.22 * u_scene_norm;
        vec3  kal_tint = mix(vec3(0.30, 0.0, 0.55), vec3(0.10, 0.50, 0.80),
                             sin(u_time * 0.3) * 0.5 + 0.5);
        col += kaleido * kal_tint;

        // Chromatic dispersion through crystal glass: R/G/B refract at different IOR.
        // Exaggerated Cauchy values (1.45/1.50/1.55) for visible spectral splitting —
        // aurora curtains through the petals split into prismatic rainbow fringes at
        // grazing angles, like sunlight through a lead-crystal prism.
        float ref_strength = fresnel * smoothstep(0.30, 0.70, u_scene_norm) * 0.18;
        if (ref_strength > 0.002) {
            vec3 ref_r = refract(rd, n, 1.0/1.45);  // red: least bending (lowest IOR)
            vec3 ref_g = refract(rd, n, 1.0/1.50);  // green: base IOR
            vec3 ref_b = refract(rd, n, 1.0/1.55);  // blue: most bending (highest IOR)
            if (length(ref_r) < 0.001) ref_r = reflect(rd, n);
            if (length(ref_g) < 0.001) ref_g = reflect(rd, n);
            if (length(ref_b) < 0.001) ref_b = reflect(rd, n);
            // Each channel through the evolving kaleidoscope fold — R/G/B see the sky
            // from slightly different angles, creating spectral colour fringes on edges.
            float sr = sky_background(fold_sky_rd(ref_r, fold_k_srf)).r;
            float sg = sky_background(fold_sky_rd(ref_g, fold_k_srf)).g;
            float sb = sky_background(fold_sky_rd(ref_b, fold_k_srf)).b;
            col += vec3(sr, sg, sb) * ref_strength;
        }
    } else if (rd.y < -0.001) {
        // ── Dark reflective ground plane: fractal flowers float above a still mirror ──
        // Fills pixels that missed geometry but hit the ground below — replaces sky.
        // Polished obsidian surface reflects the aurora/nebula sky beneath the flowers.
        // Beat-driven ripples break the mirror on each 133 BPM kick.
        const float GROUND_Y = -1.5;
        float t_gnd = (GROUND_Y - ro.y) / rd.y;
        if (t_gnd > 0.1) {
            vec3  gp      = ro + rd * t_gnd;
            float gd      = length(gp.xz);
            float gd_fade = smoothstep(6.5, 1.8, gd);   // full near centre, fades at edge

            float gnd_gate = smoothstep(0.12, 0.38, u_scene_norm) * gd_fade;
            if (gnd_gate > 0.001) {
                // Surface ripple: beat-driven noise slightly roughens the mirror
                float ripple  = fbm(vec3(gp.x, 0.0, gp.z) * 2.2 + vec3(u_time * 0.42))
                              * smoothstep(0.06, 0.0, u_beat) * 0.055 * u_scene_norm;
                vec3  n_gnd   = normalize(vec3(ripple, 1.0, ripple));
                vec3  rd_refl = reflect(rd, n_gnd);

                // Reflected sky — aurora curtains and nebulae appear beneath the flowers
                // Apply same kaleidoscope fold as sky so reflection stays coherent
                float beat_snap_r = exp(-u_beat * 8.0) * 2.0;
                float fold_k_r    = mix(6.0, 12.0, u_scene_norm * u_scene_norm) + beat_snap_r;
                vec3  refl_col    = mix(sky_background(rd_refl),
                                        sky_background(fold_sky_rd(rd_refl, fold_k_r)),
                                        smoothstep(0.38, 0.60, u_scene_norm));

                // Fresnel: near-perfect mirror at grazing angles
                float cos_i   = abs(dot(rd, n_gnd));
                float fresnel = pow(1.0 - cos_i, 3.0) * 0.78;

                // Base: dark polished obsidian
                vec3 gnd_mat = vec3(0.015, 0.008, 0.030);

                // Expanding beat-ripple ring (like dropping a stone in still water)
                float beat_ring = exp(-u_beat * 3.5)
                                * smoothstep(0.12, 0.0, abs(gd - u_beat * 4.5))
                                * u_scene_norm;
                gnd_mat += beat_ring * vec3(0.04, 0.16, 0.50);

                // Faint violet halo emanating from centre — "sacred ground"
                gnd_mat += exp(-gd * 0.8) * vec3(0.02, 0.005, 0.045) * u_scene_norm;

                // Phosphorescent energy veins: thin glowing channels in the obsidian base.
                // Two-frequency noise creates organic mineral-crack lines (Lichtenberg pattern).
                // They suggest the floor was pre-inscribed with sacred mathematics before
                // the flowers arrived — now lit by Act III's fractal energy.
                float vn1  = vnoise(vec3(gp.x * 2.2, u_time * 0.022, gp.z * 2.2));
                float vn2  = vnoise(vec3(gp.x * 3.7, u_time * 0.015 + 5.3, gp.z * 3.7));
                float vein = abs(fract((vn1 + vn2 * 0.50) * 4.0) - 0.5) * 2.0;
                float vg   = smoothstep(0.88, 1.0, vein) * u_scene_norm * gd_fade;
                gnd_mat   += vg * vec3(0.08, 0.03, 0.40) * 0.24;
                // Beat flare: veins surge violet-white on each 133 BPM kick
                gnd_mat   += vg * smoothstep(0.06, 0.0, u_beat) * vec3(0.18, 0.05, 0.90) * 0.20;

                // Soft shadow from flowers and temple cast onto the obsidian floor.
                // Shadow origin offset 0.08 above GROUND_Y to avoid self-intersection.
                // Key light matches geometry shading: slowly orbiting overhead magenta.
                // Shadow darkens the obsidian base; contact pools tint violet from
                // indirect petal-glow bounce light — luminous veins glow through.
                float lt_sh  = u_time * 0.25;
                vec3  shad_l = normalize(vec3(sin(lt_sh) * 0.6, 2.0, cos(lt_sh) * 0.6));
                float fshad  = floor_soft_shadow(gp + vec3(0.0, 0.08, 0.0), shad_l);

                // Minimum 0.06: veins remain faintly visible even in deepest shadow.
                // Violet tint in shadow pools — indirect scatter from glowing petals above.
                gnd_mat *= mix(0.06, 1.0, fshad);
                gnd_mat += (1.0 - fshad) * vec3(0.010, 0.002, 0.035) * u_scene_norm * gd_fade;

                // Crystal petal caustics: refracted key-light focuses on floor as
                // shimmering magenta→gold interference rings that orbit with the light.
                gnd_mat += floor_caustics(gp, fshad, gd, lt_sh);

                col = mix(gnd_mat, refl_col * vec3(0.40, 0.22, 0.70), fresnel) * gnd_gate;
            }
        }
    }

    // ─── Mandelbulb: fractal core emerges at Act III emotional peak ─────────────
    // Scale 0.36→0.50 world units — inside the flower cluster, visible through gaps.
    // Marched separately; overwrites col+t if closer than flowers/sky.
    float mb_gate = smoothstep(0.35, 0.70, u_scene_norm);
    if (mb_gate > 0.001) {
        float mb_sc = mix(0.36, 0.50, mb_gate)
                    * (1.0 + smoothstep(0.07, 0.0, u_beat) * 0.055 * u_scene_norm);
        int   mb_steps = 0;
        float t_bulb   = march_bulb(ro, rd, mb_sc, mb_steps);
        if (t_bulb < 5.0 && t_bulb < t) {
            vec3  bp  = ro + rd * t_bulb;
            vec3  bn  = normal_at_bulb(bp, mb_sc);

            // Color by surface normal direction: tips amber-gold, crevices deep ruby
            float nblend  = smoothstep(-0.15, 0.65, bn.y);
            vec3  mb_base = mix(vec3(0.55, 0.04, 0.16),  // ruby-red crevices
                                vec3(1.00, 0.72, 0.14),  // amber-gold tips
                                nblend) * 0.58;

            // Three-light diffuse matching scene lights
            float lt   = u_time * 0.25;
            vec3  ld1  = normalize(vec3(sin(lt)*0.6, 2.0, cos(lt)*0.6));
            vec3  ld2  = normalize(vec3(cos(lt*0.7+1.3), -0.5, sin(lt*0.7+1.3)));
            float diff = max(dot(bn, ld1), 0.0) * 0.72 + max(dot(bn, ld2), 0.0) * 0.20;
            float spec = pow(max(dot(reflect(-ld1, bn), -rd), 0.0), 52.0);
            mb_base   += spec * vec3(1.0, 0.90, 0.72) * 0.85;

            // Iridescent Fresnel rim: cyan-violet at grazing — contrasts amber body
            float fr  = pow(1.0 - max(dot(bn, -rd), 0.0), 5.0);
            float irh = fr * 3.14159;
            vec3  irc = vec3(0.5+0.5*cos(irh),
                             0.5+0.5*cos(irh+2.094),
                             0.5+0.5*cos(irh+4.189));
            mb_base += irc * fr * 0.52;

            // Beat self-emission: surges white-gold on each 133 BPM kick
            float beat_emit = smoothstep(0.06, 0.0, u_beat) * u_scene_norm;
            mb_base += beat_emit * vec3(1.0, 0.82, 0.40) * 1.65;

            // Step-count AO: high step count = deep crevice = darker
            float ao_b = 1.0 - clamp(float(mb_steps) / 72.0, 0.0, 1.0) * 0.58;

            col = mb_base * (0.10 + diff * ao_b) * mb_gate;
            t   = t_bulb;  // update depth for god_rays
        }
    }

    // Volumetric light scattering — dual-source god rays
    col += god_rays(ro, rd, t);

    // ── Synaptic web: thin neural threads connecting fractal geometry nodes ──
    // Six nodes orbit the fractal garden matching the 6-fold kaleidoscope symmetry.
    // Connecting segments glow blue-violet and beat-surge on 133 BPM kicks —
    // "mathematical network forming between living structures" (design intent).
    // Fades in at scene_norm 0.30→0.55 so it emerges as bloom reaches full intensity.
    float syn_gate = smoothstep(0.30, 0.55, u_scene_norm);
    if (syn_gate > 0.001) {
        float syn_beat = 1.0 + smoothstep(0.07, 0.0, u_beat) * u_scene_norm * 0.90;
        const int SYN_N = 6;
        vec2 nodes[6];
        float base_r = 0.38 + 0.12 * sin(u_time * 0.19);
        for (int i = 0; i < SYN_N; i++) {
            float fi  = float(i);
            // Each node orbits with a slow independent phase so the web breathes
            float phi = fi * 1.0471975 + u_time * (0.07 + fi * 0.008);
            float ri  = base_r + 0.09 * sin(u_time * 0.31 + fi * 2.17);
            nodes[i] = vec2(cos(phi) * ri, sin(phi) * ri);
        }
        float web = 0.0;
        // Connect each node to its two neighbours (ring topology)
        for (int i = 0; i < SYN_N; i++) {
            int j = (i + 1) % SYN_N;
            vec2 a  = nodes[i], b = nodes[j];
            vec2 pa = uv - a, ba = b - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            float d = length(pa - ba * h);
            float w = 0.0012;
            web += w / (d + w);
            // Skip every other diagonal cross-connection (less visual clutter)
            if (i % 2 == 0) {
                int k = (i + 3) % SYN_N;  // opposite node
                pa = uv - a; ba = nodes[k] - a;
                h  = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
                d  = length(pa - ba * h);
                web += (w * 0.5) / (d + w);
            }
        }
        // Node glow dots
        for (int i = 0; i < SYN_N; i++) {
            float d = length(uv - nodes[i]);
            web += exp(-d * d * 280.0) * 0.45;
        }
        vec3 syn_col = mix(vec3(0.20, 0.40, 1.0), vec3(0.65, 0.15, 0.90),
                           sin(u_time * 0.24) * 0.5 + 0.5);
        col += web * syn_col * syn_gate * syn_beat * 0.35;
    }

    // Audio energy: fractal geometry blazes 35% brighter at audio peaks;
    // dims slightly (0.82×) during quiet inter-phrase drops.
    col *= 0.82 + u_rms * 0.42;

    // Vignette
    float vig = 1.0 - dot(uv*0.4, uv*0.4);
    col *= vig;

    // HDR output (tonemapping in post)
    frag_color = vec4(col, 1.0);
}
