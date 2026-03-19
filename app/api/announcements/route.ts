import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  let query = supabase
    .from('announcements')
    .select('*, author:profiles!author_id(id, name)')
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 権限チェック（leader以上）
  const roleLevel = await getSessionRoleLevel(supabase, user.id)
  if (roleLevel < 80) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: body.title,
      content: body.content,
      author_id: user.id,
      target_dept_ids: body.target_dept_ids ?? [],
      is_pinned: body.is_pinned ?? false,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
