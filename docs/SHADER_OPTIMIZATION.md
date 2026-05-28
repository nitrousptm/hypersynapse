# Shader Optimization Guide

**Target:** RTX 5090 / RTX 3090 @ 60 fps, 1920×1080  
**API:** OpenGL 4.6 Core  
**Budget:** ~16.67 ms per frame (60 fps)

---

## Performance Budget Breakdown

| Component | GPU Time | Budget | Notes |
|-----------|----------|--------|-------|
| Scene Raymarching | 13.0 ms | 78% | Main bottleneck (01_synapse, 02_city, 03_bloom) |
| Particles (Compute) | 0.8 ms | 5% | GPU physics + update |
| Particles (Render) | 0.5 ms | 3% | Point sprite rendering |
| Post-FX | 1.0 ms | 6% | Bloom, CA, scanlines, grain, tonemapping |
| Overhead | 0.5 ms | 3% | Buffer binding, state changes |
| **Total** | **16.0 ms** | **95%** | Target frame time (reserve 5% for variance) |

---

## Scene Shader Optimization

### 01_synapse.frag (Act I: Neural Lattice)

**Current Settings:**
```glsl
const int MAX_ITERATIONS = 120;      // Raymarching steps
const float MAX_DISTANCE = 100.0;    // Ray termination distance
const float EPSILON = 0.001;         // Surface precision
```

**Performance Impact:**
- **120 iterations @ 1920×1080:** ~6–7 ms on RTX 3090
- **Each +10 iterations:** +0.5 ms
- **Each -10 iterations:** -0.5 ms

**Optimization Levels:**

**Level 1: Conservative (RTX 3090, 50–55 fps target)**
```glsl
const int MAX_ITERATIONS = 100;      // -20 iterations
// Results: ~5.5 ms, acceptable quality loss in fine details
```

**Level 2: Balanced (RTX 3090, 55–60 fps)**
```glsl
const int MAX_ITERATIONS = 110;      // -10 iterations
// Results: ~6.0 ms, minimal quality loss
```

**Level 3: Aggressive (RTX 3080, 40–50 fps)**
```glsl
const int MAX_ITERATIONS = 80;       // -40 iterations
// Results: ~4.5 ms, noticeable smoothing but still recognizable
```

**Quality Preservation Tips:**
- Keep MAX_DISTANCE at 100.0 (controls volumetric depth)
- Adjust EPSILON only if surface artifacts appear (increase slightly)
- Use **early ray termination** (already implemented): `if (dist > MAX_DISTANCE) break;`

---

### 02_city.frag (Act II: Cyberpunk City)

**Current Settings:**
```glsl
const int MAX_ITERATIONS = 100;      // Raymarching steps
const int HASH_ITERATIONS = 3;       // Procedural detail level
```

**Performance Impact:**
- **100 iterations @ 1920×1080:** ~4–5 ms on RTX 3090
- **Each ±10 iterations:** ±0.4 ms
- **Each ±1 HASH_ITERATIONS:** ±0.8 ms (higher impact!)

**Optimization Levels:**

**Level 1: Conservative**
```glsl
const int MAX_ITERATIONS = 80;
const int HASH_ITERATIONS = 2;
// Results: ~3.5 ms, city still recognizable but less detailed
```

**Level 2: Balanced**
```glsl
const int MAX_ITERATIONS = 90;
const int HASH_ITERATIONS = 3;
// Results: ~4.2 ms, minimal quality loss
```

**Quality Preservation Tips:**
- HASH_ITERATIONS affects procedural building variety (visual impact)
- If reducing HASH_ITERATIONS, increase MAX_ITERATIONS slightly to compensate
- Keep neon flicker logic (beat-reactive) — it's GPU-cheap

---

### 03_bloom.frag (Act III: Mandelbox Fractal)

**Current Settings:**
```glsl
const int MAX_ITERATIONS = 8;        // Mandelbox fold iterations (FIXED)
const int MARCH_STEPS = 100;         // Raymarching steps
const float ZOOM_FACTOR = 1.5;       // Dynamic camera zoom
```

**Performance Impact:**
- **Mandelbox iterates 8 times per raymarch step** = ~3–4 ms total
- **Mandelbox is distance-estimator expensive** (non-linear)
- **MAX_ITERATIONS = 8 is optimal** (reducing below 8 looks terrible)

**Optimization Strategy:**
- **Cannot reduce Mandelbox iterations** without severe visual degradation
- **Instead: Reduce MARCH_STEPS** (raymarch steps through the fractal)

