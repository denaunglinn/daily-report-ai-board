export type TaskStatus = '進行中' | '完了' | '未着手' | 'ブロック中'

export interface HistoryProjectStat {
  name: string
  total: number
  done: number
}

export interface HistoryRecord {
  id: string
  generatedAt: string   // ISO timestamp
  fileName: string
  projects: HistoryProjectStat[]
}

export interface ParsedTask {
  id: string
  title: string
  status: TaskStatus
}

export interface ParsedProject {
  id: string
  name: string
  tasks: ParsedTask[]
}

export interface Report {
  id: string
  fileName: string
  imageDataUrl: string
  capturedAt: string
  rawText: string | null
  status: 'pending' | 'processing' | 'parsed' | 'error'
  parsedBoard: ParsedProject[] | null
}
