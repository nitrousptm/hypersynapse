# PoC #2: Assembly Graphics Demo (Demoscene Project)

**Szenario:** Udo says to CEO: "We should build a graphics demo for Assembly 2026!"

---

## 🎨 What is This?

**Assembly** = Annual demoscene festival in Finland where programmers/artists submit real-time 3D audiovisual demos.

**Our Demo:** "Cosmic Journey" — 3D space scene with animated particles, procedural terrain, music synchronization, shader effects.

**Why it's a good PoC:**
- ✅ Completely different from Todo-List
- ✅ Shows universality of roles (Graphics ≠ Web)
- ✅ Tests multiple new skill areas
- ✅ Cross-team coordination (Art + Code + Performance)
- ✅ Shows how Client Manager handles non-UI projects

---

## 📋 Phase 1: CEO Receives Brief from Udo

**Udo → CEO:**
```json
{
  "from": "udo",
  "to": "ceo",
  "type": "project_request",
  "date": "2026-04-24T06:43:00Z",
  
  "title": "Cosmic Journey Graphics Demo (Assembly 2026)",
  "description": "Create a 4-minute real-time 3D graphics demo for Assembly demoscene competition",
  
  "vision": "Immersive space journey with procedurally generated visuals, synchronized music, GPU-optimized rendering",
  
  "requirements": [
    "Real-time 3D rendering (60 FPS, 1920x1080)",
    "Procedural terrain & particle systems",
    "Music synchronization (beat-matched animations)",
    "Custom shader effects",
    "GPU-optimized performance",
    "Linux executable (Assembly requirement)",
    "Production-ready quality"
  ],
  
  "acceptance_criteria": [
    "Demo runs 4 minutes without stutters",
    "Visually impressive (competition-worthy)",
    "Smooth animation (60 FPS minimum)",
    "Music + visuals synchronized",
    "No crashes",
    "Executable submittable to Assembly"
  ],
  
  "deadline": "2026-05-15 (Assembly submission deadline)",
  "budget": "R&D time for new tech exploration"
}
```

---

## 🤖 Phase 2: CEO Orchestrates

CEO understands this needs:
1. **Graphics/System Level** → Systems Manager (Engine, Rendering, Audio)
2. **Artistic/Visual Direction** → Client Manager (Visual Design, VFX, Art Direction)
3. **Music Production** → External or dedicated specialist
4. **Product Vision** → Product Manager (Creative Direction)

**CEO → Systems Manager:**
```json
{
  "from": "ceo",
  "to": "systems_manager",
  "task_id": "task-poc-002-systems",
  "type": "task",
  "date": "2026-04-24T06:45:00Z",
  
  "title": "Cosmic Journey Graphics Engine",
  "description": "Build real-time 3D graphics engine for Assembly demo",
  
  "core_systems": [
    "3D Graphics Engine (OpenGL/Vulkan)",
    "Procedural Terrain Generator",
    "Particle System",
    "Audio System (music playback + sync)",
    "Shader System (custom GLSL shaders)",
    "Camera System (smooth motion curves)"
  ],
  
  "technical_requirements": [
    "Render 60 FPS @ 1920x1080",
    "Support procedural generation",
    "GPU-optimized (minimize CPU)",
    "Audio playback with frame-perfect sync",
    "Custom shader compilation",
    "Performance profiling & optimization"
  ],
  
  "acceptance_criteria": [
    "3D engine renders complex scene at 60 FPS",
    "Procedural terrain generates without stuttering",
    "Particle system handles 1M+ particles smoothly",
    "Audio sync: ±1ms tolerance",
    "Memory usage <500MB",
    "Buildable on Linux"
  ],
  
  "technical_skills_needed": [
    "C++/Rust (graphics engine)",
    "GLSL/Vulkan (shaders)",
    "Audio programming (sync)",
    "Performance optimization",
    "Procedural generation math"
  ],
  
  "dependencies": "Client Manager provides visual direction + animation specs",
  "deadline": "2026-05-10",
  
  "note": "This is NOT a web backend. It's a graphics engine. Skills are very different from Todo-List API."
}
```

