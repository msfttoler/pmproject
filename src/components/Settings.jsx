import { useState, useEffect } from 'react'
import PlatformConfig from './PlatformConfig'

const DEFAULT_SETTINGS = {
  features: {
    testCases: true,
    dashboard: true,
    releases: true,
    storyGaps: true,
    prs: true,
    estimator: true
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pm-command-center-settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    try {
      localStorage.setItem('pm-command-center-settings', JSON.stringify(merged))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  const toggleFeature = (feature) => {
    updateSettings({
      features: {
        ...settings.features,
        [feature]: !settings.features[feature]
      }
    })
  }

  return { settings, updateSettings, toggleFeature }
}

export default function Settings({ isOpen, onClose, settings, onToggleFeature, onPlatformChange }) {
  const [activeTab, setActiveTab] = useState('features')

  if (!isOpen) return null

  const features = [
    { key: 'testCases', label: 'Test Cases', icon: '🧪', description: 'Generate test cases from user stories' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊', description: 'PM dashboard with live GitHub metrics' },
    { key: 'releases', label: 'Releases', icon: '🚀', description: 'Track release readiness by milestone' },
    { key: 'storyGaps', label: 'Story Gaps', icon: '🔍', description: 'Analyze stories for missing requirements' },
    { key: 'prs', label: 'PRs', icon: '📦', description: 'Monitor pull requests without code' },
    { key: 'estimator', label: 'Estimator', icon: '🎯', description: 'AI-powered story point estimation' }
  ]

  const enabledCount = Object.values(settings.features).filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-600 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">⚙️ Settings</h2>
          <p className="text-slate-400 text-sm mt-1">
            Customize your PM Command Center experience
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'features' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎛️ Features
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'platforms' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔗 Platforms
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'features' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-200">Feature Toggles</h3>
                <span className="text-sm text-slate-400">{enabledCount} of {features.length} enabled</span>
              </div>
              
              <div className="space-y-3">
                {features.map(feature => (
                  <div 
                    key={feature.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition ${
                      settings.features[feature.key] 
                        ? 'bg-slate-700/50 border-slate-600' 
                        : 'bg-slate-900/50 border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{feature.icon}</span>
                      <div>
                        <p className="font-medium text-slate-200">{feature.label}</p>
                        <p className="text-xs text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFeature(feature.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.features[feature.key] ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span 
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.features[feature.key] ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {enabledCount === 0 && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ All features are disabled. Enable at least one to use the app.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'platforms' && (
            <div className="text-slate-100">
              <PlatformConfig onConfigChange={onPlatformChange} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
