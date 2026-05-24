import { useState } from 'react'
import { useReport } from '@/hooks/useReport'
import { useOcr } from '@/hooks/useOcr'
import { useHistory } from '@/hooks/useHistory'
import { usePinned } from '@/hooks/usePinned'
import { useSettings } from '@/hooks/useSettings'
import { parseReport } from '@/parser/reportParser'
import { generateDailyReport } from '@/parser/reportGenerator'
import type { ParsedProject } from '@/types'
import { UploadZone } from '@/components/UploadZone'
import { ImagePreview } from '@/components/ImagePreview'
import { ExtractedText } from '@/components/ExtractedText'
import { TaskBoard } from '@/components/TaskBoard'
import { ReportOutput } from '@/components/ReportOutput'
import { HistoryView } from '@/components/HistoryView'
import { TemplateEditor } from '@/components/TemplateEditor'
import './App.css'

type View = 'loading' | 'upload' | 'preview' | 'result' | 'board' | 'output'
type Overlay = null | 'history' | 'template'

export default function App() {
  const { report, loading, saveReport, updateReport, clearReport } = useReport()
  const { state: ocrState, progress, error: ocrError, extract, reset: resetOcr } = useOcr()
  const { records, addRecord, clearAll: clearHistory } = useHistory()
  const { pinned, pin, unpin, clearAll: clearPinned, isPinned } = usePinned()
  const { template, saveTemplate, resetTemplate } = useSettings()
  const [generatedText, setGeneratedText] = useState<string | null>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)

  function getView(): View {
    if (loading) return 'loading'
    if (!report) return 'upload'
    if (generatedText !== null) return 'output'
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

  async function handleGenerate() {
    if (!report?.parsedBoard) return
    setGeneratedText(generateDailyReport(report.parsedBoard, template))
    await addRecord(report.fileName, report.parsedBoard)
  }

  async function handleBackFromResult() {
    await updateReport({ rawText: null, status: 'pending' })
    resetOcr()
  }

  async function handleBackFromBoard() {
    await updateReport({ parsedBoard: null })
  }

  function handleBackFromOutput() {
    setGeneratedText(null)
  }

  async function handleBoardUpdate(projects: ParsedProject[]) {
    await updateReport({ parsedBoard: projects })
  }

  async function handleClear() {
    setGeneratedText(null)
    setOverlay(null)
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
        <button
          className="header-icon-btn"
          onClick={() => setOverlay(v => v === 'template' ? null : 'template')}
          title="テンプレート編集"
        >⚙</button>
        <button
          className="header-icon-btn"
          onClick={() => setOverlay(v => v === 'history' ? null : 'history')}
          title="履歴"
        >📊</button>
      </header>

      <main className="content">
        {overlay === 'history' && (
          <HistoryView
            records={records}
            pinned={pinned}
            onClose={() => setOverlay(null)}
            onClear={clearHistory}
            onUnpin={unpin}
            onClearPinned={clearPinned}
          />
        )}

        {overlay === 'template' && (
          <TemplateEditor
            template={template}
            onSave={saveTemplate}
            onReset={resetTemplate}
            onClose={() => setOverlay(null)}
          />
        )}

        {!overlay && view === 'loading' && <div className="loading">読み込み中…</div>}

        {!overlay && view === 'upload' && <UploadZone onFile={handleFile} />}

        {!overlay && view === 'preview' && report && (
          <ImagePreview
            report={report}
            onRemove={handleClear}
            onExtract={handleExtract}
            isExtracting={ocrState === 'loading'}
            progress={progress}
            extractError={ocrError}
          />
        )}

        {!overlay && view === 'result' && report && (
          <ExtractedText
            report={report}
            onBack={handleBackFromResult}
            onClear={handleClear}
            onParse={handleParse}
          />
        )}

        {!overlay && view === 'board' && report?.parsedBoard && (
          <TaskBoard
            projects={report.parsedBoard}
            onBack={handleBackFromBoard}
            onClear={handleClear}
            onBoardUpdate={handleBoardUpdate}
            onGenerate={handleGenerate}
          />
        )}

        {!overlay && view === 'output' && generatedText !== null && (
          <ReportOutput
            text={generatedText}
            isPinned={isPinned(generatedText)}
            onBack={handleBackFromOutput}
            onClear={handleClear}
            onPin={() => pin(generatedText)}
            onUnpin={() => {
              const p = pinned.find(x => x.text === generatedText)
              if (p) unpin(p.id)
            }}
          />
        )}
      </main>

      <footer className="footer">
        <span className="footer-version">v1.1.0</span>
        <div className="footer-tech">
          <span className="tech-tag">Tesseract</span>
          <span className="tech-tag">React</span>
          <span className="tech-tag">MV3</span>
        </div>
      </footer>
    </div>
  )
}
