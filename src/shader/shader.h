#pragma once
#include <cstdint>
#include <string_view>

namespace hyp::shader {

uint32_t load_program(std::string_view vert_path, std::string_view frag_path);
uint32_t load_compute(std::string_view comp_path);

}  // namespace hyp::shader
