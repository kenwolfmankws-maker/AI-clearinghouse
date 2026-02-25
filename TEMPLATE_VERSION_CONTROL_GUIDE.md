# Report Template Version Control Guide

## Overview
The AI Clearinghouse now includes comprehensive version control for report templates, allowing you to track changes, view history, compare versions, and restore previous configurations.

## Features

### 1. Automatic Version Tracking
- Every time a template is updated, the previous version is automatically saved
- Versions are numbered sequentially (v1, v2, v3, etc.)
- Tracks who made changes and when
- Only tracks meaningful changes (not every save)

### 2. Version History UI
- Click the History icon (clock) on any template card
- View all previous versions in chronological order
- See version number, timestamp, and configuration summary
- Compare metrics, date ranges, and other settings

### 3. Diff View
- Click "View" on any version to see detailed changes
- Side-by-side comparison of old vs. new values
- Color-coded differences (red for old, green for new)
- Shows changes in:
  - Template name
  - Description
  - Date range
  - Email subject
  - Timezone
  - Selected metrics

### 4. Restore Functionality
- Click "Restore" on any version to revert to that configuration
- Creates a new version when restoring (maintains audit trail)
- Confirmation toast shows successful restoration
- Template list updates immediately

## Database Setup

### Quick Setup
Run this SQL in your Supabase SQL Editor:

```sql
-- See DATABASE_TEMPLATE_VERSION_SETUP.sql for complete schema
```

Or use the Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of DATABASE_TEMPLATE_VERSION_SETUP.sql
3. Click "Run"

### What Gets Created
- `template_versions` table for storing version history
- Automatic trigger that creates versions on template updates
- Row Level Security policies for organization isolation
- Indexes for fast version queries

## Usage Guide

### Viewing Version History
1. Navigate to Analytics → Scheduled Reports → Templates tab
2. Find the template you want to review
3. Click the History icon (clock)
4. Browse through all previous versions

### Comparing Versions
1. Open version history for a template
2. Click "View" on any version
3. See side-by-side comparison with current version
4. Red boxes show old values, green boxes show new values

### Restoring a Previous Version
1. Open version history
2. Find the version you want to restore
3. Click "Restore" button
4. Confirm the restoration
5. Template is immediately updated

### Understanding Version Numbers
- v1: First saved version after initial creation
- v2, v3, etc.: Subsequent updates
- Current version: The active template (not in version history)

## Tracked Changes

The system tracks changes to these fields:
- Template name
- Description
- Date range (7/30/90 days)
- Selected metrics
- Email subject line
- Timezone

Changes to these fields trigger version creation:
- Frequency (daily/weekly/monthly)
- Format (Excel/CSV)

## Best Practices

### For Admins
1. **Review before major changes**: Check version history before making significant updates
2. **Use descriptive names**: Clear template names help identify versions
3. **Test after restore**: Verify template works as expected after restoration
4. **Regular audits**: Periodically review version history for compliance

### For Teams
1. **Coordinate changes**: Communicate with team before updating shared templates
2. **Document reasons**: Add notes about why changes were made
3. **Keep history clean**: Avoid unnecessary saves that create version clutter

## Audit Trail

### What's Tracked
- User who made the change (created_by field)
- Exact timestamp of change
- Complete snapshot of template configuration
- Change summary (automatically generated)

### Compliance Benefits
- Full audit trail for regulatory requirements
- Track who modified critical report configurations
- Restore capability for incident response
- Historical record for analysis

## Troubleshooting

### Version Not Created
- Check if you actually changed a tracked field
- Ensure you have proper permissions
- Verify database trigger is active

### Can't Restore Version
- Confirm you have edit permissions for the template
- System templates cannot be modified (clone them first)
- Check for database connection issues

### Missing Version History
- Versions only created after system setup
- Pre-existing templates won't have history until first update
- Check RLS policies if you can't see versions

## Integration with Other Features

### Works With
- Report Templates Library
- Scheduled Reports
- Template Analytics
- Audit Logging

### Future Enhancements
- Branch and merge capabilities
- Version comments/annotations
- Bulk restore operations
- Version comparison across templates

## API Access

If you need programmatic access to version history:

```typescript
// Get all versions for a template
const { data: versions } = await supabase
  .from('template_versions')
  .select('*')
  .eq('template_id', templateId)
  .order('version_number', { ascending: false });

// Get specific version
const { data: version } = await supabase
  .from('template_versions')
  .select('*')
  .eq('template_id', templateId)
  .eq('version_number', versionNumber)
  .single();
```

## Security

- Row Level Security ensures users only see versions from their organization
- Version creation requires template edit permissions
- Restore operations logged in audit trail
- Automatic cleanup of orphaned versions when templates deleted

## Support

For issues or questions:
1. Check this guide first
2. Review DATABASE_TEMPLATE_VERSION_SETUP.sql
3. Check Supabase logs for errors
4. Verify RLS policies are active
