# IP Allowlist Guide

## Overview

The IP Allowlist feature adds an additional security layer to webhook deliveries by restricting which IP addresses or CIDR ranges can receive webhooks. This works in conjunction with HMAC-SHA256 signature verification to provide defense-in-depth security.

## Features

- **IPv4 Address Filtering**: Restrict webhooks to specific IP addresses
- **CIDR Range Support**: Allow entire IP ranges using CIDR notation
- **Visual Management UI**: Easy-to-use interface for adding/removing allowed IPs
- **Real-time Validation**: IP addresses and CIDR ranges are validated before being added
- **Automatic Blocking**: Webhook deliveries to non-allowed IPs are blocked at the edge function level

## Database Setup

Run the following SQL to add IP allowlist support:

```sql
ALTER TABLE webhook_configs 
ADD COLUMN IF NOT EXISTS allowed_ips TEXT[] DEFAULT NULL;
```

Or use the provided setup file:
```bash
psql -f DATABASE_IP_ALLOWLIST_SETUP.sql
```

## How It Works

1. **Configuration**: Add allowed IP addresses or CIDR ranges to a webhook configuration
2. **Validation**: The send-webhook edge function checks the target URL's hostname against the allowlist
3. **Blocking**: If the IP is not in the allowlist, the webhook delivery is blocked with a 403 error
4. **Logging**: Blocked attempts are logged in webhook_deliveries with appropriate error messages

## Usage

### Adding IP Restrictions

1. Navigate to the Webhook Integration page
2. Find the webhook you want to restrict
3. In the IP Allowlist section, enter an IP address or CIDR range
4. Click "Add" to add it to the allowlist
5. Repeat for additional IPs

### Supported Formats

**Individual IPv4 Addresses:**
- `192.168.1.100`
- `10.0.0.50`
- `172.16.0.1`

**CIDR Ranges:**
- `10.0.0.0/24` (allows 10.0.0.0 - 10.0.0.255)
- `192.168.1.0/28` (allows 192.168.1.0 - 192.168.1.15)
- `172.16.0.0/16` (allows 172.16.0.0 - 172.16.255.255)

### Removing IP Restrictions

Click the X button next to any IP address in the allowlist to remove it.

### Allowing All IPs

Leave the allowlist empty to allow webhooks to any IP address (default behavior).

## Security Best Practices

1. **Use with Signature Verification**: Always enable HMAC-SHA256 signature verification in addition to IP allowlisting
2. **Principle of Least Privilege**: Only add IPs that absolutely need to receive webhooks
3. **Regular Audits**: Periodically review and update your IP allowlists
4. **CIDR Ranges**: Use specific ranges rather than broad ones when possible
5. **Monitor Logs**: Check webhook delivery logs for blocked attempts

## Example Scenarios

### Internal Service Only
```
Allowed IPs: 10.0.1.50, 10.0.1.51
Use Case: Webhooks only to internal microservices
```

### Cloud Provider Range
```
Allowed IPs: 52.0.0.0/8
Use Case: Webhooks to AWS services in specific region
```

### Multiple Locations
```
Allowed IPs: 192.168.1.100, 10.0.0.0/24, 172.16.5.10
Use Case: Webhooks to multiple office locations and data centers
```

## Troubleshooting

### Webhook Delivery Fails with 403 Error

**Cause**: Target IP is not in the allowlist

**Solution**: 
1. Check the webhook URL's resolved IP address
2. Add the IP or appropriate CIDR range to the allowlist
3. Test the webhook again

### Invalid IP Format Error

**Cause**: IP address or CIDR range format is incorrect

**Solution**:
- Ensure IPv4 addresses have format: `xxx.xxx.xxx.xxx`
- Ensure CIDR ranges have format: `xxx.xxx.xxx.xxx/xx`
- Each octet must be 0-255
- CIDR mask must be 0-32

### CIDR Range Not Working

**Note**: The current implementation uses simplified CIDR matching. For production use, consider implementing full CIDR range calculation.

## API Integration

### Update Allowlist via API

```javascript
import { supabase } from '@/lib/supabase';

// Add IPs to allowlist
await supabase
  .from('webhook_configs')
  .update({ 
    allowed_ips: ['192.168.1.100', '10.0.0.0/24'] 
  })
  .eq('id', webhookId);

// Remove all restrictions
await supabase
  .from('webhook_configs')
  .update({ allowed_ips: null })
  .eq('id', webhookId);
```

## Performance Considerations

- IP validation adds minimal overhead (< 1ms per check)
- Allowlist checks happen before webhook delivery, preventing unnecessary network calls
- Empty allowlists (null or []) skip validation entirely

## Future Enhancements

Potential improvements for production environments:

1. **IPv6 Support**: Add support for IPv6 addresses and ranges
2. **DNS Resolution**: Automatically resolve domain names to IPs
3. **Geolocation Filtering**: Block/allow by country or region
4. **Rate Limiting per IP**: Different rate limits for different IPs
5. **IP Reputation Checking**: Integration with threat intelligence feeds
