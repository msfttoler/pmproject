import { useState } from 'react'

export default function GitHubConfig({ config, onSave, onClose }) {
  const [owner, setOwner] = useState(config.owner || '')
  const [repo, setRepo] = useState(config.repo || '')
  const [token, setToken] = useState(config.token || '')

  const handleSave = () => {
    onSave({ owner, repo, token })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-600">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">🔗 Connect to GitHub</h2>
          <p className="text-slate-400 text-sm mt-1">
            Link a repository to fetch real issues and coverage data
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Repository Owner
            </label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., msfttoler"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Repository Name
            </label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., pmproject"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              GitHub Token
              <span className="text-slate-500 font-normal ml-2">(with repo scope)</span>
            </label>
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Create a token at{' '}
              <a 
                href="https://github.com/settings/tokens/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                github.com/settings/tokens
              </a>
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-slate-200 mb-1">📋 Required Labels</p>
            <p className="text-slate-400 text-xs">
              Add these labels to your issues for coverage tracking:
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {['has-test-cases', 'test/edge-cases', 'test/security', 'priority/high'].map(label => (
                <span key={label} className="px-2 py-0.5 bg-slate-600 rounded text-xs">{label}</span>
              ))}
            </div>
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
            onClick={handleSave}
            disabled={!owner || !repo || !token}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Connect Repository
          </button>
        </div>
      </div>
    </div>
  )
}
