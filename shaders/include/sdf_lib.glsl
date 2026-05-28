// ═══════════════════════════════════════════════════════════════════════════════
// SDF PRIMITIVE LIBRARY — Assembly 2026 HYPERSYNAPSE
// ═══════════════════════════════════════════════════════════════════════════════
// Shared GLSL include for all raymarching scenes. Distance functions for 3D SDFs.
// Usage: #include "include/sdf_lib.glsl" (via concatenation in renderer)

#ifndef SDF_LIB_GLSL
#define SDF_LIB_GLSL

// ─── Basic Primitives ────────────────────────────────────────────────────────

// Sphere: radius r
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// Box: half-extents b (xyz)
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Torus: major radius ra, minor radius rb
float sdTorus(vec3 p, float ra, float rb) {
    vec2 q = vec2(length(p.xz) - ra, p.y);
    return length(q) - rb;
}

// Cylinder: radius r, height h (centered)
float sdCylinder(vec3 p, float r, float h) {
    vec2 q = vec2(length(p.xz), abs(p.y) - h);
    return min(max(q.x - r, q.y), 0.0) + length(max(q, 0.0));
}

// Capsule: line segment from a to b, radius r
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// Cone: radius at base ra, radius at tip rb, height h
float sdCone(vec3 p, float ra, float rb, float h) {
    vec2 q = vec2(length(p.xz), p.y);
    vec2 k1 = vec2(rb, h);
    vec2 k2 = vec2(rb - ra, 2.0 * h);
    vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? rb : ra), abs(q.y) - h);
    vec2 cb = q - k1 + k2 * clamp(dot(k1, k2 - q) / dot(k2, k2), 0.0, 1.0);
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// ─── Blending Functions ─────────────────────────────────────────────────────

// Polynomial smooth min — smooth union of two SDFs
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Exponential smooth min — better for fine details
float esmooth(float a, float b, float k) {
    float res = exp(-k * a) + exp(-k * b);
    return -log(res) / k;
}

// Simple min (hard edge)
float dmin(float a, float b) {
    return min(a, b);
}

// ─── Modifications & Operators ──────────────────────────────────────────────

// Elongation: stretch a primitive along axis
float sdElongate(float d, vec3 p, vec3 h) {
    vec3 q = abs(p) - h;
    return d + length(max(q, 0.0));
}

// Repetition: periodic domain
vec3 rep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

// Radial repetition: rotate-repeat around Y axis
vec3 repPolar(vec3 p, float n) {
    float angle = atan(p.z, p.x);
    angle = mod(angle, 6.28318530718 / n) - 3.14159265359 / n;
    float r = length(p.xz);
    return vec3(cos(angle) * r, p.y, sin(angle) * r);
}

// ─── Advanced Shapes (compound) ──────────────────────────────────────────────

// Octahedron: scale s
float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
    if (3.0 * p.x < m) q = p.xxx;
    else if (3.0 * p.y < m) q = p.yyy;
    else if (3.0 * p.z < m) q = p.zzz;
    else return m * 0.57735027;
    float k = clamp(0.5 * (q.z - p.y + s), 0.0, s);
    return length(vec3(p.x, p.y - q.z + k, p.z - k)) - s;
}

// Tetrahedron: scale s
float sdTetrahedron(vec3 p, float s) {
    float m = dot(p, vec3(0.9486832980505138, 0.1690308995376545, -0.2672612419124244));
    if (m > 0.0) p -= 2.0 * m * vec3(0.9486832980505138, 0.1690308995376545, -0.2672612419124244);
    m = dot(p, vec3(-0.1690308995376545, 0.9486832980505138, -0.2672612419124244));
    if (m > 0.0) p -= 2.0 * m * vec3(-0.1690308995376545, 0.9486832980505138, -0.2672612419124244);
    m = dot(p, vec3(-0.1690308995376545, -0.2672612419124244, 0.9486832980505138));
    if (m > 0.0) p -= 2.0 * m * vec3(-0.1690308995376545, -0.2672612419124244, 0.9486832980505138);
    return length(p) * sign(p.y + 0.1890307787036650);
}

// Icosphere approximation (hexagon fractal)
float sdHexagon(vec3 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
    p -= vec3(clamp(p.x, -k.z * r, k.z * r), p.y, p.z);
    return length(p) - r;
}

// ─── Noise & Warping ────────────────────────────────────────────────────────

// 3D hash for domain-specific randomness
vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
}

// Simple Perlin-like noise (3x octaves of sine)
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    vec3 h0 = hash33(i);
    vec3 h1 = hash33(i + vec3(1.0, 0.0, 0.0));
    vec3 h2 = hash33(i + vec3(0.0, 1.0, 0.0));
    vec3 h3 = hash33(i + vec3(1.0, 1.0, 0.0));
    vec3 h4 = hash33(i + vec3(0.0, 0.0, 1.0));
    vec3 h5 = hash33(i + vec3(1.0, 0.0, 1.0));
    vec3 h6 = hash33(i + vec3(0.0, 1.0, 1.0));
    vec3 h7 = hash33(i + vec3(1.0, 1.0, 1.0));

    float n0 = mix(mix(h0.x, h1.x, f.x), mix(h2.x, h3.x, f.x), f.y);
    float n1 = mix(mix(h4.x, h5.x, f.x), mix(h6.x, h7.x, f.x), f.y);

    return mix(n0, n1, f.z);
}

// Domain warp: applies turbulence to a point
vec3 warp(vec3 p, float amp, float freq) {
    return p + amp * vec3(
        sin(p.y * freq + p.z * freq),
        sin(p.z * freq + p.x * freq),
        sin(p.x * freq + p.y * freq)
    );
}

#endif // SDF_LIB_GLSL
