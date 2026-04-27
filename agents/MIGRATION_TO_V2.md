# Migration: Altes System → Neues System (V2)

**Status:** In Progress  
**Timeline:** Immediate adoption for new documentation  
**Old System:** Individual ROLE.md, SKILLS.md (verbose, repetitive)  
**New System:** Consolidated PROFILE.md (concise, actionable)

---

## Was ändert sich?

### Alte Struktur (Problematisch)
```
agents/
├── backend_manager/
│   ├── ROLE.md (258 lines, verbose)
│   ├── SKILLS.md (long list)
│   ├── agent.md
│   └── system_prompt.md
├── api_specialist/
│   ├── ROLE.md (similar structure, 150+ lines)
│   ├── SKILLS.md
│   └── ...
└── ... (repetitive for 24+ agents)
```

**Probleme:**
- ❌ Massive Redundanz (jeder Agent hat gleiche Struktur)
- ❌ Oberflächlich (viel Text, wenig Action)
- ❌ Hard zu navigieren (wo ist die echte Info?)
- ❌ Schwer zu aktualisieren (ändern = viele Dateien)

### Neue Struktur (Besser)
```
agents/
├── AGENT_SYSTEM.md                (Was ist das System insgesamt?)
├── DECISION_TREES.md              (Wie entscheide ich?)
├── ERROR_SCENARIOS.md             (Was wenn etwas schief geht?)
├── INTEGRATION_MATRIX.md          (Wer spricht mit wem?)
│
├── backend_manager/
│   └── PROFILE.md (~150 lines, 100% actionable)
│
├── api_specialist/
│   └── PROFILE.md (~200 lines, konkrete Workflows)
│
└── ... (jeder Agent kriegt nur PROFILE.md, keine Duplikate)
```

**Verbesserungen:**
- ✅ Keine Redundanz (System-Docs once, dann agent-spezifisch)
- ✅ Actionable (Decision Trees, Checklisten, Szenarien)
- ✅ Leicht zu navigieren (start mit AGENT_SYSTEM.md)
- ✅ Leicht zu updaten (change one place, affects all)

---

## Neue Files (What to Read)

| File | Purpose | Read When |
|------|---------|-----------|
| **AGENT_SYSTEM.md** | Überblick: Was ist das System? | Start here |
| **DECISION_TREES.md** | "Wenn X, dann Y" Decision-Logik | Wenn du entscheiden musst |
| **ERROR_SCENARIOS.md** | Reale Fehler + Lösungen | Wenn etwas schiefgeht |
| **INTEGRATION_MATRIX.md** | Wer spricht mit wem? | Wenn du Abhängigkeiten verstehen must |
| **_templates/PROFILE_MANAGER.md** | Template für Manager | Wie Manager dokumentiert sind |
| **_templates/PROFILE_SPECIALIST.md** | Template für Specialist | Wie Specialists dokumentiert sind |
| **{agent}/PROFILE.md** | Konkrete Agent-Dokumentation | Wenn du einen Agent brauchst |

---

## Alte Files (Was wird deprecated?)

Folgende Dateien sind **nicht mehr notwendig** nach Migration:

- ❌ `{agent}/ROLE.md` (→ jetzt in PROFILE.md)
- ❌ `{agent}/SKILLS.md` (→ in PROFILE.md aufgelöst)
- ❌ Viele `agent.md` (→ Workflows in DECISION_TREES.md & ERROR_SCENARIOS.md)
- ❌ Redundante `system_prompt.md` (→ In Claude CLI integration)

**Aber Keep:**
- ✅ `{agent}/agent.md` (OpenClaw Integration, wenn noch nötig)
- ✅ `{agent}/system_prompt.md` (Claude System Prompt, wichtig)

---

## Migration Plan

### Phase 1: Foundation (Jetzt)
- [x] AGENT_SYSTEM.md (Überblick)
- [x] DECISION_TREES.md (Logik)
- [x] ERROR_SCENARIOS.md (Fehler-Handling)
- [x] INTEGRATION_MATRIX.md (Abhängigkeiten)
- [x] _templates/PROFILE_MANAGER.md
- [x] _templates/PROFILE_SPECIALIST.md

### Phase 2: Key Agents (Nächste)
- [ ] backend_manager/PROFILE.md ✅ Done
- [ ] api_specialist/PROFILE.md ✅ Done
- [ ] database_specialist/PROFILE.md
- [ ] performance_specialist/PROFILE.md
- [ ] frontend_manager/PROFILE.md
- [ ] ui_specialist/PROFILE.md
- [ ] cto/PROFILE.md (special case: leadership)
- [ ] ceo/PROFILE.md (special case: orchestration)
- [ ] hr_agent/PROFILE.md (special case: health monitoring)

### Phase 3: Remaining Agents
- [ ] All other managers (Frontend, DevOps, QA, Product, Data/AI, External Deps)
- [ ] All other specialists (UX, Accessibility, CI/CD, Cloud, Security, etc.)

