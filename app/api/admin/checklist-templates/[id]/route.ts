import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  await supabase.from('checklist_templates').update({
    title: body.title,
    department_id: body.department_id || null,
    cycle_type: body.cycle_type,
    cycle_days: body.cycle_days ?? [],
    is_active: body.is_active,
  }).eq('id', id)

  // 項目の再作成
  if (body.items !== undefined) {
    await supabase.from('checklist_items').delete().eq('template_id', id)
    if (body.items.length > 0) {
      await supabase.from('checklist_items').insert(
        body.items.map((label: string, i: number) => ({
          template_id: parseInt(id),
          label,
          order_index: i,
        }))
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('checklist_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
