import { useState } from 'react'
import { useAppStore, AI_MODELS, type AIProvider } from '../../stores/appStore'

export default function SettingsView(): JSX.Element {
  const configs = useAppStore((s) => s.configs)
  const updateConfig = useAppStore((s) => s.updateConfig)
  const setView = useAppStore((s) => s.setView)
  const [activeProvider, setActiveProvider] = useState<AIProvider>('deepseek')

  const activeCfg = configs[activeProvider]
  const providerData = AI_MODELS.find((m) => m.provider === activeProvider)

  return (
    <div className="flex flex-col h-full max-w-[640px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('home')}
          className="text-muted hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg font-medium text-white">模型配置</h2>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-1 mb-6 bg-surface-light rounded-xl p-1">
        {AI_MODELS.map((p) => (
          <button
            key={p.provider}
            onClick={() => setActiveProvider(p.provider)}
            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors
              ${activeProvider === p.provider
                ? 'bg-surface text-white'
                : 'text-muted hover:text-white'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Config form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-muted mb-2">API Key</label>
          <input
            type="password"
            value={activeCfg.apiKey}
            onChange={(e) => updateConfig(activeProvider, { apiKey: e.target.value })}
            placeholder="输入 API Key..."
            className="w-full bg-surface-light border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted-dim outline-none focus:border-muted transition-colors"
          />
          <p className="text-xs text-muted-dim mt-1.5">
            你的 API Key 仅存储在本地，不会上传到任何服务器
          </p>
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">Base URL</label>
          <input
            type="text"
            value={activeCfg.baseURL}
            onChange={(e) => updateConfig(activeProvider, { baseURL: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="w-full bg-surface-light border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted-dim outline-none focus:border-muted transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">模型</label>
          <div className="space-y-1.5">
            {providerData?.models.map((model) => (
              <button
                key={model}
                onClick={() => updateConfig(activeProvider, { model })}
                className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-colors flex items-center justify-between
                  ${activeCfg.model === model
                    ? 'border-white/30 bg-surface-light text-white'
                    : 'border-surface-border bg-transparent text-muted hover:border-muted'}`}
              >
                <span>{model}</span>
                {activeCfg.model === model && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 7l3.5 3.5L12 3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}

            {/* Custom model input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="或输入自定义模型名..."
                className="flex-1 bg-surface-light border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted-dim outline-none focus:border-muted transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateConfig(activeProvider, { model: (e.target as HTMLInputElement).value.trim() })
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-8 pt-6 border-t border-surface-border">
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${activeCfg.apiKey && !activeCfg.apiKey.startsWith('sk-placeholder') ? 'bg-green-400' : 'bg-yellow-600'}`} />
          <span className="text-muted">
            {activeCfg.apiKey && !activeCfg.apiKey.startsWith('sk-placeholder')
              ? `${providerData?.label} 已配置`
              : `${providerData?.label} 需要配置 API Key`}
          </span>
        </div>
      </div>
    </div>
  )
}
