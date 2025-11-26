import React, { useState, useEffect } from 'react'
import { 
  PLATFORMS, 
  getConfiguredPlatforms, 
  savePlatformConfig, 
  removePlatformConfig,
  GitHubConnector,
  AzureDevOpsConnector,
  JiraConnector
} from '../utils/platforms'

export default function PlatformConfig({ onConfigChange }) {
  const [configs, setConfigs] = useState({
    github: { owner: '', repo: '', token: '', enabled: false },
    azuredevops: { organization: '', project: '', team: '', token: '', enabled: false },
    jira: { domain: '', email: '', apiToken: '', projectKey: '', boardId: '', enabled: false }
  })
  const [testing, setTesting] = useState({})
  const [testResults, setTestResults] = useState({})
  const [expandedPlatform, setExpandedPlatform] = useState(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  function loadConfigs() {
    try {
      const github = JSON.parse(localStorage.getItem('github-config') || '{}')
      const ado = JSON.parse(localStorage.getItem('azuredevops-config') || '{}')
      const jira = JSON.parse(localStorage.getItem('jira-config') || '{}')

      setConfigs({
        github: { owner: '', repo: '', token: '', enabled: false, ...github },
        azuredevops: { organization: '', project: '', team: '', token: '', enabled: false, ...ado },
        jira: { domain: '', email: '', apiToken: '', projectKey: '', boardId: '', enabled: false, ...jira }
      })
    } catch (e) {
      console.error('Failed to load configs:', e)
    }
  }

  function updateConfig(platform, field, value) {
    setConfigs(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
    }))
    setTestResults(prev => ({ ...prev, [platform]: null }))
  }

  function saveConfig(platform) {
    const config = configs[platform]
    savePlatformConfig(platform, config)
    onConfigChange?.()
    setTestResults(prev => ({ ...prev, [platform]: { success: true, message: 'Saved!' } }))
  }

  function clearConfig(platform) {
    removePlatformConfig(platform)
    setConfigs(prev => ({
      ...prev,
      [platform]: platform === 'github' 
        ? { owner: '', repo: '', token: '', enabled: false }
        : platform === 'azuredevops'
          ? { organization: '', project: '', team: '', token: '', enabled: false }
          : { domain: '', email: '', apiToken: '', projectKey: '', boardId: '', enabled: false }
    }))
    setTestResults(prev => ({ ...prev, [platform]: null }))
    onConfigChange?.()
  }

  async function testConnection(platform) {
    setTesting(prev => ({ ...prev, [platform]: true }))
    setTestResults(prev => ({ ...prev, [platform]: null }))

    try {
      let connector
      const config = configs[platform]

      switch (platform) {
        case 'github':
          connector = new GitHubConnector(config)
          break
        case 'azuredevops':
          connector = new AzureDevOpsConnector(config)
          break
        case 'jira':
          connector = new JiraConnector(config)
          break
      }

      const success = await connector.testConnection()
      setTestResults(prev => ({
        ...prev,
        [platform]: success 
          ? { success: true, message: 'Connection successful!' }
          : { success: false, message: 'Connection failed. Check credentials.' }
      }))
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [platform]: { success: false, message: e.message }
      }))
    } finally {
      setTesting(prev => ({ ...prev, [platform]: false }))
    }
  }

  const configuredPlatforms = getConfiguredPlatforms()
  const hasAnyPlatform = configuredPlatforms.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Platform Connections</h3>
        {hasAnyPlatform && (
          <span className="text-sm text-green-600">
            {configuredPlatforms.length} platform{configuredPlatforms.length > 1 ? 's' : ''} connected
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600">
        Connect multiple work tracking platforms to aggregate data across your organization.
        Cross-platform learning improves story point estimation accuracy.
      </p>

      {/* Platform Cards */}
      <div className="space-y-4">
        {Object.entries(PLATFORMS).map(([key, platform]) => {
          const config = configs[key]
          const isExpanded = expandedPlatform === key
          const isConfigured = configuredPlatforms.some(p => p.type === key)
          const result = testResults[key]

          return (
            <div 
              key={key}
              className={`border rounded-lg overflow-hidden ${
                isConfigured ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedPlatform(isExpanded ? null : key)}
                className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">{platform.name}</div>
                    {isConfigured && (
                      <div className="text-xs text-green-600">Connected</div>
                    )}
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Config */}
              {isExpanded && (
                <div className="px-4 py-4 border-t border-slate-100 bg-white space-y-4">
                  {key === 'github' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Owner/Org</label>
                          <input
                            type="text"
                            value={config.owner}
                            onChange={e => updateConfig('github', 'owner', e.target.value)}
                            placeholder="microsoft"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Repository</label>
                          <input
                            type="text"
                            value={config.repo}
                            onChange={e => updateConfig('github', 'repo', e.target.value)}
                            placeholder="vscode"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
                        <input
                          type="password"
                          value={config.token}
                          onChange={e => updateConfig('github', 'token', e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">Requires 'repo' scope for private repositories</p>
                      </div>
                    </>
                  )}

                  {key === 'azuredevops' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                          <input
                            type="text"
                            value={config.organization}
                            onChange={e => updateConfig('azuredevops', 'organization', e.target.value)}
                            placeholder="mycompany"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                          <input
                            type="text"
                            value={config.project}
                            onChange={e => updateConfig('azuredevops', 'project', e.target.value)}
                            placeholder="MyProject"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Team (optional)</label>
                          <input
                            type="text"
                            value={config.team}
                            onChange={e => updateConfig('azuredevops', 'team', e.target.value)}
                            placeholder="MyTeam"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
                          <input
                            type="password"
                            value={config.token}
                            onChange={e => updateConfig('azuredevops', 'token', e.target.value)}
                            placeholder="xxxxxxxxxx"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">PAT requires Work Items (Read) scope</p>
                    </>
                  )}

                  {key === 'jira' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Jira Domain</label>
                          <input
                            type="text"
                            value={config.domain}
                            onChange={e => updateConfig('jira', 'domain', e.target.value)}
                            placeholder="yourcompany.atlassian.net"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Project Key</label>
                          <input
                            type="text"
                            value={config.projectKey}
                            onChange={e => updateConfig('jira', 'projectKey', e.target.value)}
                            placeholder="PROJ"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={config.email}
                            onChange={e => updateConfig('jira', 'email', e.target.value)}
                            placeholder="you@company.com"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">API Token</label>
                          <input
                            type="password"
                            value={config.apiToken}
                            onChange={e => updateConfig('jira', 'apiToken', e.target.value)}
                            placeholder="xxxxxxxxxx"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Board ID (optional)</label>
                        <input
                          type="text"
                          value={config.boardId}
                          onChange={e => updateConfig('jira', 'boardId', e.target.value)}
                          placeholder="123"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">For sprint/velocity data. Auto-detected if not provided.</p>
                      </div>
                    </>
                  )}

                  {/* Result message */}
                  {result && (
                    <div className={`text-sm px-3 py-2 rounded ${
                      result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.message}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => testConnection(key)}
                      disabled={testing[key]}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      {testing[key] ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => saveConfig(key)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    {isConfigured && (
                      <button
                        onClick={() => clearConfig(key)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg ml-auto"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Cross-Org Learning Info */}
      {hasAnyPlatform && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h4 className="font-medium text-blue-900">Cross-Org Learning Active</h4>
              <p className="text-sm text-blue-700 mt-1">
                Story point estimations will learn from closed issues across all connected platforms.
                More historical data = more accurate estimates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
