'use client'
import { useEffect, useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { PageSpinner } from '@/components/ui/Spinner'
import { ChecklistTemplate, ChecklistItem } from '@/types'

interface ChecklistWithStatus extends ChecklistTemplate {
  items: (ChecklistItem & { checked_by_me: boolean; checked_count: number })[]
}

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<number | null>(null)

  useEffect(() => { loadChecklists() }, [])

  const loadChecklists = () => {
    fetch('/api/checklists').then(r => r.json()).then(data => {
      setTemplates(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const handleCheck = async (template_id: number, item_id: number, currentChecked: boolean) => {
    setChecking(item_id)
    await fetch('/api/checklists/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id, item_id, checked: !currentChecked }),
    })
    setTemplates(prev => prev.map(t => ({
      ...t,
      items: t.items.map(item =>
        item.id === item_id
          ? { ...item, checked_by_me: !currentChecked, checked_count: item.checked_count + (!currentChecked ? 1 : -1) }
          : item
      ),
    })))
    setChecking(null)
  }

  if (loading) return <PageSpinner />

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">チェックリスト</h1>
          <p className="text-xs text-gray-400">{today}</p>
        </div>
      </div>

      {templates.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
          今日のチェックリストはありません
        </div>
      )}

      <div className="space-y-4">
        {templates.map(template => {
          const checkedCount = template.items.filter(i => i.checked_by_me).length
          const total = template.items.length
          const progress = total > 0 ? (checkedCount / total) * 100 : 0

          return (
            <div key={template.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800">{template.title}</h3>
                  <span className="text-xs text-gray-400">{checkedCount}/{total}</span>
                </div>
                {template.department && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{template.department.name}</span>
                )}
                {/* プログレスバー */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="divide-y">
                {template.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleCheck(template.id, item.id, item.checked_by_me)}
                    disabled={checking === item.id}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {item.checked_by_me
                      ? <CheckSquare size={20} className="text-green-500 flex-shrink-0" />
                      : <Square size={20} className="text-gray-300 flex-shrink-0" />
                    }
                    <span className={`text-sm flex-1 ${item.checked_by_me ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {item.checked_count > 0 && (
                      <span className="text-xs text-gray-400">{item.checked_count}人</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
