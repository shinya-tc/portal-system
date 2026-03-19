export type RoleName = 'admin' | 'leader' | 'trainer' | 'staff' | 'part_time'

export interface Role {
  id: number
  name: RoleName
  label: string
  level: number
}

export interface Department {
  id: number
  name: string
  created_at: string
}

export interface Profile {
  id: string
  name: string
  role_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  role?: Role
  departments?: Department[]
  user_departments?: UserDepartment[]
  email?: string
}

export interface UserDepartment {
  user_id: string
  department_id: number
  is_primary: boolean
  department?: Department
}

export interface FeaturePermission {
  id: number
  feature_key: string
  feature_label: string
  category: string
  min_role_level: number
}

export interface UserPermission {
  user_id: string
  feature_key: string
  granted: boolean
}

export interface Announcement {
  id: number
  title: string
  content: string
  author_id: string
  target_dept_ids: number[]
  is_pinned: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  author?: Pick<Profile, 'id' | 'name'>
}

export interface DeptFolder {
  id: number
  department_id: number
  name: string
  created_at: string
  department?: Department
}

export interface DeptFile {
  id: number
  folder_id: number
  department_id: number
  title: string
  file_name: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string
  created_at: string
  folder?: DeptFolder
  uploader?: Pick<Profile, 'id' | 'name'>
}

export interface ChecklistTemplate {
  id: number
  title: string
  department_id: number | null
  cycle_type: 'daily' | 'weekly' | 'monthly'
  cycle_days: number[]
  is_active: boolean
  created_by: string
  created_at: string
  items?: ChecklistItem[]
  department?: Department | null
}

export interface ChecklistItem {
  id: number
  template_id: number
  label: string
  order_index: number
  checked?: boolean
  checked_by_me?: boolean
}

export interface ChecklistLog {
  id: number
  template_id: number
  item_id: number
  checked_by: string
  checked_at: string
  created_at: string
  checker?: Pick<Profile, 'id' | 'name'>
}

export interface ShiftSubmission {
  id: number
  user_id: string
  work_date: string
  start_time: string
  end_time: string
  note: string | null
  created_at: string
  updated_at: string
  user?: Pick<Profile, 'id' | 'name'>
}

export interface PublishedShift {
  id: number
  user_id: string
  work_date: string
  start_time: string
  end_time: string
  department_id: number | null
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
  user?: Pick<Profile, 'id' | 'name'>
  department?: Department | null
}

export interface Task {
  id: number
  user_id: string
  title: string
  task_type: 'own' | 'delegated'
  assigned_to: string | null
  estimated_hours: number | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'done'
  note: string | null
  created_at: string
  updated_at: string
}

export interface DailyReport {
  id: number
  user_id: string
  report_date: string
  tasks_done: string
  tasks_ongoing: string
  tasks_planned: string
  handover: string
  issues: string
  sharing: string
  questions: string
  created_at: string
  updated_at: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  permissions: Record<string, boolean>
  departments: Department[]
}
