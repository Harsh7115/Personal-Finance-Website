# Security Guide

BudgetMasters handles personal financial data, so security is a first-class
concern. This document covers the threat model, current mitigations, and
hardening recommendations for self-hosted deployments.

---

## 1. Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Unauthenticated data access | High | Session-based auth on every API route |
| Credential stuffing | Medium | Rate-limit login endpoint; add lockout after N failures |
| XSS via user input | High | Escape all user-supplied values before rendering |
| NoSQL injection | High | Mongoose schema validation; avoid raw query operators from req body |
| Sensitive data in logs | Medium | Never log request bodies containing amounts or usernames |
| Exposed .env in VCS | Critical | .env is gitignored; use .env.example as template |
| CSRF | Low–Medium | SameSite cookies; add CSRF token for state-mutating routes |
| Insecure dependencies | Medium | Run `npm audit` in CI; pin exact versions in production |

---

## 2. Authentication

BudgetMasters currently uses a **username-only quick-access** model for
prototyping. Before deploying to production:

1. **Add password hashing** — use `bcrypt` (cost factor ≥ 12):

   ```js
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash(plaintextPassword, 12);
   // Store hash, never plaintext
   const match = await bcrypt.compare(candidate, storedHash);
   ```

2. **Use signed HTTP-only sessions** — configure `express-session` with a
   strong secret, `httpOnly: true`, and `secure: true` (HTTPS only):

   ```js
   app.use(session({
     secret: process.env.SESSION_SECRET,   // 32+ random bytes
     resave: false,
     saveUninitialized: false,
     cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 86400_000 }
   }));
   ```

3. **Protect every API route** with an auth middleware:

   ```js
   function requireAuth(req, res, next) {
     if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
     next();
   }
   router.get('/budgets', requireAuth, budgetController.list);
   ```

---

## 3. Input Validation & NoSQL Injection

Mongoose schemas implicitly reject unknown fields, but raw MongoDB operators
can still be injected through request bodies if you spread `req.body` into a
query.

**Never do this:**
```js
// Vulnerable — attacker can pass { password: { $gt: '' } }
User.findOne(req.body);
```

**Do this instead:**
```js
// Safe — only use known, typed fields
User.findOne({ username: String(req.body.username) });
```

Use [express-validator](https://express-validator.github.io) to validate and
sanitize every inbound field:

```js
const { body, validationResult } = require('express-validator');

router.post('/expenses',
  body('amount').isFloat({ min: 0.01, max: 1_000_000 }),
  body('category').isIn(VALID_CATEGORIES),
  body('date').isISO8601(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // safe to proceed
  }
);
```

---

## 4. Environment Variables

All secrets live in `.env` (gitignored). Required variables:

| Variable | Example | Notes |
|----------|---------|-------|
| `MONGO_URI` | `mongodb://localhost/budgetmasters` | Never commit real Atlas URI |
| `SESSION_SECRET` | 32-byte random hex string | Rotate if compromised |
| `PORT` | `3000` | Non-sensitive |
| `NODE_ENV` | `production` | Enables secure cookie, disables stack traces |

Generate a strong secret with:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. HTTP Security Headers

Add [helmet](https://helmetjs.github.io/) to set security headers
automatically:

```sh
npm install helmet
```

```js
const helmet = require('helmet');
app.use(helmet());          // sets CSP, HSTS, X-Frame-Options, etc.
```

Recommended Content-Security-Policy for this app:

```
default-src 'self';
script-src  'self' https://d3js.org;
style-src   'self' 'unsafe-inline';
img-src     'self' data:;
connect-src 'self';
```

---

## 6. Rate Limiting

Prevent brute-force and scraping with
[express-rate-limit](https://www.npmjs.com/package/express-rate-limit):

```js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/auth/login', loginLimiter);
```

---

## 7. Dependency Auditing

```sh
# Check for known vulnerabilities
npm audit

# Auto-fix non-breaking issues
npm audit fix

# Review remaining issues manually
npm audit --json | jq '.vulnerabilities | keys'
```

Pin exact versions in `package.json` (`"express": "4.18.2"` not `"^4"`) and
run `npm audit` as a required CI step.

---

## 8. Reporting a Vulnerability

If you discover a security issue, please **do not open a public GitHub issue**.
Email the maintainer directly with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 72 hours.
