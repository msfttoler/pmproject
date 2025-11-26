import { useState } from 'react'
import StoryInput from './components/StoryInput'
import TestCaseList from './components/TestCaseList'
import ExportPanel from './components/ExportPanel'
import CopilotPasteModal from './components/CopilotPasteModal'
import Dashboard from './components/Dashboard'
import { parseTestCases } from './utils/parser'

export default function App() {
  const [story, setStory] = useState('')
  const [testCases, setTestCases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [copilotPrompt, setCopilotPrompt] = useState('')
  const [activeTab, setActiveTab] = useState('generator') // 'generator' | 'dashboard'

  const generateTestCases = () => {
    // Build the prompt for Copilot
    const prompt = `Generate comprehensive test cases for this user story:

${story}

For each test case, use this exact format:
### TC-{number}: {Title}
**Priority:** High/Medium/Low
**Type:** Functional/Edge Case/Negative/Security/Accessibility
**Steps:**
1. {step}
2. {step}
**Expected Result:** {outcome}
**Automation Ready:** Yes/No

Include: happy path, edge cases, negative tests, security, and accessibility scenarios.`
    
    setCopilotPrompt(prompt)
    setShowModal(true)
  }

  const handlePasteFromCopilot = (pastedText) => {
    const parsed = parseTestCases(pastedText)
    setTestCases(parsed)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ✅ Test Case Assistant
            <span className="text-sm font-normal text-slate-400">Powered by GitHub Copilot</span>
          </h1>
          <nav className="flex gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'generator' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🧪 Generator
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Dashboard
            </button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'generator' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <StoryInput story={story} setStory={setStory} onGenerate={generateTestCases} />
            </section>
            <section className="space-y-4">
              <TestCaseList testCases={testCases} setTestCases={setTestCases} />
              {testCases.length > 0 && <ExportPanel testCases={testCases} story={story} />}
            </section>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>

      {showModal && (
        <CopilotPasteModal
          prompt={copilotPrompt}
          onPaste={handlePasteFromCopilot}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
