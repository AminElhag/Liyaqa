# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.x.x   | :white_check_mark: | Active development |
| < 1.0   | :x:                | No longer supported |

**Current Production Version:** 1.0.0 (as of January 2026)

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in Liyaqa, please follow these steps to report it responsibly.

### 1. Do Not Publicly Disclose

**Please do not:**
- Create a public GitHub issue for security vulnerabilities
- Post details in public forums or social media
- Share vulnerability details with third parties before we've had a chance to address it

### 2. Contact Us Privately

**Email security vulnerabilities to:** security@liyaqa.com

**Include in your report:**
- **Description:** Clear description of the vulnerability
- **Steps to Reproduce:** Detailed steps to reproduce the issue
- **Potential Impact:** Your assessment of the severity and potential impact
- **Suggested Fix:** If you have ideas for how to fix it (optional but appreciated)
- **Your Contact Information:** So we can follow up with questions
- **Disclosure Timeline:** Your expected disclosure timeline (we request at least 90 days)

**Example Report Format:**
```
Subject: [SECURITY] Potential SQL Injection in Member Search

Vulnerability Type: SQL Injection
Affected Component: Member Search API (/api/members/search)
Severity: High

Description:
The member search endpoint does not properly sanitize user input in the
'name' query parameter, potentially allowing SQL injection attacks.

Steps to Reproduce:
1. Navigate to /api/members/search?name=test' OR '1'='1
2. Observe that all members are returned
3. Attempted payload: test'; DROP TABLE members--

Potential Impact:
- Data exfiltration
- Unauthorized data access
- Potential database manipulation

Suggested Fix:
Use parameterized queries or ORM methods instead of string concatenation.

Contact: security-researcher@example.com
Disclosure Timeline: 90 days from report date
```

### 3. Response Timeline

We are committed to responding to security reports promptly:

| Stage | Timeline | Description |
|-------|----------|-------------|
| **Initial Response** | Within 24 hours | Acknowledgment of receipt |
| **Triage** | Within 48 hours | Initial assessment of severity and validity |
| **Status Update** | Weekly | Progress updates until resolved |
| **Fix Timeline** | Based on severity | See table below |

**Fix Timeline by Severity:**

| Severity | Description | Fix Timeline | Public Disclosure |
|----------|-------------|--------------|-------------------|
| **Critical** | Remote code execution, authentication bypass, data breach | 1-7 days | After fix deployed + 7 days |
| **High** | Privilege escalation, SQL injection, XSS, data leak | 7-30 days | After fix deployed + 14 days |
| **Medium** | CSRF, insecure defaults, information disclosure | 30-90 days | After fix deployed + 30 days |
| **Low** | Rate limiting issues, minor info disclosure | Next release | After release |

### 4. Disclosure Process

Our coordinated disclosure process:

1. **Acknowledgment**
   - Security team acknowledges receipt within 24 hours
   - We'll work with you to understand the issue

2. **Investigation**
   - Team investigates and validates the vulnerability
   - We'll keep you updated on our progress

3. **Fix Development**
   - Fix is developed and tested in a private branch
   - Code review and security testing performed

4. **Fix Deployment**
   - Fix is deployed to production
   - We'll notify you when the fix is live

5. **Public Disclosure**
   - We'll coordinate disclosure timing with you
   - Security advisory published (if appropriate)
   - CVE assigned for critical/high severity issues

6. **Recognition**
   - We'll credit you in our security advisory (if desired)
   - Your name added to our security hall of fame
   - Bounty may be available for critical findings (TBD)

### 5. Coordinated Disclosure Agreement

By reporting a vulnerability to us, you agree to:
- Give us reasonable time to fix the issue before public disclosure
- Not exploit the vulnerability beyond what's necessary to demonstrate it
- Not access, modify, or delete data belonging to others
- Act in good faith and follow this security policy

In return, we commit to:
- Respond promptly and keep you updated
- Work with you to understand and validate the issue
- Credit you for the discovery (if desired)
- Not pursue legal action for good faith security research

---

## Security Best Practices

### For Contributors

**Before Contributing Code:**
- [ ] Enable two-factor authentication (2FA) on your GitHub account
- [ ] Use strong, unique passwords for all accounts
- [ ] Review our secure coding guidelines (in `/docs/SECURE_CODING.md`)
- [ ] Run security scans locally before submitting PR

**When Writing Code:**
- [ ] Never commit secrets (API keys, passwords, tokens, certificates)
- [ ] Use environment variables or AWS Secrets Manager for sensitive data
- [ ] Follow OWASP Top 10 guidelines
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized queries (never string concatenation for SQL)
- [ ] Implement proper authentication and authorization checks
- [ ] Log security events (failed logins, permission denials)
- [ ] Don't log sensitive data (passwords, tokens, credit cards)

