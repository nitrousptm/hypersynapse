#pragma once
#include <array>
#include <cstdint>
#include <memory>

namespace hyp {

class Timeline;
class ParticleSystem;

class Renderer {
public:
    bool init(int width, int height);
    void render(const Timeline& tl);
    void shutdown();

    ParticleSystem* particles() { return particles_.get(); }

private:
    void draw_scene(const Timeline& tl);
    void draw_particles(const Timeline& tl);
    void draw_post(const Timeline& tl);
    void emit_neural_pulse(const Timeline& tl);

    int width_ = 0, height_ = 0;
    uint32_t fullscreen_vao_ = 0;

    std::array<uint32_t, 3> scene_programs_ = {};  // one per act
    uint32_t post_program_ = 0;

    // Offscreen HDR framebuffer (RGBA16F) for post FX
    uint32_t fbo_     = 0;
    uint32_t fbo_tex_ = 0;

    // Particle system
    std::unique_ptr<ParticleSystem> particles_;
};

}  // namespace hyp
