import { createWorker, OEM } from 'tesseract.js'

export type OcrPhase = 'loading' | 'recognizing'
export type ProgressCallback = (phase: OcrPhase, pct: number) => void

export async function extractText(
  imageDataUrl: string,
  onProgress?: ProgressCallback,
): Promise<string> {
  const worker = await createWorker(['jpn', 'eng'], OEM.LSTM_ONLY, {
    workerPath: chrome.runtime.getURL('tesseract-worker.min.js'),
    corePath: chrome.runtime.getURL('tesseract-core-simd-lstm.wasm.js'),
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => {
      const pct = Math.round(m.progress * 100)
      if (m.status === 'recognizing text') {
        onProgress?.('recognizing', pct)
      } else if (
        m.status === 'loading language traineddata' ||
        m.status === 'initializing api' ||
        m.status === 'initializing tesseract'
      ) {
        onProgress?.('loading', pct)
      }
    },
  })

  const { data } = await worker.recognize(imageDataUrl)
  await worker.terminate()
  return data.text
}
