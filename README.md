# PM Command Center

An AI-powered command center for Product Managers - generate test cases, track releases, analyze story gaps, and monitor PRs without touching code.

![PM Command Center](https://img.shields.io/badge/Powered%20by-GitHub%20Copilot-blue)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## ✨ Features

### 🧪 Test Case Generator
- Enter a user story, get comprehensive test cases via Copilot
- Coverage categories: happy path, edge cases, negative tests, security, accessibility
- Export to Markdown or JSON

### 📊 PM Dashboard
- Live GitHub integration for real-time metrics
- Test coverage tracking, backlog health, risk indicators

### 🚀 Release Readiness
- Milestone-based tracking with completion percentages
- Blocker identification and missing test detection
- Auto-generated release notes

### 🔍 Story Gap Analyzer
- AI-powered analysis of user stories
- Finds missing acceptance criteria, edge cases, security/accessibility gaps
- Quality scoring per story

### 📦 PR Summary View
- PM-friendly pull request overview
- Review status, CI checks, linked issues
- No code reading required

## 📁 Project Structure

```
pmproject/
├── .github/copilot-instructions.md   # Copilot behavior config
├── docs/
│   ├── ARCHITECTURE.md               # System design
│   └── prompts/                       # AI prompt templates
├── src/
│   ├── App.jsx                        # Main application
│   ├── components/                    # React components
│   └── utils/export.js                # Export utilities
└── package.json
```

## 🤖 Using with Copilot

This tool is designed to work with GitHub Copilot Chat. Use the prompt templates in `docs/prompts/` to generate test cases:

1. Open Copilot Chat in VS Code
2. Paste your user story with the prompt template
3. Copy generated test cases into the app
4. Refine and export

## 🎯 Test Case Format

Generated test cases follow this structure:

```markdown
### TC-001: Test Case Title
**Priority:** High/Medium/Low
**Type:** Functional/Edge Case/Negative/Security/Accessibility
**Preconditions:** Setup requirements
**Steps:**
1. Action step
2. Action step
**Expected Result:** Success criteria
**Automation Ready:** Yes/No
```

## 📦 Tech Stack

- React 18 + Vite
- Tailwind CSS
- Stateless (no backend required)

## 🏆 Hackathon Goals

- [x] AI-powered test case generation
- [x] PM Dashboard with live GitHub data
- [x] Release readiness tracking
- [x] Story gap analysis
- [x] PR summary view for PMs
- [x] Elegant, intuitive UX

---

Built with ❤️ for the GitHub Copilot Hackathon
