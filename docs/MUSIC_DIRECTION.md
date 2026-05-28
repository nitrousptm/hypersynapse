# HYPERSYNAPSE — Music Direction Brief

**AI-Generated Drum & Bass Composition for Assembly 2026**

---

## Overview

| Aspect | Specification |
|--------|---------------|
| **Genre** | Liquid Drum & Bass (Intelligent DnB) |
| **BPM** | 174 BPM (fast, energetic) |
| **Tempo** | ~0.344 seconds per beat |
| **Duration** | 8:00 (480 seconds exact) |
| **Style** | Cyberpunk × Abstract × Synthetic |
| **Key** | C Major / A Minor (flexible per section) |
| **Vibe** | Futuristic neural network, organized chaos, transcendent finale |

---

## Act Structure & Music Cues

### ACT I: Boot / Synapse (0:00–2:15 / 135s)

**Visual Theme:** Neural lattice awakening, pulsing dendrites, cyberpunk grid  
**Music Energy:** 60% → 85%  
**Instrumentation:**
- Synth pads: warm, evolving (0:00–1:00)
- Breakbeats: sparse, syncopated (1:00–1:30)
- Sub bass: minimal, atmospheric (0:00–2:15)
- Ambient textures: glitchy, organic (throughout)

**Key Moments:**
| Time | Event | Beat Sync |
|------|-------|-----------|
| 0:00 | Intro: pad swell | bar 0 |
| 0:45 | Breakbeat enters (170 BPM break) | beat downbeat |
| 1:00 | Accelerate to 174 BPM | bar sync |
| 1:30 | Sidechain compression (neural pulse) | on-beat |
| 2:10 | Transition: build-up (quiet) | bar countdown |

**Color Palette:** Magenta → Cyan (matches visual progression)  
**Emotional Arc:** Curiosity → Recognition → Acceleration

---

### ACT II: Lattice / City (2:15–5:45 / 210s)

**Visual Theme:** Cyberpunk metropolis, flying through neon towers, grid patterns  
**Music Energy:** 85% → 95%  
**Instrumentation:**
- Breakbeats: tight, complex (driving force)
- Syncopated snares: hi-hats, rolls, fills
- Bass guitar riff: funky, locked to breakbeat (2:30–5:30)
- Pads: haunting, evolving chords (underneath)
- FX: laser sounds, glitches, filtered sweeps
- Atmosphere: rain, wind, traffic (subtle, underscore)

**Key Moments:**
| Time | Event | Beat Sync |
|------|-------|-----------|
| 2:15 | Transition: dnb breakbeat fully in | bar sync |
| 2:30 | Bass guitar enters (funky groove) | beat downbeat |
| 3:15 | First drum break (4-bar solo fill) | bar boundary |
| 4:00 | Reverse snare fill, tempo dip (syncopation) | bar boundary |
| 4:30 | Final buildup: layering, sidechain | last 30s |
| 5:30 | FX transition, bass fades | outro |

**Signature Elements:**
- Liquid hi-hats with swing (16th-note placement)
- Deep sub-bass (50–80 Hz) for club feel
- Snare cracks on off-beats (syncopation)
- Filtered white-noise sweeps (cyberpunk atmosphere)

**Emotional Arc:** Groove → Intensity → Euphoria

---

### ACT III: Bloom / Collapse (5:45–8:00 / 135s)

**Visual Theme:** Chaotic fractals, Mandelbox explosion, particles coalescing to singularity  
**Music Energy:** 95% → 30% (climax → collapse)  
**Instrumentation:**
- Breakbeats: maximalist, polyrhythmic (5:45–7:00)
- Orchestral swells: strings, brass, choir (5:45–7:30)
- Synth pad crescendo: building tension (5:45–7:15)
- Ambient soundscape: field recordings, granular synthesis
- Minimalist ending: single sine wave fade (7:30–8:00)

**Key Moments:**
| Time | Event | Beat Sync |
|------|-------|-----------|
| 5:45 | Transition: max complexity (all layers) | bar sync |
| 6:30 | Orchestral swell (dramatic moment) | beat accent |
| 7:00 | Deconstruction: layers drop one by one | bar countdown |
| 7:15 | Drums stop; only pads + atmosphere | bar sync |
| 7:30 | Everything fades except low drone | final bar |
| 7:45 | Single sine wave, logarithmic fade | final seconds |
| 8:00 | Silence (absolute ending) | exact |

