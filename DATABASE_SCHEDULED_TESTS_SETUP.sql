-- Scheduled A/B Tests System
-- Allows scheduling tests to start at specific dates/times with recurring patterns

-- Create scheduled tests table
CREATE TABLE IF NOT EXISTS scheduled_digest_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Schedule configuration
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence_pattern TEXT, -- 'none', 'daily', 'weekly', 'monthly'
  recurrence_end_date TIMESTAMPTZ,
  
  -- Test configuration
  variant_count INTEGER NOT NULL DEFAULT 2,
  algorithm TEXT NOT NULL DEFAULT 'equal',
  subject_line_template TEXT NOT NULL,
  content_template TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'cancelled'
  actual_start_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  active_test_id UUID REFERENCES digest_ab_tests(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_scheduled_tests_user ON scheduled_digest_tests(user_id);
CREATE INDEX idx_scheduled_tests_status ON scheduled_digest_tests(status);
CREATE INDEX idx_scheduled_tests_next_run ON scheduled_digest_tests(next_run_at) WHERE status = 'scheduled';

-- Enable RLS
ALTER TABLE scheduled_digest_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scheduled tests"
  ON scheduled_digest_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled tests"
  ON scheduled_digest_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled tests"
  ON scheduled_digest_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled tests"
  ON scheduled_digest_tests FOR DELETE
  USING (auth.uid() = user_id);

-- Function to process scheduled tests
CREATE OR REPLACE FUNCTION process_scheduled_tests()
RETURNS TABLE(started_count INTEGER, message TEXT) AS $$
DECLARE
  test_record RECORD;
  new_test_id UUID;
  started INTEGER := 0;
BEGIN
  -- Find tests ready to start
  FOR test_record IN
    SELECT * FROM scheduled_digest_tests
    WHERE status = 'scheduled'
    AND next_run_at <= NOW()
    ORDER BY next_run_at
  LOOP
    -- Create new A/B test
    INSERT INTO digest_ab_tests (
      user_id, name, variant_count, algorithm, status
    ) VALUES (
      test_record.user_id,
      test_record.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),
      test_record.variant_count,
      test_record.algorithm,
      'active'
    ) RETURNING id INTO new_test_id;
    
    -- Update scheduled test
    UPDATE scheduled_digest_tests
    SET status = 'running',
        actual_start_time = NOW(),
        active_test_id = new_test_id,
        last_run_at = NOW(),
        next_run_at = CASE
          WHEN recurrence_pattern = 'daily' THEN next_run_at + INTERVAL '1 day'
          WHEN recurrence_pattern = 'weekly' THEN next_run_at + INTERVAL '7 days'
          WHEN recurrence_pattern = 'monthly' THEN next_run_at + INTERVAL '1 month'
          ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = test_record.id;
    
    -- If recurring and within end date, reset to scheduled
    IF test_record.recurrence_pattern != 'none' AND 
       (test_record.recurrence_end_date IS NULL OR 
        test_record.recurrence_end_date > NOW()) THEN
      UPDATE scheduled_digest_tests
      SET status = 'scheduled'
      WHERE id = test_record.id;
    END IF;
    
    started := started + 1;
  END LOOP;
  
  RETURN QUERY SELECT started, 'Processed ' || started || ' scheduled tests';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
