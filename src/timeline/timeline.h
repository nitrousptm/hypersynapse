#pragma once
#include <cmath>
#include <cstdint>

namespace hyp {

constexpr double kBPM     = 174.0;
constexpr double kBeatSec = 60.0 / kBPM;   // ~0.3448 s
constexpr double kBarSec  = kBeatSec * 4.0; // ~1.3793 s

// Act boundaries (seconds) — scaled to 3:47 audio duration
constexpr double kAct1End = 64.0;   // 1:04
constexpr double kAct2End = 164.0;  // 2:44
constexpr double kAct3End = 227.641; // 3:47

enum class Act : uint8_t { I = 0, II = 1, III = 2 };

class Timeline {
public:
    explicit Timeline(double duration_sec) : duration_(duration_sec) {}

    void update(double t) {
        time_       = t;
        beat_phase_ = std::fmod(t, kBeatSec) / kBeatSec;
        beat_count_ = static_cast<int>(t / kBeatSec);
        bar_phase_  = std::fmod(t, kBarSec)  / kBarSec;
        bar_count_  = static_cast<int>(t / kBarSec);
    }

    double time()       const { return time_; }
    double duration()   const { return duration_; }
    double norm()       const { return duration_ > 0.0 ? time_ / duration_ : 0.0; }

    double beat_phase() const { return beat_phase_; }
    int    beat_count() const { return beat_count_; }
    double bar_phase()  const { return bar_phase_; }
    int    bar_count()  const { return bar_count_; }

    Act act() const {
        if (time_ < kAct1End) return Act::I;
        if (time_ < kAct2End) return Act::II;
        return Act::III;
    }

    // [0,1] normalised position within the current act
    double act_norm() const {
        if (time_ < kAct1End)  return time_ / kAct1End;
        if (time_ < kAct2End)  return (time_ - kAct1End) / (kAct2End - kAct1End);
        return (time_ - kAct2End) / (kAct3End - kAct2End);
    }

    // Crossfade phases: [0,1] when transitioning, 0 when not transitioning
    double transition_progress(double window_sec = 1.5) const {
        // Act I → II crossfade
        if (time_ >= kAct1End - window_sec * 0.5 && time_ < kAct1End + window_sec * 0.5) {
            return (time_ - (kAct1End - window_sec * 0.5)) / window_sec;
        }
        // Act II → III crossfade
        if (time_ >= kAct2End - window_sec * 0.5 && time_ < kAct2End + window_sec * 0.5) {
            return (time_ - (kAct2End - window_sec * 0.5)) / window_sec;
        }
        return -1.0;  // Not in transition
    }

private:
    double duration_   = 0.0;
    double time_       = 0.0;
    double beat_phase_ = 0.0;
    double bar_phase_  = 0.0;
    int    beat_count_ = 0;
    int    bar_count_  = 0;
};

}  // namespace hyp
