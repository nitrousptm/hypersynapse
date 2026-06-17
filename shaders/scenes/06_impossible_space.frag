#version 460 core
out vec4 frag_color;

// *** SIGNATURE SCENE — RECURSIVE UNIVERSES ***
// Portal FBOs provided as u_portal_0/1/2 from the renderer's recursive capture.
// At depth 0 (normal render): u_portal_0 is blank, u_portal_1/2 contain previous-frame captures.
// The holy-shit moment: at scene_norm ~0.83 (2:50 of demo), camera "zooms out" to reveal
// the current universe is just a particle in a larger space.

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;
uniform float u_rms;

uniform sampler2D u_portal_0;  // deepest recursion (smallest universe)
uniform sampler2D u_portal_1;  // mid recursion
uniform sampler2D u_portal_2;  // shallowest recursion (closest to current view)

// ─── utils ────────────────────────────────────────────────────────────────────

float hash(float n) { return fract(sin(n) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(dot(i,vec3(1,57,113))),hash(dot(i+vec3(1,0,0),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,0),vec3(1,57,113))),hash(dot(i+vec3(1,1,0),vec3(1,57,113))),f.x),f.y),
               mix(mix(hash(dot(i+vec3(0,0,1),vec3(1,57,113))),hash(dot(i+vec3(1,0,1),vec3(1,57,113))),f.x),
                   mix(hash(dot(i+vec3(0,1,1),vec3(1,57,113))),hash(dot(i+vec3(1,1,1),vec3(1,57,113))),f.x),f.y),f.z);
}

// ─── non-euclidean space warp ─────────────────────────────────────────────────

// Folds space: rooms that contain themselves
vec3 fold_space(vec3 p) {
    // Menger-like fold
    for (int i = 0; i < 4; i++) {
        p = abs(p);
        if (p.x < p.y) p.xy = p.yx;
        if (p.x < p.z) p.xz = p.zx;
        if (p.y < p.z) p.yz = p.zy;
        p = p * 2.0 - 1.0;
    }
    return p;
}

// 4D-like rotation projected to 3D
vec3 rotate4d(vec3 p, float t) {
    // Rotate in XW plane (W is extra dimension, projected out)
    float w = sin(length(p) * 0.5 + t);
    float c = cos(t * 0.3), s = sin(t * 0.3);
    float nx = p.x * c - w * s;
    float nw = p.x * s + w * c;
    return vec3(nx, p.y, p.z + nw * 0.3);
}

// ─── Missing helpers (smin, fbm3) ────────────────────────────────────────────

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float fbm3(vec3 p) {
    float v = 0.0, a = 0.5;
    mat3 rot = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
    for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = rot * p * 2.1 + vec3(0.9, 1.7, 2.3); a *= 0.5; }
    return v;
}

// ─── SDF for impossible space ─────────────────────────────────────────────────

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p)-b;
    return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);
}

float sdSphere(vec3 p, float r) { return length(p)-r; }

float sdTorus(vec3 p, float R, float r) {
    return length(vec2(length(p.xz) - R, p.y)) - r;
}

float sdf_room(vec3 p) {
    // Beat-reactive: inner geometry expands on each 133 BPM kick
    float beat_expand = smoothstep(0.08, 0.0, u_beat) * 0.018;
    float room = -sdBox(p, vec3(2.0, 1.5, 2.0));

    // Primary recursive box
    vec3 pp = rotate4d(fold_space(p * 0.4) * 0.5, u_time * 0.3);
    float inner = sdBox(pp, vec3(0.3, 0.5, 0.3) + beat_expand);

    // Secondary nested structure (smaller, faster rotation)
    vec3 pp2 = rotate4d(fold_space(p * 0.7) * 0.3, u_time * 0.6);
    float inner2 = sdBox(pp2 - vec3(0.5, 0.2, 0.3), vec3(0.15, 0.25, 0.15) + beat_expand * 0.6);
    inner = smin(inner, inner2, 0.08);

    // Tertiary micro-structure (even smaller)
    vec3 pp3 = rotate4d(p * 1.2, u_time * 0.9);
    float inner3 = sdBox(pp3 + vec3(0.2, -0.3, 0.0), vec3(0.08, 0.12, 0.1) + beat_expand * 0.3);
    inner = smin(inner, inner3, 0.04);

    // Interpenetrating Villarceau tori — impossible-space signature.
    // Two tori with the same major radius but different orientations (XZ and XY planes).
    // Their intersection traces Villarceau circles: beautiful figure-8 curves that
    // are impossible to construct in Euclidean space without tori already touching.
    // The pair slowly counter-rotates so they appear to phase through each other.
    float ang_a = u_time * 0.12;
    float ca = cos(ang_a), sa = sin(ang_a);
    vec3 ta = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
    float torus_a = sdTorus(ta, 0.52, 0.070 + beat_expand * 0.5);

    float ang_b = u_time * 0.09 + 1.5708;  // 90° out of phase
    float cb = cos(ang_b), sb = sin(ang_b);
    // Rotated into XY plane (swapped y and z axes then Y-rotated)
    vec3 tb = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z);
    float torus_b = sdTorus(tb, 0.52, 0.062 + beat_expand * 0.4);

    // Smooth union: tori blend into each other at their intersection curves
    float tori = smin(torus_a, torus_b, 0.030);
    inner = smin(inner, tori, 0.055);

    // Fractal detail on walls
    float wall_detail = fbm3(p * 4.0 + u_time * 0.1) * 0.08;
    room -= wall_detail * step(-1.9, room);

    return min(room, inner);
}

