import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_items(id, label, order_index), department:departments(id, name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { data: template, error } = await supabase
    .from('checklist_templates')
    .insert({
      title: body.title,
      department_id: body.department_id || null,
      cycle_type: body.cycle_type,
      cycle_days: body.cycle_days ?? [],
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 項目を追加
  if (body.items?.length) {
    await supabase.from('checklist_items').insert(
      body.items.map((label: string, i: number) => ({
        template_id: template.id,
        label,
        order_index: i,
      }))
    )
  }

  return NextResponse.json(template, { status: 201 })
}
