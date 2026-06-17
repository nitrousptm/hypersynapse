#pragma once
#include <array>
#include <cstdint>
#include <memory>
#include "debug/stats.h"
#include "debug/debug_ui.h"

namespace hyp {

class Timeline;
class ParticleSystem;

// Second FBO used by Scene 6 recursive portal rendering
struct PortalFBO {
    uint32_t fbo = 0;
    uint32_t tex = 0;
};

class Renderer {
public:
    Renderer();
    ~Renderer();

    bool init(int width, int height);
    void render(const Timeline& tl, float rms = 0.5f);
    void shutdown();

    ParticleSystem* particles() { return particles_.get(); }
    Stats& stats() { return stats_; }

private:
    // Scene dispatch
    void draw_scene(const Timeline& tl);
    void draw_fullscreen_scene(uint32_t prog, const Timeline& tl);
    void draw_mesh_scene(const Timeline& tl);        // Scene 3 city (polygon)
    void draw_impossible_space(const Timeline& tl);  // Scene 6 recursive portals
    void draw_particles(const Timeline& tl);
    void draw_post(const Timeline& tl);

    // Per-frame helpers
    void set_timeline_uniforms(uint32_t prog, const Timeline& tl) const;
    void emit_particles(const Timeline& tl);

    // Portal FBO helpers for Scene 6
    bool init_portal_fbos(int w, int h);
    void render_portal_level(int depth, const Timeline& tl);

    int width_ = 0, height_ = 0;

    // Fullscreen quad VAO (no vertex buffer needed — positions in .vert)
    uint32_t fullscreen_vao_ = 0;

    // 7 fullscreen scene programs (scenes that don't need a mesh VAO)
    // Index = Scene enum value
    std::array<uint32_t, 7> scene_programs_ = {};

    // Polygon mesh pipeline (Scene 2 monolith, Scene 3 city)
    uint32_t mesh_vert_prog_ = 0;   // mesh.vert compiled separately
    uint32_t mesh_frag_prog_ = 0;   // mesh.frag compiled separately
    uint32_t mesh_program_   = 0;   // linked program

    // City mesh VAO / VBO / EBO (filled by ProceduralMesh::build_city)
    uint32_t city_vao_   = 0;
    uint32_t city_vbo_   = 0;
    uint32_t city_ebo_   = 0;
    int      city_index_count_ = 0;

    // Monolith mesh VAO / VBO / EBO
    uint32_t monolith_vao_   = 0;
    uint32_t monolith_vbo_   = 0;
    uint32_t monolith_ebo_   = 0;
    int      monolith_index_count_ = 0;

    // Post FX shader
    uint32_t post_program_ = 0;

    // HDR offscreen FBO (scene renders here, post reads it)
    uint32_t fbo_     = 0;
    uint32_t fbo_tex_ = 0;

    // Recursive portal FBOs for Scene 6 (3 levels deep)
    static constexpr int kPortalDepth = 3;
    std::array<PortalFBO, kPortalDepth> portal_fbos_ = {};

    // Previous frame FBO for feedback effects (Scene 4 time fracture)
    uint32_t prev_fbo_     = 0;
    uint32_t prev_fbo_tex_ = 0;

    // Particle system
    std::unique_ptr<ParticleSystem> particles_;

    // Performance stats
    Stats stats_;

    // Debug UI overlay
    DebugUI debug_ui_;

    // Track last scene for transition detection
    uint8_t last_scene_ = 0;

    // Current-frame audio RMS amplitude [0,1], set at start of render().
    // Used by draw_post() to scale beat-reactive bloom and flash effects.
    float rms_ = 0.5f;
};

}  // namespace hyp
