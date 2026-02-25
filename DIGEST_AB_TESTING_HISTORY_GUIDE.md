# Historical A/B Test Analytics Guide

## Overview
Track and analyze completed A/B tests to identify patterns, compare performance over time, and gain insights into what types of variants perform best.

## Features

### 1. Test Completion Tracking
- Automatic completion when statistical significance is reached
- Manual completion option for administrators
- Completion reasons: statistical_significance, manual, time_limit, sample_size
- Winner identification and final insights storage

### 2. Historical Analytics Dashboard
- **Summary Metrics**: Total tests, average open/click rates, best performing algorithm
- **Trend Charts**: Visualize performance trends over time
- **Test Comparison**: Compare multiple tests side-by-side
- **Exportable Reports**: Download comprehensive JSON reports with insights

### 3. Pattern Analysis
- Algorithm performance comparison (Thompson Sampling vs UCB vs Epsilon-Greedy)
- Success rate analysis across all tests
- Winner characteristics identification
- Best practices recommendations based on historical data

## Database Setup

Run the SQL setup:
```sql
-- See DATABASE_DIGEST_AB_TESTING_HISTORY.sql
```

Key tables/views:
- `digest_ab_tests` - Extended with completion tracking
- `digest_test_history` - View aggregating completed test data
- `complete_digest_test()` - Function to mark tests as complete

## Usage

### Accessing Historical Analytics
1. Navigate to Analytics page
2. Click "Test History" tab
3. View summary cards, trend charts, and test list

### Completing a Test
```typescript
// Automatic completion (when significance reached)
await supabase.rpc('complete_digest_test', {
  p_test_id: testId,
  p_winner_variant_id: winnerVariantId,
  p_reason: 'statistical_significance',
  p_insights: {
    confidence: 0.95,
    improvement: 15.3,
    algorithm_used: 'thompson_sampling'
  }
});

// Manual completion
await supabase.rpc('complete_digest_test', {
  p_test_id: testId,
  p_winner_variant_id: winnerVariantId,
  p_reason: 'manual',
  p_insights: { notes: 'Business decision to conclude test early' }
});
```

### Exporting Reports
Click "Export Report" button to download JSON containing:
- Test summary statistics
- Algorithm performance comparison
- Individual test details
- Recommendations based on patterns

## Report Structure
```json
{
  "generated_at": "2025-10-31T22:34:00Z",
  "summary": {
    "totalTests": 15,
    "avgOpenRate": "23.45",
    "avgClickRate": "8.32",
    "bestAlgorithm": "thompson_sampling",
    "bestAlgorithmRate": "25.67"
  },
  "tests": [
    {
      "name": "Subject Line Test #1",
      "algorithm": "thompson_sampling",
      "variants": 4,
      "winner": "Variant B",
      "open_rate": 24.5,
      "click_rate": 9.2,
      "completed": "2025-10-25T10:30:00Z"
    }
  ]
}
```

## Insights & Patterns

### Algorithm Performance
The system tracks which algorithms perform best:
- **Thompson Sampling**: Best for quick convergence
- **UCB**: Good for exploration-exploitation balance
- **Epsilon-Greedy**: Simple but effective baseline

### Success Factors
Historical analysis helps identify:
- Optimal number of variants (typically 3-4)
- Best time to conclude tests (sample size vs duration)
- Subject line patterns that consistently win
- Content types with highest engagement

## Best Practices

1. **Run Tests Long Enough**: Minimum 1000 sends per variant
2. **Compare Similar Tests**: Group by content type or audience
3. **Learn from Winners**: Analyze what made winning variants successful
4. **Track Algorithm Performance**: Use best-performing algorithm for future tests
5. **Export Regularly**: Download reports monthly for trend analysis

## Integration with Real-Time Monitoring

Historical analytics complements real-time monitoring:
- Real-time: Track active tests, make quick decisions
- Historical: Learn from past tests, optimize future strategy

## Troubleshooting

### No Historical Data
- Ensure tests are being completed (check `completed_at` field)
- Verify `digest_test_history` view exists
- Check user permissions on view

### Incorrect Statistics
- Verify variant counts are being updated correctly
- Check that winner is being set properly
- Ensure final_insights JSON is valid

### Export Issues
- Check browser console for errors
- Verify JSON structure is valid
- Ensure sufficient data exists for analysis

## Future Enhancements
- Machine learning predictions for variant success
- Automated A/B test recommendations
- Cross-test pattern recognition
- Seasonal trend analysis
