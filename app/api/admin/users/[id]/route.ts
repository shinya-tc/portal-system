import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  await supabase
    .from('profiles')
    .update({
      name: body.name,
      role_id: body.role_id,
      is_active: body.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // 部署更新
  if (body.department_ids !== undefined) {
    await supabase.from('user_departments').delete().eq('user_id', id)
    if (body.department_ids.length > 0) {
      await supabase.from('user_departments').insert(
        body.department_ids.map((deptId: number, i: number) => ({
          user_id: id,
          department_id: deptId,
          is_primary: i === 0,
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

  const adminClient = await createAdminClient()
  await adminClient.auth.admin.deleteUser(id)
  return NextResponse.json({ success: true })
}
