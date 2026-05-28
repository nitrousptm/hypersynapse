#include "stats.h"
#include <numeric>

namespace hyp {

Stats::Stats()
    : last_frame_(Clock::now()),
      fps_(60.0f),
      frame_time_ms_(16.67f),
      gpu_util_(0.0f),
      frame_count_(0) {
    // Initialize timeline with defaults
    timeline_ = TimelineMetrics{0.0, 0.0, 0.0, 0, 0};
}

void Stats::update() {
    auto now = Clock::now();
    std::chrono::duration<float, std::milli> elapsed = now - last_frame_;
    frame_time_ms_ = elapsed.count();
    last_frame_ = now;

    // Add to frame history
    frame_times_.push(frame_time_ms_);
    if (static_cast<int>(frame_times_.size()) > HISTORY_FRAMES) {
        frame_times_.pop();
    }

    // Calculate rolling average FPS
    if (!frame_times_.empty()) {
        float total_time = 0.0f;
        std::queue<float> temp = frame_times_;
        while (!temp.empty()) {
            total_time += temp.front();
            temp.pop();
        }
        float avg_frame_time = total_time / frame_times_.size();
        fps_ = (avg_frame_time > 0.001f) ? 1000.0f / avg_frame_time : 60.0f;
    }

    frame_count_++;
}

void Stats::reset() {
    frame_count_ = 0;
    fps_ = 60.0f;
    frame_time_ms_ = 16.67f;
    gpu_util_ = 0.0f;

    // Clear frame history
    while (!frame_times_.empty()) {
        frame_times_.pop();
    }

    timeline_ = TimelineMetrics{0.0, 0.0, 0.0, 0, 0};
}

}  // namespace hyp
