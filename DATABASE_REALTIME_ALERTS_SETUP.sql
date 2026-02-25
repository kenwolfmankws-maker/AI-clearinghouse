-- Real-Time Performance Alerts System
-- Monitors A/B test performance and sends alerts for significant changes

-- Alert configurations table
CREATE TABLE IF NOT EXISTS digest_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Alert types and thresholds
  alert_type TEXT NOT NULL CHECK (alert_type IN ('significant_difference', 'underperforming', 'anomaly', 'completion')),
  enabled BOOLEAN DEFAULT true,
  
  -- Thresholds
  confidence_threshold DECIMAL DEFAULT 0.95, -- For statistical significance
  performance_threshold DECIMAL DEFAULT 0.5, -- For underperformance (50% below baseline)
  anomaly_threshold DECIMAL DEFAULT 2.0, -- Standard deviations for anomaly detection
  
  -- Alert channels
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  
  -- Auto-pause settings
  auto_pause_enabled BOOLEAN DEFAULT false,
  auto_pause_threshold DECIMAL DEFAULT 0.3, -- Pause if variant performs 30% worse
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history table
CREATE TABLE IF NOT EXISTS digest_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES digest_alert_configs(id) ON DELETE CASCADE,
  test_id UUID REFERENCES digest_ab_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  -- Actions taken
  auto_paused BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE digest_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own alert configs"
  ON digest_alert_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alert history"
  ON digest_alert_history FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_alert_configs_user ON digest_alert_configs(user_id);
CREATE INDEX idx_alert_history_user ON digest_alert_history(user_id);
CREATE INDEX idx_alert_history_test ON digest_alert_history(test_id);
CREATE INDEX idx_alert_history_created ON digest_alert_history(created_at DESC);
