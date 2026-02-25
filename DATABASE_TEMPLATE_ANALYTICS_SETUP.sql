-- Template Usage Analytics Table
CREATE TABLE IF NOT EXISTS template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  action VARCHAR(50) CHECK (action IN ('created', 'cloned', 'used', 'edited', 'deleted'))
);

-- RLS Policies for Template Analytics
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org analytics"
  ON template_usage_analytics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert analytics"
  ON template_usage_analytics FOR INSERT
  WITH CHECK (true);

-- Function to track template usage
CREATE OR REPLACE FUNCTION track_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO template_usage_analytics (template_id, used_by, action)
  VALUES (NEW.id, auth.uid(), TG_ARGV[0]);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic tracking
CREATE TRIGGER track_template_created
  AFTER INSERT ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION track_template_usage('created');

CREATE TRIGGER track_template_edited
  AFTER UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION track_template_usage('edited');

-- View for template popularity
CREATE OR REPLACE VIEW template_popularity AS
SELECT 
  rt.id,
  rt.name,
  rt.is_system,
  COUNT(DISTINCT tua.id) as usage_count,
  COUNT(DISTINCT sr.id) as active_reports,
  MAX(tua.used_at) as last_used
FROM report_templates rt
LEFT JOIN template_usage_analytics tua ON rt.id = tua.template_id
LEFT JOIN scheduled_reports sr ON sr.name LIKE rt.name || '%'
GROUP BY rt.id, rt.name, rt.is_system
ORDER BY usage_count DESC;
