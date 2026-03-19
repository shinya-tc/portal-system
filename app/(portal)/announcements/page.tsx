'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Pin } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { Announcement } from '@/types'
import { formatDateTime } from '@/lib/utils'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: '', content: '', is_pinned: false, starts_at: '', ends_at: '' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      setCanManage(me.role?.level >= 80)
    })
    loadAnnouncements()
  }, [])

  const loadAnnouncements = () => {
    fetch('/api/announcements').then(r => r.json()).then(data => {
      setAnnouncements(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', is_pinned: false, starts_at: '', ends_at: '' })
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title: a.title,
      content: a.content,
      is_pinned: a.is_pinned,
      starts_at: a.starts_at?.split('T')[0] ?? '',
      ends_at: a.ends_at?.split('T')[0] ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const body = {
      title: form.title,
      content: form.content,
      is_pinned: form.is_pinned,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }
    if (editing) {
      await fetch(`/api/announcements/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setModalOpen(false)
    loadAnnouncements()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    loadAnnouncements()
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">お知らせ</h1>
        {canManage && (
          <IconButton icon={<Plus size={20} />} label="追加" onClick={openCreate} />
        )}
      </div>

      <div className="space-y-3">
        {announcements.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            お知らせはありません
          </div>
        )}
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.is_pinned && <Badge label="重要" color="red" />}
                  <Link href={`/announcements/${a.id}`} className="font-semibold text-gray-800 hover:text-blue-600 truncate">
                    {a.title}
                  </Link>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(a.created_at)}</p>
              </div>
              {canManage && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <IconButton icon={<Pencil size={14} />} label="編集" variant="secondary" size="sm" onClick={() => openEdit(a)} />
                  <IconButton icon={<Trash2 size={14} />} label="削除" variant="danger" size="sm" onClick={() => handleDelete(a.id)} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'お知らせ編集' : 'お知らせ作成'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <textarea
              rows={5}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Pin size={14} /> トップ固定</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">キャンセル</button>
            <button onClick={handleSave} disabled={!form.title} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
