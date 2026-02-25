-- Run this in Supabase SQL Editor to set up report templates

-- 1. Create the table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  frequency VARCHAR(20) NOT NULL,
  format VARCHAR(10) NOT NULL,
  date_range INTEGER NOT NULL,
  metrics JSONB NOT NULL DEFAULT '[]',
  email_subject VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Anyone can view templates" ON report_templates FOR SELECT USING (true);
CREATE POLICY "Users can create templates" ON report_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON report_templates FOR UPDATE USING (auth.uid() = created_by AND is_system = false);
CREATE POLICY "Users can delete own templates" ON report_templates FOR DELETE USING (auth.uid() = created_by AND is_system = false);

-- 4. Insert system templates
INSERT INTO report_templates (name, description, is_system, frequency, format, date_range, metrics, email_subject)
VALUES 
  ('Weekly Executive Summary', 'High-level overview of key metrics', true, 'weekly', 'excel', 7, 
   '["totalUsage", "successRate", "avgResponseTime", "topModels", "costAnalysis"]'::jsonb,
   'Weekly Executive Summary - Template Analytics'),
  
  ('Monthly Team Performance', 'Detailed team performance metrics', true, 'monthly', 'excel', 30,
   '["totalUsage", "successRate", "avgResponseTime", "topModels", "costAnalysis", "userActivity", "errorRate"]'::jsonb,
   'Monthly Team Performance Report'),
  
  ('Quarterly Analysis', 'Comprehensive quarterly analysis', true, 'monthly', 'excel', 90,
   '["totalUsage", "successRate", "avgResponseTime", "topModels", "costAnalysis", "userActivity", "errorRate"]'::jsonb,
   'Quarterly Analytics Report')
ON CONFLICT DO NOTHING;
