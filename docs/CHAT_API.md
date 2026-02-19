# Chat API Endpoint Documentation

## Overview
The `/api/chat` endpoint is a production-ready chat interface supporting both legacy single-message format and multi-turn conversations with streaming capabilities.

## Endpoint
```
POST /api/chat
```

## Features
- ✅ **Backwards Compatible**: Existing clients using `{ message: "..." }` continue to work
- ✅ **Conversation History**: Support multi-turn conversations with `messages` array
- ✅ **Streaming (SSE)**: Real-time token-by-token responses with Server-Sent Events
- ✅ **Enhanced Validation**: Input sanitization and length limits
- ✅ **Better Error Handling**: User-friendly error messages without leaking internal details
- ✅ **Token Usage Tracking**: Response includes OpenAI token usage data
- ✅ **OIDC Authentication**: Optional authentication support (preserved from original)

## Request Formats

### Legacy Format (Single Message)
```json
{
  "message": "Hello, how are you?"
}
```

### New Format (Conversation History)
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" },
    { "role": "user", "content": "Tell me about the Clearinghouse" }
  ]
}
```

### Streaming Mode
Add `stream: true` to enable Server-Sent Events:
```json
{
  "message": "Hello",
  "stream": true
}
```

## Response Formats

### Non-Streaming Response
```json
{
  "reply": "Welcome to the AI Clearinghouse!",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 23,
    "total_tokens": 68
  }
}
```

### Streaming Response (SSE)
```
data: {"chunk":"Welcome"}

data: {"chunk":" to"}

data: {"chunk":" the AI Clearinghouse!"}

data: [DONE]
```

## Validation Rules

### Single Message Mode
- **Max length**: 4,000 characters
- **Required**: Non-empty, non-whitespace string

### Messages Array Mode
- **Max messages**: 50 messages
- **Max total chars**: 16,000 characters across all messages
- **Required fields**: Each message must have `role` and `content`
- **Valid roles**: `system`, `user`, `assistant`
- **Whitespace**: Automatically trimmed from content

## Error Handling

### Rate Limit (429)
```json
{
  "error": "Rate limit exceeded. Please wait and try again."
}
```

### Authentication Failed (401)
```json
{
  "error": "Authentication failed"
}
```

### Context Length Exceeded (400)
```json
{
  "error": "Conversation too long. Please start a new chat."
}
```

### Invalid Request (400)
```json
{
  "error": "Request must include 'message' or 'messages' field"
}
```

### Generic Error (500)
```json
{
  "error": "An error occurred processing your request"
}
```

## System Prompt

The endpoint automatically prepends a neutral system prompt if not present:
- Describes the AI Clearinghouse and available portals
- Professional, helpful tone
- **NOT Eldon** (Sanctuary-specific persona)

If you provide a custom system prompt as the first message with `role: "system"`, it will be used instead.

## Authentication

Optional OIDC authentication via `Authorization: Bearer <token>` header.
- Authenticated users are logged with their subject claim
- Anonymous requests are allowed and logged as "anonymous"

## Logging

All requests are logged to workspace logs with:
- User identifier (authenticated subject or "anonymous")
- Turn count and streaming mode
- Clamped message content (max 200 chars per message in logs)
- Token usage data
- Timestamps in UTC

## Configuration

### Environment Variables
- `OPENAI_API_KEY` (required): Your OpenAI API key

### Timeouts
- Request timeout: 30 seconds

## Examples

### cURL - Legacy Format
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

### cURL - Conversation History
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role":"user","content":"What is this?"},
      {"role":"assistant","content":"This is the AI Clearinghouse."},
      {"role":"user","content":"Tell me more"}
    ]
  }'
```

### cURL - Streaming
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -N \
  -d '{"message":"Hello!","stream":true}'
```

### JavaScript - Fetch API
```javascript
// Non-streaming
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello!'
  })
});
const data = await response.json();
console.log(data.reply, data.usage);

// Streaming
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello!',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('Stream complete');
      } else {
        const json = JSON.parse(data);
        console.log(json.chunk);
      }
    }
  }
}
```

## Migration Guide

### From Old to New Format

**Before:**
```javascript
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
```

**After (still works!):**
```javascript
// Legacy format still works
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});

// Or use new format for conversations
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'How are you?' }
    ]
  })
});
```

## Notes

- This is a **NEUTRAL** endpoint for the Clearinghouse portal
- Eldon persona is **NOT** used here (that's Sanctuary-only)
- All existing OIDC auth logic is preserved
- Workspace logging is preserved
- The endpoint is optimized for production use
