import { useState, useEffect } from 'react'
import { fetchEstimationData, estimateStoryPoints } from '../utils/githubPM'
import { 
  PlatformManager, 
  getConfiguredPlatforms, 
  estimateWithCrossOrgModel,
  PLATFORMS 
} from '../utils/platforms'

export default function StoryPointsEstimator({ onConfigureGitHub }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [customStory, setCustomStory] = useState('')
  const [customEstimate, setCustomEstimate] = useState(null)
  const [selectedStory, setSelectedStory] = useState(null)
  const [crossOrgModel, setCrossOrgModel] = useState(null)
  const [platformInfo, setPlatformInfo] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    setNotConfigured(false)
    
    // Check for any configured platforms
    const configuredPlatforms = getConfiguredPlatforms()
    setPlatformInfo(configuredPlatforms.map(p => ({
      type: p.type,
      name: PLATFORMS[p.type]?.name || p.type,
      icon: PLATFORMS[p.type]?.icon || '📦'
    })))

    if (configuredPlatforms.length === 0) {
      setNotConfigured(true)
      setLoading(false)
      return
    }

    try {
      // Load cross-org model from all platforms
      const manager = new PlatformManager()
      manager.loadConfiguredPlatforms()
      
      // Fetch all issues for learning
      const { issues, errors } = await manager.fetchAllIssues('all')
      
      if (errors.length > 0) {
        console.warn('Some platforms had errors:', errors)
      }

      // Build cross-org model
      const model = await manager.buildCrossOrgEstimationModel()
      setCrossOrgModel(model)

      // Get open issues for estimation list
      const openIssues = issues.filter(i => i.state === 'open')
      
      // Estimate each open issue
      const storiesWithEstimates = openIssues.map(issue => ({
        ...issue,
        estimate: estimateWithCrossOrgModel(
          issue.title,
          issue.description,
          issue.labels,
          model
        )
      }))

      // Calculate totals
      const totalPoints = storiesWithEstimates.reduce(
        (sum, s) => sum + (s.estimate?.points || 0), 
        0
      )

      setData({
        model,
        stories: storiesWithEstimates,
        totalPoints,
        historicalCount: model.sampleSize || 0,
        platforms: model.platforms || []
      })
    } catch (e) {
      console.error('Story Points Estimator error:', e)
      setError(e.message || 'Failed to load estimation data')
    } finally {
      setLoading(false)
    }
  }

  const handleEstimateCustom = () => {
    if (!customStory.trim()) return
    
    const estimate = crossOrgModel?.hasEnoughData
      ? estimateWithCrossOrgModel(customStory, '', [], crossOrgModel)
      : estimateWithCrossOrgModel(customStory, '', [], { hasEnoughData: false })
    
    setCustomEstimate(estimate)
  }

  const getPointsColor = (points) => {
    if (points <= 2) return 'bg-green-100 text-green-800 border-green-300'
    if (points <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (points <= 8) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getFibonacciLabel = (points) => {
    const labels = {
      1: 'XS - Trivial',
      2: 'S - Small',
      3: 'M - Medium',
      5: 'L - Large',
      8: 'XL - Very Large',
      13: 'XXL - Epic-sized',
      21: '⚠️ Should be broken down'
    }
    return labels[points] || `${points} points`
  }

  const getPlatformIcon = (platform) => {
    return PLATFORMS[platform]?.icon || '📦'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Learning from historical data across platforms...</div>
          <div className="flex justify-center gap-2">
            {platformInfo.map(p => (
              <span key={p.type} className="text-2xl">{p.icon}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800">🔗 Connect a Platform</h3>
        <p className="text-blue-700 mt-2 mb-4">
          Connect GitHub, Azure DevOps, or Jira to enable AI-powered story point estimation.
        </p>
        <div className="flex justify-center gap-2 mb-4">
          {Object.values(PLATFORMS).map(p => (
            <span key={p.name} className="text-2xl">{p.icon}</span>
          ))}
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

  return (
    <div className="space-y-6">
      {/* Connected Platforms Banner */}
      {data?.platforms?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h3 className="font-semibold text-indigo-800">Cross-Platform Learning Active</h3>
              <p className="text-sm text-indigo-600">
                Learning from {data.platforms.map(p => `${p.name} (${p.count})`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-indigo-600">{data?.historicalCount || 0}</p>
          <p className="text-sm text-gray-500">Issues Learned From</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{data?.stories?.length || 0}</p>
          <p className="text-sm text-gray-500">Open Stories</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-purple-600">{data?.totalPoints || 0}</p>
          <p className="text-sm text-gray-500">Total Points</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className={`text-3xl font-bold ${crossOrgModel?.hasEnoughData ? 'text-green-600' : 'text-yellow-600'}`}>
            {crossOrgModel?.hasEnoughData ? '✓' : '⚠️'}
          </p>
          <p className="text-sm text-gray-500">
            {crossOrgModel?.hasEnoughData ? 'Model Trained' : 'Using Heuristics'}
          </p>
        </div>
      </div>

      {/* Model Info */}
      {crossOrgModel?.hasEnoughData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-semibold text-indigo-800 mb-2">📊 Learned Patterns</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-indigo-600 font-medium">Features:</span>
              <span className="ml-2">{Math.round(crossOrgModel.avgCycleTime.feature)} days avg</span>
            </div>
            <div>
              <span className="text-indigo-600 font-medium">Bugs:</span>
              <span className="ml-2">{Math.round(crossOrgModel.avgCycleTime.bug)} days avg</span>
            </div>
            <div>
              <span className="text-indigo-600 font-medium">Tasks:</span>
              <span className="ml-2">{Math.round(crossOrgModel.avgCycleTime.task)} days avg</span>
            </div>
            <div>
              <span className="text-indigo-600 font-medium">Point Ratio:</span>
              <span className="ml-2">1 pt ≈ {crossOrgModel.pointsToDays.toFixed(1)} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Estimation */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">✨ Estimate a New Story</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={customStory}
              onChange={(e) => setCustomStory(e.target.value)}
              placeholder="Enter a story title or description..."
              className="flex-1 border rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleEstimateCustom()}
            />
            <button
              onClick={handleEstimateCustom}
              disabled={!customStory.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Estimate
            </button>
          </div>
          
          {customEstimate && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getPointsColor(customEstimate.points)}`}>
                  {customEstimate.points}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{getFibonacciLabel(customEstimate.points)}</p>
                  <p className="text-sm text-gray-600">
                    ~{customEstimate.estimatedDays} days • 
                    <span className={`ml-1 ${getConfidenceColor(customEstimate.confidence)}`}>
                      {customEstimate.confidence}% confidence
                    </span>
                    {customEstimate.isHeuristic && (
                      <span className="ml-2 text-yellow-600">(heuristic-based)</span>
                    )}
                  </p>
                  {customEstimate.breakdown?.learnedFrom && !customEstimate.isHeuristic && (
                    <p className="text-xs text-gray-500 mt-1">
                      Learned from: {customEstimate.breakdown.learnedFrom}
                    </p>
                  )}
                </div>
              </div>
              {customEstimate.breakdown.complexityFactors?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600 font-medium">Factors:</p>
                  <ul className="text-sm text-gray-500 mt-1">
                    {customEstimate.breakdown.complexityFactors.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Open Stories with Estimates */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">📋 Open Stories - Estimated</h3>
          <button onClick={loadData} className="text-sm text-gray-500 hover:text-gray-700">
            ↻ Refresh
          </button>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {data?.stories?.map(story => (
            <div 
              key={story.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedStory?.id === story.id ? 'bg-indigo-50' : ''}`}
              onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border-2 ${getPointsColor(story.estimate.points)}`}>
                  {story.estimate.points}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPlatformIcon(story.platform)}</span>
                    <a 
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {story.externalId}: {story.title}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {getFibonacciLabel(story.estimate.points)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className={`text-sm ${getConfidenceColor(story.estimate.confidence)}`}>
                      {story.estimate.confidence}% confidence
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {story.labels.slice(0, 3).map(l => (
                    <span key={l} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{l}</span>
                  ))}
                </div>
              </div>
              
              {/* Expanded details */}
              {selectedStory?.id === story.id && (
                <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{story.estimate.breakdown.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Est. Days:</span>
                      <span className="ml-2 font-medium">{story.estimate.estimatedDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Platform:</span>
                      <span className="ml-2 font-medium">{PLATFORMS[story.platform]?.name || story.platform}</span>
                    </div>
                  </div>
                  {story.estimate.breakdown.complexityFactors?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Factors:</span>
                      <ul className="text-sm text-gray-600 mt-1">
                        {story.estimate.breakdown.complexityFactors.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {(!data?.stories || data.stories.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              No open stories to estimate.
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-yellow-800">💡 Improve Accuracy</p>
        <p className="text-yellow-700 mt-1">
          Add story point labels to closed issues across all your connected platforms.
          Cross-org learning combines patterns from GitHub, Azure DevOps, and Jira for better estimates.
        </p>
      </div>
    </div>
  )
}
