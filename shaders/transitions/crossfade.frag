#version 460 core
// Act I → Act II Crossfade Shader
// Smooth dissolve transition between two scene renderings.
// Input: u_from (Act I buffer), u_to (Act II buffer)
// Timeline: triggers at ~2:15, duration ~1.5 seconds

in vec2 v_uv;
out vec4 frag;

uniform sampler2D u_from;      // Act I render (previous frame)
uniform sampler2D u_to;        // Act II render (computed in parallel)
uniform float u_transition;    // [0,1] fade progress during crossfade window

#define PI  3.14159265358979323846
#define TAU 6.28318530717958647692

// Easing function: smooth step with ease-in-out cubic
float ease_in_out(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - 0.5 * pow(2.0 * t - 2.0, 3.0);
}

void main() {
    vec3 from_col = texture(u_from, v_uv).rgb;
    vec3 to_col   = texture(u_to, v_uv).rgb;

    // Clamp transition to [0,1] (safety)
    float t = clamp(u_transition, 0.0, 1.0);

    // Apply easing for smoother feel
    float ease_t = ease_in_out(t);

    // Dissolve pattern: use spatial + temporal noise for organic feel
    vec2 dissolve_uv = v_uv * 3.5 + sin(u_transition * TAU) * 0.15;
    float noise = fract(sin(dot(dissolve_uv, vec2(12.9898, 78.233))) * 43758.5453);

    // Threshold-based dissolve: noise determines when pixels fade
    float threshold = mix(-0.2, 1.2, ease_t);
    float dissolve_mask = smoothstep(threshold - 0.1, threshold + 0.1, noise);

    // Linear crossfade (optional: replace with dissolve_mask for harder edge)
    vec3 result = mix(from_col, to_col, ease_t);

    frag = vec4(result, 1.0);
}
