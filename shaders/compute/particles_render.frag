#version 460 core
// Particle rendering via point sprites
// Receives particle data (position, color, age) via instanced geometry
// or compute-generated geometry buffer.
//
// TODO: Implement actual rendering (point sprites with depth blending).
// This is a skeleton showing expected uniforms and IO.

in flat uint v_particle_id;
in float v_age_norm;      // [0,1] where 1 = dead
in vec4 v_color;

out vec4 frag;

uniform float u_beat;
uniform float u_act_norm;

void main() {
    // Discard if too old
    if (v_age_norm > 1.0) discard;

    // Simple point sprite: antialiased circle
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r = length(uv);
    if (r > 1.0) discard;

    // Smooth edges
    float edge = smoothstep(1.0, 0.8, r);

    // Fade over lifetime
    float fade = 1.0 - v_age_norm;

    // Beat kick: brighten on downbeat
    float kick = exp(-u_beat * 8.0);

    vec4 col = v_color * fade * edge;
    col.rgb *= (1.0 + kick * 0.5);

    // Additive blend
    frag = col;
}
