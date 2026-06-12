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

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}

// ─── 3D Frozen Crystal Shard Field ───────────────────────────────────────────
// Raymarched field of 10 thin geometric shards suspended in frozen time.
// Each shard belongs to one of 3 "time copies" and is coloured accordingly:
//   copy 0 (cat=0): cold blue  — the past
//   copy 1 (cat=1): hot orange — the present
//   copy 2 (cat=2): acid cyan  — the future
//
// Rotations are baked as precomputed cos/sin constants to avoid trig inside
// the march loop (GLSL optimisers cannot always fold these otherwise).

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// Precomputed rotation constants for each shard (ry, rx pairs)
// Format: cosY, sinY, cosX, sinX
const float SC[40] = float[40](
    // shard 0  ry= 0.80  rx= 0.30
     0.6967, 0.7174,  0.9553, 0.2955,
    // shard 1  ry=-0.50  rx= 0.90
     0.8776,-0.4794,  0.6216, 0.7833,
    // shard 2  ry= 1.20  rx=-0.40
     0.3624, 0.9320,  0.9211,-0.3894,
    // shard 3  ry=-0.90  rx= 0.60
     0.6216,-0.7833,  0.8253, 0.5646,
    // shard 4  ry= 1.60  rx=-0.30
    -0.0292, 0.9996,  0.9553,-0.2955,
    // shard 5  ry=-1.40  rx= 1.00
     0.1700,-0.9854,  0.5403, 0.8415,
    // shard 6  ry= 2.10  rx= 0.20
    -0.5048, 0.8632,  0.9801, 0.1987,
    // shard 7  ry=-2.00  rx=-0.70
    -0.4161,-0.9093,  0.7648,-0.6442,
    // shard 8  ry= 0.40  rx= 1.30
     0.9211, 0.3894,  0.2675, 0.9636,
    // shard 9  ry= 1.90  rx=-1.10
    -0.3233, 0.9463,  0.4536,-0.8912
);

// Shard positions: (x, y, z) × 10
const vec3 SP[10] = vec3[10](
    vec3( 0.90,  0.10,  0.20),  // 0 blue
    vec3( 1.30, -0.40,  0.70),  // 1 blue
    vec3( 0.50,  0.70, -0.90),  // 2 blue
    vec3(-0.80,  0.20, -0.10),  // 3 orange
    vec3(-0.40, -0.60,  0.80),  // 4 orange
    vec3(-1.20,  0.50,  0.50),  // 5 orange
    vec3( 0.20, -0.30,  1.10),  // 6 cyan
    vec3(-0.60,  0.90, -0.80),  // 7 cyan
    vec3( 1.00,  0.60, -0.40),  // 8 cyan
    vec3(-0.20, -0.80,  0.30)   // 9 cyan
);

// Shard half-extents (x=thin, y=length, z=medium) × 10
const vec3 SE[10] = vec3[10](
    vec3(0.06, 0.38, 0.10),
    vec3(0.05, 0.26, 0.12),
    vec3(0.07, 0.44, 0.08),
    vec3(0.06, 0.32, 0.11),
    vec3(0.05, 0.40, 0.09),
    vec3(0.08, 0.28, 0.13),
    vec3(0.05, 0.36, 0.10),
    vec3(0.07, 0.30, 0.12),
    vec3(0.06, 0.42, 0.09),
    vec3(0.05, 0.34, 0.11)
);

// Color categories per shard: 0=blue, 1=orange, 2=cyan
const float SCAT[10] = float[10](0.0,0.0,0.0, 1.0,1.0,1.0, 2.0,2.0,2.0,2.0);

float sdf_shards(vec3 p, out float color_cat) {
    float best = 9999.0;
    color_cat = 0.0;
    for (int i = 0; i < 10; i++) {
        int b = i * 4;
        vec3 sp = p - SP[i];
        // Rotate around Y
        float cy = SC[b],   sy = SC[b+1];
        sp.xz = vec2(sp.x*cy - sp.z*sy, sp.x*sy + sp.z*cy);
        // Rotate around X
        float cx = SC[b+2], sx = SC[b+3];
        sp.yz = vec2(sp.y*cx - sp.z*sx, sp.y*sx + sp.z*cx);
        float d = sdRoundBox(sp, SE[i], 0.012);
        if (d < best) { best = d; color_cat = SCAT[i]; }
    }
    return best;
}

