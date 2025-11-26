// GitHub API extensions for PM features

const GITHUB_API = 'https://api.github.com'

/**
 * Fetch milestones for release readiness
 */
export async function fetchMilestones(owner, repo, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/milestones?state=open&sort=due_on`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
  return response.json()
}

/**
 * Fetch issues for a specific milestone
 */
export async function fetchMilestoneIssues(owner, repo, milestoneNumber, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues?milestone=${milestoneNumber}&state=all&per_page=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
  return response.json()
}

/**
 * Fetch pull requests
 */
export async function fetchPullRequests(owner, repo, token, state = 'open') {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
  return response.json()
}

/**
 * Fetch PR reviews
 */
export async function fetchPRReviews(owner, repo, prNumber, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
  return response.json()
}

/**
 * Fetch PR check runs (CI status)
 */
export async function fetchPRChecks(owner, repo, ref, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${ref}/check-runs`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
  return response.json()
}

/**
 * Build release readiness data from milestone
 */
export async function fetchReleaseReadiness(owner, repo, token) {
  const milestones = await fetchMilestones(owner, repo, token)
  
  if (milestones.length === 0) {
    return { releases: [], hasData: false }
  }

  const releases = await Promise.all(milestones.slice(0, 3).map(async (milestone) => {
    const issues = await fetchMilestoneIssues(owner, repo, milestone.number, token)
    
    const stories = issues.filter(i => !i.pull_request)
    const completed = stories.filter(i => i.state === 'closed')
    const open = stories.filter(i => i.state === 'open')
    
    // Find blockers (high priority open issues)
    const blockers = open.filter(i => 
      i.labels.some(l => ['blocker', 'priority/critical', 'priority/high', 'bug'].includes(l.name.toLowerCase()))
    )
    
    // Find issues missing test cases
    const missingTests = open.filter(i =>
      !i.labels.some(l => l.name.toLowerCase() === 'has-test-cases')
    )

    // Calculate days until due
    const daysUntilDue = milestone.due_on 
      ? Math.ceil((new Date(milestone.due_on) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      dueOn: milestone.due_on,
      daysUntilDue,
      url: milestone.html_url,
      totalStories: stories.length,
      completedStories: completed.length,
      openStories: open.length,
      completionPercent: stories.length > 0 ? Math.round((completed.length / stories.length) * 100) : 0,
      blockers: blockers.map(b => ({ 
        id: b.number, 
        title: b.title, 
        url: b.html_url,
        labels: b.labels.map(l => l.name)
      })),
      missingTests: missingTests.slice(0, 5).map(m => ({
        id: m.number,
        title: m.title,
        url: m.html_url
      })),
      stories: stories.map(s => ({
        id: s.number,
        title: s.title,
        state: s.state,
        labels: s.labels.map(l => l.name),
        url: s.html_url
      }))
    }
  }))

  return { releases, hasData: true }
}

/**
 * Build PR summary data for PMs
 */
export async function fetchPRSummaries(owner, repo, token) {
  const prs = await fetchPullRequests(owner, repo, token, 'open')
  
  if (!Array.isArray(prs) || prs.length === 0) {
    return []
  }
  
  const summaries = await Promise.all(prs.slice(0, 10).map(async (pr) => {
    let reviews = []
    let checks = { total: 0, passing: 0, failing: 0 }
    
    try {
      reviews = await fetchPRReviews(owner, repo, pr.number, token)
    } catch (e) {
      console.warn('Could not fetch reviews:', e)
    }
    
    try {
      const checkData = await fetchPRChecks(owner, repo, pr.head.sha, token)
      checks.total = checkData.check_runs?.length || 0
      checks.passing = checkData.check_runs?.filter(c => c.conclusion === 'success').length || 0
      checks.failing = checkData.check_runs?.filter(c => c.conclusion === 'failure').length || 0
    } catch (e) {
      console.warn('Could not fetch checks:', e)
    }

    // Count review states
    const approved = reviews.filter(r => r.state === 'APPROVED').length
    const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED').length
    const pending = reviews.filter(r => r.state === 'PENDING' || r.state === 'COMMENTED').length

    // Extract linked issues from PR body
    const linkedIssues = []
    const issuePattern = /#(\d+)/g
    let match
    while ((match = issuePattern.exec(pr.body || '')) !== null) {
      linkedIssues.push(match[1])
    }

    // Calculate age
    const ageInDays = Math.floor((Date.now() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24))

    return {
      number: pr.number,
      title: pr.title,
      author: pr.user?.login || 'unknown',
      authorAvatar: pr.user?.avatar_url || '',
      url: pr.html_url,
      state: pr.state,
      draft: pr.draft || false,
      createdAt: pr.created_at,
      ageInDays,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      changedFiles: pr.changed_files || 0,
      linkedIssues,
      reviews: {
        approved,
        changesRequested,
        pending,
        total: reviews.length
      },
      checks,
      labels: (pr.labels || []).map(l => ({ name: l.name, color: l.color })),
      milestone: pr.milestone?.title || null
    }
  }))

  return summaries
}

/**
 * Analyze a story for potential gaps
 */
export function analyzeStoryGaps(issue) {
  const gaps = []
  const title = issue.title.toLowerCase()
  const body = (issue.body || '').toLowerCase()
  const labels = issue.labels.map(l => l.name.toLowerCase())
  const fullText = `${title} ${body}`

  // Check for missing acceptance criteria
  if (!body.includes('acceptance criteria') && !body.includes('- [ ]') && !body.includes('given') && !body.includes('when')) {
    gaps.push({
      type: 'missing',
      category: 'Acceptance Criteria',
      message: 'No acceptance criteria found',
      severity: 'high',
      suggestion: 'Add clear acceptance criteria with checkboxes or Given/When/Then format'
    })
  }

  // Check for edge cases consideration
  if (!labels.includes('test/edge-cases') && !body.includes('edge case') && !body.includes('boundary')) {
    gaps.push({
      type: 'coverage',
      category: 'Edge Cases',
      message: 'No edge cases documented',
      severity: 'medium',
      suggestion: 'Consider: empty states, max limits, special characters, concurrent users'
    })
  }

  // Check for error handling
  if (!body.includes('error') && !body.includes('fail') && !body.includes('invalid') && !labels.includes('test/negative')) {
    gaps.push({
      type: 'coverage',
      category: 'Error Handling',
      message: 'No error scenarios defined',
      severity: 'medium',
      suggestion: 'Define behavior for: invalid input, network failures, permission denied'
    })
  }

  // Security considerations for sensitive features
  const securityKeywords = ['password', 'login', 'auth', 'payment', 'credit', 'personal', 'email', 'phone', 'address', 'admin', 'delete', 'export']
  const needsSecurity = securityKeywords.some(kw => fullText.includes(kw))
  if (needsSecurity && !labels.includes('test/security') && !body.includes('security')) {
    gaps.push({
      type: 'coverage',
      category: 'Security',
      message: 'Security-sensitive feature without security requirements',
      severity: 'high',
      suggestion: 'Add security requirements: input validation, authorization, data protection'
    })
  }

  // Accessibility for UI features
  const uiKeywords = ['button', 'form', 'modal', 'dialog', 'menu', 'dropdown', 'input', 'display', 'show', 'ui', 'page', 'screen']
  const isUIFeature = uiKeywords.some(kw => fullText.includes(kw))
  if (isUIFeature && !labels.includes('test/accessibility') && !body.includes('accessibility') && !body.includes('a11y')) {
    gaps.push({
      type: 'coverage',
      category: 'Accessibility',
      message: 'UI feature without accessibility requirements',
      severity: 'medium',
      suggestion: 'Consider: keyboard navigation, screen reader support, color contrast'
    })
  }

  // Performance for data-heavy features
  const perfKeywords = ['list', 'search', 'filter', 'export', 'import', 'load', 'fetch', 'sync', 'bulk', 'batch']
  const needsPerf = perfKeywords.some(kw => fullText.includes(kw))
  if (needsPerf && !body.includes('performance') && !body.includes('load time') && !body.includes('pagination')) {
    gaps.push({
      type: 'coverage',
      category: 'Performance',
      message: 'Data operation without performance requirements',
      severity: 'low',
      suggestion: 'Define: pagination limits, response time expectations, large dataset handling'
    })
  }

  // Check for test cases
  if (!labels.includes('has-test-cases')) {
    gaps.push({
      type: 'missing',
      category: 'Test Cases',
      message: 'No test cases generated',
      severity: 'high',
      suggestion: 'Generate test cases covering happy path, edge cases, and error scenarios'
    })
  }

  return {
    issueNumber: issue.number,
    title: issue.title,
    url: issue.html_url,
    gaps,
    gapCount: gaps.length,
    highSeverity: gaps.filter(g => g.severity === 'high').length,
    score: Math.max(0, 100 - (gaps.filter(g => g.severity === 'high').length * 25) - (gaps.filter(g => g.severity === 'medium').length * 10) - (gaps.filter(g => g.severity === 'low').length * 5))
  }
}

/**
 * Fetch and analyze all open issues for gaps
 */
export async function fetchStoryGapAnalysis(owner, repo, token) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues?state=open&per_page=50`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`)
  }
  
  const issues = await response.json()
  if (!Array.isArray(issues)) {
    throw new Error('Unexpected response format from GitHub API')
  }
  const stories = issues.filter(i => !i.pull_request)
  
  const analyzed = stories.map(analyzeStoryGaps)
  
  // Sort by gap count (most gaps first)
  analyzed.sort((a, b) => b.gapCount - a.gapCount)
  
  // Calculate summary stats
  const totalGaps = analyzed.reduce((sum, a) => sum + a.gapCount, 0)
  const avgScore = analyzed.length > 0 
    ? Math.round(analyzed.reduce((sum, a) => sum + a.score, 0) / analyzed.length)
    : 100

  return {
    stories: analyzed,
    summary: {
      totalStories: analyzed.length,
      totalGaps,
      avgScore,
      storiesWithHighGaps: analyzed.filter(a => a.highSeverity > 0).length,
      byCategory: {
        'Acceptance Criteria': analyzed.filter(a => a.gaps.some(g => g.category === 'Acceptance Criteria')).length,
        'Edge Cases': analyzed.filter(a => a.gaps.some(g => g.category === 'Edge Cases')).length,
        'Error Handling': analyzed.filter(a => a.gaps.some(g => g.category === 'Error Handling')).length,
        'Security': analyzed.filter(a => a.gaps.some(g => g.category === 'Security')).length,
        'Accessibility': analyzed.filter(a => a.gaps.some(g => g.category === 'Accessibility')).length,
        'Test Cases': analyzed.filter(a => a.gaps.some(g => g.category === 'Test Cases')).length
      }
    }
  }
}