**CEO → Client Manager:**
```json
{
  "from": "ceo",
  "to": "client_manager",
  "task_id": "task-poc-002-client",
  "type": "task",
  "date": "2026-04-24T06:45:00Z",
  
  "title": "Cosmic Journey Visual Direction & VFX",
  "description": "Design visual experience and VFX for graphics demo",
  
  "visual_components": [
    "Procedural space environment (planets, stars, nebulas)",
    "Particle effects (cosmic dust, energy waves)",
    "Color grading & post-processing",
    "Camera motion curves (cinematic feel)",
    "VFX timeline (when effects happen)",
    "Lighting & atmosphere"
  ],
  
  "creative_requirements": [
    "Visually stunning (competition-worthy)",
    "Coherent art direction",
    "Smooth transitions between scenes",
    "Synchronized to music (beats, drops, crescendos)",
    "Emotional impact (\"wow\" factor)"
  ],
  
  "acceptance_criteria": [
    "Visual design document (colors, style, mood)",
    "VFX timeline (minute-by-minute breakdown)",
    "Camera motion curves (smooth cinematography)",
    "Lighting design (atmosphere + mood)",
    "Particle effect specifications",
    "Post-processing effects list"
  ],
  
  "artistic_skills_needed": [
    "Visual design & art direction",
    "VFX design & animation timing",
    "Color theory & grading",
    "Cinematography (camera motion)",
    "Music synchronization concepts"
  ],
  
  "dependencies": "Music track needed early for sync timing. Systems Manager engine needed for implementation feedback.",
  "deadline": "2026-05-10",
  
  "note": "Client Manager for NON-UI work: This is about visual design, not web UI. Shows universality!"
}
```

**CEO → Product Manager:**
```json
{
  "from": "ceo",
  "to": "product_manager",
  "task_id": "task-poc-002-product",
  "type": "task",
  
  "title": "Cosmic Journey - Creative Direction",
  "description": "Define artistic vision and story for demo",
  
  "creative_brief": {
    "theme": "Space exploration & cosmic wonder",
    "story": "Journey through space, discovering worlds",
    "mood": "Awe, discovery, otherworldliness",
    "target_audience": "Demoscene community (technically sophisticated + artistically appreciated)"
  },
  
  "acceptance_criteria": [
    "Clear creative vision document",
    "Storyboard (scene breakdown)",
    "Mood board (visual references)",
    "Music direction (what type of track)",
    "Technical + artistic feasibility assessment"
  ],
  
  "dependencies": "Systems Manager + Client Manager validate technical feasibility",
  "deadline": "2026-04-28"
}
```

---

## 🏗️ Phase 3: Managers Decompose

### **Systems Manager Decomposition:**

**Subtask 1 → API Specialist (Graphics Engine Core)**

Wait! **API Specialist** for graphics demo? Let's rename them contextually:

Actually, in this case, the **API Specialist** handles "System APIs" which for a graphics demo means:
- Graphics API (OpenGL/Vulkan)
- Audio API (ALSA/PulseAudio)
- Platform APIs (Linux)

