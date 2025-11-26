/**
 * Platform Abstraction Layer
 * Unified interface for GitHub, Azure DevOps, and Jira
 */

// Unified data models
export const UnifiedIssue = {
  id: '',
  externalId: '',
  platform: '', // 'github' | 'azuredevops' | 'jira'
  title: '',
  description: '',
  state: '', // 'open' | 'closed' | 'in-progress'
  type: '', // 'feature' | 'bug' | 'task' | 'story'
  priority: '', // 'high' | 'medium' | 'low'
  storyPoints: null,
  labels: [],
  assignee: '',
  createdAt: null,
  closedAt: null,
  cycleTimeDays: null,
  url: '',
  projectKey: '',
  sprintName: ''
}

// Platform configurations
export const PLATFORMS = {
  github: {
    name: 'GitHub',
    icon: '🐙',
    color: 'slate',
    requiredFields: ['owner', 'repo', 'token'],
    optionalFields: []
  },
  azuredevops: {
    name: 'Azure DevOps',
    icon: '🔷',
    color: 'blue',
    requiredFields: ['organization', 'project', 'token'],
    optionalFields: ['team']
  },
  jira: {
    name: 'Jira',
    icon: '🔵',
    color: 'indigo',
    requiredFields: ['domain', 'email', 'apiToken', 'projectKey'],
    optionalFields: ['boardId']
  }
}

/**
 * Get all configured platforms from localStorage
 */
export function getConfiguredPlatforms() {
  const platforms = []
  
  try {
    // GitHub
    const github = JSON.parse(localStorage.getItem('github-config') || '{}')
    if (github.owner && github.repo && github.token) {
      platforms.push({ type: 'github', config: github })
    }
    
    // Azure DevOps
    const ado = JSON.parse(localStorage.getItem('azuredevops-config') || '{}')
    if (ado.organization && ado.project && ado.token) {
      platforms.push({ type: 'azuredevops', config: ado })
    }
    
    // Jira
    const jira = JSON.parse(localStorage.getItem('jira-config') || '{}')
    if (jira.domain && jira.email && jira.apiToken && jira.projectKey) {
      platforms.push({ type: 'jira', config: jira })
    }
  } catch (e) {
    console.error('Error loading platform configs:', e)
  }
  
  return platforms
}

/**
 * Save platform configuration
 */
