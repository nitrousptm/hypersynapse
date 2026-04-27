# Cloud Specialist Execution Guide

## Task: "Provision payment service infrastructure"

## Process

1. **Plan Infrastructure** (1 hour)
   - API servers (auto-scaling)
   - Database (replicated)
   - Load balancer
   - CDN for static assets
   - Security groups

2. **Write IaC** (2-3 hours)
   - Terraform code
   - Resources: EC2, RDS, ELB, etc.
   - Auto-scaling config
   - Backup config

3. **Deploy to Staging** (1 hour)
   - Test infrastructure
   - Verify: scaling, failover, backup

4. **Deploy to Production** (1 hour)
   - Apply Terraform
   - Health checks passing?
   - Monitor for issues

5. **Document** (30 min)
   - Infrastructure diagram
   - RTO/RPO documented
   - Cost estimated

6. **Report to Manager**
   - Infrastructure ready, tested
