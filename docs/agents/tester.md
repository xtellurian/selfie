# Tester Agent
## Creates comprehensive test suites and validates functionality

### Purpose
The Tester Agent automatically generates test cases, creates test suites, and validates system functionality. It ensures comprehensive test coverage and can be used for both new features and regression testing.

### Input Source
- Issues labeled with `agent:tester`
- New code changes requiring test coverage
- Manual triggers for specific components
- Scheduled test generation for existing code

### Responsibilities
- Analyze code to identify testing requirements
- Generate unit tests for new functions and classes
- Create integration tests for complex workflows
- Write end-to-end tests for user scenarios
- Maintain and update existing test suites
- Run comprehensive test validation
- Report test coverage and quality metrics

### Usage
```bash
./start.sh tester [options]
```

### Options
- `--target <path>` - Specific file or directory to test
- `--type <unit|integration|e2e>` - Type of tests to generate
- `--coverage-target <percentage>` - Minimum coverage target (default: 80%)
- `--update-existing` - Update existing tests instead of creating new ones
- `--run-only` - Only run tests, don't generate new ones

### Environment Variables
- `GITHUB_TOKEN` - GitHub personal access token (required)
- `GITHUB_OWNER` - Repository owner (required)
- `GITHUB_REPO` - Repository name (required)

### Examples
```bash
# Generate tests for new code
./start.sh tester --target src/new-feature.ts

# Create integration tests only
./start.sh tester --type integration --target src/api/

# Update existing test suite
./start.sh tester --update-existing --target test/

# Run all tests and report coverage
./start.sh tester --run-only
```

### Test Types

#### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Cover edge cases and error conditions
- Verify input validation and output correctness
- Fast execution and isolated scope

#### Integration Tests
- Test component interactions
- Verify API endpoints and data flow
- Test database operations and transactions
- Validate configuration and environment setup
- Check cross-module functionality

#### End-to-End Tests
- Test complete user workflows
- Verify UI functionality and user experience
- Test critical business processes
- Validate system behavior under load
- Check deployment and production scenarios

### Test Generation Strategy

1. **Code Analysis**
   - Parse source code and identify testable units
   - Analyze function signatures and return types
   - Identify dependencies and external calls
   - Map data flow and state changes

2. **Test Case Generation**
   - Create positive test cases for expected behavior
   - Generate negative test cases for error conditions
   - Add boundary value tests for edge cases
   - Include performance and load tests where appropriate

3. **Mock and Fixture Creation**
   - Generate appropriate mocks for dependencies
   - Create test data and fixtures
   - Set up test environments and configurations
   - Implement test utilities and helpers

4. **Test Validation**
   - Verify tests actually test the intended functionality
   - Ensure tests are deterministic and reliable
   - Check test execution time and performance
   - Validate test coverage meets targets

### Test Standards
- Use Jest as the primary testing framework
- Follow existing naming conventions
- Include descriptive test names and documentation
- Group related tests in logical describe blocks
- Use appropriate assertions and matchers
- Clean up resources after test execution

### Coverage Requirements
- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: Cover all API endpoints and major workflows
- **E2E Tests**: Cover critical user journeys
- **Overall**: 80%+ overall coverage with no critical gaps

### Test Output
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle valid input correctly', () => {
      // Test implementation
    });

    it('should throw error for invalid input', () => {
      // Error case testing
    });

    it('should handle edge cases', () => {
      // Edge case testing
    });
  });
});
```

### Quality Metrics
- Test coverage percentage
- Test execution time
- Test reliability (flaky test detection)
- Code quality improvement impact
- Bug detection effectiveness

### Implementation Script
Location: `scripts/tester.sh`

The implementation script should:
1. Analyze target code for testing requirements
2. Generate appropriate test cases and suites
3. Create necessary mocks and fixtures
4. Run generated tests to verify correctness
5. Calculate and report coverage metrics
6. Update existing tests when code changes
7. Integrate with CI/CD pipeline for automated testing
8. Generate test reports and quality metrics