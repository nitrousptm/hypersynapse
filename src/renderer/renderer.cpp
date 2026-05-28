#include "renderer/renderer.h"

#include <cstdio>
#include <cmath>
#include <glad/gl.h>
#include <glm/glm.hpp>
#include <glm/gtc/random.hpp>

#include "shader/shader.h"
#include "timeline/timeline.h"
#include "particles/particles.h"

namespace hyp {

namespace {

// Push every timeline-derived uniform that scene and post shaders consume.
void set_timeline_uniforms(uint32_t prog, const Timeline& tl, int w, int h) {
    glUniform1f(glGetUniformLocation(prog, "u_time"),     static_cast<float>(tl.time()));
    glUniform2f(glGetUniformLocation(prog, "u_res"),      static_cast<float>(w), static_cast<float>(h));
    glUniform1f(glGetUniformLocation(prog, "u_beat"),     static_cast<float>(tl.beat_phase()));
    glUniform1f(glGetUniformLocation(prog, "u_bar"),      static_cast<float>(tl.bar_phase()));
    glUniform1f(glGetUniformLocation(prog, "u_act_norm"), static_cast<float>(tl.act_norm()));
    glUniform1i(glGetUniformLocation(prog, "u_beat_cnt"), tl.beat_count());
    glUniform1i(glGetUniformLocation(prog, "u_bar_cnt"),  tl.bar_count());
}

}  // namespace

bool Renderer::init(int width, int height) {
    width_  = width;
    height_ = height;

    glGenVertexArrays(1, &fullscreen_vao_);

    // Scene shaders — one per act
    const char* scene_frags[3] = {
        HYP_SHADER_DIR "/scenes/01_synapse.frag",
        HYP_SHADER_DIR "/scenes/02_city.frag",
        HYP_SHADER_DIR "/scenes/03_bloom.frag",
    };
    for (int i = 0; i < 3; ++i) {
        scene_programs_[i] = shader::load_program(
            HYP_SHADER_DIR "/fullscreen.vert", scene_frags[i]);
        if (!scene_programs_[i]) return false;
    }

    // Post FX shader (reads fbo_tex_, writes to default framebuffer)
    post_program_ = shader::load_program(
        HYP_SHADER_DIR "/fullscreen.vert",
        HYP_SHADER_DIR "/post/post.frag");
    if (!post_program_) return false;

    // HDR offscreen framebuffer (RGBA16F — scene can write >1.0 HDR values)
    glGenFramebuffers(1, &fbo_);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);

    glGenTextures(1, &fbo_tex_);
    glBindTexture(GL_TEXTURE_2D, fbo_tex_);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, fbo_tex_, 0);

    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        std::fprintf(stderr, "[renderer] FBO incomplete\n");
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        return false;
    }
    glBindFramebuffer(GL_FRAMEBUFFER, 0);

    // Initialize particle system (32k particles for neural effects)
    particles_ = std::make_unique<ParticleSystem>();
    if (!particles_->init(32768)) {
        std::fprintf(stderr, "[renderer] particle system init failed\n");
        return false;
    }

    glViewport(0, 0, width_, height_);
    return true;
}

void Renderer::render(const Timeline& tl) {
    // Update performance metrics
    stats_.update();
    stats_.set_timeline_metrics(Stats::TimelineMetrics{
        tl.time(),
        tl.beat_phase(),
        tl.bar_phase(),
        tl.beat_count(),
        tl.bar_count()
    });

    // Particle emission (Act I beat-synced neural pulse)
    if (particles_ && tl.act() == Act::I) {
        // Emit particles at beat downbeats (beat_phase near 0)
        float beat_phase = static_cast<float>(tl.beat_phase());
        if (beat_phase < 0.05f) {
            emit_neural_pulse(tl);
        }
    }

    // Update particle simulation
    if (particles_) {
        float dt = 1.0f / 60.0f;  // Assume 60 fps
        particles_->update(tl, dt);
    }

    draw_scene(tl);
    if (particles_) draw_particles(tl);
    draw_post(tl);
}

