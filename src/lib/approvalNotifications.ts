import { supabase } from './supabase';

export type ApprovalNotificationType = 
  | 'approval_request' 
  | 'approval_granted' 
  | 'approval_rejected' 
  | 'approval_escalated' 
  | 'delegation_activated'
  | 'delegation_received';

interface NotificationData {
  userId: string;
  type: ApprovalNotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
  emailEnabled?: boolean;
}

async function createNotification(notificationData: NotificationData) {
  const { userId, type, title, message, actionUrl, actionLabel, data, emailEnabled } = notificationData;
  
  // Check notification preferences
  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('in_app_enabled, email_enabled, digest_enabled')
    .eq('user_id', userId)
    .eq('event_type', type)
    .single();

  // Check digest settings
  const { data: digestPref } = await supabase
    .from('notification_preferences')
    .select('digest_enabled')
    .eq('user_id', userId)
    .eq('event_type', 'digest_settings')
    .single();
  
  // Create in-app notification if enabled (default to true if no preference set)
  const shouldCreateInApp = !pref || pref.in_app_enabled !== false;
  if (shouldCreateInApp) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        action_label: actionLabel,
        data: data || {}
      });
    
    if (error) console.error('Failed to create notification:', error);
  }
  
  // Send email if enabled and digest mode is disabled
  const digestEnabled = digestPref?.digest_enabled || false;
  const shouldSendEmail = emailEnabled && (!pref || pref.email_enabled !== false) && !digestEnabled;
  
  if (shouldSendEmail) {
    const { data: user } = await supabase.auth.getUser();
    
    if (user?.user?.email) {
      await supabase.functions.invoke('send-approval-notification', {
        body: {
          to: user.user.email,
          name: user.user.user_metadata?.full_name || user.user.email,
          title,
          message,
          actionUrl: actionUrl ? `${window.location.origin}${actionUrl}` : undefined,
          actionLabel
        }
      });
    }
  }
}


export async function notifyApprovalRequest(
  approverId: string,
  templateName: string,
  requesterName: string,
  requestId: string
) {
  await createNotification({
    userId: approverId,
    type: 'approval_request',
    title: 'New Approval Request',
    message: `${requesterName} submitted a change request for template "${templateName}"`,
    actionUrl: '/organization?tab=scheduled-reports&subtab=approvals',
    actionLabel: 'Review Request',
    data: { requestId, templateName, requesterName },
    emailEnabled: true
  });
}

export async function notifyApprovalGranted(
  requesterId: string,
  templateName: string,
  approverName: string,
  levelNumber: number
) {
  await createNotification({
    userId: requesterId,
    type: 'approval_granted',
    title: 'Approval Granted',
    message: `${approverName} approved your change request for "${templateName}" (Level ${levelNumber})`,
    actionUrl: '/organization?tab=scheduled-reports',
    actionLabel: 'View Template',
    data: { templateName, approverName, levelNumber },
    emailEnabled: true
  });
}

export async function notifyApprovalRejected(
  requesterId: string,
  templateName: string,
  approverName: string,
  reason?: string
) {
  await createNotification({
    userId: requesterId,
    type: 'approval_rejected',
    title: 'Approval Rejected',
    message: `${approverName} rejected your change request for "${templateName}". ${reason ? `Reason: ${reason}` : ''}`,
    actionUrl: '/organization?tab=scheduled-reports',
    actionLabel: 'View Details',
    data: { templateName, approverName, reason },
    emailEnabled: true
  });
}

export async function notifyEscalation(
  approverId: string,
  templateName: string,
  escalatedBy: string,
  reason: string,
  requestId: string
) {
  await createNotification({
    userId: approverId,
    type: 'approval_escalated',
    title: 'Urgent: Escalated Approval Request',
    message: `${escalatedBy} escalated a change request for "${templateName}". Reason: ${reason}`,
    actionUrl: '/organization?tab=scheduled-reports&subtab=approvals',
    actionLabel: 'Review Urgent Request',
    data: { requestId, templateName, escalatedBy, reason },
    emailEnabled: true
  });
}

export async function notifyDelegationActivated(
  delegatorId: string,
  delegateName: string,
  startDate: string,
  endDate: string
) {
  await createNotification({
    userId: delegatorId,
    type: 'delegation_activated',
    title: 'Delegation Activated',
    message: `Your approval authority has been delegated to ${delegateName} from ${startDate} to ${endDate}`,
    actionUrl: '/organization?tab=scheduled-reports&subtab=delegation',
    actionLabel: 'Manage Delegations',
    data: { delegateName, startDate, endDate },
    emailEnabled: true
  });
}

export async function notifyDelegationReceived(
  delegateId: string,
  delegatorName: string,
  startDate: string,
  endDate: string
) {
  await createNotification({
    userId: delegateId,
    type: 'delegation_received',
    title: 'Approval Authority Delegated',
    message: `${delegatorName} has delegated their approval authority to you from ${startDate} to ${endDate}`,
    actionUrl: '/organization?tab=scheduled-reports&subtab=approvals',
    actionLabel: 'View Pending Approvals',
    data: { delegatorName, startDate, endDate },
    emailEnabled: true
  });
}
