-- AI Recommendation Engine Database Setup
-- This creates views and functions to support AI-powered test recommendations

-- View: Aggregated test performance metrics for AI analysis
CREATE OR REPLACE VIEW digest_test_performance_summary AS
SELECT 
  algorithm,
  COUNT(*) as total_tests,
  AVG(CASE WHEN winner_variant_id IS NOT NULL THEN 1 ELSE 0 END) as success_rate,
  AVG(total_sent) as avg_total_sent,
  AVG(
    CASE 
      WHEN total_sent > 0 
      THEN (total_opens::float / total_sent) * 100 
      ELSE 0 
    END
  ) as avg_open_rate,
  AVG(
    CASE 
      WHEN total_sent > 0 
      THEN (total_clicks::float / total_sent) * 100 
      ELSE 0 
    END
  ) as avg_click_rate,
  AVG(confidence_level) as avg_confidence,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_duration_hours
FROM digest_test_history
WHERE status = 'completed'
GROUP BY algorithm;

-- View: Subject line pattern analysis
CREATE OR REPLACE VIEW subject_line_patterns AS
SELECT 
  dth.algorithm,
  dtv.subject_line,
  dtv.open_rate,
  dtv.click_rate,
  dtv.conversion_rate,
  dth.winner_variant_id = dtv.id as is_winner,
  dth.completed_at
FROM digest_test_history dth
JOIN digest_test_variants dtv ON dth.test_id = dtv.test_id
WHERE dth.status = 'completed'
ORDER BY dth.completed_at DESC;

-- View: Variant count effectiveness
CREATE OR REPLACE VIEW variant_count_analysis AS
SELECT 
  variant_count,
  COUNT(*) as test_count,
  AVG(CASE WHEN winner_variant_id IS NOT NULL THEN 1 ELSE 0 END) as success_rate,
  AVG(avg_open_rate) as avg_open_rate,
  AVG(avg_click_rate) as avg_click_rate,
  AVG(duration_hours) as avg_duration_hours
FROM digest_test_history
WHERE status = 'completed'
GROUP BY variant_count
ORDER BY variant_count;
