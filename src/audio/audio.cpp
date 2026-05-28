#define MINIAUDIO_IMPLEMENTATION
#include "audio/audio.h"
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
    ma_sound_seek_to_pcm_frame(&sound_, (uint64_t)(seconds * 48000.0));
}

double Audio::position() {
    if (!valid_) return 0.0;
    uint64_t frame = 0;
    ma_sound_get_cursor_in_pcm_frames(&sound_, &frame);
    return (double)frame / 48000.0;
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

}  // namespace hyp
