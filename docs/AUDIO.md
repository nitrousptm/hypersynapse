# HYPERSYNAPSE Audio Integration

## Overview

Audio is integrated via **miniaudio** (single-header), configured for:
- **Sample rate:** 48 kHz
- **Channels:** 2 (stereo)
- **Format:** WAV (and other formats supported by miniaudio's built-in decoder)

## Timeline Synchronization

The demo is **timeline-first**: visuals run at wall-clock time and drive the 8-minute structure.
Audio is **synchronized to the timeline**, not the other way around:

| Property    | Value |
|---|---|
| **BPM**     | 174 (classic Drum & Bass) |
| **Beat duration** | ~0.3448 seconds |
| **Bar (4 beats)** | ~1.3793 seconds |

Beat and bar grids are hard-coded in `timeline.h` and available to all shaders via:
- `u_beat` — phase within current beat [0,1]
- `u_bar` — phase within current bar [0,1]
- `u_beat_cnt` — absolute beat count
- `u_bar_cnt` — absolute bar count

## 3-Act Audio Structure

| Act | Start | End | Duration | Mood | Notes |
|---|---|---|---|---|---|
| **I: Boot/Synapse** | 0:00 | 2:15 | 135 s (≈12.25 bars) | Electric birth | Sparse, neuron-firing rhythm. Gentle intro builds texture. |
| **II: Lattice/City** | 2:15 | 5:45 | 210 s (≈15.2 bars) | Drive, structure | Main drop at ~0:40 into act. Heavy bass, breakbeats. Peak at 4:30 mark. |
| **III: Bloom/Collapse** | 5:45 | 8:00 | 135 s (≈9.75 bars) | Overload, peace | Breakdown at 5:45. Collapse to silence or ambient final bar. |

## Running with Audio

```bash
# Build
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j

# Run with audio track
./build/hypersynapse path/to/track.wav

# Run without audio (visuals only)
./build/hypersynapse
```

## Audio API

The runtime exposes:

```cpp
class Audio {
    bool init();                      // Initialize miniaudio engine
    void play(const char* path);      // Load and play an audio file
    void seek(double seconds);        // Jump to position (for debugging)
    double position() const;          // Get current playback position
    bool is_active() const;           // Is audio initialized?
    void shutdown();                  // Clean up
};
```

## Expected Audio Characteristics

### Composition

- **Genre:** Drum & Bass (170–180 BPM acceptable)
- **Drums:** Tight 4/4, high-hat rolls for texture, snappy kicks for beat grid
- **Bass:** Synth or electric bass, driving the harmonic root in Act II
- **Melody/Pad:** Soft underlay in Act I, swells in Act II, silence/ambient in Act III collapse
- **Artifacts:** Glitchy elements welcome (fits cyberpunk aesthetic)

### Technical Specs

- **Duration:** Exactly 480 seconds (8:00) or will be looped/cut at boundary
- **Loudness:** Normalize to -1 dB LUFS (hot mix, typical for demoscene)
- **Frequency:** 48 kHz sample rate (will resample if provided at different rate)
- **Codec:** WAV recommended for lossless; MP3/OGG also supported via miniaudio
- **Peak headroom:** 3–6 dB (avoid clipping; ACES tonemapping will handle HDR, but audio doesn't)

### Cueing

If syncing with external tools:
- **Beat #0 starts at t=0**
- **Act I→II transition: 135.0 seconds = beat 390 @ 174 BPM** (12.24 bars)
- **Act II→III transition: 345.0 seconds = beat 1000 @ 174 BPM** (28.62 bars from start)

## Composer Workflow

1. Render a 480-second track at 174 BPM in your DAW
2. Place three major sections:
   - **0–135s:** Act I (sparse, intro)
   - **135–345s:** Act II (dense, drop, climax near 4:30)
   - **345–480s:** Act III (breakdown, final collapse)
3. Export as WAV, 48 kHz, stereo
4. Test: `./build/hypersynapse your_track.wav`
5. Check sync: music beat should visually align with scene cuts and bloom peaks

## Drift & Correction

Currently, **timeline is the master clock**; audio position is monitored but not yet corrected.

If audio/visuals drift >100ms during a long playback:
- Visual shaders continue on timeline
- Audio may fade or resync on next major act boundary
- Future: soft seek if drift detected (implementation reserved for later)

## Integration Notes for Future

- [ ] Optional: implement `--capture` flag for 60 fps WebM export (will require audio re-sync during offscreen render)
- [ ] Optional: expose beat callback for CPU-side animation scripting
- [ ] Optional: support multiple audio layers (stems) for remix-friendly demo variants
