#version 460 core
out vec4 frag_color;

// This shader is used as the fragment pass for the polygon city mesh.
// The vertex shader (mesh.vert) handles building position + vertex displacement.
// u_scene_norm controls how much the buildings "corrupt" toward mathematical forms.

uniform float u_time;
uniform vec2  u_res;
uniform float u_beat;
uniform float u_bar;
uniform float u_act_norm;
uniform float u_scene_norm;

// Passed from mesh.vert
in vec3 v_world_pos;
in vec3 v_normal;
in vec2 v_uv;
in float v_instance_id;
in float v_corruption;  // per-building corruption 0..1

// ─── utils ────────────────────────────────────────────────────────────────────

float hash(float n) { return fract(sin(n) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// ─── Advanced Window System (multi-layer, flickering networks) ────────────────
// Returns (window_base, surge_intensity) packed as vec2.
// surge_intensity: beat-driven power surge wave traveling up the building face —
// on each 133 BPM kick the activation front propagates bottom→top over ~0.4s,
// creating a vertical "system overload" wave visible per-building. Intensity
// scales with v_corruption so the effect grows stronger as the AI takes over.
float window_grid(vec2 uv, float id) {
    vec2 wuv = fract(uv * vec2(6.0, 12.0));
    vec2 wid = floor(uv * vec2(6.0, 12.0));
    float lit = step(0.7, hash2(wid + id * 0.3));

    // Multi-layer flickering
    float flicker = step(0.98, hash2(wid + floor(u_time * 4.0)));
    flicker += step(0.95, hash2(wid + floor(u_time * 2.3))) * 0.5;
    flicker += step(0.92, hash2(wid + floor(u_time * 7.0))) * 0.3;

    // Window edge glow
    float edge = min(wuv.x, min(1.0-wuv.x, min(wuv.y, 1.0-wuv.y)));
    float window_glow = smoothstep(0.15, 0.0, edge);

    // Color temperature variation
    float color_var = hash2(wid) * 0.3;

    return lit * window_glow * (1.0 - flicker) * (0.8 + color_var);
}

// Beat-driven power surge wave: front propagates 0→1 UV-y over ~0.45s per beat.
// Per-building phase offset (hash of id) staggers the wave so adjacent buildings
// don't all surge simultaneously — creates a city-wide cascade read.
float surge_wave(vec2 uv, float id) {
    float wave_speed = 2.2;  // UV units per second → 0→1 in ~0.45s
    float phase      = hash(id * 7.13 + 0.37) * 0.18;  // ±0-0.18s per-building stagger
    float wave_front = u_beat * wave_speed + phase;     // u_beat rises 0→1 over one beat period
    float above_front = smoothstep(0.08, 0.0, uv.y - wave_front);
    float decay       = exp(-u_beat * 4.0);             // fades over the beat period
    return above_front * decay;
}

// ─── Multi-level Artery System (recursive spreading fractals) ──────────────────
float artery_main(vec2 uv, float spread, int depth) {
    vec2 p = uv * 8.0;
    float v = 0.0;
    for (int i = 0; i < depth; i++) {
        p = abs(p) / dot(p, p) - vec2(0.5, 0.5);
        v += 1.0 / (1.0 + dot(p, p) * (5.0 - spread * 3.0));
    }
    return clamp(v * spread, 0.0, 1.0);
}

float artery(vec2 uv) {
    float spread = u_scene_norm;
    float v = artery_main(uv, spread, 5) * 0.7;
    v += artery_main(uv * 0.5 + vec2(0.1, 0.2), spread, 4) * 0.3;
    v += artery_main(uv * 1.5, spread * 0.8, 3) * 0.2;
    return clamp(v, 0.0, 1.0);
}

// ─── main ─────────────────────────────────────────────────────────────────────

void main() {
    // Base material: brutal concrete grey
    vec3 col = vec3(0.06, 0.07, 0.09);

    // Concrete texture variation
    float concrete_var = hash2(v_uv * vec2(100.0, 200.0)) * 0.08;
    col += concrete_var;

    // Two-light diffuse: warm remnant daylight + cold blue AI corruption light.
    // As v_corruption grows the AI light dominates — buildings turn blue-electric.
    vec3 n = normalize(v_normal);
    vec3 sun_dir = normalize(vec3(0.3, 1.0, 0.5));
    vec3 ai_dir  = normalize(vec3(-0.5, 0.4, -0.8));
    float diff_sun = max(dot(n, sun_dir), 0.0) * mix(0.55, 0.10, v_corruption);
    float diff_ai  = max(dot(n, ai_dir),  0.0) * v_corruption * 1.8;
    col *= 0.28 + diff_sun + diff_ai;

    // Window lights
    float wins = window_grid(v_uv, v_instance_id);
    vec3 win_col = mix(vec3(1.0, 0.7, 0.4), vec3(0.2, 0.8, 1.0), v_corruption);
    col += wins * win_col * (0.5 + 0.5 * u_scene_norm);

    // Window specular — glass surfaces catch the sun while un-corrupted
    vec3 view_dir = normalize(-v_world_pos);
    vec3 h_spec   = normalize(sun_dir + view_dir);
    float spec = pow(max(dot(n, h_spec), 0.0), 28.0) * (1.0 - v_corruption);
    col += wins * spec * vec3(0.9, 0.85, 0.7) * 0.35;

    // Light arteries spreading across surface
    float art = artery(v_uv + vec2(u_time * 0.02, 0.0));
    col += art * vec3(0.0, 0.5, 1.0) * v_corruption * 2.0;

    // Corruption discoloration: building transitions to mathematical form
    // Edges and corners glow as geometry warps
    float edge = 1.0 - abs(dot(normalize(v_normal), vec3(0,0,1)));
    col += edge * v_corruption * vec3(0.1, 0.3, 1.0) * 1.5;

    // Beat sync: power-surge wave propagates up each building on every 133 BPM kick.
    // Replaces uniform flash — each building has a per-hash phase offset so the
    // surge cascades across the city instead of all buildings firing simultaneously.
    // Intensity scales with v_corruption: max effect when AI fully controls the grid.
    float surge  = surge_wave(v_uv, v_instance_id);
    float base_f = smoothstep(0.05, 0.0, u_beat) * 0.08;  // brief global floor flash
    col += surge * v_corruption * vec3(0.05, 0.30, 1.00) * 1.4;
    col += base_f * vec3(0.10, 0.20, 0.50);
    // Window overload: bright cyan window burst riding the surge front
    col += wins * surge * v_corruption * vec3(0.10, 0.65, 1.00) * 2.2;

    // Corrupt buildings fade toward bright mathematical lines
    vec3 math_col = vec3(0.0, 0.8, 1.0) * (0.5 + 0.5 * sin(v_world_pos.y * 4.0 + u_time));
    col = mix(col, math_col, v_corruption * v_corruption * 0.7);

    // Distance fog: deep atmospheric perspective
    float fog = 1.0 - exp(-length(v_world_pos) * 0.04);
    vec3 fog_col = vec3(0.01, 0.03, 0.08);
    col = mix(col, fog_col, fog);

    frag_color = vec4(col, 1.0);
}
