-- SMS Rate Limiting Configuration Table
CREATE TABLE IF NOT EXISTS sms_rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_messages_per_hour INTEGER DEFAULT 10,
  max_messages_per_day INTEGER DEFAULT 50,
  cooldown_minutes INTEGER DEFAULT 60,
  auto_block_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Rate Limiting Tracking Table
CREATE TABLE IF NOT EXISTS sms_rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_count_hour INTEGER DEFAULT 0,
  message_count_day INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  hour_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  day_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, phone_number)
);

-- Enable RLS
ALTER TABLE sms_rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own rate limit config"
  ON sms_rate_limit_config FOR ALL
  USING (auth.uid() = org_id);

CREATE POLICY "Users can view their own rate limit tracking"
  ON sms_rate_limit_tracking FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can update their own rate limit tracking"
  ON sms_rate_limit_tracking FOR UPDATE
  USING (auth.uid() = org_id);

-- Indexes
CREATE INDEX idx_sms_rate_tracking_org_phone ON sms_rate_limit_tracking(org_id, phone_number);
CREATE INDEX idx_sms_rate_tracking_blocked ON sms_rate_limit_tracking(is_blocked, blocked_until);
