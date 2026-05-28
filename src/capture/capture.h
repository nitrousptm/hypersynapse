#pragma once
#include <cstdint>
#include <string>
#include <string_view>

namespace hyp {

// Simple frame capture to PPM (Portable Pixelmap) format.
// PPM is human-readable and requires no external libraries.
// Later: can convert to PNG via libpng or ffmpeg post-processing.

class FrameCapture {
public:
    FrameCapture(std::string_view output_dir, uint32_t width, uint32_t height);

    // Read current framebuffer and dump to PPM file
    void capture_frame(uint32_t frame_number);

    // Generate ffmpeg command for WebM encoding
    // Run offline after all frames captured
    std::string ffmpeg_command(uint32_t fps = 60) const;

    ~FrameCapture();

private:
    std::string output_dir_;
    uint32_t width_, height_;
    uint8_t* pixel_buffer_;  // RGB temporary buffer
};

}  // namespace hyp
