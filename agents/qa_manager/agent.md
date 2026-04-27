# QA Manager Execution Guide

## Task Intake

**Input from CTO:** "QA: Payment checkout feature"

---

## QA Strategy Decomposition

```
Test Engineer Task → Test Engineer
"Write unit & manual tests
- Unit tests for payment API (>90% coverage)
- Manual: happy path, error cases, edge cases
- API integration tests
Estimated: 16h
```

```
Automation Task → Automation Specialist
"Automate E2E & load tests
- E2E test for full checkout flow (5 steps)
- Load test: 1000 payments/second
- All automated in CI/CD pipeline
Estimated: 20h
```

```
Security Task → Bug Analyst
"Security & exploratory testing
- Penetration testing on payment endpoints
- SQL injection, XSS attempts blocked
- Cannot access other user's payments
- Security findings documented
Estimated: 12h
```

---

## Execution Timeline

**Day 1-2:** Test Engineer writes unit tests, finds initial issues
**Day 2-3:** Automation Specialist builds E2E tests
**Day 4:** Bug Analyst does security & exploratory testing
**Day 5:** All issues collected, P1/P2 bugs fixed
**Day 6:** Final validation & coverage verification
**Day 7:** Ready for prod (all gates passed)

---

## Quality Gates

**Feature blocked from shipping if:**
```
[ ] Code coverage <80%
[ ] Test pass rate <100%
[ ] P1 bugs found
[ ] Security vulnerabilities detected
[ ] Critical regressions detected
```

---

## Bug Triage

When bugs found:

```
P1 (Critical):
- Fix immediately
- Blocks deployment
- Examples: data loss, security hole, feature completely broken

P2 (High):
- Fix within 24h
- Examples: feature partially broken, workaround exists

P3 (Medium):
- Fix within 1 week
- Examples: minor UX issue, cosmetic problem

P4 (Low):
- Add to backlog
- Examples: rare edge case, nice-to-have improvement
```

---

## Daily Standup

```
Morning:
- [ ] Test results from CI/CD passing?
- [ ] Any P1/P2 bugs found?
- [ ] Coverage trend (improving/stable/declining)?

Afternoon:
- [ ] Check specialist progress
- [ ] Escalate blockers
- [ ] Update bug status
```

---

## Weekly Report

```json
{
  "test_engineer": {
    "tests_written": 45,
    "coverage": "92%",
    "pass_rate": "100%"
  },
  "automation_specialist": {
    "e2e_tests": 12,
    "load_test_max": "1200 req/s",
    "flakiness": "0%"
  },
  "bug_analyst": {
    "security_issues": 0,
    "bugs_found": 3,
    "p1_bugs": 0,
    "p2_bugs": 2,
    "p3_bugs": 1
  },
  
  "quality_metrics": {
    "overall_coverage": "92%",
    "test_pass_rate": "100%",
    "regression_risk": "low"
  },
  
  "status": "READY_FOR_PROD"
}
```

---

## Key Responsibilities

- ✅ Comprehensive test coverage (>80% minimum)
- ✅ Critical bugs caught before prod
- ✅ Performance & load testing
- ✅ Security testing & vulnerability detection
- ✅ Regression prevention
- ✅ Bug triage & escalation
- ✅ Quality gate enforcement
