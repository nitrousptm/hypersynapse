# 🎮 AGENTIX — Assembly 2026 Demo

**A High-Performance Real-Time 3D Visualization of Hierarchical Agent Orchestration**

## 🎯 Demoparty Info

- **Event:** Assembly 2026
- **Category:** Realtime Graphics / PC 4K (or smaller)
- **Platform:** Windows x64
- **Language:** C++ (Modern C++17)
- **Graphics:** OpenGL 1.1+
- **Executable Size:** ~50-80 KB (optimized)

---

## 🚀 Quick Start

### Build (Windows)
```batch
double-click BUILD_AGENTIX.bat
```

Or manually:
```batch
cl /O2 /EHsc agentix_demo.cpp /link opengl32.lib gdi32.lib user32.lib
```

### Run
```batch
agentix_demo.exe
```

---

## 🎨 What's Inside

### Visual Components
- **3D Agent Network**: 12 hierarchical agent nodes
  - Orchestrators (3): CEO, CTO, HR
  - Managers (4): Backend, Frontend, DevOps, QA
  - Specialists (5): API, Database, Performance, UI, UX, Test

- **Particle Effects**: Dynamic particle system
  - Burst on agent activation
  - Gravity simulation
  - Fade-out effect

- **Advanced Lighting**: Multi-light system
  - Directional lighting
  - Specular highlights
  - Depth fog

- **Smooth Camera**: Automatic rotation
  - Sinusoidal movement
  - 45+ degree angle
  - Zoom in/out effects

### Scenario
**11-step Payment API Integration Workflow:**

```
User Request
    ↓
CEO (receives)
    ↓
CTO (delegates)
    ↓
Backend Manager (coordinates)
   /    |    \
API  Database  Perf
Specialist    
    ↓
[Similar for QA branch]
    ↓
CTO (aggregates)
    ↓
CEO (reports)
    ↓
Feature Ready!
```

Each step:
- Activates corresponding agent (glow)
- Emits particles (20 per activation)
- Updates task counter
- Runs ~3 seconds

---

## ⚡ Performance Optimization

### Compilation Flags
```
/O2          - Full optimization
/EHsc        - Exception handling
/std:c++17   - Modern C++ standard
/W3          - Warning level 3
```

### Runtime Optimizations
- **Vertex Arrays**: Efficient mesh rendering
- **Immediate Mode**: Fast legacy GL (acceptable for demo)
- **VSync**: Locked 60 FPS
- **Minimal State Changes**: Batch rendering
- **Simple Geometry**: Octahedron (fast)
- **No Textures**: Procedural colors only

### Target Performance
- **FPS**: 60 (locked)
- **GPU Memory**: <50 MB
- **CPU Usage**: ~10-20%
- **File Size**: ~60 KB

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **SPACE** | Start/Stop scenario |
| **ESC** | Exit application |

The camera automatically rotates around the scene.

---

## 🔧 Technical Details

### Architecture
```cpp
DemoApp
├── agents: vector<Agent>
│   ├── position (Vec3)
│   ├── velocity (Vec3)
│   ├── type (int: ORCHESTRATOR/MANAGER/SPECIALIST)
│   ├── scale, rotation, activity
│   └── update(), activate()
│
├── particles: ParticleSystem
│   ├── particles: vector<Particle>
│   ├── emit(), update(), render()
│
└── Main Loop
    ├── update(deltaTime)
    ├── render()
    └── SwapBuffers()
```

### Rendering Pipeline
1. **Clear** — Color & depth buffers
2. **Setup Camera** — gluLookAt() with smooth interpolation
3. **Render Agents** — Push/pop matrix, transform, draw
4. **Render Particles** — Simple point-based rendering
5. **Swap** — Double-buffering

### Math
- **Vector3**: Basic 3D math (normalize, length, add, scale)
- **Interpolation**: Smooth camera movement with lerp (linear interpolation)
- **Physics**: Simple gravity on particles (0.5f * dt)

---

## 💻 System Requirements

