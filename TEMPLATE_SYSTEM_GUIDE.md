# Report Templates Library Guide

## Overview
The Report Templates Library allows admins to save, reuse, and manage common report configurations. This feature includes pre-built system templates and the ability to create custom templates.

## Pre-Built System Templates

### 1. Weekly Executive Summary
- **Frequency**: Weekly
- **Format**: Excel
- **Date Range**: Last 7 days
- **Metrics**: Total Usage, Success Rate, Avg Response Time, Top Models, Cost Analysis
- **Purpose**: High-level overview for executives

### 2. Monthly Team Performance
- **Frequency**: Monthly
- **Format**: Excel
- **Date Range**: Last 30 days
- **Metrics**: Total Usage, Success Rate, Avg Response Time, Top Models, Cost Analysis, User Activity, Error Rate
- **Purpose**: Detailed team performance tracking

### 3. Quarterly Analysis
- **Frequency**: Monthly
- **Format**: Excel
- **Date Range**: Last 90 days
- **Metrics**: All available metrics
- **Purpose**: Comprehensive quarterly business review

## Using Templates

### Creating a Report from a Template
1. Navigate to Analytics → Scheduled Reports
2. Click the "Templates" tab
3. Find the template you want to use
4. Click "Use" button
5. The form will pre-fill with template settings
6. Add recipients and customize if needed
7. Click "Create Report"

### Cloning Templates
1. Go to the Templates tab
2. Click the Clone icon on any template
3. A copy will be created with "(Copy)" appended
4. Edit the cloned template as needed

### Creating Custom Templates
1. Click "New Template" in the Templates tab
2. Configure:
   - Template Name
   - Description
   - Frequency (Daily/Weekly/Monthly)
   - Format (Excel/CSV)
   - Date Range (7/30/90 days)
   - Metrics to include
   - Email subject line
   - Timezone
3. Click "Save Template"

### Editing Templates
- System templates cannot be edited (clone them instead)
- Custom templates can be edited by clicking the Edit icon
- Changes apply to future scheduled reports only

### Deleting Templates
- Only custom templates can be deleted
- System templates are permanent
- Deleting a template doesn't affect existing scheduled reports

## Template Configuration Options

### Frequency Options
- **Daily**: Report sent every day
- **Weekly**: Report sent once per week
- **Monthly**: Report sent once per month

### Format Options
- **Excel**: Formatted spreadsheet with multiple sheets
- **CSV**: Simple comma-separated values file

### Date Range Options
- **7 days**: Last week of data
- **30 days**: Last month of data
- **90 days**: Last quarter of data

### Available Metrics
- Total Usage
- Success Rate
- Average Response Time
- Top Models
- Cost Analysis
- User Activity
- Error Rate
- Peak Usage Times
- Model Comparison

## Best Practices

### Template Naming
- Use descriptive names that indicate purpose
- Include frequency in the name (e.g., "Weekly Sales Report")
- Avoid generic names like "Report 1"

### Template Organization
- Create templates for recurring report needs
- Clone and customize system templates for specific use cases
- Delete unused custom templates to keep the library clean

### When to Use Templates
- **Use Templates**: For recurring reports with consistent metrics
- **Create Custom**: When you need the same configuration multiple times
- **Clone System Templates**: To customize pre-built configurations

## Database Schema

```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  frequency VARCHAR(20),
  format VARCHAR(10),
  date_range INTEGER,
  metrics JSONB,
  email_subject VARCHAR(500),
  timezone VARCHAR(100),
  created_by UUID,
  organization_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Troubleshooting

### Template Not Loading
- Refresh the page
- Check browser console for errors
- Verify database connection

### Can't Edit Template
- System templates cannot be edited
- Clone the template and edit the copy

### Template Missing Metrics
- Edit the template
- Select additional metrics from the list
- Save changes

## Future Enhancements
- Template sharing between organizations
- Template versioning
- Template categories/tags
- Template usage analytics
- Import/export templates