```json
{
  "task_id": "subtask-poc-002-graphics",
  "assigned_to": "api_specialist",
  "title": "Graphics Engine Implementation (3D Rendering Pipeline)",
  
  "description": "Build core graphics engine using Vulkan/OpenGL",
  
  "technical_specs": {
    "graphics_api": "Vulkan (preferred) or OpenGL 4.5+",
    "target_resolution": "1920x1080 @ 60 FPS",
    "rendering_pipeline": "Deferred rendering for particle support",
    "shader_system": "GLSL compilation + hot-reload"
  },
  
  "core_systems": [
    "Vertex/Fragment/Geometry shaders",
    "Framebuffer & texture management",
    "Mesh rendering (models + procedural)",
    "Lighting pipeline",
    "Post-processing effects (bloom, chromatic aberration)",
    "Camera system (smooth curves + interpolation)"
  ],
  
  "acceptance_criteria": [
    "Renders triangle mesh at 60 FPS",
    "Shader compilation working",
    "Texture loading + binding",
    "Basic lighting (Phong/PBR)",
    "Post-processing FX pipeline",
    "Linux build working"
  ],
  
  "code_example": "C++ with Vulkan/OpenGL, ~3000-5000 lines of engine code",
  
  "notes": "Coordinate with Database Specialist on terrain data format. Coordinate with Performance Specialist on GPU profiling."
}
```

**Subtask 2 → Database Specialist (Procedural Terrain + Asset Data)**

For a graphics demo, "Database" means:
- Procedural terrain generation algorithms
- Particle system data structures
- Asset management (models, textures, materials)

```json
{
  "task_id": "subtask-poc-002-terrain",
  "assigned_to": "database_specialist",
  "title": "Procedural Terrain Generation & Asset Management",
  
  "description": "Design procedural algorithms for terrain, particles, asset formats",
  
  "systems": [
    {
      "name": "Terrain Generator",
      "algorithm": "Perlin noise + fractional Brownian motion",
      "output": "Height map for terrain mesh",
      "parameters": "Scale, octaves, persistence, lacunarity"
    },
    {
      "name": "Particle System",
      "data_structure": "GPU-driven particle pool (VBO + compute shaders)",
      "capacity": "1M+ particles",
      "attributes": "Position, velocity, lifetime, color, size"
    },
    {
      "name": "Asset Pipeline",
      "formats": "OBJ/glTF for models, PNG/EXR for textures",
      "optimization": "Mesh baking, texture atlasing, LOD"
    }
  ],
  
  "acceptance_criteria": [
    "Terrain generation algorithm produces believable landscapes",
    "Particle pool efficiently manages 1M particles",
    "Asset loading <100ms for demo startup",
    "Memory footprint optimized"
  ],
  
  "notes": "Coordinate with API Specialist on GPU data formats. Coordinate with Performance Specialist on memory optimization."
}
```

**Subtask 3 → Performance Specialist (GPU Profiling & Optimization)**

```json
{
  "task_id": "subtask-poc-002-perf",
  "assigned_to": "performance_specialist",
  "title": "GPU Optimization & Performance Profiling",
  
  "description": "Ensure demo runs smoothly on target hardware (60 FPS, <500MB RAM)",
  
  "performance_targets": [
    "Target FPS: 60 (min 50, no drops)",
    "Memory: <500MB (GPU + CPU combined)",
    "CPU frame time: <5ms (leaving room for GPU)",
    "GPU frame time: <16ms (1000/60)"
  ],
  
  "optimization_techniques": [
    "GPU profiling (NSight, RenderDoc)",
    "Shader optimization (reduce passes)",
    "Memory optimization (texture compression, pooling)",
    "LOD (level of detail) systems",
    "Frustum culling (don't render offscreen)",
    "Batch optimization (reduce draw calls)"
  ],
  
  "acceptance_criteria": [
    "Steady 60 FPS throughout demo",
    "No frame stutters or drops",
    "GPU utilization 70-85% (healthy)",
    "Memory usage <500MB",
    "Performance profiling report"
  ],
  
  "notes": "Start after API Specialist + Database Specialist have working systems."
}
```

### **Client Manager Decomposition:**

**Subtask 1 → UX Specialist (VFX Timeline & Cinematography)**

"UX" for graphics demo = "User Experience" = "Visual Experience"

