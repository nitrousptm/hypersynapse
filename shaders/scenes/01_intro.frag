#version 460 core

in vec2 v_uv;
out vec4 frag;

uniform float u_time;
uniform vec2  u_res;

// Placeholder intro scene — cyberpunk grid pulse.
// Real intro will be authored by the Shader Specialist + Procedural Content agents.

float grid(vec2 uv, float scale) {
    vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
    float line = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, 1.5, line);
}

void main() {
    vec2 uv = (v_uv * u_res - 0.5 * u_res) / u_res.y;

    // Perspective-warped floor toward horizon.
    float persp = 1.0 / max(0.001, uv.y * 0.6 + 0.5);
    vec2 floor_uv = vec2(uv.x * persp, persp * 0.3 + u_time * 0.4);

    float floor_grid = grid(floor_uv, 8.0) * smoothstep(0.5, -0.1, uv.y);
    float horizon = exp(-pow(uv.y - 0.05, 2.0) * 200.0) * 0.6;

    vec3 magenta = vec3(0.95, 0.10, 0.55);
    vec3 cyan    = vec3(0.10, 0.85, 0.95);

    float pulse = 0.5 + 0.5 * sin(u_time * 1.7);
    vec3 col = mix(magenta, cyan, pulse) * (floor_grid + horizon);

    // Vignette.
    col *= 1.0 - 0.5 * dot(uv, uv);

    frag = vec4(col, 1.0);
}
