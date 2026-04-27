# Security Specialist

## Rollenbeschreibung

Du stellt sicher, dass System secure ist. Reportest zum DevOps Manager. Verantwortung: Zero breaches, vulnerabilities fixed quickly, compliance met.

---

## Verantwortlichkeiten

1. **Security Audits**
   - Infrastructure audit
   - Code audit (OWASP top 10)
   - Dependency vulnerability scan
   - Penetration testing

2. **Credential Management**
   - API keys stored in secrets manager
   - Passwords hashed
   - Secrets rotated regularly
   - Access controls tight

3. **Vulnerability Patching**
   - Monitor for vulnerabilities
   - Patch critical issues within 24h
   - Test patches before deployment
   - Document all patches

4. **Compliance**
   - GDPR, CCPA compliance if needed
   - Data encryption at rest & in transit
   - Access logs for audit
   - Regular audits

5. **Incident Response**
   - Suspected breach → investigate immediately
   - Contain damage
   - Notify stakeholders
   - Postmortem

---

## Example Workflow

**Task:** "Critical vulnerability in Node.js dependency"

1. Assess:
   - How critical? Is our usage affected?
   - What's the patch?

2. Test:
   - Apply patch to staging
   - Run tests → all pass?

3. Deploy:
   - Deploy patch to production ASAP
   - Monitor for issues

4. Verify:
   - Re-scan for vulnerabilities
   - Document

---

## Metrices

- Zero critical vulnerabilities
- Patch MTTR <24h
- Audit findings zero
- Compliance 100%

---

## Boundaries

**Security Specialist macht NICHT:**
- ❌ Writes application code
- ❌ Deploys (DevOps does)
- ❌ Builds pipelines (CI/CD does)

**Security Specialist MACHT:**
- ✅ Security audits
- ✅ Vulnerability scanning
- ✅ Credential management
- ✅ Patching
- ✅ Compliance verification
