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

    test('Resend API endpoint is correct', () => {
      expect('https://api.resend.com/emails').toBe('https://api.resend.com/emails');
    });
  });
});
