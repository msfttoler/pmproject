import { useState, useEffect, useCallback } from 'react'
import { PlatformManager, getConfiguredPlatforms, PLATFORMS } from '../utils/platforms'

export default function CICDPipelines({ onConfigureGitHub }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadData = useCallback(async () => {
    setError(null)
    
    const configuredPlatforms = getConfiguredPlatforms()
    // Filter to only platforms that support CI/CD
    const cicdPlatforms = configuredPlatforms.filter(p => 
      p.type === 'github' || p.type === 'azuredevops'
    )

    if (cicdPlatforms.length === 0) {
      setNotConfigured(true)
      setLoading(false)
      return
    }

    try {
      const manager = new PlatformManager()
      manager.loadConfiguredPlatforms()
      
      const summary = await manager.getCICDSummary()
      setData(summary)
      setNotConfigured(false)
    } catch (e) {
      console.error('CI/CD Pipelines error:', e)
      setError(e.message || 'Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || notConfigured) return
    
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, notConfigured, loadData])

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins}m ${secs}s`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}m`
  }

  const formatTimeAgo = (date) => {
    if (!date) return '-'
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'just now'
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '🔄'
      case 'success': return '✅'
      case 'failed': return '❌'
      case 'cancelled': return '⚪'
      case 'warning': return '⚠️'
      default: return '❓'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const getPlatformIcon = (platform) => {
    return PLATFORMS[platform]?.icon || '📦'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">🔄</div>
          <div className="text-gray-500">Loading pipeline runs...</div>
        </div>
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800">🔗 Connect a CI/CD Platform</h3>
        <p className="text-blue-700 mt-2 mb-4">
          Connect GitHub or Azure DevOps to monitor your CI/CD pipelines.
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <span className="text-3xl">🐙</span>
            <p className="text-sm text-gray-600">GitHub Actions</p>
          </div>
          <div className="text-center">
            <span className="text-3xl">🔷</span>
            <p className="text-sm text-gray-600">Azure Pipelines</p>
          </div>
        </div>
        <button
          onClick={() => onConfigureGitHub && onConfigureGitHub()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Configure Platforms in Settings
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={loadData} className="mt-2 text-sm text-red-700 underline">Retry</button>
      </div>
    )
  }

  const { running, failed, recent, workflows, errors: apiErrors } = data || {}
  
  const filteredRuns = activeTab === 'all' ? recent
    : activeTab === 'running' ? running
    : activeTab === 'failed' ? failed
    : recent

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600">{running?.length || 0}</p>
              <p className="text-sm text-gray-500">Running</p>
            </div>
            <div className="text-3xl">🔄</div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-red-600">{failed?.length || 0}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {workflows?.reduce((sum, w) => sum + (w.successRate > 80 ? 1 : 0), 0) || 0}
              </p>
              <p className="text-sm text-gray-500">Healthy Pipelines</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-700">{workflows?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Workflows</p>
            </div>
            <div className="text-3xl">⚙️</div>
          </div>
        </div>
      </div>

      {/* API Errors */}
      {apiErrors?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm font-medium">⚠️ Some platforms had errors:</p>
          <ul className="text-yellow-700 text-sm mt-1">
            {apiErrors.map((e, i) => (
              <li key={i}>{PLATFORMS[e.platform]?.name}: {e.error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Running Pipelines Alert */}
      {running?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔄 Currently Running ({running.length})</h3>
          <div className="space-y-2">
            {running.slice(0, 5).map(run => (
              <div key={run.id} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-blue-100">
                <span className="text-lg">{getPlatformIcon(run.platform)}</span>
                <div className="flex-1">
                  <a 
                    href={run.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {run.workflowName}
                  </a>
                  <p className="text-xs text-gray-500">
                    {run.branch} • {run.actor} • Started {formatTimeAgo(run.createdAt)}
                  </p>
                </div>
                <div className="animate-pulse text-blue-500">⏳</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Pipelines Alert */}
      {failed?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">❌ Recent Failures ({failed.length})</h3>
          <div className="space-y-2">
            {failed.slice(0, 5).map(run => (
              <div key={run.id} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-red-100">
                <span className="text-lg">{getPlatformIcon(run.platform)}</span>
                <div className="flex-1">
                  <a 
                    href={run.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-red-700 hover:underline"
                  >
                    {run.workflowName}
                  </a>
                  <p className="text-xs text-gray-500">
                    {run.branch} • {run.actor} • {formatTimeAgo(run.createdAt)}
                  </p>
                </div>
                <span className="text-xs text-red-600 font-medium">
                  {formatDuration(run.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Health */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">📊 Workflow Health</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {workflows?.map(wf => (
              <div 
                key={`${wf.platform}-${wf.name}`}
                className="border rounded-lg p-3 hover:border-gray-400 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{getPlatformIcon(wf.platform)}</span>
                  <span className="font-medium text-gray-900 truncate">{wf.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          wf.successRate >= 80 ? 'bg-green-500' :
                          wf.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${wf.successRate}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      wf.successRate >= 80 ? 'text-green-600' :
                      wf.successRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {wf.successRate}%
                    </span>
                  </div>
                  {wf.lastRun && (
                    <span className="text-lg">{getStatusIcon(wf.lastRun.status)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {wf.runs?.length || 0} runs • Last: {wf.lastRun ? formatTimeAgo(wf.lastRun.createdAt) : 'never'}
                </p>
              </div>
            ))}
            {(!workflows || workflows.length === 0) && (
              <div className="col-span-full text-center text-gray-500 py-8">
                No workflow data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">📋 Pipeline Runs</h3>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['all', 'running', 'failed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-sm capitalize transition ${
                    activeTab === tab 
                      ? 'bg-white shadow text-gray-900 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button 
              onClick={loadData} 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {filteredRuns?.map(run => (
            <div key={run.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${getStatusColor(run.status)}`}>
                  {getStatusIcon(run.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPlatformIcon(run.platform)}</span>
                    <a 
                      href={run.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {run.workflowName}
                    </a>
                    <span className="text-xs text-gray-400">#{run.runNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="font-mono bg-gray-100 px-1 rounded text-xs">{run.branch}</span>
                    <span>•</span>
                    <span>{run.actor}</span>
                    {run.commitMessage && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{run.commitMessage}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-900 font-medium">{formatDuration(run.duration)}</p>
                  <p className="text-gray-500">{formatTimeAgo(run.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {(!filteredRuns || filteredRuns.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No pipeline runs found for this filter.
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
        <p className="font-medium text-blue-800">💡 Pro Tip</p>
        <p className="text-blue-700 mt-1">
          Monitor your CI/CD health across GitHub Actions and Azure Pipelines in one place.
          Auto-refresh keeps you updated on running builds and alerts you to failures.
        </p>
      </div>
    </div>
  )
}
