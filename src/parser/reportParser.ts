import type { ParsedProject, ParsedTask, TaskStatus } from '@/types'

// ── Noise / greeting filter ───────────────────────────────────────────────────

const NOISE_RE = [
  /^おはよう(ございます)?[。.！!]?\s*$/,
  /^こんにち[はわ][。.！!]?\s*$/,
  /^こんばん[はわ][。.！!]?\s*$/,
  /お疲れ[様さ]/,
  /よろしくお願い/,
  /^以上です?[。.！!]?\s*$/,
  /^本日の作業\s*$/,
  /^今日の作業\s*$/,
  /^本日のタスク\s*$/,
  /^今日のタスク\s*$/,
]

function isNoise(text: string): boolean {
  return NOISE_RE.some(re => re.test(text.trim()))
}

// ── Header detection ──────────────────────────────────────────────────────────

// 【プロジェクト名】 《…》 etc.
const BRACKET_HEADER = /^[【《＜≪\[](.+?)[】》≫\]＞>]$/

// ■ ◆ ● ▶ ★ prefixed
const PREFIX_HEADER = /^[■◆●▶★☆◎◉▼△▲◇◈]+\s*(.+)/

// Markdown ## Title
const MD_HEADER = /^#{1,3}\s+(.+)/

// Legacy OCR artifact fallback — "e " at line start (in case normalizer missed it)
const OCR_MAIN_BULLET = /^\s*e\s+(\S.*)/

// ── Task bullet detection ─────────────────────────────────────────────────────

// Standard bullet characters (includes ○ which normalizer now restores)
const TASK_BULLET =
  /^[\s　]*(?:[○・\-–—•*＊◦‣⁃→➤►▸]|\d+[.）)．]\s+|\([0-9a-zA-Zあ-ん]\)\s+|[①-⑳]\s*)\s*/

// Legacy OCR artifact fallback — "o " / "O " / "0 " at line start
const OCR_SUB_BULLET = /^\s*[oO0]\s+(\S.*)/

// Plain indented line inside a project — no bullet but visually a task
// Matches lines starting with at least one Japanese full-width space (　) or 2+ regular spaces
const PLAIN_INDENTED = /^(?:　+| {2,})\S/

// ── Status detection ──────────────────────────────────────────────────────────

const STATUS_RULES: [TaskStatus, RegExp][] = [
  ['完了',       /完了|done|対応済|DONE|済み|closed|finish|complete|✓|✔|✅/i],
  ['進行中',     /進行中|対応中|作業中|WIP|in.?progress|🔄|途中/i],
  ['ブロック中', /ブロック|blocked|保留|待ち|🚫|⛔|hold/i],
]

function detectStatus(text: string): TaskStatus {
  for (const [status, re] of STATUS_RULES) {
    if (re.test(text)) return status
  }
  return '未着手'
}

// ── Name extractors ───────────────────────────────────────────────────────────

function parseHeaderName(line: string): string | null {
  const b = BRACKET_HEADER.exec(line.trim())
  if (b) return b[1].trim()

  const p = PREFIX_HEADER.exec(line.trim())
  if (p) return p[1].trim()

  const m = MD_HEADER.exec(line.trim())
  if (m) return m[1].trim()

  const e = OCR_MAIN_BULLET.exec(line)
  if (e) return e[1].trim()

  return null
}

function isTaskLine(line: string, insideProject: boolean): boolean {
  if (TASK_BULLET.test(line) || OCR_SUB_BULLET.test(line)) return true
  // Plain indented text counts as a task only when we're already inside a project
  if (insideProject && PLAIN_INDENTED.test(line)) return true
  return false
}

function cleanTaskTitle(line: string): string {
  // Strip standard bullets
  let t = line.replace(TASK_BULLET, '').trim()
  // Strip ○ bullet or OCR sub-bullet "o " / "O " / "0 "
  t = t.replace(/^\s*[○oO0]\s+/, '').trim()
  // Strip plain indentation (　 or spaces)
  t = t.replace(/^[　\s]+/, '').trim()
  // Remove trailing bracketed status
  t = t.replace(/[\s　]+[（(【\[](?:完了|WIP|進行中|対応中|done|ブロック)[）)\]】]\s*$/i, '')
  t = t.replace(/[\s　]+(完了|done|対応済|WIP|進行中|ブロック|blocked)\s*$/i, '')
  return t.trim()
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parseReport(rawText: string): ParsedProject[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.replace(/\t/g, ' ').trimEnd())
    .filter(l => l.trim().length > 0)

  const projects: ParsedProject[] = []
  let current: ParsedProject | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Always skip noise / greeting lines
    if (isNoise(trimmed)) continue

    const headerName = parseHeaderName(line)
    if (headerName && headerName.length > 0 && headerName.length <= 60) {
      if (isNoise(headerName)) continue
      current = { id: crypto.randomUUID(), name: headerName, tasks: [] }
      projects.push(current)
      continue
    }

    if (isTaskLine(line, current !== null)) {
      if (!current) {
        current = { id: crypto.randomUUID(), name: 'その他', tasks: [] }
        projects.push(current)
      }
      const title = cleanTaskTitle(line)
      if (title.length > 0 && !isNoise(title)) {
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

  // Fallback: treat every substantive line as a task under 日報
  if (result.length === 0) {
    const tasks: ParsedTask[] = lines
      .map(l => l.trim())
      .filter(l => l.length >= 3 && l.length <= 150 && !isNoise(l))
      .map(l => ({ id: crypto.randomUUID(), title: l, status: detectStatus(l) }))

    if (tasks.length > 0) {
      return [{ id: crypto.randomUUID(), name: '日報', tasks }]
    }
  }

  return result
}
