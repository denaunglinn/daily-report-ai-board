import { useState } from 'react'
import './ReportOutput.css'

interface Props {
  text: string
  isPinned: boolean
  onBack: () => void
  onClear: () => void
  onPin: () => void
  onUnpin: () => void
}

export function ReportOutput({ text, isPinned, onBack, onClear, onPin, onUnpin }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="report-output">
      <div className="report-output__header">
        <button className="report-output__back" onClick={onBack}>← ボード</button>
        <span className="report-output__title">日報テキスト</span>
        <button
          className={`report-output__pin${isPinned ? ' report-output__pin--active' : ''}`}
          onClick={isPinned ? onUnpin : onPin}
          title={isPinned ? 'ブックマーク解除' : 'ブックマークに追加'}
        >
          {isPinned ? '📌' : '🔖'}
        </button>
      </div>

      <div className="report-output__body">
        <pre className="report-output__text">{text}</pre>
      </div>

      <div className="report-output__hint">
        Slack に貼り付けて使用してください
      </div>

      <div className="report-output__actions">
        <button className="ro-btn ro-btn--ghost" onClick={onClear}>削除</button>
        <button className="ro-btn ro-btn--primary" onClick={handleCopy}>
          {copied ? '✓ コピー済み' : '📋 コピー'}
        </button>
      </div>
    </div>
  )
}
