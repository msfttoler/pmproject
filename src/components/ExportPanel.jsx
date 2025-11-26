import { exportAsMarkdown, exportAsJSON, copyToClipboard } from '../utils/export'

export default function ExportPanel({ testCases, story }) {
  const handleExport = async (format) => {
    const content = format === 'json' 
      ? exportAsJSON(testCases, story) 
      : exportAsMarkdown(testCases, story)
    
    await copyToClipboard(content)
    alert(`${format.toUpperCase()} copied to clipboard!`)
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h2 className="text-sm font-semibold mb-3 text-slate-300">📤 Export</h2>
      <div className="flex gap-2">
        <button 
          onClick={() => handleExport('markdown')} 
          className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 px-4 rounded-lg text-sm transition-colors"
        >
          📄 Markdown
        </button>
        <button 
          onClick={() => handleExport('json')} 
          className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 px-4 rounded-lg text-sm transition-colors"
        >
          🔧 JSON
        </button>
      </div>
    </div>
  )
}
