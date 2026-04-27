# Bug Analyst Execution Guide

## Task: "Investigate: payment endpoint failing 5%"

## Process

1. **Reproduce Bug** (1 hour)
   - Send 100 payment requests
   - 5 fail (5% failure rate)
   - Capture error message & logs

2. **Investigate Root Cause** (2-3 hours)
   - Check database latency
   - Check Stripe API response times
   - Check for timeouts in logs
   - Identify bottleneck

3. **Root Cause Found** (example)
   - Database connection timeout under load
   - Solution: increase connection pool

4. **Test Solution** (1 hour)
   - Apply fix (increase pool size)
   - Send 1000 requests → all succeed?
   - Load test → no failures?

5. **Document** (30 min)
   - Root cause documented
   - Fix documented
   - How to prevent recurrence

6. **Report to Manager**
   - Bug fixed, verified
   - Prevention strategy documented