// Distance-only wrapper for normal estimation
float sdf_shards_d(vec3 p) { float dc; return sdf_shards(p, dc); }

vec3 shard_normal(vec3 p) {
    const float e = 0.0015;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * sdf_shards_d(p + k.xyy * e) +
        k.yyx * sdf_shards_d(p + k.yyx * e) +
        k.yxy * sdf_shards_d(p + k.yxy * e) +
        k.xxx * sdf_shards_d(p + k.xxx * e)
    );
}

// SDF ambient occlusion: 5-step normal-march measures how much nearby geometry
// occludes the ambient sky. Contact shadows in crevices where shards cluster.
float sdf_ao_shards(vec3 p, vec3 n) {
    float occ = 0.0, sca = 1.0;
    for (int i = 1; i <= 5; i++) {
        float h = float(i) * 0.025;
        float dc;
        float d = sdf_shards(p + n * h, dc);
        occ += (h - d) * sca;
        sca *= 0.5;
    }
    return clamp(1.0 - occ * 3.5, 0.0, 1.0);
}

const int   SHARD_STEPS = 80;
const float SHARD_SURF  = 0.002;
const float SHARD_FAR   = 6.0;

float march_shards(vec3 ro, vec3 rd, out float cat) {
    float t = 0.08;
    cat = 0.0;
    for (int i = 0; i < SHARD_STEPS; i++) {
        float dc;
        float d = sdf_shards(ro + rd * t, dc);
        if (d < SHARD_SURF) { cat = dc; return t; }
        if (t > SHARD_FAR) return SHARD_FAR;
        t += max(d * 0.70, 0.001);
    }
    return SHARD_FAR;
}

// ─── Frozen-time deep space starfield ────────────────────────────────────────
// Multi-scale field of stars in the void where time has stopped.
// Colours shift from cold blue (far-past) to orange-white (present moment).
vec3 frozen_starfield(vec2 uv) {
    vec3 col = vec3(0.0);
    for (int i = 0; i < 4; i++) {
        float fi    = float(i);
        vec2 seed   = vec2(fi * 3.71 + 1.3, fi * 1.97 + 0.5);
        float scale = mix(55.0, 140.0, fi / 3.0);
        vec2 cell   = floor((uv + seed) * scale);
        vec2 frac   = fract((uv + seed) * scale) - 0.5;
        float h     = hash(dot(cell, vec2(127.1, 311.7)));
        if (h < 0.18) {
            float sz      = 0.004 + h * 0.022;
            float twinkle = 1.0;  // time is frozen — no twinkle
            float d       = length(frac);
            // Colour: past=cold blue, present=warm white, future=acid cyan
            vec3 sc = (h < 0.06) ? vec3(0.55, 0.75, 1.00)   // cold blue (past)
                    : (h < 0.12) ? vec3(1.00, 0.80, 0.60)   // warm orange (present)
                                 : vec3(0.40, 1.00, 0.85);  // acid cyan (future)
            col += sc * sz / (d + 0.003) * 0.08 * twinkle;
        }
    }
    // Sparse large bright stars (distance heroes)
    for (int i = 0; i < 2; i++) {
        vec2 seed = vec2(float(i) * 7.13, float(i) * 3.97);
        vec2 cell = floor((uv + seed) * 30.0);
        vec2 frac = fract((uv + seed) * 30.0) - 0.5;
        float h   = hash(dot(cell, vec2(127.1, 311.7)));
        if (h < 0.08) {
            float d = length(frac);
            col += vec3(0.70, 0.85, 1.00) * 0.022 / (d + 0.002);
        }
    }
    return col;
}

// ─── Frozen time light trails ─────────────────────────────────────────────────
// Objects whose motion was captured mid-flight when time froze — their velocity
// becomes a bright glowing arc permanently inscribed in the void.
// 18 trails at fixed pseudo-random positions; each is a line-segment SDF trail
// with soft-edge glow and brightness fade toward the "tail" end.
float trail_seg(vec2 uv, vec2 a, vec2 b, float w) {
    vec2 pa = uv - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    float tail_fade = 1.0 - h * 0.75;  // bright at start, dim at tail
    return tail_fade * exp(-d * w);
}

