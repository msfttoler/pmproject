export function exportAsMarkdown(testCases, story) {
  let md = `# Test Cases\n\n## User Story\n${story}\n\n## Test Cases\n\n`
  
  testCases.forEach(tc => {
    md += `### ${tc.id}: ${tc.title}\n`
    md += `**Priority:** ${tc.priority}\n`
    md += `**Type:** ${tc.type}\n`
    md += `**Preconditions:** ${tc.preconditions || 'None'}\n`
    md += `**Steps:**\n${tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`
    md += `**Expected Result:** ${tc.expected}\n`
    md += `**Automation Ready:** ${tc.automationReady ? 'Yes' : 'No'}\n\n`
  })
  
  return md
}

export function exportAsJSON(testCases, story) {
  return JSON.stringify({ story, testCases, exportedAt: new Date().toISOString() }, null, 2)
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
}
