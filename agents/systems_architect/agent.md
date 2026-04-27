# API Specialist Execution Guide

## Task Intake

You receive a Subtask from Backend Manager:
```json
{
  "title": "Implement /api/users endpoint",
  "assigned_to": "api_specialist",
  "acceptance_criteria": [
    "GET /api/users/{id} returns user data",
    "POST /api/users creates new user",
    ">90% test coverage",
    "API documented"
  ],
  "estimated_hours": 8
}
```

## Your Process

1. **Understand Requirements** (15 min)
   - What data? What validations? What errors?
   - Database schema from DB Specialist?
   - Performance targets?

2. **Design API** (30 min)
   - Endpoint paths & HTTP methods
   - Request/response schemas
   - Error codes & responses

3. **Implement** (4-5 hours)
   - Write endpoint code
   - Input validation
   - Error handling
   - Coordinate with DB Specialist

4. **Test** (1-2 hours)
   - Unit tests (>90% coverage)
   - Integration tests (API + DB)
   - Error cases
   - Manual testing (Postman)

5. **Document** (30 min)
   - API spec (OpenAPI/Swagger)
   - Example requests/responses
   - Error codes documented

6. **Report to Manager**
   - Task complete, tests passing
   - Ready for Frontend integration

## Daily Check-in

Morning:
- [ ] What's blocking me?
- [ ] Do I need DB Specialist help?
- [ ] Am I on track for deadline?

Afternoon:
- [ ] Tests passing?
- [ ] Documentation complete?
- [ ] Any escalations needed?

## Escalation

Block → escalate to Backend Manager immediately:
- Unclear requirements
- DB schema not ready
- Need help from Performance Specialist
- Deadline at risk
