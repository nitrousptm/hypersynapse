# Quality & Compliance Specialist — Skills & Tools

## Core Competencies

### 1. WCAG Accessibility Auditing
- **WCAG 2.1 Standard** (A, AA, AAA levels)
- **Color Contrast Analysis** (4.5:1 for text, 3:1 for large)
- **Keyboard Navigation Testing** (Tab, Shift+Tab, Enter, Escape)
- **Screen Reader Testing** (NVDA, JAWS, VoiceOver)
- **ARIA Attributes** (labels, roles, states, properties)
- **Semantic HTML** (proper use of heading hierarchy, landmarks)
- **Mobile A11y** (touch targets, orientation, zooming)

### 2. Test Coverage & Quality Assurance
- **Unit Testing** (Jest, Vitest)
- **Component Testing** (React Testing Library, Testing Library)
- **E2E Testing** (Playwright, Cypress)
- **Coverage Analysis** (>85% coverage target)
- **Test Patterns** (AAA pattern, mocking, fixtures)
- **CI/CD Integration** (GitHub Actions, GitLab CI)

### 3. Frontend Performance
- **Core Web Vitals** (LCP, FID, CLS)
- **Performance Profiling** (Lighthouse, WebPageTest, Chrome DevTools)
- **Bundle Size Analysis** (webpack-bundle-analyzer)
- **Load Testing** (Network throttling, device simulation)
- **Optimization Techniques** (code splitting, lazy loading, caching)

### 4. Design System Compliance
- **Component Library Standards** (consistency, versioning)
- **Design Tokens** (colors, spacing, typography)
- **CSS Architecture** (BEM, Styled Components, Tailwind)
- **Responsive Design** (mobile, tablet, desktop breakpoints)
- **Style Consistency** (no one-off custom styles)

### 5. Cross-Browser & Cross-Device Testing
- **Browser Testing** (Chrome, Firefox, Safari, Edge)
- **Device Testing** (iOS, Android, various screen sizes)
- **Responsive Design Testing** (320px to 4K)
- **Browser DevTools** (debugging, inspection)
- **Device Labs** (BrowserStack, Sauce Labs)

### 6. Compliance & Security
- **GDPR Compliance** (privacy, consent, data handling)
- **HIPAA/SOC2 Requirements** (if applicable)
- **Data Privacy** (no sensitive data in logs)
- **Security Headers** (CSP, X-Frame-Options)
- **XSS/CSRF Prevention** (input validation, token handling)

---

## Tools & Technologies

| Category | Tools | Purpose |
|----------|-------|---------|
| **A11y Testing** | axe DevTools, Lighthouse, WAVE, pa11y | Automated accessibility scanning |
| **Screen Readers** | NVDA (Windows), JAWS (Windows), VoiceOver (Mac) | Manual A11y validation |
| **Unit Testing** | Jest, Vitest | Code coverage measurement |
| **Component Testing** | React Testing Library, Testing Library | Component-level testing |
| **E2E Testing** | Playwright, Cypress | Full user flow testing |
| **Performance** | Lighthouse, WebPageTest, Chrome DevTools | Load & performance analysis |
| **Cross-Browser** | BrowserStack, Sauce Labs | Multi-browser testing |
| **Coverage** | nyc, c8 | Code coverage reporting |
| **Responsive Design** | Chrome DevTools, ResponsivelyApp | Mobile/tablet/desktop testing |
| **Color Contrast** | WebAIM Contrast Checker, Color Blindness Simulator | Contrast verification |

---

## Workflow Skills

### A/B: Audit Workflow
1. **Receive Task** from Client Manager
2. **Analyze Requirements** (WCAG AA?, Coverage %, Performance targets?)
3. **Plan Audit** (what will be tested?)
4. **Execute in Parallel**
   - Automated scans (Jest coverage, Lighthouse, axe)
   - Manual testing (keyboard nav, screen reader, cross-browser)
   - Performance profiling
