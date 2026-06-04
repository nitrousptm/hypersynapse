#include "renderer/renderer.h"

#include <cstdio>
#include <cmath>
#include <glad/gl.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/random.hpp>

#include "shader/shader.h"
#include "timeline/timeline.h"
#include "particles/particles.h"
#include "mesh/procedural_mesh.h"

namespace hyp {

Renderer::Renderer()  = default;
Renderer::~Renderer() = default;

namespace {

void set_standard_uniforms(uint32_t prog, const Timeline& tl, int w, int h) {
    glUniform1f(glGetUniformLocation(prog, "u_time"),       static_cast<float>(tl.time()));
    glUniform2f(glGetUniformLocation(prog, "u_res"),        static_cast<float>(w), static_cast<float>(h));
    glUniform1f(glGetUniformLocation(prog, "u_beat"),       static_cast<float>(tl.beat_phase()));
    glUniform1f(glGetUniformLocation(prog, "u_bar"),        static_cast<float>(tl.bar_phase()));
    glUniform1f(glGetUniformLocation(prog, "u_act_norm"),   static_cast<float>(tl.act_norm()));
    glUniform1f(glGetUniformLocation(prog, "u_scene_norm"), static_cast<float>(tl.scene_norm()));
    glUniform1i(glGetUniformLocation(prog, "u_beat_cnt"),   tl.beat_count());
    glUniform1i(glGetUniformLocation(prog, "u_bar_cnt"),    tl.bar_count());
}

bool make_fbo(int w, int h, uint32_t& fbo, uint32_t& tex) {
    glGenFramebuffers(1, &fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo);

    glGenTextures(1, &tex);
    glBindTexture(GL_TEXTURE_2D, tex);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, tex, 0);

    bool ok = glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE;
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    return ok;
}

}  // namespace

// ─── init ─────────────────────────────────────────────────────────────────────

bool Renderer::init(int width, int height) {
    width_  = width;
    height_ = height;

    glGenVertexArrays(1, &fullscreen_vao_);

    // Scene fragment shaders (fullscreen quad, no mesh)
    const char* scene_frags[7] = {
        HYP_SHADER_DIR "/scenes/01_boot_void.frag",
        HYP_SHADER_DIR "/scenes/02_awakening_core.frag",
        HYP_SHADER_DIR "/scenes/03_city_corruption.frag",  // used as overlay on top of mesh pass
        HYP_SHADER_DIR "/scenes/04_time_fracture.frag",
        HYP_SHADER_DIR "/scenes/05_geometry_bloom.frag",
        HYP_SHADER_DIR "/scenes/06_impossible_space.frag",
        HYP_SHADER_DIR "/scenes/07_transcendence.frag",
    };
    for (int i = 0; i < 7; ++i) {
        scene_programs_[i] = shader::load_program(
            HYP_SHADER_DIR "/fullscreen.vert", scene_frags[i]);
        if (!scene_programs_[i]) {
            std::fprintf(stderr, "[renderer] scene shader %d failed\n", i);
            return false;
        }
    }

    // Polygon mesh pipeline (mesh.vert + scene 3 fragment shader)
    mesh_program_ = shader::load_program(
        HYP_SHADER_DIR "/mesh.vert",
        HYP_SHADER_DIR "/scenes/03_city_corruption.frag");
    if (!mesh_program_) {
        std::fprintf(stderr, "[renderer] mesh program failed\n");
        return false;
    }

    // Post FX shader
    post_program_ = shader::load_program(
        HYP_SHADER_DIR "/fullscreen.vert",
        HYP_SHADER_DIR "/post/post.frag");
    if (!post_program_) return false;

    // Main HDR FBO
    if (!make_fbo(width, height, fbo_, fbo_tex_)) {
        std::fprintf(stderr, "[renderer] main FBO incomplete\n");
        return false;
    }

    // Previous frame FBO (Scene 4 time fracture feedback)
    if (!make_fbo(width, height, prev_fbo_, prev_fbo_tex_)) {
        std::fprintf(stderr, "[renderer] prev FBO incomplete\n");
        return false;
    }

    // Portal FBOs for Scene 6 recursive rendering (lower res)
    if (!init_portal_fbos(width / 2, height / 2)) {
        std::fprintf(stderr, "[renderer] portal FBO init failed\n");
        return false;
    }

    // Build procedural meshes
    {
        auto city_data = ProceduralMesh::build_city(800);
        city_index_count_ = static_cast<int>(city_data.indices.size());
        ProceduralMesh::upload(city_data, city_vao_, city_vbo_, city_ebo_);

        auto monolith_data = ProceduralMesh::build_monolith(8);
        monolith_index_count_ = static_cast<int>(monolith_data.indices.size());
        ProceduralMesh::upload(monolith_data, monolith_vao_, monolith_vbo_, monolith_ebo_);
    }

    // Particle system
    particles_ = std::make_unique<ParticleSystem>();
    if (!particles_->init(131072)) {  // 128k particles
        std::fprintf(stderr, "[renderer] particle system init failed\n");
        return false;
    }

    // Debug UI
    if (!debug_ui_.init()) {
        std::fprintf(stderr, "[renderer] debug UI init failed\n");
        return false;
    }

    glViewport(0, 0, width_, height_);
    return true;
}

