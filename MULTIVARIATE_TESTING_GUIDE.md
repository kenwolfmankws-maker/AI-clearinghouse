# Multi-Variant Testing Guide

This guide explains how to use the advanced multi-variant testing system with Bayesian analysis and multi-armed bandit algorithms for notification digests.

## Overview

The multi-variant testing system extends traditional A/B testing to support:
- **Multiple variants** (A/B/C/D/E testing)
- **Dynamic traffic allocation** using multi-armed bandit algorithms
- **Bayesian statistical analysis** for faster winner identification
- **Automatic optimization** based on real-time performance

## Setup

### 1. Database Setup

Run the multi-variant testing schema:

```sql
-- Run this in your Supabase SQL editor
\i DATABASE_MULTIVARIATE_TESTING_SETUP.sql
```

This adds:
- Bayesian parameters (alpha, beta) to variants
- Thompson sampling scores
- UCB (Upper Confidence Bound) scores
- Allocation algorithm configuration
- Helper functions for statistical calculations

### 2. Edge Function Deployment

The `send-digest-notifications` function has been updated with multi-armed bandit algorithms:
- **Thompson Sampling**: Bayesian approach that samples from posterior distributions
- **UCB (Upper Confidence Bound)**: Balances exploration and exploitation
- **Epsilon-Greedy**: Explores randomly with probability epsilon, otherwise exploits best variant

## Creating Multi-Variant Tests

### Via Dashboard

1. Navigate to Analytics → Multi-Variant Tests
2. Click "Create Multi-Variant Test"
3. Configure:
   - **Test Name**: Descriptive name for your test
   - **Number of Variants**: 2-5 variants (A/B/C/D/E)
   - **Allocation Algorithm**: Choose your optimization strategy

### Allocation Algorithms

#### Equal Distribution
- Classic A/B testing approach
- Traffic split evenly across all variants
- Best for: Initial baseline testing

#### Thompson Sampling (Recommended)
- Bayesian approach using Beta distributions
- Automatically allocates more traffic to better performers
- Balances exploration vs exploitation naturally
- Best for: Fast convergence with statistical rigor

#### Upper Confidence Bound (UCB)
- Confidence-based exploration
- Considers uncertainty in performance estimates
- Exploration rate configurable (default: 2.0)
- Best for: When you want explicit control over exploration

#### Epsilon-Greedy
- Simple exploration strategy
- Explores randomly with probability epsilon (default: 0.1)
- Exploits best variant otherwise
- Best for: Simple, interpretable allocation

## Understanding Bayesian Analysis

### Posterior Distribution

Each variant maintains a Beta distribution representing our belief about its true performance:
- **Alpha**: Number of successes + prior
- **Beta**: Number of failures + prior
- **Posterior Mean**: Expected open rate = alpha / (alpha + beta)
- **Posterior Std**: Uncertainty in the estimate

### Probability of Being Best

The dashboard calculates P(variant is best) by:
1. Sampling from each variant's posterior distribution
2. Counting how often each variant has the highest sample
3. Reporting the proportion as probability

A variant with P(Best) > 95% is typically safe to declare as winner.

## Interpreting Results

### Dashboard Metrics

**Bayesian Analysis Chart**:
- **Posterior Mean**: Expected performance (with uncertainty)
- **Probability Best**: Confidence that this is the winning variant

**Variant Cards**:
- **Sent/Open Rate**: Raw performance metrics
- **Posterior**: Mean ± Standard Deviation
- **P(Best)**: Probability this variant is the winner

### When to Declare a Winner

Declare a winner when:
1. **P(Best) > 95%**: High confidence in superiority
2. **Sufficient sample size**: At least 100 digests sent per variant
3. **Stable performance**: Metrics have converged

The system automatically suggests declaring a winner when P(Best) > 95%.

## Example Workflow

### 1. Create Test
```typescript
// Via dashboard or API
{
  name: "Subject Line Optimization",
  test_type: "subject_line",
  allocation_algorithm: "thompson",
  num_variants: 4
}
```

