#include "particles/particles.h"

#include <cstdio>
#include <glad/gl.h>
#include "timeline/timeline.h"
#include "shader/shader.h"

namespace hyp {

bool ParticleSystem::init(uint32_t max_particles) {
    max_particles_ = max_particles;

    // TODO: Allocate SSBOs (particle data + indirect draw buffer)
    // glCreateBuffers(1, &particle_ssbo_);
    // glNamedBufferStorage(particle_ssbo_, sizeof(Particle) * max_particles, nullptr, ...);
    //
    // glCreateBuffers(1, &particle_count_);
    // glNamedBufferStorage(particle_count_, sizeof(uint32_t) * 2, nullptr, ...);
    //
    // glCreateVertexArrays(1, &particle_vao_);

    // TODO: Load compute and render shaders
    // compute_program_ = shader::load_program_compute(
    //     HYP_SHADER_DIR "/compute/particles_update.comp");
    // render_program_ = shader::load_program(
    //     HYP_SHADER_DIR "/fullscreen.vert",
    //     HYP_SHADER_DIR "/compute/particles_render.frag");

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
    // TODO: Dispatch compute shader
    // glUseProgram(compute_program_);
    // glUniform1f(glGetUniformLocation(compute_program_, "u_dt"), dt);
    // glUniform1f(glGetUniformLocation(compute_program_, "u_beat"), tl.beat_phase());
    // glUniform1i(glGetUniformLocation(compute_program_, "u_beat_cnt"), tl.beat_count());
    // glUniform1i(glGetUniformLocation(compute_program_, "u_act_idx"), (int)tl.act());
    // glUniform1f(glGetUniformLocation(compute_program_, "u_act_norm"), tl.act_norm());
    // glUniform1ui(glGetUniformLocation(compute_program_, "u_alive_count"), alive_count_);
    //
    // uint32_t dispatch_x = (alive_count_ + 255) / 256;
    // glDispatchCompute(dispatch_x, 1, 1);
    // glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
}

void ParticleSystem::compact() {
    // TODO: Compact dead particles, update alive_count_
    // This is an optional optimization for longer-running simulations.
    // For now, just reap expired particles in the compute shader.
}

void ParticleSystem::render(uint32_t target_fbo) {
    if (!active_ || alive_count_ == 0) return;

    // TODO: Render particles via instanced geometry or hardware-culled indirect draw
    // glBindFramebuffer(GL_FRAMEBUFFER, target_fbo);
    // glUseProgram(render_program_);
    // glEnable(GL_BLEND);
    // glBlendFunc(GL_ONE, GL_ONE);  // Additive
    // glBindVertexArray(particle_vao_);
    // glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, particle_ssbo_);
    // glDrawArraysInstanced(GL_POINTS, 0, 1, alive_count_);
    // glDisable(GL_BLEND);
}

void ParticleSystem::emit(const glm::vec3& pos, const glm::vec3& vel, uint32_t type,
                          float lifetime, const glm::vec3& color) {
    // TODO: Add particle to emission queue (CPU-side ring buffer)
    // Will be uploaded to GPU at next update
    if (!active_) return;
    // (stub for now)
}

void ParticleSystem::shutdown() {
    active_ = false;
    // TODO: Clean up GPU resources
    // glDeleteBuffers(1, &particle_ssbo_);
    // glDeleteBuffers(1, &particle_count_);
    // glDeleteVertexArrays(1, &particle_vao_);
    // glDeleteProgram(compute_program_);
    // glDeleteProgram(render_program_);
}

}  // namespace hyp
