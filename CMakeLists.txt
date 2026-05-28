cmake_minimum_required(VERSION 3.24)
project(hypersynapse LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

if(MSVC)
    add_compile_options(/W4 /permissive- /Zc:__cplusplus)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Wno-unused-parameter)
endif()

include(FetchContent)
set(FETCHCONTENT_QUIET OFF)

# --- GLFW -----------------------------------------------------------------
set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

# Platform-specific GLFW backends
if(UNIX AND NOT APPLE)
    # Linux: X11 backend (Wayland optional)
    set(GLFW_BUILD_WAYLAND OFF CACHE BOOL "" FORCE)
    set(GLFW_BUILD_X11 ON CACHE BOOL "" FORCE)
elseif(WIN32)
    # Windows: native Win32 backend (auto, no options needed)
elseif(APPLE)
    # macOS: native Cocoa backend (auto)
endif()
FetchContent_Declare(glfw
    GIT_REPOSITORY https://github.com/glfw/glfw.git
    GIT_TAG        3.4
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(glfw)

# --- glm ------------------------------------------------------------------
FetchContent_Declare(glm
    GIT_REPOSITORY https://github.com/g-truc/glm.git
    GIT_TAG        1.0.1
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(glm)

# --- GLAD (OpenGL 4.6 Core loader, generated) -----------------------------
FetchContent_Declare(glad
    GIT_REPOSITORY https://github.com/Dav1dde/glad.git
    GIT_TAG        v2.0.6
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(glad)
add_subdirectory("${glad_SOURCE_DIR}/cmake" glad_cmake EXCLUDE_FROM_ALL)
glad_add_library(glad_gl_core_46 STATIC API gl:core=4.6)

# --- miniaudio (single-header, fetched as INTERFACE) ---------------------
FetchContent_Declare(miniaudio
    GIT_REPOSITORY https://github.com/mackron/miniaudio.git
    GIT_TAG        0.11.21
    GIT_SHALLOW    TRUE)
FetchContent_MakeAvailable(miniaudio)
add_library(miniaudio INTERFACE)
target_include_directories(miniaudio INTERFACE "${miniaudio_SOURCE_DIR}")

# --- hypersynapse executable ---------------------------------------------
add_executable(hypersynapse
    src/main.cpp
    src/renderer/renderer.cpp
    src/shader/shader.cpp
    src/timeline/timeline.cpp
    src/audio/audio.cpp
    src/particles/particles.cpp
    src/capture/capture.cpp
    src/debug/stats.cpp
    src/mesh/procedural_mesh.cpp
)

target_include_directories(hypersynapse PRIVATE src)
target_link_libraries(hypersynapse PRIVATE glfw glm::glm glad_gl_core_46 miniaudio)

target_compile_definitions(hypersynapse PRIVATE
    HYP_SHADER_DIR="${CMAKE_SOURCE_DIR}/shaders"
    HYP_ASSET_DIR="${CMAKE_SOURCE_DIR}/assets"
    GLFW_INCLUDE_NONE
    $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>)

if(UNIX AND NOT APPLE)
    target_link_libraries(hypersynapse PRIVATE dl pthread)
endif()
