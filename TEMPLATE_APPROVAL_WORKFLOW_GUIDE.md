# Report Template Approval Workflow System

## Overview
The approval workflow system ensures that changes to report templates are reviewed and approved by designated approvers before going live. This provides governance, quality control, and audit trails for all template modifications.

## Features
- **Approval Queue**: Pending changes visible to designated approvers
- **Review Interface**: Side-by-side comparison of original vs proposed changes
- **Approval/Rejection**: Approvers can approve or reject with comments
- **Automatic Rollback**: Rejected changes don't affect live templates
- **Audit Trail**: Complete history of all approval actions
- **Notifications**: Approvers notified when changes need review

## Setup Instructions

### 1. Run Database Setup
Execute the SQL in `DATABASE_TEMPLATE_APPROVAL_SETUP.sql` via Supabase SQL Editor:
```sql
-- Creates tables:
-- - template_approvers: Who can approve changes
-- - template_change_requests: Pending changes awaiting approval
-- - template_approval_history: Audit trail of all actions
```

### 2. Designate Approvers
Add users who can approve template changes:
```sql
INSERT INTO template_approvers (user_id, organization_id, created_by)
VALUES 
  ('user-uuid-here', 'org-uuid-here', 'admin-uuid-here');
```

## How It Works

### For Regular Users (Non-Approvers)
1. Edit a template in the Templates tab
2. Make desired changes
3. Click "Save Template"
4. Changes are submitted for approval (not applied immediately)
5. Toast notification: "Changes submitted for approval"
6. Template remains unchanged until approved

### For Approvers
1. Navigate to Analytics page → Scheduled Reports section
2. Click "Pending Approvals" tab
3. Review pending change requests
4. Click "Review Changes" on any request
5. Compare original vs proposed changes side-by-side
6. Add optional comment
7. Click "Approve" or "Reject"

### Approval Actions
- **Approve**: Changes are applied to the template immediately
- **Reject**: Changes are discarded, template remains unchanged
- Both actions are logged in approval history

## UI Components

### TemplateApprovalQueue
- Displays all pending change requests
- Shows requester, date, and template name
- "Review Changes" button opens comparison modal
- Approve/Reject actions with comment field

### ReportTemplateManager (Enhanced)
- Checks if user is an approver
- Non-approvers: Creates change request instead of direct update
- Approvers: Direct update (bypasses approval workflow)
- System templates: Always require approval

### ScheduledReports (Enhanced)
- New "Pending Approvals" tab
- Integrates TemplateApprovalQueue component
- Accessible from Analytics page

## Database Schema

### template_approvers
- `id`: UUID primary key
- `user_id`: User who can approve (references auth.users)
- `organization_id`: Optional org scope
- `created_at`: When approver was designated
- `created_by`: Who designated this approver

### template_change_requests
- `id`: UUID primary key
- `template_id`: Template being modified
- `change_type`: 'create', 'update', or 'delete'
- `requested_by`: User who submitted changes
- `status`: 'pending', 'approved', or 'rejected'
- `proposed_*`: New values for all template fields
- `original_data`: JSONB of original template (for rollback)
- `reviewed_by`: Approver who made decision
- `reviewer_comment`: Optional comment from approver

### template_approval_history
- `id`: UUID primary key
- `change_request_id`: Related change request
- `template_id`: Template affected
- `action`: 'submitted', 'approved', 'rejected', 'cancelled'
- `performed_by`: User who performed action
- `comment`: Optional comment
- `metadata`: Additional JSONB data

## Security (RLS Policies)

### template_approvers
- Users can view approvers in their organization
- Only admins can manage approvers

### template_change_requests
- Users can view requests they created or can approve
- Any authenticated user can create requests
- Only approvers can update (approve/reject)

### template_approval_history
- Users can view history for their own requests
- Approvers can view all history
- System can insert (for logging)

## Best Practices

1. **Designate Multiple Approvers**: Ensure coverage for approvals
2. **Add Comments**: Provide context when approving/rejecting
3. **Review Regularly**: Check pending approvals frequently
4. **Audit Trail**: Use approval history for compliance
5. **System Templates**: Always protect with approval workflow

## Integration with Existing Features

### Version Control
- Approved changes create new version automatically
- Version history shows approval metadata
- Can restore to any approved version

### Audit Logs
- All approval actions logged to audit system
- Tracks who approved/rejected and when
- Includes change details and comments

### Notifications
- Approvers notified when changes submitted
- Requesters notified of approval/rejection
- Integration with NotificationContext

## Troubleshooting

### Changes Not Requiring Approval
- Check if user is designated as approver
- System templates always require approval
- Verify RLS policies are enabled

### Can't See Pending Approvals
- Ensure user is in template_approvers table
- Check organization_id matches if org-scoped
- Verify RLS policies allow access

### Approval Not Applying Changes
- Check template_change_requests.status is 'approved'
- Verify proposed_* fields contain valid data
- Review error logs in browser console

## Future Enhancements
- Multi-level approval workflows
- Approval delegation
- Scheduled approval reminders
- Bulk approval actions
- Approval analytics dashboard
