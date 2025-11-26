// Data models for PM Dashboard

// Sample data generator for demo
export function generateSampleData() {
  const stories = [
    { id: 'US-101', title: 'User login with SSO', status: 'done', priority: 'critical', createdAt: new Date('2025-11-01'), sprint: 'Sprint 23', testCases: [], riskScore: 15, hasEdgeCases: true, hasNegativeTests: true, hasSecurityTests: true, hasAccessibilityTests: true },
    { id: 'US-102', title: 'Password reset flow', status: 'review', priority: 'high', createdAt: new Date('2025-11-10'), sprint: 'Sprint 23', testCases: [], riskScore: 25, hasEdgeCases: true, hasNegativeTests: true, hasSecurityTests: true, hasAccessibilityTests: false },
    { id: 'US-103', title: 'Dashboard export to CSV', status: 'in-progress', priority: 'medium', createdAt: new Date('2025-11-15'), sprint: 'Sprint 24', testCases: [], riskScore: 45, hasEdgeCases: true, hasNegativeTests: false, hasSecurityTests: false, hasAccessibilityTests: false },
    { id: 'US-104', title: 'Push notification preferences', status: 'in-progress', priority: 'high', createdAt: new Date('2025-11-18'), sprint: 'Sprint 24', testCases: [], riskScore: 60, hasEdgeCases: false, hasNegativeTests: false, hasSecurityTests: true, hasAccessibilityTests: false },
    { id: 'US-105', title: 'Shopping cart checkout', status: 'backlog', priority: 'critical', createdAt: new Date('2025-10-20'), testCases: [], riskScore: 85, hasEdgeCases: false, hasNegativeTests: false, hasSecurityTests: false, hasAccessibilityTests: false },
    { id: 'US-106', title: 'Profile photo upload', status: 'backlog', priority: 'low', createdAt: new Date('2025-11-20'), testCases: [], riskScore: 30, hasEdgeCases: true, hasNegativeTests: true, hasSecurityTests: false, hasAccessibilityTests: false },
  ]

  const coverage = {
    totalStories: 48,
    storiesWithTests: 36,
    coveragePercent: 75,
    automationReadyPercent: 62,
    byType: { functional: 92, edgeCase: 68, negative: 54, security: 41, accessibility: 28 }
  }

  const health = {
    totalItems: 48,
    withCompleteCoverage: 24,
    withPartialCoverage: 12,
    withNoCoverage: 12,
    avgAgingDays: 8.5,
    velocityTrend: 12
  }

  const risks = [
    { storyId: 'US-105', storyTitle: 'Shopping cart checkout', riskLevel: 'critical', reasons: ['No test cases', 'Critical priority', 'Aging 35+ days'], recommendation: 'Generate test cases immediately' },
    { storyId: 'US-104', storyTitle: 'Push notification preferences', riskLevel: 'high', reasons: ['Missing edge cases', 'Missing negative tests'], recommendation: 'Add edge case and error handling tests' },
    { storyId: 'US-103', storyTitle: 'Dashboard export to CSV', riskLevel: 'medium', reasons: ['Missing security tests', 'Missing accessibility tests'], recommendation: 'Add security validation tests' },
  ]

  const adoption = {
    totalAiSuggestions: 284,
    acceptedAsIs: 156,
    pmEdited: 98,
    rejected: 30,
    acceptanceRate: 89,
    avgEditsPerStory: 2.3
  }

  return { stories, coverage, health, risks, adoption }
}
