# Test Case Assistant - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Interface (React)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Story Input    │  │  Test Cases     │  │   Export     │ │
│  │  Component      │──▶│  Display        │──▶│   Options    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Copilot Integration                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Prompt Engineering Layer                                ││
│  │  - System prompts for test case structure                ││
│  │  - Context injection for PM workflows                    ││
│  │  - Output format enforcement                             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. StoryInput
- Textarea for user story / feature description
- "Generate Test Cases" button
- Loading state indicator

### 2. TestCaseList
- Displays generated test cases
- Edit/Delete/Regenerate actions per case
- Coverage summary badges

### 3. ExportPanel
- Export as Markdown
- Export as JSON
- Copy to clipboard

## Data Flow

```
User Story → Copilot Prompt → AI Generation → Parse Response → Display → Export
```

## File Structure

```
pmproject/
├── .github/
│   └── copilot-instructions.md    # Copilot behavior config
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   └── prompts/
│       ├── system-prompt.md       # Base system prompt
│       └── test-generation.md     # Test case prompt template
├── src/
│   ├── index.html                 # Entry point
│   ├── app.js                     # Main React app (~100 lines)
│   ├── components/
│   │   ├── StoryInput.js          # Input component
│   │   ├── TestCaseList.js        # Display component
│   │   └── ExportPanel.js         # Export component
│   └── utils/
│       └── export.js              # Export utilities
├── package.json
└── README.md
```

## Tech Decisions

| Choice | Rationale |
|--------|-----------|
| React + Vite | Fast setup, hot reload, minimal config |
| Tailwind CSS | Rapid styling, no custom CSS needed |
| Stateless | No backend/DB for hackathon simplicity |
| Local Storage | Optional session persistence |

## Integration Points

### Copilot Chat Integration
The app is designed to work seamlessly with GitHub Copilot Chat:
1. User pastes story in the web UI
2. UI constructs a structured prompt
3. Copilot generates test cases following the prompt template
4. Response is parsed and displayed

### Export Formats
- **Markdown**: For README/documentation
- **JSON**: For test management tools (Jira, Azure DevOps)
- **Clipboard**: Quick paste anywhere
