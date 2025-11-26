# AI-Powered Test Case Assistant

A lightweight web tool that helps Product Managers generate, refine, and organize test cases from user stories using GitHub Copilot.

![Test Case Assistant](https://img.shields.io/badge/Powered%20by-GitHub%20Copilot-blue)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## ✨ Features

- **AI-Powered Generation**: Enter a user story, get comprehensive test cases
- **Coverage Categories**: Happy path, edge cases, negative tests, security, accessibility
- **Iterative Refinement**: Edit, remove, or regenerate test cases
- **Export Options**: Markdown or JSON formats for easy integration

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
- [x] Minimal UI (~200 lines of code)
- [x] Export functionality
- [x] Elegant, intuitive UX

---

Built with ❤️ for the GitHub Copilot Hackathon
