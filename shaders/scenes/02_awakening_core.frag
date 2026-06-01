#version 460 core
// SCENE 2 — AWAKENING CORE (0:18–0:45)
// Mood: Geburt, elektrisch. Spannung → Bass Drop.
// Eine gigantische geometrische Struktur erscheint aus Millionen Partikeln.
// Der Monolith "öffnet" sich unmöglich geometrisch beim Bass Drop.
// Wichtiger Moment: Erster Bass Drop → Monolith split.
// Kamera: starts sehr weit weg, push-in zur Oberfläche, dann dramatischer pull-back beim Öffnen.
out vec4 frag_color;

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;

// ─── Hash / Noise ─────────────────────────────────────────────────────────────
float hash11(float p) { return fract(sin(p*127.1)*43758.5453); }
float hash21(vec2 p)  { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec3  hash31(float p) {
    vec3 v = fract(vec3(p*0.1031, p*0.1030, p*0.0973));
    v += dot(v, v.yzx + 33.33); return fract((v.xxy+v.yzz)*v.zyx);
}

float vnoise3(vec3 p) {
    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash21(i.xy+vec2(0,57)+i.z*23.0),hash21(i.xy+vec2(1,57)+i.z*23.0),f.x),
                   mix(hash21(i.xy+vec2(0,58)+i.z*23.0),hash21(i.xy+vec2(1,58)+i.z*23.0),f.x),f.y),
               mix(mix(hash21(i.xy+vec2(0,57)+(i.z+1.0)*23.0),hash21(i.xy+vec2(1,57)+(i.z+1.0)*23.0),f.x),
                   mix(hash21(i.xy+vec2(0,58)+(i.z+1.0)*23.0),hash21(i.xy+vec2(1,58)+(i.z+1.0)*23.0),f.x),f.y),f.z);
}

float fbm3(vec3 p) {
    float v=0.0, a=0.5;
    mat3 rot = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
    for(int i=0;i<5;i++){v+=a*vnoise3(p);p=rot*p*2.1+vec3(0.9,1.7,2.3);a*=0.5;}
    return v;
}

// ─── SDF Primitives ───────────────────────────────────────────────────────────
float sdBox(vec3 p, vec3 b) {
    vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);
}
float sdCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz),p.y))-vec2(r,h);
    return min(max(d.x,d.y),0.0)+length(max(d,0.0));
}
float smin(float a, float b, float k) {
    float h = clamp(0.5+0.5*(b-a)/k,0.0,1.0);
    return mix(b,a,h)-k*h*(1.0-h);
}

// ─── Sacred Geometry Engravings on Monolith Surface ──────────────────────────
// Returns depth of engraving at surface point p (surface-normal parameterized)
float sacred_geometry(vec2 uv_surface) {
    // Metatron's Cube pattern
    float pattern = 0.0;
    // Outer hexagon circles
    float r_big = 0.22;
    for(int i=0;i<6;i++){
        float a = float(i) * 1.0471975; // pi/3
        vec2 c = vec2(cos(a), sin(a)) * r_big;
        float d = length(uv_surface - c) - r_big;
        pattern += smoothstep(0.008, 0.0, abs(d));
    }
    // Center circle
    pattern += smoothstep(0.008, 0.0, abs(length(uv_surface) - r_big));
    // Inner star of David
    for(int i=0;i<6;i++){
        float a = float(i) * 1.0471975 + 0.5235988;
        vec2 c = vec2(cos(a), sin(a)) * r_big * 0.577;
        float d = length(uv_surface - c) - r_big * 0.577;
        pattern += smoothstep(0.005, 0.0, abs(d)) * 0.5;
    }
    return pattern * 0.04;
}