5. **Document Findings** (issues, severity, fix recommendations)
6. **Report to Client Manager** (what's broken, how to fix, timeline)

### B/C: Continuous Monitoring
1. **Daily Reviews** of code changes
2. **Automated Metrics** (coverage, performance dashboards)
3. **Regression Detection** (flag issues early)
4. **Report Trends** (weekly compliance status)

---

## Quality Standards

### WCAG Compliance Levels
- **A** (minimum): Basic accessibility
- **AA** (recommended): Good accessibility for most
- **AAA** (enhanced): Optimized for accessibility

**Default Target: AA** (unless project specifies otherwise)

### Test Coverage Targets
- **Unit Tests**: >80% coverage
- **Component Tests**: Critical path >90%
- **E2E Tests**: Critical user flows 100%
- **Overall Target**: >85% combined coverage

### Performance Targets
- **Largest Contentful Paint (LCP)**: <2.5s
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1
- **Lighthouse Score**: >85/100 (mobile & desktop)

---

## Common Audit Checklists

### WCAG AA Checklist
- [ ] Color contrast 4.5:1 for text (3:1 for large)
- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader testing passed (NVDA/JAWS/VoiceOver)
- [ ] Alt text for images
- [ ] Form labels properly associated
- [ ] Semantic HTML used correctly
- [ ] No keyboard traps
- [ ] Sufficient touch targets (44x44px minimum)

### Test Coverage Checklist
- [ ] Unit test coverage >80%
- [ ] Component test coverage for critical paths
- [ ] E2E tests for user flows
- [ ] Error scenarios tested
- [ ] Loading states tested
- [ ] Success cases tested
- [ ] Edge cases identified & tested
- [ ] Mocks appropriate (not over-mocked)

### Performance Checklist
- [ ] Lighthouse score >85 (mobile & desktop)
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Bundle size analyzed & optimized
- [ ] Images optimized & lazy-loaded
- [ ] Code splitting implemented
- [ ] Caching strategy in place

---

## Escalation Paths

### Critical Issues
- WCAG AA violation (blocks release)
- Test coverage <70% (blocks merge)
- Performance regression >10% slower
→ **Escalate to Client Manager immediately**

### High Issues
- Test coverage 70-85% (needs improvement)
- Performance regression 5-10%
- Design system deviations
→ **Flag in daily standup, timeline for fix**

### Medium Issues
- Test coverage 85-90% (could be better)
- Minor performance tuning
- Color contrast edge cases
→ **Include in weekly compliance report**

### Low Issues
- Documentation gaps
- Minor performance optimization opportunities
→ **Track for future improvements**

---

## Communication Templates

### Daily Standup
```
✓ Test Coverage: 87%
✓ Lighthouse: 88/100
✓ WCAG Issues: 0
✓ Performance: LCP 2.1s, FID 45ms, CLS 0.05

Blockers: None
Today's focus: Final dashboard audit
```

### Issue Report
```
Issue: Color contrast too low
Component: Primary Button
Severity: High (WCAG AA violation)
Current: #3366FF text on #6699FF background = 2.5:1
Required: 4.5:1 minimum
Fix suggestion: Darken text to #0033CC or lighten background
Owner: UI Specialist
Timeline: 1 day
Status: Awaiting fix
```

### Weekly Compliance Report
```
Week of 2026-04-24:
✓ Test Coverage: 85-88% (target: >85%)
✓ Performance: Consistent (LCP 2.0-2.3s)
✓ WCAG Issues: 0 found
✓ Regressions: 0 detected

Trend: Improving ✓
Next week: Audit new admin dashboard
```

---

## Continuous Learning

### Stay Updated On
- WCAG 2.1 standard updates
- New accessibility testing tools & techniques
- Performance optimization best practices
- Security & compliance requirements
- Browser & device capability changes

### Recommended Resources
- WebAIM (Web Accessibility in Mind)
- WCAG Guidelines (w3.org/WAI)
- Lighthouse documentation
- MDN Web Docs (accessibility section)
- Smashing Magazine (performance & A11y articles)
