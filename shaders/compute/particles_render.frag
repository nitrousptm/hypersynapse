#version 460 core
// Particle rendering — soft glow sprites with act-aware color grading

in flat uint v_particle_id;
in float v_age_norm;      // [0,1] where 1 = dead
in vec4  v_color;         // rgb = base color, a = unused
in float v_size;          // point size in pixels (from vert)
in vec3  v_velocity;      // world-space velocity (for stretch/color)
in float v_act_norm;      // forwarded from vert for act-aware shading

out vec4 frag;

uniform float u_beat;
uniform float u_act_norm;

// ─── soft glow disc ───────────────────────────────────────────────────────────
// Two-layer radial falloff: hard inner core + soft atmospheric halo
float soft_disc(float r) {
    float core = smoothstep(0.28, 0.0, r);           // tight bright core
    float halo = smoothstep(1.0,  0.0, r) * 0.35;   // soft wide halo
    return core + halo;
}

// ─── act-aware color tint ─────────────────────────────────────────────────────
// Shifts particle color toward each act's signature palette
vec3 act_tint(vec3 base_col, float act_norm) {
    vec3 tint_i   = vec3(0.85, 0.90, 1.10);   // Act I:   cold blue-white
    vec3 tint_ii  = vec3(0.60, 0.80, 1.40);   // Act II:  electric cyan
    vec3 tint_iii = vec3(1.20, 0.60, 1.30);   // Act III: magenta-violet
    vec3 tint_iv  = vec3(1.10, 1.10, 1.15);   // Act IV:  near-white cosmic

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

    // Point sprite UV in [-1, 1]
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r  = length(uv);
    if (r > 1.0) discard;

    // Soft glow falloff
    float brightness = soft_disc(r);

    // Lifetime fade: particles fade out in final 20% of life
    float life_fade = smoothstep(1.0, 0.80, v_age_norm);

    // Beat kick: energy pulse on downbeat
    float kick = exp(-u_beat * 8.0);

    // Velocity-based glow boost: fast particles glow brighter
    float speed = length(v_velocity);
    float speed_glow = 1.0 + smoothstep(0.0, 4.0, speed) * 0.6;

    // Compose color
    vec3 col = act_tint(v_color.rgb, u_act_norm);
    col *= brightness * life_fade * speed_glow;
    col *= 1.0 + kick * 0.5;   // Beat brightening

    // Emit slightly in HDR range for bloom pickup
    col *= 1.4;

    // Alpha: additive blending — use brightness as alpha so GL_ONE,GL_ONE gives correct stacking
    frag = vec4(col, brightness * life_fade);
}