vec3 frozen_trails(vec2 uv) {
    vec3 col = vec3(0.0);
    // 18 frozen trails seeded from compile-time constants.
    // Positions are in aspect-corrected UV space (~[-1.5, 1.5] x [-1, 1]).
    const int N = 18;
    const vec2 TA[18] = vec2[18](
        vec2(-1.20,  0.55), vec2( 0.80,  0.70), vec2(-0.40, -0.80),
        vec2( 1.10, -0.30), vec2(-0.70,  0.10), vec2( 0.30,  0.90),
        vec2(-1.30, -0.50), vec2( 0.60, -0.60), vec2(-0.10,  0.70),
        vec2( 1.25,  0.20), vec2(-0.90, -0.20), vec2( 0.45,  0.40),
        vec2(-0.55,  0.85), vec2( 0.95, -0.75), vec2(-1.05,  0.35),
        vec2( 0.15, -0.50), vec2( 0.75,  0.55), vec2(-0.35, -0.35)
    );
    const vec2 TB[18] = vec2[18](
        vec2(-0.85,  0.30), vec2( 1.10,  0.50), vec2(-0.15, -0.55),
        vec2( 0.78, -0.55), vec2(-0.48,  0.28), vec2( 0.05,  0.70),
        vec2(-1.00, -0.28), vec2( 0.35, -0.45), vec2( 0.14,  0.44),
        vec2( 0.90,  0.40), vec2(-0.58, -0.48), vec2( 0.18,  0.18),
        vec2(-0.25,  0.55), vec2( 0.60, -0.50), vec2(-0.72,  0.08),
        vec2(-0.12, -0.28), vec2( 0.42,  0.30), vec2(-0.05, -0.12)
    );
    // Category: 0=past(blue), 1=present(orange), 2=future(cyan)
    const float TCAT[18] = float[18](
        0.0,0.0,0.0,0.0,0.0,0.0,
        1.0,1.0,1.0,1.0,1.0,1.0,
        2.0,2.0,2.0,2.0,2.0,2.0
    );
    const float TBRIGHT[18] = float[18](
        0.55,0.45,0.60,0.40,0.50,0.35,
        0.70,0.55,0.65,0.48,0.52,0.38,
        0.60,0.45,0.55,0.50,0.42,0.48
    );

    for (int i = 0; i < N; i++) {
        float g = trail_seg(uv, TA[i], TB[i], 520.0);
        vec3 tc = (TCAT[i] < 0.5) ? vec3(0.30, 0.60, 1.00)   // past: cold blue
               : (TCAT[i] < 1.5) ? vec3(1.00, 0.55, 0.25)   // present: hot orange
                                  : vec3(0.20, 0.90, 0.80);  // future: acid cyan
        col += tc * g * TBRIGHT[i];
    }
    return col * u_scene_norm;  // fade in as scene progresses
}

