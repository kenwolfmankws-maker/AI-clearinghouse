interface TwoFactorReminderParams {
  userName: string;
  orgName: string;
  daysRemaining: number;
  setupUrl: string;
  gracePeriodDays: number;
}

export const twoFactorReminderEmail = ({
  userName,
  orgName,
  daysRemaining,
  setupUrl,
  gracePeriodDays
}: TwoFactorReminderParams): string => {
  const urgencyLevel = daysRemaining <= 1 ? 'critical' : daysRemaining <= 3 ? 'high' : 'medium';
  const urgencyColor = urgencyLevel === 'critical' ? '#dc2626' : urgencyLevel === 'high' ? '#ea580c' : '#f59e0b';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${urgencyColor} 0%, #991b1b 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 40px; color: white;">🔒</span>
                </div>
              </div>
              
              <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
                ${daysRemaining <= 1 ? '⚠️ Urgent: ' : ''}Two-Factor Authentication Required
              </h1>
              
              <div style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; text-align: center;">
                  ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining
                </p>
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                  to enable 2FA for ${orgName}
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0;">
                Hello ${userName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 16px 0;">
                This is a ${urgencyLevel === 'critical' ? '<strong>final</strong>' : ''} reminder that <strong>${orgName}</strong> requires all members to enable two-factor authentication (2FA) for enhanced security.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 16px 0;">
                You have <strong style="color: ${urgencyColor};">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong> remaining in your ${gracePeriodDays}-day grace period. After this period expires, you will lose access to the organization until 2FA is enabled.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Enable 2FA Now
                </a>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 24px 0;">
                <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                  Why 2FA is Important:
                </h3>
                <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Protects your account from unauthorized access</li>
                  <li>Adds an extra layer of security beyond passwords</li>
                  <li>Required for compliance and organizational security</li>
                  <li>Takes less than 2 minutes to set up</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have questions or need assistance, please contact your organization administrator.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This is an automated security reminder from ${orgName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
