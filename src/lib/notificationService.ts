import { supabase } from './supabase';

export type NotificationType = 
  | 'usage_alert' 
  | 'rate_limit' 
  | 'payment' 
  | 'tier_upgrade' 
  | 'api_key' 
  | 'api_key_revoked'
  | 'failed_login'
  | 'role_changed'
  | 'org_invite'
  | 'general';

async function checkNotificationPreference(userId: string, eventType: string): Promise<boolean> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .single();
  
  return data?.enabled !== false; // Default to true if not set
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) {
  // Check if user has enabled notifications for this event type
  const shouldNotify = await checkNotificationPreference(userId, type);
  if (!shouldNotify) {
    return; // User has disabled this notification type
  }

  try {
    const { error } = await supabase.functions.invoke('create-notification', {
      body: {
        userId,
        type,
        title,
        message,
        data: data || {}
      }
    });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function notifyUsageMilestone(userId: string, usageCount: number) {
  await createNotification(
    userId,
    'usage_alert',
    'API Usage Milestone',
    `Your API key has reached ${usageCount.toLocaleString()} calls!`,
    { usageCount }
  );
}

export async function notifyRateLimitWarning(userId: string, usage: number, limit: number) {
  const percentage = Math.round((usage / limit) * 100);
  await createNotification(
    userId,
    'rate_limit',
    'Rate Limit Warning',
    `You've used ${usage} of ${limit} daily requests (${percentage}%). Consider upgrading.`,
    { usage, limit, percentage }
  );
}

export async function notifyPaymentSuccess(userId: string, amount: number, tier: string) {
  await createNotification(
    userId,
    'payment',
    'Payment Successful',
    `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
    { amount, tier }
  );
}

export async function notifyTierUpgrade(userId: string, tier: string) {
  await createNotification(
    userId,
    'tier_upgrade',
    'Tier Upgraded',
    `Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier! Enjoy your new features.`,
    { tier }
  );
}

export async function notifyApiKeyCreated(userId: string, keyName: string, keyPrefix: string) {
  await createNotification(
    userId,
    'api_key',
    'New API Key Created',
    `API key "${keyName}" has been generated successfully. Keep it secure!`,
    { keyName, keyPrefix }
  );
}



export async function notifyApiKeyRevoked(userId: string, keyName: string) {
  await createNotification(
    userId,
    'api_key_revoked',
    '⚠️ API Key Revoked',
    `API key "${keyName}" has been revoked. If this wasn't you, please review your account security.`,
    { keyName }
  );
}

export async function notifyFailedLogin(userId: string, ipAddress: string, location?: string) {
  await createNotification(
    userId,
    'failed_login',
    '🚨 Failed Login Attempt',
    `A failed login attempt was detected from ${ipAddress}${location ? ` (${location})` : ''}. If this wasn't you, secure your account immediately.`,
    { ipAddress, location }
  );
}

export async function notifyRoleChanged(userId: string, oldRole: string, newRole: string, changedBy: string) {
  await createNotification(
    userId,
    'role_changed',
    'Role Changed',
    `Your role has been changed from ${oldRole} to ${newRole} by ${changedBy}.`,
    { oldRole, newRole, changedBy }
  );
}

export async function notifyOrgInvite(userId: string, orgName: string, invitedBy: string) {
  await createNotification(
    userId,
    'org_invite',
    'Organization Invitation',
    `You've been invited to join "${orgName}" by ${invitedBy}.`,
    { orgName, invitedBy }
  );
}