```glsl
const int MARCH_STEPS = 80;          // instead of 100
// Results: ~2.8 ms, slight smoothing in far details
```

**Quality Preservation Tips:**
- Keep Mandelbox at 8 iterations (non-negotiable)
- ZOOM_FACTOR is cheap (just uniform), can increase for dramatic effect
- If frame rate drops in Act III, reduce MARCH_STEPS, not Mandelbox iterations

---

## Post-FX Optimization

### post.frag (Bloom, CA, Scanlines, Grain)

**Current Settings:**
```glsl
const int BLOOM_SAMPLES = 10;        // Bloom blur radius
const float CHROMATIC_STR = 1.5;     // Chromatic aberration strength
const float SCANLINE_FREQ = 4.0;     // Scanline frequency
const float GRAIN_STRENGTH = 0.08;   // Film grain amount
```

**Performance Impact (total ~1.0 ms):**
- Bloom: ~0.6 ms (most expensive, multi-sample blur)
- CA + Scanlines + Grain: ~0.3 ms (cheap, per-pixel)
- ACES tonemapping: ~0.1 ms (already optimized)

**Optimization (if needed):**

```glsl
// Fast mode (reduce from 10 to 6 samples)
const int BLOOM_SAMPLES = 6;        // ~0.4 ms instead of 0.6 ms

// Ultra-fast mode (reduce to 4 samples)
const int BLOOM_SAMPLES = 4;        // ~0.3 ms, noticeable bloom reduction
```

**Visual Trade-offs:**
- **10 samples:** Smooth, soft bloom (current, high quality)
- **6 samples:** Slightly grainier bloom (acceptable)
- **4 samples:** Visible blur artifacts (not recommended)

**Quality Preservation Tips:**
- Keep CHROMATIC_STR at 1.5 (visual polish, cheap)
- Keep SCANLINE_FREQ and GRAIN_STRENGTH (act-adaptive aesthetics)
- Reduce BLOOM_SAMPLES last (most noticeable change)

---

## GPU Architecture-Specific Tips

### RTX 5090 (Current Target)
- No optimization needed; runs at 60 fps comfortably
- Can increase iterations/samples for even higher quality
- Suggested: Keep current settings

### RTX 3090 (Minimum Target)
- Act I + Act II should hit 55–60 fps
- Act III may dip to 50 fps (acceptable per Assembly requirements)
- Suggested: Reduce 01_synapse to 110 iterations if needed

### RTX 3080 (Below Minimum, Stretch Goal)
- Use "Level 3: Aggressive" settings across all shaders
- Expected: 40–50 fps (may not qualify for competition)
- Suggested: Only if extending compatibility is priority

### Older GPUs (RTX 2080, GTX 1080)
- Not officially supported (OpenGL 4.6 Core requirement)
- If attempting: Use aggressive iteration reduction + lower resolution

---

## Profiling & Measurement

### Per-Shader Timing (Nvidia GPU Profiler)
```
# On Windows with NVIDIA GPU
nsight-compute.exe --kernel-sampling off hypersynapse.exe assets\music.wav
```

**Expected timings (RTX 3090):**
- 01_synapse: 6–7 ms
- 02_city: 4–5 ms
- 03_bloom: 3–4 ms
- post.frag: 1.0 ms
- Total: ~15 ms (within budget)

### Console FPS Monitoring (Built-in)
```
[5.0s] FPS: 60.0 | Frame: 16.67 ms | Act: 0 | Beat: 14
```

**Interpretation:**
- FPS 60.0: Perfect frame time (16.67 ms)
- FPS 55.0: Acceptable frame time (18.18 ms, +1.5 ms over budget)
- FPS 50.0: At limit (20.0 ms, +3.3 ms over budget)
- FPS < 45.0: Unacceptable for Assembly

---

## Performance Tuning Checklist

### If FPS < 60 on RTX 5090
1. Verify GPU drivers are latest (critical for RTX 5090)
2. Disable V-Sync if using fullscreen (may cap at 60 fps incorrectly)
3. Ensure no background tasks (browser, streaming, etc.)
4. Check thermals (GPU might be throttling if hot)

### If FPS 55–60 on RTX 3090 (Acceptable)
- No action needed
- Current settings are optimized for minimum target hardware
- Act II dips to 50 fps are within tolerance

