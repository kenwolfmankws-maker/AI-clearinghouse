import { supabase } from './supabase';
import { 
  welcomeEmail, 
  paymentConfirmationEmail, 
  tierUpgradeEmail,
  apiKeyGeneratedEmail,
  scheduledReportEmail,
  organizationInvitationEmail,
  twoFactorReminderEmail

} from './emailTemplates';



export const sendWelcomeEmail = async (email: string, name?: string, tier?: string) => {
  try {
    const html = welcomeEmail({ email, name, tier });
    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: 'Welcome to AI Clearinghouse!', 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

export const sendPaymentConfirmation = async (
  email: string, 
  amount: string, 
  tier: string, 
  invoiceId: string, 
  receiptUrl?: string
) => {
  try {
    const html = paymentConfirmationEmail({
      amount,
      tier,
      invoiceId,
      date: new Date().toLocaleDateString(),
      receiptUrl
    });
    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: 'Payment Confirmation - AI Clearinghouse', 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send payment confirmation:', error);
  }
};

export const sendTierUpgradeNotification = async (email: string, tier: string) => {
  const benefits = tier === 'pro' 
    ? [
        '10,000 API calls per month',
        'Priority email support',
        'Advanced analytics dashboard',
        'Custom integration assistance'
      ]
    : [
        'Unlimited API calls',
        'Dedicated account manager',
        '99.9% SLA guarantee',
        'Custom deployment options',
        'White-label capabilities'
      ];

  try {
    const html = tierUpgradeEmail({ tier: tier.toUpperCase(), benefits });
    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: `Welcome to ${tier.toUpperCase()} Tier!`, 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send tier upgrade email:', error);
  }
};

export const sendApiKeyAlert = async (
  email: string, 
  keyName: string, 
  tier: string
) => {
  try {
    const html = apiKeyGeneratedEmail({
      keyName,
      date: new Date().toLocaleString(),
      tier
    });
    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: 'New API Key Generated - AI Clearinghouse', 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send API key alert:', error);
  }
};


export const sendScheduledReport = async (
  email: string,
  reportName: string,
  dateRange: string,
  logs: any[]
) => {
  try {
    const totalCalls = logs.length;
    const successCalls = logs.filter(l => l.status === 'success').length;
    const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : '0';
    const totalCost = logs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0).toFixed(4);

    const html = scheduledReportEmail({
      reportName,
      dateRange,
      totalCalls,
      successRate,
      totalCost
    });

    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: `${reportName} - AI Clearinghouse`, 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send scheduled report:', error);
  }
};

export const sendOrganizationInvitation = async (
  email: string,
  organizationName: string,
  inviterName: string,
  role: string,
  invitationUrl: string,
  expiresAt: Date,
  customMessage?: string
) => {

  try {
    const html = organizationInvitationEmail({
      organizationName,
      inviterName,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      invitationUrl,
      expiresAt: expiresAt.toLocaleString(),
      customMessage
    });

    
    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: `Invitation to join ${organizationName} on AI Clearinghouse`, 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send organization invitation:', error);
    throw error;
  }
};


export const sendTwoFactorReminder = async (
  email: string,
  userName: string | undefined,
  daysRemaining: number,
  organizationName: string,
  gracePeriodEndsAt: Date
) => {
  try {
    const setupUrl = `${window.location.origin}/profile?tab=security&setup2fa=true`;
    const html = twoFactorReminderEmail({
      userName,
      daysRemaining,
      setupUrl,
      organizationName,
      gracePeriodEndsAt: gracePeriodEndsAt.toLocaleString()
    });

    await supabase.functions.invoke('send-email', {
      body: { 
        to: email, 
        subject: `Action Required: Enable 2FA - ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} Remaining`, 
        html 
      }
    });
  } catch (error) {
    console.error('Failed to send 2FA reminder:', error);
    throw error;
  }
};
