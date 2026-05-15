import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  title: string
  content: string
  onSave: (title: string, content: string) => void
}

export default function NoteEditor({ title, content, onSave }: Props): JSX.Element {
  const [localTitle, setLocalTitle] = useState(title)
  const [localContent, setLocalContent] = useState(content)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    setLocalTitle(title)
    setLocalContent(content)
  }, [title, content])

  const handleSave = (): void => {
    onSave(localTitle.trim(), localContent)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border">
        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="笔记标题"
          className="flex-1 text-sm font-medium text-white bg-transparent outline-none placeholder-muted-dim"
        />
        <div className="flex items-center gap-1 bg-surface-light rounded-lg p-0.5">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              !showPreview ? 'bg-surface text-white' : 'text-muted hover:text-white'
            }`}
          >
            编辑
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              showPreview ? 'bg-surface text-white' : 'text-muted hover:text-white'
            }`}
          >
            预览
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs text-white bg-surface-lighter border border-surface-border rounded-lg hover:bg-surface transition-colors"
        >
          保存
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {(!showPreview || localContent.trim().length === 0) && (
          <div className={`${showPreview ? 'w-1/2 border-r border-surface-border' : 'flex-1'}`}>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="输入 Markdown 内容..."
              className="w-full h-full p-4 text-sm text-white bg-transparent outline-none resize-none leading-relaxed placeholder-muted-dim font-mono"
              spellCheck={false}
            />
          </div>
        )}
        {showPreview && localContent.trim().length > 0 && (
          <div className={`${localContent.trim().length === 0 ? 'flex-1' : 'flex-1'} overflow-auto`}>
            <div className="p-4 text-sm text-white max-w-none leading-relaxed markdown-preview">
              <ReactMarkdown>{localContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
