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
    // Parse args before creating window (--fullscreen needs monitor at window creation)
    const char* audio_path = nullptr;
    bool capture_mode = false;
    bool fullscreen_mode = false;

    for (int i = 1; i < argc; ++i) {
        if (std::string_view(argv[i]) == "--capture") {
            capture_mode = true;
            std::printf("[hypersynapse] capture mode enabled\n");
        } else if (std::string_view(argv[i]) == "--fullscreen") {
            fullscreen_mode = true;
        } else {
            audio_path = argv[i];
        }
    }

    // Default music path — used for audio playback (interactive) and ffmpeg mix-in (capture)
    if (!audio_path)
        audio_path = "assets/music/Concrete-Syncope.wav";

    glfwSetErrorCallback(glfw_error);
    if (!glfwInit()) return EXIT_FAILURE;

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GLFW_TRUE);
    glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
    glfwWindowHint(GLFW_SAMPLES, 0);

    GLFWmonitor* monitor = fullscreen_mode ? glfwGetPrimaryMonitor() : nullptr;
    GLFWwindow* window = glfwCreateWindow(kWidth, kHeight, "SINGULARITY GARDEN — agentix", monitor, nullptr);
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

    if (audio_path) audio.play(audio_path);

    // Optional: initialize frame capture for --capture mode
    std::unique_ptr<hyp::FrameCapture> capture;
    if (capture_mode) {
        capture = std::make_unique<hyp::FrameCapture>("./captures", kWidth, kHeight);
    }

    const double t0 = glfwGetTime();
    int frame_count = 0;
    double last_stats_print = 0.0;
    double last_audio_t = 0.0;  // tracks last valid audio position for safe fallback
    constexpr double kCaptureHz = 60.0;
    while (!glfwWindowShouldClose(window)) {
        // In capture mode: deterministic 60fps clock.
        // Interactive: use audio cursor as canonical clock so beat-sync effects
        // stay locked to actual playback (accounts for audio startup latency).
        // Falls back to wall clock before audio starts or when audio is inactive.
        double t;
        if (capture_mode) {
            t = frame_count / kCaptureHz;
        } else {
            double audio_t = audio.is_active() ? audio.position() : 0.0;
            if (audio_t > 0.001) last_audio_t = audio_t;
            t = (last_audio_t > 0.001) ? last_audio_t : glfwGetTime() - t0;
        }
        if (t >= kDemoDurationSec) break;

        timeline.update(t);
        float rms = audio.amplitude_at(t);
        renderer.render(timeline, rms);

        // Audio fade-out: silence starts ~3:48 (228s), fully silent by ~3:55 (235s).
        // Mirrors the visual black-out in 07_transcendence.frag (scene_norm 0.875→0.895).
        constexpr double kFadeStart = 228.0;
        constexpr double kFadeEnd   = 235.0;
        if (t >= kFadeStart) {
            float vol = static_cast<float>(1.0 - (t - kFadeStart) / (kFadeEnd - kFadeStart));
            audio.set_volume(vol < 0.0f ? 0.0f : vol);
        }

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
                double wall_t = glfwGetTime() - t0;
                std::printf("[%.1fs] FPS: %.1f | %.2f ms | Act: %d | Scene: %d | Beat: %d | drift: %+.0fms\n",
                            t, stats.fps(), stats.frame_time_ms(),
                            static_cast<int>(timeline.act()),
                            static_cast<int>(timeline.scene()),
                            timeline.beat_count(),
                            (t - wall_t) * 1000.0);
            }
            last_stats_print = t;
        }

        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, GLFW_TRUE);
    }

    std::printf("[demo] finished — %.0fs complete\n", kDemoDurationSec);

    audio.shutdown();
    renderer.shutdown();

    // Print ffmpeg command for offline WebM encoding
    if (capture_mode && capture) {
        std::printf("\n[capture] finished — %d frames written to ./captures/\n", frame_count);
        std::printf("[capture] to encode WebM, run:\n\n");
        std::printf("%s\n\n", capture->ffmpeg_command(60, audio_path).c_str());
    }

    glfwDestroyWindow(window);
    glfwTerminate();
    return EXIT_SUCCESS;
}