```json
{
  "task_id": "subtask-poc-002-vfx",
  "assigned_to": "ux_specialist",
  "title": "VFX Timeline & Cinematography Design",
  
  "description": "Design when effects happen and camera motion",
  
  "timeline": {
    "0:00-0:30": "Intro: Space void, stars appearing, camera zoom",
    "0:30-1:30": "Terrain fly-by: Procedural planets, particle dust clouds",
    "1:30-2:30": "Energy burst: Particles explode, color shift, music crescendo",
    "2:30-3:30": "Calm: Camera glides through nebula, soft particles",
    "3:30-4:00": "Finale: All effects combine, logo appears, fade to black"
  },
  
  "cinematography": [
    {
      "segment": "0:00-0:30",
      "camera_motion": "Smooth zoom from far distance to planet",
      "curve": "Ease-in-out cubic"
    },
    {
      "segment": "0:30-1:30",
      "camera_motion": "Orbital motion around terrain",
      "curve": "Linear rotation + height variation"
    },
    // ... more segments
  ],
  
  "vfx_specifications": [
    {
      "name": "Particle Dust",
      "trigger": "0:00-4:00 (continuous)",
      "count": "100k particles",
      "color": "Blue/cyan with alpha fade"
    },
    {
      "name": "Energy Burst",
      "trigger": "1:30-2:00",
      "count": "500k particles",
      "effect": "Radial explosion, yellow to orange"
    }
  ],
  
  "acceptance_criteria": [
    "Timeline document with frame-accurate timing",
    "Camera motion curves (smooth, cinematic)",
    "VFX triggers aligned with music",
    "Mood consistency throughout"
  ],
  
  "notes": "Must coordinate with music track for timing. Must coordinate with Systems Manager on technical feasibility."
}
```

**Subtask 2 → UI Specialist (Visual Design & Color Grading)**

"UI" for graphics demo = Visual Design & Art Direction

```json
{
  "task_id": "subtask-poc-002-visual",
  "assigned_to": "ui_specialist",
  "title": "Visual Design & Color Grading",
  
  "description": "Define color palette, lighting, mood, post-processing",
  
  "visual_direction": {
    "color_palette": [
      "#0a0e27 (deep blue night)",
      "#1a3a52 (navy)",
      "#00d9ff (cyan accent)",
      "#ff6b9d (pink accent)",
      "#ffd700 (gold)"
    ],
    "lighting_design": "Volumetric lighting, god rays, lens flare",
    "atmosphere": "Ethereal, otherworldly, awe-inspiring"
  },
  
  "post_processing_effects": [
    {
      "effect": "Bloom",
      "parameters": "Threshold: 0.8, Intensity: 1.5"
    },
    {
      "effect": "Chromatic Aberration",
      "parameters": "Amount: 0.02, Intensity: on music beats"
    },
    {
      "effect": "Vignette",
      "parameters": "Darkness: 0.3, Softness: 0.5"
    },
    {
      "effect": "Color Grading",
      "parameters": "LUT file for cinematic look"
    }
  ],
  
  "shader_effects": [
    {
      "name": "Space Distortion",
      "description": "Warping effect during energy burst"
    },
    {
      "name": "Nebula Glow",
      "description": "Self-illuminated particles with halo"
    }
  ],
  
  "acceptance_criteria": [
    "Visual design document with mood board",
    "Color palette finalized",
    "Post-processing effects defined",
    "Shader effect specifications",
    "LUT file for color grading"
  ],
  
  "notes": "Coordinate with UX Specialist on VFX timing. Provide specs to API Specialist for implementation."
}
```

**Subtask 3 → Accessibility Specialist (Sound Design?)**

Hmm, "Accessibility" for graphics demo is tricky. Let's interpret it as:
- Visual clarity (not too bright/dark)
- Readability of any text
- Audio clarity (for music sync)
- Seizure safety (no flashing)