// Portal disc SDF
float sdf_portal(vec3 p, vec3 center, float r) {
    vec3 local = p - center;
    float ring = length(vec2(length(local.xz) - r, local.y));
    return ring - 0.03;
}

float sdf_scene(vec3 p) {
    float rooms = sdf_room(p);

    // Three portal discs at different positions
    float p1 = sdf_portal(p, vec3(0.0, 0.0, -1.8), 0.6);
    float p2 = sdf_portal(p, vec3(-1.5, 0.2, 0.0), 0.45);
    float p3 = sdf_portal(p, vec3(1.5, -0.3, 0.5), 0.35);

    return min(min(rooms, p1), min(p2, p3));
}

// ─── portal UV mapping ───────────────────────────────────────────────────────

vec2 portal_uv(vec3 p, vec3 center) {
    vec3 local = p - center;
    float r = length(local.xz);
    float angle = atan(local.z, local.x) / 6.28318 + 0.5;
    return vec2(angle, (local.y + 0.6) / 1.2);
}

// ─── raymarching ──────────────────────────────────────────────────────────────

const int MAX_STEPS = 128;
const float SURF_DIST = 0.001;
const float MAX_DIST = 15.0;

struct Hit { float t; int type; vec3 portal_center; };

Hit march(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sdf_scene(p);

        if (d < SURF_DIST) {
            // Portal type detection only runs on surface hit — not every step
            float dp1 = sdf_portal(p, vec3(0.0, 0.0, -1.8), 0.6);
            float dp2 = sdf_portal(p, vec3(-1.5, 0.2, 0.0), 0.45);
            float dp3 = sdf_portal(p, vec3(1.5, -0.3, 0.5), 0.35);
            if (dp1 < SURF_DIST) return Hit(t, 1, vec3(0.0, 0.0, -1.8));
            if (dp2 < SURF_DIST) return Hit(t, 2, vec3(-1.5, 0.2, 0.0));
            if (dp3 < SURF_DIST) return Hit(t, 3, vec3(1.5, -0.3, 0.5));
            return Hit(t, 0, vec3(0.0));
        }
        if (t > MAX_DIST) return Hit(MAX_DIST, -1, vec3(0.0));
        t += max(d * 0.6, 0.001);
    }
    return Hit(MAX_DIST, -1, vec3(0.0));
}

vec3 normal_at(vec3 p) {
    // Tetrahedron method: 4 SDF evaluations vs 6 for central differences
    const float e = 0.002;
    const vec2 k = vec2(1, -1);
    return normalize(
        k.xyy * sdf_scene(p + k.xyy * e) +
        k.yyx * sdf_scene(p + k.yyx * e) +
        k.yxy * sdf_scene(p + k.yxy * e) +
        k.xxx * sdf_scene(p + k.xxx * e)
    );
}

// ─── SDF ambient occlusion ────────────────────────────────────────────────────
// 5-step normal-march: measures actual geometry occlusion — contact shadows
// in fold_space crevices and recursive box intersections.
float sdf_ao(vec3 p, vec3 n) {
    float occ = 0.0, sca = 1.0;
    for (int i = 1; i <= 5; i++) {
        float h = float(i) * 0.025;
        float d = sdf_scene(p + n * h);
        occ += (h - d) * sca;
        sca *= 0.5;
    }
    return clamp(1.0 - occ * 3.5, 0.0, 1.0);
}

// ─── holy-shit zoom-out ───────────────────────────────────────────────────────

// At scene_norm 0.83+ the camera "zooms out" to show our universe is a particle
float zoom_out_t() {
    return smoothstep(0.80, 1.0, u_scene_norm);
}

