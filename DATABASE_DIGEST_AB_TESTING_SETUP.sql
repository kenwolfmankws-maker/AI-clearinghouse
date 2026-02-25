-- A/B Testing for Notification Digests
-- This schema supports testing different subject lines, send times, and email formats

-- Table for A/B test configurations
CREATE TABLE IF NOT EXISTS digest_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('subject_line', 'send_time', 'format')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_sample_size INTEGER DEFAULT 1000,
  confidence_level DECIMAL DEFAULT 0.95,
  winner_variant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for test variants
CREATE TABLE IF NOT EXISTS digest_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES digest_ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_line TEXT,
  send_time_offset INTEGER, -- minutes offset from scheduled time
  email_format TEXT, -- 'compact', 'detailed', 'visual'
  traffic_allocation DECIMAL DEFAULT 0.5, -- percentage of traffic (0.0 to 1.0)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user assignments to variants
CREATE TABLE IF NOT EXISTS digest_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES digest_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES digest_ab_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, user_id)
);

-- Table for variant performance metrics
CREATE TABLE IF NOT EXISTS digest_ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES digest_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES digest_ab_variants(id) ON DELETE CASCADE,
  digests_sent INTEGER DEFAULT 0,
  digests_opened INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  open_rate DECIMAL,
  click_rate DECIMAL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON digest_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_variants_test ON digest_ab_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_test_user ON digest_ab_assignments(test_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_test ON digest_ab_results(test_id);

-- Enable RLS
ALTER TABLE digest_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_ab_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin access)
CREATE POLICY "Admins can manage A/B tests" ON digest_ab_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage variants" ON digest_ab_variants
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their assignments" ON digest_ab_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assignments" ON digest_ab_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view results" ON digest_ab_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