```json
{
  "task_id": "subtask-poc-002-accessibility",
  "assigned_to": "accessibility_specialist",
  "title": "Accessibility & Technical Validation",
  
  "description": "Ensure demo is safe, clear, and technically compliant",
  
  "visual_accessibility": [
    "No photosensitive seizure triggers (no flashing >3Hz)",
    "Text readable (if any appears)",
    "Color contrast adequate (if needed)",
    "No motion sickness inducing camera movements"
  ],
  
  "technical_validation": [
    "Runs on Linux (Assembly requirement)",
    "No crashes or segfaults",
    "Clean exit after 4 minutes",
    "Appropriate file size (<100MB)"
  ],
  
  "audio_clarity": [
    "Music plays cleanly without glitches",
    "Audio sync is stable (±1ms)",
    "No audio dropouts"
  ],
  
  "acceptance_criteria": [
    "No photosensitive triggers detected",
    "Text (if any) readable",
    "Passes technical validation",
    "Audio quality tested"
  ],
  
  "notes": "Test on various hardware. Check Assembly submission requirements."
}
```

---

## 🎵 Phase 4: Coordination

### **Day 1 (2026-04-24) - Kickoff**

**10:00 UTC - Product Manager Brief:**
```json
{
  "from": "product_manager",
  "to": ["systems_manager", "client_manager"],
  "type": "creative_brief",
  
  "message": "Here's the creative direction for 'Cosmic Journey'",
  
  "vision": {
    "theme": "Space exploration & wonder",
    "mood": "Awe-inspiring, otherworldly",
    "technical_feasibility": "Confirmed doable with procedural generation + GPU optimization"
  },
  
  "storyboard": [
    "Scene 1 (0:00-0:30): Void → Stars appear → Camera zooms to planet",
    "Scene 2 (0:30-1:30): Fly through terrain landscape",
    "Scene 3 (1:30-2:30): Energy explosion sequence",
    "Scene 4 (2:30-3:30): Calm cosmic drift",
    "Scene 5 (3:30-4:00): Finale with all effects"
  ]
}
```

**10:30 UTC - Systems Manager Standup:**
```json
{
  "api_specialist": "Ready to start graphics engine. Need UX/UI specs for camera + effects.",
  "database_specialist": "Starting procedural terrain algorithm design",
  "performance_specialist": "Will profile once engine is working"
}
```

**10:30 UTC - Client Manager Standup:**
```json
{
  "ux_specialist": "Designing VFX timeline + camera motion. Need music track ASAP for sync timing.",
  "ui_specialist": "Starting visual design + color palette. Will provide specs to API Specialist",
  "accessibility_specialist": "Will validate demo later after implementation"
}
```

**Constraint: MUSIC TRACK**
```
Systems Manager → Everyone: "We need a 4-minute music track for sync and timing. Who produces it?"
Options:
  a) External composer
  b) Product Manager creates brief
  c) Use existing track as placeholder
```

### **Days 2-5 (Parallel Development)**

**Systems Manager Track:**
```
Day 2-3: Graphics engine core + shaders working
Day 4: Terrain + particle system integrated
Day 5: Performance optimization + profiling
```

**Client Manager Track:**
```
Day 2-3: Visual design document + VFX specs ready
Day 4: Color grading + post-processing LUTs
Day 5: Cinematography motion curves finalized
```

### **Day 6 (Integration)**

**Systems Manager → Client Manager:**
```json
{
  "from": "systems_manager",
  "message": "Graphics engine ready. Which effects do you need implemented?"
}
```

**Client Manager → Systems Manager:**
```json
{
  "from": "client_manager",
  "message": "Here are the VFX specs + visual design. Can you implement these effects?"
}
```

**Integration Point: Music Sync**
```
Demo Flow:
1. Music starts playing (0:00)
2. Systems Manager audio system plays track
3. Graphics engine reads audio samples for beat detection
4. Camera motion + particle effects triggered on beats
5. All synchronized to ±1ms tolerance
```

### **Day 7-8 (Polish & Testing)**

**QA Manager Tests:**
```
- Runs 60 FPS for entire 4 minutes ✓
- No crashes or glitches ✓
- Audio sync accurate ✓
- Visually impressive ✓
- Builds + runs on Linux ✓
```

