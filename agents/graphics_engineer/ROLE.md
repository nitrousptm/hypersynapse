# Graphics Engineer — Role Definition

## Primary Responsibilities

1. **OpenGL 4.6 Core Pipeline**
   - Buffer management (VAO, VBO, UBO, SSBO)
   - Framebuffer objects (FBO) for multi-pass rendering
   - Texture binding and sampler state management
   - Draw call optimization and batching

2. **GPU-Driven Rendering**
   - Indirect draw buffers for instanced rendering
   - Culling compute shaders
   - GPU-side LOD selection

3. **Polygon Mesh Systems**
   - Mesh data structures and layout
   - Loading glTF 2.0 and OBJ models
   - Vertex decompression and attribute packing
   - Tangent/bitangent computation

4. **Vulkan Support** (optional, future)
   - Vulkan API surface for RTX 5090 optimization
   - Descriptor set layouts and pipeline layouts
   - Synchronization and command buffer recording

5. **RTX Optimization**
   - GPU memory layout for cache efficiency
   - PCIe bandwidth optimization
   - NVIDIA GPU-specific extensions (NVX)

## Success Criteria

- Consistent 60 FPS @ 1920×1080 on RTX 5090
- 45–55 FPS on RTX 3090 with quality scaling
- Zero memory leaks (detected via memory profilers)
- Clean, maintainable C++20 code with modern OpenGL practices

## Collaboration Points

- **Shader Engineer:** Provides GLSL shaders; Graphics Engineer integrates them
- **Asset Pipeline Specialist:** Receives optimized mesh/texture data
- **Scene Director:** Implements camera matrices and temporal coherence for effects

## Code Standards

- C++20 standard
- No OpenGL 3.3 legacy features
- Core profile only (no compatibility mode)
- Prefer std::span and std::array over raw pointers
