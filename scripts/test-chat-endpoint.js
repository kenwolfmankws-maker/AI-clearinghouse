#!/usr/bin/env node
// scripts/test-chat-endpoint.js - Manual test script for chat endpoint
// Usage: node scripts/test-chat-endpoint.js

import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testEndpoint(testName, options) {
  try {
    log(colors.cyan, `\n🧪 Testing: ${testName}`);
    const result = await makeRequest('/api/chat', options);
    
    if (options.expectedStatus && result.status !== options.expectedStatus) {
      log(colors.red, `  ❌ FAIL: Expected status ${options.expectedStatus}, got ${result.status}`);
      console.log('  Response:', result.data);
      return false;
    }
    
    if (options.validate) {
      const isValid = options.validate(result);
      if (!isValid) {
        log(colors.red, `  ❌ FAIL: Validation failed`);
        console.log('  Response:', result.data);
        return false;
      }
    }
    
    log(colors.green, `  ✅ PASS`);
    if (options.showResponse) {
      console.log('  Response:', JSON.stringify(result.data, null, 2));
    }
    return true;
  } catch (err) {
    log(colors.red, `  ❌ ERROR: ${err.message}`);
    return false;
  }
}

async function runTests() {
  log(colors.blue, '\n='.repeat(60));
  log(colors.blue, '🚀 Chat Endpoint Test Suite');
  log(colors.blue, '='.repeat(60));
  
  const results = [];
  
  // Test 1: Legacy single message format
  results.push(await testEndpoint('Legacy format - single message', {
    body: { message: 'Hello, this is a test!' },
    expectedStatus: 200,
    validate: (r) => r.data.reply && r.data.usage,
    showResponse: true,
  }));
  
  // Test 2: New messages array format
  results.push(await testEndpoint('New format - messages array', {
    body: {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help?' },
        { role: 'user', content: 'Tell me about the Clearinghouse' },
      ]
    },
    expectedStatus: 200,
    validate: (r) => r.data.reply && r.data.usage,
    showResponse: true,
  }));
  
  // Test 3: Empty message rejection
  results.push(await testEndpoint('Validation - empty message', {
    body: { message: '' },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('empty'),
  }));
  
  // Test 4: Whitespace-only message
  results.push(await testEndpoint('Validation - whitespace only', {
    body: { message: '   \n\t  ' },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('whitespace'),
  }));
  
  // Test 5: Message too long
  results.push(await testEndpoint('Validation - message too long', {
    body: { message: 'a'.repeat(4001) },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('too long'),
  }));
  
  // Test 6: Empty messages array
  results.push(await testEndpoint('Validation - empty messages array', {
    body: { messages: [] },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('empty'),
  }));
  
  // Test 7: Too many messages
  results.push(await testEndpoint('Validation - too many messages', {
    body: { messages: Array(51).fill({ role: 'user', content: 'test' }) },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('Too many'),
  }));
  
  // Test 8: Invalid role
  results.push(await testEndpoint('Validation - invalid role', {
    body: { messages: [{ role: 'invalid', content: 'test' }] },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('role'),
  }));
  
  // Test 9: Missing content
  results.push(await testEndpoint('Validation - missing content', {
    body: { messages: [{ role: 'user' }] },
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('content'),
  }));
  
  // Test 10: No message or messages field
  results.push(await testEndpoint('Validation - missing fields', {
    body: {},
    expectedStatus: 400,
    validate: (r) => r.data.error && r.data.error.includes('message'),
  }));
  
  // Test 11: GET request (should fail)
  results.push(await testEndpoint('Method validation - GET request', {
    method: 'GET',
    expectedStatus: 405,
    validate: (r) => r.data.error && r.data.error.includes('not allowed'),
  }));
  
  // Summary
  log(colors.blue, '\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(colors.green, `✅ All tests passed! (${passed}/${total})`);
  } else {
    log(colors.red, `❌ Some tests failed: ${passed}/${total} passed`);
  }
  log(colors.blue, '='.repeat(60) + '\n');
  
  process.exit(passed === total ? 0 : 1);
}

// Check if server is running
log(colors.yellow, '\n⚠️  Make sure the development server is running on http://' + HOST + ':' + PORT);
log(colors.yellow, '   Run: node local-server.cjs or npm run web\n');

setTimeout(() => {
  runTests().catch(err => {
    log(colors.red, '\n💥 Test suite failed:', err.message);
    process.exit(1);
  });
}, 1000);
