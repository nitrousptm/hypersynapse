#pragma once

namespace hyp {

class Audio {
public:
    bool init();
    void play(const char* path);
    void shutdown();
    double position() const { return position_; }

private:
    double position_ = 0.0;
    bool active_ = false;
};

}  // namespace hyp
