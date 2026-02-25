-- Add IP allowlist column to webhook_configs table
-- This enables restricting webhook deliveries to specific IP addresses or CIDR ranges

ALTER TABLE webhook_configs 
ADD COLUMN IF NOT EXISTS allowed_ips TEXT[] DEFAULT NULL;

COMMENT ON COLUMN webhook_configs.allowed_ips IS 
'Array of allowed IP addresses or CIDR ranges for webhook delivery. NULL or empty array means all IPs are allowed. Example: {''192.168.1.1'', ''10.0.0.0/24''}';

-- Example usage:
-- Update a webhook to only allow specific IPs
-- UPDATE webhook_configs 
-- SET allowed_ips = ARRAY['192.168.1.100', '10.0.0.0/24']
-- WHERE id = 'your-webhook-id';

-- Remove IP restrictions (allow all IPs)
-- UPDATE webhook_configs 
-- SET allowed_ips = NULL
-- WHERE id = 'your-webhook-id';