bool Renderer::init_portal_fbos(int w, int h) {
    for (int i = 0; i < kPortalDepth; i++) {
        if (!make_fbo(w, h, portal_fbos_[i].fbo, portal_fbos_[i].tex))
            return false;
    }
    return true;
}

// ─── render ───────────────────────────────────────────────────────────────────

void Renderer::render(const Timeline& tl) {
    stats_.update();
    stats_.set_timeline_metrics(Stats::TimelineMetrics{
        tl.time(), tl.beat_phase(), tl.bar_phase(),
        tl.beat_count(), tl.bar_count()
    });

    emit_particles(tl);

    if (particles_) {
        particles_->update(tl, 1.0f / 60.0f);
    }

    // Copy current FBO to prev before rendering new frame (for feedback)
    glBindFramebuffer(GL_READ_FRAMEBUFFER, fbo_);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, prev_fbo_);
    glBlitFramebuffer(0, 0, width_, height_, 0, 0, width_, height_,
                      GL_COLOR_BUFFER_BIT, GL_LINEAR);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);

    draw_scene(tl);
    if (particles_) draw_particles(tl);
    draw_post(tl);
    debug_ui_.render(tl, width_, height_);

    last_scene_ = static_cast<uint8_t>(tl.scene());
}

// ─── draw_scene ───────────────────────────────────────────────────────────────

void Renderer::draw_scene(const Timeline& tl) {
    Scene sc = tl.scene();

    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    double trans = tl.transition_progress(1.2);

    if (sc == Scene::CityCorruption) {
        draw_mesh_scene(tl);
    } else if (sc == Scene::ImpossibleSpace) {
        draw_impossible_space(tl);
    } else {
        draw_fullscreen_scene(scene_programs_[static_cast<int>(sc)], tl);
    }

    // Crossfade overlay — only during the PRE-BOUNDARY half of the window (trans < 0.5).
    // The window is centered on the boundary: once scene() has flipped (trans >= 0.5),
    // the new scene is already the main draw and sc+1 would point to the wrong target.
    if (trans >= 0.0 && trans < 0.5) {
        int next_scene_idx = (static_cast<int>(sc) + 1) % 7;
        uint32_t next_prog = scene_programs_[next_scene_idx];

        // Scene 6 (ImpossibleSpace) needs portal FBOs pre-rendered so portals show
        // properly during the crossfade from Scene 5. Without this, portals would
        // sample from stale/black textures for the entire 0.6s transition.
        if (next_scene_idx == static_cast<int>(Scene::ImpossibleSpace)) {
            render_portal_level(kPortalDepth - 1, tl);
            // render_portal_level restores GL_FRAMEBUFFER binding to fbo_
        }

        // Use constant-alpha blend: glBlendColor drives the mix, not fragment alpha.
        // Scenes output alpha=1, so GL_SRC_ALPHA would always snap to 100% opacity.
        // Scale trans (0..0.5) to a blend factor (0..1) across the crossfade window.
        float blend = static_cast<float>(trans * 2.0);
        glEnable(GL_BLEND);
        glBlendColor(0.0f, 0.0f, 0.0f, blend);
        glBlendFunc(GL_CONSTANT_ALPHA, GL_ONE_MINUS_CONSTANT_ALPHA);

        glUseProgram(next_prog);
        set_standard_uniforms(next_prog, tl, width_, height_);

        // Bind prev_fbo_tex as u_prev_frame for feedback shaders
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, prev_fbo_tex_);
        glUniform1i(glGetUniformLocation(next_prog, "u_prev_frame"), 0);

        // For ImpossibleSpace: bind portal textures so recursive portals work in crossfade
        if (next_scene_idx == static_cast<int>(Scene::ImpossibleSpace)) {
            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_2D, portal_fbos_[0].tex);
            glUniform1i(glGetUniformLocation(next_prog, "u_portal_0"), 0);
            glActiveTexture(GL_TEXTURE1);
            glBindTexture(GL_TEXTURE_2D, portal_fbos_[1].tex);
            glUniform1i(glGetUniformLocation(next_prog, "u_portal_1"), 1);
            glActiveTexture(GL_TEXTURE2);
            glBindTexture(GL_TEXTURE_2D, portal_fbos_[2].tex);
            glUniform1i(glGetUniformLocation(next_prog, "u_portal_2"), 2);
        }

        glBindVertexArray(fullscreen_vao_);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glBindVertexArray(0);

        glDisable(GL_BLEND);
        glUseProgram(0);
    }

    glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

