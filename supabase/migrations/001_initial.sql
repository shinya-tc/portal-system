-- ロールテーブル
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 部署
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザープロフィール（auth.usersと1:1）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー↔部署（多対多）
CREATE TABLE user_departments (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, department_id)
);

-- 機能権限定義
CREATE TABLE feature_permissions (
  id SERIAL PRIMARY KEY,
  feature_key TEXT UNIQUE NOT NULL,
  feature_label TEXT NOT NULL,
  category TEXT NOT NULL,
  min_role_level INTEGER NOT NULL DEFAULT 0
);

-- ユーザー個別権限オーバーライド
CREATE TABLE user_permissions (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key TEXT REFERENCES feature_permissions(feature_key) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, feature_key)
);

-- お知らせ
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  target_dept_ids INTEGER[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- データ管理：フォルダ
CREATE TABLE dept_folders (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- データ管理：ファイル
CREATE TABLE dept_files (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES dept_folders(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- チェックリストテンプレート
CREATE TABLE checklist_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('daily','weekly','monthly')),
  cycle_days INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- チェックリスト項目
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- チェックリスト実行記録
CREATE TABLE checklist_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES checklist_templates(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES checklist_items(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES profiles(id),
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, checked_by, checked_at)
);

-- シフト提出
CREATE TABLE shift_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

-- 公開シフト
CREATE TABLE published_shifts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- RLS (Row Level Security) ポリシー
-- =========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dept_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全データ読み書き可（API層で権限チェックするため）
CREATE POLICY "Authenticated users can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Service role can manage profiles" ON profiles TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read user_departments" ON user_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage user_departments" ON user_departments TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage announcements" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read dept_folders" ON dept_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manage dept_folders" ON dept_folders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage dept_folders" ON dept_folders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read dept_files" ON dept_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage dept_files" ON dept_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read checklist_templates" ON checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage checklist_templates" ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read checklist_items" ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage checklist_items" ON checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated manage checklist_logs" ON checklist_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Own shift submissions" ON shift_submissions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated read published_shifts" ON published_shifts FOR SELECT TO authenticated USING (is_published = true OR auth.uid() IN (SELECT id FROM profiles WHERE role_id IN (SELECT id FROM roles WHERE level >= 80)));
CREATE POLICY "Leaders manage published_shifts" ON published_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read feature_permissions" ON feature_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage feature_permissions" ON feature_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Own user_permissions" ON user_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage user_permissions" ON user_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- roles と departments は全員読み取り可
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage departments" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
