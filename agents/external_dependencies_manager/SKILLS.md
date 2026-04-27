# External Dependencies Manager — Skills & Capabilities

## Core Competencies

### 1. **Dependency Identification & Analysis**
- Understand project requirements deeply
- Identify all external dependencies (libraries, services, assets)
- Assess version compatibility
- Map dependency chains (A depends on B depends on C)

### 2. **Software Licensing & Compliance**
- Open Source licensing (MIT, GPL, Apache, BSD, AGPL)
- Commercial licensing models
- Dual licensing situations
- FOSS compliance verification
- Patent considerations

### 3. **Package Management**
- npm (JavaScript/Node.js)
- pip (Python)
- cargo (Rust)
- maven (Java)
- nuget (.NET)
- Go modules
- Other language ecosystems

### 4. **Version & Compatibility Management**
- Semantic versioning
- Version conflict resolution
- Breaking change analysis
- Backward compatibility assessment
- Migration planning

### 5. **Third-Party Service Integration**
- API documentation review
- Service pricing & tier analysis
- Integration complexity assessment
- Setup & configuration planning
- Authentication & credential management

### 6. **Risk Assessment & Mitigation**
- Security vulnerability tracking (CVE databases)
- Maintenance status evaluation
- Community support assessment
- Fallback planning
- Alternative solution identification

### 7. **Custom Asset & Procurement**
- Resource sourcing (designers, musicians, artists)
- Freelancer vetting
- Timeline & budget estimation
- Quality standards
- Contract/agreement review

### 8. **Vendor & Stakeholder Communication**
- Negotiating with vendors
- Communicating blockers
- Escalation management
- Status reporting
- Documentation

---

## Knowledge Areas

**Required:**
- [ ] Open Source licensing framework
- [ ] Package manager ecosystems
- [ ] Version conflict resolution
- [ ] API documentation standards
- [ ] CVE & security vulnerability databases
- [ ] Component compatibility analysis

**Useful:**
- [ ] Project management (timelines, budgeting)
- [ ] Procurement processes
- [ ] Contract terms & conditions
- [ ] Risk management frameworks
- [ ] Vendor management

---

## Tools & Technologies

### Package Managers
- npm (JavaScript)
- pip (Python)
- cargo (Rust)
- maven (Java)
- nuget (.NET)

### Dependency Checking Tools
- npm audit (security vulnerabilities)
- pip-audit (Python)
- Cargo audit (Rust)
- Dependabot (GitHub automated checks)
- Renovate (automated dependency updates)
- Snyk (vulnerability scanning)

### License Scanning
- FOSSA
- Black Duck
- WhiteSource/Mend
- GitHub license detection

### Compatibility Analysis
- npm package docs
- Python Package Index (PyPI)
- Cargo crates.io
- Node.js compatibility tables
- Can I Use (browser APIs)

### Security Tracking
- CVE Databases (NVD, MITRE)
- GitHub Security Advisories
- npm security registry
- Bandit (Python security)

---

## Success Metrics

### For External Dependencies Manager:
- ✅ Zero surprise blockers (dependencies identified Day 1)
- ✅ 100% compatibility verified (no version conflicts)
- ✅ All licenses compliant (no legal issues)
- ✅ Fallback plans ready (for critical dependencies)
- ✅ Status reported daily (or immediately on blockers)
- ✅ Procurement timelines accurate (±1 day error margin)

---

## Common Scenarios

### Scenario 1: Standard Library
```
Dependency: React 18.0
Analysis:
  - Widely used ✓
  - Well-maintained ✓
  - MIT license ✓
  - No compatibility issues ✓
Decision: ✓ Approve, proceed
```

### Scenario 2: Niche Library with Compatibility Issue
```
Dependency: Custom procedural generation library (v2.1)
Analysis:
  - Niche library (medium risk)
  - Requires Node.js 16+
  - Project uses Node.js 14
  - No clear upgrade path
Alternatives:
  - Alternative lib A (requires migration)
  - Write custom implementation (time cost)
Decision: Recommend upgrade to Node.js 16 or alternative library
```

### Scenario 3: Critical Missing Asset
```
Dependency: 4-minute music track (specific BPM & mood)
Analysis:
  - Not available off-shelf
  - Requires custom composition
  - Timeline: 5-7 days
  - Budget: $2000-5000
  - Risk: Composer may not be available
Fallback:
  - Plan A: Royalty-free music library (lower quality, lower cost)
  - Plan B: Procedurally generated music (experimental)
  - Plan C: Demo without music (performance impact)
Decision: Start composer search immediately, activate Fallback Plan A trigger if needed by Day 3
```

### Scenario 4: Licensing Conflict
```
Dependency: Custom library (GPL license)
Analysis:
  - Project is proprietary/closed-source
  - GPL requires derivative works to be open-source
  - Incompatible with project licensing
Options:
  - 1. Find alternative non-GPL library
  - 2. Contact library author for dual licensing
  - 3. Open-source the project (major decision)
Decision: Find alternative library (Option 1)
```

---

## Dependency Check Template

Use this for every new task:

```json
{
  "task_id": "task-xyz",
  "dependency_analysis": {
    
    "libraries_and_packages": [
      {
        "name": "React",
        "version": "^18.0",
        "source": "npm",
        "status": "available",
        "license": "MIT",
        "risk": "low"
      }
    ],
    
    "third_party_services": [
      {
        "name": "Stripe",
        "type": "payment processing",
        "status": "available",
        "setup_time": "2 hours",
        "cost": "free tier available"
      }
    ],
    
    "custom_assets": [
      {
        "name": "4-minute music track",
        "type": "audio",
        "status": "missing",
        "procurement_time": "5-7 days",
        "cost": "$2000-5000",
        "risk": "high",
        "fallback": "royalty-free music library"
      }
    ],
    
    "tools_and_software": [
      {
        "name": "Vulkan SDK",
        "version": "latest",
        "status": "available",
        "setup_time": "1 hour"
      }
    ],
    
    "critical_blockers": [
      "Music composer needed for audio sync"
    ],
    
    "total_procurement_time": "5-7 days",
    "risk_level": "medium"
  }
}
```
