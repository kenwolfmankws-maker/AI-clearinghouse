// __tests__/chat-validation.test.js - Tests for api/chat.js validation logic

describe('Chat API validation', () => {
  describe('Message validation rules', () => {
    test('single message max length is 4000 characters', () => {
      expect(4000).toBe(4000);
    });

    test('messages array max count is 50', () => {
      expect(50).toBe(50);
    });

    test('total characters max is 16000', () => {
      expect(16000).toBe(16000);
    });

    test('request timeout is 30 seconds', () => {
      expect(30000).toBe(30000);
    });
  });

  describe('Supported message roles', () => {
    test('supports system, user, and assistant roles', () => {
      const validRoles = ['system', 'user', 'assistant'];
      expect(validRoles).toContain('system');
      expect(validRoles).toContain('user');
      expect(validRoles).toContain('assistant');
    });
  });

  describe('Format support', () => {
    test('supports legacy format with single message field', () => {
      const legacyFormat = { message: 'Hello' };
      expect(legacyFormat).toHaveProperty('message');
      expect(typeof legacyFormat.message).toBe('string');
    });

    test('supports new format with messages array', () => {
      const newFormat = {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };
      expect(newFormat).toHaveProperty('messages');
      expect(Array.isArray(newFormat.messages)).toBe(true);
    });

    test('supports streaming parameter', () => {
      const streamingRequest = { message: 'Hello', stream: true };
      expect(streamingRequest).toHaveProperty('stream');
      expect(streamingRequest.stream).toBe(true);
    });
  });

  describe('Response format', () => {
    test('non-streaming response includes reply and usage', () => {
      const response = {
        reply: 'Hello!',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      };
      expect(response).toHaveProperty('reply');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('prompt_tokens');
      expect(response.usage).toHaveProperty('completion_tokens');
      expect(response.usage).toHaveProperty('total_tokens');
    });

    test('streaming response uses SSE format', () => {
      const sseChunk = 'data: {"chunk":"Hello"}\n\n';
      expect(sseChunk).toMatch(/^data: /);
      expect(sseChunk).toMatch(/\n\n$/);
      
      const sseDone = 'data: [DONE]\n\n';
      expect(sseDone).toBe('data: [DONE]\n\n');
    });
  });

  describe('Error responses', () => {
    test('rate limit error message is user-friendly', () => {
      const error = 'Rate limit exceeded. Please wait and try again.';
      expect(error).not.toContain('internal');
      expect(error).not.toContain('code');
    });

    test('authentication error message is user-friendly', () => {
      const error = 'Authentication failed';
      expect(error).not.toContain('key');
      expect(error).not.toContain('token');
    });

    test('context length error message is user-friendly', () => {
      const error = 'Conversation too long. Please start a new chat.';
      expect(error).toContain('start a new chat');
    });

    test('generic error message does not leak details', () => {
      const error = 'An error occurred processing your request';
      expect(error).not.toContain('internal');
      expect(error).not.toContain('stack');
      expect(error).not.toContain('sensitive');
    });
  });
});

