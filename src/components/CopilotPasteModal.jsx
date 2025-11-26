import { useState } from 'react'

export default function CopilotPasteModal({ prompt, onPaste, onClose }) {
  const [pastedText, setPastedText] = useState('')
  const [copied, setCopied] = useState(false)

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-600">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">🤖 Generate with Copilot</h2>
          <p className="text-slate-400 text-sm mt-1">Copy the prompt, paste in Copilot Chat, then paste the response here</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Copy Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Step 1: Copy this prompt</label>
              <button
                onClick={copyPrompt}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
              >
                {copied ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
            </div>
            <pre className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-700">
              {prompt}
            </pre>
          </div>

          {/* Step 2: Instructions */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-200 mb-2">Step 2: Paste in Copilot Chat</p>
            <p className="text-xs text-slate-400">
              Open GitHub Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I) and paste the prompt. Wait for the response.
            </p>
          </div>

          {/* Step 3: Paste Response */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Step 3: Paste Copilot's response here
            </label>
            <textarea
              className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Paste the generated test cases from Copilot here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onPaste(pastedText)}
            disabled={!pastedText.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            ✓ Import Test Cases
          </button>
        </div>
      </div>
    </div>
  )
}