// ─── Advanced Monolith SDF (Multi-detail) ─────────────────────────────────────
// Ratio 1:5:0.5, with fractal detail, micro-patterns, recursive structure
float sdf_monolith(vec3 p, float reveal) {
    float rise = 3.5 * (1.0 - reveal);
    vec3 pl = p + vec3(0.0, rise, 0.0);

    // Multi-level base shape with bevels
    float base = sdBox(pl, vec3(0.35, 1.75, 0.175));
    float bevel = sdBox(pl, vec3(0.345, 1.745, 0.18));
    base = mix(base, bevel, 0.3);

    // Multi-layer sacred geometry
    vec2 front_uv = pl.xy * vec2(1.0/0.35, 1.0/1.75);
    float front_eng = sacred_geometry(front_uv * 0.4) * step(0.17, pl.z);
    front_eng += sacred_geometry(front_uv * 0.6 + vec2(u_time*0.05)) * step(0.15, pl.z) * 0.5;
    float back_eng = sacred_geometry(front_uv * 0.4 + vec2(0.3)) * step(0.17, -pl.z);

    // Complex ribbing (multiple scales)
    float ribs1 = sdBox(vec3(mod(abs(pl.x), 0.07) - 0.035, pl.y, pl.z), vec3(0.008, 1.75, 0.18));
    float ribs2 = sdBox(vec3(mod(abs(pl.x), 0.035) - 0.0175, pl.y, pl.z), vec3(0.003, 1.75, 0.18));
    float ribs = min(ribs1, ribs2);
    float ribs_mask = step(0.32, abs(pl.x));

    // Vertical edge erosion
    float edge_erode = fbm3(pl * 8.0 + u_time * 0.1) * 0.02;
    base -= edge_erode * reveal;

    // Opening split with internal void structure
    float split_progress = smoothstep(0.82, 1.0, reveal);
    float split_gap = split_progress * 0.5;
    vec3 p_split = pl;
    p_split.x = abs(pl.x) - split_gap;

    // Internal chambers (negative space)
    float internal = sdBox(p_split + vec3(0.0, -0.3, 0.0), vec3(0.2, 0.5, 0.1));
    internal = min(internal, sdBox(p_split + vec3(0.0, 0.4, 0.0), vec3(0.15, 0.4, 0.08)));

    float split_half = sdBox(p_split, vec3(0.35, 1.75, 0.175));
    split_half = min(split_half, internal * (1.0 - reveal));

    // Combine all elements
    float monolith = mix(base, split_half, split_progress);
    monolith -= (front_eng + back_eng) * step(0.7, reveal) * 0.04;
    monolith -= max(0.0, -ribs) * 0.5 * ribs_mask;

    // Fractal surface detail
    float surface_detail = fbm3(pl * 12.0 + u_time * 0.08) * 0.03 * reveal;
    monolith -= surface_detail;

    // Micro-displacements
    vec3 micro_seed = floor(pl * 20.0);
    float micro = hash31(micro_seed + vec3(u_time*0.05)).x * 0.004;
    monolith -= micro * step(0.5, hash31(micro_seed).y);

    return monolith;
}

// ─── Advanced Particle Cloud (Multi-generation swarm) ───────────────────────
// Recursive particle systems forming emergent monolith silhouette
float particle_cloud(vec3 p, float density) {
    float acc = 0.0;
    float t_anim = u_time * 0.4;

    // Primary generation (large particles)
    for(int i=0;i<16;i++){
        float fi = float(i);
        vec3 base_pos = vec3(
            sin(fi * 1.3 + t_anim * 0.7) * 0.4,
            fi * 0.22 - 1.7 + sin(fi * 2.1 + t_anim) * 0.1,
            cos(fi * 1.7 + t_anim * 0.5) * 0.2
        );
        float r = 0.06 + hash11(fi * 0.3) * 0.08;
        float d = length(p - base_pos) - r;
        acc = smin(acc, d, 0.2);
    }

    // Secondary generation (medium particles, faster rotation)
    for(int i=0;i<20;i++){
        float fi = float(i);
        vec3 base_pos2 = vec3(
            sin(fi * 0.9 + t_anim * 1.3) * 0.3,
            fi * 0.18 - 1.8 + cos(fi * 1.7 + t_anim * 0.8) * 0.15,
            cos(fi * 1.2 + t_anim * 0.9) * 0.25
        );
        float r2 = 0.03 + hash11(fi * 0.5) * 0.04;
        float d2 = length(p - base_pos2) - r2;
        acc = smin(acc, d2, 0.15);
    }

    // Tertiary generation (fine particles, chaotic motion)
    for(int i=0;i<12;i++){
        float fi = float(i);
        vec3 base_pos3 = vec3(
            sin(fi * 2.1 + t_anim * 0.3) * 0.35 + cos(fi*1.7+t_anim)*0.1,
            fi * 0.25 - 1.6 + sin(fi * 3.0 + t_anim * 1.5) * 0.2,
            cos(fi * 2.5 + t_anim * 0.7) * 0.3 + sin(fi*0.9)*0.1
        );
        float r3 = 0.02 + hash11(fi * 0.7) * 0.03;
        float d3 = length(p - base_pos3) - r3;
        acc = smin(acc, d3, 0.1);
    }

    return acc * density;
}

