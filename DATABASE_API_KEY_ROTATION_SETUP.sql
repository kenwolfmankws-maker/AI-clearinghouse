-- API Key Rotation Policies Table
CREATE TABLE IF NOT EXISTS api_key_rotation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  rotation_enabled BOOLEAN DEFAULT false,
  rotation_interval_days INTEGER DEFAULT 90,
  grace_period_days INTEGER DEFAULT 7,
  auto_rotate BOOLEAN DEFAULT false,
  notify_before_days INTEGER DEFAULT 14,
  last_rotation_date TIMESTAMPTZ,
  next_rotation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key_name)
);

-- API Key History Table
CREATE TABLE IF NOT EXISTS api_key_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  rotated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  rotation_reason TEXT,
  rotated_by TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Key Rotation Audit Log Table
CREATE TABLE IF NOT EXISTS api_key_rotation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  action TEXT NOT NULL,
  old_key_hash TEXT,
  new_key_hash TEXT,
  rotation_type TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rotation_policies_user ON api_key_rotation_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_rotation_policies_next_rotation ON api_key_rotation_policies(next_rotation_date) WHERE rotation_enabled = true;
CREATE INDEX IF NOT EXISTS idx_key_history_user ON api_key_history(user_id);
CREATE INDEX IF NOT EXISTS idx_key_history_active ON api_key_history(user_id, key_name, is_active);
CREATE INDEX IF NOT EXISTS idx_rotation_audit_user ON api_key_rotation_audit(user_id);

-- Enable RLS
ALTER TABLE api_key_rotation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rotation_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own rotation policies" ON api_key_rotation_policies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own key history" ON api_key_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own rotation audit" ON api_key_rotation_audit FOR SELECT USING (auth.uid() = user_id);
