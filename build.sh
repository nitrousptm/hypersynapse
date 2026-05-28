#!/bin/bash
# HYPERSYNAPSE Build Script for Linux/macOS
# Usage: ./build.sh [--clean] [--run] [--capture <audio_file>]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

CLEAN=0
RUN=0
CAPTURE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=1
            shift
            ;;
        --run)
            RUN=1
            shift
            ;;
        --capture)
            CAPTURE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}=== HYPERSYNAPSE Linux/macOS Build ===${NC}"

# Clean if requested
if [ $CLEAN -eq 1 ]; then
    echo -e "${YELLOW}Cleaning build directory...${NC}"
    rm -rf build
fi

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    GENERATOR="Ninja"
    CXX_COMPILER=""
else
    GENERATOR="Ninja"
    CXX_COMPILER="-DCMAKE_CXX_COMPILER=g++-11"
fi

# Configure CMake
if [ ! -d build ]; then
    echo -e "${YELLOW}Configuring CMake...${NC}"
    cmake -S . -B build \
        -G "$GENERATOR" \
        -DCMAKE_BUILD_TYPE=Release \
        $CXX_COMPILER
fi

# Build
echo -e "${YELLOW}Building Release configuration...${NC}"
cmake --build build -j $(nproc)

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Run
if [ $RUN -eq 1 ]; then
    EXE="./build/hypersynapse"
    if [ ! -f "$EXE" ]; then
        echo -e "${RED}Executable not found at $EXE${NC}"
        exit 1
    fi

    if [ -n "$CAPTURE" ]; then
        echo -e "${YELLOW}Running in capture mode with audio: $CAPTURE${NC}"
        $EXE --capture "$CAPTURE"
    else
        echo -e "${YELLOW}Running demo...${NC}"
        $EXE
    fi
fi

echo -e "${GREEN}=== Done ===${NC}"
