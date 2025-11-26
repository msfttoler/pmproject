# Copilot Instructions for PM Command Center

## Project Context
This is the PM Command Center - an AI-powered tool that helps Product Managers with test case generation, story point estimation, release tracking, and cross-platform work item management using GitHub Copilot.

## Code Style Guidelines
- Use modern ES6+ JavaScript/TypeScript
- Keep components small and focused (< 50 lines)
- Use functional React components with hooks
- Prefer Tailwind CSS for styling
- Keep the codebase under ~200 lines total

## Test Case Generation Guidelines
When generating test cases from user stories, always include:

1. **Happy Path Tests** - Standard expected user flows
2. **Edge Cases** - Boundary conditions and limits
3. **Negative Tests** - Invalid inputs and error scenarios
4. **Security Considerations** - Auth, permissions, data validation
5. **Accessibility Tests** - Screen reader, keyboard navigation
6. **Performance Scenarios** - Load times, concurrent users

## Output Format
Test cases should be structured as:
```markdown
### TC-{number}: {Test Case Title}
**Priority:** High/Medium/Low
**Type:** Functional/Edge Case/Negative/Security/Accessibility
**Preconditions:** {setup required}
**Steps:**
1. {action}
2. {action}
**Expected Result:** {outcome}
**Automation Ready:** Yes/No
```

## Key Behaviors
- Always suggest at least 5-8 test cases per user story
- Highlight missing coverage areas
- Flag stories that need clarification before testing
- Suggest which tests are good candidates for automation
