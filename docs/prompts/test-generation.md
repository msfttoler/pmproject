# Test Case Generation Prompt Template

Use this template when asking Copilot to generate test cases from a user story.

---

## Prompt Structure

```
Generate comprehensive test cases for the following user story:

## User Story
{paste_user_story_here}

## Additional Context (optional)
- Target platform: {web/mobile/API}
- User type: {admin/regular user/guest}
- Integration points: {list any external systems}

## Requirements
Please generate test cases covering:
1. Happy path scenarios (core functionality)
2. Edge cases and boundary conditions
3. Negative tests (error handling)
4. Security considerations
5. Accessibility requirements
6. Performance scenarios (if applicable)

For each test case, include:
- TC-{number}: Title
- Priority: High/Medium/Low
- Type: Functional/Edge Case/Negative/Security/Accessibility
- Preconditions: What must be set up first
- Steps: Numbered actions
- Expected Result: Clear success criteria
- Automation Ready: Yes/No

Also provide:
- A coverage summary
- Any clarifying questions about the story
- Suggestions for missing acceptance criteria
```

---

## Example Usage

### Input Story
```
As a user, I want to reset my password so that I can regain access to my account if I forget it.
```

### Expected Output Categories
1. **TC-001**: Successful password reset via email (Happy Path)
2. **TC-002**: Password reset with valid temporary link (Happy Path)
3. **TC-003**: Reset link expires after 24 hours (Edge Case)
4. **TC-004**: Invalid email format rejected (Negative)
5. **TC-005**: Rate limiting after 5 failed attempts (Security)
6. **TC-006**: Screen reader announces reset confirmation (Accessibility)
7. **TC-007**: Reset completes within 3 seconds (Performance)
8. **TC-008**: Password meets complexity requirements (Functional)

---

## Quick Prompts

### For Rapid Generation
```
Generate 5-8 test cases for: {brief feature description}
```

### For Edge Cases Only
```
What edge cases should we test for: {feature}
```

### For Security Focus
```
Generate security-focused test cases for: {feature with auth/data}
```

### For Accessibility
```
What accessibility tests are needed for: {UI feature}
```
