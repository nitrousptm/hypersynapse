# DevOps Manager Execution Guide

## Task Intake

**Input from CTO:** "Deploy payment service to production"

---

## Task Decomposition

```
CI/CD Task → CI/CD Specialist
"Build GitHub Actions pipeline for payment service
- Tests run on every commit
- Build succeeds <5min
- Deploy to staging automated
- Manual approval for prod
Estimated: 8h
```

```
Cloud Task → Cloud Specialist
"Provision cloud infrastructure
- API servers with auto-scaling
- Database cluster (replicated)
- Load balancer configured
- CDN for static assets
Estimated: 12h
```

```
Security Task → Security Specialist
"Secure infrastructure & credentials
- API keys in secrets manager
- Database encryption enabled
- Vulnerability scan clean
- Firewall rules tight
Estimated: 6h
```

---

## Execution Flow

**Day 1-2:** Cloud Specialist provisions infrastructure
**Day 2-3:** CI/CD Specialist builds deployment pipeline  
**Day 3:** Security Specialist audits, flags issues
**Day 4:** All resolve security findings
**Day 5:** Dry-run deployment to staging
**Day 6:** Canary deployment to 10% prod
**Day 7:** Monitor 24h → full rollout if healthy

---

## Daily Monitoring

```
Morning Checklist:
- [ ] All systems healthy? (uptime, errors, latency)
- [ ] Any P1/P2 incidents?
- [ ] Security alerts?
- [ ] Deployment pipeline status?

Afternoon:
- [ ] Check specialist progress
- [ ] Coordinate dependencies
- [ ] Resolve blockers
```

---

## Deployment Checklist

Before production deployment:

```
[ ] All tests passing (100%)
[ ] Security scan clean (0 vulnerabilities)
[ ] Monitoring & alerts configured
[ ] Rollback procedure tested
[ ] Team notified of deployment window
[ ] Canary deployment plan ready (10% traffic first)
[ ] On-call engineer assigned
[ ] Database backup completed
```

---

## Incident Response

**If P1 (Critical) Issue in Production:**

1. Immediate action: Rollback (if possible) or scale up
2. Investigation: What happened? Root cause?
3. Communication: Notify team + stakeholders
4. Resolution: Fix the issue
5. Postmortem: How did this happen? How to prevent?

---

## Weekly Report

```json
{
  "deployments": {
    "successful": 5,
    "failed": 0,
    "rollbacks": 0
  },
  "infrastructure": {
    "uptime": 99.95,
    "latency_p95": "120ms",
    "error_rate": "0.02%"
  },
  "security": {
    "vulnerabilities": 0,
    "critical_issues": 0,
    "audits_completed": 1
  },
  "incidents": {
    "p1": 0,
    "p2": 1,
    "mttr_p2": "45 minutes"
  }
}
```

---

## Key Responsibilities

- ✅ Ensure zero-downtime deployments
- ✅ Monitor system health 24/7
- ✅ Respond to incidents immediately
- ✅ Security-first mindset
- ✅ Capacity planning & scaling
- ✅ Disaster recovery readiness
