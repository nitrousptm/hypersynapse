---
name: SINGULARITY GARDEN — Projektstatus
description: PC Demo für Assembly Summer 2026 — aktueller Build-Status, bekannte Fixes, Architektur
type: project
---

PC Demo für Assembly Summer 2026 Helsinki. Kategorie: PC Demo (unlimited), 4:00min.
Projekt-Pfad auf Windows: `C:\projects\singularity-garden\`

**Music:** Concrete-Syncope.wav @ 133 BPM — liegt in `assets/music/`
**Engine:** OpenGL 4.6 Core, C++20, GLFW + glad2 + GLM + miniaudio
**Build-System:** CMake 4.2, Visual Studio 18 2026 (MSVC 19.51)

**Build-Befehl (Windows):**
```powershell
.\build_windows.ps1
```
EXE liegt unter: `build\windows_release\Release\singularity_garden.exe`

**Bereits behobene Build-Fehler:**
1. PowerShell Backtick-Problem → Array-Splatting verwendet
2. VS-Generator: War "17 2022" → korrekt ist **"Visual Studio 18 2026"**
3. `Mesh` fehlte Move-Konstruktor + Move-Assignment → hinzugefügt in mesh.h
4. **Fullscreen Triangle Bug:** Shader erzeugte nur halbes Bild (unten-links Dreieck) → Fix: oversized triangle Formel `x = (id & 1)*4-1, y = ((id>>1)&1)*4-1` in fullscreen.vert

**Demo läuft bereits** (Bild füllt gesamten Screen seit Fullscreen-Fix).

**8 Szenen mit BPM-Timing (133 BPM):**
1. BOOT 0:00-0:20 — CRT-Startup, Hex-Grid materialisiert
2. AWAKENING 0:20-0:45 — SDF Monolith Raymarching, PBR, God Rays
3. CITY 0:45-1:15 — GPU Instancing Brutalist-City, Geometry-Corruption
4. FRACTURE 1:15-1:45 — Temporal Feedback, Julia Sets, Kaleidoskop
5. BLOOM 1:45-2:30 — SDF Blumen + Fraktal-Tempel, Volumetric Scattering
6. IMPOSSIBLE 2:30-3:00 — Mandelbulb Raymarching, Holy-Shit-Zoom-Out
7. SINGULARITY 3:00-3:50 — 2 Mio Partikel Compute Shader (Galaxy → Collapse)
8. FINAL 3:50-4:00 — Logo-Reveal, Light Impulse, Fade-to-Black

**Architektur:**
- `src/core/` — Shader (#include preprocessing), Framebuffer, Mesh, Camera
- `src/audio/` — miniaudio WAV + BPM-Sync Callbacks
- `src/scene/` — Timeline, Scene-Basisklasse
- `src/scenes/` — Scene01Boot … SceneFinal
- `src/postfx/` — 6-MIP Dual-Kawase Bloom, ACES Tonemap, Composite
- `shaders/common/` — noise.glsl, sdf.glsl (inkl. hexGrid), pbr.glsl, fullscreen.vert
- `shaders/scenes/` — je 1 Shader pro Szene (GLSL 4.60)
- `shaders/postfx/` — bloom chain, composite, temporal_aa
- `shaders/particles/` — particles_update.comp (2M Partikel)

**Why:** Agentix Submission Assembly 2026 — erste offizielle Demo-Veröffentlichung
**How to apply:** Bei Code-Änderungen immer BPM-Timing + Shader-Include-Struktur beachten; Shader werden zur Laufzeit geladen (kein Neucompilieren für Shader-Fixes nötig)
