-- Historical A/B Testing Analytics Schema
-- Track completed tests and aggregate insights

-- Add completion tracking to existing tests
ALTER TABLE digest_ab_tests 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS winner_variant_id UUID REFERENCES digest_ab_variants(id),
ADD COLUMN IF NOT EXISTS completion_reason TEXT CHECK (completion_reason IN ('statistical_significance', 'manual', 'time_limit', 'sample_size')),
ADD COLUMN IF NOT EXISTS final_insights JSONB;

-- Create index for historical queries
CREATE INDEX IF NOT EXISTS idx_digest_ab_tests_completed 
ON digest_ab_tests(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Historical test summary view
CREATE OR REPLACE VIEW digest_test_history AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.algorithm,
  t.started_at,
  t.completed_at,
  t.completion_reason,
  t.final_insights,
  COUNT(DISTINCT v.id) as variant_count,
  SUM(v.sent_count) as total_sent,
  SUM(v.open_count) as total_opens,
  SUM(v.click_count) as total_clicks,
  ROUND(AVG(v.open_count::NUMERIC / NULLIF(v.sent_count, 0)) * 100, 2) as avg_open_rate,
  ROUND(AVG(v.click_count::NUMERIC / NULLIF(v.open_count, 0)) * 100, 2) as avg_click_rate,
  w.name as winner_name,
  w.open_count::NUMERIC / NULLIF(w.sent_count, 0) * 100 as winner_open_rate
FROM digest_ab_tests t
LEFT JOIN digest_ab_variants v ON t.id = v.test_id
LEFT JOIN digest_ab_variants w ON t.winner_variant_id = w.id
WHERE t.completed_at IS NOT NULL
GROUP BY t.id, t.name, t.description, t.algorithm, t.started_at, t.completed_at, 
         t.completion_reason, t.final_insights, w.name, w.sent_count, w.open_count;

-- Function to complete a test
CREATE OR REPLACE FUNCTION complete_digest_test(
  p_test_id UUID,
  p_winner_variant_id UUID,
  p_reason TEXT,
  p_insights JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE digest_ab_tests
  SET 
    completed_at = NOW(),
    winner_variant_id = p_winner_variant_id,
    completion_reason = p_reason,
    final_insights = p_insights,
    is_active = FALSE
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON digest_test_history TO authenticated;
GRANT EXECUTE ON FUNCTION complete_digest_test TO authenticated;
