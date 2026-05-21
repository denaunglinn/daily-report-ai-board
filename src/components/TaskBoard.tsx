import { useState, useEffect } from 'react'
import type { ParsedProject, TaskStatus } from '@/types'
import './TaskBoard.css'

const STATUS_CYCLE: TaskStatus[] = ['未着手', '進行中', '完了', 'ブロック中']

const STATUS_META: Record<TaskStatus, { label: string; icon: string; cls: string }> = {
  '完了':       { label: '完了',     icon: '✅', cls: 'done'    },
  '進行中':     { label: '進行中',   icon: '🔄', cls: 'wip'     },
  '未着手':     { label: '未着手',   icon: '⬜', cls: 'todo'    },
  'ブロック中': { label: 'ブロック', icon: '🚫', cls: 'blocked' },
}

function nextStatus(current: TaskStatus): TaskStatus {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
}

function boardToMarkdown(projects: ParsedProject[]): string {
  const lines: string[] = ['# 日報タスクボード', '']
  for (const p of projects) {
    lines.push(`## ${p.name}`)
    for (const t of p.tasks) {
      const check = t.status === '完了' ? '[x]' : '[ ]'
      const note  = t.status !== '完了' && t.status !== '未着手' ? ` _(${t.status})_` : ''
      lines.push(`- ${check} ${t.title}${note}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

interface Props {
  projects: ParsedProject[]
  onBack: () => void
  onClear: () => void
  onBoardUpdate: (projects: ParsedProject[]) => void
}

export function TaskBoard({ projects: initial, onBack, onClear, onBoardUpdate }: Props) {
  const [projects, setProjects] = useState(initial)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setProjects(initial) }, [initial])

  const allTasks  = projects.flatMap(p => p.tasks)
  const total     = allTasks.length
  const done      = allTasks.filter(t => t.status === '完了').length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  function cycleStatus(projectId: string, taskId: string) {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        tasks: p.tasks.map(t =>
          t.id === taskId ? { ...t, status: nextStatus(t.status) } : t
        ),
      }
    })
    setProjects(updated)
    onBoardUpdate(updated)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(boardToMarkdown(projects))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="board">
      {/* ── Header ─────────────────────────────────── */}
      <div className="board__header">
        <button className="board__back" onClick={onBack}>← テキスト</button>
        <div className="board__progress">
          <div className="board__progress-bar">
            <div className="board__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="board__progress-label">{done}/{total} 完了</span>
        </div>
        <button
          className="board__copy-btn"
          onClick={handleCopy}
          title="Markdown としてコピー"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>

      {/* ── Project list ───────────────────────────── */}
      <div className="board__list">
        {projects.length === 0 ? (
          <div className="board__empty">
            <p className="board__empty-title">タスクが見つかりませんでした</p>
            <div className="board__empty-guide">
              <p className="board__empty-hint">認識される形式の例</p>
              <code>■ プロジェクト名</code>
              <code>【プロジェクト名】</code>
              <code>・ タスク内容 完了</code>
              <code>- タスク内容 進行中</code>
            </div>
          </div>
        ) : (
          projects.map(project => {
            const pdone  = project.tasks.filter(t => t.status === '完了').length
            const ptotal = project.tasks.length
            const ppct   = ptotal > 0 ? Math.round((pdone / ptotal) * 100) : 0
            return (
              <div key={project.id} className="project-card">
                <div className="project-card__header">
                  <span className="project-card__name" title={project.name}>
                    {project.name}
                  </span>
                  <div className="project-card__stat">
                    <span className="project-card__count">{pdone}/{ptotal}</span>
                    <div className="project-card__bar">
                      <div
                        className="project-card__bar-fill"
                        style={{ width: `${ppct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ul className="project-card__tasks">
                  {project.tasks.map(task => {
                    const meta = STATUS_META[task.status]
                    return (
                      <li key={task.id} className="task-item">
                        <span className="task-item__icon">{meta.icon}</span>
                        <span className="task-item__title" title={task.title}>
                          {task.title}
                        </span>
                        <button
                          className={`task-badge task-badge--${meta.cls}`}
                          onClick={() => cycleStatus(project.id, task.id)}
                          title="クリックでステータスを変更"
                        >
                          {meta.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })
        )}
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <button className="board__new-btn" onClick={onClear}>
        新しい日報
      </button>
    </div>
  )
}
