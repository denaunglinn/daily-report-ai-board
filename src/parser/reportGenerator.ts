import type { ParsedProject, TaskStatus } from '@/types'
import { DEFAULT_TEMPLATE, type ReportTemplate } from '@/storage/settingsStorage'

function statusMarker(status: TaskStatus): string {
  if (status === '完了') return '  :done:'
  if (status === '進行中') return '  :wip:'
  return ''
}

export function generateDailyReport(
  projects: ParsedProject[],
  template: ReportTemplate = DEFAULT_TEMPLATE,
): string {
  const lines: string[] = []

  if (template.greeting) lines.push(template.greeting)
  if (template.heading)  lines.push(template.heading)
  lines.push('')

  for (const project of projects) {
    lines.push(`● ${project.name}`)
    for (const task of project.tasks) {
      lines.push(`　○ ${task.title}${statusMarker(task.status)}`)
    }
    lines.push('')
  }

  if (template.footer) {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
    lines.push('')
    lines.push(template.footer)
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  return lines.join('\n')
}
