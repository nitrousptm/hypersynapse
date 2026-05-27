#include <cstdio>
#include <cstdlib>

#include <glad/gl.h>
#include <GLFW/glfw3.h>

#include "renderer/renderer.h"
#include "timeline/timeline.h"
#include "audio/audio.h"

namespace {

constexpr int kWidth = 1920;
constexpr int kHeight = 1080;
constexpr double kDemoDurationSec = 480.0;

void glfw_error(int code, const char* desc) {
    std::fprintf(stderr, "[glfw] %d: %s\n", code, desc);
}

void GLAPIENTRY gl_debug(GLenum, GLenum type, GLuint, GLenum severity,
                         GLsizei, const GLchar* msg, const void*) {
    if (severity == GL_DEBUG_SEVERITY_NOTIFICATION) return;
    std::fprintf(stderr, "[gl] type=0x%x sev=0x%x: %s\n", type, severity, msg);
}

}  // namespace

int main(int argc, char** argv) {
    (void)argc; (void)argv;

    glfwSetErrorCallback(glfw_error);
    if (!glfwInit()) return EXIT_FAILURE;

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GLFW_TRUE);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint(GLFW_SAMPLES, 0);

    GLFWwindow* window = glfwCreateWindow(kWidth, kHeight, "hypersynapse — agentix", nullptr, nullptr);
    if (!window) { glfwTerminate(); return EXIT_FAILURE; }

    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    if (!gladLoadGL(glfwGetProcAddress)) {
        std::fprintf(stderr, "glad: failed to load GL\n");
        return EXIT_FAILURE;
    }

    glEnable(GL_DEBUG_OUTPUT);
    glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);
    glDebugMessageCallback(gl_debug, nullptr);

    std::printf("[hypersynapse] GL %s | %s | %s\n",
                glGetString(GL_VERSION), glGetString(GL_VENDOR), glGetString(GL_RENDERER));

    hyp::Renderer renderer;
    if (!renderer.init(kWidth, kHeight)) return EXIT_FAILURE;

    hyp::Timeline timeline(kDemoDurationSec);
    hyp::Audio audio;
    audio.init();

    const double t0 = glfwGetTime();
    while (!glfwWindowShouldClose(window)) {
        const double t = glfwGetTime() - t0;
        if (t >= kDemoDurationSec) break;

        timeline.update(t);
        renderer.render(timeline);

        glfwSwapBuffers(window);
        glfwPollEvents();

        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, GLFW_TRUE);
    }

    audio.shutdown();
    renderer.shutdown();
    glfwDestroyWindow(window);
    glfwTerminate();
    return EXIT_SUCCESS;
}
