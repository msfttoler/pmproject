import { useState } from 'react'
import StoryInput from './components/StoryInput'
import TestCaseList from './components/TestCaseList'
import ExportPanel from './components/ExportPanel'
import CopilotPasteModal from './components/CopilotPasteModal'
import Dashboard from './components/Dashboard'
import ReleaseReadiness from './components/ReleaseReadiness'
import StoryGapAnalyzer from './components/StoryGapAnalyzer'
import PRSummaryView from './components/PRSummaryView'
import StoryPointsEstimator from './components/StoryPointsEstimator'
import CICDPipelines from './components/CICDPipelines'
import GitHubConfig from './components/GitHubConfig'
import Settings, { useSettings } from './components/Settings'
import { parseTestCases } from './utils/parser'

export default function App() {
  const [story, setStory] = useState('')
  const [testCases, setTestCases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showGitHubConfig, setShowGitHubConfig] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [copilotPrompt, setCopilotPrompt] = useState('')
  const [activeTab, setActiveTab] = useState('generator')
  const [configRefresh, setConfigRefresh] = useState(0)
  
  const { settings, toggleFeature } = useSettings()

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

  const handleGenerateFromRisk = (storyTitle) => {
    setStory(`As a user, I want to ${storyTitle.toLowerCase()} so that I can complete my task successfully.`)
    setActiveTab('generator')
  }

  const handleConfigureGitHub = () => {
    setShowGitHubConfig(true)
  }

  const handleGitHubConfigSave = () => {
    setShowGitHubConfig(false)
    setConfigRefresh(prev => prev + 1) // trigger re-render of components
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎯 PM Command Center
            <span className="text-sm font-normal text-slate-400">Powered by GitHub Copilot</span>
          </h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 bg-slate-800 rounded-lg p-1">
              {settings.features.testCases && (
                <button
                  onClick={() => setActiveTab('generator')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'generator' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧪 Test Cases
                </button>
              )}
              {settings.features.dashboard && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📊 Dashboard
                </button>
              )}
              {settings.features.releases && (
                <button
                  onClick={() => setActiveTab('releases')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'releases' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚀 Releases
                </button>
              )}
              {settings.features.storyGaps && (
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'gaps' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔍 Story Gaps
                </button>
              )}
              {settings.features.prs && (
                <button
                  onClick={() => setActiveTab('prs')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'prs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📦 PRs
                </button>
              )}
              {settings.features.estimator && (
                <button
                  onClick={() => setActiveTab('estimator')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'estimator' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎯 Estimator
                </button>
              )}
              {settings.features.cicd && (
                <button
                  onClick={() => setActiveTab('cicd')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'cicd' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔧 CI/CD
                </button>
              )}
            </nav>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'generator' && settings.features.testCases && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <StoryInput story={story} setStory={setStory} onGenerate={generateTestCases} />
            </section>
            <section className="space-y-4">
              <TestCaseList testCases={testCases} setTestCases={setTestCases} />
              {testCases.length > 0 && <ExportPanel testCases={testCases} story={story} />}
            </section>
          </div>
        )}
        {activeTab === 'dashboard' && settings.features.dashboard && (
          <Dashboard onGenerateTests={handleGenerateFromRisk} />
        )}
        {activeTab === 'releases' && settings.features.releases && (
          <div>
            <h2 className="text-xl font-bold mb-4">🚀 Release Readiness</h2>
            <ReleaseReadiness key={configRefresh} onGenerateTests={handleGenerateFromRisk} onConfigureGitHub={handleConfigureGitHub} />
          </div>
        )}
        {activeTab === 'gaps' && settings.features.storyGaps && (
          <div>
            <h2 className="text-xl font-bold mb-4">🔍 Story Gap Analyzer</h2>
            <StoryGapAnalyzer key={configRefresh} onGenerateTests={handleGenerateFromRisk} onConfigureGitHub={handleConfigureGitHub} />
          </div>
        )}
        {activeTab === 'prs' && settings.features.prs && (
          <div>
            <h2 className="text-xl font-bold mb-4">📦 Pull Request Summary</h2>
            <PRSummaryView key={configRefresh} onConfigureGitHub={handleConfigureGitHub} />
          </div>
        )}
        {activeTab === 'estimator' && settings.features.estimator && (
          <div>
            <h2 className="text-xl font-bold mb-4">🎯 Story Points Estimator</h2>
            <StoryPointsEstimator key={configRefresh} onConfigureGitHub={handleConfigureGitHub} />
          </div>
        )}
        {activeTab === 'cicd' && settings.features.cicd && (
          <div>
            <h2 className="text-xl font-bold mb-4">🔧 CI/CD Pipelines</h2>
            <CICDPipelines key={configRefresh} onConfigureGitHub={handleConfigureGitHub} />
          </div>
        )}
      </main>

      {showModal && (
        <CopilotPasteModal
          prompt={copilotPrompt}
          onPaste={handlePasteFromCopilot}
          onClose={() => setShowModal(false)}
        />
      )}

      {showGitHubConfig && (
        <GitHubConfig
          config={(() => {
            try {
              return JSON.parse(localStorage.getItem('github-config') || '{}')
            } catch {
              return {}
            }
          })()}
          onClose={() => setShowGitHubConfig(false)}
          onSave={(newConfig) => {
            try {
              localStorage.setItem('github-config', JSON.stringify(newConfig))
            } catch (e) {
              console.error('Failed to save config:', e)
            }
            setShowGitHubConfig(false)
            setConfigRefresh(prev => prev + 1)
          }}
        />
      )}

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onToggleFeature={toggleFeature}
        onPlatformChange={() => setConfigRefresh(prev => prev + 1)}
      />
    </div>
  )
}
