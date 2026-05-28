#pragma once

#include <cstdint>
#include <chrono>
#include <queue>

namespace hyp {

class Stats {
public:
    Stats();

    // Call once per frame
    void update();

    // Query current frame stats
    float fps() const { return fps_; }
    float frame_time_ms() const { return frame_time_ms_; }
    float gpu_utilization() const { return gpu_util_; }

    // Timeline metrics (for debug overlay)
    struct TimelineMetrics {
        double time;
        double beat_phase;
        double bar_phase;
        int beat_count;
        int bar_count;
    };

    void set_timeline_metrics(const TimelineMetrics& m) { timeline_ = m; }
    const TimelineMetrics& timeline() const { return timeline_; }

    // Frame history (for rolling average)
    static constexpr int HISTORY_FRAMES = 60;

    // Reset stats (on scene change, etc)
    void reset();

private:
    using Clock = std::chrono::high_resolution_clock;
    Clock::time_point last_frame_;
    float fps_;
    float frame_time_ms_;
    float gpu_util_;
    int frame_count_;

    std::queue<float> frame_times_;

    TimelineMetrics timeline_;
};

}  // namespace hyp