// Render frozen shard field: returns HDR colour for blending with feedback
vec3 render_shards(vec2 uv) {
    // Slowly orbiting camera spirals slightly inward over the scene
    float ang = u_time * 0.11 + u_scene_norm * 0.9;
    float r   = 2.8 - 0.6 * u_scene_norm * u_scene_norm;
    float hh  = 0.30 * sin(u_time * 0.17 + 1.0);
    vec3 ro = vec3(sin(ang) * r, hh, cos(ang) * r);
    vec3 fw = normalize(-ro);
    vec3 ri = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(ri, fw);
    vec3 rd = normalize(uv.x * ri + uv.y * up + 1.9 * fw);

    float cat;
    float t = march_shards(ro, rd, cat);

    // Frozen deep-space void: multi-scale starfield + nebula haze + light trails
    vec3 col = vec3(0.002, 0.004, 0.014);
    col += vnoise(uv * vec2(2.1, 3.7) + u_time * 0.04) * 0.018 * vec3(0.1, 0.3, 1.0);
    col += frozen_starfield(uv) * 0.85;
    col += frozen_trails(uv) * 0.30;

    if (t < SHARD_FAR) {
        vec3 p = ro + rd * t;
        vec3 n = shard_normal(p);

        // Three time-copy materials
        vec3 mat;
        if      (cat < 0.5) mat = vec3(0.30, 0.60, 1.00);  // cold blue  (past)
        else if (cat < 1.5) mat = vec3(1.00, 0.45, 0.15);  // hot orange (present)
        else                mat = vec3(0.15, 0.90, 0.80);  // acid cyan  (future)

        // SDF ambient occlusion: contact shadows between crystal clusters
        float ao_val = sdf_ao_shards(p, n);

        // Key light + diffuse
        vec3 ldir = normalize(vec3(0.5, 1.5, 0.4));
        float diff    = max(dot(n, ldir), 0.0);
        float spec    = pow(max(dot(reflect(-ldir, n), -rd), 0.0), 52.0);
        float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.5);

        // Chromatic prismatic specular: two extra lobes offset ±3° from the key
        // light simulate wavelength-dependent refraction through frozen crystal —
        // R and B highlights split apart, creating rainbow spectral dispersion.
        vec3 ldir_r = normalize(ldir + vec3( 0.055,  0.0,  0.040));
        vec3 ldir_b = normalize(ldir + vec3(-0.055,  0.0, -0.040));
        float spec_r = pow(max(dot(reflect(-ldir_r, n), -rd), 0.0), 38.0);
        float spec_b = pow(max(dot(reflect(-ldir_b, n), -rd), 0.0), 38.0);
        vec3 prism_spec = vec3(spec_r * 0.8, spec * 0.4, spec_b * 0.8);

        // Second fill light: slow-orbiting cold blue (0.09 rad/s ≈ one loop per 70s).
        // Gives each crystal cluster a changing angle of secondary illumination —
        // "time still flowing around the frozen shards."
        float lt2  = u_time * 0.09;
        vec3 ldir2 = normalize(vec3(cos(lt2) * 0.8, 0.5, sin(lt2) * 0.8));
        float diff2 = max(dot(n, ldir2), 0.0) * 0.22;

        col = mat * (0.10 + diff * ao_val) + prism_spec + fresnel * mat * 1.8;
        col += mat * diff2 * vec3(0.35, 0.55, 1.0) * 0.9;

        // Beat-reactive pulse: shards flare on each kick
        float kick = smoothstep(0.05, 0.0, u_beat) * u_scene_norm;
        col += mat * kick * 2.8;

        // Exponential fog for atmospheric depth
        col = mix(col, vec3(0.003, 0.006, 0.020), 1.0 - exp(-t * 0.22));
    }

    return col;
}

// ─── Fracture crack system (multi-generation branching) ───────────────────────

float crack_seg(vec2 uv, vec2 a, vec2 b, float w) {
    vec2 pa = uv - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    return w / (d + w);
}

float fracture_arm(vec2 uv, vec2 origin, float seed, float spread, int depth) {
    float acc = 0.0;
    vec2 p = origin;
    vec2 dir = normalize(vec2(cos(seed * 6.28318), sin(seed * 6.28318)));
    float w = 0.0005;
    for (int i = 0; i < 10; i++) {
        float fi = float(i);
        float bend = (hash1(seed * 13.7 + fi * 5.3) - 0.5) * 0.65;
        float c = cos(bend), s = sin(bend);
        dir = normalize(vec2(dir.x*c - dir.y*s, dir.x*s + dir.y*c));
        float seg_len = (0.05 + hash1(seed * 7.1 + fi * 3.7) * 0.10) * spread;
        vec2 next = p + dir * seg_len;
        acc += crack_seg(uv, p, next, w);
        if (hash1(seed * 11.3 + fi * 2.9) > 0.45) {
            float ba = bend + (hash1(seed * 1.7 + fi * 0.3) - 0.5) * 1.4;
            float bc = cos(ba), bs = sin(ba);
            vec2 bdir = normalize(vec2(dir.x*bc - dir.y*bs, dir.x*bs + dir.y*bc));
            acc += crack_seg(uv, p, p + bdir * seg_len * 0.45, w * 0.5) * 0.7;
        }
        if (depth > 0 && hash1(seed * 7.5 + fi * 1.3) > 0.65) {
            float ba2 = bend * 0.7 + (hash1(seed * 3.2 + fi * 0.7) - 0.5) * 1.8;
            float bc2 = cos(ba2), bs2 = sin(ba2);
            vec2 bdir2 = normalize(vec2(dir.x*bc2 - dir.y*bs2, dir.x*bs2 + dir.y*bc2));
            acc += crack_seg(uv, p, p + bdir2 * seg_len * 0.25, w * 0.3) * 0.4;
        }
        w *= 0.72;
        p = next;
    }
    return acc;
}

