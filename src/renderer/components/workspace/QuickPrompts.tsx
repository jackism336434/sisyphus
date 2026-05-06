import { useAppStore } from '../../stores/appStore'
import { useChatStore, nextId } from '../../stores/chatStore'

const CATEGORY_CHIPS = ['创建一项事业', '监测情况', '帮助我学习', '招聘', '创建原型'] as const

const PROMPT_EXAMPLES = [
  { title: '制作一个我本周就可以展示的路演幻灯片', subtitle: '帮助准备演讲材料' },
  { title: '分析这个数据集中的趋势和异常值', subtitle: '数据洞察与可视化建议' },
  { title: '撰写一份专业的技术方案文档', subtitle: '结构化技术文档生成' },
  { title: '帮我梳理这个项目的里程碑计划', subtitle: '项目管理与时间规划' }
]

export default function QuickPrompts(): JSX.Element {
  const setView = useAppStore((s) => s.setView)
  const addMessage = useChatStore((s) => s.addMessage)

  const handlePromptClick = (title: string): void => {
    addMessage({ id: nextId(), role: 'user', content: title })
    setView('chat')
  }

  return (
    <div className="w-full max-w-[680px] mx-auto px-4 mt-10">
      {/* Section label */}
      <div className="text-xs text-muted-dim uppercase tracking-wider mb-3 font-medium">
        Computer
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip}
            className="prompt-chip px-4 py-1.5 text-sm text-muted bg-surface-light border border-surface-border rounded-full hover:text-white hover:border-muted transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Prompt example cards */}
      <div className="grid grid-cols-2 gap-3">
        {PROMPT_EXAMPLES.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handlePromptClick(prompt.title)}
            className="text-left p-4 bg-surface-light border border-surface-border rounded-xl hover:border-muted transition-colors group"
          >
            <div className="text-sm text-white font-medium mb-1 group-hover:text-white/90">
              {prompt.title}
            </div>
            <div className="text-xs text-muted-dim">{prompt.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
