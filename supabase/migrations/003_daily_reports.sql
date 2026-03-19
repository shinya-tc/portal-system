-- 日報テーブル
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  tasks_done TEXT NOT NULL DEFAULT '',
  tasks_ongoing TEXT NOT NULL DEFAULT '',
  tasks_planned TEXT NOT NULL DEFAULT '',
  handover TEXT NOT NULL DEFAULT '特になし',
  issues TEXT NOT NULL DEFAULT '',
  sharing TEXT NOT NULL DEFAULT '特になし',
  questions TEXT NOT NULL DEFAULT '特になし',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, report_date)
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select" ON daily_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert" ON daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update" ON daily_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reports_delete" ON daily_reports FOR DELETE USING (auth.uid() = user_id);
