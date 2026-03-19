import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deptId = req.nextUrl.searchParams.get('dept_id')
  const folderId = req.nextUrl.searchParams.get('folder_id')

  let query = supabase
    .from('dept_files')
    .select('*, folder:dept_folders(*), uploader:profiles!uploaded_by(id, name)')
    .order('created_at', { ascending: false })

  if (deptId) query = query.eq('department_id', deptId)
  if (folderId) query = query.eq('folder_id', folderId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const folderId = formData.get('folder_id') as string
  const deptId = formData.get('dept_id') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const storagePath = `dept-files/${deptId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('portal-files')
    .upload(storagePath, arrayBuffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('dept_files')
    .insert({
      folder_id: folderId,
      department_id: deptId,
      title: title || file.name,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