**Signature Element:** Glitch/chop effect on beat boundaries (neural shutdown)

**Emotional Arc:** Climax → Transcendence → Void

---

## Beat-Sync Requirements

The timeline will provide to audio system:
- `beat_phase`: [0,1] phase within current beat
- `bar_phase`: [0,1] phase within current 4-beat bar
- `beat_count`: integer index (0, 1, 2, ...)
- `act_norm`: [0,1] progress within current act

**Audio Reactive Cues:**
- Sidechain compression: peaks on beat downbeats (kick + snare)
- Snare fills: aligned to bar boundaries (4-beat grid)
- Breakbeat syncopation: 16th-note placement within bar
- Transition points: occur exactly at act boundaries (beat-synced)

---

## Technical Specifications

### Mixing & Mastering
- **Loudness:** -14 LUFS (broadcast standard)
- **Peak:** -1 dBFS max (headroom for post FX)
- **Frequency Balance:**
  - Sub (20–80 Hz): present, warm
  - Mids (500–2000 Hz): clarity, synth presence
  - Highs (5k–20k Hz): air, shimmer, hi-hat detail
- **Stereo Width:** 100% (full L/R separation)

### File Format
- **Codec:** WAV (PCM), 48 kHz, 24-bit (or MP3 128kbps for testing)
- **Channel:** Stereo (2.0)
- **Duration:** 480 seconds ± 0.1s tolerance
- **Silence:** 0.5s leader before content (optional)

### AI Composition Guidelines
For the AI composer (e.g., Suno, udio, custom model):

1. **Prompt Engineering:**
   - "Liquid Drum & Bass, 174 BPM, cyberpunk theme"
   - "3-part structure: awakening (calm→energetic), flight (intense groovy), transcendence (chaotic→serene)"
   - "Breakbeats syncopated, sub bass deep, synth pads evolving, emotional arc clear"

2. **Post-Production Checklist:**
   - [ ] Tempo locked to exactly 174 BPM
   - [ ] No tempo drift over 8 minutes
   - [ ] Drums punchy, sub bass present
   - [ ] Act transitions smooth but recognizable
   - [ ] No loop artifacts (composition must flow naturally)
   - [ ] Normalize to -14 LUFS

3. **Rejection Criteria:**
   - Tempo deviation > 2% over duration
   - Repetitive loops (same 8-bar phrase > 3x)
   - Muddy low-end (sub bass clashing with kick)
   - Generic "AI-generated" artifacts (tinny, lifeless)

---

## Approval & Finalization

**Composer:** [AI Model]  
**Direction Lead:** `demo_director` + `audio_specialist`  
**Approval Timeline:** 2026-06-15 (buffer for revisions)  
**Final Delivery:** 2026-07-15 (2-week pre-submission buffer)

**Revision Process:**
1. Generate 3 candidate compositions
2. Screen for BPM accuracy, energy arc, DnB authenticity
3. Test sync with existing demo acts (visual + audio)
4. Approve 1 candidate or re-prompt with feedback

---

## References & Inspiration

**Demoscene DnB Classics:**
- Wipe Out (Orange, 2006) — breakbeat precision
- The Bitch (Complex, 2000) — sidechain mastery
- Fusor (Black Maiden, 2006) — sophisticated arrangement

**Modern DnB Artists:**
- High Contrast (liquid, melodic)
- London Elektricity (funky grooves)
- Logistics (atmospheric, deep)
- Andy C (fast breakbeats, energy)

**Assembly Winners (Audio):**
- Mostly orchestral or minimal (avoid generic synths)
- Strong narrative arc (not just beat flex)
- Emotional resonance > technical complexity

---

## Next Steps

1. **Generate 3 candidates** with AI (June 1–7)
2. **Screen & select** best fit (June 8–15)
3. **Integrate into demo** + test sync (June 16–30)
4. **Approve for submission** (July 1–15)
5. **Final delivery** to Assembly (July 28)

---

*Music is the emotional glue that transforms tech-demo into art.*
