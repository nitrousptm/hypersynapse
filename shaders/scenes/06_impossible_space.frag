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

float sdf_room(vec3 p) {
    // Multi-wall chamber with recursive geometry
    float room = -sdBox(p, vec3(2.0, 1.5, 2.0));

    // Primary recursive box
    vec3 pp = rotate4d(fold_space(p * 0.4) * 0.5, u_time * 0.3);
    float inner = sdBox(pp, vec3(0.3, 0.5, 0.3));

    // Secondary nested structure (smaller, faster rotation)
    vec3 pp2 = rotate4d(fold_space(p * 0.7) * 0.3, u_time * 0.6);
    float inner2 = sdBox(pp2 - vec3(0.5, 0.2, 0.3), vec3(0.15, 0.25, 0.15));
    inner = smin(inner, inner2, 0.08);

    // Tertiary micro-structure (even smaller)
    vec3 pp3 = rotate4d(p * 1.2, u_time * 0.9);
    float inner3 = sdBox(pp3 + vec3(0.2, -0.3, 0.0), vec3(0.08, 0.12, 0.1));
    inner = smin(inner, inner3, 0.04);

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

    // Faint intergalactic filament hinting at large-scale cosmic structure
    {
        vec2 a2 = vec2(0.15, -0.10);
        vec2 b2 = vec2(-0.55, 0.35);
        vec2 ab = b2 - a2;
        float t2 = clamp(dot(uv - a2, ab) / dot(ab, ab), 0.0, 1.0);
        float fil_d = length((uv - a2) - ab * t2);
        col += exp(-fil_d * fil_d * 600.0) * vec3(0.08, 0.05, 0.15) * 0.6;
    }

    return col;
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    // Apply zoom-out transformation for holy-shit moment
    vec2 view_uv = apply_zoom_out(uv);
    float zoom = zoom_out_t();

    // Camera moving through impossible rooms
    float t_cam = u_time * 0.15;
    vec3 ro = vec3(sin(t_cam) * 1.2, 0.3 * sin(t_cam * 0.7), cos(t_cam) * 1.5);
    vec3 ta = vec3(0.0, 0.0, -1.8); // look at main portal
    ta = mix(ta, vec3(0.0), u_scene_norm * 0.3);

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

            // Dark concrete-like material with mathematical engravings
            vec3 mat = vec3(0.03, 0.03, 0.06);
            float engrave = abs(sin(p.x * 8.0 + u_time * 0.1)) * abs(sin(p.y * 8.0));
            mat += engrave * 0.03 * vec3(0.2, 0.5, 1.0);

            // Ambient occlusion from step count
            float noise_glow = vnoise(p * 3.0 + u_time * 0.2) * 0.1;
            mat += noise_glow * vec3(0.0, 0.2, 0.8);

            // Edge highlighting
            float fresnel = pow(1.0-abs(dot(n,-rd)), 5.0);
            mat += fresnel * vec3(0.1, 0.3, 1.0) * 0.8;

            col = mat;
        }
    }

    // Beat pulse: space briefly flashes
    float pulse = smoothstep(0.04, 0.0, u_beat) * 0.3;
    col += pulse * vec3(0.1, 0.2, 0.5);

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

    // Reality-fracture flash: brief white burst exactly when zoom begins (scene_norm 0.80)
    float fracture = exp(-abs(u_scene_norm - 0.80) * 60.0) * 1.5;
    col += fracture * vec3(0.6, 0.8, 1.0);

    // Vignette (stronger during zoom-out for dramatic effect)
    float vig_str = mix(0.4, 0.6, zoom);
    float vig = 1.0 - dot(uv * vig_str, uv * vig_str);
    col *= vig;

    frag_color = vec4(col, 1.0);
}