**Before Submitting PR:**
- [ ] Run all tests (unit, integration, E2E)
- [ ] Check for security vulnerabilities (`npm audit`, Trivy scan)
- [ ] Review dependencies for known CVEs
- [ ] Update dependencies if vulnerabilities found
- [ ] Document any security-relevant changes

**Secure Coding Checklist:**
```bash
# Before commit
git diff HEAD                          # Review all changes
grep -r "password\|secret\|key" .      # Check for hardcoded secrets
grep -r "TODO.*security" .             # Check for security TODOs

# Run security checks
cd backend && ./gradlew dependencyCheckAnalyze
cd frontend && npm audit
docker run --rm -v $(pwd):/src trufflesecurity/trufflehog:latest filesystem /src

# Run tests
./gradlew test
npm test
```

### For Users

**Account Security:**
- [ ] Use strong, unique passwords (minimum 12 characters)
- [ ] Enable two-factor authentication (2FA) if available
- [ ] Never share your credentials with anyone
- [ ] Log out when using shared computers
- [ ] Review account activity regularly

**Data Protection:**
- [ ] Only grant necessary permissions to users
- [ ] Regularly review user access and roles
- [ ] Remove access for inactive or departed users
- [ ] Use role-based access control (RBAC)
- [ ] Limit data export to trusted users

**Reporting Suspicious Activity:**
- [ ] Report failed login attempts from unknown locations
- [ ] Report unusual account activity immediately
- [ ] Contact support if you suspect account compromise
- [ ] Change password immediately if suspicious activity detected

---

## Known Security Measures

Liyaqa implements multiple layers of security to protect your data:

### Application Security

**Authentication & Authorization:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-tenant isolation (strict tenant ID validation)
- Session timeout (30 minutes of inactivity)
- Password requirements enforced (8+ chars, uppercase, lowercase, number, special)
- Account lockout after 5 failed login attempts
- Password reset with email verification

**Data Protection:**
- HTTPS/TLS encryption for all traffic (TLS 1.2+)
- Data encryption at rest (database encryption)
- Encrypted backups
- Secrets stored in AWS Secrets Manager (not in code or environment files)
- Sensitive data never logged (passwords, tokens, credit cards)

**API Security:**
- Rate limiting (100 requests/minute per user)
- Request size limits (10MB max)
- CORS properly configured (whitelist only)
- Input validation on all endpoints
- Output encoding to prevent XSS
- SQL injection prevention (parameterized queries, JPA)
- CSRF protection (stateless JWT, no cookies)

**Infrastructure Security:**
- Container security scanning (Trivy)
- Regular OS and dependency updates (Dependabot)
- Firewall configured (ports 80, 443, 22 only)
- SSH key-based authentication only
- Database not publicly accessible
- Monitoring and alerting for suspicious activity

### Security Scanning

Our CI/CD pipeline includes automated security scanning:

**Static Analysis:**
- **CodeQL:** Weekly scans for code vulnerabilities
- **Trivy:** Container vulnerability scanning on every build
- **npm audit:** Frontend dependency scanning
- **Gradle dependency check:** Backend dependency scanning

**Dynamic Analysis:**
- **OWASP ZAP:** (Planned) Automated security testing
- **Penetration testing:** (Planned) Annual third-party pen tests

**Compliance Scanning:**
- JaCoCo code coverage enforcement (80% backend, 60% frontend)
- Linting and code quality checks
- License compliance checking

### Monitoring & Detection

**Real-Time Monitoring:**
- Application performance monitoring (Prometheus + Grafana)
- Log aggregation and analysis (Loki)
- Distributed tracing (OpenTelemetry + Zipkin)
- Database query monitoring
- Failed authentication tracking

