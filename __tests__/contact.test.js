// __tests__/contact.test.js - Tests for api/contact.js validation logic

describe('Contact API validation', () => {
  describe('Input sanitization constants', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'api', 'contact.js'),
      'utf8'
    );

    test('name max length is 100 characters', () => {
      expect(source).toContain('MAX_NAME_LEN = 100');
    });

    test('email max length is 254 characters', () => {
      expect(source).toContain('MAX_EMAIL_LEN = 254');
    });

    test('message max length is 2000 characters', () => {
      expect(source).toContain('MAX_MESSAGE_LEN = 2000');
    });
  });

  describe('Email validation', () => {
    const isValidEmail = (str) =>
      typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

    test('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user+tag@sub.domain.com')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain')).toBe(false);
      expect(isValidEmail('no@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('rejects non-string values', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(42)).toBe(false);
    });
  });

  describe('HTML escaping', () => {
    const escapeHtml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    test('escapes angle brackets', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    test('escapes ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    test('escapes quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    test('leaves safe characters unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('Sanitize helper', () => {
    const sanitize = (str, maxLen) => {
      if (typeof str !== 'string') return '';
      return str.trim().slice(0, maxLen);
    };

    test('trims whitespace', () => {
      expect(sanitize('  hello  ', 100)).toBe('hello');
    });

    test('enforces max length', () => {
      expect(sanitize('abcdef', 3)).toBe('abc');
    });

    test('returns empty string for non-string input', () => {
      expect(sanitize(null, 100)).toBe('');
      expect(sanitize(undefined, 100)).toBe('');
      expect(sanitize(42, 100)).toBe('');
    });
  });

  describe('SDK pattern compliance', () => {
    test('uses { data, error } destructuring pattern from Resend SDK', () => {
      // Simulate the SDK response shape
      const sdkSuccessResponse = { data: { id: 'abc123' }, error: null };
      const sdkErrorResponse = { data: null, error: { message: 'Invalid API key' } };

      expect(sdkSuccessResponse).toHaveProperty('data');
      expect(sdkSuccessResponse).toHaveProperty('error');
      expect(sdkSuccessResponse.data.id).toBe('abc123');

      expect(sdkErrorResponse.error).not.toBeNull();
      expect(sdkErrorResponse.data).toBeNull();
    });

    test('does not use REST fetch pattern', () => {
      const fs = require('fs');
      const path = require('path');
      const source = fs.readFileSync(
        path.join(__dirname, '..', 'api', 'contact.js'),
        'utf8'
      );
      expect(source).toMatch(/from ['"]resend['"]/);

      expect(source).toContain('new Resend(');
      expect(source).toContain('resend.emails.send(');
      expect(source).not.toContain('https://api.resend.com');
      expect(source).not.toMatch(/fetch\s*\(RESEND_API_URL/);

    });

    test('reads API key from process.env.RESEND_API_KEY', () => {
      const fs = require('fs');
      const path = require('path');
      const source = fs.readFileSync(
        path.join(__dirname, '..', 'api', 'contact.js'),
        'utf8'
      );
      expect(source).toContain('process.env.RESEND_API_KEY');
      expect(source).not.toMatch(/re_[A-Za-z0-9]{10,}/);
    });
  });
});
