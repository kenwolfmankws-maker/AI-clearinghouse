-- Advanced Multi-Window Rate Limiting Setup
-- Supports multiple concurrent rate limits per webhook with different time windows

-- Add rate_limits JSONB column to webhooks table
ALTER TABLE webhooks 
ADD COLUMN IF NOT EXISTS rate_limits JSONB DEFAULT '[]'::jsonb;

-- Update existing webhooks to migrate old rate limiting to new format
UPDATE webhooks 
SET rate_limits = jsonb_build_array(
  jsonb_build_object(
    'window', rate_limit_window,
    'max_requests', rate_limit_max_requests,
    'enabled', rate_limit_enabled
  )
)
WHERE rate_limit_enabled = true AND rate_limits = '[]'::jsonb;

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_webhooks_rate_limits ON webhooks USING gin(rate_limits);

-- Add window type to rate_limit_violations for better tracking
ALTER TABLE rate_limit_violations
ADD COLUMN IF NOT EXISTS window_type TEXT DEFAULT 'minute',
ADD COLUMN IF NOT EXISTS limit_value INTEGER;

-- Create function to check multiple rate limits
CREATE OR REPLACE FUNCTION check_webhook_rate_limits(
  webhook_id_param UUID,
  current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  window_type TEXT,
  current_count BIGINT,
  max_requests INTEGER,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  WITH rate_configs AS (
    SELECT 
      w.id,
      jsonb_array_elements(w.rate_limits) AS limit_config
    FROM webhooks w
    WHERE w.id = webhook_id_param
  ),
  time_windows AS (
    SELECT
      id,
      (limit_config->>'window')::TEXT AS window,
      (limit_config->>'max_requests')::INTEGER AS max_req,
      CASE (limit_config->>'window')::TEXT
        WHEN 'minute' THEN INTERVAL '1 minute'
        WHEN 'hour' THEN INTERVAL '1 hour'
        WHEN 'day' THEN INTERVAL '1 day'
        WHEN 'week' THEN INTERVAL '7 days'
      END AS time_interval
    FROM rate_configs
    WHERE (limit_config->>'enabled')::BOOLEAN = true
  )
  SELECT
    tw.window,
    COUNT(wd.id) AS current_count,
    tw.max_req,
    tw.time_interval - (current_time - MIN(wd.created_at)) AS time_remaining
  FROM time_windows tw
  LEFT JOIN webhook_deliveries wd ON wd.webhook_id = tw.id
    AND wd.created_at > (current_time - tw.time_interval)
  GROUP BY tw.window, tw.max_req, tw.time_interval;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE webhooks IS 'Webhooks with advanced multi-window rate limiting support';
COMMENT ON COLUMN webhooks.rate_limits IS 'Array of rate limit configurations with different time windows';
