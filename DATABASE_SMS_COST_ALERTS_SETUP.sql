-- SMS Cost Budgets Table
CREATE TABLE IF NOT EXISTS sms_cost_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('daily', 'monthly')),
  budget_limit DECIMAL(10,2) NOT NULL,
  current_spend DECIMAL(10,2) DEFAULT 0,
  warning_threshold INTEGER DEFAULT 80 CHECK (warning_threshold BETWEEN 1 AND 100),
  critical_threshold INTEGER DEFAULT 95 CHECK (critical_threshold BETWEEN 1 AND 100),
  alert_email TEXT,
  alert_slack_channel TEXT,
  reset_day INTEGER DEFAULT 1 CHECK (reset_day BETWEEN 1 AND 31),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Cost Alerts History
CREATE TABLE IF NOT EXISTS sms_cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES sms_cost_budgets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'critical', 'exceeded')),
  current_spend DECIMAL(10,2) NOT NULL,
  budget_limit DECIMAL(10,2) NOT NULL,
  percentage_used INTEGER NOT NULL,
  alert_sent_at TIMESTAMPTZ DEFAULT NOW(),
  notification_channels TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE sms_cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_cost_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own SMS budgets"
  ON sms_cost_budgets FOR ALL
  USING (auth.uid() = organization_id);

CREATE POLICY "Users can view their own SMS cost alerts"
  ON sms_cost_alerts FOR SELECT
  USING (budget_id IN (SELECT id FROM sms_cost_budgets WHERE organization_id = auth.uid()));

-- Indexes
CREATE INDEX idx_sms_cost_budgets_org ON sms_cost_budgets(organization_id);
CREATE INDEX idx_sms_cost_budgets_active ON sms_cost_budgets(is_active);
CREATE INDEX idx_sms_cost_alerts_budget ON sms_cost_alerts(budget_id);
CREATE INDEX idx_sms_cost_alerts_sent ON sms_cost_alerts(alert_sent_at);

-- Function to update current spend
CREATE OR REPLACE FUNCTION update_sms_budget_spend()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' OR NEW.status = 'failed' THEN
    UPDATE sms_cost_budgets
    SET current_spend = current_spend + COALESCE(NEW.cost, 0),
        updated_at = NOW()
    WHERE organization_id = NEW.organization_id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update spend when SMS is delivered
CREATE TRIGGER update_budget_on_sms_delivery
  AFTER INSERT OR UPDATE ON sms_notification_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_budget_spend();
