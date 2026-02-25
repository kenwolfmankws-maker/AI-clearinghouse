-- Digest Analytics Tracking Table
CREATE TABLE IF NOT EXISTS digest_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  notification_count INTEGER NOT NULL DEFAULT 0,
  delivered BOOLEAN DEFAULT true,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  notification_types JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_digest_analytics_user ON digest_analytics(user_id);
CREATE INDEX idx_digest_analytics_sent ON digest_analytics(sent_at);
CREATE INDEX idx_digest_analytics_frequency ON digest_analytics(frequency);

-- RLS Policies
ALTER TABLE digest_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digest analytics"
  ON digest_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert digest analytics"
  ON digest_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update digest analytics"
  ON digest_analytics FOR UPDATE
  USING (true);
