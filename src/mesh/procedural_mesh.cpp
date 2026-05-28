#include "mesh/procedural_mesh.h"

#include <cmath>
#include <cstdlib>
#include <glad/gl.h>

// ─── HYPERSYNAPSE — Assembly 2026 PC Demo ─────────────────────────────────────
// Brutalist megacity procedural geometry engine.
// Architecture: multi-block merging, stepped facades, fins, cornices, landmarks.
// ─────────────────────────────────────────────────────────────────────────────

namespace hyp {
namespace ProceduralMesh {

// ─── Math helpers ─────────────────────────────────────────────────────────────

static float fhash(float n) {
    n = std::fmod(n * 127.1f + 311.7f, 6.2831853f);
    return (std::sin(n) * 43758.5453f - std::floor(std::sin(n) * 43758.5453f));
}

// Multi-input hash — avoids patterns from single-input chains
static float fhash2(float a, float b) {
    return fhash(a * 13.7f + b * 79.3f + 1.23f);
}

static float flerp(float a, float b, float t) {
    return a + (b - a) * t;
}

static float fclamp(float v, float lo, float hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

// Smoothstep falloff — used for height-center curve
static float smoothstep(float t) {
    t = fclamp(t, 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
}

// ─── Box primitive ────────────────────────────────────────────────────────────

static void add_face(MeshData& m,
                     glm::vec3 p, glm::vec3 u_axis, glm::vec3 v_axis, glm::vec3 n)
{
    uint32_t base = static_cast<uint32_t>(m.vertices.size());

    m.vertices.push_back({ p,                     n, {0.0f, 0.0f} });
    m.vertices.push_back({ p + u_axis,             n, {1.0f, 0.0f} });
    m.vertices.push_back({ p + u_axis + v_axis,    n, {1.0f, 1.0f} });
    m.vertices.push_back({ p + v_axis,             n, {0.0f, 1.0f} });

    m.indices.push_back(base + 0);
    m.indices.push_back(base + 1);
    m.indices.push_back(base + 2);
    m.indices.push_back(base + 0);
    m.indices.push_back(base + 2);
    m.indices.push_back(base + 3);
}

// add_box: adds a solid 6-sided box. UV coords scale proportionally to face size
// for consistent apparent texel density across all building pieces.
static void add_box(MeshData& m, glm::vec3 mn, glm::vec3 mx) {
    glm::vec3 sx = { mx.x - mn.x, 0, 0 };
    glm::vec3 sy = { 0, mx.y - mn.y, 0 };
    glm::vec3 sz = { 0, 0, mx.z - mn.z };

    // +X face
    add_face(m, {mx.x, mn.y, mn.z},  sz,  sy, { 1,  0,  0});
    // -X face
    add_face(m, {mn.x, mn.y, mx.z}, -sz,  sy, {-1,  0,  0});
    // +Y face
    add_face(m, {mn.x, mx.y, mn.z},  sx,  sz, { 0,  1,  0});
    // -Y face (floor — rarely visible, but needed for ground plane)
    add_face(m, {mn.x, mn.y, mx.z},  sx, -sz, { 0, -1,  0});
    // +Z face
    add_face(m, {mn.x, mn.y, mx.z},  sx,  sy, { 0,  0,  1});
    // -Z face
    add_face(m, {mx.x, mn.y, mn.z}, -sx,  sy, { 0,  0, -1});
}

// ─── Building-complex builder ─────────────────────────────────────────────────
//
// Coordinate system: Y = up. All positions relative to (cx, 0, cz) = building center.
// height_factor: 1.0 = average, 3.0 = landmark scale.
//
// A "complex" consists of:
//   1. Base plinth          — wide, squat (2–4 floor units)
//   2. Main tower           — 60-80% base width, 4–15 floors
//   3. Upper setback        — 50-70% tower width, 2–5 floors
//   4. Crown / Antenna      — very thin spike on large buildings
//   5. Vertical fins        — brutalist detail on tower facades
//   6. Horizontal cornices  — every 3 floors
//   7. Roof mechanicals     — machine-room box + water towers
// ─────────────────────────────────────────────────────────────────────────────

static void add_building_complex(MeshData& m, float cx, float cz,
                                 float seed, float height_factor)
{
    // ── Dimensional seed values ──────────────────────────────────────────────
    float s0 = seed;
    float base_w   = flerp(3.5f,  7.0f,  fhash(s0 + 0.1f));
    float base_d   = flerp(3.0f,  6.5f,  fhash(s0 + 0.2f));
    float base_h   = flerp(1.5f,  3.5f,  fhash(s0 + 0.3f)) * height_factor;

    float tower_w  = base_w  * flerp(0.55f, 0.80f, fhash(s0 + 0.4f));
    float tower_d  = base_d  * flerp(0.55f, 0.80f, fhash(s0 + 0.5f));
    float tower_h  = flerp(5.0f, 18.0f,  fhash(s0 + 0.6f)) * height_factor;

    float set_w    = tower_w * flerp(0.50f, 0.70f, fhash(s0 + 0.7f));
    float set_d    = tower_d * flerp(0.50f, 0.70f, fhash(s0 + 0.8f));
    float set_h    = flerp(2.0f,  6.0f,   fhash(s0 + 0.9f)) * height_factor;

    // Jitter position slightly within its slot
    float jx = (fhash(s0 + 1.1f) - 0.5f) * 0.8f;
    float jz = (fhash(s0 + 1.2f) - 0.5f) * 0.8f;
    float ox = cx + jx;
    float oz = cz + jz;

    // ── Floor unit constant (approx 3.5 world units per storey) ─────────────
    const float FLOOR = 3.2f;

    // ── 1. Base plinth ───────────────────────────────────────────────────────
    float base_top = base_h * FLOOR;
    add_box(m,
        {ox - base_w * 0.5f,  0.0f,          oz - base_d * 0.5f},
        {ox + base_w * 0.5f,  base_top,       oz + base_d * 0.5f});

    // ── 2. Main tower ────────────────────────────────────────────────────────
    float tower_bot = base_top;
    float tower_top = tower_bot + tower_h * FLOOR;
    add_box(m,
        {ox - tower_w * 0.5f, tower_bot,      oz - tower_d * 0.5f},
        {ox + tower_w * 0.5f, tower_top,      oz + tower_d * 0.5f});

    // ── 3. Upper setback ─────────────────────────────────────────────────────
    float set_bot = tower_top;
    float set_top = set_bot + set_h * FLOOR;

    // Slight offset for asymmetric brutalist character
    float set_ox = ox + (fhash(s0 + 2.1f) - 0.5f) * (tower_w - set_w) * 0.5f;
    float set_oz = oz + (fhash(s0 + 2.2f) - 0.5f) * (tower_d - set_d) * 0.5f;
    add_box(m,
        {set_ox - set_w * 0.5f, set_bot,      set_oz - set_d * 0.5f},
        {set_ox + set_w * 0.5f, set_top,      set_oz + set_d * 0.5f});

    // ── 4. Spire / Antenna (only on tall buildings) ──────────────────────────
    if (height_factor > 1.2f) {
        float ant_w   = flerp(0.12f, 0.30f, fhash(s0 + 3.1f));
        float ant_h   = flerp(3.0f,  9.0f,  fhash(s0 + 3.2f)) * height_factor;
        float ant_ox  = set_ox + (fhash(s0 + 3.3f) - 0.5f) * set_w * 0.3f;
        float ant_oz  = set_oz + (fhash(s0 + 3.4f) - 0.5f) * set_d * 0.3f;
        add_box(m,
            {ant_ox - ant_w * 0.5f, set_top,        ant_oz - ant_w * 0.5f},
            {ant_ox + ant_w * 0.5f, set_top + ant_h, ant_oz + ant_w * 0.5f});
    }

    // ── 5. Vertical fins (brutalist detail) ──────────────────────────────────
    // Fins run floor-to-floor along the long axis of each tower face.
    // 2-4 fins per visible face.
    {
        int n_fins_x = 2 + static_cast<int>(fhash(s0 + 4.1f) * 3.0f); // 2..4
        int n_fins_z = 2 + static_cast<int>(fhash(s0 + 4.2f) * 3.0f);
        float fin_d  = flerp(0.08f, 0.18f, fhash(s0 + 4.3f));  // protrusion depth
        float fin_w  = flerp(0.18f, 0.45f, fhash(s0 + 4.4f));  // fin width
        float fin_bot = tower_bot;
        float fin_top = tower_top;

        // +X / -X faces: fins run along Z axis
        for (int i = 0; i < n_fins_z; i++) {
            float ft = (float(i) + 0.5f + (fhash(s0 + 4.5f + float(i)) - 0.5f) * 0.3f)
                       / float(n_fins_z);
            float fz = oz - tower_d * 0.5f + tower_d * ft;

            // +X side fin
            float fx_plus = ox + tower_w * 0.5f;
            add_box(m,
                {fx_plus,              fin_bot, fz - fin_w * 0.5f},
                {fx_plus + fin_d,      fin_top, fz + fin_w * 0.5f});

            // -X side fin
            float fx_minus = ox - tower_w * 0.5f;
            add_box(m,
                {fx_minus - fin_d,     fin_bot, fz - fin_w * 0.5f},
                {fx_minus,             fin_top, fz + fin_w * 0.5f});
        }

        // +Z / -Z faces: fins run along X axis
        for (int i = 0; i < n_fins_x; i++) {
            float ft = (float(i) + 0.5f + (fhash(s0 + 4.6f + float(i)) - 0.5f) * 0.3f)
                       / float(n_fins_x);
            float fx = ox - tower_w * 0.5f + tower_w * ft;

            float fz_plus = oz + tower_d * 0.5f;
            add_box(m,
                {fx - fin_w * 0.5f, fin_bot, fz_plus},
                {fx + fin_w * 0.5f, fin_top, fz_plus + fin_d});

            float fz_minus = oz - tower_d * 0.5f;
            add_box(m,
                {fx - fin_w * 0.5f, fin_bot, fz_minus - fin_d},
                {fx + fin_w * 0.5f, fin_top, fz_minus});
        }
    }

    // ── 6. Horizontal cornices (every ~3 floors along tower height) ───────────
    {
        float cornice_h   = 0.22f * FLOOR;
        float cornice_out = flerp(0.15f, 0.40f, fhash(s0 + 5.1f)); // overhang
        int   n_cornices  = static_cast<int>(tower_h / 3.0f);

        for (int k = 1; k <= n_cornices; k++) {
            float cy_bot = tower_bot + (float(k) * 3.0f / tower_h) * (tower_top - tower_bot)
                           - cornice_h * 0.5f;
            float cy_top = cy_bot + cornice_h;
            if (cy_top > tower_top - 0.1f) break; // no cornice at very top

            add_box(m,
                {ox - (tower_w * 0.5f + cornice_out), cy_bot, oz - (tower_d * 0.5f + cornice_out)},
                {ox + (tower_w * 0.5f + cornice_out), cy_top, oz + (tower_d * 0.5f + cornice_out)});
        }
    }

    // ── 7. Roof mechanicals ──────────────────────────────────────────────────
    {
        // Machine room box (flat, centered on setback roof)
        float mr_w = set_w  * flerp(0.40f, 0.65f, fhash(s0 + 6.1f));
        float mr_d = set_d  * flerp(0.40f, 0.65f, fhash(s0 + 6.2f));
        float mr_h = flerp(0.6f, 1.8f, fhash(s0 + 6.3f)) * FLOOR;
        add_box(m,
            {set_ox - mr_w * 0.5f, set_top,          set_oz - mr_d * 0.5f},
            {set_ox + mr_w * 0.5f, set_top + mr_h,   set_oz + mr_d * 0.5f});

        // 1-2 small water towers (cylindrical approximation via octagonal box)
        int n_wt = 1 + static_cast<int>(fhash(s0 + 6.4f) * 2.0f);
        for (int k = 0; k < n_wt; k++) {
            float wt_r  = flerp(0.20f, 0.50f, fhash(s0 + 6.5f + float(k)));
            float wt_h  = flerp(0.60f, 1.40f, fhash(s0 + 6.6f + float(k))) * FLOOR;
            float wt_ox = set_ox + (fhash(s0 + 6.7f + float(k)) - 0.5f) * (set_w * 0.5f - wt_r);
            float wt_oz = set_oz + (fhash(s0 + 6.8f + float(k)) - 0.5f) * (set_d * 0.5f - wt_r);
            float wt_y  = set_top + mr_h;

            // Box body
            add_box(m,
                {wt_ox - wt_r, wt_y,          wt_oz - wt_r},
                {wt_ox + wt_r, wt_y + wt_h,   wt_oz + wt_r});

            // Conical cap approximation: thin box on top, slightly narrower
            float cap_r = wt_r * 0.85f;
            float cap_h = wt_h * 0.25f;
            add_box(m,
                {wt_ox - cap_r, wt_y + wt_h,           wt_oz - cap_r},
                {wt_ox + cap_r, wt_y + wt_h + cap_h,   wt_oz + cap_r});
        }
    }
}

// ─── Landmark generators ──────────────────────────────────────────────────────

// Landmark A: Stepped pyramid — each layer is smaller and taller
static void add_landmark_pyramid(MeshData& m, float cx, float cz, float seed,
                                  float base_w, float base_d, float floor_h)
{
    const int STEPS = 7;
    float y = 0.0f;
    float w = base_w;
    float d = base_d;
    for (int i = 0; i < STEPS; i++) {
        float step_h = flerp(2.5f, 5.5f, fhash(seed + float(i) * 0.31f)) * floor_h;
        add_box(m,
            {cx - w * 0.5f, y,           cz - d * 0.5f},
            {cx + w * 0.5f, y + step_h,  cz + d * 0.5f});
        // Cornice at each step
        float co = flerp(0.2f, 0.5f, fhash(seed + float(i) * 0.47f));
        add_box(m,
            {cx - (w * 0.5f + co), y + step_h - 0.3f * floor_h, cz - (d * 0.5f + co)},
            {cx + (w * 0.5f + co), y + step_h,                   cz + (d * 0.5f + co)});
        y   += step_h;
        w   *= flerp(0.65f, 0.78f, fhash(seed + float(i) * 0.17f));
        d   *= flerp(0.65f, 0.78f, fhash(seed + float(i) * 0.23f));
    }
    // Needle at apex
    float needle_h = flerp(8.0f, 20.0f, fhash(seed + 9.9f));
    float needle_r = 0.18f;
    add_box(m,
        {cx - needle_r, y,              cz - needle_r},
        {cx + needle_r, y + needle_h,   cz + needle_r});
}

// Landmark B: Twin towers — two parallel slabs very close together, with sky bridge
static void add_landmark_twin_towers(MeshData& m, float cx, float cz, float seed,
                                      float floor_h)
{
    float tw = flerp(3.0f, 5.5f, fhash(seed + 0.1f));
    float td = flerp(3.0f, 5.5f, fhash(seed + 0.2f));
    float th = flerp(40.0f, 80.0f, fhash(seed + 0.3f)) * floor_h;
    float gap = flerp(1.5f, 4.0f, fhash(seed + 0.4f));

    float ox_a = cx - (tw * 0.5f + gap * 0.5f);
    float ox_b = cx + (tw * 0.5f + gap * 0.5f);

    // Tower A
    add_box(m, {ox_a - tw * 0.5f, 0, cz - td * 0.5f},
               {ox_a + tw * 0.5f, th, cz + td * 0.5f});
    // Tower B (slightly taller for visual interest)
    float th_b = th * flerp(0.88f, 1.12f, fhash(seed + 0.5f));
    add_box(m, {ox_b - tw * 0.5f, 0, cz - td * 0.5f},
               {ox_b + tw * 0.5f, th_b, cz + td * 0.5f});

    // Sky bridges at 1/3 and 2/3 height
    float bridge_h = floor_h * 0.8f;
    float bridge_w = gap + tw;
    float bridge_d = td * 0.4f;
    for (int k = 1; k <= 2; k++) {
        float by = (float(k) / 3.0f) * std::min(th, th_b);
        add_box(m,
            {cx - bridge_w * 0.5f, by,               cz - bridge_d * 0.5f},
            {cx + bridge_w * 0.5f, by + bridge_h,     cz + bridge_d * 0.5f});
    }

    // Fins on both towers
    int nf = 3;
    float fin_d = 0.2f;
    float fin_w = 0.4f;
    for (int i = 0; i < nf; i++) {
        float fz = cz - td * 0.5f + (float(i) + 0.5f) / float(nf) * td;
        // Tower A fins
        add_box(m, {ox_a + tw * 0.5f,       0, fz - fin_w * 0.5f},
                   {ox_a + tw * 0.5f + fin_d, th, fz + fin_w * 0.5f});
        add_box(m, {ox_a - tw * 0.5f - fin_d, 0, fz - fin_w * 0.5f},
                   {ox_a - tw * 0.5f,         th, fz + fin_w * 0.5f});
        // Tower B fins
        add_box(m, {ox_b + tw * 0.5f,       0, fz - fin_w * 0.5f},
                   {ox_b + tw * 0.5f + fin_d, th_b, fz + fin_w * 0.5f});
        add_box(m, {ox_b - tw * 0.5f - fin_d, 0, fz - fin_w * 0.5f},
                   {ox_b - tw * 0.5f,         th_b, fz + fin_w * 0.5f});
    }

    // Spires
    float sp_r = 0.15f;
    float sp_ha = flerp(6.0f, 14.0f, fhash(seed + 7.1f));
    float sp_hb = flerp(6.0f, 14.0f, fhash(seed + 7.2f));
    add_box(m, {ox_a - sp_r, th,       cz - sp_r}, {ox_a + sp_r, th + sp_ha,  cz + sp_r});
    add_box(m, {ox_b - sp_r, th_b,     cz - sp_r}, {ox_b + sp_r, th_b + sp_hb, cz + sp_r});
}

// Landmark C: Obelisk — very narrow very tall monolithic slab
static void add_landmark_obelisk(MeshData& m, float cx, float cz, float seed,
                                  float floor_h)
{
    float base_w = flerp(4.0f, 7.0f, fhash(seed + 0.1f));
    float base_d = flerp(4.0f, 7.0f, fhash(seed + 0.2f));
    float base_h = flerp(1.5f, 3.0f, fhash(seed + 0.3f)) * floor_h;

    // Base plinth
    add_box(m,
        {cx - base_w * 0.5f, 0,       cz - base_d * 0.5f},
        {cx + base_w * 0.5f, base_h,  cz + base_d * 0.5f});

    // Shaft — tapers in 4 steps
    const int TAPER = 4;
    float sw = base_w * 0.35f;
    float sd = base_d * 0.35f;
    float total_h = flerp(70.0f, 130.0f, fhash(seed + 0.4f)) * floor_h;
    float sy = base_h;

    for (int i = 0; i < TAPER; i++) {
        float sh = total_h * (float(TAPER - i) / float(TAPER * (TAPER + 1) / 2));
        float t  = float(i) / float(TAPER - 1);
        float cw = sw * flerp(1.0f, 0.3f, smoothstep(t));
        float cd = sd * flerp(1.0f, 0.3f, smoothstep(t));
        add_box(m,
            {cx - cw * 0.5f, sy,       cz - cd * 0.5f},
            {cx + cw * 0.5f, sy + sh,  cz + cd * 0.5f});
        sy += sh;
    }

    // Pyramid cap
    float cap_w = sw * 0.15f;
    float cap_h = flerp(3.0f, 8.0f, fhash(seed + 0.9f)) * floor_h;
    add_box(m,
        {cx - cap_w * 0.5f, sy,         cz - cap_w * 0.5f},
        {cx + cap_w * 0.5f, sy + cap_h, cz + cap_w * 0.5f});
}

// Landmark D: Brutalist fortress — massive squat base, stubby tower
static void add_landmark_fortress(MeshData& m, float cx, float cz, float seed,
                                   float floor_h)
{
    float bw = flerp(16.0f, 28.0f, fhash(seed + 0.1f));
    float bd = flerp(16.0f, 28.0f, fhash(seed + 0.2f));
    float bh = flerp(4.0f,   8.0f, fhash(seed + 0.3f)) * floor_h;

    // Mega base
    add_box(m,
        {cx - bw * 0.5f, 0,   cz - bd * 0.5f},
        {cx + bw * 0.5f, bh,  cz + bd * 0.5f});

    // Ramparts: raised boxes around the perimeter edge of the base top
    float ramp_w = flerp(0.8f, 1.8f, fhash(seed + 1.1f));
    float ramp_h = flerp(1.0f, 2.5f, fhash(seed + 1.2f)) * floor_h;
    // North/South ramparts
    add_box(m, {cx - bw * 0.5f, bh, cz - bd * 0.5f},
               {cx + bw * 0.5f, bh + ramp_h, cz - bd * 0.5f + ramp_w});
    add_box(m, {cx - bw * 0.5f, bh, cz + bd * 0.5f - ramp_w},
               {cx + bw * 0.5f, bh + ramp_h, cz + bd * 0.5f});
    // East/West ramparts
    add_box(m, {cx - bw * 0.5f, bh, cz - bd * 0.5f},
               {cx - bw * 0.5f + ramp_w, bh + ramp_h, cz + bd * 0.5f});
    add_box(m, {cx + bw * 0.5f - ramp_w, bh, cz - bd * 0.5f},
               {cx + bw * 0.5f, bh + ramp_h, cz + bd * 0.5f});

    // Corner towers (4 x cylindrical box)
    float ct_r = flerp(1.5f, 3.0f, fhash(seed + 2.1f));
    float ct_h = flerp(8.0f, 18.0f, fhash(seed + 2.2f)) * floor_h;
    float corners[4][2] = {
        {cx - bw * 0.5f + ct_r, cz - bd * 0.5f + ct_r},
        {cx + bw * 0.5f - ct_r, cz - bd * 0.5f + ct_r},
        {cx - bw * 0.5f + ct_r, cz + bd * 0.5f - ct_r},
        {cx + bw * 0.5f - ct_r, cz + bd * 0.5f - ct_r},
    };
    for (int k = 0; k < 4; k++) {
        float r = ct_r * flerp(0.85f, 1.15f, fhash(seed + 2.5f + float(k)));
        float h = ct_h * flerp(0.80f, 1.20f, fhash(seed + 3.0f + float(k)));
        add_box(m,
            {corners[k][0] - r, 0,   corners[k][1] - r},
            {corners[k][0] + r, h,   corners[k][1] + r});
        // Merlon top ring
        float mr = r * 1.15f;
        float mh = flerp(0.5f, 1.2f, fhash(seed + 3.5f + float(k))) * floor_h;
        add_box(m,
            {corners[k][0] - mr, h, corners[k][1] - mr},
            {corners[k][0] + mr, h + mh, corners[k][1] + mr});
    }

    // Central keep
    float kw = bw * 0.30f;
    float kd = bd * 0.30f;
    float kh = flerp(12.0f, 25.0f, fhash(seed + 4.1f)) * floor_h;
    add_box(m,
        {cx - kw * 0.5f, bh,       cz - kd * 0.5f},
        {cx + kw * 0.5f, bh + kh,  cz + kd * 0.5f});

    // Keep fins
    int nf = 4;
    float kfin_d = 0.25f;
    float kfin_w = 0.55f;
    for (int i = 0; i < nf; i++) {
        float fz = cz - kd * 0.5f + (float(i) + 0.5f) / float(nf) * kd;
        add_box(m, {cx + kw * 0.5f,          bh, fz - kfin_w * 0.5f},
                   {cx + kw * 0.5f + kfin_d, bh + kh, fz + kfin_w * 0.5f});
        add_box(m, {cx - kw * 0.5f - kfin_d, bh, fz - kfin_w * 0.5f},
                   {cx - kw * 0.5f,           bh + kh, fz + kfin_w * 0.5f});
    }
}

// ─── Monolith (Scene 2) ───────────────────────────────────────────────────────
// Mathematical surface engravings as inset thin-box strips.

MeshData build_monolith(int subdivisions) {
    MeshData m;

    // Main body: tall slab — proportions 1:4:0.5
    const float HW = 0.5f;
    const float HH = 2.0f;
    const float HD = 0.25f;

    // Subdivided outer faces
    for (int face = 0; face < 6; face++) {
        for (int i = 0; i < subdivisions; i++) {
            for (int j = 0; j < subdivisions; j++) {
                float u0 = float(i)   / float(subdivisions);
                float u1 = float(i+1) / float(subdivisions);
                float v0 = float(j)   / float(subdivisions);
                float v1 = float(j+1) / float(subdivisions);

                auto lerp3 = [](glm::vec3 a, glm::vec3 b, float t) {
                    return a + (b - a) * t;
                };

                glm::vec3 A, B, C, D, n;

                if (face == 0) {
                    n = {1,0,0};
                    A = {HW, lerp3({},{0,HH*2,0},v0).y, lerp3({0,0,-HD},{0,0,HD},u0).z};
                    B = {HW, lerp3({},{0,HH*2,0},v0).y, lerp3({0,0,-HD},{0,0,HD},u1).z};
                    C = {HW, lerp3({},{0,HH*2,0},v1).y, lerp3({0,0,-HD},{0,0,HD},u1).z};
                    D = {HW, lerp3({},{0,HH*2,0},v1).y, lerp3({0,0,-HD},{0,0,HD},u0).z};
                } else if (face == 1) {
                    n = {-1,0,0};
                    A = {-HW, lerp3({},{0,HH*2,0},v0).y, lerp3({0,0,HD},{0,0,-HD},u0).z};
                    B = {-HW, lerp3({},{0,HH*2,0},v0).y, lerp3({0,0,HD},{0,0,-HD},u1).z};
                    C = {-HW, lerp3({},{0,HH*2,0},v1).y, lerp3({0,0,HD},{0,0,-HD},u1).z};
                    D = {-HW, lerp3({},{0,HH*2,0},v1).y, lerp3({0,0,HD},{0,0,-HD},u0).z};
                } else if (face == 2) {
                    n = {0,0,1};
                    A = {lerp3({-HW,0,0},{HW,0,0},u0).x, lerp3({},{0,HH*2,0},v0).y, HD};
                    B = {lerp3({-HW,0,0},{HW,0,0},u1).x, lerp3({},{0,HH*2,0},v0).y, HD};
                    C = {lerp3({-HW,0,0},{HW,0,0},u1).x, lerp3({},{0,HH*2,0},v1).y, HD};
                    D = {lerp3({-HW,0,0},{HW,0,0},u0).x, lerp3({},{0,HH*2,0},v1).y, HD};
                } else if (face == 3) {
                    n = {0,0,-1};
                    A = {lerp3({HW,0,0},{-HW,0,0},u0).x, lerp3({},{0,HH*2,0},v0).y, -HD};
                    B = {lerp3({HW,0,0},{-HW,0,0},u1).x, lerp3({},{0,HH*2,0},v0).y, -HD};
                    C = {lerp3({HW,0,0},{-HW,0,0},u1).x, lerp3({},{0,HH*2,0},v1).y, -HD};
                    D = {lerp3({HW,0,0},{-HW,0,0},u0).x, lerp3({},{0,HH*2,0},v1).y, -HD};
                } else if (face == 4) {
                    n = {0,1,0};
                    A = {lerp3({-HW,0,0},{HW,0,0},u0).x, HH*2, lerp3({-HD,0,0},{HD,0,0},v0).x};
                    B = {lerp3({-HW,0,0},{HW,0,0},u1).x, HH*2, lerp3({-HD,0,0},{HD,0,0},v0).x};
                    C = {lerp3({-HW,0,0},{HW,0,0},u1).x, HH*2, lerp3({-HD,0,0},{HD,0,0},v1).x};
                    D = {lerp3({-HW,0,0},{HW,0,0},u0).x, HH*2, lerp3({-HD,0,0},{HD,0,0},v1).x};
                } else {
                    n = {0,-1,0};
                    A = {lerp3({-HW,0,0},{HW,0,0},u0).x, 0, lerp3({HD,0,0},{-HD,0,0},v0).x};
                    B = {lerp3({-HW,0,0},{HW,0,0},u1).x, 0, lerp3({HD,0,0},{-HD,0,0},v0).x};
                    C = {lerp3({-HW,0,0},{HW,0,0},u1).x, 0, lerp3({HD,0,0},{-HD,0,0},v1).x};
                    D = {lerp3({-HW,0,0},{HW,0,0},u0).x, 0, lerp3({HD,0,0},{-HD,0,0},v1).x};
                }

                glm::vec2 uvA={u0,v0}, uvB={u1,v0}, uvC={u1,v1}, uvD={u0,v1};
                uint32_t base = static_cast<uint32_t>(m.vertices.size());
                m.vertices.push_back({A, n, uvA});
                m.vertices.push_back({B, n, uvB});
                m.vertices.push_back({C, n, uvC});
                m.vertices.push_back({D, n, uvD});

                m.indices.push_back(base+0); m.indices.push_back(base+1); m.indices.push_back(base+2);
                m.indices.push_back(base+0); m.indices.push_back(base+2); m.indices.push_back(base+3);
            }
        }
    }

    // ── Surface engravings: horizontal cut bands (inset thin-box strips) ──────
    // Simulate the mathematical groove patterns visible in close-up camera fly.
    const int N_GROOVE_BANDS = subdivisions * 2;
    for (int k = 0; k < N_GROOVE_BANDS; k++) {
        float yt = float(k) / float(N_GROOVE_BANDS);
        float depth = 0.005f + 0.015f * fhash(float(k) * 3.7f);
        float band_h = 0.008f + 0.012f * fhash(float(k) * 5.3f);
        float y0 = yt * HH * 2.0f - band_h * 0.5f;
        float y1 = y0 + band_h;

        // Engrave front face (+Z)
        add_box(m,
            {-HW + depth, y0, HD - depth},
            { HW - depth, y1, HD});
        // Engrave back face (-Z)
        add_box(m,
            {-HW + depth, y0, -HD},
            { HW - depth, y1, -HD + depth});
        // Engrave side +X
        add_box(m,
            {HW - depth, y0, -HD + depth},
            {HW,         y1,  HD - depth});
        // Engrave side -X
        add_box(m,
            {-HW,         y0, -HD + depth},
            {-HW + depth, y1,  HD - depth});
    }

    // ── Vertical engraving lines ───────────────────────────────────────────────
    const int N_VGROOVE = subdivisions;
    for (int k = 0; k < N_VGROOVE; k++) {
        float xt = float(k) / float(N_VGROOVE);
        float depth = 0.005f + 0.012f * fhash(float(k) * 2.9f + 77.0f);
        float bw = 0.006f + 0.01f * fhash(float(k) * 4.1f + 33.0f);
        float x0 = flerp(-HW + depth, HW - depth, xt) - bw * 0.5f;
        float x1 = x0 + bw;

        // Front face vertical groove
        add_box(m,
            {x0, 0.0f,  HD - depth},
            {x1, HH*2,  HD});
        // Back face vertical groove
        add_box(m,
            {x0, 0.0f, -HD},
            {x1, HH*2, -HD + depth});
    }

    return m;
}

// ─── City (Scene 3) ───────────────────────────────────────────────────────────
// Brutalist megacity grid.
// Grid: blocks of size BLOCK_UNIT. Boulevard every BOULEVARD_EVERY blocks.
// Building placement: clusters of 3-4 per super-block.
// Height curve: radial falloff from origin.

MeshData build_city(int building_count) {
    MeshData m;

    // ── Layout constants ──────────────────────────────────────────────────────
    const float BLOCK_UNIT      = 12.0f;   // distance between building cluster centers
    const float BOULEVARD_EXTRA = 6.0f;    // extra gap every N blocks
    const int   BOULEVARD_EVERY = 4;       // boulevard frequency
    const float CITY_RADIUS     = 180.0f;  // buildings beyond this are suppressed
    const float CENTER_HEIGHT   = 4.0f;    // max height_factor at center
    const float EDGE_HEIGHT     = 0.6f;    // min height_factor at edge
    const float FLOOR_H         = 3.2f;

    // Determine grid extent from building_count
    int grid_side = static_cast<int>(std::sqrt(float(building_count) / 3.5f)) + 2;
    float city_half = float(grid_side) * BLOCK_UNIT * 0.5f;

    // ── Ground plane ─────────────────────────────────────────────────────────
    // Flat box slightly below Y=0 for street-level
    float gp_ext = city_half + 30.0f;
    add_box(m,
        {-gp_ext, -0.25f, -gp_ext},
        { gp_ext,  0.0f,   gp_ext});

    // ── Landmark placement (absolute coordinates, city center) ───────────────
    struct LandmarkSpec { float cx, cz, seed; int type; };
    LandmarkSpec landmarks[] = {
        {  0.0f,    0.0f,  101.3f, 0 }, // Center: Pyramid
        {-55.0f,  -50.0f,  202.7f, 1 }, // Twin towers
        { 60.0f,   45.0f,  303.1f, 2 }, // Obelisk
        {-60.0f,   55.0f,  404.9f, 3 }, // Fortress
        { 50.0f,  -60.0f,  505.5f, 0 }, // Second pyramid
        {  0.0f,   80.0f,  606.3f, 2 }, // Far obelisk
        { 80.0f,    0.0f,  707.7f, 1 }, // East twin towers
    };

    for (auto& lm : landmarks) {
        switch (lm.type) {
            case 0: add_landmark_pyramid    (m, lm.cx, lm.cz, lm.seed, 8.0f, 8.0f, FLOOR_H); break;
            case 1: add_landmark_twin_towers(m, lm.cx, lm.cz, lm.seed, FLOOR_H); break;
            case 2: add_landmark_obelisk    (m, lm.cx, lm.cz, lm.seed, FLOOR_H); break;
            case 3: add_landmark_fortress   (m, lm.cx, lm.cz, lm.seed, FLOOR_H); break;
        }
    }

    // ── Grid buildings ────────────────────────────────────────────────────────
    int placed = 0;
    int target  = building_count;

    for (int gi = -grid_side; gi <= grid_side && placed < target; gi++) {
        // Accumulate boulevard offsets in X
        float bx_offset = 0.0f;
        for (int b = 0; b < std::abs(gi); b++) {
            if ((b % BOULEVARD_EVERY) == (BOULEVARD_EVERY - 1))
                bx_offset += BOULEVARD_EXTRA * (gi < 0 ? -1.0f : 1.0f);
        }
        float cx_base = float(gi) * BLOCK_UNIT + bx_offset;

        for (int gj = -grid_side; gj <= grid_side && placed < target; gj++) {
            float bz_offset = 0.0f;
            for (int b = 0; b < std::abs(gj); b++) {
                if ((b % BOULEVARD_EVERY) == (BOULEVARD_EVERY - 1))
                    bz_offset += BOULEVARD_EXTRA * (gj < 0 ? -1.0f : 1.0f);
            }
            float cz_base = float(gj) * BLOCK_UNIT + bz_offset;

            // Skip cells too far from center
            float dist = std::sqrt(cx_base * cx_base + cz_base * cz_base);
            if (dist > CITY_RADIUS) continue;

            // Height factor: smooth radial falloff
            float norm_dist = dist / CITY_RADIUS;
            float height_factor = flerp(CENTER_HEIGHT, EDGE_HEIGHT,
                                        smoothstep(norm_dist));

            // Super-block: place 3-4 buildings in this cell cluster
            float cell_seed = fhash2(float(gi), float(gj));
            int cluster_size = 3 + static_cast<int>(fhash(cell_seed * 7.3f) * 2.0f);

            for (int c = 0; c < cluster_size && placed < target; c++) {
                float b_seed = fhash(cell_seed * 31.7f + float(c) * 17.3f);

                // Sub-position within super-block
                float sub_x = (fhash(b_seed + 0.11f) - 0.5f) * BLOCK_UNIT * 0.65f;
                float sub_z = (fhash(b_seed + 0.22f) - 0.5f) * BLOCK_UNIT * 0.65f;

                float bx = cx_base + sub_x;
                float bz = cz_base + sub_z;

                // Don't overlap landmark zones (crude check)
                bool near_landmark = false;
                for (auto& lm : landmarks) {
                    float dx = bx - lm.cx;
                    float dz = bz - lm.cz;
                    if (std::sqrt(dx*dx + dz*dz) < 22.0f) {
                        near_landmark = true;
                        break;
                    }
                }
                if (near_landmark) continue;

                // Height variation within cluster (taller buildings closer to cluster center)
                float hf_local = height_factor * flerp(0.6f, 1.0f, fhash(b_seed + 0.5f));

                add_building_complex(m, bx, bz, b_seed * 100.0f, hf_local);
                placed++;
            }
        }
    }

    return m;
}

// ─── GPU upload ───────────────────────────────────────────────────────────────

void upload(const MeshData& mesh,
            uint32_t& out_vao, uint32_t& out_vbo, uint32_t& out_ebo)
{
    glGenVertexArrays(1, &out_vao);
    glGenBuffers(1, &out_vbo);
    glGenBuffers(1, &out_ebo);

    glBindVertexArray(out_vao);

    glBindBuffer(GL_ARRAY_BUFFER, out_vbo);
    glBufferData(GL_ARRAY_BUFFER,
                 mesh.vertices.size() * sizeof(Vertex),
                 mesh.vertices.data(),
                 GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, out_ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER,
                 mesh.indices.size() * sizeof(uint32_t),
                 mesh.indices.data(),
                 GL_STATIC_DRAW);

    // layout(location=0): position
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                          reinterpret_cast<void*>(offsetof(Vertex, position)));

    // layout(location=1): normal
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                          reinterpret_cast<void*>(offsetof(Vertex, normal)));

    // layout(location=2): uv
    glEnableVertexAttribArray(2);
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                          reinterpret_cast<void*>(offsetof(Vertex, uv)));

    glBindVertexArray(0);
}

}  // namespace ProceduralMesh
}  // namespace hyp