vec2 apply_zoom_out(vec2 uv) {
    float zoom = zoom_out_t();
    // Shrink current view to a tiny point (representing a particle)
    float scale = mix(1.0, 0.05, zoom * zoom);
    // Offset to upper-right (particle position in larger universe)
    vec2 offset = mix(vec2(0.0), vec2(0.3, 0.2), zoom);
    return uv * scale + offset;
}

// ─── cosmic particle field (outer universe revealed during zoom-out) ──────────

vec3 cosmic_particles(vec2 uv) {
    vec3 col = vec3(0.0);
    // Multi-scale star field: 5 levels for rich depth
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 offset = vec2(fi * 1.7 + 0.3, fi * 2.3 + 0.9);
        float scale = mix(60.0, 140.0, fi / 4.0);
        vec2 p = fract((uv + offset) * vec2(scale, scale * 0.5625));
        vec2 id = floor((uv + offset) * vec2(scale, scale * 0.5625));
        float h = hash2(id);
        // Only ~20% of cells have a star
        if (h < 0.20) {
            float size = 0.006 + h * 0.03;
            // Twinkling
            float twinkle = 0.8 + 0.2 * sin(u_time * (2.0 + h * 5.0) + h * 40.0);
            float d = length(p - 0.5);
            vec3 star_col = mix(vec3(0.8, 0.9, 1.0), vec3(h, 0.7+h*0.3, 1.0), h);
            col += star_col * size / (d + 0.004) * 0.09 * twinkle;
        }
    }
    // Faint nebula haze
    col += vec3(0.0, 0.03, 0.08) * vnoise(vec3(uv * 2.0, u_time * 0.05)) * 0.4;

    // Primary galaxy — large, bluish-violet Milky-Way analog
    {
        vec2 dv = uv - vec2(0.15, -0.10);
        float gr = length(dv);
        float ga = atan(dv.y, dv.x);
        float gp = ga - gr * 4.5 + u_time * 0.025;
        float ga1 = pow(max(cos(gp),          0.0), 10.0);
        float ga2 = pow(max(cos(gp + 3.14159), 0.0), 10.0);
        float ge = exp(-gr * gr * 10.0) * exp(-gr * 4.0);
        col += (ga1 + ga2) * ge * mix(vec3(0.40, 0.55, 1.00), vec3(0.50, 0.35, 0.70), smoothstep(0.25, 0.0, gr)) * 3.0;
        col += exp(-gr * gr * 40.0) * vec3(0.50, 0.35, 0.70) * 5.0;
        col += exp(-gr * gr * 2.5) * vec3(0.40, 0.55, 1.00) * ge * 0.5;
    }

    // Second galaxy — reddish-orange elliptical (Andromeda-like companion)
    {
        vec2 dv = uv - vec2(-0.55, 0.35);
        float gr = length(dv);
        float ga = atan(dv.y, dv.x);
        float gp = ga - gr * 3.8 - u_time * 0.018;
        float ga1 = pow(max(cos(gp),          0.0), 10.0);
        float ga2 = pow(max(cos(gp + 3.14159), 0.0), 10.0);
        float ge = exp(-gr * gr * 18.0) * exp(-gr * 5.0);
        col += (ga1 + ga2) * ge * mix(vec3(0.55, 0.38, 0.70), vec3(0.70, 0.40, 0.25), smoothstep(0.18, 0.0, gr)) * 1.4;
        col += exp(-gr * gr * 60.0) * vec3(0.70, 0.40, 0.25) * 3.0;
    }

    // Third galaxy — edge-on sliver (appears as a bright streak)
    {
        vec2 dv = uv - vec2(0.60, -0.45);
        float gr = length(dv);
        float flat_d = length(vec2(dv.x * 0.15, dv.y));
        col += exp(-flat_d * flat_d * 60.0) * exp(-gr * 3.0) * vec3(0.6, 0.7, 1.0) * 1.8;
        col += exp(-gr * gr * 80.0) * vec3(0.8, 0.6, 0.4) * 1.2;
    }

    // ── Cosmic Web — large-scale structure connecting all three galaxy clusters ──
    // The real universe forms a web of dark-matter filaments threading galaxy clusters.
    // Three galaxies + two intermediate cluster nodes form the web skeleton.
    // FBM density variation gives filaments their characteristic knotted appearance.
    {
        const vec2 G1 = vec2( 0.15, -0.10);   // Milky-Way analog
        const vec2 G2 = vec2(-0.55,  0.35);   // Andromeda companion
        const vec2 G3 = vec2( 0.60, -0.45);   // Edge-on sliver

        // Intermediate galaxy cluster nodes — bright points where filaments knot
        const vec2 N1 = vec2(-0.10,  0.18);   // cluster between G1 and G2
        const vec2 N2 = vec2( 0.38, -0.28);   // cluster between G1 and G3

        // Segment SDF helper (inline): distance from uv to segment a→b
        float web = 0.0;

        // G1 → N1 → G2 (two-segment chain, original G1↔G2 replaced)
        { vec2 ab=N1-G1, av=uv-G1; float t=clamp(dot(av,ab)/dot(ab,ab),0.,1.); web=max(web, exp(-dot(av-ab*t, av-ab*t)*800.0)); }
        { vec2 ab=G2-N1, av=uv-N1; float t=clamp(dot(av,ab)/dot(ab,ab),0.,1.); web=max(web, exp(-dot(av-ab*t, av-ab*t)*800.0)); }

        // G1 → N2 → G3
        { vec2 ab=N2-G1, av=uv-G1; float t=clamp(dot(av,ab)/dot(ab,ab),0.,1.); web=max(web, exp(-dot(av-ab*t, av-ab*t)*800.0)); }
        { vec2 ab=G3-N2, av=uv-N2; float t=clamp(dot(av,ab)/dot(ab,ab),0.,1.); web=max(web, exp(-dot(av-ab*t, av-ab*t)*800.0)); }

        // G2 → G3 (long spanning arc, slightly wider — major void-crossing filament)
        { vec2 ab=G3-G2, av=uv-G2; float t=clamp(dot(av,ab)/dot(ab,ab),0.,1.); web=max(web, exp(-dot(av-ab*t, av-ab*t)*480.0)*0.75); }

        // FBM density knots: noise dims filaments between nodes (void underdensity)
        float density = 0.50 + 0.50 * vnoise(vec3(uv * 3.8, 0.37));
        col += web * density * vec3(0.05, 0.04, 0.14) * 0.75;

        // Cluster node glows — intermediate galaxy groups
        col += exp(-dot(uv-N1, uv-N1) * 220.0) * vec3(0.10, 0.08, 0.24) * 0.55;
        col += exp(-dot(uv-N2, uv-N2) * 220.0) * vec3(0.10, 0.08, 0.24) * 0.55;
    }

    return col;
}

