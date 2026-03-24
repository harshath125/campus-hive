# 🔐 Authentication Guide — Campus Hive

## Overview

Campus Hive uses **JWT (JSON Web Tokens)** for stateless authentication. All protected API routes require a `Bearer` token in the `Authorization` header.

---

## Tech Stack

| Component | Library |
|-----------|---------|
| Framework | Flask-JWT-Extended |
| Hash | Flask-Bcrypt (bcrypt, work factor 12) |
| Algorithm | HS256 |
| Expiry | 24 hours |
| Secret | `SECRET_KEY` in `.env` |

---

## 1 · Register a New Student

**POST** `/api/auth/signup`

### Request
```json
{
  "name": "Priya Sharma",
  "email": "priya@anits.edu.in",
  "password": "StrongPass123!",
  "branch": "CSE",
  "section": "3-A",
  "year": 3,
  "tags": ["Python", "AI/ML"]
}
```

### Success Response `201`
```json
{
  "message": "User registered successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses
| Code | Reason |
|------|--------|
| `409` | Email already registered |
| `400` | Missing required fields |

---

## 2 · Login

**POST** `/api/auth/login`

### Request
```json
{
  "email": "priya@anits.edu.in",
  "password": "StrongPass123!"
}
```

### Success Response `200`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Priya Sharma",
    "email": "priya@anits.edu.in",
    "branch": "CSE",
    "section": "3-A",
    "year": 3,
    "tags": ["Python", "AI/ML"]
  }
}
```

### Error Responses
| Code | Reason |
|------|--------|
| `401` | Invalid email or password |
| `400` | Missing fields |

---

## 3 · Using the Token

After login, store the token and send it with every protected request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend (React fetch example)
```typescript
const login = async (email: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  localStorage.setItem('token', data.access_token);  // save token
};

// Authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};
```

---

## 4 · Get User Profile

**GET** `/api/auth/me`  
*Requires: Bearer token*

### Success Response `200`
```json
{
  "id": 1,
  "name": "Priya Sharma",
  "email": "priya@anits.edu.in",
  "branch": "CSE",
  "section": "3-A",
  "year": 3,
  "tags": ["Python", "AI/ML"],
  "created_at": "2026-02-15T10:30:00Z"
}
```

---

## 5 · Update Profile

**PUT** `/api/auth/me`  
*Requires: Bearer token*

### Request (partial updates supported)
```json
{
  "name": "Priya S.",
  "bio": "Passionate about machine learning!",
  "tags": ["Python", "AI/ML", "Hackathons"],
  "branch": "CSE",
  "section": "3-A",
  "year": 3
}
```

### Success Response `200`
```json
{
  "message": "Profile updated",
  "user": { ...updated user object... }
}
```

---

## 6 · JWT Token Anatomy

A JWT looks like: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (alg + type)
.
eyJzdWIiOiIxIiwiZXhwIjoxNzA4OTg1MjAwfQ ← Payload (user id, expiry)
.
xNOvALT8H7H1mEfvXlGcqZhQvCzFk8Dj5C...  ← Signature (HMAC-SHA256)
```

Decode at: https://jwt.io — paste your token to see contents.

The payload contains:
```json
{
  "sub": "1",            ← user id
  "exp": 1708985200,     ← unix timestamp expiry
  "iat": 1708898800      ← issued at
}
```

---

## 7 · Token Expiry

Tokens expire **24 hours** after issue. The frontend should:

1. Catch `401 Unauthorized` responses
2. Redirect user to `/login`
3. Clear stored token

---

## 8 · Admin Authentication

Admin login uses the same endpoint:

**POST** `/api/auth/login`

Admin accounts have `is_admin: true` in their database record. The frontend checks this flag and routes to `/admin` instead of `/dashboard`.

---

## 9 · Anonymous Routes (No Auth Required)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/health` | GET | None | Server health check |
| `/api/auth/signup` | POST | None | Create student account |
| `/api/auth/login` | POST | None | Login → JWT token |
| `/api/auth/me` | GET | JWT | Get current user |
| `/api/auth/me` | PUT | JWT | Update profile |

---

## 10 · Security Notes

- Passwords are **never stored in plain text** — only bcrypt hashes
- Tokens are **stateless** — no server-side session database needed
- The `SECRET_KEY` in `.env` must be rotated for production
- CORS is pre-configured to allow `http://localhost:3000` and `http://localhost:5173`
