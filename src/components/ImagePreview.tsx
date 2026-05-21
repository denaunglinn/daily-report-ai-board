import type { Report } from '@/types'
import type { OcrProgress } from '@/hooks/useOcr'
import './ImagePreview.css'

function formatBytes(dataUrl: string): string {
  const bytes = Math.round((dataUrl.length * 3) / 4)
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function phaseLabel(progress: OcrProgress): string {
  if (progress.phase === 'loading') return `📦 言語データ準備中… ${progress.pct}%`
  return `🔍 テキスト認識中… ${progress.pct}%`
}

interface Props {
  report: Report
  onRemove: () => void
  onExtract: () => void
  isExtracting: boolean
  progress: OcrProgress | null
  extractError: string | null
}

export function ImagePreview({
  report,
  onRemove,
  onExtract,
  isExtracting,
  progress,
  extractError,
}: Props) {
  return (
    <div className="preview">
      <div className="preview__image-wrap">
        <img src={report.imageDataUrl} alt={report.fileName} className="preview__image" />
      </div>

      <div className="preview__meta">
        <div className="preview__meta-row">
          <span className="preview__filename" title={report.fileName}>{report.fileName}</span>
          <span className="preview__size">{formatBytes(report.imageDataUrl)}</span>
        </div>
        <span className="preview__date">{formatDate(report.capturedAt)}</span>
      </div>

      {isExtracting && progress && (
        <div className="preview__progress">
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <span className="progress-label">{phaseLabel(progress)}</span>
        </div>
      )}

      {extractError && <div className="preview__error">{extractError}</div>}

      <div className="preview__actions">
        <button className="btn btn--ghost" onClick={onRemove} disabled={isExtracting}>
          削除
        </button>
        <button
          className="btn btn--primary"
          onClick={onExtract}
          disabled={isExtracting}
        >
          {isExtracting ? <><span className="spinner" /> 処理中…</> : 'テキスト抽出 →'}
        </button>
      </div>

      {isExtracting && (
        <p className="preview__hint">処理中はポップアップを開いたままにしてください</p>
      )}
    </div>
  )
}
