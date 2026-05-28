#include "capture/capture.h"

#include <cstdio>
#include <cstring>
#include <glad/gl.h>

namespace hyp {

FrameCapture::FrameCapture(std::string_view output_dir, uint32_t width, uint32_t height)
    : output_dir_(output_dir), width_(width), height_(height) {
    // Allocate temporary buffer for RGB pixels
    pixel_buffer_ = new uint8_t[width * height * 3];
    std::printf("[capture] initialized: %ux%u → %s/\n", width, height, output_dir_.c_str());
}

void FrameCapture::capture_frame(uint32_t frame_number) {
    if (!pixel_buffer_) return;

    // Read framebuffer (back buffer) as RGB
    glReadPixels(0, 0, width_, height_, GL_RGB, GL_UNSIGNED_BYTE, pixel_buffer_);

    // Generate filename
    char filename[256];
    std::snprintf(filename, sizeof(filename), "%s/frame_%06u.ppm", output_dir_.c_str(), frame_number);

    // Write PPM file (P6 = binary format)
    FILE* f = std::fopen(filename, "wb");
    if (!f) {
        std::fprintf(stderr, "[capture] cannot write %s\n", filename);
        return;
    }

    // PPM header: "P6 width height maxval\n"
    std::fprintf(f, "P6\n%u %u\n255\n", width_, height_);

    // Write pixel data (RGB, top-to-bottom, so flip vertically)
    for (uint32_t y = 0; y < height_; ++y) {
        uint32_t row = height_ - 1 - y;  // Flip vertically (OpenGL origin is bottom-left)
        uint8_t* row_data = pixel_buffer_ + row * width_ * 3;
        std::fwrite(row_data, 1, width_ * 3, f);
    }

    std::fclose(f);

    // Log every 60 frames
    if (frame_number % 60 == 0) {
        std::printf("[capture] frame %6u written\n", frame_number);
    }
}

std::string FrameCapture::ffmpeg_command(uint32_t fps) const {
    // Generate ffmpeg command for WebM encoding
    // Usage: run offline after all frames captured
    char cmd[512];
    std::snprintf(
        cmd, sizeof(cmd),
        "ffmpeg -framerate %u -i %s/frame_%%06d.ppm "
        "-c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null && "
        "ffmpeg -framerate %u -i %s/frame_%%06d.ppm "
        "-c:v libvpx-vp9 -b:v 10000k -pass 2 hypersynapse.webm",
        fps, output_dir_.c_str(), fps, output_dir_.c_str());
    return std::string(cmd);
}

FrameCapture::~FrameCapture() {
    if (pixel_buffer_) {
        delete[] pixel_buffer_;
        pixel_buffer_ = nullptr;
    }
}

}  // namespace hyp
