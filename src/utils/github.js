// GitHub API integration for fetching real issues and project data

const GITHUB_API = 'https://api.github.com'

/**
 * Fetch issues from a GitHub repository
 */
export async function fetchIssues(owner, repo, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&per_page=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Fetch issue comments (where test cases may be stored)
 */
export async function fetchIssueComments(owner, repo, issueNumber, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Parse labels to determine test coverage
 */
function parseLabels(labels) {
  const labelNames = labels.map(l => l.name.toLowerCase())
  
  return {
    priority: labelNames.find(l => l.startsWith('priority/'))?.replace('priority/', '') || 'medium',
    hasTestCases: labelNames.includes('has-test-cases'),
    needsTests: labelNames.includes('needs-tests'),
    hasEdgeCases: labelNames.includes('test/edge-cases'),
    hasNegativeTests: labelNames.includes('test/negative'),
    hasSecurityTests: labelNames.includes('test/security'),
    hasAccessibilityTests: labelNames.includes('test/accessibility'),
    type: labelNames.find(l => l.startsWith('type/'))?.replace('type/', '') || 'feature'
  }
}

/**
 * Map GitHub issue state to our status
 */
function mapStatus(issue) {
  if (issue.state === 'closed') return 'done'
  
  const labels = issue.labels.map(l => l.name.toLowerCase())
  if (labels.includes('in-progress') || labels.includes('status/in-progress')) return 'in-progress'
  if (labels.includes('review') || labels.includes('status/review')) return 'review'
  return 'backlog'
}

/**
 * Calculate risk score based on issue properties
 */
function calculateRiskScore(issue, labelInfo) {
  let score = 0
  
  // No test cases = high risk
  if (!labelInfo.hasTestCases) score += 40
  
  // Missing coverage types
  if (!labelInfo.hasEdgeCases) score += 15
  if (!labelInfo.hasNegativeTests) score += 15
  if (!labelInfo.hasSecurityTests) score += 15
  if (!labelInfo.hasAccessibilityTests) score += 10
  
  // Priority multiplier
  if (labelInfo.priority === 'critical') score += 20
  if (labelInfo.priority === 'high') score += 10
  
  // Age factor (older = riskier)
  const ageInDays = Math.floor((Date.now() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24))
  if (ageInDays > 30) score += 15
  else if (ageInDays > 14) score += 5
  
  return Math.min(score, 100)
}

/**
 * Transform GitHub issues into our dashboard data model
 */
export async function fetchDashboardData(owner, repo, token) {
  const issues = await fetchIssues(owner, repo, token)
  
  // Filter to only include issues (not PRs)
  const userStories = issues.filter(issue => !issue.pull_request)
  
  // Transform issues to our story format
  const stories = userStories.map(issue => {
    const labelInfo = parseLabels(issue.labels)
    
    return {
      id: `#${issue.number}`,
      title: issue.title,
      status: mapStatus(issue),
      priority: labelInfo.priority,
      createdAt: new Date(issue.created_at),
      testCases: [],
      riskScore: calculateRiskScore(issue, labelInfo),
      hasTestCases: labelInfo.hasTestCases,
      hasEdgeCases: labelInfo.hasEdgeCases,
      hasNegativeTests: labelInfo.hasNegativeTests,
      hasSecurityTests: labelInfo.hasSecurityTests,
      hasAccessibilityTests: labelInfo.hasAccessibilityTests,
      url: issue.html_url
    }
  })
  
  // Calculate coverage metrics
  const totalStories = stories.length
  const storiesWithTests = stories.filter(s => s.hasTestCases).length
  const coveragePercent = totalStories > 0 ? Math.round((storiesWithTests / totalStories) * 100) : 0
  
  const coverage = {
    totalStories,
    storiesWithTests,
    coveragePercent,
    automationReadyPercent: Math.round(coveragePercent * 0.8), // Estimate
    byType: {
      functional: storiesWithTests > 0 ? Math.round((storiesWithTests / totalStories) * 100) : 0,
      edgeCase: Math.round((stories.filter(s => s.hasEdgeCases).length / Math.max(totalStories, 1)) * 100),
      negative: Math.round((stories.filter(s => s.hasNegativeTests).length / Math.max(totalStories, 1)) * 100),
      security: Math.round((stories.filter(s => s.hasSecurityTests).length / Math.max(totalStories, 1)) * 100),
      accessibility: Math.round((stories.filter(s => s.hasAccessibilityTests).length / Math.max(totalStories, 1)) * 100)
    }
  }
  
  // Calculate backlog health
  const withComplete = stories.filter(s => s.hasTestCases && s.hasEdgeCases && s.hasNegativeTests).length
  const withPartial = stories.filter(s => s.hasTestCases && (!s.hasEdgeCases || !s.hasNegativeTests)).length
  const withNone = stories.filter(s => !s.hasTestCases).length
  
  const avgAge = stories.length > 0 
    ? stories.reduce((sum, s) => sum + Math.floor((Date.now() - s.createdAt) / (1000 * 60 * 60 * 24)), 0) / stories.length
    : 0
  
  const health = {
    totalItems: totalStories,
    withCompleteCoverage: withComplete,
    withPartialCoverage: withPartial,
    withNoCoverage: withNone,
    avgAgingDays: Math.round(avgAge * 10) / 10,
    velocityTrend: 0 // Would need historical data
  }
  
  // Identify high-risk items
  const risks = stories
    .filter(s => s.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(s => {
      const reasons = []
      if (!s.hasTestCases) reasons.push('No test cases')
      if (!s.hasEdgeCases) reasons.push('Missing edge cases')
      if (!s.hasNegativeTests) reasons.push('Missing negative tests')
      if (!s.hasSecurityTests) reasons.push('Missing security tests')
      if (s.priority === 'critical') reasons.push('Critical priority')
      
      return {
        storyId: s.id,
        storyTitle: s.title,
        riskLevel: s.riskScore >= 70 ? 'critical' : s.riskScore >= 50 ? 'high' : 'medium',
        reasons,
        recommendation: !s.hasTestCases ? 'Generate test cases' : 'Add missing test coverage',
        url: s.url
      }
    })
  
  // Adoption metrics (placeholder - would need to track AI usage)
  const adoption = {
    totalAiSuggestions: 0,
    acceptedAsIs: 0,
    pmEdited: 0,
    rejected: 0,
    acceptanceRate: 0,
    avgEditsPerStory: 0
  }
  
  return { stories, coverage, health, risks, adoption }
}
