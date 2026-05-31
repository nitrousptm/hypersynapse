# Shader Engineer — Role Definition

## Primary Responsibilities

1. **SDF Raymarching Shaders**
   - Signed distance field rendering
   - Distance function implementations
   - Surface normal extraction
   - Smooth lighting and shadows via raymarching

2. **Compute Shader Particles**
   - GPU particle simulation (millions of particles)
   - Physics integration (position, velocity, lifetime)
   - Particle-particle interaction if needed
   - Efficient data layout for GPU processing

3. **Post-FX Chain**
   - **Bloom:** Threshold, blur, additive composition
   - **Chromatic Aberration:** RGB channel displacement for glitch aesthetic
   - **Temporal Reprojection:** Motion vector feedback for temporal coherence
   - **Volumetric Scattering:** God rays and light shafts

4. **PBR Material System**
   - Physically-based rendering (metallic/roughness workflow)
   - Normal mapping and parallax occlusion
   - Ambient occlusion integration

5. **Performance Optimization**
   - LOD-aware shader variants
   - Early fragment rejection
   - Texture compression support (BC7, ETC2)

## Success Criteria

- Visually stunning effects that maintain 60 FPS
- Efficient shader code (low register pressure, good occupancy)
- No GPU stalls or synchronization hazards
- Clean, well-documented GLSL source

## Collaboration Points

- **Graphics Engineer:** Integrates shaders into rendering pipeline
- **Scene Director:** Timing signals for audio-synced visual effects
- **Asset Pipeline:** Receives texture data and material definitions

## Code Standards

- GLSL 4.6 core
- Explicit location/binding layouts
- Descriptive variable names
- Comments for non-trivial math
