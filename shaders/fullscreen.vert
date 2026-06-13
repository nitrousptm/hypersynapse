#version 460 core

out vec3  v_world_pos;
out vec3  v_normal;
out vec2  v_uv;
out float v_instance_id;
out float v_corruption;

void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    v_uv          = p;
    v_world_pos   = vec3(0.0);
    v_normal      = vec3(0.0, 0.0, 1.0);
    v_instance_id = 0.0;
    v_corruption  = 0.0;
    gl_Position   = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
