import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay() // 0=Sun
  const dayOfMonth = new Date().getDate()

  // 今日有効なテンプレートを取得
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_items(id, label, order_index), department:departments(id, name)')
    .eq('is_active', true)

  if (!templates) return NextResponse.json([])

  // 今日のチェックログ取得
  const { data: logs } = await supabase
    .from('checklist_logs')
    .select('item_id, checked_by')
    .eq('checked_at', today)

  const myLogs = new Set(logs?.filter(l => l.checked_by === user.id).map(l => l.item_id))
  const allChecked = new Map<number, string[]>()
  logs?.forEach(l => {
    const arr = allChecked.get(l.item_id) ?? []
    arr.push(l.checked_by)
    allChecked.set(l.item_id, arr)
  })

  // サイクルフィルタリング
  const filtered = templates.filter(t => {
    if (t.cycle_type === 'daily') return true
    if (t.cycle_type === 'weekly') return t.cycle_days?.includes(dayOfWeek)
    if (t.cycle_type === 'monthly') return t.cycle_days?.includes(dayOfMonth)
    return false
  })

  const result = filtered.map(t => ({
    ...t,
    items: t.items?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index).map((item: { id: number; label: string; order_index: number }) => ({
      ...item,
      checked_by_me: myLogs.has(item.id),
      checked_count: allChecked.get(item.id)?.length ?? 0,
    })),
  }))

  return NextResponse.json(result)
}
