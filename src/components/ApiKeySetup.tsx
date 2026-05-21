import { useState } from 'react'
import './ApiKeySetup.css'

interface Props {
  onSave: (apiKey: string) => void
}

export function ApiKeySetup({ onSave }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('"sk-ant-" で始まる Anthropic API キーを入力してください')
      return
    }
    onSave(trimmed)
  }

  return (
    <div className="api-setup">
      <div className="api-setup__icon">🔑</div>
      <h2 className="api-setup__title">API キーを設定</h2>
      <p className="api-setup__desc">
        テキスト抽出に Anthropic Claude を使用します。
        キーはこのデバイスにのみ保存されます。
      </p>

      <form className="api-setup__form" onSubmit={handleSubmit}>
        <input
          className={`api-setup__input ${error ? 'api-setup__input--error' : ''}`}
          type="password"
          placeholder="sk-ant-api03-..."
          value={value}
          onChange={e => { setValue(e.target.value); setError(null) }}
          autoFocus
          spellCheck={false}
        />
        {error && <p className="api-setup__error">{error}</p>}
        <button className="api-setup__btn" type="submit" disabled={!value.trim()}>
          保存して続ける
        </button>
      </form>

      <a
        className="api-setup__link"
        href="https://console.anthropic.com/keys"
        target="_blank"
        rel="noopener noreferrer"
      >
        API キーを取得 →
      </a>
    </div>
  )
}
