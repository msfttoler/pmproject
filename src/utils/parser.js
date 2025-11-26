/**
 * Parses markdown test cases from Copilot output into structured objects
 */
export function parseTestCases(text) {
  const testCases = []
  
  // Split by test case headers (### TC-XXX: Title)
  const tcRegex = /###\s*(TC-\d+):\s*(.+)/g
  const sections = text.split(/(?=###\s*TC-\d+:)/g).filter(s => s.trim())

  sections.forEach((section, index) => {
    const headerMatch = section.match(/###\s*(TC-\d+):\s*(.+)/)
    if (!headerMatch) return

    const id = headerMatch[1] || `TC-${String(index + 1).padStart(3, '0')}`
    const title = headerMatch[2]?.trim() || 'Untitled Test Case'

    // Extract fields using regex
    const priority = extractField(section, /\*\*Priority:\*\*\s*(\w+)/i) || 'Medium'
    const type = extractField(section, /\*\*Type:\*\*\s*([^\n*]+)/i) || 'Functional'
    const expected = extractField(section, /\*\*Expected Result:\*\*\s*([^\n]+)/i) || ''
    const automationRaw = extractField(section, /\*\*Automation Ready:\*\*\s*(\w+)/i) || 'No'
    const automationReady = automationRaw.toLowerCase() === 'yes'

    // Extract steps
    const stepsMatch = section.match(/\*\*Steps:\*\*([\s\S]*?)(?=\*\*|$)/i)
    const steps = []
    if (stepsMatch) {
      const stepLines = stepsMatch[1].match(/\d+\.\s*([^\n]+)/g)
      if (stepLines) {
        stepLines.forEach(line => {
          const step = line.replace(/^\d+\.\s*/, '').trim()
          if (step) steps.push(step)
        })
      }
    }

    testCases.push({
      id,
      title,
      priority,
      type,
      steps: steps.length ? steps : ['Execute test'],
      expected,
      automationReady
    })
  })

  // If no structured test cases found, create a generic one
  if (testCases.length === 0 && text.trim()) {
    testCases.push({
      id: 'TC-001',
      title: 'Imported Test Case',
      priority: 'Medium',
      type: 'Functional',
      steps: ['Review imported content'],
      expected: 'Test passes',
      automationReady: false
    })
  }

  return testCases
}

function extractField(text, regex) {
  const match = text.match(regex)
  return match ? match[1].trim() : null
}
