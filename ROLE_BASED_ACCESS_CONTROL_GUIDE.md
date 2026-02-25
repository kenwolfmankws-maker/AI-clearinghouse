# Role-Based Access Control (RBAC) Guide

## Overview
This guide explains how to manage admin users and implement role-based access control for the password reset admin dashboard.

## Admin Users Table

The `admin_users` table tracks users with administrative privileges:

```sql
- user_id: Reference to auth.users
- email: Admin user's email
- granted_by: User who granted admin access
- granted_at: Timestamp of when access was granted
- revoked_at: Timestamp of revocation (if applicable)
- is_active: Boolean indicating active status
- notes: Optional notes about the admin user
```

## Database Functions

### Check Admin Status
```sql
SELECT is_user_admin(auth.uid());
```

### Grant Admin Access
```sql
SELECT grant_admin_access(
  'user@example.com',
  'Reason for granting access'
);
```

### Revoke Admin Access
```sql
SELECT revoke_admin_access(
  'user-uuid-here',
  'Reason for revocation'
);
```

## Frontend Implementation

### useAdminCheck Hook
Use this hook to check if the current user is an admin:

```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

function MyComponent() {
  const { isAdmin, loading } = useAdminCheck();
  
  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/forbidden" />;
  
  return <div>Admin content</div>;
}
```

### Protecting Routes
The PasswordResetAdmin page automatically redirects non-admin users to `/forbidden`.

## Admin Management Interface

Access the admin management interface at `/admin/password-reset` (requires admin privileges).

### Features:
- **Grant Admin Access**: Add new administrators by email
- **View Admin Users**: See all current and past administrators
- **Revoke Access**: Remove admin privileges from users
- **Audit Trail**: Track who granted/revoked access and when

## Security Features

1. **Row Level Security (RLS)**: Only admins can view/modify admin_users table
2. **Self-Revocation Prevention**: Admins cannot revoke their own access
3. **Audit Logging**: All admin actions are logged in admin_action_log table
4. **Server-Side Validation**: All checks performed via Supabase functions

## Initial Admin Setup

To create the first admin user, you'll need to manually insert a record:

```sql
INSERT INTO admin_users (user_id, email, is_active, notes)
VALUES (
  'your-user-uuid',
  'your-email@example.com',
  true,
  'Initial admin user'
);
```

Get your user UUID from the Supabase Auth dashboard or by running:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## Best Practices

1. **Minimum Privilege**: Only grant admin access when necessary
2. **Regular Audits**: Review admin users periodically
3. **Document Changes**: Always include notes when granting/revoking access
4. **Multiple Admins**: Maintain at least 2 active admins to prevent lockout
5. **Monitor Activity**: Review admin_action_log regularly for suspicious activity

## Audit Log

The `admin_action_log` table tracks all administrative actions:
- Admin user who performed the action
- Action type (grant, revoke, etc.)
- Target user affected
- Timestamp and IP address
- Additional details in JSONB format

Query recent admin actions:
```sql
SELECT * FROM admin_action_log
ORDER BY created_at DESC
LIMIT 50;
```
