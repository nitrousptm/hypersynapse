#version 460 core
// Particle rendering — soft glow sprites with act-aware color grading
// Supports velocity-elongated elliptical point sprites: fast particles
// appear as streaks/comets aligned to their direction of travel.

in flat uint v_particle_id;
in float v_age_norm;      // [0,1] where 1 = dead
in vec4  v_color;         // rgb = base color, a = unused
in float v_size;          // point size in pixels (from vert)
in vec3  v_velocity;      // world-space velocity (for stretch/color)
in float v_act_norm;      // forwarded from vert for act-aware shading
in vec2  v_vel_dir;       // normalised screen-space velocity direction
in float v_vel_mag;       // screen-space velocity magnitude (0–4)

out vec4 frag;

uniform float u_beat;
uniform float u_act_norm;

// ─── circular soft glow disc ─────────────────────────────────────────────────
float soft_disc(float r) {
    float core = smoothstep(0.28, 0.0, r);
    float halo = smoothstep(1.0,  0.0, r) * 0.35;
    return core + halo;
}

// ─── velocity-elongated elliptical glow disc ──────────────────────────────────
// Projects point-sprite UV onto velocity and perpendicular axes, then scales
// each axis independently to create a comet/streak appearance for fast particles.
// stretch ∈ [0,1]: 0 = circle, 1 = max elongation (~2.5× along vel direction).
float soft_disc_streak(vec2 uv, vec2 vel_dir, float stretch) {
    vec2  perp  = vec2(-vel_dir.y, vel_dir.x);
    float along = dot(uv, vel_dir) / (1.0 + stretch * 1.6);  // compress along-axis
    float side  = dot(uv, perp)   * (1.0 + stretch * 0.22); // expand perp-axis
    float ell_r = sqrt(along * along + side * side);
    float core  = smoothstep(0.28, 0.0, ell_r);
    float halo  = smoothstep(1.0,  0.0, ell_r) * 0.35;
    return core + halo;
}

// ─── act-aware color tint ─────────────────────────────────────────────────────
vec3 act_tint(vec3 base_col, float act_norm) {
    vec3 tint_i   = vec3(0.85, 0.90, 1.10);
    vec3 tint_ii  = vec3(0.60, 0.80, 1.40);
    vec3 tint_iii = vec3(1.20, 0.60, 1.30);
    vec3 tint_iv  = vec3(1.10, 1.10, 1.15);

    vec3 tint;
    if      (act_norm < 0.1875) tint = mix(tint_i,   tint_i,   act_norm / 0.1875);
    else if (act_norm < 0.4375) tint = mix(tint_i,   tint_ii,  (act_norm - 0.1875) / 0.25);
    else if (act_norm < 0.75)   tint = mix(tint_ii,  tint_iii, (act_norm - 0.4375) / 0.3125);
    else                         tint = mix(tint_iii, tint_iv,  (act_norm - 0.75)   / 0.25);

    return base_col * tint;
}

// ─── main ─────────────────────────────────────────────────────────────────────
void main() {
    if (v_age_norm > 1.0) discard;

    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float r  = length(uv);
    if (r > 1.0) discard;

    // Velocity-aligned elliptical disc: map 0–4 vel magnitude → 0–0.85 stretch.
    // Acts III/IV benefit most: vortex+curl (Act III) and singularity pull (Act IV)
    // both produce high-speed particles that now streak visually.
    float stretch    = v_vel_mag * 0.21;
    float brightness = (stretch > 0.04)
        ? soft_disc_streak(uv, normalize(v_vel_dir), stretch)
        : soft_disc(r);

    float life_fade  = smoothstep(1.0, 0.80, v_age_norm);
    float kick       = exp(-u_beat * 8.0);
    float speed      = length(v_velocity);
    float speed_glow = 1.0 + smoothstep(0.0, 4.0, speed) * 0.6;

    vec3 col = act_tint(v_color.rgb, u_act_norm);
    col *= brightness * life_fade * speed_glow;
    col *= 1.0 + kick * 0.5;
    col *= 1.4;

    frag = vec4(col, brightness * life_fade);
}
