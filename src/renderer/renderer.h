#pragma once
#include <cstdint>

namespace hyp {

class Timeline;

class Renderer {
public:
    bool init(int width, int height);
    void render(const Timeline& tl);
    void shutdown();

private:
    int width_ = 0;
    int height_ = 0;
    uint32_t fullscreen_vao_ = 0;
    uint32_t intro_program_ = 0;
};

}  // namespace hyp