/**
 * Generate release notes from closed issues in a milestone
 */
export function generateReleaseNotes(release) {
  const completed = release.stories.filter(s => s.state === 'closed')
  
  // Group by type based on labels
  const features = completed.filter(s => s.labels.some(l => ['feature', 'enhancement', 'type/feature'].includes(l.toLowerCase())))
  const bugfixes = completed.filter(s => s.labels.some(l => ['bug', 'fix', 'type/bug'].includes(l.toLowerCase())))
  const other = completed.filter(s => !features.includes(s) && !bugfixes.includes(s))

  let notes = `# Release Notes: ${release.title}\n\n`
  notes += `**Release Date:** ${release.dueOn ? new Date(release.dueOn).toLocaleDateString() : 'TBD'}\n\n`
  
  if (features.length > 0) {
    notes += `## ✨ New Features\n\n`
    features.forEach(f => {
      notes += `- ${f.title} (#${f.id})\n`
    })
    notes += '\n'
  }
  
  if (bugfixes.length > 0) {
    notes += `## 🐛 Bug Fixes\n\n`
    bugfixes.forEach(f => {
      notes += `- ${f.title} (#${f.id})\n`
    })
    notes += '\n'
  }
  
  if (other.length > 0) {
    notes += `## 📋 Other Changes\n\n`
    other.forEach(f => {
      notes += `- ${f.title} (#${f.id})\n`
    })
    notes += '\n'
  }

  return notes
}
