import { useState } from 'react'
import type { ReportTemplate } from '@/storage/settingsStorage'
import './TemplateEditor.css'

interface Props {
  template: ReportTemplate
  onSave: (t: ReportTemplate) => void
  onReset: () => void
  onClose: () => void
}

export function TemplateEditor({ template, onSave, onReset, onClose }: Props) {
  const [greeting, setGreeting] = useState(template.greeting)
  const [heading,  setHeading]  = useState(template.heading)
  const [footer,   setFooter]   = useState(template.footer)
  const [saved,    setSaved]    = useState(false)

  function handleSave() {
    onSave({ greeting, heading, footer })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  function handleReset() {
    onReset()
    setGreeting('お疲れ様です。')
    setHeading('本日の作業')
    setFooter('')
  }

  return (
    <div className="tmpl">
      <div className="tmpl__topbar">
        <button className="tmpl__back" onClick={onClose}>← 戻る</button>
        <span className="tmpl__title">テンプレート編集</span>
        <button className="tmpl__reset" onClick={handleReset} title="デフォルトに戻す">↺</button>
      </div>

      <div className="tmpl__body">
        <div className="tmpl__field">
          <label className="tmpl__label">挨拶文</label>
          <input
            className="tmpl__input"
            value={greeting}
            onChange={e => setGreeting(e.target.value)}
            placeholder="お疲れ様です。"
          />
        </div>

        <div className="tmpl__field">
          <label className="tmpl__label">見出し</label>
          <input
            className="tmpl__input"
            value={heading}
            onChange={e => setHeading(e.target.value)}
            placeholder="本日の作業"
          />
        </div>

        <div className="tmpl__field">
          <label className="tmpl__label">フッター <span className="tmpl__optional">任意</span></label>
          <input
            className="tmpl__input"
            value={footer}
            onChange={e => setFooter(e.target.value)}
            placeholder="よろしくお願いします。"
          />
        </div>

        <div className="tmpl__preview-box">
          <p className="tmpl__preview-label">プレビュー</p>
          <pre className="tmpl__preview">{buildPreview(greeting, heading, footer)}</pre>
        </div>
      </div>

      <button className="tmpl__save-btn" onClick={handleSave}>
        {saved ? '✓ 保存しました' : '保存'}
      </button>
    </div>
  )
}

function buildPreview(greeting: string, heading: string, footer: string): string {
  const lines: string[] = []
  if (greeting) lines.push(greeting)
  if (heading)  lines.push(heading)
  lines.push('')
  lines.push('● プロジェクト名')
  lines.push('　○ タスク名  :done:')
  lines.push('')
  if (footer) { lines.push(footer) }
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}
