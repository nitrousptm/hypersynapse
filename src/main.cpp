#include <cstdio>
#include <cstdlib>
#include <memory>

#include <glad/gl.h>
#include <GLFW/glfw3.h>

#include "renderer/renderer.h"
#include "timeline/timeline.h"
#include "audio/audio.h"
#include "capture/capture.h"

namespace {

constexpr int kWidth = 1920;
constexpr int kHeight = 1080;
constexpr double kDemoDurationSec = 240.0;   // 4:00 — Concrete-Syncope.wav @ 133 BPM

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
    glfwSetErrorCallback(glfw_error);
    if (!glfwInit()) return EXIT_FAILURE;

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GLFW_TRUE);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint(GLFW_SAMPLES, 0);

    GLFWwindow* window = glfwCreateWindow(kWidth, kHeight, "SINGULARITY GARDEN — agentix", nullptr, nullptr);
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

    std::printf("[singularity-garden] GL %s | %s | %s\n",
                glGetString(GL_VERSION), glGetString(GL_VENDOR), glGetString(GL_RENDERER));

    hyp::Renderer renderer;
    if (!renderer.init(kWidth, kHeight)) return EXIT_FAILURE;

    hyp::Timeline timeline(kDemoDurationSec);
    hyp::Audio audio;
    if (!audio.init()) return EXIT_FAILURE;

    const char* audio_path = nullptr;
    bool capture_mode = false;

    if (argc > 1) {
        for (int i = 1; i < argc; ++i) {
            if (std::string_view(argv[i]) == "--capture") {
                capture_mode = true;
                std::printf("[hypersynapse] capture mode enabled\n");
            } else {
                audio_path = argv[i];
            }
        }
        if (audio_path) audio.play(audio_path);
    }

    // Optional: initialize frame capture for --capture mode
    std::unique_ptr<hyp::FrameCapture> capture;
    if (capture_mode) {
        capture = std::make_unique<hyp::FrameCapture>("./captures", kWidth, kHeight);
    }

    const double t0 = glfwGetTime();
    int frame_count = 0;
    double last_stats_print = 0.0;
    constexpr double kCaptureHz = 60.0;
    while (!glfwWindowShouldClose(window)) {
        // In capture mode, advance time deterministically at exactly 60fps so
        // the output video has uniform frame spacing regardless of render speed.
        const double t = capture_mode
                       ? frame_count / kCaptureHz
                       : glfwGetTime() - t0;
        if (t >= kDemoDurationSec) break;

        timeline.update(t);
        renderer.render(timeline);

        if (capture_mode && capture) {
            // Read framebuffer and dump as PPM
            capture->capture_frame(frame_count);
        }

        glfwSwapBuffers(window);
        glfwPollEvents();
        frame_count++;

        // Print stats every 5 seconds; in capture mode also show % progress
        if (t - last_stats_print >= 5.0) {
            const hyp::Stats& stats = renderer.stats();
            if (capture_mode) {
                int pct = static_cast<int>(100.0 * t / kDemoDurationSec);
                std::printf("[capture %3d%%] frame %d / 14400 | t=%.1fs | Act: %d | Scene: %d\n",
                            pct, frame_count,
                            t, static_cast<int>(timeline.act()),
                            static_cast<int>(timeline.scene()));
            } else {
                std::printf("[%.1fs] FPS: %.1f | %.2f ms | Act: %d | Scene: %d | Beat: %d\n",
                            t, stats.fps(), stats.frame_time_ms(),
                            static_cast<int>(timeline.act()),
                            static_cast<int>(timeline.scene()),
                            timeline.beat_count());
            }
            last_stats_print = t;
        }

        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, GLFW_TRUE);
    }

    audio.shutdown();
    renderer.shutdown();

    // Print ffmpeg command for offline WebM encoding
    if (capture_mode && capture) {
        std::printf("\n[capture] finished — %d frames written to ./captures/\n", frame_count);
        std::printf("[capture] to encode WebM, run:\n\n");
        std::printf("%s\n\n", capture->ffmpeg_command(60).c_str());
    }

    glfwDestroyWindow(window);
    glfwTerminate();
    return EXIT_SUCCESS;
}