### Phase 4: Cleanup
- [ ] Update old ROLE.md files (point to PROFILE.md)
- [ ] Archive old SKILLS.md files
- [ ] Clean up redundant system_prompts (if applicable)

---

## How to Read the New System

**You are a Manager?**
1. Read: AGENT_SYSTEM.md (2 min)
2. Read: _templates/PROFILE_MANAGER.md (5 min)
3. Read: Your specific PROFILE.md (5 min)
4. When needed: DECISION_TREES.md, INTEGRATION_MATRIX.md

**You are a Specialist?**
1. Read: AGENT_SYSTEM.md (2 min)
2. Read: _templates/PROFILE_SPECIALIST.md (5 min)
3. Read: Your specific PROFILE.md (5 min)
4. When needed: DECISION_TREES.md, ERROR_SCENARIOS.md

**You are in Trouble?**
1. Read: ERROR_SCENARIOS.md (find your error type)
2. Read: DECISION_TREES.md (find your decision point)
3. Read: INTEGRATION_MATRIX.md (understand dependencies)

---

## Key Changes in Content

### Old vs. New: Decision-Making

**Old Style:**
```
## Entscheidungskriterien
| Task-Kategorie | Delegiert An | Grund |
|---|---|---|
| REST API endpoint | API Specialist | API expertise |
| Database schema | Database Specialist | DB expertise |
```
**Problem:** Lists, no logic.

**New Style (DECISION_TREES.md):**
```
Manager receives task?
├─ Do I understand it?
│  ├─ Yes → Continue
│  └─ No → Ask CEO
├─ Can I decompose it?
│  ├─ Yes → [Decompose Process]
│  └─ No → Ask CTO
```
**Better:** Clear logic, actionable steps.

---

### Old vs. New: Error Handling

**Old Style:**
```
| Fehler | Handling |
|--------|----------|
| Task fails | Investigate cause, reassign or escalate |
| Migration blocks | Rollback, redesign |
```
**Problem:** Too abstract, no concrete examples.

**New Style (ERROR_SCENARIOS.md):**
```
Scenario: "Database Migration schlägt fehl"
Situation: 1M rows, migration fails at 15 min: "Deadlock detected"
Solution:
  1. Check if recoverable (rollback?)
  2. Ask: Why deadlock? (Locking conflict? Space?)
  3. Redesign: Batched migration (100k at a time)
  4. Test on staging with 1M rows
  5. Deliver redesigned approach
```
**Better:** Real example, concrete steps.

---

### Old vs. New: Agent Profiles

**Old ROLE.md (258 lines Backend Manager):**
- 9 sections
- Lots of bullet points
- Repetitive for similar agents
- Hard to find actionable info

**New PROFILE.md (~150 lines Backend Manager):**
- Specialist table (who does what)
- Decomposition playbook (step-by-step)
- Daily coordination template
- Specialist coordination cheat sheet
- Escalation scenarios (when to tell CTO)
- Warning signs (when things go wrong)
- KPIs (how success measured)

**Result:** 40% smaller, 5x more useful.

---

## Transition Tips

### For Existing Agents

**Right now:**
1. Keep using your old ROLE.md
2. Also read the new PROFILE.md for additional context
3. When you have questions, check DECISION_TREES.md and ERROR_SCENARIOS.md

**Timeline:**
- Old system still valid until Phase 4 complete
- New PROFILE.md is **primary source of truth** starting today
- Migrate at your own pace

### For New Agents

**Starting now:**
- Use _templates/PROFILE_MANAGER.md or PROFILE_SPECIALIST.md
- No need for ROLE.md, SKILLS.md, agent.md (unless special case)
- Just PROFILE.md is enough (+ standard system_prompt.md)

### For Updates

**If you find an error:**
- Update AGENT_SYSTEM.md, DECISION_TREES.md, etc.
- Update specific PROFILE.md
- Delete outdated ROLE.md section

---

## FAQ

**Q: Do I need to read all these files?**  
A: No. Start with AGENT_SYSTEM.md, then your PROFILE.md. Read others as needed.

**Q: What if old and new documentation contradict?**  
A: Trust the new system (DECISION_TREES, PROFILE.md). Old system deprecated.

**Q: Can I still use old ROLE.md files?**  
A: Yes, but they're deprecated. Use PROFILE.md as primary.

**Q: How do I create a new agent?**  
A: Copy _templates/PROFILE_MANAGER.md or PROFILE_SPECIALIST.md, customize, done.

**Q: Who maintains this documentation?**  
A: Each agent (you). CEO/CTO review periodically.

---

## Success Metrics

We'll know the new system is working when:

- ✅ Agents read DECISION_TREES instead of asking "what do I do?"
- ✅ Errors are caught early (agents escalate fast)
- ✅ Managers coordinate efficiently (clear interfaces)
- ✅ Documentation is updated < 1x per month (stable)
- ✅ New agents onboard in <30 min (clear templates)
- ✅ 90%+ task completion rate (clear accountability)

---

**Start reading:** Begin with AGENT_SYSTEM.md. Then read your PROFILE.md. Good luck!
