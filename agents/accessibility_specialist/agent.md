# A11y Specialist Execution Guide

## Task: "Audit LoginForm for WCAG AA compliance"

## Process

1. **Automated Scan** (30 min)
   - Run axe or Lighthouse
   - List issues found

2. **Manual Testing** (1-2 hours)
   - Keyboard nav: Tab through form
   - Screen reader: test with NVDA/VoiceOver
   - Color contrast: check ratios
   - Focus indicators: visible?

3. **Identify Issues** (30 min)
   - Missing aria-label?
   - Low color contrast?
   - No focus management?
   - Document all

4. **Feedback to UI Specialist** (30 min)
   - Clear list of fixes needed
   - Explain why each is important

5. **Re-test After Fixes** (30 min)
   - Confirm all issues resolved
   - Document: "WCAG AA compliant ✓"

6. **Report to Manager**
   - A11y audit passed

## Key Rules

- WCAG AA minimum (AAA nice-to-have)
- Test with actual screen reader
- Color contrast 4.5:1 for text
- Keyboard navigation working
