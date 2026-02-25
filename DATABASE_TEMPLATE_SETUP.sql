-- Report Templates Library Setup
-- Allows users to save and share report configurations

-- Report Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'weekly_summary', 'monthly_deep_dive', 'quarterly_review'
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  format VARCHAR(10) NOT NULL, -- 'csv', 'pdf'
  date_range VARCHAR(50), -- 'last_7_days', 'last_30_days', 'last_90_days', 'all_time'
  metrics JSONB DEFAULT '[]'::jsonb, -- Array of metric names
  is_shared BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Pre-built templates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Shares (for team sharing)
CREATE TABLE IF NOT EXISTS template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, shared_with_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON report_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_template ON template_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_user ON template_shares(shared_with_user_id);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates, shared templates, and public templates
CREATE POLICY "Users can view accessible templates" ON report_templates
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_public = true OR
    id IN (SELECT template_id FROM template_shares WHERE shared_with_user_id = auth.uid())
  );

CREATE POLICY "Users can create templates" ON report_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates" ON report_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates" ON report_templates
  FOR DELETE USING (user_id = auth.uid());

-- Template shares policies
CREATE POLICY "Users can view shares" ON template_shares
  FOR SELECT USING (shared_with_user_id = auth.uid() OR shared_by_user_id = auth.uid());

CREATE POLICY "Template owners can share" ON template_shares
  FOR INSERT WITH CHECK (
    shared_by_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM report_templates WHERE id = template_id AND user_id = auth.uid())
  );

CREATE POLICY "Sharers can delete shares" ON template_shares
  FOR DELETE USING (shared_by_user_id = auth.uid());

-- Insert pre-built templates
INSERT INTO report_templates (name, description, template_type, frequency, format, date_range, metrics, is_public, user_id)
VALUES 
  ('Weekly Summary', 'Quick overview of tag usage for the past week', 'weekly_summary', 'weekly', 'pdf', 'last_7_days', '["tag_statistics", "top_tags"]'::jsonb, true, NULL),
  ('Monthly Deep Dive', 'Comprehensive analysis of tag patterns over the past month', 'monthly_deep_dive', 'monthly', 'pdf', 'last_30_days', '["tag_statistics", "top_tags", "usage_over_time"]'::jsonb, true, NULL),
  ('Quarterly Review', 'Executive summary of tag analytics for quarterly planning', 'quarterly_review', 'monthly', 'pdf', 'last_90_days', '["tag_statistics", "top_tags", "usage_over_time"]'::jsonb, true, NULL);
