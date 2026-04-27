# 🔨 Building AGENTIX.exe for Windows

Complete guide to create a standalone Windows executable.

---

## Option 1: PyInstaller (Recommended)

### Prerequisites
1. **Python 3.8+** installed (from python.org)
2. **Visual Studio Build Tools** (for PyInstaller)

### Step 1: Install PyInstaller
```batch
pip install pyinstaller
```

### Step 2: Build the Executable
```batch
pyinstaller agentix_launcher.spec
```

### Step 3: Find Your EXE
The executable will be in:
```
dist/agentix_launcher.exe
```

### Step 4: Test
```batch
dist/agentix_launcher.exe
```

**Result:** ~40-50 MB standalone executable with Python runtime included

---

## Option 2: Direct Python Compilation (Simpler)

If you have Python installed on Windows:

```batch
# Copy all files to Windows
# Run directly:
python agentix_launcher.py

# Or create a shortcut:
# Create agentix_launcher.bat with:
@echo off
python agentix_launcher.py %*
```

---

## Option 3: Native C++ (Advanced)

If you want the native OpenGL version:

### Prerequisites
1. **Visual Studio 2022 Community** (MSVC compiler)
2. **Windows SDK** (included with Visual Studio)

### Build
```batch
# In Developer Command Prompt for VS:
double-click BUILD_AGENTIX.bat
```

Or manually:
```batch
cl /O2 /EHsc agentix_demo.cpp /link opengl32.lib gdi32.lib user32.lib /OUT:agentix_native.exe
```

**Result:** ~60-80 KB native executable (no dependencies)

---

## Option 4: Electron App (Standalone Web App)

For a fully standalone cross-platform app:

### Prerequisites
- Node.js installed
- electron-packager installed

### Build
```bash
npm install -g electron-packager
electron-packager . agentix --platform win32 --arch x64
```

**Result:** Standalone Windows app folder with executable

---

## File Structure (For Distribution)

```
AGENTIX/
├── agentix_launcher.exe      (or .bat)
├── agentix_demo/
│   ├── advanced.html
│   ├── index.html
│   ├── server.py
│   └── ...
├── agentix_demo.cpp
├── BUILD_AGENTIX.bat
└── README.txt
```

---

## Distribution Checklist

- [ ] Tested on Windows 10
- [ ] Tested on Windows 11
- [ ] All dependencies included
- [ ] No external downloads needed
- [ ] Runs from any directory
- [ ] File size acceptable
- [ ] Smooth 60 FPS
- [ ] SPACE to start
- [ ] ESC to exit

---

## Troubleshooting

### "Python not found"
- Install Python from python.org
- Make sure to check "Add Python to PATH"

### "MSVC not found"
- Install Visual Studio Community with C++ tools

### EXE is too large (>100 MB)
- Use UPX compression:
  ```batch
  upx agentix_launcher.exe -o agentix_launcher_packed.exe
  ```

### Demo won't start
- Check if port 8080 is available
- Try a different port in agentix_launcher.py

### Graphics issues
- Update GPU drivers
- Make sure OpenGL 1.1+ is supported
- Try the Python version instead of C++

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Install PyInstaller | `pip install pyinstaller` |
| Build EXE | `pyinstaller agentix_launcher.spec` |
| Test launcher | `python agentix_launcher.py` |
| Build C++ | `BUILD_AGENTIX.bat` |
| Compress EXE | `upx agentix_launcher.exe` |

---

## File Sizes

| Version | Size | Dependencies |
|---------|------|--------------|
| PyInstaller EXE | 40-50 MB | Python runtime (included) |
| C++ Native | 60-80 KB | Windows OpenGL (system) |
| Python script | 5 KB | Python 3.8+ (external) |
| Electron App | 150+ MB | Chromium (included) |

---

## For Assembly 2026 Submission

**Recommended:** C++ Native Version
- Smallest size (~60 KB)
- Fastest startup
- Most impressive technical implementation
- Perfect for demo scene

**Alternative:** PyInstaller
- More portable
- Easier to build on any Windows machine
- Includes HTML/3D demo

---

## Support

**Issues?**

1. Check if all files are in the same directory
2. Make sure Python/MSVC is installed
3. Try a different method (C++ vs Python)
4. Check console output for errors

---

**Good luck building! 🚀**
