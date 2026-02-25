-- API Key Rotation Compliance Reports Setup
-- This file creates tables for automated compliance report generation

-- Table for storing report schedules and configurations
CREATE TABLE IF NOT EXISTS api_key_rotation_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  schedule_frequency TEXT NOT NULL CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  report_format TEXT NOT NULL CHECK (report_format IN ('pdf', 'csv', 'both')),
  recipient_emails TEXT[] NOT NULL,
  compliance_threshold INTEGER DEFAULT 80,
  expiration_warning_days INTEGER DEFAULT 7,
  include_policy_violations BOOLEAN DEFAULT true,
  include_rotation_history BOOLEAN DEFAULT true,
  include_compliance_trends BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking sent reports
CREATE TABLE IF NOT EXISTS api_key_rotation_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES api_key_rotation_report_schedules(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_format TEXT NOT NULL,
  sent_to TEXT[] NOT NULL,
  compliance_rate DECIMAL(5,2),
  keys_expiring_soon INTEGER,
  policy_violations INTEGER,
  total_rotations INTEGER,
  report_data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_schedules_org ON api_key_rotation_report_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON api_key_rotation_report_schedules(next_scheduled_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_report_history_schedule ON api_key_rotation_report_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_history_sent_at ON api_key_rotation_report_history(sent_at);

-- Enable RLS
ALTER TABLE api_key_rotation_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rotation_report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own report schedules"
  ON api_key_rotation_report_schedules
  FOR ALL
  USING (auth.uid() = organization_id);

CREATE POLICY "Users can view their own report history"
  ON api_key_rotation_report_history
  FOR SELECT
  USING (auth.uid() = organization_id);

-- Function to calculate next scheduled run time
CREATE OR REPLACE FUNCTION calculate_next_report_run(frequency TEXT, last_run TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      RETURN COALESCE(last_run, NOW()) + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN COALESCE(last_run, NOW()) + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN COALESCE(last_run, NOW()) + INTERVAL '1 month';
    ELSE
      RETURN NOW() + INTERVAL '1 week';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_scheduled_at
CREATE OR REPLACE FUNCTION update_next_report_schedule()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_scheduled_at := calculate_next_report_run(NEW.schedule_frequency, NEW.last_sent_at);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_next_report_schedule
  BEFORE INSERT OR UPDATE ON api_key_rotation_report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_report_schedule();
