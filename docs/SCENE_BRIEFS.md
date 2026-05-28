# Scene Implementation Briefs

Detailed specifications for each shader specialist to implement.

---

## ACT I: Boot / Synapse (0:00–2:15)

### Scene Composition
- **Primary:** 01_synapse.frag (neural lattice with volumetric glow)
- **Overlay:** Particle system (neural pulse bursts, beat-synced)
- **Post FX:** Standard (bloom, vignette)

---

### 01_synapse.frag — Neural Lattice Raymarcher

**Concept:** Awakening neural network in a 3D lattice. Camera orbits + zooms into the structure.

**Technical Specs:**

| Component | Spec | Notes |
|-----------|------|-------|
| **SDF Base** | Soma (sphere) + dendrite capsules | Use sdf_lib.glsl |
| **Domain** | 3D repeating grid (cell=2.4 units) | Modulo domain folding |
| **Raymarching** | 120 iterations, max dist=14.0 | Early exit at dist < 0.0008 |
| **Volumetric** | Accumulated glow along ray | Inverse-square falloff |
| **Lighting** | Wrapped diffuse + Fresnel rim | Beat-reactive brightness |
| **Colors** | Magenta (0:00) → Cyan (2:15) | Smooth hue evolution |

**Key Uniforms to Use:**
- `u_time`: slow orbit camera
- `u_beat`: soma pulse, kick glow
- `u_act_norm`: camera pull-in (0.0 far, 1.0 near)
- `u_bar_cnt`: discrete palette shifts per bar

**Implementation Checklist:**
- [ ] Neuron structure: 1 soma + 4 dendrite capsules per neuron
- [ ] Smooth blending between components (smin with k=0.04)
- [ ] Domain repetition: `mod(p + cell*0.5, cell) - cell*0.5`
- [ ] Camera orbit: `vec3(cos(t)*3, sin(t*0.37)*0.9+0.2, sin(t)*3)`
- [ ] Act intro pull-in: `mix(5.0, 0.0, smoothstep(0, 0.15, act_norm))`
- [ ] Palette: cosine coloring from u_act_norm + u_bar_cnt
- [ ] Volumetric glow: `glow += 0.004 / (d*d + 0.0015)` along ray
- [ ] Beat kick: `exp(-u_beat * 12.0) * 0.35` flash
- [ ] Normal calculation via numerical gradient (6 samples around p)

**Visual Goals:**
- Delicate, organic neuron structure
- Smooth color evolution (no hard pops)
- Volumetric atmosphere (ethereal, not mushy)
- Clear visual rhythm tied to beat (soma pulse)

**Performance Notes:**
- Target: 1080p60 on RTX 3090 (min spec)
- 120 iterations = ~10ms per frame budget
- Reduce iterations if < 30fps (scale to 90, 70 as needed)

---

### Particle System Integration (Beat-Synced Overlay)

**Purpose:** Neural pulse effect during Act I. Emphasize beat drops and transitions.

**Emission Parameters:**
- **Trigger:** Beat downbeats (beat_phase < 0.05)
- **Burst Count:** 150 particles per downbeat
- **Spawn Zone:** Sphere (radius 0.5) around origin
- **Velocity:** Radial outward (3.5 u/s) + upward bias (0.5)
- **Lifetime:** 1.2 seconds per particle
- **Color:** Magenta (beat start) → Cyan (beat end)

**Rendering:**
- Additive blend (`GL_ONE, GL_ONE`)
- Point sprite with soft-edge falloff
- Fade over lifetime: `1.0 - age_norm`
- Beat-reactive brightness: `1.0 + exp(-beat_phase * 8.0) * 0.5`

**Visual Integration:**
- Particles should NOT dominate the synapse
- Subtle enhancement of beat rhythm
- Brightest at beat downbeats, fade away mid-beat
- Color matches synapse palette (magenta→cyan)

---

### Act I Transition to Act II (t=2:15)

**Timeline Event:**
- Act boundary at 135.0 seconds
- Transition window: 2:00–2:30 (1.5 seconds centered on boundary)
- Visual: Crossfade from 01_synapse → 02_city

**Renderer Behavior:**
- Render 01_synapse at full opacity (2:00–2:15)
- At 2:15, start blending in 02_city
- 02_city opacity increases: [0, 1] over 1.5 seconds
- Crossfade complete by 2:30

**Expected Result:**
- Smooth visual transition (not jarring)
- Music transitions simultaneously (Act II DnB energy kicks in)
- Particles fade out as synapse dissolves

---

## ACT II: Lattice / City (2:15–5:45)

### Scene Composition
- **Primary:** 02_city.frag (cyberpunk city with procedural buildings)
- **Overlay:** Optional particle effects (city lights, sparks)
- **Post FX:** Chromatic aberration + scanlines (neon look)

---

### 02_city.frag — Procedural Cyberpunk City

**Concept:** Camera flies through a neon-lit procedural city. Repeating building towers on a grid.

**Technical Specs:**

| Component | Spec | Notes |
|-----------|------|-------|
| **Base Geometry** | Repeating boxes (building towers) | Grid cell = 3.0 units |
| **SDF Primitives** | sdBox + sdCapsule (street lamps) | From sdf_lib.glsl |
| **Domain** | 2D repeating plane + height variation | `mod(p.xz, cell)` |
| **Raymarching** | 100 iterations, max dist=20.0 | Faster than Act I |
| **Camera Movement** | Forward motion + side sway | Ground-level flight path |
| **Lighting** | Neon emissive colors + rim glow | Beat-reactive window flickers |
| **Atmosphere** | Fog / distance fade | Cyan → black gradient |

