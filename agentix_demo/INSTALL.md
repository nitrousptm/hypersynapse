# Installation & Deployment

## 📦 Was ist in diesem Paket?

```
agentix_demo/
├── index.html           ← Die interaktive Demo (HTML/CSS/JS)
├── server.py            ← Python Server (optional)
├── START_DEMO.bat       ← Windows Launcher (einfachste Option)
├── README.md            ← Dokumentation
└── INSTALL.md           ← Diese Datei
```

## 🚀 Installation

### Option 1: Windows (Schnellste)

**Schritt 1:** Alle Dateien in ein Verzeichnis (z.B. `C:\Agentix\`) kopieren

**Schritt 2:** Doppelklick auf `START_DEMO.bat`

**Schritt 3:** Demo öffnet sich im Browser ✅

---

### Option 2: Python Server (Empfohlen für Entwicklung)

**Voraussetzung:** Python 3.6+ installiert

**Schritt 1:** Terminal/CMD öffnen im Demo-Verzeichnis

**Schritt 2:** Folgendes eingeben:
```bash
python server.py
```

**Schritt 3:** Browser öffnet sich automatisch ✅

---

### Option 3: Manuell im Browser

**Schritt 1:** Alle Dateien in ein Verzeichnis kopieren

**Schritt 2:** `index.html` im Browser öffnen (Doppelklick)

**Schritt 3:** Demo startet ✅

---

## 📊 Verzeichnisstruktur (Empfohlen)

```
C:\Users\[Your Username]\Downloads\
└── Agentix-Demo/
    ├── index.html
    ├── server.py
    ├── START_DEMO.bat
    ├── README.md
    └── INSTALL.md
```

---

## 🎯 Häufige Probleme & Lösungen

### Problem: "START_DEMO.bat funktioniert nicht"
**Lösung:** 
- Stelle sicher dass `index.html` im gleichen Verzeichnis ist
- Oder nutze stattdessen `server.py` (Option 2)

### Problem: "Browser öffnet nicht"
**Lösung:**
- Demo wurde bereits gestartet, aber Browser hat Fokus nicht erhalten
- Öffne manuell: `http://localhost:8000`

### Problem: "Server.py sagt 'Module nicht gefunden'"
**Lösung:**
- Python ist nicht korrekt installiert
- Nutze stattdessen `START_DEMO.bat` (Option 1)

---

## 💾 Windows EXE erstellen (Fortgeschrittene)

Falls du ein echtes Windows .EXE erstellen möchtest:

**Option A: Mit PyInstaller (kompliziert)**
```bash
pip install pyinstaller
pyinstaller --onefile --windowed --icon=icon.ico server.py
```

**Option B: Mit Batch (einfach)**
```batch
@echo off
python server.py
```
Speicher als `Agentix.bat` und benenne zu `Agentix.cmd`

**Option C: Mit VBS (reines Windows)**
```vbscript
CreateObject("WScript.Shell").Run "START_DEMO.bat", 0
```
Speicher als `Agentix.vbs` und doppelklick!

---

## 🔧 Entwicklung & Modifikation

### Demo anpassen (HTML/CSS/JS):

1. Öffne `index.html` in einen Text-Editor
2. Modifiziere HTML (Struktur), CSS (Styling), oder JS (Logik)
3. Speichern & Browser refreshen (F5)

### Neues Szenario hinzufügen:

In `index.html`, Sektion "const scenario":
```javascript
const scenario = {
    title: 'Neues Szenario',
    request: 'Beschreibung...',
    tasks: [
        { id: 1, from: 'User', to: 'CEO', title: 'Task 1', duration: 2 },
        { id: 2, from: 'CEO', to: 'CTO', title: 'Task 2', duration: 2 },
        // ... mehr tasks
    ]
};
```

### Hierarchie ändern:

In `index.html`, Sektion "const agents":
```javascript
const agents = {
    'NewAgent': { type: 'specialist', role: 'Beschreibung', parent: 'Parent Agent' },
    // ...
};
```

---

## 📤 Verteilung & Sharing

### Als ZIP für andere:
```bash
zip -r Agentix-Demo.zip agentix_demo/
```

### Anderen Nutzern empfehlen:
1. Download Agentix-Demo.zip
2. Entzippen
3. Doppelklick auf START_DEMO.bat
4. Fertig!

---

## ✨ Nächste Schritte

Nach Installation:
1. Lies `README.md` für Demo-Dokumentation
2. Klick ▶ Run Scenario um das Szenario zu sehen
3. Studiere die Agentix-Hierarchie
4. Siehe `AGENT_SYSTEM.md` für System-Tiefe

---

## 📞 Support

**Funktioniert nicht?**
- Probiere alle 3 Optionen (Bat, Python, Manuell)
- Stelle sicher Python installiert ist (für Option 2)
- Prüfe dass alle Dateien vorhanden sind

**Weitere Fragen?**
- Siehe README.md
- Siehe AGENT_SYSTEM.md
- Siehe agentix_demo/index.html (Code-Kommentare)

---

**Viel Erfolg! 🚀**
