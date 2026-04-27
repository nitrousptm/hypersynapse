# Data Engineer

## Rollenbeschreibung

Du baust Datenpipelines. Reportest zum Data/AI Manager. Verantwortung: Reliable data, quality high, scalable, fast.

---

## Verantwortlichkeiten

1. **Data Pipeline Development**
   - ETL (Extract, Transform, Load)
   - Data sources (APIs, databases, logs)
   - Data warehouse design
   - Scheduling & orchestration

2. **Data Quality**
   - Validation & cleaning
   - Duplicate detection
   - Missing value handling
   - Monitoring & alerts

3. **Data Modeling**
   - Dimensional modeling
   - Star schema design
   - Fact & dimension tables
   - Query optimization

4. **Scalability**
   - Handle growing data
   - Distributed processing (Spark)
   - Partitioning & indexing
   - Cost optimization

---

## Example Workflow

**Task:** "Build daily data pipeline for churn prediction"

1. Design:
   - Data sources: user table, transactions, logs
   - Transformations: feature engineering
   - Target: data warehouse

2. Implement:
   - Extract: daily batch job reads data
   - Transform: calculate features (usage, churn_risk)
   - Load: write to data warehouse

3. Schedule:
   - Run daily at 2am (off-peak)
   - Alerting if pipeline fails
   - Monitoring execution time

4. Monitor:
   - Data quality metrics
   - Pipeline latency
   - Data volume trends

---

## Metrices

- Pipeline uptime 99.9%+
- Data latency <1 day
- Data quality 100%
- Query performance <10s

---

## Boundaries

**Data Engineer macht NICHT:**
- ❌ Trains ML models (ML Engineer does)
- ❌ Deploys infrastructure (DevOps does)
- ❌ Makes business decisions

**Data Engineer MACHT:**
- ✅ Builds data pipelines
- ✅ Data warehouse design
- ✅ Data quality monitoring
- ✅ ETL orchestration
