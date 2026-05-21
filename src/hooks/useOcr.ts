import { useState } from 'react'
import { extractText, type OcrPhase } from '@/services/ocrService'

type OcrState = 'idle' | 'loading' | 'done' | 'error'

export interface OcrProgress {
  phase: OcrPhase
  pct: number
}

export function useOcr() {
  const [state, setState] = useState<OcrState>('idle')
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function extract(imageDataUrl: string): Promise<string | null> {
    setState('loading')
    setProgress({ phase: 'loading', pct: 0 })
    setError(null)
    try {
      const text = await extractText(imageDataUrl, (phase, pct) => {
        setProgress({ phase, pct })
      })
      setState('done')
      setProgress(null)
      return text
    } catch (e) {
      let msg = 'OCR に失敗しました'
      if (e instanceof Error) msg = e.message
      else if (typeof e === 'string') msg = e
      else if (e && typeof e === 'object' && 'message' in e) msg = String((e as { message: unknown }).message)
      setError(msg)
      setState('error')
      setProgress(null)
      return null
    }
  }

  function reset() {
    setState('idle')
    setProgress(null)
    setError(null)
  }

  return { state, progress, error, extract, reset }
}
