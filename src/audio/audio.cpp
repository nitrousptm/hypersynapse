#include "audio/audio.h"

namespace hyp {

bool Audio::init()  { active_ = true;  return true; }
void Audio::play(const char* /*path*/) {}
void Audio::shutdown() { active_ = false; }

}  // namespace hyp
