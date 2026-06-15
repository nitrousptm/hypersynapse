#include "particles/particles.h"

#include <cstdio>
#include <glad/gl.h>
#include <glm/gtc/type_ptr.hpp>
#include "timeline/timeline.h"
#include "shader/shader.h"

namespace hyp {

bool ParticleSystem::init(uint32_t max_particles) {
    max_particles_ = max_particles;

    // Allocate particle SSBO
    glCreateBuffers(1, &particle_ssbo_);
    glNamedBufferStorage(particle_ssbo_, sizeof(Particle) * max_particles, nullptr,
                         GL_DYNAMIC_STORAGE_BIT);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, particle_ssbo_);

    // Allocate particle count buffer (for alive count + padding)
    glCreateBuffers(1, &particle_count_);
    glNamedBufferStorage(particle_count_, sizeof(uint32_t) * 4, nullptr,
                         GL_DYNAMIC_STORAGE_BIT);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, particle_count_);

    // Create VAO for rendering
    glCreateVertexArrays(1, &particle_vao_);
    glBindVertexArray(particle_vao_);

    // Load compute shader
    compute_program_ = shader::load_compute(HYP_SHADER_DIR "/compute/particles_update.comp");
    if (!compute_program_) {
        std::fprintf(stderr, "[particles] failed to load compute shader\n");
        return false;
    }

    // Load render shader
    render_program_ = shader::load_program(HYP_SHADER_DIR "/compute/particles_render.vert",
                                           HYP_SHADER_DIR "/compute/particles_render.frag");
    if (!render_program_) {
        std::fprintf(stderr, "[particles] failed to load render shader\n");
        return false;
    }

    active_ = true;
    std::printf("[particles] initialized with %u max particles\n", max_particles_);
    return true;
}

void ParticleSystem::update(const Timeline& tl, float dt) {
    if (!active_) return;

    update_compute(tl, dt);
    compact();
}

void ParticleSystem::update_compute(const Timeline& tl, float dt) {
    if (!compute_program_ || alive_count_ == 0) return;

    glUseProgram(compute_program_);

    // Timeline uniforms
    glUniform1f(glGetUniformLocation(compute_program_, "u_time"),       static_cast<float>(tl.time()));
    glUniform1f(glGetUniformLocation(compute_program_, "u_dt"),         dt);
    glUniform1f(glGetUniformLocation(compute_program_, "u_beat"),       static_cast<float>(tl.beat_phase()));
    glUniform1f(glGetUniformLocation(compute_program_, "u_bar"),        static_cast<float>(tl.bar_phase()));
    glUniform1f(glGetUniformLocation(compute_program_, "u_act_norm"),   static_cast<float>(tl.act_norm()));
    glUniform1f(glGetUniformLocation(compute_program_, "u_scene_norm"), static_cast<float>(tl.scene_norm()));
    glUniform1i(glGetUniformLocation(compute_program_, "u_beat_cnt"),   tl.beat_count());
    glUniform1i(glGetUniformLocation(compute_program_, "u_bar_cnt"),    tl.bar_count());
    glUniform1i(glGetUniformLocation(compute_program_, "u_act_idx"),    static_cast<int>(tl.act()));
    glUniform1ui(glGetUniformLocation(compute_program_, "u_alive_count"), alive_count_);

    // Simulation parameters
    glUniform1f(glGetUniformLocation(compute_program_, "u_gravity"), -2.5f);
    glUniform1f(glGetUniformLocation(compute_program_, "u_damping"), 0.98f);
    glUniform3f(glGetUniformLocation(compute_program_, "u_wind"), 0.0f, 0.0f, 0.0f);

    // Dispatch compute shader (256 threads per workgroup)
    uint32_t dispatch_x = (alive_count_ + 255) / 256;
    glDispatchCompute(dispatch_x, 1, 1);
    glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
}

void ParticleSystem::compact() {
    // TODO: Compact dead particles, update alive_count_
    // This is an optional optimization for longer-running simulations.
    // For now, just reap expired particles in the compute shader.
}

void ParticleSystem::render(uint32_t target_fbo, const Timeline& tl,
                            const glm::mat4& view, const glm::mat4& proj) {
    if (!active_ || alive_count_ == 0 || !render_program_) return;

    glBindFramebuffer(GL_FRAMEBUFFER, target_fbo);
    glUseProgram(render_program_);

    // Timeline uniforms
    glUniform1f(glGetUniformLocation(render_program_, "u_beat"),          static_cast<float>(tl.beat_phase()));
    glUniform1f(glGetUniformLocation(render_program_, "u_act_norm"),      static_cast<float>(tl.act_norm()));
    glUniform1f(glGetUniformLocation(render_program_, "u_time"),          static_cast<float>(tl.time()));
    glUniform1f(glGetUniformLocation(render_program_, "u_particle_size"), 18.0f);

    // Camera matrices
    glUniformMatrix4fv(glGetUniformLocation(render_program_, "u_view"), 1, GL_FALSE, glm::value_ptr(view));
    glUniformMatrix4fv(glGetUniformLocation(render_program_, "u_proj"), 1, GL_FALSE, glm::value_ptr(proj));

    // Bind particle SSBO to shader
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, particle_ssbo_);

    // Additive blending for particle glow
    glEnable(GL_BLEND);
    glBlendFunc(GL_ONE, GL_ONE);
    glEnable(GL_PROGRAM_POINT_SIZE);

    glBindVertexArray(particle_vao_);
    glDrawArrays(GL_POINTS, 0, alive_count_);

    glDisable(GL_BLEND);
    glBindVertexArray(0);
}

void ParticleSystem::emit(const glm::vec3& pos, const glm::vec3& vel, uint32_t type,
                          float lifetime, const glm::vec3& color) {
    if (!active_ || alive_count_ >= max_particles_) return;

    // Upload particle to SSBO (matches GLSL layout)
    Particle p;
    p.pos_age = glm::vec4(pos, 0.0f);           // age = 0 at emission
    p.vel_type = glm::vec4(vel, glm::uintBitsToFloat(type));
    p.col_life = glm::vec4(color, lifetime);

    glNamedBufferSubData(particle_ssbo_, alive_count_ * sizeof(Particle),
                         sizeof(Particle), &p);
    alive_count_++;
}

void ParticleSystem::shutdown() {
    active_ = false;
    if (particle_ssbo_) glDeleteBuffers(1, &particle_ssbo_);
    if (particle_count_) glDeleteBuffers(1, &particle_count_);
    if (particle_vao_) glDeleteVertexArrays(1, &particle_vao_);
    if (compute_program_) glDeleteProgram(compute_program_);
    if (render_program_) glDeleteProgram(render_program_);
}

}  // namespace hyp
