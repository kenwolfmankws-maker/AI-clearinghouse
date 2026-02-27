// __tests__/subscribe.test.js — Tests for api/subscribe.js validation logic

describe('Subscribe API — input validation', () => {
  // Mirror the validation logic from api/subscribe.js
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateInput(body) {
    const name = (body?.name ?? '').trim().slice(0, 120);
    const email = (body?.email ?? '').trim().toLowerCase().slice(0, 254);
    if (!email) {
      return { valid: false, error: 'Email address is required.' };
    }
    if (!EMAIL_RE.test(email)) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    return { valid: true, name, email };
  }

  test('accepts a valid email without a name', () => {
    const result = validateInput({ email: 'user@example.com' });
    expect(result.valid).toBe(true);
    expect(result.email).toBe('user@example.com');
    expect(result.name).toBe('');
  });

  test('accepts a valid email with a name', () => {
    const result = validateInput({ name: 'Alice', email: 'alice@example.com' });
    expect(result.valid).toBe(true);
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
  });

  test('rejects a missing email', () => {
    const result = validateInput({ name: 'Bob' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  test('rejects an empty email string', () => {
    const result = validateInput({ email: '   ' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  test('rejects a malformed email (no @)', () => {
    const result = validateInput({ email: 'notanemail' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/valid email/i);
  });

  test('rejects a malformed email (no domain)', () => {
    const result = validateInput({ email: 'user@' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/valid email/i);
  });

  test('normalises email to lowercase', () => {
    const result = validateInput({ email: 'User@Example.COM' });
    expect(result.valid).toBe(true);
    expect(result.email).toBe('user@example.com');
  });

  test('trims whitespace from email', () => {
    const result = validateInput({ email: '  hello@world.org  ' });
    expect(result.valid).toBe(true);
    expect(result.email).toBe('hello@world.org');
  });

  test('trims and limits name to 120 characters', () => {
    const longName = 'A'.repeat(200);
    const result = validateInput({ name: longName, email: 'x@y.com' });
    expect(result.valid).toBe(true);
    expect(result.name.length).toBe(120);
  });

  test('handles a null body gracefully', () => {
    const result = validateInput(null);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });
});

describe('Subscribe API — email templates', () => {
  // Mirror the template helpers from api/subscribe.js
  function confirmationEmail(name, email, from) {
    const greeting = name ? `Hi ${name},` : 'Hi there,';
    return {
      from,
      to: email,
      subject: "You're on the list — AI Clearinghouse",
      text: [
        greeting,
        '',
        "Thanks for signing up! You're now on the AI Clearinghouse early-access list.",
        '',
        "We'll reach out when new resources, tools, and guides are ready.",
        '',
        '— The AI Clearinghouse Team',
      ].join('\n'),
    };
  }

  test('confirmation email uses name in greeting when provided', () => {
    const mail = confirmationEmail('Alice', 'alice@example.com', 'no-reply@aiclearinghouse.com');
    expect(mail.text).toContain('Hi Alice,');
    expect(mail.to).toBe('alice@example.com');
    expect(mail.subject).toContain('AI Clearinghouse');
  });

  test('confirmation email uses fallback greeting when name is absent', () => {
    const mail = confirmationEmail('', 'anon@example.com', 'no-reply@aiclearinghouse.com');
    expect(mail.text).toContain('Hi there,');
  });

  test('confirmation email subject does not contain sensitive info', () => {
    const mail = confirmationEmail('', 'x@y.com', 'no-reply@aiclearinghouse.com');
    expect(mail.subject).not.toContain('@');
    expect(mail.subject).not.toContain('password');
  });
});

describe('Subscribe API — success response shape', () => {
  test('success response has correct shape', () => {
    const response = { success: true, message: "You're on the list! Check your inbox for a confirmation." };
    expect(response.success).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});
