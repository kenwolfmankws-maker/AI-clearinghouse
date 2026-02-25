-- Multi-Level Approval Workflow Setup
-- Run this after DATABASE_TEMPLATE_APPROVAL_SETUP.sql

-- Add approval level tracking to change requests
ALTER TABLE template_change_requests 
ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_approval_levels INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Approval chains define multi-level approval requirements
CREATE TABLE IF NOT EXISTS approval_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Approval levels define each step in the chain
CREATE TABLE IF NOT EXISTS approval_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES approval_chains(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  required_approvers INTEGER DEFAULT 1,
  escalation_hours INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain_id, level_number)
);

-- Level approvers define who can approve at each level
CREATE TABLE IF NOT EXISTS level_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES approval_levels(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(level_id, approver_id)
);

-- Delegations allow approvers to delegate authority
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID REFERENCES auth.users(id),
  delegate_id UUID REFERENCES auth.users(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- Escalations track when approvals are escalated
CREATE TABLE IF NOT EXISTS approval_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID REFERENCES template_change_requests(id),
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  escalation_reason TEXT NOT NULL,
  escalated_by UUID REFERENCES auth.users(id),
  escalated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chains in their org" ON approval_chains FOR SELECT USING (organization_id = auth.uid() OR organization_id IS NULL);
CREATE POLICY "Users can manage chains in their org" ON approval_chains FOR ALL USING (organization_id = auth.uid());

CREATE POLICY "Users can view levels" ON approval_levels FOR SELECT USING (true);
CREATE POLICY "Chain owners can manage levels" ON approval_levels FOR ALL USING (
  EXISTS (SELECT 1 FROM approval_chains WHERE id = chain_id AND organization_id = auth.uid())
);

CREATE POLICY "Users can view level approvers" ON level_approvers FOR SELECT USING (true);
CREATE POLICY "Chain owners can manage approvers" ON level_approvers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM approval_levels al 
    JOIN approval_chains ac ON al.chain_id = ac.id 
    WHERE al.id = level_id AND ac.organization_id = auth.uid()
  )
);

CREATE POLICY "Users can view their delegations" ON approval_delegations FOR SELECT USING (delegator_id = auth.uid() OR delegate_id = auth.uid());
CREATE POLICY "Users can manage their delegations" ON approval_delegations FOR ALL USING (delegator_id = auth.uid());

CREATE POLICY "Users can view escalations" ON approval_escalations FOR SELECT USING (true);
CREATE POLICY "Approvers can create escalations" ON approval_escalations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM template_approvers WHERE user_id = auth.uid())
);

-- Function to check if user is approver at current level (including delegates)
CREATE OR REPLACE FUNCTION is_approver_at_level(p_change_request_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_level INTEGER;
  v_is_approver BOOLEAN;
BEGIN
  SELECT current_approval_level INTO v_current_level
  FROM template_change_requests WHERE id = p_change_request_id;
  
  -- Check direct approver
  SELECT EXISTS (
    SELECT 1 FROM template_change_requests tcr
    JOIN approval_levels al ON al.chain_id = tcr.id AND al.level_number = v_current_level
    JOIN level_approvers la ON la.level_id = al.id
    WHERE tcr.id = p_change_request_id AND la.approver_id = p_user_id
  ) INTO v_is_approver;
  
  IF v_is_approver THEN RETURN true; END IF;
  
  -- Check delegation
  SELECT EXISTS (
    SELECT 1 FROM approval_delegations
    WHERE delegate_id = p_user_id 
    AND is_active = true
    AND NOW() BETWEEN start_date AND end_date
    AND delegator_id IN (
      SELECT la.approver_id FROM template_change_requests tcr
      JOIN approval_levels al ON al.chain_id = tcr.id AND al.level_number = v_current_level
      JOIN level_approvers la ON la.level_id = al.id
      WHERE tcr.id = p_change_request_id
    )
  ) INTO v_is_approver;
  
  RETURN v_is_approver;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default approval chains
INSERT INTO approval_chains (name, description, is_active) VALUES
('Standard Two-Level', 'Manager approval followed by director approval', true),
('Executive Three-Level', 'Manager, director, then executive approval', true),
('Simple Single-Level', 'Single approver required', true);
