'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, CheckCircle2, Circle, Clock, ArrowRightLeft } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { Task } from '@/types'

type TabType = 'own' | 'delegated'
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'done'

const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }
const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
}
const STATUS_LABEL: Record<string, string> = { pending: '未着手', in_progress: '進行中', done: '完了' }
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

const emptyForm = {
  title: '',
  task_type: 'own' as TabType,
  assigned_to: '',
  estimated_hours: '',
  deadline: '',
  priority: 'medium',
  status: 'pending',
  note: '',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('own')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // 委任モーダル
  const [delegateTarget, setDelegateTarget] = useState<Task | null>(null)
  const [delegateName, setDelegateName] = useState('')
  const [delegateSaving, setDelegateSaving] = useState(false)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = () => {
    fetch('/api/tasks').then(r => r.json()).then(data => {
      setTasks(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, task_type: tab })
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditTarget(task)
    setForm({
      title: task.title,
      task_type: task.task_type,
      assigned_to: task.assigned_to ?? '',
      estimated_hours: task.estimated_hours?.toString() ?? '',
      deadline: task.deadline ?? '',
      priority: task.priority,
      status: task.status,
      note: task.note ?? '',
    })
    setModalOpen(true)
  }

  const openDelegate = (task: Task) => {
    setDelegateTarget(task)
    setDelegateName(task.assigned_to ?? '')
  }

  const handleSave = async () => {
    setSaving(true)
    const body = {
      ...form,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      deadline: form.deadline || null,
      assigned_to: form.assigned_to || null,
      note: form.note || null,
    }
    if (editTarget) {
      const res = await fetch(`/api/tasks/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const updated = await res.json()
      setTasks(ts => ts.map(t => t.id === editTarget.id ? updated : t))
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const created = await res.json()
      setTasks(ts => [created, ...ts])
    }
    setModalOpen(false)
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  const toggleStatus = async (task: Task) => {
    const next = task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done'
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const updated = await res.json()
    setTasks(ts => ts.map(t => t.id === task.id ? updated : t))
  }

  // 自分↔委任の移動
  const handleDelegate = async () => {
    if (!delegateTarget) return
    setDelegateSaving(true)
    const isMovingToDelegated = delegateTarget.task_type === 'own'
    const res = await fetch(`/api/tasks/${delegateTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_type: isMovingToDelegated ? 'delegated' : 'own',
        assigned_to: isMovingToDelegated ? (delegateName || null) : null,
      }),
    })
    const updated = await res.json()
    setTasks(ts => ts.map(t => t.id === delegateTarget.id ? updated : t))
    setDelegateTarget(null)
    setDelegateName('')
    setDelegateSaving(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const filtered = tasks
    .filter(t => t.task_type === tab)
    .filter(t => statusFilter === 'all' || t.status === statusFilter)

  const isOverdue = (deadline: string | null) => deadline && deadline < today

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">タスク管理</h1>
        <IconButton icon={<Plus size={20} />} label="追加" onClick={openAdd} />
      </div>

      {/* タブ */}
      <div className="flex bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
        {(['own', 'delegated'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t === 'own'
              ? `自分のタスク (${tasks.filter(x => x.task_type === 'own' && x.status !== 'done').length})`
              : `委任タスク (${tasks.filter(x => x.task_type === 'delegated' && x.status !== 'done').length})`}
          </button>
        ))}
      </div>

      {/* ステータスフィルター */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'in_progress', 'done'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border hover:border-blue-300'}`}
          >
            {s === 'all' ? 'すべて' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* タスク一覧 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-10 text-center text-sm text-gray-400">
            タスクはありません
          </div>
        )}
        {filtered.map(task => (
          <div key={task.id} className={`bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3 ${task.status === 'done' ? 'opacity-60' : ''}`}>
            {/* ステータストグル */}
            <button onClick={() => toggleStatus(task)} className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors">
              {task.status === 'done'
                ? <CheckCircle2 size={20} className="text-green-500" />
                : task.status === 'in_progress'
                ? <Clock size={20} className="text-blue-500" />
                : <Circle size={20} />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium text-gray-800 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </p>
              {task.task_type === 'delegated' && task.assigned_to && (
                <p className="text-xs text-blue-600 mt-0.5">担当：{task.assigned_to}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>
                {task.deadline && (
                  <span className={`text-xs ${isOverdue(task.deadline) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {isOverdue(task.deadline) && task.status !== 'done' ? '⚠ ' : ''}{task.deadline}
                  </span>
                )}
                {task.estimated_hours && (
                  <span className="text-xs text-gray-400">{task.estimated_hours}h</span>
                )}
              </div>
              {task.note && <p className="text-xs text-gray-400 mt-1">{task.note}</p>}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <IconButton icon={<ArrowRightLeft size={14} />} label={task.task_type === 'own' ? '委任' : '戻す'} size="sm" onClick={() => openDelegate(task)} />
              <IconButton icon={<Pencil size={14} />} label="編集" size="sm" onClick={() => openEdit(task)} />
              <IconButton icon={<Trash2 size={14} />} label="削除" variant="danger" size="sm" onClick={() => handleDelete(task.id)} />
            </div>
          </div>
        ))}
      </div>

      {/* タスク追加・編集モーダル */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'タスク編集' : 'タスク追加'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タスク名 *</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="タスク名" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as TabType }))}>
                <option value="own">自分</option>
                <option value="delegated">委任</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          {form.task_type === 'delegated' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
              <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="担当者名" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">想定時間（h）</label>
              <input type="number" step="0.5" min="0" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))} placeholder="例: 1.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">未着手</option>
              <option value="in_progress">進行中</option>
              <option value="done">完了</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="備考など" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">キャンセル</button>
            <button onClick={handleSave} disabled={!form.title || saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 委任・差し戻しモーダル */}
      <Modal
        open={!!delegateTarget}
        onClose={() => { setDelegateTarget(null); setDelegateName('') }}
        title={delegateTarget?.task_type === 'own' ? 'タスクを委任する' : '自分に戻す'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 font-medium">
            {delegateTarget?.title}
          </p>
          {delegateTarget?.task_type === 'own' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm"
                value={delegateName}
                onChange={e => setDelegateName(e.target.value)}
                placeholder="例：山田さん"
                autoFocus
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">このタスクを自分のタスクに戻します。</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setDelegateTarget(null); setDelegateName('') }} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600">
              キャンセル
            </button>
            <button onClick={handleDelegate} disabled={delegateSaving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
              {delegateSaving ? '処理中...' : delegateTarget?.task_type === 'own' ? '委任する' : '自分に戻す'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
