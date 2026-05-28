# Particle System — Architecture & Integration

## Overview

The HYPERSYNAPSE demo uses a **GPU-resident particle system** via compute shaders to create Act I volumetric effects (synaptic discharge, neural firing) and optional Act II city atmosphere (debris, energy orbs).

## Target Specs

| | RTX 5090 | RTX 3090 |
|---|---|---|
| Particle count | 4M (Act I), 2M (Act II) | 1M (Act I), 500k (Act II) |
| Update method | Compute dispatch, frustum culling | Compute dispatch, no culling |
| Render target | Screen-space particles | Additive overlay |
| Expected cost | <5ms per frame | ~10-15ms per frame |

## Design

### Data Layout

**SSBO (Shader Storage Buffer Objects):**
- **Particle data:** position (vec3), velocity (vec3), age (float), type (uint)
- **Indirect draw buffer:** for hardware-culled rendering (5090 only)

### Update Pipeline

1. **Compute shader** (`particles_update.comp`)
   - Input: current particles, timeline state (beat_phase, time, act)
   - Process:
     - Advect physics (simple Euler, 0.016s per frame)
     - Age particles, remove expired ones
     - Apply forces based on act/beat grid
   - Output: updated SSBOs

2. **Cull/compact** (async on 5090, every 4 frames on 3090)
   - Frustum test via VP matrix
   - Compact dead particles (remove gaps)

3. **Render** (fragment shader or point-sprite geometry)
   - Additive blend to scene texture
   - Size modulated by age/beat
   - Color per particle type (neon + glow)

### Integration Points

**Act I (0:00–2:15): Synaptic birth**
- Emit particles from predefined neuron soma positions (from `01_synapse.frag` lattice)
- Particles: small, fast, white→magenta fade
- Behavior: random divergence, life ~0.5s, killed by beat boundary
- Beat-reactive: double emission on bar downbeats

**Act II (2:15–5:45): City atmosphere** (optional, performance permitting)
- Emit from viewport edges, float through scene
- Particles: energy orbs, slow fall
- Lifetime: 2–3s
- Sync: major emission bursts on drop (4:30 mark)

**Act III (5:45–8:00): Collapse**
- Particle emission ceases at 5:45
- Remaining particles decelerate and fade
- Final 10 seconds: silence and stillness

## Implementation Checklist

- [ ] `shaders/compute/particles_update.comp` — update kernel
- [ ] `shaders/compute/particles_render.comp` (optional) — indirect dispatch setup
- [ ] `src/particles/particles.h` — C++ particle system manager
- [ ] `src/particles/particles.cpp` — SSBO allocation, compute dispatch
- [ ] Renderer integration: dispatch compute before scene render
- [ ] Timeline uniforms: beat_phase, act, time fed to compute shader
- [ ] Performance profiling: frame-time budget per hardware tier

## Performance Tuning

### RTX 5090 Optimization Path

```cpp
// Workgroup size: 256 threads (full wavefront)
#define WORKGROUP_SIZE 256

// Per-frame:
// 1. Compute update (4M ÷ 256 = 15625 dispatches ≈ 2ms)
// 2. Frustum cull + compact (every 4 frames ≈ 0.5ms/frame amortized)
// 3. Render via hardware-culled indirect draw ≈ 2ms
// Total: ~4.5ms, leaves 11ms for scene + post
```

### RTX 3090 Fallback Path

```cpp
// Reduce particle count to 1M or 500k
// Disable frustum cull (simpler code, faster on 3090 due to less divergence)
// Compact particles every frame (simple O(n) pass)
// Expected: ~10-12ms compute + render, falls into 45-55 fps budget
```

## Shader Conventions

All particle shaders use these uniforms:

```glsl
// Shared timeline state
uniform float u_time;
uniform float u_beat;
uniform float u_act_norm;
uniform int u_beat_cnt;

// Hardware info (for scaling)
uniform uint u_max_particles;
uniform uint u_particle_count;

// Matrices for culling
uniform mat4 u_vp;
uniform vec4 u_frustum[6];  // plane equations
```

## Next Steps

1. Profile empty dispatch overhead on target hardware
2. Implement `particles_update.comp` with physics skeleton
3. Test beat-grid emission with simple debug render (point sprites)
4. Iterate emission rates and lifetimes per act
5. Add frustum cull for 5090, measure gain
6. Final: record demo gameplay timings

## References

- NVIDIA: "GPU Gems 3 — Simulating Particles on GPU"
- Khronos: OpenGL Compute Shader Best Practices
- GDC 2023: "Scaling Particle Systems for High-End Hardware"