float space_cracks(vec2 uv, float beat_boost) {
    const vec2 IMP0 = vec2( 0.14,  0.10);
    const vec2 IMP1 = vec2(-0.30,  0.22);
    const vec2 IMP2 = vec2( 0.06, -0.33);
    float acc = 0.0;
    for (int ci = 0; ci < 3; ci++) {
        vec2 imp = (ci==0) ? IMP0 : (ci==1) ? IMP1 : IMP2;
        float sb = float(ci) * 0.37;
        float spread = u_scene_norm * (1.0 + beat_boost * float(3-ci) * 0.15);
        for (int ai = 0; ai < 5; ai++)
            acc += fracture_arm(uv, imp, sb + float(ai) * 0.19 + 0.03, spread, 1);
    }
    return clamp(acc, 0.0, 2.0);
}

// ─── 4D Tesseract ─────────────────────────────────────────────────────────────

float sdEdge(vec2 uv, vec2 a, vec2 b) {
    vec2 pa = uv - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

vec3 proj4d(vec4 p, float fov4) { return p.xyz / (fov4 - p.w); }

float tesseract(vec2 uv, float beat_t) {
    float kick    = smoothstep(0.05, 0.0, u_beat);
    float spd_xw  = 0.25 + kick * 0.6;
    float spd_yz  = 0.17 + kick * 0.4;
    float spd_xy  = 0.09;
    float a_xw = u_time * spd_xw + u_scene_norm * 1.2;
    float a_yz = u_time * spd_yz;
    float a_xy = u_time * spd_xy;
    float cXW=cos(a_xw),sXW=sin(a_xw);
    float cYZ=cos(a_yz),sYZ=sin(a_yz);
    float cXY=cos(a_xy),sXY=sin(a_xy);
    vec2 pts[16];
    for (int vi = 0; vi < 16; vi++) {
        vec4 v = vec4(float((vi)&1)*2.0-1.0,float((vi>>1)&1)*2.0-1.0,
                      float((vi>>2)&1)*2.0-1.0,float((vi>>3)&1)*2.0-1.0);
        float nx=v.x*cXW-v.w*sXW, nw=v.x*sXW+v.w*cXW; v.x=nx; v.w=nw;
        float ny=v.y*cYZ-v.z*sYZ, nz=v.y*sYZ+v.z*cYZ; v.y=ny; v.z=nz;
        nx=v.x*cXY-v.y*sXY; ny=v.x*sXY+v.y*cXY; v.x=nx; v.y=ny;
        vec3 p3 = proj4d(v, 2.5);
        pts[vi] = p3.xy * (0.30 / (1.5 + p3.z * 0.3));
    }
    float acc = 0.0;
    for (int i = 0; i < 16; i++) {
        for (int j = i+1; j < 16; j++) {
            int diff = i ^ j;
            if (diff==1||diff==2||diff==4||diff==8) {
                float d = sdEdge(uv, pts[i], pts[j]);
                float w = 0.0012;
                acc += w / (d + w);
            }
        }
    }
    return clamp(acc, 0.0, 3.0);
}

// ─── Multi-timeline temporal streams ─────────────────────────────────────────
// Three simultaneous temporal streams flowing through frozen space, each
// representing a different time offset — past (blue, rightward), future
// (cyan, leftward/reversed), and present (orange, radial from explosion centres).
// The three directions make the three "time copies" physically visible.
// Impact positions match space_cracks() to tie the visual language together.

vec3 temporal_streams(vec2 uv) {
    vec3  col  = vec3(0.0);
    float kick = smoothstep(0.05, 0.0, u_beat) * u_scene_norm;
    float sn   = u_scene_norm;

    // ── Past: horizontal bands flowing rightward (time flowing forward to past) ──
    for (int i = 0; i < 3; i++) {
        float fi   = float(i);
        float y_c  = -0.42 + fi * 0.42 + sin(fi * 2.31 + 0.7) * 0.14;
        // Sinusoidal wobble — crystal shard gravity distorts the stream path
        float y_w  = y_c + sin(uv.x * 2.6 + fi * 1.9 + u_time * 0.13) * 0.030;
        float dist = abs(uv.y - y_w);
        float w    = 0.0018;
        float s    = w / (dist + w);
        float ph   = fract(uv.x - u_time * 0.28 + fi * 0.41 + hash1(fi * 7.13 + 1.5) * 2.0);
        s *= ph * (1.0 - ph) * 4.0;
        col += s * vec3(0.22, 0.52, 1.00) * sn * 0.55;
    }

    // ── Future: horizontal bands flowing leftward (reversed, anti-causal) ───────
    for (int i = 0; i < 3; i++) {
        float fi   = float(i) + 0.5;
        float y_c  = -0.62 + fi * 0.42 + cos(fi * 1.73 + 1.2) * 0.16;
        float y_w  = y_c + cos(uv.x * 3.1 + fi * 2.5 - u_time * 0.10) * 0.024;
        float dist = abs(uv.y - y_w);
        float w    = 0.0015;
        float s    = w / (dist + w);
        float ph   = fract(uv.x + u_time * 0.52 + fi * 0.53 + hash1(fi * 3.71 + 0.5) * 2.0);
        s *= ph * (1.0 - ph) * 4.0;
        col += s * vec3(0.08, 0.88, 0.78) * sn * 0.48;
    }

    // ── Present: radial expanding rings from explosion epicentres ─────────────
    // Continuous wavefronts from the 3 crack-line impact points — "now" radiating outward.
    const vec2 IMPS[3] = vec2[3](
        vec2( 0.14,  0.10),
        vec2(-0.30,  0.22),
        vec2( 0.06, -0.33)
    );
    for (int i = 0; i < 3; i++) {
        float fi    = float(i);
        float r     = length(uv - IMPS[i]);
        float spd   = 0.24 + fi * 0.07;
        for (int j = 0; j < 2; j++) {
            float ring_r = fract(r * 2.2 - u_time * spd + fi * 0.38 + float(j) * 0.50);
            float ring   = ring_r * (1.0 - ring_r) * 4.0 * exp(-r * 2.8);
            col += ring * vec3(1.00, 0.58, 0.18) * sn * 0.30;
        }
    }

    col *= 1.0 + kick * 1.6;
    return col;
}

// ─── reprojection feedback ────────────────────────────────────────────────────

vec3 feedback_sample(vec2 uv) {
    float jitter = vnoise(uv * 20.0 + u_time * 3.0) * 0.008;
    vec2 motion  = vec2(sin(uv.y * 3.14 + u_time) * 0.003, cos(uv.x * 3.14 + u_time) * 0.002);
    return texture(u_prev_frame, clamp(uv + motion + jitter, 0.001, 0.999)).rgb;
}

// ─── time fracture portal rings ───────────────────────────────────────────────

float portal_ring(vec2 uv, vec2 center, float r, float time_offset) {
    float d     = length(uv - center);
    float ring  = smoothstep(0.012, 0.0, abs(d - r));
    float phase = fract(d / r - u_time * 0.8 + time_offset);
    return ring * (0.5 + 0.5 * sin(phase * 6.28 * 8.0));
}

vec3 portal_interior(vec2 uv, vec2 center, float r, float time_offset) {
    vec2 local = uv - center;
    float d = length(local);
    if (d >= r * 0.98) return vec3(0.0);
    vec2 offset    = vec2(sin(time_offset * 4.1), cos(time_offset * 3.7)) * 0.15;
    vec2 portal_uv = (local * vec2(1.0, -1.0)) / (r * 2.2) + 0.5 + offset;
    portal_uv     += vec2(sin(u_time * 0.4 + time_offset * 6.28),
                          cos(u_time * 0.35 + time_offset * 4.0)) * 0.012;
    vec3 content = texture(u_prev_frame, clamp(portal_uv, 0.001, 0.999)).rgb;
    vec3 tint;
    if      (time_offset < 0.5) tint = vec3(0.6, 0.85, 1.0);
    else if (time_offset < 1.5) tint = vec3(1.0, 0.55, 0.2);
    else                        tint = vec3(0.3, 1.0, 0.55);
    return content * tint * smoothstep(r * 0.98, r * 0.55, d) * 0.75;
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv   = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
    uv.x     *= u_res.x / u_res.y;
    vec2 uv01 = gl_FragCoord.xy / u_res;

    // ── 3D frozen shard field ────────────────────────────────────────────────
    vec3 shard_col = render_shards(uv);

    // ── Temporal feedback decay ───────────────────────────────────────────────
    // Feedback smears shards across frames — sells the "frozen-time" blur.
    // Decay 0.60 (vs 0.70 original): less echo now that we have 3D content.
    vec3 prev = feedback_sample(uv01);
    vec3 col  = shard_col + prev * 0.60;

    // ── Multi-timeline temporal streams: past (rightward) / future (leftward) / present (radial) ──
    col += temporal_streams(uv);

    // ── Time portal rings + interiors ─────────────────────────────────────────
    float pr1 = portal_ring(uv, vec2( 0.00,  0.00), 0.60, 0.00);
    float pr2 = portal_ring(uv, vec2(-0.40,  0.20), 0.35, 0.33);
    float pr3 = portal_ring(uv, vec2( 0.50, -0.30), 0.20, 0.67);
    col += pr1 * vec3(0.0, 0.6, 1.0) * 1.2;
    col += pr2 * vec3(1.0, 0.2, 0.8) * 0.8;
    col += pr3 * vec3(0.2, 1.0, 0.5) * 0.6;
    col += portal_interior(uv, vec2( 0.00,  0.00), 0.60, 0.00);
    col += portal_interior(uv, vec2(-0.40,  0.20), 0.35, 0.33);
    col += portal_interior(uv, vec2( 0.50, -0.30), 0.20, 0.67);

    // ── Motion-vector warped prev-frame sample ────────────────────────────────
    float warp    = vnoise(uv * 4.0 + vec2(u_time * 0.3, -u_time * 0.2)) * 0.04;
    vec2 warp_uv  = uv01 + vec2(warp, -warp * 0.5);
    col += texture(u_prev_frame, clamp(warp_uv, 0.001, 0.999)).rgb * 0.18;

    // ── Beat shatter shockwave rings ──────────────────────────────────────────
    // Flat peak flash at the exact moment of impact (very brief)
    float beat_shatter = smoothstep(0.03, 0.0, u_beat);
    col += beat_shatter * vec3(0.2, 0.5, 1.0) * 0.12;
    // Primary expanding shockwave: time-pressure ring radiating through frozen space
    float shock_r = u_beat * 2.4;
    float shock_d = abs(length(uv) - shock_r);
    float shock   = exp(-u_beat * 3.2) * smoothstep(0.022, 0.0, shock_d);
    col += shock * vec3(0.30, 0.60, 1.00) * 1.6;
    // Echo ring: secondary reflection at shorter radius (temporal rebound)
    float echo_r = u_beat * 1.25;
    float echo_d = abs(length(uv) - echo_r);
    float echo   = exp(-u_beat * 5.0) * smoothstep(0.014, 0.0, echo_d);
    col += echo * vec3(0.50, 0.78, 1.00) * 0.70;

    // ── Spacetime crack lines ─────────────────────────────────────────────────
    float cracks = space_cracks(uv, beat_shatter);
    col += cracks * vec3(0.12, 0.45, 1.00) * (0.7 + beat_shatter * 1.2);
    col += cracks * beat_shatter * vec3(0.80, 0.90, 1.00) * 0.5;

    // ── 4D Tesseract (fades in 0.05→0.35, out 0.82→0.97) ─────────────────────
    float tes = tesseract(uv, u_beat);
    float tes_gate = smoothstep(0.05, 0.35, u_scene_norm)
                   * (1.0 - smoothstep(0.82, 0.97, u_scene_norm));
    vec3 tes_col = mix(vec3(0.15, 0.45, 1.0), vec3(0.8, 0.9, 1.0),
                       smoothstep(0.06, 0.0, u_beat));
    col += tes * tes_col * tes_gate * (0.55 + smoothstep(0.05, 0.0, u_beat) * 0.7);

    // ── Scene-local scanlines ─────────────────────────────────────────────────
    col *= 0.9 + 0.1 * sin(gl_FragCoord.y * 2.0);

    // ── Vignette ──────────────────────────────────────────────────────────────
    float vig = 1.0 - dot(uv * 0.45, uv * 0.45);
    col *= vig;

    // ── Chromatic aberration (grows with scene progress) ─────────────────────
    float ca  = 0.003 + u_scene_norm * 0.008;
    float cr  = texture(u_prev_frame, clamp(uv01 + vec2(ca, 0.0), 0.001, 0.999)).r;
    float cb  = texture(u_prev_frame, clamp(uv01 - vec2(ca, 0.0), 0.001, 0.999)).b;
    col.r = mix(col.r, col.r * 0.5 + cr * 0.5, 0.3);
    col.b = mix(col.b, col.b * 0.5 + cb * 0.5, 0.3);

    frag_color = vec4(col, 1.0);
}
