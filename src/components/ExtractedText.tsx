import { useState } from 'react'
import type { Report } from '@/types'
import './ExtractedText.css'

interface Props {
  report: Report
  onBack: () => void
  onClear: () => void
  onParse: () => void
}

export function ExtractedText({ report, onBack, onClear, onParse }: Props) {
  const text = report.rawText ?? ''
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="extracted">
      <div className="extracted__header">
        <button className="extracted__back" onClick={onBack}>← 戻る</button>
        <span className="extracted__count">{text.length.toLocaleString('ja-JP')} 文字</span>
      </div>

      <div className="extracted__body">
        <pre className="extracted__text">{text}</pre>
      </div>

      <div className="extracted__actions">
        <button className="btn btn--ghost" onClick={onClear}>削除</button>
        <button className="btn btn--ghost" onClick={handleCopy}>
          {copied ? '✓ コピー済み' : 'コピー'}
        </button>
        <button className="btn btn--primary" onClick={onParse}>
          タスク解析 →
        </button>
      </div>
    </div>
  )
}
