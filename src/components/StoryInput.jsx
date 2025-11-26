export default function StoryInput({ story, setStory, onGenerate }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">📝 User Story</h2>
      <textarea
        className="w-full h-48 bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="As a [user type], I want to [action] so that [benefit]...&#10;&#10;Example: As a user, I want to reset my password so I can regain access if I forget it."
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <button
        onClick={onGenerate}
        disabled={!story.trim()}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        🤖 Generate with Copilot
      </button>
      <p className="mt-3 text-xs text-slate-500 text-center">
        Opens a prompt to use with GitHub Copilot Chat
      </p>
    </div>
  )
}
