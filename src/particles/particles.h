#pragma once

#include <cstdint>
#include <glm/glm.hpp>

namespace hyp {

class Timeline;

struct alignas(16) Particle {
    glm::vec4 pos_age;     // xyz: position, w: age (s)
    glm::vec4 vel_type;    // xyz: velocity, w: particle type
    glm::vec4 col_life;    // xyz: color, w: lifetime (s)
};

class ParticleSystem {
public:
    bool init(uint32_t max_particles);
    void update(const Timeline& tl, float dt, float rms = 0.5f);
    void render(uint32_t target_fbo, const Timeline& tl,
                const glm::mat4& view, const glm::mat4& proj, float rms = 0.5f);
    void shutdown();

    void emit(const glm::vec3& pos, const glm::vec3& vel, uint32_t type, float lifetime, const glm::vec3& color);

    uint32_t alive_count() const { return alive_count_; }

private:
    void update_compute(const Timeline& tl, float dt, float rms);
    void compact();

    // GPU buffers
    uint32_t particle_ssbo_     = 0;  // Particle data
    uint32_t particle_count_    = 0;  // Atomic counter / indirect draw buffer
    uint32_t particle_vao_      = 0;  // For rendering
    uint32_t compute_program_   = 0;  // Particle update shader
    uint32_t render_program_    = 0;  // Particle render shader

    uint32_t max_particles_  = 0;
    uint32_t alive_count_    = 0;
    bool active_             = false;
};

}  // namespace hyp
