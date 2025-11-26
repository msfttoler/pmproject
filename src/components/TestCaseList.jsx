const priorityColors = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' }
const typeColors = { Functional: 'bg-blue-600', 'Edge Case': 'bg-purple-600', Negative: 'bg-orange-600', Security: 'bg-red-600', Accessibility: 'bg-teal-600' }

export default function TestCaseList({ testCases, setTestCases }) {
  if (!testCases.length) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center text-slate-400">
        <p className="text-4xl mb-2">📋</p>
        <p>Enter a user story and generate test cases</p>
      </div>
    )
  }

  const removeCase = (id) => setTestCases(testCases.filter(tc => tc.id !== id))

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>🧪 Generated Test Cases ({testCases.length})</span>
        <span className="text-sm font-normal text-slate-400">
          {testCases.filter(tc => tc.automationReady).length} automation-ready
        </span>
      </h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {testCases.map(tc => (
          <div key={tc.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-xs text-slate-400">{tc.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[tc.priority]}`}>{tc.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${typeColors[tc.type] || 'bg-slate-600'}`}>{tc.type}</span>
                  {tc.automationReady && <span className="text-xs text-green-400">🤖 Auto</span>}
                </div>
                <h3 className="font-medium text-slate-100">{tc.title}</h3>
                <p className="text-sm text-slate-400 mt-1">Expected: {tc.expected}</p>
              </div>
              <button onClick={() => removeCase(tc.id)} className="text-slate-500 hover:text-red-400 text-lg">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
