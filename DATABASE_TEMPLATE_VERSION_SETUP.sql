-- Template Version Control System
-- This SQL script sets up version tracking for report templates

-- Create template_versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  date_range TEXT NOT NULL,
  metrics JSONB NOT NULL,
  email_subject TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(template_id, version_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON template_versions(created_at DESC);

-- Enable RLS
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view versions of templates in their org"
  ON template_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_versions.template_id
      AND rt.organization_id = auth.jwt()->>'organization_id'
    )
  );

CREATE POLICY "Users can create versions when updating templates"
  ON template_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_versions.template_id
      AND rt.organization_id = auth.jwt()->>'organization_id'
    )
  );

-- Function to automatically create version on template update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if this is an update (not insert)
  IF TG_OP = 'UPDATE' THEN
    -- Check if any tracked fields changed
    IF OLD.name != NEW.name OR 
       OLD.description != NEW.description OR
       OLD.date_range != NEW.date_range OR
       OLD.metrics::text != NEW.metrics::text OR
       OLD.email_subject != NEW.email_subject OR
       OLD.timezone != NEW.timezone THEN
      
      -- Insert old version
      INSERT INTO template_versions (
        template_id,
        version_number,
        name,
        description,
        date_range,
        metrics,
        email_subject,
        timezone,
        created_by,
        created_at,
        change_summary
      )
      SELECT
        OLD.id,
        COALESCE((SELECT MAX(version_number) FROM template_versions WHERE template_id = OLD.id), 0) + 1,
        OLD.name,
        OLD.description,
        OLD.date_range,
        OLD.metrics,
        OLD.email_subject,
        OLD.timezone,
        NEW.updated_by,
        OLD.updated_at,
        'Template updated';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS template_version_trigger ON report_templates;
CREATE TRIGGER template_version_trigger
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Grant permissions
GRANT SELECT, INSERT ON template_versions TO authenticated;
