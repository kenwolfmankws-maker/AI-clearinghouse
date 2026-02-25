-- =====================================================
-- APPROVAL WORKFLOW ANALYTICS SETUP
-- =====================================================
-- This script creates analytics views and functions for
-- tracking approval workflow performance and metrics
-- Run after DATABASE_MULTILEVEL_APPROVAL_SETUP.sql

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View: Approval time by level
CREATE OR REPLACE VIEW approval_time_by_level AS
SELECT 
  ac.name as chain_name,
  al.level_number,
  al.level_name,
  COUNT(ah.id) as total_approvals,
  AVG(EXTRACT(EPOCH FROM (ah.created_at - tcr.created_at))/3600) as avg_hours_to_approve,
  MIN(EXTRACT(EPOCH FROM (ah.created_at - tcr.created_at))/3600) as min_hours,
  MAX(EXTRACT(EPOCH FROM (ah.created_at - tcr.created_at))/3600) as max_hours
FROM approval_history ah
JOIN template_change_requests tcr ON ah.change_request_id = tcr.id
JOIN approval_chains ac ON tcr.approval_chain_id = ac.id
JOIN approval_levels al ON ah.level_id = al.id
WHERE ah.action = 'approved'
GROUP BY ac.name, al.level_number, al.level_name;

-- View: Approver performance metrics
CREATE OR REPLACE VIEW approver_performance AS
SELECT 
  u.email as approver_email,
  COUNT(CASE WHEN ah.action = 'approved' THEN 1 END) as approvals,
  COUNT(CASE WHEN ah.action = 'rejected' THEN 1 END) as rejections,
  COUNT(*) as total_decisions,
  ROUND(COUNT(CASE WHEN ah.action = 'approved' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as approval_rate,
  AVG(EXTRACT(EPOCH FROM (ah.created_at - tcr.created_at))/3600) as avg_response_hours
FROM approval_history ah
JOIN template_change_requests tcr ON ah.change_request_id = tcr.id
JOIN auth.users u ON ah.approver_id = u.id
GROUP BY u.email;

-- View: Escalation metrics
CREATE OR REPLACE VIEW escalation_metrics AS
SELECT 
  ac.name as chain_name,
  COUNT(*) as total_escalations,
  COUNT(CASE WHEN tcr.status = 'approved' THEN 1 END) as escalated_and_approved,
  COUNT(CASE WHEN tcr.status = 'rejected' THEN 1 END) as escalated_and_rejected,
  COUNT(CASE WHEN tcr.status = 'pending' THEN 1 END) as escalated_pending
FROM template_change_requests tcr
JOIN approval_chains ac ON tcr.approval_chain_id = ac.id
WHERE tcr.escalated = true
GROUP BY ac.name;

-- View: Delegation usage
CREATE OR REPLACE VIEW delegation_usage AS
SELECT 
  u.email as approver_email,
  COUNT(DISTINCT ad.id) as total_delegations,
  SUM(EXTRACT(EPOCH FROM (ad.end_date - ad.start_date))/86400) as total_days_delegated,
  COUNT(CASE WHEN ad.is_active THEN 1 END) as active_delegations
FROM approval_delegations ad
JOIN auth.users u ON ad.approver_id = u.id
GROUP BY u.email;

-- View: Bottleneck identification
CREATE OR REPLACE VIEW approval_bottlenecks AS
SELECT 
  al.level_name,
  ac.name as chain_name,
  COUNT(tcr.id) as pending_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - tcr.created_at))/3600) as avg_wait_hours,
  MAX(EXTRACT(EPOCH FROM (NOW() - tcr.created_at))/3600) as max_wait_hours
FROM template_change_requests tcr
JOIN approval_chains ac ON tcr.approval_chain_id = ac.id
JOIN approval_levels al ON tcr.current_level_id = al.id
WHERE tcr.status = 'pending'
GROUP BY al.level_name, ac.name
ORDER BY avg_wait_hours DESC;

-- Enable RLS
ALTER TABLE approval_time_by_level OWNER TO authenticated;
ALTER TABLE approver_performance OWNER TO authenticated;
ALTER TABLE escalation_metrics OWNER TO authenticated;
ALTER TABLE delegation_usage OWNER TO authenticated;
ALTER TABLE approval_bottlenecks OWNER TO authenticated;
