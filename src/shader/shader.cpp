#include "shader/shader.h"

#include <cstdio>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#include <glad/gl.h>

namespace hyp::shader {

namespace {

std::string read_file(std::string_view path) {
    std::ifstream f{std::string(path)};
    if (!f) {
        std::fprintf(stderr, "[shader] cannot open %.*s\n",
                     static_cast<int>(path.size()), path.data());
        return {};
    }
    std::stringstream ss;
    ss << f.rdbuf();
    return ss.str();
}

std::string preprocess(std::string_view source, std::string_view base_dir) {
    std::stringstream out;
    std::string source_str(source);   // named variable avoids most-vexing-parse
    std::istringstream in(source_str);
    std::string line;

    while (std::getline(in, line)) {
        // Check for #include "path"
        if (line.find("#include") == 0) {
            size_t start = line.find('"');
            size_t end = line.rfind('"');
            if (start != std::string::npos && end != std::string::npos && start < end) {
                std::string inc_path = line.substr(start + 1, end - start - 1);
                // Resolve relative to base_dir
                std::string full_path = std::string(base_dir) + "/" + inc_path;
                std::string inc_src = read_file(full_path);
                if (!inc_src.empty()) {
                    out << "// #include \"" << inc_path << "\"\n";
                    out << inc_src << "\n";
                } else {
                    std::fprintf(stderr, "[shader] failed to include %s\n", full_path.c_str());
                    out << line << "\n";
                }
            } else {
                out << line << "\n";
            }
        } else {
            out << line << "\n";
        }
    }
    return out.str();
}

uint32_t compile(GLenum stage, std::string_view source, std::string_view tag) {
    const std::string src(source);
    const char* c_src = src.c_str();
    uint32_t sh = glCreateShader(stage);
    glShaderSource(sh, 1, &c_src, nullptr);
    glCompileShader(sh);

    int ok = 0;
    glGetShaderiv(sh, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        int len = 0;
        glGetShaderiv(sh, GL_INFO_LOG_LENGTH, &len);
        std::vector<char> log(static_cast<size_t>(len));
        glGetShaderInfoLog(sh, len, nullptr, log.data());
        std::fprintf(stderr, "[shader] compile %.*s failed:\n%s\n",
                     static_cast<int>(tag.size()), tag.data(), log.data());
        glDeleteShader(sh);
        return 0;
    }
    return sh;
}

uint32_t link(std::initializer_list<uint32_t> stages, std::string_view tag) {
    uint32_t prog = glCreateProgram();
    for (uint32_t s : stages) glAttachShader(prog, s);
    glLinkProgram(prog);
    for (uint32_t s : stages) {
        glDetachShader(prog, s);
        glDeleteShader(s);
    }

    int ok = 0;
    glGetProgramiv(prog, GL_LINK_STATUS, &ok);
    if (!ok) {
        int len = 0;
        glGetProgramiv(prog, GL_INFO_LOG_LENGTH, &len);
        std::vector<char> log(static_cast<size_t>(len));
        glGetProgramInfoLog(prog, len, nullptr, log.data());
        std::fprintf(stderr, "[shader] link %.*s failed:\n%s\n",
                     static_cast<int>(tag.size()), tag.data(), log.data());
        glDeleteProgram(prog);
        return 0;
    }
    return prog;
}

}  // namespace

uint32_t load_program(std::string_view vert_path, std::string_view frag_path) {
    auto vsrc = read_file(vert_path);
    auto fsrc = read_file(frag_path);
    if (vsrc.empty() || fsrc.empty()) return 0;

    // Preprocess (resolve #include directives)
    auto base_dir = std::string(frag_path).substr(0, std::string(frag_path).rfind("/"));
    vsrc = preprocess(vsrc, base_dir);
    fsrc = preprocess(fsrc, base_dir);

    uint32_t v = compile(GL_VERTEX_SHADER, vsrc, vert_path);
    if (!v) return 0;
    uint32_t f = compile(GL_FRAGMENT_SHADER, fsrc, frag_path);
    if (!f) { glDeleteShader(v); return 0; }
    return link({v, f}, frag_path);
}

uint32_t load_program_from_src(std::string_view vert_src, std::string_view frag_src) {
    uint32_t v = compile(GL_VERTEX_SHADER, vert_src, "vert_inline");
    if (!v) return 0;
    uint32_t f = compile(GL_FRAGMENT_SHADER, frag_src, "frag_inline");
    if (!f) { glDeleteShader(v); return 0; }
    return link({v, f}, "inline_program");
}

uint32_t load_compute(std::string_view comp_path) {
    auto src = read_file(comp_path);
    if (src.empty()) return 0;

    // Preprocess (resolve #include directives)
    auto base_dir = std::string(comp_path).substr(0, std::string(comp_path).rfind("/"));
    src = preprocess(src, base_dir);

    uint32_t c = compile(GL_COMPUTE_SHADER, src, comp_path);
    if (!c) return 0;
    return link({c}, comp_path);
}

}  // namespace hyp::shader
