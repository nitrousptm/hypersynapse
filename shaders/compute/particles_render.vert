#version 460 core
// Particle rendering vertex shader
// Reads particle positions from SSBO, outputs point sprite geometry.

struct Particle {
    vec4 pos_age;      // xyz: position, w: age (s)
    vec4 vel_type;     // xyz: velocity, w: particle type
    vec4 col_life;     // xyz: color, w: lifetime (s)
};

layout(std430, binding = 0) readonly buffer ParticleBuffer {
    Particle particles[];
} particles_ro;

uniform mat4  u_view;
uniform mat4  u_proj;
uniform float u_particle_size;
uniform float u_act_norm;

out flat uint v_particle_id;
out float     v_age_norm;
out vec4      v_color;
out float     v_size;
out vec3      v_velocity;
out float     v_act_norm;

void main() {
    uint idx     = gl_VertexID;
    Particle p   = particles_ro.particles[idx];

    vec3  world_pos = p.pos_age.xyz;
    vec4  view_pos  = u_view * vec4(world_pos, 1.0);
    gl_Position     = u_proj * view_pos;

    float depth    = length(view_pos.xyz);
    gl_PointSize   = u_particle_size / (depth + 0.1);

    v_particle_id = idx;
    v_age_norm    = p.pos_age.w / p.col_life.w;
    v_color       = p.col_life;
    v_size        = gl_PointSize;
    v_velocity    = p.vel_type.xyz;
    v_act_norm    = u_act_norm;
}
