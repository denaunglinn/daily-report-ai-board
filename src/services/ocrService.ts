import { createWorker, OEM } from 'tesseract.js'

export type OcrPhase = 'loading' | 'recognizing'
export type ProgressCallback = (phase: OcrPhase, pct: number) => void

// CJK character ranges: hiragana, katakana, kanji, fullwidth, CJK symbols
const CJK = '぀-ヿ一-鿿！-｠　-〿'

// Matches a run of CJK chars separated by spaces — e.g. "お は よ う"
const CJK_SPACED = new RegExp(`[${CJK}](?:\\s+[${CJK}])+`, 'g')

function normalizeText(raw: string): string {
  return raw
    .split('\n')
    .map(line =>
      line
        // Remove leading pipe characters (table-border OCR artifact)
        .replace(/^[\|｜]+\s*/, '')
        // Collapse spaces between consecutive CJK characters
        .replace(CJK_SPACED, match => match.replace(/\s+/g, ''))
        // Restore ● from OCR artifact "e " at line start
        .replace(/^(\s*)e\s+/, '$1● ')
        // Restore ○ from OCR artifact "o " / "O " / "0 " at line start
        .replace(/^(\s*)[oO0]\s+/, '$1○ '),
    )
    .join('\n')
}

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
  return normalizeText(data.text)
}
