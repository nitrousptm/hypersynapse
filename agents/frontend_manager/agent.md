# Frontend Manager Execution Guide

## Task Intake & Decomposition

**Input from CTO:** "Build dark mode feature"

**Decompose into 3 Tasks:**

```
UX Task → UX Specialist
"Design dark mode theme & user flows
- Wireframes for theme picker
- Dark color palette
- User testing (5 users min)
Estimated: 8h
```

```
UI Task → UI Specialist  
"Implement dark mode CSS & components
- React components support both themes
- CSS variables for colors
- Smooth theme switching
Estimated: 12h
Blocked by: UX designs from UX Specialist
```

```
A11y Task → A11y Specialist
"Audit dark mode for WCAG AA compliance
- Color contrast ratios
- Focus indicators visible
- Screen reader testing
Estimated: 4h
Blocked by: UI implementation complete
```

---

## Coordination Pattern

**Day 1-2:** UX designs, provides wireframes
**Day 2-3:** UI starts implementation based on UX designs  
**Day 3-4:** UX reviews UI implementation, provides feedback
**Day 4-5:** A11y audits, finds issues → UI fixes
**Day 5:** Final polish, ready for testing

---

## Daily Process

```
Morning:
1. Check all 3 specialists' status
2. Identify blockers
3. Coordinate dependencies (UX → UI → A11y flow)

Afternoon:
1. Review work-in-progress
2. Provide feedback (if needed)
3. Escalate blockers to CTO
```

---

## Weekly Report

```json
{
  "UX Specialist": {
    "status": "done",
    "deliverable": "Dark mode designs + user research"
  },
  "UI Specialist": {
    "status": "in_progress",
    "percent_complete": 75,
    "blocker": "A11y color palette feedback"
  },
  "A11y Specialist": {
    "status": "pending",
    "reason": "Waiting for UI implementation"
  },
  
  "metrics": {
    "test_coverage": 0.85,
    "lighthouse_score": 91,
    "a11y_compliance": "WCAG AA"
  },
  
  "on_schedule": true
}
```

---

## Key Responsibilities

- ✅ Ensure UX designs → UI implementation alignment
- ✅ Enforce design system consistency
- ✅ Verify A11y compliance at every step
- ✅ API coordination (get API spec from Backend Manager)
- ✅ Daily standup with all 3 specialists
- ✅ Quality gates before deployment

---

## Escalation Examples

**Blocker:** "UI Specialist needs Figma design, UX Specialist hasn't provided"
- **Action:** Mediate between them, ask for ETA

**Issue:** "Bundle size 500KB (target 300KB)"
- **Action:** Investigate → lazy load component → retest

**Problem:** "A11y audit finds 20 issues"
- **Action:** Work with UI to fix, verify, prevent regression