void Renderer::draw_fullscreen_scene(uint32_t prog, const Timeline& tl) {
    glUseProgram(prog);
    set_standard_uniforms(prog, tl, width_, height_);

    // Bind prev frame for Scene 4 feedback
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, prev_fbo_tex_);
    glUniform1i(glGetUniformLocation(prog, "u_prev_frame"), 0);

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);
}

void Renderer::draw_mesh_scene(const Timeline& tl) {
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);

    // Camera: fast FPV flying through city canyons
    float t = static_cast<float>(tl.time());

    glm::vec3 cam_pos = glm::vec3(
        std::sin(t * 0.4f) * 15.0f + t * 2.0f,  // moving forward
        1.5f + std::sin(t * 0.3f) * 0.8f,
        std::cos(t * 0.35f) * 15.0f
    );
    glm::vec3 cam_look = cam_pos + glm::vec3(
        std::cos(t * 0.4f),
        -0.1f + std::sin(t * 0.15f) * 0.2f,
        -std::sin(t * 0.35f)
    );

    glm::mat4 view = glm::lookAt(cam_pos, cam_look, glm::vec3(0, 1, 0));
    glm::mat4 proj = glm::perspective(
        glm::radians(75.0f),
        float(width_) / float(height_),
        0.1f, 200.0f);

    glUseProgram(mesh_program_);
    glUniformMatrix4fv(glGetUniformLocation(mesh_program_, "u_view"), 1, GL_FALSE, glm::value_ptr(view));
    glUniformMatrix4fv(glGetUniformLocation(mesh_program_, "u_proj"), 1, GL_FALSE, glm::value_ptr(proj));
    set_standard_uniforms(mesh_program_, tl, width_, height_);

    glBindVertexArray(city_vao_);
    glDrawElements(GL_TRIANGLES, city_index_count_, GL_UNSIGNED_INT, nullptr);
    glBindVertexArray(0);

    glDisable(GL_DEPTH_TEST);
    glUseProgram(0);
}

void Renderer::draw_impossible_space(const Timeline& tl) {
    // Render portal levels recursively into ping-pong FBOs
    // then use the deepest as texture in the final pass
    render_portal_level(kPortalDepth - 1, tl);

    // Now render the main scene with portal textures
    uint32_t prog = scene_programs_[static_cast<int>(Scene::ImpossibleSpace)];
    glUseProgram(prog);
    set_standard_uniforms(prog, tl, width_, height_);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, portal_fbos_[0].tex);
    glUniform1i(glGetUniformLocation(prog, "u_portal_0"), 0);

    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, portal_fbos_[1].tex);
    glUniform1i(glGetUniformLocation(prog, "u_portal_1"), 1);

    glActiveTexture(GL_TEXTURE2);
    glBindTexture(GL_TEXTURE_2D, portal_fbos_[2].tex);
    glUniform1i(glGetUniformLocation(prog, "u_portal_2"), 2);

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);
}

