# Email (Resend) — Deploy and Test

## Checklist

- [x] **Extract email provider documentation** — See [docs/RESEND_EMAIL_GUIDE.md](./RESEND_EMAIL_GUIDE.md).
- [x] **Confirm API keys and credentials** — Use [Resend API keys](https://resend.com/api-keys) and [verify your domain](https://resend.com/domains).
- [x] **Store credentials in environment variables** — `RESEND_API_KEY` (required); `RESEND_FROM` (optional, e.g. `"Name <notifications@your-domain.com>"`).
- [x] **Test connection** — Use the “Test connection” button in **Settings → Email (Resend)** (sends to `delivered@resend.dev`).
- [x] **Minimal email endpoint** — `POST /api/send-email` (see below).
- [x] **Frontend form** — **Settings** page, **Email (Resend)** card: test connection + send form.
- [ ] **Deploy to preview** — Deploy to Vercel (or your host) and set env vars.
- [ ] **Test** — In preview, open Settings → Email (Resend) → Test connection, then send a test email.

---

## Environment variables

| Variable           | Required | Description |
|-------------------|----------|-------------|
| `RESEND_API_KEY`  | Yes      | Resend API key (create at [resend.com/api-keys](https://resend.com/api-keys)). |
| `RESEND_FROM`     | No       | Sender for all emails. Default: `AI Clearinghouse <onboarding@resend.dev>`. For production, use a [verified domain](https://resend.com/domains), e.g. `"Your App <notifications@yourdomain.com>"`. |

- **Local:** e.g. `.env` in project root or in Vercel CLI (`vercel env pull`). Do not commit real keys.
- **Vercel:** Project → Settings → Environment Variables. Add `RESEND_API_KEY` (and optionally `RESEND_FROM`) for Preview and Production.

---

## Install dependency

From the project root:

```bash
npm install resend
```

---

## API: `POST /api/send-email`

- **Send email:**  
  `POST /api/send-email`  
  Body: `{ "to": "a@b.com" | ["a@b.com", "b@b.com"], "subject": "...", "html": "...", "text": "..." }`  
  Response: `{ "ok": true, "id": "..." }` or `{ "ok": false, "error": "..." }`.

- **Test connection:**  
  `POST /api/send-email`  
  Body: `{ "test": true }`  
  Sends one test email to `delivered@resend.dev`.  
  Response: `{ "ok": true, "message": "Test email sent", "id": "..." }` or error.

---

## Vercel: register the function

In **vercel.json**, ensure the send-email function is listed:

```json
{
  "functions": {
    "api/chat.js": { "maxDuration": 60 },
    "api/protected.js": { "maxDuration": 10 },
    "api/send-email.js": { "maxDuration": 10 }
  }
}
```

---

## Local development

The frontend calls `/api/send-email`. For local dev you can:

- Run **Vercel Dev**: `npx vercel dev` — serves the app and API under one origin so `/api/send-email` works.
- Or configure Vite to proxy `/api` to your API server (if you run one separately).

---

## Deploy to preview

1. Install dependency: `npm install resend`.
2. Set env vars in Vercel (Preview/Production): `RESEND_API_KEY`, optionally `RESEND_FROM`.
3. Deploy: e.g. push to your branch and use Vercel’s preview deployment, or run `vercel`.
4. Open the preview URL → **Settings** → **Email (Resend)**.

---

## Test

1. **Test connection**  
   Click **Test connection**. You should see success and (optionally) receive a test email at the Resend test inbox.

2. **Send email**  
   Fill **To**, **Subject**, and **Body**, then **Send email**. Check the recipient inbox and that the UI shows success.

3. **Production**  
   For production, set `RESEND_FROM` to a verified domain and do not use `onboarding@resend.dev`.
