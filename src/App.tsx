import { useReport } from '@/hooks/useReport'
import { useOcr } from '@/hooks/useOcr'
import { parseReport } from '@/parser/reportParser'
import type { ParsedProject } from '@/types'
import { UploadZone } from '@/components/UploadZone'
import { ImagePreview } from '@/components/ImagePreview'
import { ExtractedText } from '@/components/ExtractedText'
import { TaskBoard } from '@/components/TaskBoard'
import './App.css'

type View = 'loading' | 'upload' | 'preview' | 'result' | 'board'

export default function App() {
  const { report, loading, saveReport, updateReport, clearReport } = useReport()
  const { state: ocrState, progress, error: ocrError, extract, reset: resetOcr } = useOcr()

  function getView(): View {
    if (loading) return 'loading'
    if (!report) return 'upload'
    if (report.parsedBoard) return 'board'
    if (report.rawText) return 'result'
    return 'preview'
  }

  const view = getView()

  async function handleFile(file: File, dataUrl: string) {
    resetOcr()
    await saveReport(file, dataUrl)
  }

  async function handleExtract() {
    if (!report) return
    const text = await extract(report.imageDataUrl)
    if (text) await updateReport({ rawText: text, status: 'parsed' })
  }

  async function handleParse() {
    if (!report?.rawText) return
    const parsedBoard = parseReport(report.rawText)
    await updateReport({ parsedBoard })
  }

  async function handleBackFromResult() {
    await updateReport({ rawText: null, status: 'pending' })
    resetOcr()
  }

  async function handleBackFromBoard() {
    await updateReport({ parsedBoard: null })
  }

  async function handleBoardUpdate(projects: ParsedProject[]) {
    await updateReport({ parsedBoard: projects })
  }

  async function handleClear() {
    await clearReport()
    resetOcr()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-icon">📋</div>
        <div className="header-text">
          <h1>Daily Report AI Board</h1>
          <span>Slack 日報 → タスクボード</span>
        </div>
        <span className="header-badge">Free</span>
      </header>

      <main className="content">
        {view === 'loading' && <div className="loading">読み込み中…</div>}

        {view === 'upload' && <UploadZone onFile={handleFile} />}

        {view === 'preview' && report && (
          <ImagePreview
            report={report}
            onRemove={handleClear}
            onExtract={handleExtract}
            isExtracting={ocrState === 'loading'}
            progress={progress}
            extractError={ocrError}
          />
        )}

        {view === 'result' && report && (
          <ExtractedText
            report={report}
            onBack={handleBackFromResult}
            onClear={handleClear}
            onParse={handleParse}
          />
        )}

        {view === 'board' && report?.parsedBoard && (
          <TaskBoard
            projects={report.parsedBoard}
            onBack={handleBackFromBoard}
            onClear={handleClear}
            onBoardUpdate={handleBoardUpdate}
          />
        )}
      </main>

      <footer className="footer">
        <span className="footer-version">v1.0.0</span>
        <div className="footer-tech">
          <span className="tech-tag">Tesseract</span>
          <span className="tech-tag">React</span>
          <span className="tech-tag">MV3</span>
        </div>
      </footer>
    </div>
  )
}
