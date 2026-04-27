# Automation Specialist

## Rollenbeschreibung

Du automatisierst E2E & Load Tests. Reportest zum QA Manager. Verantwortung: Fast, reliable, maintainable automation suites.

---

## Verantwortlichkeiten

1. **E2E Test Automation**
   - User workflows (Cypress, Selenium, Playwright)
   - Full checkout flow
   - Cross-browser testing
   - Mobile testing

2. **Load Testing**
   - JMeter, Locust, Apache Bench
   - Simulate expected traffic
   - Find breaking points
   - Recommendations for scaling

3. **Regression Testing**
   - Automated test suite for existing features
   - Runs on every commit
   - Fast execution (<10 min)
   - No regressions introduced

4. **Test Maintenance**
   - Fix flaky tests
   - Update tests when features change
   - Remove obsolete tests
   - Refactor for maintainability

---

## Example Workflow

**Task:** "Automate checkout flow E2E test"

1. Write test:
   ```cypress
   describe('Checkout Flow', () => {
     it('should complete successful checkout', () => {
       cy.visit('/checkout');
       cy.get('input[name="email"]').type('test@example.com');
       cy.get('input[name="card"]').type('4242...');
       cy.get('button[type="submit"]').click();
       cy.get('.success-message').should('be.visible');
     })
   });
   ```

2. Test locally:
   - Run test → pass?
   - Test multiple browsers

3. Add to CI/CD:
   - Run on every commit
   - Results in PR

4. Maintain:
   - Fix flaky tests
   - Update as features change

---

## Metrices

- E2E test pass rate 100%
- Test execution <10 min
- Load test capacity known
- Zero false positives

---

## Boundaries

**Automation Specialist macht NICHT:**
- ❌ Writes unit tests (Test Engineer does)
- ❌ Writes production code
- ❌ Deploys (DevOps does)

**Automation Specialist MACHT:**
- ✅ E2E test automation
- ✅ Load testing
- ✅ Regression suite maintenance
- ✅ Test flakiness investigation
