const SEARCH_CATEGORIES = ['发现', '金融', '健康', '学术', '专利'] as const

export default function TopNav(): JSX.Element {
  return (
    <header className="h-12 border-b border-surface-border flex items-center px-6 gap-1 shrink-0 select-none">
      {SEARCH_CATEGORIES.map((cat) => (
        <button
          key={cat}
          className="nav-chip px-4 py-1.5 text-sm text-muted hover:text-white hover:bg-surface-light rounded-lg transition-colors"
        >
          {cat}
        </button>
      ))}
    </header>
  )
}
