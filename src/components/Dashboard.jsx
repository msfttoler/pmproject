import { useState } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import GitHubConfig from './GitHubConfig'

export default function Dashboard({ onGenerateTests }) {
  const [showConfig, setShowConfig] = useState(false)
  const [githubConfig, setGithubConfig] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('githubConfig')
    return saved ? JSON.parse(saved) : { owner: '', repo: '', token: '' }
  })

  const { data, loading, error, isLive, refresh } = useDashboardData(
    githubConfig.owner,
    githubConfig.repo,
    githubConfig.token
  )

  const handleSaveConfig = (config) => {
    setGithubConfig(config)
    localStorage.setItem('githubConfig', JSON.stringify(config))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading dashboard data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">No data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PM Command Center</h2>
          <p className="text-slate-400">
            {isLive ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live from {githubConfig.owner}/{githubConfig.repo}
              </span>
            ) : (
              'Sample data - Connect GitHub for live metrics'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <button
              onClick={refresh}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ↻ Refresh
            </button>
          )}
          <button
            onClick={() => setShowConfig(true)}
            className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isLive ? '⚙️ Settings' : '🔗 Connect GitHub'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          ⚠️ {error} - Showing sample data
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Test Coverage" value={`${data.coverage.coveragePercent}%`} trend="+5%" positive icon="📊" />
        <MetricCard label="Automation Ready" value={`${data.coverage.automationReadyPercent}%`} trend="+8%" positive icon="🤖" />
        <MetricCard label="At-Risk Stories" value={data.risks.length} trend="-2" positive icon="⚠️" />
        <MetricCard label="AI Acceptance" value={`${data.adoption.acceptanceRate}%`} trend="+3%" positive icon="✨" />
      </div>

      {/* Coverage Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="font-semibold mb-4">📈 Coverage by Test Type</h3>
          <div className="space-y-3">
            <CoverageBar label="Functional" percent={data.coverage.byType.functional} color="bg-blue-500" />
            <CoverageBar label="Edge Cases" percent={data.coverage.byType.edgeCase} color="bg-purple-500" />
            <CoverageBar label="Negative Tests" percent={data.coverage.byType.negative} color="bg-orange-500" />
            <CoverageBar label="Security" percent={data.coverage.byType.security} color="bg-red-500" />
            <CoverageBar label="Accessibility" percent={data.coverage.byType.accessibility} color="bg-teal-500" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="font-semibold mb-4">📋 Backlog Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Complete Coverage</span>
              <span className="font-semibold text-green-400">{data.health.withCompleteCoverage} stories</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Partial Coverage</span>
              <span className="font-semibold text-yellow-400">{data.health.withPartialCoverage} stories</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">No Coverage</span>
              <span className="font-semibold text-red-400">{data.health.withNoCoverage} stories</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Story Age</span>
              <span className="font-semibold">{data.health.avgAgingDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Velocity Trend</span>
              <span className="font-semibold text-green-400">↑ {data.health.velocityTrend}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="font-semibold mb-4">🚨 Risk Indicators - Action Required</h3>
        <div className="space-y-3">
          {data.risks.map(risk => (
            <RiskRow key={risk.storyId} risk={risk} onGenerate={onGenerateTests} />
          ))}
        </div>
      </div>

      {/* AI Adoption Metrics */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="font-semibold mb-4">🤖 AI Adoption & Feedback Loop</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{data.adoption.totalAiSuggestions}</div>
            <div className="text-sm text-slate-400">AI Suggestions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{data.adoption.acceptedAsIs}</div>
            <div className="text-sm text-slate-400">Accepted As-Is</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{data.adoption.pmEdited}</div>
            <div className="text-sm text-slate-400">PM Edited</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{data.adoption.rejected}</div>
            <div className="text-sm text-slate-400">Rejected</div>
          </div>
        </div>
      </div>

      {showConfig && (
        <GitHubConfig
          config={githubConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value, trend, positive, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>{trend}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

function CoverageBar({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-slate-400">{percent}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function RiskRow({ risk, onGenerate }) {
  const levelColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
      <span className={`px-2 py-1 rounded text-xs font-semibold ${levelColors[risk.riskLevel]}`}>
        {risk.riskLevel.toUpperCase()}
      </span>
      <div className="flex-1">
        <div className="font-medium">{risk.storyId}: {risk.storyTitle}</div>
        <div className="text-sm text-slate-400">{risk.reasons.join(' • ')}</div>
      </div>
      <button 
        onClick={() => onGenerate(risk.storyTitle)}
        className="text-sm text-blue-400 hover:text-blue-300 whitespace-nowrap"
      >
        → Generate Tests
      </button>
      {risk.url && (
        <a
          href={risk.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ↗
        </a>
      )}
    </div>
  )
}
