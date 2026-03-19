import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('announcements')
    .select('*, author:profiles!author_id(id, name)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div>
      <Link href="/announcements" className="flex items-center gap-1 text-blue-500 text-sm mb-4 hover:underline">
        <ChevronLeft size={16} /> お知らせ一覧
      </Link>
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h1 className="text-xl font-bold text-gray-800 mb-2">{data.title}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-5 pb-5 border-b">
          <span>{(data.author as { name: string } | null)?.name ?? '-'}</span>
          <span>{formatDateTime(data.created_at)}</span>
          {data.ends_at && <span>〜{data.ends_at.split('T')[0]}</span>}
        </div>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.content}</div>
      </div>
    </div>
  )
}