**Key Uniforms:**
- `u_time`: camera path (forward + sway)
- `u_beat`: window flicker (emissive pulse on snare)
- `u_bar_cnt`: building color shifts per bar
- `u_act_norm`: camera height variation

**Implementation Checklist:**
- [ ] Building grid: procedural height via hash(id)
- [ ] Window grid: regular holes in building faces (0.2 unit spacing)
- [ ] Emissive material: windows glow (magenta/cyan/yellow random)
- [ ] Street lamps: thin cylinders with glow
- [ ] Camera path: `ro = vec3(0, 0.5, u_time*2.5) + vec3(sin(u_time*0.5)*2, 0, 0)`
- [ ] Building colors: hash-based per grid cell (neon palette)
- [ ] Beat-sync flicker: window brightness `1.0 + exp(-u_beat*6) * 0.7` on snare beats
- [ ] Fog: `col = mix(col, fog_color, 1.0 - exp(-dist*0.05))`

**Visual Goals:**
- Sense of speed (camera motion)
- Neon-lit atmosphere (glowing windows)
- Clear grid structure (not chaotic)
- Rhythm reinforcement (flicker on music beats)

**Performance Notes:**
- 100 iterations (faster pass than Act I)
- Optimize with early ray termination if fog thick
- Window flicker: cheap (just modulate emissive)

---

### Act II Ending / Transition to Act III (t=5:45)

**Timeline Event:**
- Act boundary at 345.0 seconds
- Transition: 5:30–6:00 (1.5 seconds)
- Visual: City collapses / explodes into fractal (02_city → 03_bloom)

**Renderer Behavior:**
- Render 02_city at decreasing opacity
- At 5:45, start rendering 03_bloom with increasing opacity
- 03_bloom fully visible by 6:00

---

## ACT III: Bloom / Collapse (5:45–8:00)

### Scene Composition
- **Primary:** 03_bloom.frag (Mandelbox fractal, abstract)
- **Overlay:** Particle effects (if any, minimal)
- **Post FX:** Max bloom, vignette (collapse effect)

---

### 03_bloom.frag — Mandelbox Fractal SDF

**Concept:** Chaotic abstract fractal that represents neural collapse. As time progresses, camera zooms into center + everything fades to black.

**Technical Specs:**

| Component | Spec | Notes |
|-----------|------|-------|
| **SDF** | Mandelbox distance estimator (scale=2.0) | Classic fractal |
| **Iterations** | 8 (Mandelbox is expensive) | Pre-tuned for quality |
| **Raymarching** | 100 iterations, max dist=25.0 | Coarse (expensive fractal) |
| **Camera** | Zoom toward origin as act_norm → 1.0 | `zoom = mix(5.0, 0.1, act_norm)` |
| **Coloring** | IFS iteration count + position | Chaotic, psychedelic |
| **Post FX** | Chromatic aberration increase | Visual disintegration |
| **Ending** | Fade to black (final 15 seconds) | Logarithmic fadeout |

**Key Uniforms:**
- `u_act_norm`: camera zoom (0.0 far, 1.0 extreme close)
- `u_beat`: subtle oscillation in color/zoom
- `u_time`: rotation, iteration shifts

**Implementation Checklist:**
- [ ] Mandelbox: standard 8-iteration algorithm
- [ ] Camera zoom: `ro *= mix(5.0, 0.1, act_norm)`
- [ ] Rotation: spin camera around origin as zoom
- [ ] Color: mix(count-based, position-based) for psychedelic effect
- [ ] Chromatic aberration: increase over act_norm
- [ ] Final fade: `alpha = 1.0 - smoothstep(0.9, 1.0, act_norm)` (last 10%)
- [ ] Scanlines: increase opacity as collapse happens
- [ ] Silence end: at u_act_norm = 1.0, render solid black for 1 frame

**Visual Goals:**
- Sense of chaos and energy (iterative detail)
- Zoom-into-abyss effect (immersive)
- Color explosion then fade (rise and fall)
- Clean ending (black, silent, complete)

**Performance Notes:**
- Mandelbox is 2–3x slower than raymarching
- 8 iterations mandatory (fewer = obvious fractals, more = 2 fps)
- Run at 60fps or accept 30fps in Act III if needed
- Early ray termination not applicable (dense fractal)

---

## Crosscutting Requirements

### Beat Synchronization
All scenes respond to timeline uniforms:
- Color shifts per `u_bar_cnt` (change every 4 beats)
- Brightness pulses on `u_beat` (downbeats brighter)
- Camera movements smooth but beat-aware (keyframe at bar boundaries)

### Palette Consistency
- **Act I:** Magenta → Cyan (awakening, cool progression)
- **Act II:** Yellow/Orange → Purple (energy, movement)
- **Act III:** Cyan → Black (collapse, transcendence)

### Timing Precision
- All act transitions must occur at exact beat boundaries
- No visual pops / stutters (use smoothstep blending)
- Audio + video sync verified in final pass (watch demo in-engine)

---

## Approval & Handoff

**Shader Specialist:** Assign each shader to a team member  
**Code Review:** `demo_director` + `build_specialist`  
**Testing:** Run full 8-minute demo, check:
- [ ] No visual artifacts (NaN, Z-fighting)
- [ ] 60fps on RTX 3090, > 30fps on RTX 3090 min
- [ ] Beat sync correct (watch audio + video together)
- [ ] Colors accurate vs brief
- [ ] Transitions smooth (no flashing)

**Final Commit:** Feature branch → main (tag as v1.0-demo-approved)

---

*Details matter. Quality is the sum of small decisions, each well-executed.*