void Renderer::render_portal_level(int depth, const Timeline& tl) {
    if (depth < 0) return;

    // Render the previous depth level first
    if (depth > 0) {
        render_portal_level(depth - 1, tl);
    }

    // Render current level into its FBO
    glBindFramebuffer(GL_FRAMEBUFFER, portal_fbos_[depth].fbo);
    glViewport(0, 0, width_ / 2, height_ / 2);
    glClearColor(0.0f, 0.0f, 0.02f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    uint32_t prog = scene_programs_[static_cast<int>(Scene::ImpossibleSpace)];
    glUseProgram(prog);

    // Offset time slightly per level for visual distinction
    Timeline shifted_tl = tl;
    shifted_tl.update(tl.time() + double(depth) * 0.3);
    set_standard_uniforms(prog, shifted_tl, width_ / 2, height_ / 2);

    // Bind sub-levels as portal textures
    for (int i = 0; i < kPortalDepth; i++) {
        glActiveTexture(GL_TEXTURE0 + i);
        uint32_t tex = (i < depth) ? portal_fbos_[i].tex : portal_fbos_[0].tex;
        glBindTexture(GL_TEXTURE_2D, tex);
        char name[16];
        std::snprintf(name, sizeof(name), "u_portal_%d", i);
        glUniform1i(glGetUniformLocation(prog, name), i);
    }

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);

    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glViewport(0, 0, width_, height_);
}

void Renderer::draw_particles(const Timeline& tl) {
    // Build a scene-appropriate camera for particle 3D positioning.
    // Acts I/II: camera orbits origin slowly.  Acts III/IV: pull back for the big reveal.
    float t  = static_cast<float>(tl.time());
    float an = static_cast<float>(tl.act_norm());

    glm::vec3 cam_pos = glm::vec3(
        std::sin(t * 0.18f) * glm::mix(4.0f, 8.0f, an),
        1.5f + std::sin(t * 0.11f) * 0.8f,
        std::cos(t * 0.18f) * glm::mix(4.0f, 8.0f, an));
    glm::mat4 view = glm::lookAt(cam_pos, glm::vec3(0.0f), glm::vec3(0, 1, 0));
    glm::mat4 proj = glm::perspective(
        glm::radians(60.0f),
        float(width_) / float(height_),
        0.1f, 100.0f);

    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    particles_->render(fbo_, tl, view, proj);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
}

void Renderer::draw_post(const Timeline& tl) {
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(post_program_);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, fbo_tex_);
    glUniform1i(glGetUniformLocation(post_program_, "u_scene"), 0);

    set_standard_uniforms(post_program_, tl, width_, height_);
    glUniform1i(glGetUniformLocation(post_program_, "u_scene_idx"),
                static_cast<int>(tl.scene()));

    glBindVertexArray(fullscreen_vao_);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glBindVertexArray(0);
    glUseProgram(0);
}

// ─── particle emission ────────────────────────────────────────────────────────

