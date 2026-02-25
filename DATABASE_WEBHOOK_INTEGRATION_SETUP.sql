-- Webhook Integration System Setup
-- This creates tables for webhook configurations and delivery tracking

-- Webhook configurations table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('slack', 'discord', 'teams', 'custom')),
  enabled BOOLEAN DEFAULT true,
  events TEXT[] NOT NULL, -- ['test_complete', 'alert_triggered', 'test_started', 'variant_winner']
  custom_headers JSONB DEFAULT '{}',
  payload_template JSONB DEFAULT '{}',
  retry_enabled BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_configs_user ON webhook_configs(user_id);
CREATE INDEX idx_webhook_configs_enabled ON webhook_configs(enabled);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- RLS Policies
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their webhooks"
  ON webhook_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (webhook_id IN (SELECT id FROM webhook_configs WHERE user_id = auth.uid()));

-- Function to trigger webhooks
CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_event_type TEXT,
  p_payload JSONB
) RETURNS void AS $$
DECLARE
  webhook RECORD;
BEGIN
  FOR webhook IN 
    SELECT * FROM webhook_configs 
    WHERE enabled = true 
    AND p_event_type = ANY(events)
  LOOP
    INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
    VALUES (webhook.id, p_event_type, p_payload, 'pending');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
