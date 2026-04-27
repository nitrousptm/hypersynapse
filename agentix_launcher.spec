# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for AGENTIX Launcher
Builds a standalone Windows .exe with all dependencies

Usage:
    pyinstaller agentix_launcher.spec

Result:
    dist/agentix_launcher.exe (~30-50 MB with dependencies)
"""

import sys
from pathlib import Path

block_cipher = None

# Get the directory
WORKPATH = Path(__file__).parent
DISTPATH = WORKPATH / "dist"
BUILDPATH = WORKPATH / "build"

a = Analysis(
    [str(WORKPATH / "agentix_launcher.py")],
    pathex=[str(WORKPATH)],
    binaries=[],
    datas=[
        (str(WORKPATH / "agentix_demo"), "agentix_demo"),
    ],
    hiddenimports=[
        "tkinter",
        "http.server",
        "webbrowser",
    ],
    hookspath=[],
    runtime_hooks=[],
    excludedimports=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="agentix_launcher",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Optional: add icon here
)

# Optional: Create a collection for distribution
app = BUNDLE(
    exe,
    name="AGENTIX.app",
    icon=None,
    bundle_identifier="com.agentix.demo",
    info_plist={
        "NSPrincipalClass": "NSApplication",
        "NSHighResolutionCapable": "True",
    },
    bundle_dir=DISTPATH,
)
