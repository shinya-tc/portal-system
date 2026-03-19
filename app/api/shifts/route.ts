import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') // YYYY-MM

  let query = supabase
    .from('shift_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('work_date')

  if (month) {
    query = query
      .gte('work_date', `${month}-01`)
      .lte('work_date', `${month}-31`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('shift_submissions')
    .upsert({
      user_id: user.id,
      work_date: body.work_date,
      start_time: body.start_time,
      end_time: body.end_time,
      note: body.note || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,work_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
