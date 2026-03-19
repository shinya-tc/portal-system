import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 80) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const month = req.nextUrl.searchParams.get('month')
  const type = req.nextUrl.searchParams.get('type') ?? 'submissions'

  if (type === 'submissions') {
    let query = supabase
      .from('shift_submissions')
      .select('*, user:profiles!user_id(id, name)')
      .order('work_date')
      .order('user_id')

    if (month) {
      query = query.gte('work_date', `${month}-01`).lte('work_date', `${month}-31`)
    }
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // published shifts
  let query = supabase
    .from('published_shifts')
    .select('*, user:profiles!user_id(id, name), department:departments(id, name)')
    .order('work_date')

  if (month) {
    query = query.gte('work_date', `${month}-01`).lte('work_date', `${month}-31`)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((await getSessionRoleLevel(supabase, user.id)) < 80) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (body.action === 'publish') {
    // シフト公開
    await supabase
      .from('published_shifts')
      .update({ is_published: true })
      .in('id', body.shift_ids)
    return NextResponse.json({ success: true })
  }

  // 仮シフト作成
  const { data, error } = await supabase
    .from('published_shifts')
    .upsert({
      user_id: body.user_id,
      work_date: body.work_date,
      start_time: body.start_time,
      end_time: body.end_time,
      department_id: body.department_id || null,
      is_published: false,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
