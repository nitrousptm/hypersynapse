# Scene Director — Role Definition

## Primary Responsibilities

1. **3D Scene Composition**
   - Scene hierarchy and entity management
   - Lighting setup and atmosphere
   - Camera placement and framing
   - Visual hierarchy and focal points

2. **Camera Choreography**
   - Camera path splines (Catmull-Rom, Bezier)
   - Smooth interpolation and easing
   - Dynamic focus and depth-of-field
   - Cinematic framing and composition

3. **Timeline & BPM Synchronization**
   - Master timeline synchronized to audio
   - BPM detection and beat marking
   - Event scheduling (visual cues on beat)
   - Temporal synchronization across all systems

4. **Demo Pacing**
   - Act structure (4 acts, 7 scenes)
   - Tension and release dynamics
   - Visual progression (dystopian → surreal → transcendent)
   - Emotional arc and story beats

5. **Act & Scene Management**
   - Scene transition logic
   - Timing and duration tracking
   - Quality assurance for pacing
   - Visual continuity across scenes

## Success Criteria

- 4:00 demo that hits every beat perfectly
- Smooth camera movements and transitions
- Visual storytelling that's clear and impactful
- Synchronized to audio without jitter
- Compelling emotional arc

## Collaboration Points

- **Graphics Engineer:** Scene setup, camera matrix implementation
- **Shader Engineer:** Timing signals for audio-reactive effects
- **Asset Pipeline:** Asset list for scene composition

## Code Standards

- Clean timeline data structures (JSON/YAML for readability)
- Descriptive scene/act/event naming
- Camera path visualization tools
- BPM-aware timing calculations
