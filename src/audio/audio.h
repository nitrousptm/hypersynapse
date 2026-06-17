#pragma once

#include <miniaudio.h>
#include <vector>

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

    // Returns normalised RMS amplitude [0,1] at the given playback time.
    // Precomputed from the WAV file at play() time so there is zero overhead per-frame.
    // Returns 0.5 if no envelope has been computed (graceful fallback).
    float amplitude_at(double t) const;

private:
    void precompute_envelope(const char* path);

    ma_engine engine_{};
    ma_sound sound_{};
    bool active_       = false;
    bool valid_        = false;
    bool sound_loaded_ = false;

    // RMS amplitude envelope: one value every kEnvelopeStep seconds.
    // Indices: i = int(t / kEnvelopeStep), values in [0,1].
    static constexpr double kEnvelopeStep = 0.010;  // 10 ms windows
    std::vector<float> rms_envelope_;
    float envelope_peak_ = 1.0f;
};

}  // namespace hyp
