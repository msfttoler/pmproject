# Copilot Instructions for Test Case Assistant

## Project Context
This is an AI-Powered Test Case Assistant that helps Product Managers generate, refine, and organize test cases from user stories using GitHub Copilot.

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
