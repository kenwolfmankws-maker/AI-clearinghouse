-- Report Template Approval Workflow System
-- Run this in Supabase SQL Editor to set up the approval workflow

-- Table for template approvers (who can approve template changes)
CREATE TABLE IF NOT EXISTS template_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, organization_id)
);

-- Table for pending template changes (awaiting approval)
CREATE TABLE IF NOT EXISTS template_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Store the proposed changes
  proposed_name VARCHAR(255),
  proposed_description TEXT,
  proposed_metrics JSONB,
  proposed_date_range VARCHAR(50),
  proposed_filters JSONB,
  proposed_format VARCHAR(50),
  proposed_is_public BOOLEAN,
  
  -- Approval details
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_comment TEXT,
  
  -- Original values (for rollback)
  original_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for approval history audit trail
CREATE TABLE IF NOT EXISTS template_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES template_change_requests(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'cancelled')),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE template_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_approvers
CREATE POLICY "Users can view approvers in their org"
  ON template_approvers FOR SELECT
  USING (
    organization_id IS NULL OR
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage approvers"
  ON template_approvers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for template_change_requests
CREATE POLICY "Users can view change requests they created or can approve"
  ON template_change_requests FOR SELECT
  USING (
    requested_by = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM template_approvers)
  );

CREATE POLICY "Users can create change requests"
  ON template_change_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Approvers can update change requests"
  ON template_change_requests FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM template_approvers));

-- RLS Policies for template_approval_history
CREATE POLICY "Users can view approval history"
  ON template_approval_history FOR SELECT
  USING (
    performed_by = auth.uid() OR
    auth.uid() IN (SELECT user_id FROM template_approvers) OR
    template_id IN (SELECT id FROM report_templates WHERE created_by = auth.uid())
  );

CREATE POLICY "System can insert approval history"
  ON template_approval_history FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_template_change_requests_status ON template_change_requests(status);
CREATE INDEX idx_template_change_requests_template ON template_change_requests(template_id);
CREATE INDEX idx_template_approvers_user ON template_approvers(user_id);
CREATE INDEX idx_approval_history_request ON template_approval_history(change_request_id);
