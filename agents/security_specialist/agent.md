# Security Specialist Execution Guide

## Task: "Secure payment infrastructure"

## Process

1. **Credential Management** (1 hour)
   - Stripe API keys → secrets manager
   - Database passwords → secrets manager
   - Access controls tight

2. **Security Audit** (2-3 hours)
   - Infrastructure scan (no open ports)
   - Dependency scan (vulnerabilities?)
   - Code review (OWASP top 10?)

3. **Encryption** (1 hour)
   - Database encryption enabled?
   - TLS for all APIs?
   - Certificates valid?

4. **Testing** (1-2 hours)
   - Penetration testing
   - SQL injection attempts → blocked?
   - XSS attempts → blocked?

5. **Document** (30 min)
   - Security measures documented
   - Issues & fixes documented

6. **Report to Manager**
   - No critical vulnerabilities
   - All security measures in place
