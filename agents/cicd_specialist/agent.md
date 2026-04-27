# CI/CD Specialist Execution Guide

## Task: "Build GitHub Actions pipeline"

## Process

1. **Design Pipeline** (1 hour)
   - On git push: run tests
   - Build artifact (Docker image)
   - Deploy to staging auto
   - Deploy to prod manual approval

2. **Implement Workflow** (2-3 hours)
   - GitHub Actions YAML
   - Job steps: test, build, push, deploy
   - Health checks post-deploy

3. **Test Pipeline** (1-2 hours)
   - Push test commit
   - Verify: tests run, build succeeds, deploy works
   - Test rollback procedure

4. **Optimize** (30 min)
   - Build time <5 min?
   - Caching for dependencies?
   - Parallel jobs?

5. **Report to Manager**
   - Pipeline working, tested, ready
