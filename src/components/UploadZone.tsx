import { useRef, useState } from 'react'
import './UploadZone.css'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

interface Props {
  onFile: (file: File, dataUrl: string) => void
}

export function UploadZone({ onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragCount = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('PNG / JPG / WebP のみ対応しています')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('ファイルサイズは 5MB 以下にしてください')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onFile(file, reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCount.current++
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCount.current--
    if (dragCount.current === 0) setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCount.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'upload-zone--dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleInputChange}
        className="upload-zone__input"
        tabIndex={-1}
      />

      <div className="upload-zone__icon">{isDragging ? '📂' : '📸'}</div>

      <p className="upload-zone__primary">
        {isDragging ? 'ドロップして追加' : 'スクリーンショットをドロップ'}
      </p>
      <p className="upload-zone__secondary">
        または<span className="upload-zone__link">クリックして選択</span>
      </p>
      <p className="upload-zone__hint">PNG・JPG・WebP ／ 最大 5MB</p>

      {error && <p className="upload-zone__error">{error}</p>}
    </div>
  )
}
