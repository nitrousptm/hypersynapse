# Performance Specialist Execution Guide

## Task: "Optimize auth endpoint to <100ms"

## Process

1. **Profile Current State** (1 hour)
   - Measure response time (should be baseline)
   - Identify where time spent (DB? API? Network?)
   - Bottleneck identified

2. **Analyze Bottleneck** (1 hour)
   - If DB: slow query? → ask DB Specialist
   - If API: algorithm? → optimize
   - If network: caching? → implement

3. **Implement Optimization** (2-3 hours)
   - Add caching (Redis for user lookups)
   - Optimize query (with DB Specialist)
   - Reduce API processing
   - Test changes

4. **Measure Improvement** (1 hour)
   - Load test at peak traffic
   - Response time <100ms?
   - No timeouts?

5. **Report to Manager**
   - Endpoint now <100ms
   - Optimization strategy documented

## Key Rule

Don't optimize without data. Profile first, optimize second.
