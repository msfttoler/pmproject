# PM Command Center - VS Code Chat Extension

A VS Code Copilot Chat participant that helps Product Managers track releases, estimate stories, monitor CI/CD, and analyze story quality.

## Features

Use `@pm` in Copilot Chat to interact with your PM data:

### Commands

- **@pm /release** - Check release readiness and milestone progress
- **@pm /estimate [story]** - Get AI-powered story point estimates  
- **@pm /cicd** - View CI/CD pipeline status and health
- **@pm /gaps** - Find issues with missing labels or requirements
- **@pm /summary** - Get a full PM dashboard overview

### Natural Language

Just ask naturally:
- "Are we on track for the release?"
- "How many points should this OAuth story be?"
- "Why are the builds failing?"
- "Show me issues that need attention"

## Configuration

Set your repository in VS Code settings:

```json
{
  "pmCommandCenter.github.owner": "your-org",
  "pmCommandCenter.github.repo": "your-repo",
  "pmCommandCenter.azureDevOps.organization": "your-org",
  "pmCommandCenter.azureDevOps.project": "your-project"
}
```

## Supported Platforms

- ✅ GitHub Issues & Milestones
- ✅ GitHub Actions
- ✅ Azure DevOps Work Items
- ✅ Azure DevOps Pipelines

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

## Testing

1. Press F5 to launch Extension Development Host
2. Open Copilot Chat (Ctrl+Shift+I)
3. Type `@pm` and start asking questions!
