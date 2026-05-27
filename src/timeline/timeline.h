#pragma once

namespace hyp {

class Timeline {
public:
    explicit Timeline(double duration_sec) : duration_(duration_sec) {}

    void update(double t) { time_ = t; }
    double time() const { return time_; }
    double duration() const { return duration_; }
    double norm() const { return duration_ > 0.0 ? time_ / duration_ : 0.0; }

private:
    double duration_ = 0.0;
    double time_ = 0.0;
};

}  // namespace hyp