**Accessibility Specialist Validates:**
```
- No photosensitive triggers ✓
- Technical requirements met ✓
- Assembly submission format ✓
```

---

## 📊 Phase 5: Completion Reports

**Systems Manager Report:**
```json
{
  "from": "systems_manager",
  "to": "ceo",
  "type": "completion_report",
  
  "status": "completed",
  "delivered": [
    "Vulkan graphics engine (3000 LOC C++)",
    "Procedural terrain generator (Perlin noise)",
    "GPU-driven particle system (1M+ particles)",
    "Audio system with frame-perfect sync",
    "Custom shader effects (bloom, chromatic aberration)",
    "Performance: 60 FPS @ 1920x1080"
  ],
  
  "technical_metrics": {
    "memory_usage": "420MB",
    "gpu_utilization": "78%",
    "frame_time": "14.2ms (60 FPS)",
    "draw_calls": "12"
  }
}
```

**Client Manager Report:**
```json
{
  "from": "client_manager",
  "to": "ceo",
  "type": "completion_report",
  
  "status": "completed",
  "delivered": [
    "Visual design + color palette",
    "VFX timeline (frame-accurate)",
    "Cinematography motion curves",
    "Post-processing effects",
    "4-minute synchronized visual experience"
  ],
  
  "quality_metrics": {
    "visual_coherence": "High",
    "emotional_impact": "Awe-inspiring",
    "technical_feasibility": "Achieved",
    "competition_worthiness": "Strong"
  }
}
```

**CEO Report to Udo:**
```json
{
  "from": "ceo",
  "to": "udo",
  "type": "project_completion",
  
  "status": "completed",
  "summary": "Cosmic Journey graphics demo ready for Assembly 2026 submission",
  
  "deliverable": {
    "demo_executable": "cosmic_journey (Linux x64, 85MB)",
    "runtime": "4 minutes",
    "quality": "Competition-ready",
    "submission_status": "Ready for Assembly 2026"
  },
  
  "highlights": {
    "technical": "Vulkan engine, procedural generation, GPU optimization",
    "artistic": "Visually stunning, music-synchronized, awe-inspiring",
    "performance": "60 FPS @ 1920x1080, <500MB RAM"
  }
}
```

---

## 🎯 Key Learnings: Why This PoC Matters

### **Universality Validated:**

| Aspect | Todo-List | Graphics Demo |
|--------|-----------|---------------|
| Systems Manager scope | REST API | Graphics Engine |
| Client Manager scope | React UI | Visual Design + VFX |
| Specialist types | API, DB, Perf | Graphics, Terrain, Perf |
| Coordination | API Contract | VFX Timeline + Music Sync |
| Integration point | API → Frontend | Graphics + Audio |

**Key Insight:** The roles adapt to ANY software project:
- Systems Manager = Backend + Core Systems (APIs, Engines, Services)
- Client Manager = Frontend + User Experience (UIs, Visuals, VFX)

### **New Domains Discovered:**

1. **Graphics Engine = API** (graphics API, not HTTP API)
2. **Procedural Gen = Database** (data structures, algorithms)
3. **Music Sync = Cross-domain** (coordination point)
4. **VFX Design = UX** (user experience, timing, cinematography)

### **Coordination Patterns Hold:**

✅ Manager → Manager sync (Systems ↔ Client)  
✅ Dependency tracking (spec → implementation)  
✅ Parallel development (no blocking)  
✅ Integration testing (all systems together)  
✅ Quality gates (performance, visuals, technical)

---

## 🚀 Next Steps

1. **Run actual PoC** (if we build a real demo, that's months of work — skip for now)
2. **Document learnings** in agent system
3. **Test 3rd scenario:** Something even more different (e.g., Data Pipeline? Mobile App? Firmware?)
4. **Finalize role docs** based on all 3 PoCs

**This confirms:** Systems Manager + Client Manager are truly universal! 🎉
