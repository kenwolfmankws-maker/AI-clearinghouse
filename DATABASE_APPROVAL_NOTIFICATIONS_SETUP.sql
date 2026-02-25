-- =====================================================
-- APPROVAL WORKFLOW NOTIFICATIONS SETUP
-- =====================================================
-- This script sets up real-time notifications for approval workflow events
-- including template submissions, approvals, rejections, escalations, and delegations

-- Add new notification types for approval workflow
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'approval_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'approval_granted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'approval_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'approval_escalated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'delegation_activated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'delegation_received';

-- Add action_url and action_label columns to notifications table for quick navigation
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT;

-- Create notification preferences for approval workflow events
INSERT INTO notification_preferences (user_id, event_type, enabled, email_enabled)
SELECT DISTINCT user_id, 'approval_request', true, true
FROM users
ON CONFLICT (user_id, event_type) DO NOTHING;

-- Function to notify approvers when a template change request is submitted
CREATE OR REPLACE FUNCTION notify_approval_request()
RETURNS TRIGGER AS $$
DECLARE
  approver_record RECORD;
  template_name TEXT;
  requester_name TEXT;
BEGIN
  -- Get template name
  SELECT name INTO template_name FROM report_templates WHERE id = NEW.template_id;
  
  -- Get requester name
  SELECT COALESCE(full_name, email) INTO requester_name FROM users WHERE id = NEW.requester_id;
  
  -- Notify all approvers at the first level
  FOR approver_record IN 
    SELECT DISTINCT u.id, u.email
    FROM approval_chain_approvers aca
    JOIN users u ON u.id = aca.user_id
    WHERE aca.chain_id = NEW.chain_id 
    AND aca.level_number = 1
  LOOP
    INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
    VALUES (
      approver_record.id,
      'approval_request',
      'New Approval Request',
      requester_name || ' submitted a change request for template "' || template_name || '"',
      jsonb_build_object(
        'request_id', NEW.id,
        'template_id', NEW.template_id,
        'template_name', template_name,
        'requester_id', NEW.requester_id,
        'requester_name', requester_name
      ),
      '/organization?tab=scheduled-reports&subtab=approvals',
      'Review Request'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new approval requests
DROP TRIGGER IF EXISTS on_approval_request_created ON approval_requests;
CREATE TRIGGER on_approval_request_created
AFTER INSERT ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION notify_approval_request();

-- Function to notify when approval is granted
CREATE OR REPLACE FUNCTION notify_approval_granted()
RETURNS TRIGGER AS $$
DECLARE
  template_name TEXT;
  approver_name TEXT;
  requester_id UUID;
  next_level_approvers RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get template and approver info
    SELECT rt.name, ar.requester_id INTO template_name, requester_id
    FROM approval_requests ar
    JOIN report_templates rt ON rt.id = ar.template_id
    WHERE ar.id = NEW.request_id;
    
    SELECT COALESCE(full_name, email) INTO approver_name FROM users WHERE id = NEW.approver_id;
    
    -- Notify requester
    INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
    VALUES (
      requester_id,
      'approval_granted',
      'Approval Granted',
      approver_name || ' approved your change request for "' || template_name || '"',
      jsonb_build_object(
        'request_id', NEW.request_id,
        'template_name', template_name,
        'approver_name', approver_name,
        'level_number', NEW.level_number
      ),
      '/organization?tab=scheduled-reports',
      'View Template'
    );
    
    -- Notify next level approvers if not final level
    FOR next_level_approvers IN
      SELECT DISTINCT u.id
      FROM approval_chain_approvers aca
      JOIN approval_requests ar ON ar.chain_id = aca.chain_id
      JOIN users u ON u.id = aca.user_id
      WHERE ar.id = NEW.request_id
      AND aca.level_number = NEW.level_number + 1
    LOOP
      INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
      VALUES (
        next_level_approvers.id,
        'approval_request',
        'Approval Request - Next Level',
        'A change request for "' || template_name || '" requires your approval',
        jsonb_build_object(
          'request_id', NEW.request_id,
          'template_name', template_name,
          'level_number', NEW.level_number + 1
        ),
        '/organization?tab=scheduled-reports&subtab=approvals',
        'Review Request'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval granted
DROP TRIGGER IF EXISTS on_approval_status_changed ON approval_request_approvals;
CREATE TRIGGER on_approval_status_changed
AFTER UPDATE ON approval_request_approvals
FOR EACH ROW
EXECUTE FUNCTION notify_approval_granted();

-- Function to notify when approval is rejected
CREATE OR REPLACE FUNCTION notify_approval_rejected()
RETURNS TRIGGER AS $$
DECLARE
  template_name TEXT;
  approver_name TEXT;
  requester_id UUID;
BEGIN
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    SELECT rt.name, ar.requester_id INTO template_name, requester_id
    FROM approval_requests ar
    JOIN report_templates rt ON rt.id = ar.template_id
    WHERE ar.id = NEW.request_id;
    
    SELECT COALESCE(full_name, email) INTO approver_name FROM users WHERE id = NEW.approver_id;
    
    INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
    VALUES (
      requester_id,
      'approval_rejected',
      'Approval Rejected',
      approver_name || ' rejected your change request for "' || template_name || '". Reason: ' || COALESCE(NEW.comments, 'No reason provided'),
      jsonb_build_object(
        'request_id', NEW.request_id,
        'template_name', template_name,
        'approver_name', approver_name,
        'comments', NEW.comments
      ),
      '/organization?tab=scheduled-reports',
      'View Details'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval rejected
DROP TRIGGER IF EXISTS on_approval_rejected ON approval_request_approvals;
CREATE TRIGGER on_approval_rejected
AFTER UPDATE ON approval_request_approvals
FOR EACH ROW
EXECUTE FUNCTION notify_approval_rejected();

-- Function to notify when request is escalated
CREATE OR REPLACE FUNCTION notify_escalation()
RETURNS TRIGGER AS $$
DECLARE
  template_name TEXT;
  escalated_by_name TEXT;
  approver_record RECORD;
BEGIN
  SELECT rt.name INTO template_name
  FROM approval_requests ar
  JOIN report_templates rt ON rt.id = ar.template_id
  WHERE ar.id = NEW.request_id;
  
  SELECT COALESCE(full_name, email) INTO escalated_by_name FROM users WHERE id = NEW.escalated_by;
  
  -- Notify approvers at escalated level
  FOR approver_record IN
    SELECT DISTINCT u.id
    FROM approval_chain_approvers aca
    JOIN approval_requests ar ON ar.chain_id = aca.chain_id
    JOIN users u ON u.id = aca.user_id
    WHERE ar.id = NEW.request_id
    AND aca.level_number = NEW.escalated_to_level
  LOOP
    INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
    VALUES (
      approver_record.id,
      'approval_escalated',
      'Urgent: Escalated Approval Request',
      escalated_by_name || ' escalated a change request for "' || template_name || '". Reason: ' || NEW.reason,
      jsonb_build_object(
        'request_id', NEW.request_id,
        'template_name', template_name,
        'escalated_by', escalated_by_name,
        'reason', NEW.reason,
        'escalated_to_level', NEW.escalated_to_level
      ),
      '/organization?tab=scheduled-reports&subtab=approvals',
      'Review Urgent Request'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for escalations
DROP TRIGGER IF EXISTS on_escalation_created ON approval_escalations;
CREATE TRIGGER on_escalation_created
AFTER INSERT ON approval_escalations
FOR EACH ROW
EXECUTE FUNCTION notify_escalation();

-- Function to notify when delegation is activated
CREATE OR REPLACE FUNCTION notify_delegation()
RETURNS TRIGGER AS $$
DECLARE
  delegator_name TEXT;
  delegate_name TEXT;
BEGIN
  SELECT COALESCE(full_name, email) INTO delegator_name FROM users WHERE id = NEW.delegator_id;
  SELECT COALESCE(full_name, email) INTO delegate_name FROM users WHERE id = NEW.delegate_id;
  
  -- Notify delegator
  INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
  VALUES (
    NEW.delegator_id,
    'delegation_activated',
    'Delegation Activated',
    'Your approval authority has been delegated to ' || delegate_name || ' from ' || NEW.start_date || ' to ' || NEW.end_date,
    jsonb_build_object(
      'delegation_id', NEW.id,
      'delegate_name', delegate_name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    ),
    '/organization?tab=scheduled-reports&subtab=delegation',
    'Manage Delegations'
  );
  
  -- Notify delegate
  INSERT INTO notifications (user_id, type, title, message, data, action_url, action_label)
  VALUES (
    NEW.delegate_id,
    'delegation_received',
    'Approval Authority Delegated',
    delegator_name || ' has delegated their approval authority to you from ' || NEW.start_date || ' to ' || NEW.end_date,
    jsonb_build_object(
      'delegation_id', NEW.id,
      'delegator_name', delegator_name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    ),
    '/organization?tab=scheduled-reports&subtab=approvals',
    'View Pending Approvals'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for delegations
DROP TRIGGER IF EXISTS on_delegation_created ON approval_delegations;
CREATE TRIGGER on_delegation_created
AFTER INSERT ON approval_delegations
FOR EACH ROW
EXECUTE FUNCTION notify_delegation();

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
