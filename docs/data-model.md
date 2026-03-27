# Personal Finance Website — Data Model

This document describes the MongoDB collections used by the Express backend.
All schemas are defined with Mongoose and live in `budget-masters/models/`.

---

## Collections

### users

Stores authenticated user accounts.

```js
{
  _id:       ObjectId,          // auto-generated
  username:  String,            // unique, required, 3–30 chars
  email:     String,            // unique, required, lowercase
  password:  String,            // bcrypt hash (≥10 rounds), never returned in API responses
  createdAt: Date,              // set on insert
  updatedAt: Date               // set on every save
}
```

**Indexes**
- `{ email: 1 }` — unique
- `{ username: 1 }` — unique

---

### expenses

Each document records a single spending event for a user.

```js
{
  _id:         ObjectId,
  userId:      ObjectId,        // ref: users._id  (required)
  amount:      Number,          // positive, in USD, required
  category:    String,          // e.g. "Food", "Transport", "Utilities" — required
  description: String,          // optional free-text note (max 200 chars)
  date:        Date,            // the day the expense occurred, required
  createdAt:   Date,
  updatedAt:   Date
}
```

**Indexes**
- `{ userId: 1, date: -1 }` — primary query pattern (all expenses for a user, newest first)
- `{ userId: 1, category: 1 }` — for category-filtered queries and budget roll-ups

---

### budgets

Defines a monthly spending cap per category for a user.

```js
{
  _id:      ObjectId,
  userId:   ObjectId,           // ref: users._id  (required)
  category: String,             // must match a known expense category, required
  limit:    Number,             // monthly cap in USD, positive, required
  month:    String,             // "YYYY-MM" format, required
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**
- `{ userId: 1, month: 1, category: 1 }` — unique; one budget per (user, month, category)

---

## Relationships

```
users (1) ──────< expenses (many)
users (1) ──────< budgets  (many)
```

Expenses and budgets are linked to users via `userId`. There are no foreign-key
constraints at the database level (MongoDB); referential integrity is enforced in
the Express route handlers.

---

## Aggregation Patterns

### Monthly expense total per category

Used by the `GET /api/reports/monthly` endpoint:

```js
db.expenses.aggregate([
  { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort:  { total: -1 } }
])
```

### Budget vs. actual for a given month

Joins budgets with the aggregated expense totals using `$lookup`:

```js
db.budgets.aggregate([
  { $match: { userId, month } },
  {
    $lookup: {
      from:     "expenses",
      let:      { cat: "$category" },
      pipeline: [
        { $match: { $expr: { $and: [
            { $eq:  ["$userId",   userId]    },
            { $eq:  ["$category", "$$cat"]   },
            { $gte: ["$date",     monthStart] },
            { $lt:  ["$date",     monthEnd]  }
        ]}}},
        { $group: { _id: null, spent: { $sum: "$amount" } } }
      ],
      as: "usage"
    }
  },
  {
    $project: {
      category:  1,
      limit:     1,
      spent:     { $ifNull: [{ $arrayElemAt: ["$usage.spent", 0] }, 0] },
      remaining: { $subtract: ["$limit", { $ifNull: [{ $arrayElemAt: ["$usage.spent", 0] }, 0] }] }
    }
  }
])
```

### Savings leaderboard

```js
// Requires a separate "income" field or a fixed income assumption per user.
// Current implementation uses a fixed monthly income stored in users.monthlyIncome.
db.expenses.aggregate([
  { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
  { $group: { _id: "$userId", totalSpent: { $sum: "$amount" } } },
  {
    $lookup: {
      from:         "users",
      localField:   "_id",
      foreignField: "_id",
      as:           "user"
    }
  },
  { $unwind: "$user" },
  {
    $project: {
      username:   "$user.username",
      netSavings: { $subtract: ["$user.monthlyIncome", "$totalSpent"] }
    }
  },
  { $sort: { netSavings: -1 } },
  { $limit: 10 }
])
```

---

## Notes

- All monetary values are stored as plain `Number` (float64). For production use,
  consider storing integer cents to avoid floating-point rounding errors.
- The `date` field on expenses is stored as a UTC midnight `Date` object. The
  frontend sends `YYYY-MM-DD` strings which the API coerces with `new Date(dateStr)`.
- Passwords are **never** returned in any API response. The User Mongoose schema
  uses a `transform` to strip the `password` field from all serialised outputs.
