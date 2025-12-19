const baseStyle = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AI Clearinghouse</h1>
      <p style="color: #e0e7ff; margin: 10px 0 0 0;">Your AI Model Marketplace</p>
    </div>
`;

const footer = `
    <div style="background: #f3f4f6; padding: 30px 20px; text-align: center; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 10px 0;">AI Clearinghouse - Compare and access AI models</p>
      <p style="margin: 0;">Questions? Contact support@aimarketplace.com</p>
    </div>
  </div>
`;

export const welcomeEmail = (data: { name?: string; email: string; tier?: string }) => `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to AI Clearinghouse!</h2>
    <p style="color: #4b5563; line-height: 1.6;">Hi ${data.name || 'there'},</p>
    <p style="color: #4b5563; line-height: 1.6;">Thank you for joining! You now have access to compare and integrate with leading AI models.</p>
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 10px 0;">Your Account</h3>
      <p style="color: #4b5563; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="color: #4b5563; margin: 5px 0;"><strong>Tier:</strong> ${data.tier || 'Free'}</p>
    </div>
    <a href="${window.location.origin}/profile" style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
  </div>
${footer}
`;

export const paymentConfirmationEmail = (data: { amount: string; tier: string; invoiceId: string; date: string; receiptUrl?: string }) => `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">✓ Payment Confirmed!</h2>
    <p style="color: #4b5563; line-height: 1.6;">Thank you for your payment. Your transaction has been processed successfully.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">Transaction Details</h3>
      <table style="width: 100%; color: #4b5563;">
        <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td style="text-align: right;">$${data.amount}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Plan:</strong></td><td style="text-align: right;">${data.tier} Tier</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Invoice:</strong></td><td style="text-align: right;">${data.invoiceId}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="text-align: right;">${data.date}</td></tr>
      </table>
    </div>
    ${data.receiptUrl ? `<a href="${data.receiptUrl}" style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">View Receipt</a>` : ''}
  </div>
${footer}
`;

export const tierUpgradeEmail = (data: { tier: string; benefits: string[] }) => `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">🎉 Tier Upgraded!</h2>
    <p style="color: #4b5563; line-height: 1.6;">Congratulations! Your account has been upgraded to <strong>${data.tier}</strong> tier.</p>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 20px 0; color: #ffffff;">
      <h3 style="margin: 0 0 15px 0;">Your New Benefits</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${data.benefits.map(b => `<li style="padding: 8px 0;">✓ ${b}</li>`).join('')}
      </ul>
    </div>
    <a href="${window.location.origin}/profile" style="display: inline-block; background: #ffffff; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Start Using Features</a>
  </div>
${footer}
`;

export const apiKeyGeneratedEmail = (data: { keyName?: string; date: string; tier: string }) => `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">New API Key Generated</h2>
    <p style="color: #4b5563; line-height: 1.6;">A new API key has been generated for your account.</p>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0; font-weight: 600;">⚠️ Security Alert</p>
      <p style="color: #92400e; margin: 10px 0 0 0;">If you didn't generate this key, secure your account immediately.</p>
    </div>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="color: #4b5563; margin: 0 0 10px 0;"><strong>Key Name:</strong> ${data.keyName || 'Unnamed Key'}</p>
      <p style="color: #4b5563; margin: 0 0 10px 0;"><strong>Generated:</strong> ${data.date}</p>
      <p style="color: #4b5563; margin: 0;"><strong>Tier:</strong> ${data.tier}</p>
    </div>
    <a href="${window.location.origin}/profile" style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Manage API Keys</a>
  </div>
${footer}
`;

export const scheduledReportEmail = (data: { 
  reportName: string; 
  dateRange: string; 
  totalCalls: number; 
  successRate: string; 
  totalCost: string;
  reportUrl?: string;
}) => `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">📊 ${data.reportName}</h2>
    <p style="color: #4b5563; line-height: 1.6;">Here's your scheduled analytics report for ${data.dateRange}.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">Summary Statistics</h3>
      <table style="width: 100%; color: #4b5563;">
        <tr><td style="padding: 8px 0;"><strong>Total API Calls:</strong></td><td style="text-align: right;">${data.totalCalls}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Success Rate:</strong></td><td style="text-align: right;">${data.successRate}%</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Total Cost:</strong></td><td style="text-align: right;">$${data.totalCost}</td></tr>
      </table>
    </div>
    ${data.reportUrl ? `<a href="${data.reportUrl}" style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Download Full Report</a>` : ''}
  </div>
