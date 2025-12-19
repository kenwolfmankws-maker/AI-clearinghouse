import { supabase } from './supabase';

export type AuditActionType = 
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.shared'
  | 'collection.created'
  | 'collection.updated'
  | 'collection.deleted'
  | 'collection.shared'
  | 'organization.created'
  | 'organization.updated'
  | 'member.invited'
  | 'member.role_changed'
  | 'member.removed'
  | 'profile.updated';

interface LogAuditEventParams {
  actionType: AuditActionType;
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent({
  actionType,
  actionDetails,
  resourceType,
  resourceId,
  metadata = {}
}: LogAuditEventParams) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke('log-audit-event', {
      body: {
        action_type: actionType,
        action_details: actionDetails,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
