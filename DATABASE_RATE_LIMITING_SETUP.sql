-- Add rate limiting fields to webhook_configs table
ALTER TABLE webhook_configs
ADD COLUMN IF NOT EXISTS rate_limit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rate_limit_max_requests INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS rate_limit_window_minutes INTEGER DEFAULT 60;

-- Create rate_limit_violations table for audit purposes
CREATE TABLE IF NOT EXISTS webhook_rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requests_in_window INTEGER NOT NULL,
  rate_limit INTEGER NOT NULL,
  window_minutes INTEGER NOT NULL,
  event_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_webhook ON webhook_rate_limit_violations(webhook_id, violation_time DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_user ON webhook_rate_limit_violations(user_id, violation_time DESC);

-- Enable RLS
ALTER TABLE webhook_rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rate limit violations"
  ON webhook_rate_limit_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert rate limit violations"
  ON webhook_rate_limit_violations FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE webhook_rate_limit_violations IS 'Tracks webhook rate limit violations for audit and monitoring';
