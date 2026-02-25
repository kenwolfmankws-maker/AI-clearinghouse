# Bulk Invitation System Guide

## Overview
The bulk invitation system allows organization admins to invite multiple team members at once using CSV file upload or by pasting multiple email addresses.

## Features

### 1. CSV File Upload
- Upload a CSV file containing email addresses
- Automatically extracts emails from any column
- Handles various CSV formats

### 2. Text Input
- Paste multiple emails separated by:
  - Commas (email1@example.com, email2@example.com)
  - Semicolons (email1@example.com; email2@example.com)
  - New lines (one email per line)

### 3. Email Parsing
- Automatically removes duplicates
- Validates email format
- Shows preview of parsed emails

### 4. Bulk Processing
- Set default role for all invitations (admin, member, viewer)
- Send all invitations in a single action
- Real-time progress tracking
- Success/failure reporting for each email

## Usage

### For Admins

1. **Navigate to Organization Page**
   - Go to the Members tab
   - Click "Bulk Invite" button

2. **Upload CSV or Paste Emails**
   - Option 1: Click "Choose CSV File" and select your file
   - Option 2: Paste emails in the text area

3. **Parse Emails**
   - Click "Parse Emails" to extract and validate addresses
   - Review the list of parsed emails

4. **Select Role**
   - Choose the default role for all invitations
   - Options: Admin, Member, or Viewer

5. **Send Invitations**
   - Click "Send X Invitations"
   - Monitor progress
   - Review results (successful and failed)

### CSV Format

Your CSV can be in any format as long as it contains email addresses:

```csv
name,email,department
John Doe,john@example.com,Engineering
Jane Smith,jane@example.com,Marketing
```

Or simple list:
```csv
john@example.com
jane@example.com
bob@example.com
```

## Implementation Details

### Files Created/Modified

1. **src/lib/invitationService.ts**
   - `createBulkInvitations()` - Processes multiple invitations
   - `parseEmailsFromText()` - Parses comma/semicolon/newline separated emails
   - `parseEmailsFromCSV()` - Extracts emails from CSV files

2. **src/components/BulkInviteModal.tsx**
   - Modal component for bulk invitation interface
   - CSV upload functionality
   - Email parsing and preview
   - Progress tracking and results display

3. **src/components/OrgMemberManagement.tsx**
   - Added "Bulk Invite" button
   - Integration with BulkInviteModal

### API Functions

```typescript
// Create multiple invitations
const results = await createBulkInvitations(
  organizationId,
  emails,
  role,
  organizationName,
  inviterName
);

// Parse emails from text
const emails = parseEmailsFromText("email1@test.com, email2@test.com");

// Parse emails from CSV file
const emails = await parseEmailsFromCSV(file);
```

## Error Handling

The system handles various error scenarios:
- Invalid email formats are filtered out
- Duplicate emails are removed automatically
- Failed invitations are reported with error messages
- Existing members are handled gracefully

## Best Practices

1. **CSV Preparation**
   - Ensure emails are valid
   - Remove any test/dummy addresses
   - Check for duplicates beforehand

2. **Role Assignment**
   - Start with "Viewer" for new team members
   - Upgrade to "Member" or "Admin" after onboarding
   - Review permissions regularly

3. **Invitation Management**
   - Monitor pending invitations
   - Resend expired invitations if needed
   - Cancel unused invitations to keep list clean

## Troubleshooting

### Emails Not Parsing
- Check for proper separators (comma, semicolon, newline)
- Ensure emails contain @ symbol
- Remove any extra spaces or special characters

### CSV Upload Fails
- Verify file is .csv format
- Check file size (should be reasonable)
- Ensure file contains valid email addresses

### Invitations Not Sending
- Verify you have admin permissions
- Check organization email settings
- Review error messages for specific issues

## Security Considerations

- Only admins can send bulk invitations
- Email validation prevents invalid addresses
- Rate limiting may apply for large batches
- All invitations are logged in audit trail