${footer}
`;

export const organizationInvitationEmail = (data: {
  organizationName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  expiresAt: string;
  customMessage?: string;
}) => `

${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">You've Been Invited!</h2>
    <p style="color: #4b5563; line-height: 1.6;">${data.inviterName} has invited you to join <strong>${data.organizationName}</strong> on AI Clearinghouse.</p>
    ${data.customMessage ? `
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0;">Personal Message</h3>
      <p style="color: #1e3a8a; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.customMessage}</p>
    </div>
    ` : ''}
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 10px 0;">Invitation Details</h3>
      <p style="color: #4b5563; margin: 5px 0;"><strong>Organization:</strong> ${data.organizationName}</p>
      <p style="color: #4b5563; margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
      <p style="color: #4b5563; margin: 5px 0;"><strong>Expires:</strong> ${data.expiresAt}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">Click the button below to accept this invitation and join the team.</p>

    <a href="${data.invitationUrl}" style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Accept Invitation</a>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">This invitation will expire on ${data.expiresAt}. If you don't want to join, you can ignore this email.</p>
  </div>
${footer}
`;


export const twoFactorReminderEmail = (data: {
  userName?: string;
  daysRemaining: number;
  setupUrl: string;
  organizationName: string;
  gracePeriodEndsAt: string;
}) => {
  const urgencyColor = data.daysRemaining <= 1 ? '#dc2626' : data.daysRemaining <= 3 ? '#f59e0b' : '#667eea';
  const urgencyBg = data.daysRemaining <= 1 ? '#fee2e2' : data.daysRemaining <= 3 ? '#fef3c7' : '#eff6ff';
  
  return `
${baseStyle}
  <div style="padding: 40px 20px;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Action Required: Enable Two-Factor Authentication</h2>
    <p style="color: #4b5563; line-height: 1.6;">Hi ${data.userName || 'there'},</p>
    <p style="color: #4b5563; line-height: 1.6;">Your organization <strong>${data.organizationName}</strong> requires all members to enable two-factor authentication (2FA) for enhanced security.</p>
    
    <div style="background: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 48px; font-weight: bold; color: ${urgencyColor}; margin-bottom: 10px;">${data.daysRemaining}</div>
      <p style="color: ${urgencyColor}; margin: 0; font-weight: 600; font-size: 18px;">${data.daysRemaining === 1 ? 'Day' : 'Days'} Remaining</p>
      <p style="color: #4b5563; margin: 10px 0 0 0; font-size: 14px;">Grace period ends: ${data.gracePeriodEndsAt}</p>
    </div>

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">Why 2FA?</h3>
      <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Protects your account from unauthorized access</li>
        <li>Adds an extra layer of security beyond passwords</li>
        <li>Keeps your organization's data safe</li>
        <li>Industry best practice for security compliance</li>
      </ul>
    </div>

    <p style="color: #4b5563; line-height: 1.6;">Setting up 2FA takes less than 2 minutes. Click the button below to get started:</p>
    
    <a href="${data.setupUrl}" style="display: inline-block; background: ${urgencyColor}; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0;">Enable 2FA Now</a>
    
    ${data.daysRemaining <= 1 ? `
    <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="color: #991b1b; margin: 0; font-weight: 600;">⚠️ Final Reminder</p>
      <p style="color: #991b1b; margin: 10px 0 0 0;">After the grace period expires, you will lose access to ${data.organizationName} until you enable 2FA.</p>
    </div>
    ` : ''}
    
    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Need help? Contact your organization administrator or visit our support documentation.</p>
  </div>
${footer}
`;
};
