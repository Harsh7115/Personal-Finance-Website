# API Reference — Personal Finance Website

The backend exposes a REST API built on **Node.js + Express**. All endpoints return JSON. Authentication uses session cookies set by the `/auth` routes.

Base URL (local dev): `http://localhost:3000/api`

---

## Authentication

### POST /auth/register
Create a new user account.

**Request body**
```json
{
  "username": "harshj",
  "email": "harsh@example.com",
  "password": "s3cur3P@ss"
}
```

**Response 201**
```json
{ "message": "Account created", "userId": "64b3f..." }
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Missing / invalid fields |
| 409 | Email already registered |

---

### POST /auth/login
Start a new session.

**Request body**
```json
{ "email": "harsh@example.com", "password": "s3cur3P@ss" }
```

**Response 200** — sets `connect.sid` session cookie.
```json
{ "message": "Logged in", "username": "harshj" }
```

---

### POST /auth/logout
Destroy the current session. Returns `200 { "message": "Logged out" }`.

---

## Expenses

### GET /expenses
Return all expenses for the authenticated user, sorted by date descending.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category (e.g. `food`, `rent`) |
| `from` | ISO date | Start of date range (inclusive) |
| `to` | ISO date | End of date range (inclusive) |
| `limit` | number | Max records (default 50) |
| `skip` | number | Pagination offset (default 0) |

**Response 200**
```json
{
  "total": 3,
  "expenses": [
    {
      "_id": "64c1a...",
      "amount": 42.50,
      "category": "food",
      "note": "Groceries",
      "date": "2026-03-20T00:00:00.000Z",
      "createdAt": "2026-03-20T14:32:11.000Z"
    }
  ]
}
```

---

### POST /expenses
Add a new expense.

**Request body**
```json
{
  "amount": 42.50,
  "category": "food",
  "note": "Groceries",
  "date": "2026-03-20"
}
```

**Response 201** — returns the created expense document.

---

### PUT /expenses/:id
Update an existing expense by ID. Accepts the same fields as POST; all are optional.

**Response 200** — returns the updated document.

---

### DELETE /expenses/:id
Delete an expense by ID. **Response 200** `{ "message": "Deleted" }`.

---

## Budgets

### GET /budgets
List all budget targets for the current user.

**Response 200**
```json
[
  { "_id": "...", "category": "food", "limit": 400, "month": "2026-03" },
  { "_id": "...", "category": "transport", "limit": 150, "month": "2026-03" }
]
```

---

### POST /budgets
Set a budget limit for a category and month.

```json
{ "category": "food", "limit": 400, "month": "2026-03" }
```

Returns **201** with the created budget object.

---

### DELETE /budgets/:id
Remove a budget entry. Returns **200** `{ "message": "Removed" }`.

---

## Summary / Analytics

### GET /summary
Return aggregated spending totals for the current month grouped by category. Used to power the D3.js pie chart on the dashboard.

**Response 200**
```json
{
  "month": "2026-03",
  "totalSpent": 1230.75,
  "byCategory": [
    { "category": "rent",      "total": 800.00 },
    { "category": "food",      "total": 230.50 },
    { "category": "transport", "total": 120.25 },
    { "category": "other",     "total":  80.00 }
  ]
}
```

---

### GET /summary/monthly
Return month-over-month totals for the past 6 months (used for the bar/line chart).

**Response 200**
```json
[
  { "month": "2025-10", "total": 980.00 },
  { "month": "2025-11", "total": 1105.50 },
  { "month": "2025-12", "total": 1430.25 },
  { "month": "2026-01", "total": 1020.00 },
  { "month": "2026-02", "total": 995.75 },
  { "month": "2026-03", "total": 1230.75 }
]
```

---

## Leaderboard

### GET /leaderboard
Return the savings leaderboard — ranked by (income − spending) for the current month across all users. Usernames are shown; amounts are private.

**Response 200**
```json
[
  { "rank": 1, "username": "alice",  "savedPct": 42 },
  { "rank": 2, "username": "harshj", "savedPct": 31 },
  { "rank": 3, "username": "bob",    "savedPct": 18 }
]
```

---

## Error format

All error responses share the same shape:
```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

Common `code` values: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.
