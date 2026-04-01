# BudgetMasters — REST API Reference

Base URL: `http://localhost:3000/api`

All request and response bodies use **JSON**.  Endpoints that require an
authenticated session expect the session cookie set by `POST /auth/login`
to be present on the request.

---

## Table of Contents

- [Authentication](#authentication)
- [Budgets](#budgets)
- [Expenses](#expenses)
- [Analytics](#analytics)
- [Leaderboard](#leaderboard)
- [Error responses](#error-responses)

---

## Authentication

### POST /auth/register

Create a new user account.

**Request body**

| Field      | Type   | Required | Description          |
|------------|--------|----------|----------------------|
| `username` | string | ✓        | 3–30 characters      |
| `password` | string | ✓        | minimum 6 characters |

**Response 201**

```json
{
  "message": "Account created",
  "userId": "64a1f2c3d4e5f6a7b8c9d0e1"
}
```

**Response 409** — username already taken

---

### POST /auth/login

Start a session for an existing user.

**Request body**

| Field      | Type   | Required |
|------------|--------|----------|
| `username` | string | ✓        |
| `password` | string | ✓        |

**Response 200**

```json
{ "message": "Logged in", "username": "alice" }
```

Sets a `connect.sid` session cookie valid for the browser session.

**Response 401** — invalid credentials

---

### POST /auth/logout

Destroy the current session.

**Response 200**

```json
{ "message": "Logged out" }
```

---

## Budgets

### GET /budgets

List all budgets for the authenticated user.

**Response 200**

```json
[
  {
    "_id": "64b2a3c4d5e6f7a8b9c0d1e2",
    "name": "Groceries",
    "category": "Food",
    "limit": 400,
    "spent": 137.50,
    "month": "2025-03",
    "createdAt": "2025-03-01T00:00:00.000Z"
  }
]
```

---

### POST /budgets

Create a new budget.

**Request body**

| Field      | Type   | Required | Description                   |
|------------|--------|----------|-------------------------------|
| `name`     | string | ✓        | Display name                  |
| `category` | string | ✓        | e.g. "Food", "Transport"      |
| `limit`    | number | ✓        | Monthly spend cap (USD cents) |
| `month`    | string |          | ISO month `YYYY-MM` (default: current month) |

**Response 201**

```json
{
  "_id": "64b2a3c4d5e6f7a8b9c0d1e2",
  "name": "Groceries",
  "category": "Food",
  "limit": 400,
  "spent": 0,
  "month": "2025-03"
}
```

---

### PATCH /budgets/:id

Update an existing budget's limit or name.

**Request body** (all fields optional)

| Field    | Type   | Description      |
|----------|--------|------------------|
| `name`   | string | New display name |
| `limit`  | number | New spend cap    |

**Response 200** — updated budget object

**Response 404** — budget not found or not owned by user

---

### DELETE /budgets/:id

Delete a budget and all associated expenses.

**Response 204** — no content

---

## Expenses

### GET /expenses

List expenses, with optional filters.

**Query parameters**

| Parameter    | Type   | Description                          |
|--------------|--------|--------------------------------------|
| `category`   | string | Filter by category                   |
| `budgetId`   | string | Filter by parent budget              |
| `from`       | string | ISO date — earliest transaction date |
| `to`         | string | ISO date — latest transaction date   |
| `limit`      | number | Max results (default 50, max 200)    |
| `skip`       | number | Pagination offset (default 0)        |

**Response 200**

```json
{
  "total": 12,
  "expenses": [
    {
      "_id": "64c3b4d5e6f7a8b9c0d1e2f3",
      "budgetId": "64b2a3c4d5e6f7a8b9c0d1e2",
      "description": "Whole Foods run",
      "amount": 67.43,
      "category": "Food",
      "date": "2025-03-14T18:22:00.000Z"
    }
  ]
}
```

---

### POST /expenses

Log a new expense and update the parent budget's `spent` total.

**Request body**

| Field         | Type   | Required | Description               |
|---------------|--------|----------|---------------------------|
| `budgetId`    | string | ✓        | Parent budget `_id`       |
| `description` | string | ✓        | Short note                |
| `amount`      | number | ✓        | Amount in dollars         |
| `category`    | string |          | Overrides budget category |
| `date`        | string |          | ISO date (default: now)   |

**Response 201** — created expense object

**Response 400** — amount exceeds remaining budget

---

### DELETE /expenses/:id

Delete an expense and subtract its amount from the parent budget.

**Response 204** — no content

---

## Analytics

### GET /analytics/summary

Return spending totals grouped by category for the requested month.

**Query parameters**

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `month`   | string | ISO month `YYYY-MM` (default: current) |

**Response 200**

```json
{
  "month": "2025-03",
  "totalSpent": 843.17,
  "byCategory": {
    "Food":      137.50,
    "Transport":  95.00,
    "Housing":   610.67
  }
}
```

---

### GET /analytics/trend

Return daily spend totals for the last N days (for D3 line chart).

**Query parameters**

| Parameter | Type   | Description             |
|-----------|--------|-------------------------|
| `days`    | number | Lookback window (1–365, default 30) |

**Response 200**

```json
[
  { "date": "2025-03-01", "total": 42.10 },
  { "date": "2025-03-02", "total": 0 },
  { "date": "2025-03-03", "total": 123.45 }
]
```

---

## Leaderboard

### GET /leaderboard

Return the top 10 users ranked by savings rate for the current month.
Savings rate = `(income - spent) / income`.  Users with no income set
are excluded.

**Response 200**

```json
[
  { "rank": 1, "username": "alice", "savingsRate": 0.42 },
  { "rank": 2, "username": "bob",   "savingsRate": 0.38 }
]
```

---

## Error responses

All errors follow a consistent shape:

```json
{
  "error": "Human-readable message",
  "code":  "MACHINE_READABLE_CODE"
}
```

| HTTP Status | Code                  | Meaning                          |
|-------------|-----------------------|----------------------------------|
| 400         | `VALIDATION_ERROR`    | Missing or invalid field         |
| 401         | `UNAUTHENTICATED`     | No valid session                 |
| 403         | `FORBIDDEN`           | Resource belongs to another user |
| 404         | `NOT_FOUND`           | Resource does not exist          |
| 409         | `CONFLICT`            | Duplicate (e.g. username taken)  |
| 500         | `INTERNAL_ERROR`      | Unexpected server error          |
