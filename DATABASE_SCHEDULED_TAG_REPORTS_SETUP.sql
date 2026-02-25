-- Create scheduled_tag_reports table for automated tag analytics email reports
CREATE TABLE IF NOT EXISTS scheduled_tag_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report configuration
  name TEXT NOT NULL,
  description TEXT,
  email_subject TEXT DEFAULT 'Tag Analytics Report',
  
  -- Schedule configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER, -- 0-6 for weekly (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  
  -- Report content
  format TEXT NOT NULL CHECK (format IN ('pdf', 'csv')),
  metrics JSONB DEFAULT '["tag_statistics", "top_tags", "usage_over_time"]'::jsonb,
  
  -- Date range for report data
  date_range_days INTEGER DEFAULT 30, -- null means all time
  
  -- Recipients (array of email addresses)
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_recipients CHECK (jsonb_array_length(recipients) > 0)
);

-- Indexes
CREATE INDEX idx_scheduled_tag_reports_user ON scheduled_tag_reports(user_id);
CREATE INDEX idx_scheduled_tag_reports_next ON scheduled_tag_reports(next_scheduled_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE scheduled_tag_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tag reports" ON scheduled_tag_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tag reports" ON scheduled_tag_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tag reports" ON scheduled_tag_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tag reports" ON scheduled_tag_reports FOR DELETE USING (auth.uid() = user_id);
