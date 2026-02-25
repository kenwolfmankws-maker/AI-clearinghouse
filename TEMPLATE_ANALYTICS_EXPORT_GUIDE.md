# Template Analytics & Export Guide

## Overview
Track and analyze how report templates are being used across your organization to optimize reporting workflows.

## Analytics Features

### Template Usage Tracking
Every template interaction is automatically logged:
- **Created**: When a new template is created
- **Cloned**: When a template is duplicated
- **Used**: When a template is used to create a scheduled report
- **Edited**: When a template is modified
- **Deleted**: When a template is removed

### Template Popularity View
Access the `template_popularity` view to see:
- Total usage count per template
- Number of active reports using each template
- Last used timestamp
- System vs custom template breakdown

## Querying Template Analytics

### Most Popular Templates
```sql
SELECT * FROM template_popularity
ORDER BY usage_count DESC
LIMIT 10;
```

### Template Usage Over Time
```sql
SELECT 
  DATE_TRUNC('week', used_at) as week,
  COUNT(*) as usage_count
FROM template_usage_analytics
WHERE action = 'used'
GROUP BY week
ORDER BY week DESC;
```

### User Template Adoption
```sql
SELECT 
  u.email,
  COUNT(DISTINCT tua.template_id) as templates_used,
  COUNT(*) as total_uses
FROM template_usage_analytics tua
JOIN auth.users u ON tua.used_by = u.id
GROUP BY u.email
ORDER BY total_uses DESC;
```

## Exporting Analytics

### CSV Export
```sql
COPY (
  SELECT 
    rt.name as template_name,
    tua.action,
    tua.used_at,
    u.email as user_email
  FROM template_usage_analytics tua
  JOIN report_templates rt ON tua.template_id = rt.id
  JOIN auth.users u ON tua.used_by = u.id
  WHERE tua.used_at >= NOW() - INTERVAL '30 days'
  ORDER BY tua.used_at DESC
) TO '/tmp/template_analytics.csv' WITH CSV HEADER;
```

### Excel-Ready Format
Use the Supabase dashboard or API to export data:
```javascript
const { data } = await supabase
  .from('template_usage_analytics')
  .select(`
    *,
    template:report_templates(name, is_system),
    user:auth.users(email)
  `)
  .gte('used_at', '2024-01-01');
```

## Dashboard Metrics

### Key Performance Indicators
1. **Template Adoption Rate**: % of users using templates
2. **Average Templates per User**: Total uses / unique users
3. **System vs Custom Usage**: Ratio of system to custom template usage
4. **Template Efficiency**: Time saved using templates vs manual creation

### Recommended Reports
- Weekly template usage summary
- Monthly template popularity rankings
- Quarterly template ROI analysis
- User adoption trends

## Best Practices

### Analyzing Template Performance
1. Review usage patterns monthly
2. Identify underutilized templates for improvement or removal
3. Promote popular templates to system templates
4. Gather user feedback on template effectiveness

### Optimizing Template Library
- Archive templates with zero usage in 90 days
- Create new templates based on common custom configurations
- Update system templates based on usage patterns
- Provide training on most valuable templates

## API Integration

### Fetching Analytics via API
```javascript
// Get template popularity
const { data: popularity } = await supabase
  .from('template_popularity')
  .select('*')
  .order('usage_count', { ascending: false });

// Track custom event
const { data } = await supabase
  .from('template_usage_analytics')
  .insert({
    template_id: templateId,
    action: 'used',
    organization_id: orgId
  });
```

## Troubleshooting

### Missing Analytics Data
- Verify triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE 'track_template%';`
- Check RLS policies are not blocking inserts
- Ensure users have proper organization associations

### Slow Query Performance
- Add indexes on frequently queried columns
- Use date range filters in queries
- Consider materialized views for complex aggregations

## Future Enhancements
- Real-time analytics dashboard
- Template recommendation engine
- Automated insights and alerts
- Template performance scoring
- A/B testing for template variations
