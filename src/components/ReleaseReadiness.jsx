import { useState, useEffect } from 'react'
import { fetchReleaseReadiness, generateReleaseNotes } from '../utils/githubPM'

export default function ReleaseReadiness({ onGenerateTests, onConfigureGitHub }) {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [showNotes, setShowNotes] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    setNotConfigured(false)
    
    let config = {}
    try {
      config = JSON.parse(localStorage.getItem('github-config') || '{}')
    } catch {
      config = {}
    }
    if (!config.owner || !config.repo || !config.token) {
      setNotConfigured(true)
      setLoading(false)
      return
    }

    try {
      const data = await fetchReleaseReadiness(config.owner, config.repo, config.token)
      setReleases(data.releases || [])
      if (data.releases && data.releases.length > 0) {
        setSelectedRelease(data.releases[0])
      }
    } catch (e) {
      console.error('Release Readiness error:', e)
      setError(e.message || 'Failed to load release data')
    } finally {
      setLoading(false)
    }
  }

  const handleShowNotes = (release) => {
    const notes = generateReleaseNotes(release)
    setReleaseNotes(notes)
    setShowNotes(true)
  }

  const copyNotes = () => {
    navigator.clipboard.writeText(releaseNotes)
  }

  const getReadinessColor = (percent) => {
    if (percent >= 90) return 'text-green-600 bg-green-100'
    if (percent >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDaysColor = (days) => {
    if (days === null) return 'text-gray-500'
    if (days < 0) return 'text-red-600'
    if (days <= 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading release data...</div>
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800">🔗 Connect to GitHub</h3>
        <p className="text-blue-700 mt-2 mb-4">
          Connect your GitHub repository to view release readiness data.
        </p>
        <button
          onClick={() => onConfigureGitHub && onConfigureGitHub()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Configure GitHub Connection
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

  if (releases.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-yellow-800">No Milestones Found</h3>
        <p className="text-yellow-700 mt-2">
          Create milestones in GitHub to track release readiness. 
          Each milestone represents a release with its associated stories.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Release Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {releases.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRelease(r)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedRelease?.id === r.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>
        <button
          onClick={loadData}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ↻ Refresh
        </button>
      </div>

      {selectedRelease && (
        <>
          {/* Release Overview */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRelease.title}</h2>
                  {selectedRelease.description && (
                    <p className="text-gray-600 mt-1">{selectedRelease.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-bold ${getReadinessColor(selectedRelease.completionPercent).split(' ')[0]}`}>
                    {selectedRelease.completionPercent}%
                  </span>
                  <p className="text-sm text-gray-500">Ready</p>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-4 divide-x">
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedRelease.completedStories}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedRelease.openStories}</p>
                <p className="text-sm text-gray-500">Open</p>
              </div>
              <div className="p-4 text-center">
                <p className={`text-2xl font-bold ${getDaysColor(selectedRelease.daysUntilDue)}`}>
                  {selectedRelease.daysUntilDue !== null ? (
                    selectedRelease.daysUntilDue < 0 
                      ? `${Math.abs(selectedRelease.daysUntilDue)} overdue`
                      : selectedRelease.daysUntilDue
                  ) : '—'}
                </p>
                <p className="text-sm text-gray-500">Days Until Due</p>
              </div>
              <div className="p-4 text-center">
                <p className={`text-2xl font-bold ${selectedRelease.blockers.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedRelease.blockers.length}
                </p>
                <p className="text-sm text-gray-500">Blockers</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Release Progress</span>
              <span>{selectedRelease.completedStories} of {selectedRelease.totalStories} stories</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  selectedRelease.completionPercent >= 90 ? 'bg-green-500' :
                  selectedRelease.completionPercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${selectedRelease.completionPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Blockers */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b bg-red-50">
                <h3 className="font-semibold text-red-800">🚨 Blockers</h3>
              </div>
              <div className="p-4">
                {selectedRelease.blockers.length === 0 ? (
                  <p className="text-green-600 text-sm">✓ No blockers! Release is on track.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedRelease.blockers.map(b => (
                      <li key={b.id} className="flex items-start gap-2">
                        <span className="text-red-500">●</span>
                        <a 
                          href={b.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-gray-800 hover:text-indigo-600"
                        >
                          #{b.id}: {b.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Missing Test Cases */}
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b bg-yellow-50">
                <h3 className="font-semibold text-yellow-800">⚠️ Missing Test Cases</h3>
              </div>
              <div className="p-4">
                {selectedRelease.missingTests.length === 0 ? (
                  <p className="text-green-600 text-sm">✓ All stories have test cases!</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedRelease.missingTests.map(m => (
                      <li key={m.id} className="flex items-center justify-between gap-2">
                        <a 
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-800 hover:text-indigo-600 truncate flex-1"
                        >
                          #{m.id}: {m.title}
                        </a>
                        <button
                          onClick={() => onGenerateTests && onGenerateTests(m.title)}
                          className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                        >
                          Generate
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleShowNotes(selectedRelease)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              📝 Generate Release Notes
            </button>
            <a
              href={selectedRelease.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              View in GitHub →
            </a>
          </div>

          {/* Story List */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">All Stories in Release</h3>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {selectedRelease.stories.map(s => (
                <div key={s.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                  <span className={`w-2 h-2 rounded-full ${s.state === 'closed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <a 
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm hover:text-indigo-600"
                  >
                    #{s.id}: {s.title}
                  </a>
                  <div className="flex gap-1">
                    {s.labels.slice(0, 3).map(l => (
                      <span key={l} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Release Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Release Notes</h3>
              <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">{releaseNotes}</pre>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={copyNotes}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowNotes(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