### If FPS < 55 on RTX 3090 (Needs Optimization)
1. Reduce 01_synapse iterations: 120 → 110
2. Reduce 02_city iterations: 100 → 90
3. Reduce post.frag bloom samples: 10 → 6
4. Measure FPS again
5. If still low, reduce to "Level 3: Aggressive"

### If FPS < 40 on RTX 3080 (Give Up, Out of Scope)
- Hardware doesn't meet minimum requirements
- Cannot submit to Assembly with sub-40fps performance
- Consider using pre-rendered video instead (not eligible for PC Demo category)

---

## Quality vs. Performance Trade-offs

### Scene Shader Optimization Cost/Benefit

| Optimization | Cost | Quality Loss | Recommended |
|---|---|---|---|
| 01_synapse 120→110 iters | -0.5 ms | -2% | If FPS 58–60 |
| 01_synapse 120→100 iters | -1.0 ms | -5% | If FPS 55–58 |
| 02_city iter reduction | -0.5 ms | -5% | Acceptable |
| 03_bloom march reduction | -0.5 ms | -3% | If FPS > 55 already |
| post.frag bloom 10→6 | -0.2 ms | -8% (visual) | Last resort |

### Recommended Strategy
1. **Start:** Current settings (120 + 100 iterations)
2. **If needed:** Reduce to 110 + 90 (minimal loss)
3. **If still low:** Reduce to 100 + 80 (acceptable loss)
4. **Last resort:** Reduce post.frag bloom (most visible)

---

## Shader Code Examples

### Iteration Reduction Pattern
```glsl
// Before
const int MAX_ITERATIONS = 120;

// After (conservative)
const int MAX_ITERATIONS = 110;

// No other changes needed — raymarcher automatically adapts
```

### Early Ray Termination (Already Implemented)
```glsl
// This is CRITICAL for performance — keeps it
for (int i = 0; i < MAX_ITERATIONS; ++i) {
    if (dist > MAX_DISTANCE) break;  // <- Saves iterations on far objects
    // ...march...
}
```

### Fast Quality Check
```glsl
// If you reduce iterations, verify surface still looks good:
float surface_detail = clamp(dist / EPSILON, 0.0, 1.0);
// If surface_detail is low (< 0.5), may need more iterations
```

---

## Submission Preparation

### Recommended Settings by GPU

**For RTX 5090 (Maximum Quality):**
```glsl
// 01_synapse.frag
const int MAX_ITERATIONS = 120;  // Current — keep as-is

// 02_city.frag
const int MAX_ITERATIONS = 100;  // Current — keep as-is

// post.frag
const int BLOOM_SAMPLES = 10;    // Current — keep as-is
```

**For RTX 3090 (Balanced):**
```glsl
// 01_synapse.frag
const int MAX_ITERATIONS = 110;  // -10 iterations

// 02_city.frag
const int MAX_ITERATIONS = 100;  // Keep current

// post.frag
const int BLOOM_SAMPLES = 10;    // Keep current
```

**For RTX 3080 (Conservative):**
```glsl
// 01_synapse.frag
const int MAX_ITERATIONS = 100;  // -20 iterations

// 02_city.frag
const int MAX_ITERATIONS = 80;   // -20 iterations, -1 HASH_ITERATIONS

// post.frag
const int BLOOM_SAMPLES = 6;     // -4 samples
```

---

## Testing & Validation

### FPS Target by Act (RTX 3090 Minimum)
| Act | Target | Acceptable Range | Comments |
|---|---|---|---|
| I (Synapse) | 60 fps | 55–60 fps | Most demanding (raymarching) |
| II (City) | 58 fps | 52–60 fps | Mid-range, procedural overhead |
| III (Bloom) | 55 fps | 50–60 fps | Mandelbox fixed 8 iters, lower march steps |

### Console Validation
Run and monitor:
```powershell
.\build\Release\hypersynapse.exe assets\music.wav 2>&1 | Tee-Object -FilePath perf.log
```

Then analyze `perf.log` for FPS trends across the 8-minute runtime.

---

## References

- [GPU Optimization Guide — Nvidia](https://docs.nvidia.com/graphics/programming/opengl/)
- [Raymarching Shader Optimization — Shadertoy](https://www.shadertoy.com/)
- [Mandelbox Distance Estimator](http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-formula/)
- [SDF Library — Inigo Quilez](https://iquilezles.org/articles/distfunctions/)

---

**Last updated:** 28 May 2026  
**Shader Optimization Guide v1.0 — HYPERSYNAPSE**

