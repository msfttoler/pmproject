import { useState, useEffect } from 'react'
import { fetchStoryGapAnalysis } from '../utils/githubPM'

export default function StoryGapAnalyzer({ onGenerateTests, onConfigureGitHub }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [filter, setFilter] = useState('all')

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
      const data = await fetchStoryGapAnalysis(config.owner, config.repo, config.token)
      setAnalysis(data)
    } catch (e) {
      console.error('Story Gap Analyzer error:', e)
      setError(e.message || 'Failed to analyze stories')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Acceptance Criteria': '📋',
      'Edge Cases': '🔀',
      'Error Handling': '⚠️',
      'Security': '🔒',
      'Accessibility': '♿',
      'Performance': '⚡',
      'Test Cases': '🧪'
    }
    return icons[category] || '📌'
  }

  const filteredStories = analysis?.stories.filter(s => {
    if (filter === 'all') return true
    if (filter === 'high') return s.highSeverity > 0
    return s.gaps.some(g => g.category === filter)
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Analyzing stories for gaps...</div>
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800">🔗 Connect to GitHub</h3>
        <p className="text-blue-700 mt-2 mb-4">
          Connect your GitHub repository to analyze story gaps.
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

  if (!analysis || analysis.stories.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-yellow-800">No Open Stories</h3>
        <p className="text-yellow-700 mt-2">
          No open issues found to analyze. Create some issues in GitHub to see gap analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{analysis.summary.totalStories}</p>
          <p className="text-sm text-gray-500">Stories Analyzed</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-orange-600">{analysis.summary.totalGaps}</p>
          <p className="text-sm text-gray-500">Total Gaps Found</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className={`text-3xl font-bold ${getScoreColor(analysis.summary.avgScore)}`}>
            {analysis.summary.avgScore}%
          </p>
          <p className="text-sm text-gray-500">Avg Quality Score</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-600">{analysis.summary.storiesWithHighGaps}</p>
          <p className="text-sm text-gray-500">High Priority</p>
        </div>
      </div>

      {/* Gap Categories Breakdown */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Gap Categories</h3>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(analysis.summary.byCategory).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? 'all' : cat)}
              className={`p-3 rounded-lg text-center transition ${
                filter === cat 
                  ? 'bg-indigo-100 border-2 border-indigo-500' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{getCategoryIcon(cat)}</span>
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600">{cat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({analysis.stories.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              filter === 'high' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            High Priority ({analysis.summary.storiesWithHighGaps})
          </button>
        </div>
        <button onClick={loadData} className="text-sm text-gray-500 hover:text-gray-700">
          ↻ Refresh
        </button>
      </div>

      {/* Stories List */}
      <div className="space-y-3">
        {filteredStories.map(story => (
          <div 
            key={story.issueNumber}
            className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
              selectedStory?.issueNumber === story.issueNumber ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            {/* Story Header */}
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedStory(selectedStory?.issueNumber === story.issueNumber ? null : story)}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                story.score >= 80 ? 'bg-green-100' : story.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-lg font-bold ${getScoreColor(story.score)}`}>{story.score}</span>
              </div>
              <div className="flex-1">
                <a 
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-gray-900 hover:text-indigo-600"
                >
                  #{story.issueNumber}: {story.title}
                </a>
                <div className="flex gap-2 mt-1">
                  {story.gaps.slice(0, 4).map((g, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(g.severity)}`}>
                      {getCategoryIcon(g.category)} {g.category}
                    </span>
                  ))}
                  {story.gaps.length > 4 && (
                    <span className="text-xs text-gray-500">+{story.gaps.length - 4} more</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGenerateTests && onGenerateTests(story.title)
                  }}
                  className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200"
                >
                  Generate Tests
                </button>
                <span className="text-gray-400">{selectedStory?.issueNumber === story.issueNumber ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Expanded Gap Details */}
            {selectedStory?.issueNumber === story.issueNumber && (
              <div className="border-t bg-gray-50 p-4">
                <h4 className="font-medium text-gray-800 mb-3">Gap Analysis Details</h4>
                <div className="space-y-3">
                  {story.gaps.map((gap, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(gap.severity)}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getCategoryIcon(gap.category)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{gap.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              gap.severity === 'high' ? 'bg-red-200' :
                              gap.severity === 'medium' ? 'bg-yellow-200' : 'bg-blue-200'
                            }`}>
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{gap.message}</p>
                          <p className="text-sm text-gray-600 mt-2 italic">💡 {gap.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No stories match the selected filter.
        </div>
      )}
    </div>
  )
}
