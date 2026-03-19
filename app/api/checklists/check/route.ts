import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { item_id, template_id, checked } = await req.json()
  const today = new Date().toISOString().split('T')[0]

  if (checked) {
    const { error } = await supabase
      .from('checklist_logs')
      .upsert({
        template_id,
        item_id,
        checked_by: user.id,
        checked_at: today,
      }, { onConflict: 'item_id,checked_by,checked_at' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    await supabase
      .from('checklist_logs')
      .delete()
      .eq('item_id', item_id)
      .eq('checked_by', user.id)
      .eq('checked_at', today)
  }

  return NextResponse.json({ success: true })
}
