#pragma once

#include <cstdint>

namespace hyp {

class Timeline;

class DebugUI {
public:
    DebugUI();
    ~DebugUI();

    bool init();
    void render(const Timeline& tl, int width, int height);
    void shutdown();

private:
    uint32_t overlay_program_ = 0;
    uint32_t overlay_vao_ = 0;
};

}  // namespace hyp