// ─── Environment: Dark Cathedral Space ───────────────────────────────────────
// Towering dark walls, massive scale
float sdf_environment(vec3 p) {
    // Infinite floor
    float floor_d = p.y + 2.0;
    // Distant walls (very far, just for atmosphere)
    float wall_d = 12.0 - length(p.xz);
    return min(floor_d, -wall_d);
}

// ─── Scene SDF ────────────────────────────────────────────────────────────────
float sdf_scene(vec3 p, float reveal) {
    float monolith = sdf_monolith(p, reveal);
    float cloud    = particle_cloud(p, 1.0 - reveal);
    return smin(monolith, cloud + 0.3, 0.4);
}

// ─── Raymarching ──────────────────────────────────────────────────────────────
const int MAX_STEPS = 128;
const float SURF_DIST = 0.0006;
const float MAX_DIST  = 30.0;

struct HitInfo { float t; bool hit; };

HitInfo march(vec3 ro, vec3 rd, float reveal) {
    float t = 0.01;
    for(int i=0;i<MAX_STEPS;i++) {
        float d = sdf_scene(ro + rd*t, reveal);
        if(d < SURF_DIST) return HitInfo(t, true);
        if(t > MAX_DIST)  return HitInfo(MAX_DIST, false);
        t += max(d * 0.8, SURF_DIST);
    }
    return HitInfo(MAX_DIST, false);
}

vec3 calc_normal(vec3 p, float reveal) {
    // Tetrahedron method: 4 SDF evaluations (vs 6 central-differences)
    const float e = 0.001;
    const vec2  k = vec2(1, -1);
    return normalize(
        k.xyy * sdf_scene(p + k.xyy * e, reveal) +
        k.yyx * sdf_scene(p + k.yyx * e, reveal) +
        k.yxy * sdf_scene(p + k.yxy * e, reveal) +
        k.xxx * sdf_scene(p + k.xxx * e, reveal)
    );
}

// ─── Volumetric Fog / Atmosphere ──────────────────────────────────────────────
float atmosphere_density(vec3 p) {
    float h = max(0.0, 2.0 - (p.y + 2.0) * 1.5);
    float n = fbm3(p * 1.2 + vec3(u_time * 0.12, 0.0, u_time * 0.08));
    return h * n * 0.5;
}

vec3 volumetric_fog(vec3 ro, vec3 rd, float t_max) {
    vec3 col = vec3(0.0);
    float transmit = 1.0;
    float t = 0.1;
    for(int i=0;i<24;i++) {
        vec3 p = ro + rd * t;
        float dens = atmosphere_density(p) * 0.08;
        vec3 fog_col = mix(vec3(0.0, 0.04, 0.15), vec3(0.02, 0.1, 0.4), p.y * 0.3 + 0.5);
        col += transmit * fog_col * dens;
        transmit *= exp(-dens);
        t += 0.18;
        if(t >= t_max || transmit < 0.01) break;
    }
    return col;
}

// ─── Lighting ─────────────────────────────────────────────────────────────────
vec3 shade_monolith(vec3 p, vec3 n, vec3 rd, float reveal) {
    // Base: obsidian black with slight cold tint
    vec3 mat = vec3(0.018, 0.020, 0.028);

    // Sacred geometry engravings glow when reveal > 0.4
    // Use local frame (risen) position so UV tracks the monolith surface
    vec3 pl_shade = p + vec3(0.0, 3.5 * (1.0 - reveal), 0.0);
    vec2 eng_uv = pl_shade.xy * vec2(1.0/0.35, 1.0/1.75) * 0.4;
    float eng = sacred_geometry(eng_uv);
    float eng_glow = eng * smoothstep(0.4, 0.8, reveal);
    mat += eng_glow * vec3(0.1, 0.5, 1.0) * 3.0;

    // Specular: mirror-like
    vec3 light = normalize(vec3(1.0, 3.0, 2.0));
    float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 64.0);
    mat += spec * vec3(0.3, 0.5, 1.0) * 0.5;

    // Fresnel glow (electric edge)
    float fres = pow(1.0 - abs(dot(n, -rd)), 4.0);
    vec3 fres_col = mix(vec3(0.0, 0.2, 0.8), vec3(0.5, 0.8, 1.0), reveal);
    mat += fres * fres_col * (0.4 + 0.8 * reveal);

    // Opening crack: intense white/cyan light from the split
    float split_prog = smoothstep(0.82, 1.0, reveal);
    float crack_d = smoothstep(0.06, 0.0, abs(p.x));  // near center X
    mat += crack_d * split_prog * vec3(0.8, 1.0, 1.0) * 6.0;

    // Beat pulse
    mat += smoothstep(0.04, 0.0, u_beat) * reveal * 0.3 * vec3(0.2, 0.5, 1.0);

    return mat;
}

