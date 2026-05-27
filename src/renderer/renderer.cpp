#include "renderer/renderer.h"

#include <glad/gl.h>

#include "shader/shader.h"
#include "timeline/timeline.h"

namespace hyp {

bool Renderer::init(int width, int height) {
    width_ = width;
    height_ = height;

    glGenVertexArrays(1, &fullscreen_vao_);

    intro_program_ = shader::load_program(
        HYP_SHADER_DIR "/fullscreen.vert",
        HYP_SHADER_DIR "/scenes/01_intro.frag");
    if (!intro_program_) return false;

    glViewport(0, 0, width_, height_);
    return true;
}

void Renderer::render(const Timeline& tl) {
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(intro_program_);
    glUniform1f(glGetUniformLocation(intro_program_, "u_time"), static_cast<float>(tl.time()));
    glUniform2f(glGetUniformLocation(intro_program_, "u_res"),
                static_cast<float>(width_), static_cast<float>(height_));

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);
}

void Renderer::shutdown() {
    if (fullscreen_vao_) glDeleteVertexArrays(1, &fullscreen_vao_);
    if (intro_program_) glDeleteProgram(intro_program_);
    fullscreen_vao_ = 0;
    intro_program_ = 0;
}

}  // namespace hyp