// ─── Distant universe-particle helper ────────────────────────────────────────
// Renders a single small universe-particle at screen-UV position ep.
// es: visual scale (smaller = more distant).  sp: spiral arm rotation speed.
// mg: master gate (outer_fade * zoom) — invisible until cosmic reveal.
// rz: cosmological redshift 0=blue (nearby) → 1=amber-red (far, fast recession).
//     Hubble recession shifts shorter wavelengths to longer: blue→amber→red.
void uni_mini(vec2 uv, vec2 ep, float es, float sp, float mg, float rz, inout vec3 col) {
    vec2  dp  = uv - ep;
    float dr  = length(dp);
    float inv = 1.0 / es;

    // Cosmological color palette — blends from blue (z≈0) to amber-red (high-z)
    vec3 nuc_col  = mix(vec3(0.42, 0.65, 1.00), vec3(1.00, 0.48, 0.18), rz);
    vec3 arm_col  = mix(vec3(0.35, 0.58, 0.90), vec3(0.85, 0.38, 0.12), rz);
    vec3 halo_col = mix(vec3(0.10, 0.22, 0.48), vec3(0.32, 0.12, 0.04), rz);
    vec3 ring_col = mix(vec3(0.28, 0.52, 0.90), vec3(0.80, 0.32, 0.08), rz);

    // Bright nucleus — redshifted toward amber-red for distant universes
    col += exp(-dr * dr * 900.0 * inv * inv) * es * 2.5 * mg * nuc_col;
    // Two-arm logarithmic spiral (same technique as the main universe-particle)
    float ang  = atan(dp.y, dp.x) - dr * 5.0 * inv + u_time * sp;
    float arm1 = pow(max(cos(ang),           0.0), 8.0);
    float arm2 = pow(max(cos(ang + 3.14159), 0.0), 8.0);
    float env  = exp(-dr * dr * 200.0 * inv * inv) * exp(-dr * 12.0 * inv);
    col += (arm1 + arm2) * env * mg * arm_col * 1.8;
    // Soft atmospheric halo
    col += exp(-dr * dr * 80.0 * inv * inv) * mg * halo_col * es * 1.8;
    // Single slow pulse ring — each universe breathes at its own rate
    float ring_t = fract(u_time * sp * 0.55);
    float ring_r = ring_t * 0.32 * es;
    float ring_f = (1.0 - ring_t) * mg * 0.55;
    col += ring_f * smoothstep(0.007, 0.0, abs(dr - ring_r)) * ring_col;
}

