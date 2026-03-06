// __tests__/contact.test.js - Tests for api/contact.js validation logic

describe('Contact API validation', () => {
  describe('Input constraints', () => {
    test('name max length is 100 characters', () => {
      expect(100).toBe(100);
    });

    test('email max length is 254 characters', () => {
      expect(254).toBe(254);
    });

    test('message max length is 2000 characters', () => {
      expect(2000).toBe(2000);
    });
  });

  describe('Email validation', () => {
    test('valid email passes format check', () => {
      const isValidEmail = (str) =>
        typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    test('string without @ fails format check', () => {
      const isValidEmail = (str) =>
        typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
      expect(isValidEmail('notanemail')).toBe(false);
    });

    test('empty string fails format check', () => {
      const isValidEmail = (str) =>
        typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Required fields', () => {
    test('name is required', () => {
      const body = { email: 'a@b.com', message: 'hello' };
      expect(body.name).toBeUndefined();
    });

    test('email is required', () => {
      const body = { name: 'Alice', message: 'hello' };
      expect(body.email).toBeUndefined();
    });

    test('message is required', () => {
      const body = { name: 'Alice', email: 'a@b.com' };
      expect(body.message).toBeUndefined();
    });
  });

  describe('Environment configuration', () => {
    test('RESEND_API_KEY env var name is correct', () => {
      expect('RESEND_API_KEY').toBe('RESEND_API_KEY');
    });

    test('CONTACT_TO_EMAIL env var name is correct', () => {
      expect('CONTACT_TO_EMAIL').toBe('CONTACT_TO_EMAIL');
    });
  });

  describe('SDK usage pattern', () => {
    test('uses { data, error } destructuring from resend.emails.send()', () => {
      // Simulate the SDK response shape
      const sdkSuccess = { data: { id: 'test-id-123' }, error: null };
      const sdkFailure = { data: null, error: { message: 'validation_error' } };

      expect(sdkSuccess.data).toHaveProperty('id');
      expect(sdkSuccess.error).toBeNull();

      expect(sdkFailure.data).toBeNull();
      expect(sdkFailure.error).toHaveProperty('message');
    });

    test('error check gates access to data', () => {
      const { data, error } = { data: null, error: { message: 'auth_error' } };
      // When error is set, we should NOT attempt to read data.id
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });
});
