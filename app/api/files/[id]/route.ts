import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionRoleLevel } from '@/lib/supabase/helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fileRecord } = await supabase
    .from('dept_files')
    .select('storage_path, file_name, mime_type')
    .eq('id', id)
    .single()

  if (!fileRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signedUrl } = await supabase.storage
    .from('portal-files')
    .createSignedUrl(fileRecord.storage_path, 60)

  return NextResponse.json({ url: signedUrl?.signedUrl })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roleLevel = await getSessionRoleLevel(supabase, user.id)
  if (roleLevel < 80) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: fileRecord } = await supabase
    .from('dept_files')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fileRecord) {
    await supabase.storage.from('portal-files').remove([fileRecord.storage_path])
  }

  const { error } = await supabase.from('dept_files').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
