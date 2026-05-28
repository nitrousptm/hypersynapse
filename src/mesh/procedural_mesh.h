#pragma once
#include <cstdint>
#include <vector>
#include <glm/glm.hpp>

namespace hyp {

struct Vertex {
    glm::vec3 position;
    glm::vec3 normal;
    glm::vec2 uv;
};

struct MeshData {
    std::vector<Vertex>   vertices;
    std::vector<uint32_t> indices;
};

// Generates all geometry procedurally at runtime — no external files.
namespace ProceduralMesh {

// Scene 2: Single tall monolith (subdivided box, ready for vertex displacement in shader)
MeshData build_monolith(int subdivisions = 8);

// Scene 3: City block — N instanced buildings at random heights/widths
// Returns one merged VBO with all buildings; shader uses gl_InstanceID for per-building data.
// The instance transform data is uploaded separately via an SSBO.
MeshData build_city(int building_count = 800);

// Upload MeshData to GPU and return VAO/VBO/EBO handles.
// Caller owns the GL objects and must delete them.
void upload(const MeshData& mesh,
            uint32_t& out_vao, uint32_t& out_vbo, uint32_t& out_ebo);

}  // namespace ProceduralMesh
}  // namespace hyp