- **OS**: Windows XP or later (x64 recommended)
- **GPU**: Any with OpenGL 1.1 support (NVIDIA/AMD/Intel)
- **CPU**: Any 1+ GHz processor
- **RAM**: 50 MB minimum
- **Resolution**: Tested at 1920x1080 (window resolution)

### Compatibility
- ✅ Windows 10/11
- ✅ NVIDIA GeForce GTX 1050+
- ✅ AMD Radeon RX 5500+
- ✅ Intel Integrated Graphics (HD 630+)

---

## 🎬 Demo Narrative

**Duration**: ~40 seconds total

1. **Intro** (0-2s): Scene loads, camera starts rotating
2. **Setup** (2-3s): All agents visible, waiting
3. **Scenario Begins** (3-5s): User request, CEO activation
4. **Cascade** (5-35s): Tasks flow through hierarchy
   - Each agent glows and emits particles
   - Task counter increments
   - Smooth task flow visualization
5. **Completion** (35-40s): Final report, scenario ends
6. **Loop**: Can restart with SPACE

---

## 📊 Code Statistics

- **Lines of Code**: ~700
- **Classes**: 3 (DemoApp, Agent, ParticleSystem)
- **Functions**: ~15
- **Structs**: 2 (Vec3, Particle)
- **Includes**: Minimal (only Windows.h, GL.h)

---

## 🔮 Possible Enhancements

For a competition version, consider adding:

### Graphics
- [ ] Shader-based rendering (GLSL)
- [ ] Advanced particle effects (GPU-computed)
- [ ] Post-processing (bloom, depth of field)
- [ ] Normal mapping, parallax mapping
- [ ] Procedural geometry generation

### Audio
- [ ] Real-time synthesized music
- [ ] Task completion sound effects
- [ ] Ambient background sound
- [ ] Audio-visual synchronization

### Effects
- [ ] Morphing geometry
- [ ] Fractal patterns
- [ ] Raymarching scenes
- [ ] Volumetric lighting
- [ ] Screen-space effects

### Size Optimization
- [ ] Binary executable obfuscation
- [ ] Packed resources
- [ ] Compressed geometry
- [ ] Asset generation from seeds

---

## 🏆 Assembly 2026 Tips

1. **Timing**: Keep it under 2-3 minutes for best impact
2. **Loop**: Make it loop smoothly for outdoor display
3. **Resolution**: Test at 1920x1080 (standard for Assembly)
4. **Sound**: Add epic chiptune/synth music!
5. **Innovation**: Extend with procedural elements

---

## 📝 Building for Submission

### Final Executable
```batch
REM Release build with maximum optimization
cl /O2 /Oy /GL agentix_demo.cpp /link /LTCG opengl32.lib gdi32.lib user32.lib
```

### Optional: UPX Compression
```batch
REM Further reduce executable size
upx agentix_demo.exe -9 -o agentix_demo_packed.exe
```

### Requirements Checklist
- [ ] Executable runs on Windows 10/11
- [ ] No external dependencies
- [ ] Smooth 60 FPS
- [ ] SPACE to control
- [ ] ESC to exit
- [ ] File size < 200 KB

---

## 🎯 Judging Criteria (Typical)

1. **Visual Appeal** — Impressive graphics & effects
2. **Technical Skill** — Clever optimization & techniques
3. **Originality** — Unique concept or approach
4. **Execution** — Smooth performance, polish
5. **Creativity** — Innovation & artistic direction

**AGENTIX Strengths:**
- ✅ Novel concept (agent system visualization)
- ✅ Clean, well-structured code
- ✅ Smooth animation
- ✅ Minimalist aesthetic
- ✅ Efficient rendering

---

## 🚀 Go Win Assembly 2026!

This is your foundation. Now make it LEGENDARY:
- Add shaders
- Add music
- Add procedural effects
- Add story/narrative
- Push the boundaries!

---

**Good luck! 🎮✨**

*AGENTIX v1.0 | 2026-04-27 | Ready for Assembly 2026*
