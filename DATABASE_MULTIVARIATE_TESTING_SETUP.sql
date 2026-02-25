-- Multi-variant Testing with Bayesian Analysis and Multi-Armed Bandit
-- Extends A/B testing to support A/B/C/D/... testing with advanced algorithms

-- Add Bayesian statistics columns to variants
ALTER TABLE digest_ab_variants ADD COLUMN IF NOT EXISTS alpha INTEGER DEFAULT 1;
ALTER TABLE digest_ab_variants ADD COLUMN IF NOT EXISTS beta INTEGER DEFAULT 1;
ALTER TABLE digest_ab_variants ADD COLUMN IF NOT EXISTS thompson_score DECIMAL;
ALTER TABLE digest_ab_variants ADD COLUMN IF NOT EXISTS ucb_score DECIMAL;
ALTER TABLE digest_ab_variants ADD COLUMN IF NOT EXISTS allocation_strategy TEXT DEFAULT 'equal' 
  CHECK (allocation_strategy IN ('equal', 'thompson', 'ucb', 'epsilon_greedy'));

-- Add multi-armed bandit configuration to tests
ALTER TABLE digest_ab_tests ADD COLUMN IF NOT EXISTS allocation_algorithm TEXT DEFAULT 'equal'
  CHECK (allocation_algorithm IN ('equal', 'thompson', 'ucb', 'epsilon_greedy'));
ALTER TABLE digest_ab_tests ADD COLUMN IF NOT EXISTS epsilon DECIMAL DEFAULT 0.1; -- for epsilon-greedy
ALTER TABLE digest_ab_tests ADD COLUMN IF NOT EXISTS exploration_rate DECIMAL DEFAULT 0.2;
ALTER TABLE digest_ab_tests ADD COLUMN IF NOT EXISTS bayesian_prior_alpha INTEGER DEFAULT 1;
ALTER TABLE digest_ab_tests ADD COLUMN IF NOT EXISTS bayesian_prior_beta INTEGER DEFAULT 1;

-- Function to calculate Thompson Sampling scores
CREATE OR REPLACE FUNCTION calculate_thompson_scores(test_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE digest_ab_variants v
  SET thompson_score = random_beta(
    COALESCE(r.digests_opened, 0) + v.alpha,
    COALESCE(r.digests_sent - r.digests_opened, 0) + v.beta
  )
  FROM digest_ab_results r
  WHERE v.test_id = test_uuid
    AND r.variant_id = v.id
    AND r.test_id = test_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate UCB scores
CREATE OR REPLACE FUNCTION calculate_ucb_scores(test_uuid UUID, exploration DECIMAL DEFAULT 2.0)
RETURNS void AS $$
DECLARE
  total_trials INTEGER;
BEGIN
  SELECT SUM(digests_sent) INTO total_trials
  FROM digest_ab_results
  WHERE test_id = test_uuid;
  
  UPDATE digest_ab_variants v
  SET ucb_score = 
    COALESCE(r.open_rate, 0) + 
    exploration * SQRT(LN(GREATEST(total_trials, 1)) / GREATEST(r.digests_sent, 1))
  FROM digest_ab_results r
  WHERE v.test_id = test_uuid
    AND r.variant_id = v.id
    AND r.test_id = test_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update Bayesian parameters
CREATE OR REPLACE FUNCTION update_bayesian_params(variant_uuid UUID, success BOOLEAN)
RETURNS void AS $$
BEGIN
  IF success THEN
    UPDATE digest_ab_variants
    SET alpha = alpha + 1
    WHERE id = variant_uuid;
  ELSE
    UPDATE digest_ab_variants
    SET beta = beta + 1
    WHERE id = variant_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function for beta distribution sampling (approximation)
CREATE OR REPLACE FUNCTION random_beta(alpha_param INTEGER, beta_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  x DECIMAL;
  y DECIMAL;
BEGIN
  -- Using Gamma distribution approximation
  x := random_gamma(alpha_param, 1.0);
  y := random_gamma(beta_param, 1.0);
  RETURN x / (x + y);
END;
$$ LANGUAGE plpgsql;

-- Helper function for gamma distribution (approximation using normal)
CREATE OR REPLACE FUNCTION random_gamma(shape INTEGER, scale DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Simple approximation for integer shape parameters
  IF shape < 1 THEN
    RETURN 0.5;
  END IF;
  RETURN shape * scale * (0.5 + random() * 0.5);
END;
$$ LANGUAGE plpgsql;

-- View for Bayesian analysis results
CREATE OR REPLACE VIEW digest_bayesian_analysis AS
SELECT 
  t.id as test_id,
  t.name as test_name,
  v.id as variant_id,
  v.name as variant_name,
  v.alpha,
  v.beta,
  v.alpha::DECIMAL / (v.alpha + v.beta) as posterior_mean,
  SQRT((v.alpha::DECIMAL * v.beta) / (POWER(v.alpha + v.beta, 2) * (v.alpha + v.beta + 1))) as posterior_std,
  v.thompson_score,
  v.ucb_score,
  r.digests_sent,
  r.digests_opened,
  r.open_rate
FROM digest_ab_tests t
JOIN digest_ab_variants v ON t.id = v.test_id
LEFT JOIN digest_ab_results r ON v.id = r.variant_id
WHERE t.status = 'active';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_variants_thompson ON digest_ab_variants(test_id, thompson_score DESC);
CREATE INDEX IF NOT EXISTS idx_variants_ucb ON digest_ab_variants(test_id, ucb_score DESC);
