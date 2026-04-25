# HTTP API Reference

The Personal-Finance-Website server exposes a small JSON HTTP API on top of its
Express application. This document describes the routes, request/response shapes,
and the conventions every endpoint follows.

## Conventions

- All endpoints accept and return `application/json`.
- Authenticated endpoints expect a `session` cookie set by `POST /auth/login`.
- Timestamps are ISO-8601 strings in UTC (`2026-04-25T18:30:00Z`).
- Money amounts are integers in **cents** to avoid floating-point drift.
- All endpoints return one of these top-level shapes:

```json
{ "ok": true, "data": ... }
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

The `error.code` field is a stable enum suitable for client branching; the
`message` is a human-readable description that may change between releases.

## Authentication

### `POST /auth/register`

Create a new user account. Public.

Request:

```json
{ "email": "user@example.com", "password": "...", "displayName": "Casey" }
```

Response: `201 Created` with the user's public profile and a session cookie set.

### `POST /auth/login`

Exchange credentials for a session cookie. Public.

Request:

```json
{ "email": "user@example.com", "password": "..." }
```

Response: `200 OK` and a `session` cookie. `401 Unauthorized` on bad credentials.

### `POST /auth/logout`

Invalidate the current session cookie. Authenticated.

## Budgets

### `GET /api/budgets`

List the current user's budgets. Authenticated.

Response:

```json
{
  "ok": true,
  "data": [
    { "id": "b_42", "name": "Groceries", "limitCents": 40000, "spentCents": 12350,
      "period": "monthly", "createdAt": "2026-03-01T00:00:00Z" }
  ]
}
```

### `POST /api/budgets`

Create a budget. Authenticated.

Request:

```json
{ "name": "Coffee", "limitCents": 5000, "period": "monthly" }
```

### `PATCH /api/budgets/:id`

Update a budget's name, limit, or period. Authenticated.

### `DELETE /api/budgets/:id`

Soft-delete a budget. The historical spend is retained for reporting.

## Expenses

### `GET /api/expenses`

List expenses with optional filtering. Authenticated.

Query parameters:

| Name        | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| `from`      | ISO date| Inclusive lower bound on `occurredAt`      |
| `to`        | ISO date| Exclusive upper bound on `occurredAt`      |
| `budgetId`  | string  | Restrict to one budget                     |
| `limit`     | int     | Page size, default 50, max 200             |
| `cursor`    | string  | Opaque cursor returned by the previous page|

Response includes `nextCursor` if more results are available.

### `POST /api/expenses`

Record a new expense. Authenticated.

Request:

```json
{
  "budgetId": "b_42",
  "amountCents": 1299,
  "merchant": "Trader Joe's",
  "occurredAt": "2026-04-25T17:42:00Z",
  "note": "weekly haul"
}
```

### `DELETE /api/expenses/:id`

Remove an expense. Authenticated.

## Reports

### `GET /api/reports/summary`

Aggregate spending in a window. Authenticated. Backs the dashboard charts.

Query parameters:

- `from` / `to` — required, define the window.
- `groupBy` — one of `day`, `week`, `month`. Default `week`.

Response:

```json
{
  "ok": true,
  "data": {
    "totalCents": 152340,
    "buckets": [
      { "label": "2026-W15", "spentCents": 38210 },
      { "label": "2026-W16", "spentCents": 41095 }
    ],
    "byBudget": [
      { "budgetId": "b_42", "spentCents": 30900 }
    ]
  }
}
```

### `GET /api/reports/leaderboard`

Top savers among friends. Authenticated.

## Error codes

| Code              | HTTP | Meaning                                      |
|-------------------|------|----------------------------------------------|
| `UNAUTHENTICATED` | 401  | Missing or invalid session cookie            |
| `FORBIDDEN`       | 403  | Authenticated but not allowed for this action |
| `NOT_FOUND`       | 404  | Resource does not exist or is not visible    |
| `VALIDATION`      | 422  | Request body failed schema validation        |
| `RATE_LIMITED`    | 429  | Too many requests; retry after `Retry-After`|
| `INTERNAL`        | 500  | Unexpected server error; safe to retry once  |
