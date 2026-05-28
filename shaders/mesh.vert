#version 460 core

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

// Per-instance data (SSBO slot 0)
struct BuildingInstance {
    vec4 transform;  // xyz = world position, w = y-scale (height)
    vec4 props;      // x = width, y = depth, z = instance_id float, w = corruption
};

layout(std430, binding = 0) readonly buffer BuildingInstances {
    BuildingInstance instances[];
};

uniform mat4 u_view;
uniform mat4 u_proj;
uniform float u_time;
uniform float u_scene_norm;   // 0..1 within Scene 3
uniform float u_beat;

out vec3 v_world_pos;
out vec3 v_normal;
out vec2 v_uv;
out float v_instance_id;
out float v_corruption;

// Hash for per-building variation
float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
    BuildingInstance inst = instances[gl_InstanceID];

    vec3 world_pos = a_position;

    // Scale building by instance dimensions
    float height  = inst.transform.w;
    float width   = inst.props.x;
    float depth_b = inst.props.y;
    world_pos *= vec3(width, height, depth_b);

    // World position offset
    world_pos.xz += inst.transform.xz;
    world_pos.y  += world_pos.y;  // already scaled

    // Vertex displacement — buildings warp to mathematical shapes over time
    float corruption = inst.props.w * u_scene_norm;
    float fi = inst.props.z;

    float disp_scale = corruption * corruption;
    // Sinusoidal displacement along Y-axis (building bending)
    float bend = sin(world_pos.y * 0.5 + u_time * 0.8 + fi * 1.3) * disp_scale * 0.4;
    world_pos.x += bend;
    world_pos.z += cos(world_pos.y * 0.5 + u_time * 0.7 + fi * 2.1) * disp_scale * 0.3;

    // Beat-sync jolt on strong beats
    float jolt = smoothstep(0.04, 0.0, u_beat) * disp_scale * 0.1;
    world_pos += vec3(
        sin(fi * 7.3) * jolt,
        jolt * 0.2,
        cos(fi * 5.1) * jolt
    );

    v_world_pos  = world_pos;
    v_normal     = a_normal;
    v_uv         = a_uv;
    v_instance_id = fi;
    v_corruption = corruption;

    gl_Position = u_proj * u_view * vec4(world_pos, 1.0);
}
