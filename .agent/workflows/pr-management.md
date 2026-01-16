---
description: Agent 8 - PR Management workflow for reviewing all pull requests
---

# PR Management Workflow

This agent is responsible for reviewing all pull requests, ensuring code quality, consistency, and alignment with project standards.

## Review Checklist

### 1. Fetch and Analyze the PR

// turbo

```bash
git fetch origin
git log origin/main..HEAD --oneline
```

### 2. Code Quality Review

- [ ] Code follows project coding standards and conventions
- [ ] No unnecessary code duplication
- [ ] Functions and classes are appropriately sized and focused
- [ ] Variable and function names are descriptive and consistent
- [ ] Comments are meaningful and up-to-date

### 3. Architecture Review

- [ ] Changes align with the existing project architecture
- [ ] New components are placed in appropriate directories
- [ ] Dependencies are properly managed (no circular dependencies)
- [ ] Separation of concerns is maintained (main process vs renderer)

### 4. Security Review

- [ ] No hardcoded secrets or API keys
- [ ] SmartThings tokens are handled securely
- [ ] User input is properly validated
- [ ] No known security vulnerabilities introduced

### 5. Performance Review

- [ ] No unnecessary re-renders in UI components
- [ ] API calls are optimized (batching, caching where appropriate)
- [ ] Memory leaks are avoided (proper cleanup of listeners)
- [ ] Electron IPC communication is efficient

### 6. Testing Review

- [ ] Unit tests are included for new functionality
- [ ] Existing tests still pass
- [ ] Edge cases are covered
- [ ] Mock data is appropriate

### 7. Documentation Review

- [ ] README is updated if needed
- [ ] Code is self-documenting or has appropriate comments
- [ ] API changes are documented
- [ ] Breaking changes are clearly noted

### 8. Run Automated Checks

// turbo

```bash
npm run lint 2>/dev/null || echo "Lint script not configured"
npm run test 2>/dev/null || echo "Test script not configured"
npm run build 2>/dev/null || echo "Build script not configured"
```

## PR Review Report Template

After reviewing, generate a report with the following structure:

```markdown
## PR Review Summary

**PR Title:** [Title]
**Author:** [Author]
**Branch:** [feature-branch] → [target-branch]

### ✅ Approved / ⚠️ Changes Requested / ❌ Rejected

### Findings

#### Code Quality

- [Findings...]

#### Security

- [Findings...]

#### Performance

- [Findings...]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

### Action Items

- [ ] [Required change 1]
- [ ] [Required change 2]
```

## Integration with Other Agents

- **Agent 6 (QA & Testing):** Coordinate on test coverage requirements
- **Agent 7 (Bug Tracking):** Flag any bugs found during review
- **Architecture Agent:** Consult on significant architectural changes