**Alerting:**
- 50+ alert rules configured
- Slack notifications for critical alerts (#liyaqa-critical)
- PagerDuty integration for on-call engineers
- Alert escalation matrix defined

**Audit Logging:**
- All authentication events logged
- Authorization failures logged
- Administrative actions logged
- Data access audit trail
- Logs retained for 30 days minimum

### Backup & Recovery

**Automated Backups:**
- Daily database backups (2 AM KSA)
- Backups encrypted and stored in AWS S3
- 30-day backup retention
- Automated backup verification
- Point-in-time recovery capability

**Disaster Recovery:**
- Documented disaster recovery plan (RTO: 4 hours, RPO: 24 hours)
- Regular backup restore testing
- Failover procedures documented
- Incident response plan in place

---

## Compliance

Liyaqa is designed with the following compliance frameworks and regulations in mind:

### GDPR (General Data Protection Regulation)

**Data Protection Rights:**
- Right to access: Users can export their data
- Right to rectification: Users can update their data
- Right to erasure: Users can request data deletion
- Right to data portability: Data export in machine-readable format
- Right to object: Users can object to data processing

**GDPR Compliance Features:**
- Privacy policy published and accessible
- Cookie consent implementation
- Data processing records maintained
- Data retention policy (30 days for logs, 7 years for financial records)
- Data breach notification procedures (<72 hours)
- Privacy by design and default

### Saudi Data Protection Law

**Compliance Features:**
- Data residency options (Saudi Arabia hosting available)
- Arabic language support
- Local payment methods (STC Pay, SADAD, Mada)
- ZATCA e-invoicing integration
- Gender-based access control compliance
- Prayer time integration

### PCI DSS (Payment Card Industry Data Security Standard)

**For Payment Processing:**
- No storage of full credit card numbers (use payment gateway tokens)
- PCI-compliant payment gateway integration (PayTabs)
- Encrypted transmission of payment data (HTTPS/TLS)
- Access controls for payment-related functions
- Regular security testing

**Note:** Full PCI DSS compliance certification is the responsibility of the payment gateway provider. Liyaqa minimizes PCI scope by not storing sensitive payment data.

### ISO 27001 (Planned)

**Information Security Management:**
- Risk assessment procedures
- Security policies and procedures documented
- Access control and authentication
- Incident management process
- Business continuity planning
- Regular security audits

---

## Security Contacts

### Primary Security Contact

**Email:** security@liyaqa.com
**Response Time:** Within 24 hours
**PGP Key:** [Available on request]

### Secondary Contacts

**DevOps Lead:** devops@liyaqa.com
**CTO:** cto@liyaqa.com (for escalations)

### Emergency Contact

For **critical, time-sensitive security issues** (e.g., active data breach, ongoing attack):

**GitHub Security Advisory:** Use the "Report a vulnerability" button in the Security tab
**Phone:** +966 [REDACTED] (CTO - emergency only, 24/7)

---

## Security Hall of Fame

We recognize and thank security researchers who responsibly disclose vulnerabilities:

| Researcher | Date | Vulnerability Type | Severity |
|------------|------|-------------------|----------|
| *Be the first!* | - | - | - |

**Want to be listed?** Report a valid security vulnerability following this policy.

---

## Security Roadmap

### Current (Q1 2026)

- [x] HTTPS/TLS encryption
- [x] JWT authentication
- [x] Role-based access control
- [x] Rate limiting
- [x] Automated security scanning (Trivy, CodeQL)
- [x] Dependency update automation (Dependabot)
- [x] Security policy published

### Planned (Q2-Q3 2026)

- [ ] Two-factor authentication (2FA)
- [ ] OAuth 2.0 integration (Google, Microsoft)
- [ ] OWASP ZAP automated scanning
- [ ] Annual penetration testing
- [ ] Bug bounty program launch
- [ ] SOC 2 Type II compliance
- [ ] ISO 27001 certification (initiate)

### Planned (Q4 2026)

- [ ] Security awareness training for all users
- [ ] Advanced threat detection (AI/ML-based)
- [ ] Intrusion detection system (IDS)
- [ ] Web application firewall (WAF)
- [ ] DDoS protection (Cloudflare Enterprise)

---

## Additional Resources

### Documentation

- **Production Runbook:** `/docs/PRODUCTION_RUNBOOK.md`
- **Incident Response Guide:** `/docs/INCIDENT_RESPONSE.md`
- **Deployment Guide:** `/docs/DEPLOYMENT_GUIDE.md`
- **Architecture Documentation:** `/docs/ARCHITECTURE.md`
- **API Reference:** `/docs/API_REFERENCE.md`

### External Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **CWE Top 25:** https://cwe.mitre.org/top25/
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework
- **CVE Database:** https://cve.mitre.org/
- **GitHub Security Advisories:** https://github.com/advisories

### Security Tools

- **Trivy Scanner:** https://github.com/aquasecurity/trivy
- **CodeQL:** https://codeql.github.com/
- **OWASP Dependency-Check:** https://owasp.org/www-project-dependency-check/
- **TruffleHog (Secret Scanning):** https://github.com/trufflesecurity/trufflehog
- **npm audit:** Built into npm

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-31 | 1.0 | Initial security policy | Security Team |

---

**Last Updated:** 2026-01-31
**Policy Version:** 1.0
**Next Review:** 2026-04-30 (quarterly review)

---

## Acknowledgments

This security policy is based on best practices from:
- GitHub Security Policies
- OWASP Security Disclosure Practices
- ISO/IEC 29147 (Vulnerability Disclosure)
- Coordinated Vulnerability Disclosure (CERT/CC)

Thank you to all security researchers who help keep Liyaqa secure!
