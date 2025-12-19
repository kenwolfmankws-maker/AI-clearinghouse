import { supabase } from './supabase';
import { sendOrganizationInvitation } from './emailService';

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

const generateToken = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const createInvitation = async (
  organizationId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer',
  organizationName: string,
  inviterName: string,
  customMessage?: string,
  templateId?: string
) => {


  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const { data, error } = await supabase
    .from('organization_invitations')
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase(),
      role,
      invited_by: (await supabase.auth.getUser()).data.user?.id,
      token,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Track template usage if templateId provided
  if (templateId) {
    await supabase.from('invitation_template_usage').insert({
      template_id: templateId,
      organization_id: organizationId,
      invited_email: email.toLowerCase(),
      status: 'pending'
    });
  }

  const invitationUrl = `${window.location.origin}/invite/${token}`;
  await sendOrganizationInvitation(email, organizationName, inviterName, role, invitationUrl, expiresAt, customMessage);

  return data;

};


export const getInvitationByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('organization_invitations')
    .select('*, organizations(name)')
    .eq('token', token)
    .single();

  if (error) throw error;
  return data;
};

export const acceptInvitation = async (token: string) => {
  const invitation = await getInvitationByToken(token);
  
  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('organization_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    throw new Error('Invitation has expired');
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Must be logged in to accept invitation');

  // Add user to organization
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role
    });

  if (memberError) throw memberError;

  // Update invitation status
  const acceptedAt = new Date().toISOString();
  await supabase
    .from('organization_invitations')
    .update({ status: 'accepted', accepted_at: acceptedAt })
    .eq('id', invitation.id);

  // Update template usage tracking if this invitation was sent with a template
  await supabase
    .from('invitation_template_usage')
    .update({ 
      status: 'accepted',
      accepted_at: acceptedAt
    })
    .eq('invited_email', invitation.email.toLowerCase())
    .eq('organization_id', invitation.organization_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  return invitation;
};

export const declineInvitation = async (token: string) => {
  const invitation = await getInvitationByToken(token);
  
  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'declined' })
    .eq('token', token)
    .eq('status', 'pending');

  if (error) throw error;

  // Update template usage tracking if this invitation was sent with a template
  await supabase
    .from('invitation_template_usage')
    .update({ status: 'declined' })
    .eq('invited_email', invitation.email.toLowerCase())
    .eq('organization_id', invitation.organization_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);
};

export const cancelInvitation = async (invitationId: string) => {

  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('status', 'pending');

  if (error) throw error;
};

export const resendInvitation = async (invitationId: string) => {
  const { data: invitation, error } = await supabase
    .from('organization_invitations')
    .select('*, organizations(name)')
    .eq('id', invitationId)
    .single();

  if (error) throw error;

  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await supabase
    .from('organization_invitations')
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq('id', invitationId);

  const user = (await supabase.auth.getUser()).data.user;
  const invitationUrl = `${window.location.origin}/invite/${invitation.token}`;
  
  await sendOrganizationInvitation(
    invitation.email,
    invitation.organizations.name,
    user?.user_metadata?.full_name || user?.email || 'Team member',
    invitation.role,
    invitationUrl,
    newExpiresAt
  );
};


export interface BulkInvitationResult {
  email: string;
  success: boolean;
  error?: string;
}

export const createBulkInvitations = async (
  organizationId: string,
  emails: string[],
  role: 'admin' | 'member' | 'viewer',
  organizationName: string,
  inviterName: string,
  customMessage?: string,
  templateId?: string
): Promise<BulkInvitationResult[]> => {

  const results: BulkInvitationResult[] = [];
  
  for (const email of emails) {
    try {
      await createInvitation(
        organizationId, 
        email.trim().toLowerCase(), 
        role, 
        organizationName, 
        inviterName, 
        customMessage,
        templateId
      );

      results.push({ email, success: true });
    } catch (error: any) {
      results.push({ email, success: false, error: error.message });
    }
  }
  
  return results;
};


export const parseEmailsFromText = (text: string): string[] => {
  // Split by comma, semicolon, or newline
  const emails = text
    .split(/[,;\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0 && e.includes('@'));
  
  // Remove duplicates
  return [...new Set(emails)];
};

export const parseEmailsFromCSV = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const emails: string[] = [];
      
      lines.forEach(line => {
        // Try to find email in the line (handles CSV with multiple columns)
        const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          emails.push(emailMatch[0]);
        }
      });
      
      // Remove duplicates
      resolve([...new Set(emails)]);
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
