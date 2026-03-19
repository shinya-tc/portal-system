import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Megaphone, FolderOpen, CheckSquare, Calendar, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date().toISOString()

  const [{ data: announcements }, { data: profile }] = await Promise.all([
    supabase
      .from('announcements')
      .select('id, title, is_pinned, created_at')
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('profiles')
      .select('name, role:roles(label)')
      .eq('id', user.id)
      .single(),
  ])

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const shortcuts = [
    { href: '/announcements', label: 'お知らせ', icon: <Megaphone size={24} />, color: 'bg-blue-500' },
    { href: '/files', label: 'データ管理', icon: <FolderOpen size={24} />, color: 'bg-green-500' },
    { href: '/checklists', label: 'チェックリスト', icon: <CheckSquare size={24} />, color: 'bg-orange-500' },
    { href: '/shifts', label: 'シフト提出', icon: <Calendar size={24} />, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 挨拶 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">{today}</p>
        <h2 className="text-xl font-bold mt-1">こんにちは、{profile?.name}さん</h2>
        <p className="text-sm opacity-80 mt-0.5">{(profile?.role as unknown as { label: string } | null)?.label}</p>
      </div>

      {/* ショートカット */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-3">メニュー</h3>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(({ href, label, icon, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${color} text-white rounded-xl p-2.5`}>{icon}</div>
              <span className="font-medium text-gray-700 text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 最新お知らせ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500">最新のお知らせ</h3>
          <Link href="/announcements" className="text-xs text-blue-500 flex items-center gap-0.5">
            すべて見る <ChevronRight size={12} />
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm divide-y">
          {announcements?.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">お知らせはありません</p>
          )}
          {announcements?.map(a => (
            <Link key={a.id} href={`/announcements/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              {a.is_pinned && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">重要</span>}
              <span className="text-sm text-gray-800 flex-1 truncate">{a.title}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(a.created_at)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
