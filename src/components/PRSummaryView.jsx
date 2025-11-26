import { useState, useEffect } from 'react'
import { fetchPRSummaries } from '../utils/githubPM'

export default function PRSummaryView({ onConfigureGitHub }) {
  const [prs, setPRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [selectedPR, setSelectedPR] = useState(null)
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
      const data = await fetchPRSummaries(config.owner, config.repo, config.token)
      setPRs(data || [])
    } catch (e) {
      console.error('PR Summary error:', e)
      setError(e.message || 'Failed to load pull requests')
    } finally {
      setLoading(false)
    }
  }

  const getReviewStatus = (pr) => {
    if (!pr.reviews) return 'needs-review'
    if (pr.reviews.approved > 0 && pr.reviews.changesRequested === 0) return 'approved'
    if (pr.reviews.changesRequested > 0) return 'changes-requested'
    if (pr.reviews.total === 0) return 'needs-review'
    return 'in-review'
  }

  const getReviewBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Approved</span>
      case 'changes-requested':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">✗ Changes Requested</span>
      case 'needs-review':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⏳ Needs Review</span>
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">👀 In Review</span>
    }
  }

  const getChecksBadge = (checks) => {
    if (checks.total === 0) return <span className="text-xs text-gray-400">No checks</span>
    if (checks.failing > 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">✗ {checks.failing} failing</span>
    if (checks.passing === checks.total) return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ All passing</span>
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⏳ Running</span>
  }

  const getAgeBadge = (age) => {
    if (age >= 14) return <span className="text-xs text-red-600 font-medium">🔥 {age}d old</span>
    if (age >= 7) return <span className="text-xs text-yellow-600 font-medium">⚠️ {age}d old</span>
    return <span className="text-xs text-gray-500">{age}d old</span>
  }

  const filteredPRs = prs.filter(pr => {
    if (filter === 'all') return true
    if (filter === 'needs-review') return getReviewStatus(pr) === 'needs-review'
    if (filter === 'approved') return getReviewStatus(pr) === 'approved'
    if (filter === 'changes') return getReviewStatus(pr) === 'changes-requested'
    if (filter === 'stale') return (pr.ageInDays || 0) >= 7
    return true
  })

  // Summary stats
  const stats = {
    total: prs.length,
    needsReview: prs.filter(pr => getReviewStatus(pr) === 'needs-review').length,
    approved: prs.filter(pr => getReviewStatus(pr) === 'approved').length,
    stale: prs.filter(pr => (pr.ageInDays || 0) >= 7).length,
    failing: prs.filter(pr => pr.checks?.failing > 0).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pull requests...</div>
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800">🔗 Connect to GitHub</h3>
        <p className="text-blue-700 mt-2 mb-4">
          Connect your GitHub repository to view pull request summaries.
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

  if (prs.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-green-800">🎉 No Open Pull Requests</h3>
        <p className="text-green-700 mt-2">All PRs have been merged or closed!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Open PRs</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-yellow-600">{stats.needsReview}</p>
          <p className="text-sm text-gray-500">Needs Review</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-orange-600">{stats.stale}</p>
          <p className="text-sm text-gray-500">Stale (7d+)</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-600">{stats.failing}</p>
          <p className="text-sm text-gray-500">Failing Checks</p>
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
            All
          </button>
          <button
            onClick={() => setFilter('needs-review')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              filter === 'needs-review' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Needs Review
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              filter === 'approved' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Ready to Merge
          </button>
          <button
            onClick={() => setFilter('stale')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              filter === 'stale' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            Stale
          </button>
        </div>
        <button onClick={loadData} className="text-sm text-gray-500 hover:text-gray-700">
          ↻ Refresh
        </button>
      </div>

      {/* PR List */}
      <div className="space-y-3">
        {filteredPRs.map(pr => (
          <div 
            key={pr.number}
            className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
              selectedPR?.number === pr.number ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            {/* PR Header */}
            <div 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedPR(selectedPR?.number === pr.number ? null : pr)}
            >
              <img 
                src={pr.authorAvatar} 
                alt={pr.author}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <a 
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-gray-900 hover:text-indigo-600"
                  >
                    #{pr.number}: {pr.title}
                  </a>
                  {pr.draft && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">Draft</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>by {pr.author}</span>
                  <span>•</span>
                  {getAgeBadge(pr.ageInDays)}
                  {pr.linkedIssues.length > 0 && (
                    <>
                      <span>•</span>
                      <span>Links: {pr.linkedIssues.map(i => `#${i}`).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getReviewBadge(getReviewStatus(pr))}
                {getChecksBadge(pr.checks)}
                <span className="text-gray-400">{selectedPR?.number === pr.number ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedPR?.number === pr.number && (
              <div className="border-t bg-gray-50 p-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Code Changes */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium text-gray-700 mb-2">📊 Changes</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-green-600 font-medium">+{pr.additions}</span> additions</p>
                      <p><span className="text-red-600 font-medium">-{pr.deletions}</span> deletions</p>
                      <p><span className="text-gray-600 font-medium">{pr.changedFiles}</span> files changed</p>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium text-gray-700 mb-2">👥 Reviews</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-green-600 font-medium">{pr.reviews.approved}</span> approved</p>
                      <p><span className="text-red-600 font-medium">{pr.reviews.changesRequested}</span> changes requested</p>
                      <p><span className="text-gray-600 font-medium">{pr.reviews.pending}</span> pending</p>
                    </div>
                  </div>

                  {/* Checks */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium text-gray-700 mb-2">✅ CI Checks</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-green-600 font-medium">{pr.checks.passing}</span> passing</p>
                      <p><span className="text-red-600 font-medium">{pr.checks.failing}</span> failing</p>
                      <p><span className="text-gray-600 font-medium">{pr.checks.total}</span> total</p>
                    </div>
                  </div>
                </div>

                {/* Labels & Milestone */}
                <div className="mt-4 flex items-center gap-4">
                  {pr.labels.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Labels:</span>
                      <div className="flex gap-1">
                        {pr.labels.map(l => (
                          <span 
                            key={l.name}
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ 
                              backgroundColor: `#${l.color}20`,
                              color: `#${l.color}`,
                              border: `1px solid #${l.color}`
                            }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pr.milestone && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Milestone:</span>
                      <span className="text-sm font-medium text-indigo-600">{pr.milestone}</span>
                    </div>
                  )}
                </div>

                {/* PM Summary */}
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-800 mb-1">📋 PM Summary</h4>
                  <p className="text-sm text-indigo-700">
                    {pr.draft ? 'This PR is still a draft and not ready for review. ' : ''}
                    {getReviewStatus(pr) === 'approved' && pr.checks.failing === 0 
                      ? '✅ This PR is ready to merge! All reviews approved and checks passing.'
                      : getReviewStatus(pr) === 'changes-requested'
                      ? '⚠️ Changes have been requested. Developer needs to address feedback.'
                      : getReviewStatus(pr) === 'needs-review'
                      ? '👀 This PR needs reviewers assigned.'
                      : pr.checks.failing > 0
                      ? '❌ CI checks are failing. Developer needs to fix before merge.'
                      : '🔄 Review in progress.'}
                    {pr.ageInDays >= 14 && ' ⏰ This PR has been open for over 2 weeks - consider following up.'}
                    {pr.linkedIssues.length === 0 && ' 📌 No linked issues found - consider linking to a story.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                  >
                    View in GitHub →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPRs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No pull requests match the selected filter.
        </div>
      )}
    </div>
  )
}
