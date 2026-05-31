#include "debug/debug_ui.h"

#include <glad/gl.h>
#include <cstdio>

#include "shader/shader.h"
#include "timeline/timeline.h"

namespace hyp {

DebugUI::DebugUI() = default;
DebugUI::~DebugUI() = default;

bool DebugUI::init() {
    const char* vert_src = R"(
        #version 460 core
        layout(location = 0) in vec2 aPos;
        out vec2 vPos;
        void main() {
            gl_Position = vec4(aPos, 0.0, 1.0);
            vPos = aPos;
        }
    )";

    const char* frag_src = R"(
        #version 460 core
        in vec2 vPos;
        out vec4 FragColor;

        uniform int u_scene_idx;

        void main() {
            // Bottom-right corner box (NDC: -1..1)
            vec2 corner = vPos - vec2(0.85, -0.85);
            if (abs(corner.x) < 0.14 && abs(corner.y) < 0.08) {
                // Semi-transparent dark background
                vec3 bg = vec3(0.0, 0.15, 0.1);
                vec3 text = vec3(0.2, 1.0, 0.5);

                // Simple digit glyph (just show scene number 0-6)
                float digit = float(u_scene_idx);
                float glyph_x = (corner.x + 0.14) * 3.0;  // scale to digit area

                // Very basic: just center a bright area
                float dist = length(corner);
                float intensity = smoothstep(0.12, 0.02, dist);

                FragColor = vec4(mix(bg, text, intensity * 0.8), 0.75);
            } else {
                discard;
            }
        }
    )";

    overlay_program_ = shader::load_program_from_src(vert_src, frag_src);
    if (!overlay_program_) {
        std::fprintf(stderr, "[debug_ui] overlay shader failed\n");
        return false;
    }

    glGenVertexArrays(1, &overlay_vao_);
    return true;
}

void DebugUI::shutdown() {
    if (overlay_program_) glDeleteProgram(overlay_program_);
    if (overlay_vao_) glDeleteVertexArrays(1, &overlay_vao_);
}

void DebugUI::render(const Timeline& tl, int width, int height) {
    if (!overlay_program_) return;

    Scene sc = tl.scene();
    int scene_idx = static_cast<int>(sc);

    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glUseProgram(overlay_program_);
    glUniform1i(glGetUniformLocation(overlay_program_, "u_scene_idx"), scene_idx);

    // Full-screen quad
    GLfloat vertices[] = {
        -1.0f,  1.0f,
         1.0f,  1.0f,
         1.0f, -1.0f,
        -1.0f, -1.0f,
    };

    GLuint indices[] = { 0, 1, 2, 0, 2, 3 };

    uint32_t vbo, ebo;
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);

    glBindVertexArray(overlay_vao_);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(GLfloat), (void*)0);

    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, nullptr);

    glBindVertexArray(0);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);

    glDisable(GL_BLEND);
    glUseProgram(0);
}

}  // namespace hyp
