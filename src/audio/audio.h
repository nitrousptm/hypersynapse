#pragma once

#include <miniaudio.h>

namespace hyp {

class Audio {
public:
    bool init();
    void play(const char* path);
    void seek(double seconds);
    void shutdown();

    double position();
    void set_volume(float v);
    bool is_active() const { return active_; }
    bool is_valid() const { return valid_; }

private:
    ma_engine engine_{};
    ma_sound sound_{};
    bool active_       = false;
    bool valid_        = false;
    bool sound_loaded_ = false;
};

}  // namespace hyp
