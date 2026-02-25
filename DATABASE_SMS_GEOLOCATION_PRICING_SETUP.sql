-- SMS Geolocation Pricing Tables
-- Stores per-country/region SMS pricing rates

-- Table: sms_pricing_tiers
CREATE TABLE IF NOT EXISTS sms_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-3 (USA, GBR, etc)
  country_name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL, -- North America, Europe, Asia, etc
  cost_per_sms DECIMAL(10, 6) NOT NULL, -- Cost in USD
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sms_cost_by_region (aggregated analytics)
CREATE TABLE IF NOT EXISTS sms_cost_by_region (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  message_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_cost_by_region ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_pricing_tiers (admin only can modify)
CREATE POLICY "Anyone can view SMS pricing tiers"
  ON sms_pricing_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert SMS pricing tiers"
  ON sms_pricing_tiers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update SMS pricing tiers"
  ON sms_pricing_tiers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true
  ));

-- RLS Policies for sms_cost_by_region
CREATE POLICY "Users can view their own regional costs"
  ON sms_cost_by_region FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "System can insert regional costs"
  ON sms_cost_by_region FOR INSERT
  WITH CHECK (true);

-- Insert default pricing tiers
INSERT INTO sms_pricing_tiers (country_code, country_name, region, cost_per_sms) VALUES
  ('USA', 'United States', 'North America', 0.0075),
  ('CAN', 'Canada', 'North America', 0.0080),
  ('GBR', 'United Kingdom', 'Europe', 0.0090),
  ('DEU', 'Germany', 'Europe', 0.0095),
  ('FRA', 'France', 'Europe', 0.0092),
  ('AUS', 'Australia', 'Oceania', 0.0110),
  ('JPN', 'Japan', 'Asia', 0.0105),
  ('CHN', 'China', 'Asia', 0.0085),
  ('IND', 'India', 'Asia', 0.0065),
  ('BRA', 'Brazil', 'South America', 0.0120),
  ('MEX', 'Mexico', 'North America', 0.0088),
  ('ESP', 'Spain', 'Europe', 0.0093),
  ('ITA', 'Italy', 'Europe', 0.0094),
  ('NLD', 'Netherlands', 'Europe', 0.0091),
  ('SWE', 'Sweden', 'Europe', 0.0096),
  ('ZZZ', 'Other/Unknown', 'Other', 0.0150)
ON CONFLICT (country_code) DO NOTHING;

-- Create indexes
CREATE INDEX idx_sms_pricing_country ON sms_pricing_tiers(country_code);
CREATE INDEX idx_sms_pricing_region ON sms_pricing_tiers(region);
CREATE INDEX idx_sms_cost_region_org ON sms_cost_by_region(org_id, period_start);
