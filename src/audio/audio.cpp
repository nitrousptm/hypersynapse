#define MINIAUDIO_IMPLEMENTATION
#include "audio/audio.h"
#include <cmath>
#include <cstdint>
#include <cstdio>

namespace hyp {

bool Audio::init() {
    ma_engine_config config = ma_engine_config_init();
    config.channels = 2;
    config.sampleRate = 48000;

    if (ma_engine_init(&config, &engine_) != MA_SUCCESS) {
        std::fprintf(stderr, "[audio] failed to init miniaudio engine\n");
        return false;
    }

    valid_ = true;
    active_ = true;
    return true;
}

void Audio::play(const char* path) {
    if (!valid_) return;

    if (sound_loaded_) {
        ma_sound_stop(&sound_);
        ma_sound_uninit(&sound_);
        sound_loaded_ = false;
    }

    // Precompute RMS envelope before starting playback — decodes the file once
    // using a separate decoder so we don't delay the playback start.
    precompute_envelope(path);

    if (ma_sound_init_from_file(&engine_, path, MA_SOUND_FLAG_DECODE, nullptr, nullptr, &sound_) != MA_SUCCESS) {
        std::fprintf(stderr, "[audio] failed to load: %s\n", path);
        return;
    }
    sound_loaded_ = true;

    if (ma_sound_start(&sound_) != MA_SUCCESS) {
        std::fprintf(stderr, "[audio] failed to play sound\n");
        ma_sound_uninit(&sound_);
        sound_loaded_ = false;
        return;
    }

    std::printf("[audio] playing: %s\n", path);
}

void Audio::seek(double seconds) {
    if (!valid_) return;
    ma_sound_seek_to_pcm_frame(&sound_, (ma_uint64)(seconds * 48000.0));
}

double Audio::position() {
    if (!valid_) return 0.0;
    ma_uint64 frame = 0;
    ma_sound_get_cursor_in_pcm_frames(&sound_, &frame);
    return (double)frame / 48000.0;
}

void Audio::set_volume(float v) {
    if (!valid_ || !sound_loaded_) return;
    ma_sound_set_volume(&sound_, v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v));
}

void Audio::shutdown() {
    active_ = false;
    if (!valid_) return;
    if (sound_loaded_) {
        ma_sound_stop(&sound_);
        ma_sound_uninit(&sound_);
        sound_loaded_ = false;
    }
    ma_engine_uninit(&engine_);
    valid_ = false;
}

// ─── Amplitude envelope (precomputed at load time) ───────────────────────────

void Audio::precompute_envelope(const char* path) {
    rms_envelope_.clear();
    envelope_peak_ = 1.0f;

    // Decode the WAV independently at f32/stereo/48 kHz so we get raw samples.
    ma_decoder_config cfg = ma_decoder_config_init(ma_format_f32, 2, 48000);
    ma_decoder dec{};
    if (ma_decoder_init_file(path, &cfg, &dec) != MA_SUCCESS) {
        std::fprintf(stderr, "[audio] envelope: failed to open %s\n", path);
        return;
    }

    // One envelope sample every kEnvelopeStep seconds.
    const int kFramesPerWindow = static_cast<int>(48000 * kEnvelopeStep + 0.5);
    const int kChannels        = 2;
    const int kBufFrames       = kFramesPerWindow;

    std::vector<float> buf(static_cast<size_t>(kBufFrames * kChannels));
    float peak = 0.0f;

    while (true) {
        ma_uint64 frames_read = 0;
        ma_result r = ma_decoder_read_pcm_frames(&dec, buf.data(),
                                                  static_cast<ma_uint64>(kBufFrames),
                                                  &frames_read);
        if (frames_read == 0) break;

        // RMS over all samples in this window
        double sum_sq = 0.0;
        const size_t n = static_cast<size_t>(frames_read) * kChannels;
        for (size_t i = 0; i < n; ++i) {
            double s = buf[i];
            sum_sq += s * s;
        }
        float rms = static_cast<float>(std::sqrt(sum_sq / static_cast<double>(n)));
        rms_envelope_.push_back(rms);
        if (rms > peak) peak = rms;

        if (r != MA_SUCCESS) break;  // end-of-file
    }

    ma_decoder_uninit(&dec);

    // Normalise so the loudest window = 1.0
    envelope_peak_ = (peak > 1e-6f) ? peak : 1.0f;
    for (float& v : rms_envelope_) v /= envelope_peak_;

    std::printf("[audio] envelope: %zu windows (%.1f s, peak=%.4f)\n",
                rms_envelope_.size(),
                rms_envelope_.size() * kEnvelopeStep,
                envelope_peak_);
}

float Audio::amplitude_at(double t) const {
    if (rms_envelope_.empty()) return 0.5f;
    double idx_f  = t / kEnvelopeStep;
    if (idx_f < 0.0) return rms_envelope_.front();
    auto   idx_lo = static_cast<size_t>(idx_f);
    if (idx_lo >= rms_envelope_.size()) return rms_envelope_.back();
    size_t idx_hi = idx_lo + 1;
    if (idx_hi >= rms_envelope_.size()) return rms_envelope_.back();
    float  frac   = static_cast<float>(idx_f - static_cast<double>(idx_lo));
    return rms_envelope_[idx_lo] * (1.0f - frac) + rms_envelope_[idx_hi] * frac;
}

}  // namespace hyp
