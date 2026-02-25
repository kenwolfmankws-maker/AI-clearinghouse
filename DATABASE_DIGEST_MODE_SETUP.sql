-- Add digest mode columns to notification_preferences table
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
ADD COLUMN IF NOT EXISTS digest_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS digest_day_of_week INTEGER DEFAULT 1 CHECK (digest_day_of_week BETWEEN 0 AND 6);

-- Add last_digest_sent column to track when digest was last sent
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS last_digest_sent TIMESTAMPTZ;

-- Create index for efficient digest query
CREATE INDEX IF NOT EXISTS idx_notification_preferences_digest 
ON notification_preferences(digest_enabled, digest_frequency, digest_time) 
WHERE digest_enabled = true;

-- Add comment explaining digest_day_of_week (0 = Sunday, 6 = Saturday)
COMMENT ON COLUMN notification_preferences.digest_day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';
