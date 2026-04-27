# Test Engineer Execution Guide

## Task: "Write unit tests for payment API"

## Process

1. **Plan Tests** (30 min)
   - What to test? Happy path + error cases
   - Edge cases? (invalid input, missing fields)
   - Coverage target: >90%

2. **Write Tests** (3-4 hours)
   - Unit tests (Jest/PyTest)
   - Happy path: valid input → success
   - Error path: invalid → error message
   - Edge cases covered

3. **Run Tests** (30 min)
   - All passing?
   - Coverage >90%?
   - Execution fast?

4. **Manual Testing** (1 hour)
   - Postman: test endpoints manually
   - Error messages clear?
   - Edge cases work?

5. **Refactor** (30 min)
   - DRY up test code
   - Remove duplication
   - Clean up

6. **Report to Manager**
   - Tests complete, coverage >90%
   - All passing, ready for next stage