void Renderer::draw_scene(const Timeline& tl) {
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    // Check if we're in a transition
    double trans = tl.transition_progress(1.5);
    if (trans < 0.0) {
        // Normal single-scene render
        uint32_t prog = scene_programs_[static_cast<int>(tl.act())];
        glUseProgram(prog);
        set_timeline_uniforms(prog, tl, width_, height_);
        glBindVertexArray(fullscreen_vao_);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glBindVertexArray(0);
        glUseProgram(0);
    } else {
        // Transition: blend from previous to next act
        Act prev_act = tl.act();
        Act next_act = prev_act == Act::I ? Act::II : (prev_act == Act::II ? Act::III : Act::I);

        // Render previous act at full opacity
        uint32_t prog_prev = scene_programs_[static_cast<int>(prev_act)];
        glUseProgram(prog_prev);
        set_timeline_uniforms(prog_prev, tl, width_, height_);
        glBindVertexArray(fullscreen_vao_);
        glDrawArrays(GL_TRIANGLES, 0, 3);

        // Enable additive/alpha blend for next act overlay
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

        // Render next act with fade-in opacity
        uint32_t prog_next = scene_programs_[static_cast<int>(next_act)];
        glUseProgram(prog_next);
        set_timeline_uniforms(prog_next, tl, width_, height_);
        // Pass transition progress to shader
        glUniform1f(glGetUniformLocation(prog_next, "u_fade"), static_cast<float>(trans));
        glDrawArrays(GL_TRIANGLES, 0, 3);

        glDisable(GL_BLEND);
        glBindVertexArray(0);
        glUseProgram(0);
    }

    glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

void Renderer::draw_particles(const Timeline& tl) {
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    particles_->render(fbo_);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

void Renderer::draw_post(const Timeline& tl) {
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(post_program_);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, fbo_tex_);
    glUniform1i(glGetUniformLocation(post_program_, "u_scene"), 0);

    set_timeline_uniforms(post_program_, tl, width_, height_);

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);
}

void Renderer::emit_neural_pulse(const Timeline& tl) {
    if (!particles_) return;

    // Beat-synced neural particle burst: ~150 particles per beat
    const int burst_count = 150;
    const float burst_speed = 3.5f;
    const float lifetime = 1.2f;

    // Palette: magenta (beat start) → cyan (beat end)
    float beat_t = static_cast<float>(tl.beat_phase());
    glm::vec3 col = glm::mix(
        glm::vec3(1.0f, 0.0f, 1.0f),   // Magenta
        glm::vec3(0.0f, 1.0f, 1.0f),   // Cyan
        beat_t
    );

    // Emit from pseudo-random neuron positions in the lattice
    for (int i = 0; i < burst_count; ++i) {
        // Hash-based pseudo-random position (soma clusters)
        float seed = static_cast<float>(tl.beat_count()) * 17.f + static_cast<float>(i);
        glm::vec3 pos = glm::ballRand(0.5f);  // Within 0.5 unit sphere of origin
        pos.y *= 0.7f;  // Flatten vertically

        // Radial velocity outward
        glm::vec3 vel = glm::normalize(pos) * burst_speed;

        // Slight upward bias
        vel.y += 0.5f;

        particles_->emit(pos, vel, 0, lifetime, col);
    }
}

void Renderer::shutdown() {
    if (particles_) particles_->shutdown();
    particles_.reset();

    if (fullscreen_vao_) glDeleteVertexArrays(1, &fullscreen_vao_);
    for (auto& p : scene_programs_) { if (p) glDeleteProgram(p); p = 0; }
    if (post_program_) { glDeleteProgram(post_program_); post_program_ = 0; }
    if (fbo_tex_)  { glDeleteTextures(1, &fbo_tex_);     fbo_tex_  = 0; }
    if (fbo_)      { glDeleteFramebuffers(1, &fbo_);     fbo_      = 0; }
    fullscreen_vao_ = 0;
}

}  // namespace hyp
