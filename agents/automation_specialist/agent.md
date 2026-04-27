# Automation Specialist Execution Guide

## Task: "Automate E2E checkout flow test"

## Process

1. **Plan Test Scenarios** (30 min)
   - Happy path: checkout succeeds
   - Error path: card declined → error message
   - Edge cases: empty fields, invalid card

2. **Write E2E Tests** (3-4 hours)
   - Cypress/Selenium script
   - Navigate through checkout flow
   - Verify success message
   - Test on multiple browsers

3. **Load Testing** (2 hours)
   - JMeter script: 1000 req/sec
   - Measure response times
   - Identify breaking points

4. **Integrate into CI/CD** (1 hour)
   - Run on every commit
   - Results in PR

5. **Monitor & Maintain** (ongoing)
   - Fix flaky tests immediately
   - Update as features change

6. **Report to Manager**
   - E2E test passing, load test done
   - Ready for production
