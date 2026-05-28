#pragma once
#include <cmath>
#include <cstdint>

namespace hyp {

constexpr double kBPM     = 133.0;
constexpr double kBeatSec = 60.0 / kBPM;        // ~0.45113 s
constexpr double kBarSec  = kBeatSec * 4.0;     // ~1.80451 s

// Demo duration
constexpr double kDemoDuration = 240.0;          // 4:00

// Scene boundaries (seconds)
constexpr double kScene1End = 18.0;   // 0:18 — first kick / Scene 2 cut
constexpr double kScene2End = 45.0;   // 0:45 — Act I end / bass drop
constexpr double kScene3End = 75.0;   // 1:15
constexpr double kScene4End = 105.0;  // 1:45 — Act II end / emotional peak
constexpr double kScene5End = 150.0;  // 2:30
constexpr double kScene6End = 180.0;  // 3:00 — Act III end
constexpr double kScene7End = 240.0;  // 4:00 — finale

// Act boundaries
constexpr double kAct1End = 45.0;    // BOOT
constexpr double kAct2End = 105.0;   // INFECTION
constexpr double kAct3End = 180.0;   // ASCENSION
constexpr double kAct4End = 240.0;   // TRANSCENDENCE

// Special cue times
constexpr double kCueFirstKick      = 18.0;   // Scene 1 → 2
constexpr double kCueBassDrop       = 45.0;   // Act I → II
constexpr double kCueEmotionalPeak  = 105.0;  // Act II → III
constexpr double kCueHolyShit       = 170.0;  // Recursive universe reveal (~2:50)
constexpr double kCueClimax         = 150.0;  // Act III climax (2:30)
constexpr double kCueSilence        = 230.0;  // Final silence (~3:50)
constexpr double kCueLogo           = 232.0;  // Logo appears

enum class Act   : uint8_t { I = 0, II = 1, III = 2, IV = 3 };
enum class Scene : uint8_t {
    BootVoid       = 0,  // 0:00–0:18
    AwakeningCore  = 1,  // 0:18–0:45
    CityCorruption = 2,  // 0:45–1:15
    TimeFracture   = 3,  // 1:15–1:45
    GeometryBloom  = 4,  // 1:45–2:30
    ImpossibleSpace= 5,  // 2:30–3:00  *** SIGNATURE ***
    Transcendence  = 6,  // 3:00–4:00
};

class Timeline {
public:
    explicit Timeline(double duration_sec = kDemoDuration)
        : duration_(duration_sec) {}

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
        if (time_ < kAct3End) return Act::III;
        return Act::IV;
    }

    Scene scene() const {
        if (time_ < kScene1End) return Scene::BootVoid;
        if (time_ < kScene2End) return Scene::AwakeningCore;
        if (time_ < kScene3End) return Scene::CityCorruption;
        if (time_ < kScene4End) return Scene::TimeFracture;
        if (time_ < kScene5End) return Scene::GeometryBloom;
        if (time_ < kScene6End) return Scene::ImpossibleSpace;
        return Scene::Transcendence;
    }

    // [0,1] position within current scene
    double scene_norm() const {
        if (time_ < kScene1End) return time_ / kScene1End;
        if (time_ < kScene2End) return (time_ - kScene1End) / (kScene2End - kScene1End);
        if (time_ < kScene3End) return (time_ - kScene2End) / (kScene3End - kScene2End);
        if (time_ < kScene4End) return (time_ - kScene3End) / (kScene4End - kScene3End);
        if (time_ < kScene5End) return (time_ - kScene4End) / (kScene5End - kScene4End);
        if (time_ < kScene6End) return (time_ - kScene5End) / (kScene6End - kScene5End);
        return (time_ - kScene6End) / (kScene7End - kScene6End);
    }

    // [0,1] position within current act
    double act_norm() const {
        if (time_ < kAct1End) return time_ / kAct1End;
        if (time_ < kAct2End) return (time_ - kAct1End) / (kAct2End - kAct1End);
        if (time_ < kAct3End) return (time_ - kAct2End) / (kAct3End - kAct2End);
        return (time_ - kAct3End) / (kAct4End - kAct3End);
    }

    // Crossfade progress [0,1] around a scene boundary, -1 if not in window
    double transition_progress(double window_sec = 1.5) const {
        const double boundaries[] = {
            kScene1End, kScene2End, kScene3End,
            kScene4End, kScene5End, kScene6End
        };
        for (double b : boundaries) {
            double lo = b - window_sec * 0.5;
            double hi = b + window_sec * 0.5;
            if (time_ >= lo && time_ < hi)
                return (time_ - lo) / window_sec;
        }
        return -1.0;
    }

    // True for one frame when a cue fires (within one beat_phase cycle)
    bool cue_fired(double cue_time, double window = 0.05) const {
        return time_ >= cue_time && time_ < cue_time + window;
    }

private:
    double duration_   = kDemoDuration;
    double time_       = 0.0;
    double beat_phase_ = 0.0;
    double bar_phase_  = 0.0;
    int    beat_count_ = 0;
    int    bar_count_  = 0;
};

}  // namespace hyp
