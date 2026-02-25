# Approval Workflow Analytics Guide

## Overview
The Approval Workflow Analytics system provides comprehensive insights into approval performance, bottlenecks, and optimization opportunities for your report template approval workflows.

## Features

### 1. Key Performance Metrics
- **Average Approval Time**: Overall time taken across all approval levels
- **Total Escalations**: Number of requests that required manual escalation
- **Active Bottlenecks**: Approval levels with wait times exceeding 24 hours
- **Active Delegations**: Current number of active approval delegations

### 2. Analytics Views

#### Approval Times by Level
- Visual chart showing average approval time for each level
- Breakdown by approval chain and level
- Min/max approval times for context
- Helps identify slow approval levels

#### Approver Performance
- Individual approver metrics including:
  - Total decisions made (approvals + rejections)
  - Approval rate percentage
  - Average response time in hours
- Useful for workload balancing and performance reviews

#### Bottleneck Identification
- Real-time view of pending requests by level
- Average and maximum wait times
- Sorted by severity (longest waits first)
- Actionable insights for process improvement

#### Escalation Metrics
- Escalation frequency by approval chain
- Breakdown of escalated request outcomes:
  - Approved after escalation
  - Rejected after escalation
  - Still pending
- Helps identify problematic approval chains

### 3. Optimization Recommendations

The system automatically generates recommendations based on:

**Bottleneck Detection**
- Alerts when approval levels exceed 48-hour average wait times
- Suggests adding more approvers or enabling delegation

**Low Approval Rates**
- Identifies approvers with <50% approval rates (min 5 decisions)
- Recommends reviewing rejection reasons to improve template quality

**High Escalation Frequency**
- Flags approval chains with >10 escalations
- Suggests reviewing approval timeouts and chain complexity

## Database Setup

Run the analytics setup script:
```sql
-- Run this after setting up multi-level approvals
\i DATABASE_APPROVAL_ANALYTICS_SETUP.sql
```

This creates the following views:
- `approval_time_by_level` - Time metrics per approval level
- `approver_performance` - Individual approver statistics
- `escalation_metrics` - Escalation tracking by chain
- `delegation_usage` - Delegation activity metrics
- `approval_bottlenecks` - Real-time bottleneck identification

## Accessing Analytics

1. Navigate to **Analytics** page
2. Click on **Scheduled Reports** section
3. Select the **Workflow Analytics** tab

## Using the Analytics

### Identifying Bottlenecks
1. Check the "Active Bottlenecks" metric card
2. View the Bottlenecks tab for detailed breakdown
3. Look for levels with >24 hour average wait times
4. Consider:
   - Adding more approvers to that level
   - Enabling delegation for those approvers
   - Adjusting approval chain structure

### Optimizing Approval Chains
1. Review "Approval Times by Level" chart
2. Identify levels with disproportionately long approval times
3. Check if those levels have:
   - Too few approvers
   - Approvers with high workload
   - Unclear approval criteria

### Managing Approver Workload
1. View "Approver Performance" section
2. Check response times and decision counts
3. Balance workload by:
   - Redistributing approval responsibilities
   - Adding approvers to busy levels
   - Setting up delegation during peak times

### Reducing Escalations
1. Review "Escalation Metrics" tab
2. Identify chains with high escalation rates
3. Investigate root causes:
   - Are approval timeouts too short?
   - Are approval chains too complex?
   - Do approvers need better guidance?

## Best Practices

### Regular Monitoring
- Review analytics weekly to catch emerging bottlenecks
- Track trends over time to measure improvements
- Set up alerts for critical metrics (if implementing notifications)

### Data-Driven Decisions
- Use approval time data to set realistic SLAs
- Base approver assignments on performance metrics
- Adjust approval chains based on escalation patterns

### Continuous Improvement
- Act on optimization recommendations promptly
- Document changes and their impact
- Share insights with approval stakeholders

### Performance Benchmarks
- **Target Approval Time**: <24 hours per level
- **Target Approval Rate**: >70% (indicates clear criteria)
- **Target Escalation Rate**: <10% of requests
- **Target Response Time**: <12 hours per approver

## Troubleshooting

### No Data Showing
- Ensure approval workflow has been used
- Check that analytics views were created correctly
- Verify RLS policies allow access to views

### Inaccurate Metrics
- Confirm system clocks are synchronized
- Check for data integrity in approval_history table
- Verify approval chains are properly configured

### Performance Issues
- Analytics views use aggregations - expect slight delays
- Consider adding indexes on frequently queried columns
- Implement caching for frequently accessed metrics

## Advanced Usage

### Custom Metrics
You can extend the analytics by creating additional views:

```sql
-- Example: Approval rate by template category
CREATE VIEW approval_rate_by_category AS
SELECT 
  rt.category,
  COUNT(CASE WHEN tcr.status = 'approved' THEN 1 END)::float / 
    COUNT(*)::float * 100 as approval_rate
FROM template_change_requests tcr
JOIN report_templates rt ON tcr.template_id = rt.id
GROUP BY rt.category;
```

### Exporting Analytics
- Use the "Refresh Analytics" button to get latest data
- Export data via browser dev tools or custom export functions
- Integrate with BI tools via Supabase API

## Integration with Audit Logs

All approval actions are automatically logged to the audit system:
- View detailed approval history in Audit Log page
- Cross-reference analytics with audit trail
- Track who made decisions and when

## Next Steps

1. Set up regular analytics review meetings
2. Define KPIs based on your organization's needs
3. Implement automated alerting for critical metrics
4. Create custom reports for stakeholders
5. Use insights to continuously optimize approval workflows
