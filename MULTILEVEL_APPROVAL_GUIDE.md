# Multi-Level Approval Workflow Guide

## Overview
The multi-level approval workflow system allows template changes to require approval from multiple approvers in sequence (e.g., manager → director → executive). It includes approval chains, escalation rules, and delegation capabilities.

## Database Setup

### 1. Run the SQL Setup
```sql
-- Run this file to set up multi-level approval tables
psql your_database < DATABASE_MULTILEVEL_APPROVAL_SETUP.sql
```

This creates:
- `approval_chains` - Define multi-level approval workflows
- `approval_levels` - Individual levels within each chain
- `level_approvers` - Approvers assigned to each level
- `approval_delegations` - Temporary delegation of approval authority
- `approval_escalations` - Track escalated approvals

### 2. Configure Approval Chains

Create approval chains for different scenarios:

```sql
-- Example: Two-level approval (Manager → Director)
INSERT INTO approval_chains (name, description, organization_id) 
VALUES ('Standard Two-Level', 'Manager approval followed by director', 'org-uuid');

-- Add levels
INSERT INTO approval_levels (chain_id, level_number, level_name, required_approvers, escalation_hours)
VALUES 
  ('chain-uuid', 1, 'Manager Review', 1, 24),
  ('chain-uuid', 2, 'Director Approval', 1, 48);

-- Assign approvers to each level
INSERT INTO level_approvers (level_id, approver_id)
VALUES 
  ('level1-uuid', 'manager-user-id'),
  ('level2-uuid', 'director-user-id');
```

## Features

### 1. Sequential Approvals
- Changes progress through multiple approval levels
- Each level must be approved before moving to the next
- Visual progress indicator shows current status

### 2. Escalation Rules
- Automatic escalation after configured timeout period
- Manual escalation by approvers
- Escalation notifications to next level
- Tracked in `approval_escalations` table

### 3. Approval Delegation
- Approvers can delegate authority temporarily
- Date-based delegation (start/end dates)
- Delegates receive approval requests during delegation period
- Automatic deactivation after end date

### 4. Approval Chain Progress
- Visual timeline showing all approval levels
- Status indicators (pending, approved, current, escalated)
- Approver names and approval timestamps
- Real-time updates as approvals progress

## Using the Components

### ApprovalChainProgress
Shows visual progress through approval chain:

```tsx
import { ApprovalChainProgress } from '@/components/ApprovalChainProgress';

<ApprovalChainProgress
  levels={[
    { level_number: 1, level_name: 'Manager Review', status: 'approved', approved_by: 'John Doe' },
    { level_number: 2, level_name: 'Director Approval', status: 'current', approver_names: ['Jane Smith'] },
    { level_number: 3, level_name: 'Executive Sign-off', status: 'pending' }
  ]}
  currentLevel={2}
  escalated={false}
/>
```

### ApprovalDelegation
Manage approval delegations:

```tsx
import { ApprovalDelegation } from '@/components/ApprovalDelegation';

<ApprovalDelegation />
```

## Workflow Process

### 1. Template Change Submitted
```typescript
// Change request created with approval chain
const { data } = await supabase.from('template_change_requests').insert({
  template_id: 'template-uuid',
  change_type: 'update',
  current_approval_level: 1,
  total_approval_levels: 3,
  // ... other fields
});
```

### 2. Level 1 Approval
- Level 1 approvers notified
- Approver reviews and approves/rejects
- If approved, moves to level 2
- If rejected, change request closed

### 3. Subsequent Levels
- Process repeats for each level
- Each approval advances to next level
- Final level approval applies changes

### 4. Escalation (if needed)
```typescript
// Manual escalation
await supabase.from('approval_escalations').insert({
  change_request_id: 'request-uuid',
  from_level: 1,
  to_level: 2,
  escalation_reason: 'Urgent change required',
  escalated_by: userId
});

// Update change request
await supabase.from('template_change_requests')
  .update({ 
    current_approval_level: 2,
    escalated: true 
  })
  .eq('id', 'request-uuid');
```

## Best Practices

### 1. Chain Design
- Keep chains simple (2-3 levels maximum)
- Assign backup approvers for each level
- Set realistic escalation timeframes
- Document approval authority clearly

### 2. Delegation Management
- Set up delegations before absence
- Notify delegates of their responsibilities
- Review and remove expired delegations
- Use specific date ranges

### 3. Escalation Rules
- Configure appropriate timeout periods
- Define clear escalation criteria
- Notify all parties of escalations
- Track escalation reasons

### 4. Monitoring
- Review pending approvals regularly
- Monitor escalation frequency
- Track approval times by level
- Identify bottlenecks

## Security Considerations

### Row Level Security (RLS)
All tables have RLS policies:
- Users can only view chains in their organization
- Only assigned approvers can approve at their level
- Delegations are private to delegator and delegate
- Escalations are tracked in audit logs

### Permission Checks
```typescript
// Check if user can approve at current level
const canApprove = await supabase.rpc('is_approver_at_level', {
  p_change_request_id: requestId,
  p_user_id: userId
});
```

## Troubleshooting

### Approval Stuck at Level
1. Check if approvers are assigned to the level
2. Verify approvers have active accounts
3. Check for active delegations
4. Consider manual escalation

### Delegation Not Working
1. Verify date range is current
2. Check delegation is marked active
3. Ensure delegate has approver role
4. Verify RLS policies

### Escalation Not Triggering
1. Check escalation_hours configuration
2. Verify escalation trigger/cron job
3. Review escalation logs
4. Check notification delivery

## Integration with Existing Systems

### Audit Logs
All approval actions are logged:
```typescript
await supabase.from('audit_logs').insert({
  action: 'template_approval_level_completed',
  resource_type: 'template_change_request',
  resource_id: requestId,
  details: { level: 2, approver: userId }
});
```

### Notifications
Approvers are notified at each level:
```typescript
await supabase.from('notifications').insert({
  user_id: approverId,
  type: 'approval_required',
  title: 'Template Change Awaiting Your Approval',
  message: `Level ${level} approval required for ${templateName}`
});
```

## API Reference

### Database Functions

#### is_approver_at_level
Checks if user can approve at current level (including delegates):
```sql
SELECT is_approver_at_level('request-uuid', 'user-uuid');
```

### Key Tables

#### approval_chains
- `id` - Chain identifier
- `name` - Chain name
- `description` - Chain description
- `organization_id` - Organization owner
- `is_active` - Active status

#### approval_levels
- `id` - Level identifier
- `chain_id` - Parent chain
- `level_number` - Sequential level number
- `level_name` - Display name
- `required_approvers` - Number of approvals needed
- `escalation_hours` - Hours before escalation

#### approval_delegations
- `id` - Delegation identifier
- `delegator_id` - Original approver
- `delegate_id` - Temporary approver
- `start_date` - Delegation start
- `end_date` - Delegation end
- `reason` - Delegation reason
- `is_active` - Active status