export function savePlatformConfig(platform, config) {
  try {
    localStorage.setItem(`${platform}-config`, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('Failed to save config:', e)
    return false
  }
}

/**
 * Remove platform configuration
 */
export function removePlatformConfig(platform) {
  try {
    localStorage.removeItem(`${platform}-config`)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Normalize issue from any platform to unified format
 */
export function normalizeIssue(issue, platform) {
  switch (platform) {
    case 'github':
      return normalizeGitHubIssue(issue)
    case 'azuredevops':
      return normalizeAzureDevOpsWorkItem(issue)
    case 'jira':
      return normalizeJiraIssue(issue)
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

function normalizeGitHubIssue(issue) {
  const labels = (issue.labels || []).map(l => l.name || l)
  const created = new Date(issue.created_at)
  const closed = issue.closed_at ? new Date(issue.closed_at) : null
  
  // Extract story points from labels
  const pointsLabel = labels.find(l => 
    l.match(/^(sp|points?|story.?points?)[:\s-]?\d+$/i) ||
    l.match(/^\d+\s*(sp|points?)?$/i)
  )
  const points = pointsLabel ? parseInt(pointsLabel.match(/\d+/)?.[0] || '0') : null

  return {
    id: `github-${issue.number}`,
    externalId: String(issue.number),
    platform: 'github',
    title: issue.title,
    description: issue.body || '',
    state: issue.state === 'closed' ? 'closed' : 'open',
    type: detectIssueType(labels, issue.title),
    priority: detectPriority(labels),
    storyPoints: points,
    labels,
    assignee: issue.assignee?.login || '',
    createdAt: created,
    closedAt: closed,
    cycleTimeDays: closed ? Math.ceil((closed - created) / (1000 * 60 * 60 * 24)) : null,
    url: issue.html_url,
    projectKey: '',
    sprintName: ''
  }
}

function normalizeAzureDevOpsWorkItem(item) {
  const fields = item.fields || {}
  const created = new Date(fields['System.CreatedDate'])
  const closed = fields['Microsoft.VSTS.Common.ClosedDate'] 
    ? new Date(fields['Microsoft.VSTS.Common.ClosedDate']) 
    : null
  
  const state = fields['System.State']?.toLowerCase()
  const normalizedState = ['done', 'closed', 'resolved', 'completed'].includes(state) 
    ? 'closed' 
    : ['active', 'in progress', 'doing'].includes(state) 
      ? 'in-progress' 
      : 'open'

  const workItemType = fields['System.WorkItemType']?.toLowerCase()
  const type = workItemType === 'bug' ? 'bug' 
    : ['user story', 'story', 'feature'].includes(workItemType) ? 'feature'
    : ['task'].includes(workItemType) ? 'task'
    : 'task'

  return {
    id: `ado-${item.id}`,
    externalId: String(item.id),
    platform: 'azuredevops',
    title: fields['System.Title'] || '',
    description: fields['System.Description'] || '',
    state: normalizedState,
    type,
    priority: mapAdoPriority(fields['Microsoft.VSTS.Common.Priority']),
    storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
    labels: (fields['System.Tags'] || '').split(';').map(t => t.trim()).filter(Boolean),
    assignee: fields['System.AssignedTo']?.displayName || '',
    createdAt: created,
    closedAt: closed,
    cycleTimeDays: closed ? Math.ceil((closed - created) / (1000 * 60 * 60 * 24)) : null,
    url: item._links?.html?.href || `https://dev.azure.com/${item.url}`,
    projectKey: fields['System.TeamProject'] || '',
    sprintName: fields['System.IterationPath']?.split('\\').pop() || ''
  }
}

function normalizeJiraIssue(issue) {
  const fields = issue.fields || {}
  const created = new Date(fields.created)
  const resolved = fields.resolutiondate ? new Date(fields.resolutiondate) : null
  
  const status = fields.status?.name?.toLowerCase() || ''
  const normalizedState = ['done', 'closed', 'resolved'].includes(status)
    ? 'closed'
    : ['in progress', 'in review', 'testing'].includes(status)
      ? 'in-progress'
      : 'open'

  const issueType = fields.issuetype?.name?.toLowerCase() || ''
  const type = issueType === 'bug' ? 'bug'
    : ['story', 'user story', 'feature'].includes(issueType) ? 'feature'
    : ['epic'].includes(issueType) ? 'epic'
    : 'task'

  // Story points can be in different custom fields depending on Jira config
  const storyPoints = fields.customfield_10016 // Common field ID
    || fields.customfield_10026 
    || fields.customfield_10004
    || fields['Story Points']
    || null

  return {
    id: `jira-${issue.key}`,
    externalId: issue.key,
    platform: 'jira',
    title: fields.summary || '',
    description: fields.description || '',
    state: normalizedState,
    type,
    priority: fields.priority?.name?.toLowerCase() || 'medium',
    storyPoints: typeof storyPoints === 'number' ? storyPoints : null,
    labels: fields.labels || [],
    assignee: fields.assignee?.displayName || '',
    createdAt: created,
    closedAt: resolved,
    cycleTimeDays: resolved ? Math.ceil((resolved - created) / (1000 * 60 * 60 * 24)) : null,
    url: `https://${issue._domain}/browse/${issue.key}`,
    projectKey: fields.project?.key || '',
    sprintName: fields.sprint?.name || ''
  }
}

// Helper functions
function detectIssueType(labels, title) {
  const text = `${labels.join(' ')} ${title}`.toLowerCase()
  if (labels.some(l => ['bug', 'fix', 'type/bug'].includes(l.toLowerCase())) || /bug|fix/.test(text)) {
    return 'bug'
  }
  if (labels.some(l => ['feature', 'enhancement', 'type/feature'].includes(l.toLowerCase())) || /feature|new/.test(text)) {
    return 'feature'
  }
  if (labels.some(l => ['chore', 'maintenance'].includes(l.toLowerCase()))) {
    return 'chore'
  }
  return 'task'
}

function detectPriority(labels) {
  const labelStr = labels.join(' ').toLowerCase()
  if (/priority.?(high|critical|urgent|p0|p1)/.test(labelStr) || labels.some(l => l.toLowerCase().includes('blocker'))) {
    return 'high'
  }
  if (/priority.?(low|minor|p3|p4)/.test(labelStr)) {
    return 'low'
  }
  return 'medium'
}

function mapAdoPriority(priority) {
  if (priority <= 1) return 'high'
  if (priority >= 3) return 'low'
  return 'medium'
}

/**
 * Aggregate estimation model from multiple platforms
 */
export function buildCrossOrgEstimationModel(allIssues) {
  // Filter to closed issues only
  const closedIssues = allIssues.filter(i => i.state === 'closed' && i.cycleTimeDays)
  
  if (closedIssues.length < 5) {
    return { hasEnoughData: false, sampleSize: closedIssues.length, platforms: [] }
  }

  // Group by platform for reporting
  const byPlatform = {}
  closedIssues.forEach(i => {
    if (!byPlatform[i.platform]) byPlatform[i.platform] = []
    byPlatform[i.platform].push(i)
  })

  // Group by type
  const features = closedIssues.filter(i => i.type === 'feature')
  const bugs = closedIssues.filter(i => i.type === 'bug')
  const tasks = closedIssues.filter(i => i.type === 'task')

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  const avgCycleTime = {
    feature: avg(features.map(i => i.cycleTimeDays)) || 5,
    bug: avg(bugs.map(i => i.cycleTimeDays)) || 2,
    task: avg(tasks.map(i => i.cycleTimeDays)) || 3
  }

  // Complexity analysis from descriptions
  const withApi = closedIssues.filter(i => /api|endpoint|integration/i.test(i.title + i.description))
  const withDb = closedIssues.filter(i => /database|migration|schema/i.test(i.title + i.description))
  const withAuth = closedIssues.filter(i => /auth|login|permission|security/i.test(i.title + i.description))

  const baseAvg = avg(closedIssues.map(i => i.cycleTimeDays))

  const complexityMultipliers = {
    api: withApi.length > 2 ? avg(withApi.map(i => i.cycleTimeDays)) / baseAvg : 1.3,
    db: withDb.length > 2 ? avg(withDb.map(i => i.cycleTimeDays)) / baseAvg : 1.4,
    auth: withAuth.length > 2 ? avg(withAuth.map(i => i.cycleTimeDays)) / baseAvg : 1.5
  }

  // Story points to days ratio from pointed issues
  const pointedIssues = closedIssues.filter(i => i.storyPoints)
  const pointsToDays = pointedIssues.length > 3
    ? avg(pointedIssues.map(i => i.cycleTimeDays / i.storyPoints))
    : 1

  return {
    hasEnoughData: true,
    sampleSize: closedIssues.length,
    platforms: Object.keys(byPlatform).map(p => ({
      platform: p,
      count: byPlatform[p].length,
      name: PLATFORMS[p]?.name || p
    })),
    avgCycleTime,
    complexityMultipliers,
    pointsToDays,
    pointedIssuesCount: pointedIssues.length
  }
}

/**
 * Estimate story points using cross-org model
 */
export function estimateWithCrossOrgModel(title, description, labels, model) {
  if (!model.hasEnoughData) {
    return heuristicEstimate(title, description, labels)
  }

  const text = `${title} ${description}`.toLowerCase()
  const labelLower = labels.map(l => l.toLowerCase())

  // Determine type
  const isFeature = labelLower.some(l => ['feature', 'enhancement', 'story'].includes(l)) ||
                    /new|create|implement|feature/.test(text)
  const isBug = labelLower.some(l => ['bug', 'fix'].includes(l)) || /bug|fix|broken/.test(text)

  // Base estimate
  let baseDays = isFeature ? model.avgCycleTime.feature :
                 isBug ? model.avgCycleTime.bug :
                 model.avgCycleTime.task

  // Complexity multipliers
  const factors = []
  if (/api|endpoint|integration/i.test(text)) {
    baseDays *= model.complexityMultipliers.api
    factors.push('API/Integration work')
  }
  if (/database|migration|schema/i.test(text)) {
    baseDays *= model.complexityMultipliers.db
    factors.push('Database changes')
  }
  if (/auth|login|permission|security/i.test(text)) {
    baseDays *= model.complexityMultipliers.auth
    factors.push('Auth/Security')
  }

  // Convert to fibonacci
  const rawPoints = baseDays / model.pointsToDays
  const fibonacci = [1, 2, 3, 5, 8, 13, 21]
  const points = fibonacci.reduce((prev, curr) =>
    Math.abs(curr - rawPoints) < Math.abs(prev - rawPoints) ? curr : prev
  )

  const confidence = Math.min(95, 50 + model.sampleSize)

  return {
    points,
    estimatedDays: Math.round(baseDays),
    confidence,
    breakdown: {
      type: isFeature ? 'Feature' : isBug ? 'Bug' : 'Task',
      complexityFactors: factors,
      learnedFrom: model.platforms.map(p => `${p.name} (${p.count})`).join(', ')
    }
  }
}

function heuristicEstimate(title, description, labels) {
  const text = `${title} ${description}`.toLowerCase()
  let points = 3
  const factors = []

  if (/bug|fix/.test(text)) {
    points = 2
    factors.push('Bug fix (typically smaller)')
  } else if (/new|create|implement|feature/.test(text)) {
    points = 5
    factors.push('New feature')
  }

  if (/api|integration/.test(text)) { points += 2; factors.push('+2 API work') }
  if (/database|migration/.test(text)) { points += 2; factors.push('+2 Database') }
  if (/auth|security/.test(text)) { points += 2; factors.push('+2 Auth/Security') }
  if (/simple|small|minor/.test(text)) { points = Math.max(1, points - 2); factors.push('-2 Simple') }

  const fibonacci = [1, 2, 3, 5, 8, 13, 21]
  const finalPoints = fibonacci.reduce((prev, curr) =>
    Math.abs(curr - points) < Math.abs(prev - points) ? curr : prev
  )

  return {
    points: finalPoints,
    estimatedDays: finalPoints,
    confidence: 40,
    breakdown: {
      type: 'Unknown',
      complexityFactors: factors,
      learnedFrom: 'Heuristics only'
    },
    isHeuristic: true
  }
}

// ============================================
// Platform Connectors - API Integration
// ============================================

/**
 * GitHub Connector
 */
export class GitHubConnector {
  constructor(config) {
    this.owner = config.owner
    this.repo = config.repo
    this.token = config.token
    this.platform = 'github'
  }

  async fetchIssues(state = 'all') {
    const allIssues = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/issues?state=${state}&per_page=${perPage}&page=${page}`,
        { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' } }
      )
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
      
      const issues = await response.json()
      if (issues.length === 0) break
      
      allIssues.push(...issues.filter(i => !i.pull_request))
      if (issues.length < perPage) break
      page++
    }

    return allIssues.map(i => normalizeGitHubIssue(i))
  }

  async fetchMilestones() {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/milestones?state=all`,
      { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
    return response.json()
  }

  async fetchPullRequests(state = 'all') {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/pulls?state=${state}&per_page=100`,
      { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
    return response.json()
  }

  async testConnection() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}`,
        { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' } }
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch GitHub Actions workflow runs
   */
  async fetchWorkflowRuns(status = null) {
    let url = `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs?per_page=50`
    if (status) {
      url += `&status=${status}`
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' }
    })
    
    if (!response.ok) throw new Error(`GitHub Actions API error: ${response.status}`)
    
    const data = await response.json()
    return (data.workflow_runs || []).map(run => ({
      id: `github-${run.id}`,
      externalId: String(run.id),
      platform: 'github',
      name: run.name,
      workflowName: run.workflow_name || run.name,
      status: this._normalizeRunStatus(run.status, run.conclusion),
      conclusion: run.conclusion,
      branch: run.head_branch,
      commit: run.head_sha?.substring(0, 7),
      commitMessage: run.head_commit?.message?.split('\n')[0] || '',
      actor: run.actor?.login || '',
      actorAvatar: run.actor?.avatar_url,
      event: run.event,
      createdAt: new Date(run.created_at),
      updatedAt: new Date(run.updated_at),
      runNumber: run.run_number,
      duration: run.updated_at && run.created_at 
        ? Math.round((new Date(run.updated_at) - new Date(run.created_at)) / 1000)
        : null,
      url: run.html_url
    }))
  }

  _normalizeRunStatus(status, conclusion) {
    if (status === 'in_progress' || status === 'queued' || status === 'pending') {
      return 'running'
    }
    if (status === 'completed') {
      if (conclusion === 'success') return 'success'
      if (conclusion === 'failure') return 'failed'
      if (conclusion === 'cancelled') return 'cancelled'
      return conclusion || 'unknown'
    }
    return status
  }

  /**
   * Fetch available workflows
   */
  async fetchWorkflows() {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows`,
      { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
    
    const data = await response.json()
    return (data.workflows || []).map(wf => ({
      id: wf.id,
      name: wf.name,
      path: wf.path,
      state: wf.state
    }))
  }
}

/**
 * Azure DevOps Connector
 */
export class AzureDevOpsConnector {
  constructor(config) {
    this.organization = config.organization
    this.project = config.project
    this.token = config.token
    this.team = config.team || ''
    this.platform = 'azuredevops'
    this.baseUrl = `https://dev.azure.com/${this.organization}/${this.project}`
  }

  _getHeaders() {
    // Azure DevOps uses Basic auth with PAT (empty username, token as password)
    const auth = btoa(`:${this.token}`)
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  }

  async fetchIssues(state = 'all') {
    // WIQL query to get work items
    const stateFilter = state === 'closed' 
      ? "AND [System.State] IN ('Done', 'Closed', 'Resolved', 'Completed')"
      : state === 'open'
        ? "AND [System.State] NOT IN ('Done', 'Closed', 'Resolved', 'Completed')"
        : ''

    const wiql = {
      query: `SELECT [System.Id] FROM WorkItems 
              WHERE [System.TeamProject] = '${this.project}' 
              AND [System.WorkItemType] IN ('User Story', 'Bug', 'Task', 'Feature')
              ${stateFilter}
              ORDER BY [System.CreatedDate] DESC`
    }

    // Get work item IDs
    const queryResponse = await fetch(
      `${this.baseUrl}/_apis/wit/wiql?api-version=7.0`,
      { 
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(wiql)
      }
    )
    
    if (!queryResponse.ok) {
      const err = await queryResponse.text()
      throw new Error(`Azure DevOps WIQL error: ${queryResponse.status} - ${err}`)
    }

    const queryResult = await queryResponse.json()
    const ids = (queryResult.workItems || []).map(w => w.id)

    if (ids.length === 0) return []

    // Batch fetch work items (max 200 per request)
    const allItems = []
    for (let i = 0; i < ids.length; i += 200) {
      const batchIds = ids.slice(i, i + 200).join(',')
      const itemsResponse = await fetch(
        `${this.baseUrl}/_apis/wit/workitems?ids=${batchIds}&$expand=all&api-version=7.0`,
        { headers: this._getHeaders() }
      )
      
      if (!itemsResponse.ok) throw new Error(`Azure DevOps API error: ${itemsResponse.status}`)
      
      const items = await itemsResponse.json()
      allItems.push(...(items.value || []))
    }

    return allItems.map(i => normalizeAzureDevOpsWorkItem(i))
  }

  async fetchMilestones() {
    // Azure DevOps uses Iterations (Sprints) as milestones
    const response = await fetch(
      `${this.baseUrl}/${this.team}/_apis/work/teamsettings/iterations?api-version=7.0`,
      { headers: this._getHeaders() }
    )
    
    if (!response.ok) throw new Error(`Azure DevOps API error: ${response.status}`)
    
    const data = await response.json()
    return (data.value || []).map(iter => ({
      id: iter.id,
      name: iter.name,
      path: iter.path,
      startDate: iter.attributes?.startDate,
      finishDate: iter.attributes?.finishDate,
      timeFrame: iter.attributes?.timeFrame // 'past', 'current', 'future'
    }))
  }

  async fetchPullRequests(state = 'all') {
    const statusMap = { open: 'active', closed: 'completed', all: 'all' }
    const status = statusMap[state] || 'all'

    const response = await fetch(
      `${this.baseUrl}/_apis/git/pullrequests?searchCriteria.status=${status}&api-version=7.0`,
      { headers: this._getHeaders() }
    )
    
    if (!response.ok) throw new Error(`Azure DevOps API error: ${response.status}`)
    
    const data = await response.json()
    return (data.value || []).map(pr => ({
      id: pr.pullRequestId,
      title: pr.title,
      description: pr.description,
      state: pr.status === 'completed' ? 'merged' : pr.status === 'abandoned' ? 'closed' : 'open',
      author: pr.createdBy?.displayName || '',
      createdAt: pr.creationDate,
      sourceBranch: pr.sourceRefName?.replace('refs/heads/', ''),
      targetBranch: pr.targetRefName?.replace('refs/heads/', ''),
      url: `${this.baseUrl}/_git/${pr.repository?.name}/pullrequest/${pr.pullRequestId}`
    }))
  }

  async testConnection() {
    try {
      const response = await fetch(
        `${this.baseUrl}/_apis/projects?api-version=7.0`,
        { headers: this._getHeaders() }
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch Azure DevOps pipeline runs
   */
  async fetchPipelineRuns(status = null) {
    // First get all pipelines
    const pipelinesResponse = await fetch(
      `${this.baseUrl}/_apis/pipelines?api-version=7.0`,
      { headers: this._getHeaders() }
    )
    
    if (!pipelinesResponse.ok) {
      // Try build definitions API as fallback
      return this._fetchBuildRuns(status)
    }

    const pipelines = await pipelinesResponse.json()
    const allRuns = []

    // Fetch runs for each pipeline (limit to first 10 pipelines for performance)
    for (const pipeline of (pipelines.value || []).slice(0, 10)) {
      try {
        const runsResponse = await fetch(
          `${this.baseUrl}/_apis/pipelines/${pipeline.id}/runs?api-version=7.0`,
          { headers: this._getHeaders() }
        )
        
        if (runsResponse.ok) {
          const runs = await runsResponse.json()
          allRuns.push(...(runs.value || []).map(run => ({
            id: `ado-${run.id}`,
            externalId: String(run.id),
            platform: 'azuredevops',
            name: pipeline.name,
            workflowName: pipeline.name,
            status: this._normalizeAdoStatus(run.state, run.result),
            conclusion: run.result,
            branch: run.resources?.repositories?.self?.refName?.replace('refs/heads/', '') || '',
            commit: run.resources?.repositories?.self?.version?.substring(0, 7) || '',
            commitMessage: '',
            actor: run.createdBy?.displayName || '',
            event: 'push',
            createdAt: new Date(run.createdDate),
            updatedAt: new Date(run.finishedDate || run.createdDate),
            runNumber: run.id,
            duration: run.finishedDate && run.createdDate
              ? Math.round((new Date(run.finishedDate) - new Date(run.createdDate)) / 1000)
              : null,
            url: run._links?.web?.href || `${this.baseUrl}/_build/results?buildId=${run.id}`
          })))
        }
      } catch (e) {
        console.warn(`Failed to fetch runs for pipeline ${pipeline.name}:`, e)
      }
    }

    return allRuns.slice(0, 50) // Limit to 50 most recent
  }

  async _fetchBuildRuns(status = null) {
    // Fallback to classic builds API
    let url = `${this.baseUrl}/_apis/build/builds?api-version=7.0&$top=50`
    if (status === 'running') {
      url += '&statusFilter=inProgress,notStarted'
    } else if (status === 'failed') {
      url += '&resultFilter=failed'
    }

    const response = await fetch(url, { headers: this._getHeaders() })
    
    if (!response.ok) throw new Error(`Azure DevOps API error: ${response.status}`)
    
    const data = await response.json()
    return (data.value || []).map(build => ({
      id: `ado-${build.id}`,
      externalId: String(build.id),
      platform: 'azuredevops',
      name: build.definition?.name || 'Build',
      workflowName: build.definition?.name || 'Build',
      status: this._normalizeAdoStatus(build.status, build.result),
      conclusion: build.result,
      branch: build.sourceBranch?.replace('refs/heads/', '') || '',
      commit: build.sourceVersion?.substring(0, 7) || '',
      commitMessage: build.triggerInfo?.['ci.message'] || '',
      actor: build.requestedFor?.displayName || '',
      event: build.reason || 'manual',
      createdAt: new Date(build.queueTime || build.startTime),
      updatedAt: new Date(build.finishTime || build.startTime),
      runNumber: build.buildNumber,
      duration: build.finishTime && build.startTime
        ? Math.round((new Date(build.finishTime) - new Date(build.startTime)) / 1000)
        : null,
      url: build._links?.web?.href || `${this.baseUrl}/_build/results?buildId=${build.id}`
    }))
  }

  _normalizeAdoStatus(state, result) {
    if (state === 'inProgress' || state === 'notStarted') {
      return 'running'
    }
    if (state === 'completed') {
      if (result === 'succeeded') return 'success'
      if (result === 'failed') return 'failed'
      if (result === 'canceled') return 'cancelled'
      if (result === 'partiallySucceeded') return 'warning'
      return result || 'unknown'
    }
    return state
  }

  /**
   * Fetch pipeline definitions
   */
  async fetchPipelines() {
    const response = await fetch(
      `${this.baseUrl}/_apis/pipelines?api-version=7.0`,
      { headers: this._getHeaders() }
    )
    
    if (!response.ok) {
      // Fallback to build definitions
      const defResponse = await fetch(
        `${this.baseUrl}/_apis/build/definitions?api-version=7.0`,
        { headers: this._getHeaders() }
      )
      if (!defResponse.ok) throw new Error(`Azure DevOps API error: ${defResponse.status}`)
      const defs = await defResponse.json()
      return (defs.value || []).map(d => ({
        id: d.id,
        name: d.name,
        path: d.path,
        type: 'build'
      }))
    }
    
    const data = await response.json()
    return (data.value || []).map(p => ({
      id: p.id,
      name: p.name,
      folder: p.folder,
      type: 'yaml'
    }))
  }
}

/**
 * Jira Cloud Connector
 */
export class JiraConnector {
  constructor(config) {
    this.domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    this.email = config.email
    this.apiToken = config.apiToken
    this.projectKey = config.projectKey
    this.boardId = config.boardId
    this.platform = 'jira'
    this.baseUrl = `https://${this.domain}`
  }

  _getHeaders() {
    // Jira uses Basic auth with email:token
    const auth = btoa(`${this.email}:${this.apiToken}`)
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  async fetchIssues(state = 'all') {
    const stateJql = state === 'closed'
      ? ' AND status IN (Done, Closed, Resolved)'
      : state === 'open'
        ? ' AND status NOT IN (Done, Closed, Resolved)'
        : ''

    const jql = `project = ${this.projectKey}${stateJql} ORDER BY created DESC`
    const allIssues = []
    let startAt = 0
    const maxResults = 100

    while (true) {
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&expand=names`,
        { headers: this._getHeaders() }
      )
      
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Jira API error: ${response.status} - ${err}`)
      }

      const data = await response.json()
      const issues = (data.issues || []).map(i => ({ ...i, _domain: this.domain }))
      allIssues.push(...issues)

      if (startAt + issues.length >= data.total) break
      startAt += maxResults
    }

    return allIssues.map(i => normalizeJiraIssue(i))
  }

  async fetchMilestones() {
    // Jira uses Sprints (from Jira Software) as milestones
    // This requires knowing the board ID
    if (!this.boardId) {
      // Try to find the board for this project
      const boardsResponse = await fetch(
        `${this.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${this.projectKey}`,
        { headers: this._getHeaders() }
      )
      
      if (boardsResponse.ok) {
        const boards = await boardsResponse.json()
        if (boards.values?.length > 0) {
          this.boardId = boards.values[0].id
        }
      }
    }

    if (!this.boardId) return []

    const response = await fetch(
      `${this.baseUrl}/rest/agile/1.0/board/${this.boardId}/sprint?state=active,future,closed`,
      { headers: this._getHeaders() }
    )
    
    if (!response.ok) return []

    const data = await response.json()
    return (data.values || []).map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state, // 'active', 'closed', 'future'
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goal: sprint.goal
    }))
  }

  async fetchPullRequests() {
    // Jira doesn't have native PRs - they come from linked dev tools
    // Return empty array; PRs should come from GitHub/Azure DevOps
    return []
  }

  async testConnection() {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/myself`,
        { headers: this._getHeaders() }
      )
      return response.ok
    } catch {
      return false
    }
  }
}

// ============================================
// Platform Manager - Multi-Platform Coordinator
// ============================================

/**
 * PlatformManager - Coordinates data from multiple platforms
 */
export class PlatformManager {
  constructor() {
    this.connectors = []
  }

  /**
   * Load all configured platforms
   */
  loadConfiguredPlatforms() {
    this.connectors = []
    const platforms = getConfiguredPlatforms()

    for (const { type, config } of platforms) {
      try {
        switch (type) {
          case 'github':
            this.connectors.push(new GitHubConnector(config))
            break
          case 'azuredevops':
            this.connectors.push(new AzureDevOpsConnector(config))
            break
          case 'jira':
            this.connectors.push(new JiraConnector(config))
            break
        }
      } catch (e) {
        console.error(`Failed to create ${type} connector:`, e)
      }
    }

    return this.connectors.length
  }

  /**
   * Test all connections
   */
  async testAllConnections() {
    const results = {}
    for (const conn of this.connectors) {
      results[conn.platform] = await conn.testConnection()
    }
    return results
  }

  /**
   * Fetch issues from all platforms
   */
  async fetchAllIssues(state = 'all') {
    const results = { issues: [], errors: [] }

    await Promise.all(
      this.connectors.map(async (conn) => {
        try {
          const issues = await conn.fetchIssues(state)
          results.issues.push(...issues)
        } catch (e) {
          results.errors.push({ platform: conn.platform, error: e.message })
        }
      })
    )

    return results
  }

  /**
   * Fetch milestones/sprints from all platforms
   */
  async fetchAllMilestones() {
    const results = { milestones: [], errors: [] }

    await Promise.all(
      this.connectors.map(async (conn) => {
        try {
          const milestones = await conn.fetchMilestones()
          results.milestones.push(
            ...milestones.map(m => ({ ...m, platform: conn.platform }))
          )
        } catch (e) {
          results.errors.push({ platform: conn.platform, error: e.message })
        }
      })
    )

    return results
  }

  /**
   * Fetch PRs from platforms that support them
   */
  async fetchAllPullRequests(state = 'all') {
    const results = { pullRequests: [], errors: [] }

    await Promise.all(
      this.connectors.map(async (conn) => {
        try {
          const prs = await conn.fetchPullRequests(state)
          results.pullRequests.push(
            ...prs.map(pr => ({ ...pr, platform: conn.platform }))
          )
        } catch (e) {
          results.errors.push({ platform: conn.platform, error: e.message })
        }
      })
    )

    return results
  }

  /**
   * Get estimation model from all platforms combined
   */
  async buildCrossOrgEstimationModel() {
    const { issues } = await this.fetchAllIssues('closed')
    return buildCrossOrgEstimationModel(issues)
  }

  /**
   * Fetch CI/CD pipeline runs from all platforms that support them
   */
  async fetchAllPipelineRuns() {
    const results = { runs: [], errors: [] }

    await Promise.all(
      this.connectors.map(async (conn) => {
        // Only GitHub and Azure DevOps have CI/CD
        if (conn.platform === 'jira') return

        try {
          let runs = []
          if (conn.platform === 'github') {
            runs = await conn.fetchWorkflowRuns()
          } else if (conn.platform === 'azuredevops') {
            runs = await conn.fetchPipelineRuns()
          }
          results.runs.push(...runs)
        } catch (e) {
          results.errors.push({ platform: conn.platform, error: e.message })
        }
      })
    )

    // Sort by most recent first
    results.runs.sort((a, b) => b.createdAt - a.createdAt)

    return results
  }

  /**
   * Get CI/CD pipelines grouped by status
   */
  async getCICDSummary() {
    const { runs, errors } = await this.fetchAllPipelineRuns()
    
    const running = runs.filter(r => r.status === 'running')
    const failed = runs.filter(r => r.status === 'failed')
    const succeeded = runs.filter(r => r.status === 'success')
    const recent = runs.slice(0, 20)

    // Group by workflow/pipeline name
    const byWorkflow = {}
    runs.forEach(run => {
      const key = `${run.platform}-${run.workflowName}`
      if (!byWorkflow[key]) {
        byWorkflow[key] = {
          name: run.workflowName,
          platform: run.platform,
          runs: [],
          lastRun: null,
          successRate: 0
        }
      }
      byWorkflow[key].runs.push(run)
    })

    // Calculate success rates
    Object.values(byWorkflow).forEach(wf => {
      const completed = wf.runs.filter(r => r.status !== 'running')
      const successful = completed.filter(r => r.status === 'success')
      wf.successRate = completed.length > 0 
        ? Math.round((successful.length / completed.length) * 100) 
        : 0
      wf.lastRun = wf.runs[0] || null
    })

    return {
      running,
      failed,
      succeeded,
      recent,
      workflows: Object.values(byWorkflow),
      errors,
      totalRuns: runs.length
    }
  }
}

/**
 * Convenience function to get cross-org estimation data
 */
export async function getCrossOrgEstimationData() {
  const manager = new PlatformManager()
  const count = manager.loadConfiguredPlatforms()
  
  if (count === 0) {
    return { hasEnoughData: false, sampleSize: 0, platforms: [], error: 'No platforms configured' }
  }

  try {
    const model = await manager.buildCrossOrgEstimationModel()
    return model
  } catch (e) {
    return { hasEnoughData: false, sampleSize: 0, platforms: [], error: e.message }
  }
}
