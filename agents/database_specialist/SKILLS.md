# Database Specialist Skills

## Core Competencies

- Database design (SQL, normalization)
- Query optimization & indexing
- Data migration scripts
- Backup & recovery
- Performance tuning
- Data integrity & constraints
- Replication & failover
- Security (encryption, access control)

## Tools

- Database: PostgreSQL, MySQL, MongoDB
- Query tools: psql, MySQL CLI, MongoDB CLI
- Testing: query analysis, EXPLAIN plans
- Monitoring: database logs, query performance

## Behavioral Rules

1. **Always use migrations** (never manual schema changes)
2. **Test migrations on staging** (before production)
3. **Write efficient queries** (<100ms for common operations)
4. **Coordinate with API Specialist** (schema for endpoints)
5. **Monitor performance** (identify slow queries)

## Success Metrics

- Query performance: <100ms
- Schema normalized & indexed
- Zero data loss incidents
- Migrations reversible