### 2. Configure Variants
```typescript
// Variants are created automatically:
// - Control: "Your daily notification digest"
// - Variant A: "You have 5 new updates!"
// - Variant B: "Don't miss these updates"
// - Variant C: "Your personalized digest is ready"
```

### 3. Activate Test
```sql
UPDATE digest_ab_tests 
SET status = 'active', start_date = NOW()
WHERE id = 'test-id';
```

### 4. Monitor Performance

The system automatically:
- Assigns users to variants using Thompson Sampling
- Updates Bayesian parameters on each open/non-open
- Recalculates allocation probabilities
- Shifts traffic toward better performers

### 5. Declare Winner

When P(Best) > 95%:
```sql
UPDATE digest_ab_tests 
SET status = 'completed', 
    winner_variant_id = 'winning-variant-id',
    end_date = NOW()
WHERE id = 'test-id';
```

## Advanced Configuration

### Custom Priors

Set informative priors based on historical data:

```sql
UPDATE digest_ab_tests
SET bayesian_prior_alpha = 20,  -- 20 opens
    bayesian_prior_beta = 80    -- 80 non-opens
WHERE id = 'test-id';
-- This represents a prior belief of 20% open rate
```

### Exploration Rate

Adjust UCB exploration:

```sql
UPDATE digest_ab_tests
SET exploration_rate = 1.5  -- Less exploration (default: 2.0)
WHERE id = 'test-id';
```

### Epsilon Value

Adjust epsilon-greedy randomness:

```sql
UPDATE digest_ab_tests
SET epsilon = 0.05  -- 5% random exploration (default: 10%)
WHERE id = 'test-id';
```

## Best Practices

1. **Start with Thompson Sampling**: It's the most robust algorithm for most use cases

2. **Use 3-4 variants**: More variants = longer convergence time

3. **Test one thing at a time**: Subject line OR format OR timing, not all at once

4. **Wait for significance**: Don't declare winners too early (P(Best) > 95%)

5. **Monitor regularly**: Check dashboard daily during active tests

6. **Document learnings**: Record why winners performed better

## Troubleshooting

### Slow Convergence

If tests aren't converging:
- Increase digest frequency (more data points)
- Reduce number of variants
- Check if variants are truly different
- Ensure sufficient user base

### Unexpected Results

If results seem wrong:
- Verify variant configurations are correct
- Check that tracking pixel is loading
- Ensure edge function is running on schedule
- Review Bayesian parameters for anomalies

### Algorithm Selection

If unsure which algorithm to use:
- **Thompson Sampling**: Best default choice
- **UCB**: When you want explicit exploration control
- **Epsilon-Greedy**: When you want simplicity
- **Equal**: When you want classic A/B testing

## API Reference

### Create Multi-Variant Test

```typescript
const { data: test } = await supabase
  .from('digest_ab_tests')
  .insert({
    name: 'My Test',
    test_type: 'subject_line',
    allocation_algorithm: 'thompson',
    status: 'draft'
  })
  .select()
  .single();
```

### Add Variants

```typescript
const variants = [
  { test_id: test.id, name: 'Control', traffic_allocation: 0.25 },
  { test_id: test.id, name: 'Variant A', traffic_allocation: 0.25 },
  { test_id: test.id, name: 'Variant B', traffic_allocation: 0.25 },
  { test_id: test.id, name: 'Variant C', traffic_allocation: 0.25 }
];

await supabase.from('digest_ab_variants').insert(variants);
```

### Get Bayesian Analysis

```typescript
const { data } = await supabase
  .from('digest_bayesian_analysis')
  .select('*')
  .eq('test_id', testId);
```

## Further Reading

- [Thompson Sampling Tutorial](https://en.wikipedia.org/wiki/Thompson_sampling)
- [Multi-Armed Bandit Algorithms](https://en.wikipedia.org/wiki/Multi-armed_bandit)
- [Bayesian A/B Testing](https://www.evanmiller.org/bayesian-ab-testing.html)
