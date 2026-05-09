import { useAppStore } from '../../stores/appStore'
import { useChatStore } from '../../stores/chatStore'
import { useConversationStore, nextMsgId } from '../../stores/conversationStore'
import { sendChatMessageStream } from '../../services/ai-client'

const CATEGORY_CHIPS = ['创建一项事业', '监测情况', '帮助我学习', '招聘', '创建原型'] as const

const PROMPT_EXAMPLES = [
  { title: '制作一个我本周就可以展示的路演幻灯片', subtitle: '帮助准备演讲材料' },
  { title: '分析这个数据集中的趋势和异常值', subtitle: '数据洞察与可视化建议' },
  { title: '撰写一份专业的技术方案文档', subtitle: '结构化技术文档生成' },
  { title: '帮我梳理这个项目的里程碑计划', subtitle: '项目管理与时间规划' }
]

export default function QuickPrompts(): JSX.Element {
  const setView = useAppStore((s) => s.setView)
  const getCurrentConfig = useAppStore((s) => s.getCurrentConfig)
  const createConversation = useConversationStore((s) => s.createConversation)
  const addMessage = useConversationStore((s) => s.addMessage)
  const setLoading = useChatStore((s) => s.setLoading)
  const appendStreamContent = useChatStore((s) => s.appendStreamContent)
  const flushStream = useChatStore((s) => s.flushStream)
  const isLoading = useChatStore((s) => s.isLoading)

  const handlePromptClick = async (title: string): Promise<void> => {
    if (isLoading) return

    const userMsg = { id: nextMsgId(), role: 'user' as const, content: title }
    createConversation(title)
    addMessage(userMsg)
    setView('chat')
    setLoading(true)

    const config = getCurrentConfig()

    try {
      await sendChatMessageStream(config, [userMsg], {
        onChunk: (chunk) => appendStreamContent(chunk),
        onDone: () => {
          const content = flushStream()
          if (content) {
            addMessage({ id: nextMsgId(), role: 'assistant', content })
          }
          setLoading(false)
        },
        onError: (error) => {
          flushStream()
          addMessage({ id: nextMsgId(), role: 'assistant', content: `Error: ${error}` })
          setLoading(false)
        }
      })
    } catch (err) {
      setLoading(false)
      addMessage({
        id: nextMsgId(),
        role: 'assistant',
        content: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
    }
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
