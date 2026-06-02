#version 460 core

out vec2  v_uv;
out float v_corruption;

void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    v_uv = p;
    v_corruption = 0.0;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
