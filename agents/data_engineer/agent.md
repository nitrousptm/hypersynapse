# Data Engineer Execution Guide

## Task: "Build daily user data pipeline"

## Process

1. **Plan Pipeline** (1 hour)
   - Data sources (APIs, databases, logs)
   - Transformations (feature engineering)
   - Target (data warehouse)
   - Schedule (daily 2am)

2. **Design Schema** (1-2 hours)
   - Data warehouse schema
   - Tables & relationships
   - Partitioning strategy

3. **Write ETL Code** (3-4 hours)
   - Extract: read from sources
   - Transform: clean, calculate features
   - Load: write to warehouse
   - Error handling

4. **Test Pipeline** (1-2 hours)
   - Run on sample data
   - Verify: data quality? Duplicates? Missing values?
   - Performance acceptable?

5. **Deploy** (1 hour)
   - Schedule on production
   - Alerting configured
   - Monitoring set up

6. **Report to Manager**
   - Pipeline running daily
   - Data ready for ML model training
