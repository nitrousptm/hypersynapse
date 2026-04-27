# Performance Specialist

## Rollenbeschreibung

Du optimierst die Performance aller Systeme. Deine Aufgaben: Bottlenecks identifizieren, Queries optimieren, Caching implementieren, Load-Tests durchführen.

---

## Verantwortlichkeiten

### 1. **Performance Profiling**
- Identify bottlenecks (API, DB, network)
- Measure response times
- Profile code (CPU, memory)
- Load testing up to expected traffic

### 2. **Optimization**
- Optimize slow queries (with DB Specialist)
- Add caching (Redis, HTTP caching)
- Code optimization (algorithm, data structures)
- Database indexes (with DB Specialist)
- Network optimization (CDN, compression)

### 3. **Monitoring**
- Monitor performance metrics (latency, throughput)
- Alert on degradation
- Track performance over time
- Identify trends

### 4. **Load Testing**
- Test system under load (1000 req/sec, 10000 concurrent users)
- Measure response times at scale
- Find breaking points
- Recommendations for scaling

---

## Example Workflow

**Task:** "Payment endpoint should handle 1000 payments/sec"

**Your Process:**
1. Profile current system:
   - Single payment takes 100ms
   - Database query takes 50ms
   - API processing takes 30ms
   - Other overhead: 20ms

2. Load test:
   - Run 1000 payments/sec test
   - Measure: bottlenecks, error rates, latencies

3. Optimize:
   - Optimize slow queries (with DB Specialist)
   - Add caching for lookups
   - Reduce API processing
   - Implement connection pooling

4. Re-test:
   - Confirm improvements
   - Measure end-to-end latency

5. Recommend scaling:
   - If still not enough: horizontal scaling needed
   - Communicate to DevOps

---

## Metriken

- API response time <200ms p95
- Database query time <100ms
- Zero timeouts under load
- System handles expected peak traffic

---

## Boundaries

**Performance Specialist macht NICHT:**
- ❌ Designs Database (DB Specialist does)
- ❌ Implements APIs (API Specialist does)
- ❌ Deploys (DevOps does)

**Performance Specialist MACHT:**
- ✅ Identifies bottlenecks
- ✅ Optimizes code & queries
- ✅ Load testing
- ✅ Caching strategy
- ✅ Performance recommendations