void Renderer::emit_particles(const Timeline& tl) {
    if (!particles_) return;

    float beat  = static_cast<float>(tl.beat_phase());
    float t     = static_cast<float>(tl.time());
    Scene sc    = tl.scene();

    // Only emit on downbeats (beat_phase near 0)
    if (beat > 0.06f) return;

    switch (sc) {
    case Scene::BootVoid: {
        // Sparse cool sparks drifting upward
        int burst = 8;
        for (int i = 0; i < burst; i++) {
            glm::vec3 pos = glm::vec3(
                (glm::linearRand(0.0f, 1.0f) - 0.5f) * 4.0f,
                glm::linearRand(-1.0f, 0.0f),
                (glm::linearRand(0.0f, 1.0f) - 0.5f) * 2.0f);
            glm::vec3 vel = glm::vec3(0, glm::linearRand(0.2f, 0.6f), 0);
            particles_->emit(pos, vel, 0, 2.5f, glm::vec3(0.4f, 0.6f, 1.0f));
        }
        break;
    }
    case Scene::AwakeningCore: {
        float sn = static_cast<float>(tl.scene_norm());
        float split_progress = glm::smoothstep(0.82f, 1.0f, sn);
        float heat = glm::linearRand(0.0f, 1.0f);

        if (split_progress > 0.01f) {
            // Dramatic burst from the opening crack: particles shoot sideways
            // from the Y-axis as the two monolith halves separate.
            int crack_burst = 200 + int(200.0f * split_progress);
            for (int i = 0; i < crack_burst; i++) {
                // Start on the crack line (x≈0), somewhere along the height
                float fy = glm::linearRand(-1.75f, 1.75f);
                float fz = glm::linearRand(-0.18f, 0.18f);
                glm::vec3 pos = glm::vec3(glm::linearRand(-0.05f, 0.05f), fy, fz);
                // Velocity: outward along X + slight upward arc
                float side = (glm::linearRand(0.0f, 1.0f) > 0.5f) ? 1.0f : -1.0f;
                float speed = glm::linearRand(1.5f, 4.5f) * split_progress;
                glm::vec3 vel = glm::vec3(side * speed, glm::linearRand(0.2f, 1.2f), glm::linearRand(-0.5f, 0.5f));
                // Colour: white-hot core → electric cyan
                glm::vec3 col = glm::mix(glm::vec3(1.0f, 1.0f, 1.0f), glm::vec3(0.0f, 0.8f, 1.0f), heat);
                particles_->emit(pos, vel, 0, 0.7f, col);
            }
        } else {
            // Pre-split: dense bursts from the monolith surface as it materialises
            int burst = 120 + int(80.0f * sn);
            for (int i = 0; i < burst; i++) {
                glm::vec3 pos = glm::ballRand(0.4f);
                pos.y = std::abs(pos.y) * 3.2f - 0.8f;
                glm::vec3 vel = glm::normalize(glm::vec3(pos.x, 0, pos.z)) * 2.0f;
                vel.y += 0.5f;
                glm::vec3 col = glm::mix(glm::vec3(0.2f, 0.4f, 1.0f),
                                         glm::vec3(0.8f, 1.0f, 1.0f), heat);
                particles_->emit(pos, vel, 0, 1.0f, col);
            }
        }
        break;
    }
    case Scene::CityCorruption: {
        // Light artery sparks
        int burst = 60;
        for (int i = 0; i < burst; i++) {
            float px = (glm::linearRand(0.0f, 1.0f) - 0.5f) * 60.0f;
            float pz = (glm::linearRand(0.0f, 1.0f) - 0.5f) * 60.0f;
            glm::vec3 pos = glm::vec3(px, glm::linearRand(0.0f, 8.0f), pz);
            glm::vec3 vel = glm::vec3(0, glm::linearRand(0.1f, 0.4f), 0);
            particles_->emit(pos, vel, 0, 1.5f, glm::vec3(0.0f, 0.6f, 1.0f));
        }
        break;
    }
    case Scene::TimeFracture: {
        // Frozen debris: particles with near-zero velocity, suspended in time
        int burst = 28;
        for (int i = 0; i < burst; i++) {
            glm::vec3 pos = glm::sphericalRand(glm::linearRand(0.3f, 2.8f));
            glm::vec3 vel = glm::sphericalRand(0.018f);  // almost frozen
            float hue = glm::linearRand(0.0f, 1.0f);
            glm::vec3 col = hue < 0.5f
                ? glm::vec3(0.15f, 0.45f + hue * 0.5f, 1.0f)    // cold blue
                : glm::vec3(1.0f, 0.9f - hue * 0.7f, 0.05f);    // hot orange-red
            particles_->emit(pos, vel, 0, 3.5f, col);
        }
        break;
    }
    case Scene::GeometryBloom: {
        // Colorful petal particles
        int burst = 80;
        for (int i = 0; i < burst; i++) {
            float angle = glm::linearRand(0.0f, 6.28318f);
            float r = glm::linearRand(0.2f, 1.0f);
            glm::vec3 pos = glm::vec3(std::cos(angle)*r, glm::linearRand(-0.5f, 0.5f), std::sin(angle)*r);
            glm::vec3 vel = glm::vec3(std::cos(angle)*0.5f, 0.3f, std::sin(angle)*0.5f);
            glm::vec3 col = glm::vec3(
                0.5f + 0.5f*std::sin(t + float(i)*0.3f),
                0.3f,
                0.8f + 0.2f*std::cos(t + float(i)*0.7f));
            particles_->emit(pos, vel, 0, 2.0f, col);
        }
        break;
    }
    case Scene::ImpossibleSpace: {
        // Quantum fragments spiraling inward toward portals
        int burst = 40;
        for (int i = 0; i < burst; i++) {
            glm::vec3 pos = glm::sphericalRand(glm::linearRand(0.4f, 2.5f));
            glm::vec3 vel = -glm::normalize(pos) * glm::linearRand(0.3f, 1.2f);  // inward
            bool cool = glm::linearRand(0.0f, 1.0f) < 0.5f;
            glm::vec3 col = cool
                ? glm::vec3(0.0f, 0.55f, 1.0f)   // portal cyan-blue
                : glm::vec3(0.55f, 0.1f, 1.0f);  // portal violet
            particles_->emit(pos, vel, 0, 2.0f, col);
        }
        break;
    }
    case Scene::Transcendence: {
        // Cosmic star-like particles growing outward.
        // Stop emitting before the silence window (scene_norm > 0.82) so existing
        // particles age out (~4s lifetime) by the time the logo materialises at ~0.905.
        float sn_t = static_cast<float>(tl.scene_norm());
        if (sn_t > 0.82f) break;
        int burst = 200;
        for (int i = 0; i < burst; i++) {
            glm::vec3 pos = glm::ballRand(0.1f);
            glm::vec3 vel = glm::normalize(pos + glm::sphericalRand(0.1f)) * glm::linearRand(0.5f, 3.0f);
            glm::vec3 col = glm::vec3(
                glm::linearRand(0.6f, 1.0f),
                glm::linearRand(0.6f, 1.0f),
                1.0f);
            particles_->emit(pos, vel, 0, 4.0f, col);
        }
        break;
    }
    default:
        break;
    }
}