// ─── Volumetric portal fog ─────────────────────────────────────────────────────
// 8-step march along each view ray; each step accumulates colored in-scatter from
// the 3 portal point-lights with inverse-square falloff.  Result: the portal light
// beams become physically visible as coloured atmospheric mist — "rooms within light
// beams" DESIGN doc intent, now actually visible in the air rather than just on walls.
// Gate fades out as the zoom-out to cosmic background takes over (scene_norm 0.65→0.82).
vec3 volumetric_portal_fog(vec3 ro, vec3 rd, float hit_t) {
    float gate = 1.0 - smoothstep(0.65, 0.82, u_scene_norm);
    if (gate < 0.001) return vec3(0.0);

    // Exact portal world-positions (must match sdf_world portal centers)
    const vec3 P0 = vec3( 0.0,  0.0, -1.8);  // portal 1: cyan-blue
    const vec3 P1 = vec3(-1.5,  0.2,  0.0);  // portal 2: violet
    const vec3 P2 = vec3( 1.5, -0.3,  0.5);  // portal 3: teal-cyan

    const vec3 C0 = vec3(0.00, 0.48, 1.00);
    const vec3 C1 = vec3(0.50, 0.04, 0.95);
    const vec3 C2 = vec3(0.04, 0.70, 0.88);

    // Beat surge: atmosphere brightens on each 133 BPM kick
    float beat_str = 1.0 + smoothstep(0.06, 0.0, u_beat) * 0.65;
    float base_dens = 0.016 * gate * beat_str;

    const int STEPS = 8;
    float march_end = min(hit_t, 4.0);
    float dt = march_end / float(STEPS);

    vec3 acc = vec3(0.0);
    for (int i = 0; i < STEPS; i++) {
        float t = (float(i) + 0.5) * dt;
        vec3 pos = ro + rd * t;

        // Inverse-square scatter from each portal — attenuation constant 0.25
        // avoids division-by-zero and prevents blinding near-portal overbrightness
        float d0 = dot(pos - P0, pos - P0);
        float d1 = dot(pos - P1, pos - P1);
        float d2 = dot(pos - P2, pos - P2);

        acc += C0 / (d0 * 1.6 + 0.25);
        acc += C1 / (d1 * 1.6 + 0.25);
        acc += C2 / (d2 * 1.6 + 0.25);
    }

    return acc * base_dens * dt;
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // Apply zoom-out transformation for holy-shit moment
    vec2 view_uv = apply_zoom_out(uv);
    float zoom = zoom_out_t();

    // Camera path: spiral inward toward main portal as scene progresses,
    // building tension before the holy-shit zoom-out at scene_norm 0.80.
    // Phase 1 (0→0.65): orbit at shrinking radius — exploring impossible space.
    // Phase 2 (0.65→0.80): camera aligns with portal axis, nearly enters it.
    // Phase 3 (0.80+): reality fractures; zoom_out_t() takes over.
    float t_cam  = u_time * 0.15;
    float spiral = smoothstep(0.0, 0.72, u_scene_norm);
    float orbit_r = mix(1.30, 0.55, spiral * spiral);          // 1.3 → 0.55
    float orbit_h = 0.28 * sin(t_cam * 0.7) * (1.0 - spiral * 0.65);
    vec3 ro = vec3(sin(t_cam) * orbit_r, orbit_h, cos(t_cam) * orbit_r * 1.15);

    // Late approach: camera drifts toward the portal axis (0,0,-1.8)
    float pull = smoothstep(0.50, 0.80, u_scene_norm);
    ro = mix(ro, vec3(ro.x * (1.0 - pull * 0.70), 0.0, -1.15 - pull * 0.15), pull * pull);

    vec3 ta = mix(vec3(0.0, 0.0, -1.8), vec3(0.0), u_scene_norm * 0.25);

    vec3 fw = normalize(ta - ro);
    vec3 ri = normalize(cross(fw, vec3(0,1,0)));
    vec3 up_v = cross(ri, fw);
    vec3 rd = normalize(view_uv.x*ri + view_uv.y*up_v + 2.0*fw);

    // Sky inside the impossible room: dark with edge light
    vec3 col = vec3(0.01, 0.01, 0.03);

    Hit hit = march(ro, rd);

    if (hit.t < MAX_DIST) {
        vec3 p = ro + rd * hit.t;

        if (hit.type > 0) {
            // Portal hit — show recursive universe texture
            vec2 puv = portal_uv(p, hit.portal_center);
            puv = clamp(puv, 0.001, 0.999);

            vec3 portal_col;
            if (hit.type == 1) portal_col = texture(u_portal_0, puv).rgb;
            else if (hit.type == 2) portal_col = texture(u_portal_1, puv).rgb;
            else portal_col = texture(u_portal_2, puv).rgb;

            // Portal glow ring
            vec3 n = normal_at(p);
            float glow = smoothstep(0.1, 0.0, length(vec2(length(p.xz - hit.portal_center.xz), p.y - hit.portal_center.y) - vec2(0.55, 0.0)));

            vec3 ring_col = mix(vec3(0.0, 0.5, 1.0), vec3(0.8, 0.2, 1.0), float(hit.type)/3.0);
            col = portal_col + ring_col * glow * 2.0;

        } else {
            // Room wall / floating box hit
            vec3 n = normal_at(p);

            // Dark base material — walls of the impossible room
            vec3 mat = vec3(0.03, 0.03, 0.06);

            // Flowing data-matrix streams: columns of quantized symbols raining down.
            // Column lane is XZ-quantized so streams stay fixed to wall surface panels.
            // Portal point lights (below) will colour these streams cyan/violet/teal —
            // "data flowing through beams" reinforces the impossible-space narrative.
            {
                vec2 grid_xz    = floor(vec2(p.x, p.z) * 3.5);
                float col_h     = hash2(grid_xz);
                float spd       = (1.2 + col_h * 2.8) * (0.70 + u_rms * 0.60);  // data flows faster during loud passages
                float phase     = col_h * 7.3;
                float cell_y    = fract(p.y * 5.0 - u_time * spd + phase);
                float cell_id   = floor(p.y * 5.0 - u_time * spd + phase);
                float symbol    = step(0.38, hash2(vec2(cell_id * 0.137, col_h)));
                float cell_glow = smoothstep(0.14, 0.0, abs(cell_y - 0.5)) * symbol;
                float lead      = smoothstep(0.0, 0.10, cell_y) * step(0.88, symbol) * 1.8;
                float stream_str = (cell_glow + lead) * 0.055 * (0.5 + u_scene_norm * 0.8);
                mat += stream_str * vec3(0.05, 0.25, 0.80);
            }

            // Animated diffuse: two portal-colored lights orbiting the impossible room
            float lt = u_time * 0.22;
            vec3 ldir1 = normalize(vec3(sin(lt) * 1.5, 1.2, cos(lt) * 1.5));
            vec3 ldir2 = normalize(vec3(cos(lt * 0.6 + 2.1), -0.8, sin(lt * 0.6 + 2.1)));
            float diff = max(dot(n, ldir1), 0.0) * 0.55 + max(dot(n, ldir2), 0.0) * 0.20;

            // Specular highlight (cyan key light)
            float spec = pow(max(dot(reflect(-ldir1, n), -rd), 0.0), 48.0);
            mat += spec * vec3(0.3, 0.7, 1.0) * 0.6;

            // Fresnel edge glow
            float fresnel = pow(1.0 - abs(dot(n, -rd)), 5.0);
            mat += fresnel * vec3(0.1, 0.3, 1.0) * 0.8;

            // Beat-reactive self-emission on kick
            mat += smoothstep(0.08, 0.0, u_beat) * vec3(0.05, 0.12, 0.4) * 0.8;

            // Portal-coloured surface illumination: each portal disc acts as a coloured
            // point light — walls that face a portal pick up its hue with distance falloff.
            // Creates the "rooms within light beams" design intent: cyan/violet/teal streaks
            // wash across the fold_space architecture from the portal positions.
            float beat_pl = 1.0 + smoothstep(0.08, 0.0, u_beat) * 0.5;
            {   // Portal 1: cyan-blue at (0, 0, -1.8)
                vec3 lp = normalize(vec3(0.0, 0.0, -1.8) - p);
                float dp = length(vec3(0.0, 0.0, -1.8) - p);
                mat += max(dot(n, lp), 0.0) / (dp*dp*0.22 + 0.5) * vec3(0.0, 0.50, 1.0) * beat_pl * 0.50;
            }
            {   // Portal 2: violet at (-1.5, 0.2, 0)
                vec3 lp = normalize(vec3(-1.5, 0.2, 0.0) - p);
                float dp = length(vec3(-1.5, 0.2, 0.0) - p);
                mat += max(dot(n, lp), 0.0) / (dp*dp*0.22 + 0.5) * vec3(0.40, 0.06, 0.95) * beat_pl * 0.42;
            }
            {   // Portal 3: teal-cyan at (1.5, -0.3, 0.5)
                vec3 lp = normalize(vec3(1.5, -0.3, 0.5) - p);
                float dp = length(vec3(1.5, -0.3, 0.5) - p);
                mat += max(dot(n, lp), 0.0) / (dp*dp*0.22 + 0.5) * vec3(0.08, 0.65, 0.85) * beat_pl * 0.35;
            }

            // SDF ambient occlusion + diffuse: proper contact shadows in fold_space crevices
            float ao_val = sdf_ao(p, n);
            col = mat * (0.12 + diff * ao_val);
        }
    }

    // Volumetric portal fog: portal light beams visible as coloured atmospheric mist.
    // Only in room phase; gates out cleanly as zoom-out reveals cosmic background.
    float fog_t = (hit.t < MAX_DIST) ? hit.t : 4.0;
    col += volumetric_portal_fog(ro, rd, fog_t);

    // Beat pulse: energy wave through non-euclidean space
    float pulse_kick = smoothstep(0.04, 0.0, u_beat);
    // Ambient flash (softer now that the ring carries the visual weight)
    col += pulse_kick * vec3(0.06, 0.12, 0.30) * 0.25;
    // Expanding ring: the fold_space geometry resonates as energy passes through
    float pulse_r = u_beat * 1.8;
    float pulse_d = abs(length(uv) - pulse_r);
    float pulse   = exp(-u_beat * 4.0) * smoothstep(0.020, 0.0, pulse_d);
    col += pulse * vec3(0.15, 0.38, 0.90) * 1.2;

    // Zoom-out overlay: show outer cosmic universe
    float outer_fade = smoothstep(0.75, 0.95, u_scene_norm);

    // ── Universe-as-particle: the shrunken view becomes a glowing spiral orb ───
    // Position tracks apply_zoom_out offset: universe "lands" at (0.3, 0.2)
    vec2 particle_pos = vec2(0.3, 0.2);

    // ── Gravitational Lensing around the universe-particle ───────────────────
    // The shrunken universe acts as a massive gravitating body. Background
    // starlight bends around it creating Einstein ring arcs. Chromatic
    // dispersion (R/G/B deflect slightly differently) gives a prismatic halo.
    // Only full 3-sample lensing once zoom is significant (last ~8s of scene).
    const float rs = 0.028;
    vec3 outer;
    {
        vec2 base_uv = uv * 0.5 + 0.5 + vec2(u_time * 0.01);
        if (zoom < 0.05) {
            // Pre-zoom: single sample, no lens math
            outer = cosmic_particles(base_uv);
        } else {
            vec2 lens_d  = uv - particle_pos;
            float lens_r = length(lens_d);
            float safe_r = max(lens_r, rs * 0.4);
            float deflect = zoom * rs * rs / (safe_r * safe_r);
            vec2 dv = -normalize(lens_d + vec2(1e-5)) * deflect;
            // Chromatic dispersion: R/G/B deflect at slightly different strengths
            float r = cosmic_particles(base_uv + dv * 0.88).r;
            float g = cosmic_particles(base_uv + dv * 1.00).g;
            float b = cosmic_particles(base_uv + dv * 1.14).b;
            outer = vec3(r, g, b);
            // Einstein ring: bright halo where deflected rays converge at r ≈ rs·1.6
            float ring_r   = rs * 1.6;
            float einstein  = smoothstep(ring_r * 0.45, 0.0, abs(lens_r - ring_r));
            outer += einstein * zoom * vec3(0.55, 0.70, 1.0) * 1.2;
        }
        outer += vec3(0.0, 0.02, 0.05);
    }
    col = mix(col, outer, outer_fade);

    vec2 dp = uv - particle_pos;
    float dp_r = length(dp);

    // Inner bright nucleus
    float nucleus = exp(-dp_r * dp_r * 900.0) * 6.0;
    // Spiral structure hinting it IS a galaxy/universe
    {
        float pa = atan(dp.y, dp.x);
        float pp = pa - dp_r * 5.0 + u_time * 0.4;
        float pa1 = pow(max(cos(pp),          0.0), 8.0);
        float pa2 = pow(max(cos(pp + 3.14159), 0.0), 8.0);
        float penv = exp(-dp_r * dp_r * 200.0) * exp(-dp_r * 12.0);
        col += (pa1 + pa2) * penv * zoom * vec3(0.4, 0.7, 1.0) * 2.5;
    }
    // Outer soft glow halo
    col += nucleus * zoom * vec3(0.5, 0.8, 1.0);
    col += exp(-dp_r * dp_r * 80.0) * zoom * vec3(0.15, 0.3, 0.6) * 2.0;

    // Concentric pulse rings emanating outward from the universe-particle
    // — three rings at different radii, animated outward
    for (int ri = 0; ri < 3; ri++) {
        float ring_phase = fract(u_time * 0.7 + float(ri) * 0.333);
        float ring_r = ring_phase * 0.35;
        float ring_fade = (1.0 - ring_phase) * zoom;
        float ring_d = abs(dp_r - ring_r);
        col += ring_fade * smoothstep(0.008, 0.0, ring_d) * vec3(0.3, 0.6, 1.0) * 1.2;
    }

    // ── Distant universe-particles — multiverse reveal ─────────────────────────
    // Five additional tiny universes scattered across the cosmic void, each with
    // its own spiral galaxy structure and pulse rings. Appear only during zoom-out
    // (gated by outer_fade*zoom): sells "we are one of countless universes" and
    // realises the design-doc "recursive universes / worlds within worlds" concept
    // at the full cosmic scale of the holy-shit reveal window.
    // Positions in aspect-corrected screen UV (same space as particle_pos = (0.3,0.2)).
    {
        float mg = outer_fade * zoom;
        const vec2 MP0 = vec2(-0.80, -0.55);
        const vec2 MP1 = vec2(-1.30,  0.35);
        const vec2 MP2 = vec2( 0.95, -0.62);
        const vec2 MP3 = vec2(-0.38,  0.68);
        const vec2 MP4 = vec2( 1.22,  0.20);
        // ep = screen-UV position, es = visual scale, sp = spiral speed, rz = Hubble redshift
        // Redshift proportional to distance from reveal centre (0.30, 0.20):
        // MP3 nearest (rz=0.42, warm orange); MP1 farthest (rz=1.00, deep amber-red)
        uni_mini(uv, MP0, 0.28, 0.38, mg, 0.72, col);  // dist≈0.97 → orange-red
        uni_mini(uv, MP1, 0.33, 0.25, mg, 1.00, col);  // dist≈1.35 → deep red (most distant)
        uni_mini(uv, MP2, 0.22, 0.45, mg, 0.84, col);  // dist≈1.13 → amber-red
        uni_mini(uv, MP3, 0.30, 0.32, mg, 0.42, col);  // dist≈0.78 → warm orange (nearest)
        uni_mini(uv, MP4, 0.26, 0.41, mg, 0.92, col);  // dist≈1.24 → red-orange

        // Faint multiverse filaments — 5-segment web connecting the nearest neighbors.
        // Extremely dim (0.009) — context rather than foreground; readable as
        // "large-scale multiverse structure" by the audience without competing with galaxies.
        if (mg > 0.001) {
            float fil_str = mg * 0.009;
            const vec2 FIL_A[5] = vec2[5](MP0, MP0, MP1, MP2, MP3);
            const vec2 FIL_B[5] = vec2[5](MP2, MP3, MP3, MP4, MP4);
            for (int fi = 0; fi < 5; fi++) {
                vec2 fa = FIL_A[fi], fb = FIL_B[fi];
                vec2 seg = fb - fa;
                float tt = clamp(dot(uv - fa, seg) / dot(seg, seg), 0.0, 1.0);
                float fd = length(uv - fa - seg * tt);
                col += fil_str * exp(-fd * fd * 60.0) * vec3(0.05, 0.04, 0.14);
            }
        }
    }

    // Reality-fracture flash: brief white burst exactly when zoom begins (scene_norm 0.80)
    float fracture = exp(-abs(u_scene_norm - 0.80) * 60.0) * 1.5;
    col += fracture * vec3(0.6, 0.8, 1.0);

    // Audio energy: impossible-space architecture glows more intensely during loud passages.
    // The holy-shit zoom-out (scene_norm > 0.78) is excluded so the cosmic reveal
    // stays at calibrated brightness — only the room/portal phase is affected.
    float room_phase = 1.0 - smoothstep(0.72, 0.80, u_scene_norm);
    col *= (0.82 + u_rms * 0.40) * room_phase + (1.0 - room_phase);

    // Vignette (stronger during zoom-out for dramatic effect)
    float vig_str = mix(0.4, 0.6, zoom);
    float vig = 1.0 - dot(uv * vig_str, uv * vig_str);
    col *= vig;

    frag_color = vec4(col, 1.0);
}
