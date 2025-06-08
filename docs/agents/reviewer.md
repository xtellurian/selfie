# Reviewer Agent
## Performs automated code review and quality assurance

### Purpose
The Reviewer Agent automatically reviews pull requests, checks code quality, runs tests, and provides feedback to ensure high-quality code contributions. It can also be used to review existing code for improvements.

### Input Source
- Pull request events from GitHub webhooks
- Manual triggers for specific PRs
- Scheduled reviews of recent changes
- Issues labeled with `agent:reviewer`

### Responsibilities
- Analyze pull request changes for quality and consistency
- Run automated tests and check coverage
- Verify code follows project standards and conventions
- Check for security vulnerabilities and best practices
- Review documentation updates
- Provide constructive feedback and suggestions
- Approve or request changes on pull requests

### Usage
```bash
./start.sh reviewer --pr <pr_number> [options]
```

### Options
- `--pr <number>` - Pull request number to review (required)
- `--full-review` - Perform comprehensive review including dependencies
- `--security-only` - Focus only on security aspects
- `--style-only` - Focus only on code style and formatting
- `--auto-approve` - Automatically approve if all checks pass

### Environment Variables
- `GITHUB_TOKEN` - GitHub personal access token (required)
- `GITHUB_OWNER` - Repository owner (required)
- `GITHUB_REPO` - Repository name (required)

### Examples
```bash
# Review a specific pull request
./start.sh reviewer --pr 456

# Perform comprehensive security review
./start.sh reviewer --pr 456 --security-only

# Review with auto-approval for simple changes
./start.sh reviewer --pr 456 --auto-approve
```

### Review Criteria

#### Code Quality
- [ ] Code follows project style guidelines
- [ ] Functions and classes are properly documented
- [ ] Error handling is appropriate
- [ ] No code duplication or dead code
- [ ] Performance considerations addressed

#### Testing
- [ ] New functionality has corresponding tests
- [ ] Test coverage is maintained or improved
- [ ] Tests are comprehensive and meaningful
- [ ] Edge cases are covered
- [ ] Integration tests pass

#### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation is properly implemented
- [ ] SQL injection prevention measures
- [ ] XSS prevention where applicable
- [ ] Authentication and authorization checks

#### Documentation
- [ ] README updated if needed
- [ ] API documentation current
- [ ] Code comments explain complex logic
- [ ] Change log updated for significant changes

#### Compatibility
- [ ] Backward compatibility maintained
- [ ] Breaking changes properly documented
- [ ] Dependencies updated appropriately
- [ ] Browser/environment compatibility verified

### Review Output
The Reviewer Agent provides:

1. **Overall Assessment**
   - APPROVE, REQUEST_CHANGES, or COMMENT
   - Summary of findings
   - Risk assessment

2. **Detailed Feedback**
   - Line-by-line comments where needed
   - Suggestions for improvements
   - Links to relevant documentation

3. **Automated Checks**
   - Test results and coverage reports
   - Linting and formatting issues
   - Security scan results
   - Performance impact analysis

### Auto-Review Rules
The agent will automatically:
- **APPROVE** if all checks pass and changes are low-risk
- **COMMENT** if there are minor suggestions but no blocking issues
- **REQUEST_CHANGES** if there are significant issues that must be addressed

### Integration Points
- GitHub pull request reviews
- Status checks on PR branches
- Integration with CI/CD pipeline
- Code quality metrics tracking

### Implementation Script
Location: `scripts/reviewer.sh`

The implementation script should:
1. Fetch pull request details and changed files
2. Run automated tests and quality checks
3. Analyze code for patterns and issues
4. Check security vulnerabilities
5. Verify documentation completeness
6. Generate comprehensive review comments
7. Set appropriate review status
8. Update PR with findings and recommendations