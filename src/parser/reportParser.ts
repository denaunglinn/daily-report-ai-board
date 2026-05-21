import type { ParsedProject, ParsedTask, TaskStatus } from '@/types'

// ── Header patterns ──────────────────────────────────────────────────────────

// 【プロジェクト名】 or 《...》 etc.
const BRACKET_HEADER = /^[【《＜≪\[](.+?)[】》≫\]＞>]$/

// ■ ◆ ● ▶ ★ prefixed lines
const PREFIX_HEADER = /^[■◆●▶★☆◎◉▼△▲◇◈]+\s*(.+)/

// Markdown-style: ## Title
const MD_HEADER = /^#{1,3}\s+(.+)/

// ── Task bullet patterns ─────────────────────────────────────────────────────

// Matches leading bullet/number and whitespace
const TASK_BULLET =
  /^[\s　]*(?:[・\-–—•*＊◦‣⁃→➤►▸►]|\d+[.）)．]\s+|\([0-9a-zA-Zあ-ん]\)\s+|[①-⑳]\s*)\s*/

// ── Status keyword maps ──────────────────────────────────────────────────────

const STATUS_RULES: [TaskStatus, RegExp][] = [
  ['完了',     /完了|done|対応済|DONE|済み|closed|finish|complete|✓|✔|✅/i],
  ['進行中',   /進行中|対応中|作業中|WIP|in.?progress|🔄|対応中|途中/i],
  ['ブロック中', /ブロック|blocked|保留|待ち|🚫|⛔|hold|pending.*block/i],
]

function detectStatus(text: string): TaskStatus {
  for (const [status, re] of STATUS_RULES) {
    if (re.test(text)) return status
  }
  return '未着手'
}

// ── Line classifiers ─────────────────────────────────────────────────────────

function parseHeaderName(line: string): string | null {
  const b = BRACKET_HEADER.exec(line)
  if (b) return b[1].trim()

  const p = PREFIX_HEADER.exec(line)
  if (p) return p[1].trim()

  const m = MD_HEADER.exec(line)
  if (m) return m[1].trim()

  return null
}

function isTaskLine(line: string): boolean {
  return TASK_BULLET.test(line)
}

function cleanTaskTitle(line: string): string {
  let t = line.replace(TASK_BULLET, '').trim()
  // Remove trailing bracketed status like （完了）[WIP]
  t = t.replace(/[\s　]+[（(【\[](?:完了|WIP|進行中|対応中|done|ブロック)[）)\]】]\s*$/i, '')
  // Remove inline trailing status words
  t = t.replace(/[\s　]+(完了|done|対応済|WIP|進行中|ブロック|blocked)\s*$/i, '')
  return t.trim()
}

// ── Main export ──────────────────────────────────────────────────────────────

export function parseReport(rawText: string): ParsedProject[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.replace(/\t/g, ' ').trimEnd())
    .filter(l => l.trim().length > 0)

  const projects: ParsedProject[] = []
  let current: ParsedProject | null = null

  for (const line of lines) {
    const headerName = parseHeaderName(line.trim())

    if (headerName && headerName.length > 0 && headerName.length <= 50) {
      current = { id: crypto.randomUUID(), name: headerName, tasks: [] }
      projects.push(current)
      continue
    }

    if (isTaskLine(line)) {
      if (!current) {
        current = { id: crypto.randomUUID(), name: 'その他', tasks: [] }
        projects.push(current)
      }
      const title = cleanTaskTitle(line)
      if (title.length > 0) {
        const task: ParsedTask = {
          id: crypto.randomUUID(),
          title,
          status: detectStatus(line),
        }
        current.tasks.push(task)
      }
    }
  }

  const result = projects.filter(p => p.tasks.length > 0)

  // Fallback: if no structured content found, treat every substantive line as a task
  if (result.length === 0) {
    const tasks: ParsedTask[] = lines
      .map(l => l.trim())
      .filter(l => l.length >= 3 && l.length <= 150)
      .map(l => ({ id: crypto.randomUUID(), title: l, status: detectStatus(l) }))

    if (tasks.length > 0) {
      return [{ id: crypto.randomUUID(), name: '日報', tasks }]
    }
  }

  return result
}
