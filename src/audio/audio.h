#pragma once

#define MINIAUDIO_IMPLEMENTATION
#include <miniaudio.h>

namespace hyp {

class Audio {
public:
    bool init();
    void play(const char* path);
    void seek(double seconds);
    void shutdown();

    double position() const;
    bool is_active() const { return active_; }
    bool is_valid() const { return valid_; }

private:
    ma_engine engine_{};
    ma_sound sound_{};
    bool active_ = false;
    bool valid_ = false;
};

}  // namespace hyp
