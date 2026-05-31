# Asset Pipeline Specialist — Role Definition

## Primary Responsibilities

1. **3D Model Import**
   - glTF 2.0 format loading and validation
   - OBJ/FBX format support (if needed)
   - Mesh data extraction and validation
   - Skeletal animation handling (if applicable)

2. **Texture Management**
   - PNG/EXR texture loading
   - Texture compression (BC7 for LDR, ETC2 for transparency)
   - Mipmap generation
   - Normal map tangent space validation

3. **Asset Optimization**
   - Mesh simplification and LOD generation
   - Vertex attribute packing and decompression
   - Tangent/bitangent computation for normal mapping
   - Memory-efficient data structures

4. **Build Integration**
   - Asset preprocessing (pre-compute what can be precomputed)
   - Binary asset format design and serialization
   - Asset loading pipeline integration
   - Runtime asset management (streaming, caching)

5. **Quality Assurance**
   - Validate imported assets for correctness
   - Check for unused materials/textures
   - Ensure compatibility with rendering pipeline

## Success Criteria

- All assets load correctly in OpenGL 4.6 pipeline
- Minimal asset load time
- Efficient VRAM usage (compressed textures, LODs)
- Clean asset metadata and material bindings

## Collaboration Points

- **Graphics Engineer:** Receives optimized mesh/texture data for rendering
- **Shader Engineer:** Provides material definitions for shaders
- **Scene Director:** Asset list for scene composition

## Code Standards

- C++20 for tooling
- Clear, self-documenting asset formats
- Error handling for missing/invalid assets
