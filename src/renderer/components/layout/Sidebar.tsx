import { useAppStore } from '../../stores/appStore'

const NAV_ITEMS = [
  { id: 'skills', label: '技能', icon: '⚡' },
  { id: 'spaces', label: '空间', icon: '◻' },
  { id: 'custom', label: '自定义', icon: '⚙' },
  { id: 'history', label: '历史', icon: '◷' }
] as const

const RECENT_HISTORY = [
  'React Server Components 最佳实践',
  'Python 异步编程模式',
  'LLM 推理优化方案',
  '分布式系统一致性算法'
]

export default function Sidebar(): JSX.Element {
  const setView = useAppStore((s) => s.setView)

  return (
    <aside className="w-[240px] bg-[#0A0A0A] border-r border-surface-border flex flex-col select-none">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={() => setView('home')}
          className="w-full py-2.5 px-4 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          + 新建
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted hover:text-white hover:bg-surface-light rounded-lg"
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* History */}
      <div className="px-3 mt-2">
        <div className="text-xs text-muted-dim uppercase tracking-wider px-3 py-2 font-medium">
          最近
        </div>
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
          {RECENT_HISTORY.map((title, i) => (
            <button
              key={i}
              onClick={() => setView('chat')}
              className="sidebar-item w-full text-left px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface-light rounded-lg truncate block"
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-surface-border space-y-2">
        <button
          onClick={() => setView('settings')}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface-light rounded-lg"
        >
          <span className="text-base">⚙</span>
          <span>模型配置</span>
        </button>
        <button className="sidebar-item w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:text-white hover:bg-surface-light rounded-lg">
          <span className="text-base">⬆</span>
          <span>升级计划</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center text-xs font-medium text-white">
            U
          </div>
          <span className="text-sm text-muted flex-1 truncate">用户名</span>
          <span className="text-muted-dim text-sm">🔔</span>
        </div>
      </div>
    </aside>
  )
}
