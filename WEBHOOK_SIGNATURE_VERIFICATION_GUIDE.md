# Webhook Signature Verification Guide

## Overview
All webhook deliveries from AI Clearinghouse are signed using HMAC-SHA256 to ensure authenticity and prevent unauthorized webhook calls.

## How It Works

### Signature Generation
Each webhook payload is signed with a secret key unique to your webhook configuration:

1. **Payload**: JSON string of the webhook data
2. **Secret Key**: 64-character hexadecimal string (auto-generated)
3. **Algorithm**: HMAC-SHA256
4. **Output**: Hexadecimal signature string

### Headers Sent
Every webhook request includes these headers:
- `X-Webhook-Signature`: sha256={signature}
- `X-Webhook-Timestamp`: Unix timestamp in milliseconds
- `X-Webhook-ID`: Your webhook configuration ID

## Verification Examples

### Node.js / Express
```javascript
const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const webhookId = req.headers['x-webhook-id'];
  const payload = JSON.stringify(req.body);
  
  // Your webhook secret key from AI Clearinghouse
  const secretKey = process.env.WEBHOOK_SECRET;
  
  // Generate expected signature
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
  
  // Verify signature
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Optional: Check timestamp to prevent replay attacks
  const age = Date.now() - parseInt(timestamp);
  if (age > 300000) { // 5 minutes
    return res.status(401).json({ error: 'Request too old' });
  }
  
  // Process webhook
  console.log('Valid webhook received:', req.body);
  res.status(200).json({ received: true });
});
```

### Python / Flask
```python
import hmac
import hashlib
import time
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    timestamp = request.headers.get('X-Webhook-Timestamp')
    webhook_id = request.headers.get('X-Webhook-ID')
    payload = request.get_data()
    
    # Your webhook secret key
    secret_key = os.environ.get('WEBHOOK_SECRET')
    
    # Generate expected signature
    expected_sig = 'sha256=' + hmac.new(
        secret_key.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    # Verify signature
    if not hmac.compare_digest(signature, expected_sig):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Optional: Check timestamp
    age = time.time() * 1000 - int(timestamp)
    if age > 300000:  # 5 minutes
        return jsonify({'error': 'Request too old'}), 401
    
    # Process webhook
    data = request.get_json()
    print('Valid webhook received:', data)
    return jsonify({'received': True}), 200
```

### Go
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "io/ioutil"
    "net/http"
    "os"
    "strconv"
    "time"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-Webhook-Signature")
    timestamp := r.Header.Get("X-Webhook-Timestamp")
    webhookID := r.Header.Get("X-Webhook-ID")
    
    body, _ := ioutil.ReadAll(r.Body)
    secretKey := os.Getenv("WEBHOOK_SECRET")
    
    // Generate expected signature
    mac := hmac.New(sha256.New, []byte(secretKey))
    mac.Write(body)
    expectedSig := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    
    // Verify signature
    if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    // Optional: Check timestamp
    ts, _ := strconv.ParseInt(timestamp, 10, 64)
    age := time.Now().UnixMilli() - ts
    if age > 300000 { // 5 minutes
        http.Error(w, "Request too old", http.StatusUnauthorized)
        return
    }
    
    // Process webhook
    var data map[string]interface{}
    json.Unmarshal(body, &data)
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]bool{"received": true})
}
```

### PHP
```php
<?php
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
$timestamp = $_SERVER['HTTP_X_WEBHOOK_TIMESTAMP'];
$webhookId = $_SERVER['HTTP_X_WEBHOOK_ID'];
$payload = file_get_contents('php://input');

// Your webhook secret key
$secretKey = getenv('WEBHOOK_SECRET');

// Generate expected signature
$expectedSig = 'sha256=' . hash_hmac('sha256', $payload, $secretKey);

// Verify signature
if (!hash_equals($signature, $expectedSig)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Optional: Check timestamp
$age = (time() * 1000) - intval($timestamp);
if ($age > 300000) { // 5 minutes
    http_response_code(401);
    echo json_encode(['error' => 'Request too old']);
    exit;
}

// Process webhook
$data = json_decode($payload, true);
error_log('Valid webhook received: ' . print_r($data, true));
http_response_code(200);
echo json_encode(['received' => true]);
?>
```

## Managing Secret Keys

### Viewing Your Secret Key
1. Go to Analytics > Webhooks
2. Find your webhook in the list
3. The secret key is displayed below the webhook URL
4. Click the eye icon to show/hide the key
5. Click the copy icon to copy to clipboard

### Regenerating Secret Keys
1. Click the refresh icon next to the secret key
2. Confirm regeneration
3. Update your webhook endpoint with the new key
4. Old signatures will no longer be valid

### Security Best Practices
- **Store Securely**: Keep secret keys in environment variables
- **Never Commit**: Don't commit keys to version control
- **Rotate Regularly**: Regenerate keys periodically (every 90 days)
- **Use HTTPS**: Always use HTTPS endpoints
- **Validate Timestamp**: Prevent replay attacks by checking age
- **Log Failures**: Monitor and alert on signature verification failures

## Troubleshooting

### Signature Mismatch
**Problem**: Signature verification fails

**Solutions**:
1. Ensure you're using the correct secret key
2. Verify payload is not modified before verification
3. Use raw request body, not parsed JSON
4. Check for extra whitespace or encoding issues
5. Ensure signature format is "sha256={hash}"

### Timestamp Issues
**Problem**: Timestamp validation fails

**Solutions**:
1. Check server clock synchronization
2. Adjust timestamp tolerance window
3. Verify timestamp is in milliseconds
4. Account for network latency

### Implementation Issues
**Problem**: Can't get verification working

**Solutions**:
1. Test with a known payload and signature
2. Log the generated signature vs received
3. Verify HMAC algorithm is SHA-256
4. Check secret key encoding (should be string)
5. Use constant-time comparison for signatures

## Testing Signature Verification

### Manual Test
```bash
# Generate test signature
echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "your-secret-key" | sed 's/^.* //'

# Send test request
curl -X POST https://your-endpoint.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=generated-signature" \
  -H "X-Webhook-Timestamp: $(date +%s)000" \
  -H "X-Webhook-ID: test-webhook-id" \
  -d '{"test":"data"}'
```

### Using AI Clearinghouse Test Feature
1. Configure your webhook with signature verification
2. Click "Test Webhook" button
3. Check your endpoint logs for received signature
4. Verify signature validation passes
5. Review delivery history for results

## Security Considerations

### Why Signature Verification?
- **Authenticity**: Confirms webhook is from AI Clearinghouse
- **Integrity**: Ensures payload hasn't been tampered with
- **Non-repudiation**: Proves origin of the request

### Additional Security Layers
1. **IP Allowlisting**: Restrict to Supabase IP ranges
2. **Rate Limiting**: Prevent abuse
3. **Idempotency**: Handle duplicate deliveries
4. **Logging**: Track all webhook attempts
5. **Monitoring**: Alert on verification failures

### Compliance
Signature verification helps meet security requirements for:
- SOC 2
- ISO 27001
- PCI DSS
- GDPR (data integrity)

## Support
For signature verification issues:
- Verify secret key is correct
- Check implementation against examples
- Test with manual signature generation
- Review error logs for specific issues
- Contact support with webhook ID and error details
