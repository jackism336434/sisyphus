import { useEffect, useRef, useState } from 'react'
import { Moon, Settings, LogOut, User } from 'lucide-react'
import { useAppStore, type Theme } from '../../stores/appStore'

interface UserMenuDropdownProps {
  triggerRef: React.RefObject<HTMLElement>
}

export default function UserMenuDropdown({ triggerRef }: UserMenuDropdownProps): JSX.Element | null {
  const { isUserMenuOpen, setUserMenuOpen, theme, setTheme, setView } = useAppStore()
  const [position, setPosition] = useState<{ top?: string; bottom?: string; left: number }>({ left: 0 })
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isUserMenuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const estimatedHeight = 220
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      if (spaceBelow >= estimatedHeight) {
        setPosition({ top: '100%', left: 0 })
      } else if (spaceAbove >= estimatedHeight) {
        setPosition({ bottom: '100%', left: 0 })
      } else {
        setPosition({ top: '0', left: 0 })
      }
    }
  }, [isUserMenuOpen, triggerRef])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
        setIsThemeDropdownOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setIsThemeDropdownOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen, setUserMenuOpen, triggerRef])

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme)
    setIsThemeDropdownOpen(false)
  }

  const handleSettingsClick = () => {
    setUserMenuOpen(false)
    setView('settings')
  }

  const handleAccountClick = () => {
    setUserMenuOpen(false)
    setView('account')
  }

  if (!isUserMenuOpen) return null

  const themeLabels: Record<Theme, string> = {
    light: '浅色',
    dark: '深色',
    system: '跟随系统'
  }

  return (
    <>
      <div
        ref={dropdownRef}
        className="absolute z-50 w-full animate-dropdown"
        style={{ top: position.top, bottom: position.bottom, left: position.left }}
      >
        <div className="glass-panel rounded-2xl p-3 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-xs text-white/70">user@example.com</span>
          </div>

          <div className="border-t border-white/10 pt-1 mt-1">
            <div className="relative">
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-white/70" />
                  <span>主题</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{themeLabels[theme]}</span>
                  <span className={`transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 ml-2 bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
                  {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeSelect(t)}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                        theme === t ? 'text-white bg-white/5' : 'text-muted'
                      }`}
                    >
                      {themeLabels[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleAccountClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <User size={18} className="text-white/70" />
              <span>账户</span>
            </button>

            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings size={18} className="text-white/70" />
              <span>设置</span>
            </button>

            <button
              onClick={() => setUserMenuOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut size={18} className="text-red-400" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dropdown {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-dropdown {
          animation: dropdown 0.15s ease-out;
        }
      `}</style>
    </>
  )
}