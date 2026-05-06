import { useState } from 'react'
import { useAppStore, AI_MODELS } from '../../stores/appStore'
import { useChatStore, nextId } from '../../stores/chatStore'

export default function InputBox(): JSX.Element {
  const [value, setValue] = useState('')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const selectedProvider = useAppStore((s) => s.selectedProvider)
  const selectedModel = useAppStore((s) => s.selectedModel)
  const setProvider = useAppStore((s) => s.setProvider)
  const setModel = useAppStore((s) => s.setModel)
  const setView = useAppStore((s) => s.setView)
  const addMessage = useChatStore((s) => s.addMessage)

  const currentProviderData = AI_MODELS.find((m) => m.provider === selectedProvider)

  const handleSubmit = (): void => {
    const trimmed = value.trim()
    if (!trimmed) return

    addMessage({ id: nextId(), role: 'user', content: trimmed })
    setValue('')
    setView('chat')
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-[680px] mx-auto px-4">
      {/* Main Input */}
      <div className="input-glow relative bg-surface-light border border-surface-border rounded-2xl transition-shadow">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问任何事情..."
          rows={2}
          className="w-full bg-transparent text-white placeholder-muted-dim text-base px-5 pt-4 pb-2 resize-none outline-none leading-relaxed"
          style={{ minHeight: '64px', maxHeight: '200px' }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2v12M2 8h12" strokeLinecap="round" />
              </svg>
            </button>
            <button className="p-2 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 4v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>{currentProviderData?.label}</span>
                <span className="text-muted-dim">{selectedModel}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute bottom-full right-0 mb-1 z-20 w-56 bg-surface-light border border-surface-border rounded-xl shadow-2xl py-1.5">
                    {AI_MODELS.map((provider) => (
                      <div key={provider.provider}>
                        <div className="px-3 py-1.5 text-xs text-muted-dim font-medium">
                          {provider.label}
                        </div>
                        {provider.models.map((model) => (
                          <button
                            key={model}
                            onClick={() => {
                              setProvider(provider.provider)
                              setModel(model)
                              setShowModelMenu(false)
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-lighter transition-colors flex items-center gap-2
                              ${selectedProvider === provider.provider && selectedModel === model ? 'text-white' : 'text-muted'}`}
                          >
                            {selectedProvider === provider.provider && selectedModel === model && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <span className={selectedProvider === provider.provider && selectedModel === model ? '' : 'ml-5'}>
                              {model}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="p-2 text-white disabled:text-muted-dim hover:bg-surface-lighter rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8l12-6-4 12-3-6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
