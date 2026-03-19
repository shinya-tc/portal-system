export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}

export function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatFileSize(bytes: number | null) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 30分単位の時刻オプション生成
export function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return times
}

// 今週の日付リスト（月曜始まり）
export function getWeekDates(baseDate = new Date()): Date[] {
  const dates: Date[] = []
  const monday = new Date(baseDate)
  const day = monday.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  monday.setDate(monday.getDate() + diff)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