// ─── Camera Path ──────────────────────────────────────────────────────────────
// Scene 2 camera: starts far above/behind, slowly pushes in, then pulls back dramatically
struct Camera { vec3 pos, target; float fov; };

Camera get_camera() {
    float sn = u_scene_norm;

    // Phase 1 (0→0.6): Slow push-in from far away
    float push_in = smoothstep(0.0, 0.6, sn);
    float dist = mix(12.0, 2.8, push_in);
    float height = mix(2.0, 0.3, push_in);
    float angle = -0.2 + sn * 0.15;  // slight pan

    vec3 pos = vec3(sin(angle)*dist, height, cos(angle)*dist);

    // Phase 2 (0.8→1.0): dramatic pull-back when monolith opens
    float pull_back = smoothstep(0.80, 1.0, sn);
    float pull_dist = mix(2.8, 8.0, pull_back * pull_back);
    pos = normalize(pos) * pull_dist + vec3(0.0, mix(height, 1.0, pull_back), 0.0);

    vec3 target = vec3(0.0, mix(-0.3, 0.5, sn), 0.0);
    float fov = mix(1.6, 1.2, push_in);

    return Camera(pos, target, fov);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
void main() {
    vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x *= u_res.x / u_res.y;

    float reveal = u_scene_norm;
    Camera cam = get_camera();

    vec3 fw = normalize(cam.target - cam.pos);
    vec3 ri = normalize(cross(fw, vec3(0,1,0)));
    vec3 up = cross(ri, fw);
    vec3 rd = normalize(uv.x*ri + uv.y*up + cam.fov*fw);

    // Sky: deep dark space (the AI's internal void)
    float sky_grad = uv.y * 0.3 + 0.5;
    vec3 col = mix(vec3(0.001, 0.001, 0.006), vec3(0.003, 0.005, 0.02), sky_grad);

    // Stars (very sparse, cold)
    float star_seed = hash21(floor(uv * 200.0));
    float star = step(0.998, star_seed) * hash21(floor(uv*200.0)+vec2(3.7));
    col += star * vec3(0.6, 0.7, 1.0) * 0.8;

    HitInfo hit = march(cam.pos, rd, reveal);

    if(hit.hit) {
        vec3 p = cam.pos + rd * hit.t;
        vec3 n = calc_normal(p, reveal);
        col = shade_monolith(p, n, rd, reveal);
    }

    // Volumetric atmosphere
    float t_vol = hit.hit ? hit.t : MAX_DIST;
    col += volumetric_fog(cam.pos, rd, min(t_vol, 8.0));

    // Ground reflection (very subtle)
    if(!hit.hit) {
        float ground_t = -(cam.pos.y + 2.0) / rd.y;
        if(ground_t > 0.0 && ground_t < MAX_DIST) {
            vec3 gp = cam.pos + rd * ground_t;
            float gd = length(gp.xz);
            float grid_x = step(0.45, fract(gp.x * 0.5 + 0.5));
            float grid_z = step(0.45, fract(gp.z * 0.5 + 0.5));
            float ground_grid = max(grid_x, grid_z) * 0.03;
            float ground_fall = exp(-gd * 0.25);
            col += ground_grid * ground_fall * vec3(0.05, 0.15, 0.5) * reveal;
        }
    }

    // Beat flash
    col += smoothstep(0.03, 0.0, u_beat) * reveal * vec3(0.1, 0.25, 0.8) * 0.5;

    // Opening crack light (floods the screen at split moment)
    float split_flood = smoothstep(0.85, 1.0, reveal) * 0.8;
    col += split_flood * vec3(0.4, 0.7, 1.0) * exp(-length(uv) * 1.5);

    // Vignette
    col *= 1.0 - dot(uv*0.4, uv*0.4);

    frag_color = vec4(col, 1.0);
}