// ─── shutdown ─────────────────────────────────────────────────────────────────

void Renderer::shutdown() {
    debug_ui_.shutdown();
    if (particles_) { particles_->shutdown(); particles_.reset(); }

    if (fullscreen_vao_)    glDeleteVertexArrays(1, &fullscreen_vao_);
    for (auto& p : scene_programs_) { if (p) glDeleteProgram(p); p = 0; }
    if (mesh_program_)      { glDeleteProgram(mesh_program_);  mesh_program_ = 0; }
    if (post_program_)      { glDeleteProgram(post_program_);  post_program_ = 0; }

    if (city_vao_)     glDeleteVertexArrays(1, &city_vao_);
    if (city_vbo_)     glDeleteBuffers(1, &city_vbo_);
    if (city_ebo_)     glDeleteBuffers(1, &city_ebo_);
    if (monolith_vao_) glDeleteVertexArrays(1, &monolith_vao_);
    if (monolith_vbo_) glDeleteBuffers(1, &monolith_vbo_);
    if (monolith_ebo_) glDeleteBuffers(1, &monolith_ebo_);

    if (fbo_tex_)      glDeleteTextures(1, &fbo_tex_);
    if (fbo_)          glDeleteFramebuffers(1, &fbo_);
    if (prev_fbo_tex_) glDeleteTextures(1, &prev_fbo_tex_);
    if (prev_fbo_)     glDeleteFramebuffers(1, &prev_fbo_);

    for (auto& pf : portal_fbos_) {
        if (pf.tex) glDeleteTextures(1, &pf.tex);
        if (pf.fbo) glDeleteFramebuffers(1, &pf.fbo);
    }

    fullscreen_vao_ = 0;
    city_vao_ = city_vbo_ = city_ebo_ = 0;
    monolith_vao_ = monolith_vbo_ = monolith_ebo_ = 0;
    fbo_ = fbo_tex_ = prev_fbo_ = prev_fbo_tex_ = 0;
}

}  // namespace hyp
