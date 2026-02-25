# SMS Geolocation-Based Pricing Guide

## Overview
The SMS geolocation-based pricing system allows you to define different SMS costs based on the recipient's country or region. This enables accurate cost tracking and budgeting when sending SMS notifications to international recipients.

## Features
- **Country-Specific Pricing**: Set unique SMS costs for each country
- **Regional Grouping**: Organize countries by region (North America, Europe, Asia, etc.)
- **Automatic Cost Calculation**: Costs are calculated based on phone number country codes
- **Cost Analytics**: View spending breakdown by country and region
- **Default Pricing**: Fallback pricing for unknown/unlisted countries

## Database Setup

The system uses two main tables:

### sms_pricing_tiers
Stores per-country SMS pricing rates:
- `country_code`: ISO 3166-1 alpha-3 code (USA, GBR, etc.)
- `country_name`: Full country name
- `region`: Geographic region
- `cost_per_sms`: Cost in USD (supports up to 6 decimal places)
- `currency`: Currency code (default: USD)
- `is_active`: Enable/disable specific pricing tiers

### sms_cost_by_region
Aggregates SMS costs by country/region for analytics:
- `org_id`: User/organization ID
- `country_code`: Country code
- `message_count`: Number of messages sent
- `total_cost`: Total cost for the period
- `period_start` / `period_end`: Time period for aggregation

## Configuration UI

### Managing Pricing Tiers

Navigate to **Organization > Webhook Integration > SMS Pricing Tiers**

**Add New Pricing Tier:**
1. Click "Add Tier"
2. Enter country code (3-letter ISO code)
3. Enter country name
4. Select region
5. Set cost per SMS (in USD)
6. Click "Create Tier"

**Edit Existing Tier:**
1. Click the edit icon next to any tier
2. Update country name, region, or cost
3. Click "Update Tier"

**Note**: Country codes cannot be changed after creation.

## Cost Analysis Dashboard

Navigate to **Organization > Webhook Integration > Cost Analysis**

### Regional Cost Breakdown
- **Pie Chart**: Visual representation of costs by region
- **Total Metrics**: Total cost, messages sent, and average cost per message
- **Period Selector**: View data for last 7, 30, or 90 days

### Country-Level Details
- **Bar Chart**: Top 10 countries by cost
- **Detailed List**: All countries with message counts and total costs
- **Country Badges**: Quick identification of country codes

## Default Pricing Tiers

The system includes default pricing for major countries:

| Country | Code | Region | Cost/SMS |
|---------|------|--------|----------|
| United States | USA | North America | $0.0075 |
| Canada | CAN | North America | $0.0080 |
| United Kingdom | GBR | Europe | $0.0090 |
| Germany | DEU | Europe | $0.0095 |
| France | FRA | Europe | $0.0092 |
| Australia | AUS | Oceania | $0.0110 |
| Japan | JPN | Asia | $0.0105 |
| China | CHN | Asia | $0.0085 |
| India | IND | Asia | $0.0065 |
| Brazil | BRA | South America | $0.0120 |

**Unknown Countries**: Messages to unlisted countries use the "Other/Unknown" (ZZZ) pricing tier at $0.0150 per SMS.

## Integration with SMS Sending

When sending SMS notifications, the system:

1. **Extracts Country Code**: Parses the phone number to identify the country
2. **Looks Up Pricing**: Queries the pricing tier for that country
3. **Calculates Cost**: Multiplies the cost per SMS by the number of messages
4. **Records Analytics**: Logs the cost data to `sms_cost_by_region` table
5. **Checks Budgets**: Compares against configured budget limits

## Best Practices

### Setting Pricing Tiers
- **Research Carrier Rates**: Base your pricing on actual carrier costs
- **Add Margin**: Include a buffer for rate fluctuations
- **Regular Updates**: Review and update rates quarterly
- **Regional Consistency**: Keep similar rates for countries in the same region

### Cost Monitoring
- **Weekly Reviews**: Check the Cost Analysis dashboard weekly
- **Budget Alerts**: Set up budget thresholds for high-cost regions
- **Trend Analysis**: Monitor cost trends over 30-90 day periods
- **Anomaly Detection**: Investigate sudden spikes in specific countries

### Optimization Strategies
- **Batch Messages**: Group notifications to reduce per-message overhead
- **Regional Targeting**: Consider time zones and regional preferences
- **Fallback Channels**: Use email for high-cost countries when appropriate
- **Rate Negotiation**: Use analytics to negotiate better rates with carriers

## API Integration

### Getting Pricing for a Country

```typescript
const { data, error } = await supabase
  .from('sms_pricing_tiers')
  .select('cost_per_sms')
  .eq('country_code', 'USA')
  .single();

const costPerSMS = data?.cost_per_sms || 0.015; // Fallback to default
```

### Recording SMS Cost

```typescript
await supabase.from('sms_cost_by_region').insert({
  org_id: userId,
  country_code: 'USA',
  country_name: 'United States',
  region: 'North America',
  message_count: 1,
  total_cost: 0.0075,
  period_start: new Date(),
  period_end: new Date()
});
```

## Troubleshooting

### Issue: Incorrect Country Detection
**Solution**: Ensure phone numbers include country code prefix (e.g., +1 for USA)

### Issue: Missing Pricing Data
**Solution**: Check that all required countries have pricing tiers configured

### Issue: Cost Analytics Not Updating
**Solution**: Verify that SMS sending functions are recording cost data properly

## Security Considerations

- **Admin-Only Access**: Only admins can modify pricing tiers
- **Audit Logging**: All pricing changes are logged
- **Read-Only Analytics**: All users can view cost analytics for their organization
- **RLS Policies**: Row-level security ensures data isolation

## Future Enhancements

- **Dynamic Pricing**: Automatically update rates from carrier APIs
- **Multi-Currency Support**: Display costs in local currencies
- **Carrier Selection**: Choose different carriers based on cost
- **Volume Discounts**: Apply tiered pricing based on message volume
- **Predictive Analytics**: Forecast future costs based on trends
