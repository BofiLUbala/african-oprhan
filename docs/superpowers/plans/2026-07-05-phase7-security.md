# Phase 7: Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Orphenlina application with a global token-refresh wrapper, server-side rate limiting, and production security headers.

**Architecture:** Three layers — (1) a single `apiFetch` utility in the React frontend that transparently refreshes JWTs and retries, replacing 30 scattered 401 handlers; (2) DRF throttle classes on the backend with strict limits on the login/token endpoint; (3) Django security middleware configured for production-grade HTTP headers.

**Tech Stack:** React 18 + Vite (frontend), Django 4.2 + DRF + SimpleJWT (backend)

## Global Constraints

- `const API = 'http://localhost:8000/api'` is used in `frontend/src/App.jsx` — do not change this constant
- All secrets must come from environment variables — never hardcode values
- Do not add external libraries unless clearly listed in this plan
- No migration of tech stack
- `App.jsx` is a monolith (~9100 lines) — do not split it into multiple files
- CSS variable system: use `var(--bg-card)`, `var(--text-body)`, etc. — no hardcoded colors
- `onLogout` is a prop passed into `DashboardShell` — always call `onLogout()` when a session expires beyond recovery

---

### Task 1: Global `apiFetch` utility in frontend

**Files:**
- Modify: `frontend/src/App.jsx` (lines ~73–90 startup block and ~840–860 notification fetch block, plus ~30 scattered `status === 401` sites)

**Context:**
- `localStorage.getItem('access_token')` and `localStorage.getItem('refresh_token')` are the token stores
- `API` constant is `'http://localhost:8000/api'` (defined at top of file)
- `onLogout` is in scope inside `DashboardShell` as a prop
- A local `fetchWithAuth` already exists inside one `useEffect` at lines ~1617–1631 — this task elevates it to module scope

**What to build:**
Add a module-level `apiFetch` function immediately after the `const API = 'http://localhost:8000/api'` line. It must:
1. Read `access_token` from `localStorage`
2. Make the request with `Authorization: Bearer <access>`
3. If response is 401: read `refresh_token`, POST to `${API}/token/refresh/`, if successful save new `access` to `localStorage` and retry the original request once
4. If refresh fails (non-ok response or no refresh token): call a passed-in `onLogout` callback and return `null`
5. Return the `Response` object (or `null` on unrecoverable 401)

**Exact function signature to place right after `const API = ...`:**

```js
async function apiFetch(url, options = {}, onLogout = null) {
  const access = localStorage.getItem('access_token')
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${access}` }
  let res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      const refRes = await fetch(`${API}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (refRes.ok) {
        const tokens = await refRes.json()
        localStorage.setItem('access_token', tokens.access)
        const retryHeaders = { ...(options.headers || {}), Authorization: `Bearer ${tokens.access}` }
        res = await fetch(url, { ...options, headers: retryHeaders })
        return res
      }
    }
    if (onLogout) onLogout()
    return null
  }
  return res
}
```

**Migration — replace ALL 30 call sites:**

The pattern to replace is:
```js
// OLD pattern A — fetch with inline 401 logout
.then(r => { if (r.status === 401) { onLogout(); return ...; } return r.json() })
```
and:
```js
// OLD pattern B — if (res.status === 401) { onLogout(); return }
```
and the local `fetchWithAuth` inside the document-loading useEffect (~line 1617).

Replace every site with `apiFetch(url, options, onLogout)` and remove the manual 401 check that follows. Keep all `r.ok` checks — those are not 401 guards.

**Test plan:**

- [ ] **Step 1: Add `apiFetch` after `const API`**

  Find the exact line:
  ```js
  const API = 'http://localhost:8000/api'
  ```
  Insert the full function block above immediately after it (the block from Context above).

- [ ] **Step 2: Replace all manual 401 patterns**

  Search `App.jsx` for each occurrence of `status === 401` (there are ~30). For each:

  **Pattern A** (fetch then 401 check):
  ```js
  // BEFORE
  const token = localStorage.getItem('access_token')
  fetch(`${API}/some-endpoint/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (r.status === 401) { onLogout(); return []; } return r.json() })
    .then(data => setSomeState(data))

  // AFTER
  apiFetch(`${API}/some-endpoint/`, {}, onLogout)
    .then(r => r && r.ok ? r.json() : [])
    .then(data => setSomeState(data))
  ```

  **Pattern B** (await with 401 check):
  ```js
  // BEFORE
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API}/some-endpoint/`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) { onLogout(); return }

  // AFTER
  const res = await apiFetch(`${API}/some-endpoint/`, {}, onLogout)
  if (!res) return
  ```

  **POST/PATCH/DELETE with body** (add `method` and `body` to options):
  ```js
  // BEFORE
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API}/endpoint/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (res.status === 401) { onLogout(); return }

  // AFTER
  const res = await apiFetch(`${API}/endpoint/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, onLogout)
  if (!res) return
  ```

  Replace the local `fetchWithAuth` function inside the document-loading useEffect with direct calls to `apiFetch`.

- [ ] **Step 3: Verify no `status === 401` remains**

  ```
  grep -c "status === 401" frontend/src/App.jsx
  ```
  Must print `0`.

  ```
  grep -c "localStorage.getItem('access_token')" frontend/src/App.jsx
  ```
  Count should drop significantly (only startup/login code should read the token directly now).

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/App.jsx
  git commit -m "feat(frontend): global apiFetch with auto token-refresh, remove 30 scattered 401 handlers"
  ```

---

### Task 2: Django rate limiting on auth endpoints

**Files:**
- Modify: `backend/config/settings.py`
- Create: `backend/config/throttles.py`

**Context:**
- DRF `REST_FRAMEWORK` dict is at line ~110 of `settings.py`
- The login endpoint is `api/token/` (uses `TokenObtainPairView`)
- The refresh endpoint is `api/token/refresh/` (uses `TokenRefreshView`)
- Both endpoints are unauthenticated, so "user" throttles don't apply — use "anon" scope

**What to build:**

1. Create `backend/config/throttles.py` with two custom throttle classes:

```python
from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class TokenRefreshRateThrottle(AnonRateThrottle):
    scope = 'token_refresh'
```

2. Add default throttles to `REST_FRAMEWORK` in `settings.py`:

```python
REST_FRAMEWORK = {
    # ... existing keys ...
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/day",
        "user": "2000/day",
        "login": "10/minute",
        "token_refresh": "30/minute",
    },
}
```

3. Create `backend/config/urls.py` custom views for login and refresh that use the throttle classes. The existing `TokenObtainPairView` and `TokenRefreshView` must be subclassed:

Check current `backend/config/urls.py` — if it uses `TokenObtainPairView` directly, replace with subclasses:

```python
# In backend/config/urls.py, replace:
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# With subclasses:
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from config.throttles import LoginRateThrottle, TokenRefreshRateThrottle

class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [TokenRefreshRateThrottle]

# Then use ThrottledTokenObtainPairView and ThrottledTokenRefreshView in urlpatterns
```

**Test plan:**

- [ ] **Step 1: Create `backend/config/throttles.py`**

  Create the file with `LoginRateThrottle` and `TokenRefreshRateThrottle` as shown above.

- [ ] **Step 2: Update `backend/config/settings.py`**

  Add `DEFAULT_THROTTLE_CLASSES` and `DEFAULT_THROTTLE_RATES` to `REST_FRAMEWORK` dict.

- [ ] **Step 3: Subclass views in `backend/config/urls.py`**

  Read the file first, then add the subclasses and update urlpatterns.

- [ ] **Step 4: Verify Django starts cleanly**

  ```bash
  cd backend && python manage.py check --deploy 2>&1 | head -30
  ```
  No errors about throttle config.

- [ ] **Step 5: Run existing tests**

  ```bash
  cd backend && python manage.py test --verbosity=1 2>&1 | tail -10
  ```
  All tests must pass.

- [ ] **Step 6: Commit**

  ```bash
  git add backend/config/throttles.py backend/config/settings.py backend/config/urls.py
  git commit -m "feat(backend): rate limiting — 10/min on login, 30/min on token refresh, 200/day anon default"
  ```

---

### Task 3: Production security headers

**Files:**
- Modify: `backend/config/settings.py`

**Context:**
- `DEBUG` is read from `os.environ.get('DEBUG', 'True') == 'True'`
- `MIDDLEWARE` list is at line ~100 of `settings.py`
- `SecurityMiddleware` (`django.middleware.security.SecurityMiddleware`) should be the FIRST middleware in the list
- In development (`DEBUG=True`) most HTTPS-enforcing headers should remain off to not break local dev

**What to add to `settings.py`:**

After the existing `CORS_ALLOW_ALL_ORIGINS = DEBUG` line, add:

```python
# ── Security headers ────────────────────────────────────────────────────────
# HTTP Strict Transport Security (only active when HTTPS is used in prod)
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Redirect HTTP → HTTPS in production
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False") == "True"

# Cookie security
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# Prevent browsers from MIME-sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# Disable legacy XSS auditor (CSP is the modern replacement)
SECURE_BROWSER_XSS_FILTER = True

# Clickjacking protection
X_FRAME_OPTIONS = "DENY"

# Referrer policy
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Content Security Policy — permissive in dev, locked down in prod via env var
CSP_DEFAULT = os.environ.get(
    "CONTENT_SECURITY_POLICY",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
)
```

Also verify `django.middleware.security.SecurityMiddleware` is first in MIDDLEWARE. If it's not first, move it.

**Test plan:**

- [ ] **Step 1: Read current settings.py middleware section**

  Check the MIDDLEWARE list to see what's first.

- [ ] **Step 2: Ensure SecurityMiddleware is first**

  If `django.middleware.security.SecurityMiddleware` is not first, move it to position 0 in the MIDDLEWARE list.

- [ ] **Step 3: Add security header settings block**

  Add the block above after `CORS_ALLOW_ALL_ORIGINS = DEBUG`.

- [ ] **Step 4: Run `manage.py check --deploy`**

  ```bash
  cd backend && python manage.py check --deploy 2>&1
  ```
  In local dev (`DEBUG=True`) some warnings about HTTPS are expected and acceptable — these are prod-only settings. There must be no errors (only warnings).

- [ ] **Step 5: Run existing tests**

  ```bash
  cd backend && python manage.py test --verbosity=1 2>&1 | tail -10
  ```
  All tests must pass.

- [ ] **Step 6: Update `.env.example`**

  Add the new variables:
  ```
  SECURE_HSTS_SECONDS=31536000
  SECURE_SSL_REDIRECT=True
  CONTENT_SECURITY_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add backend/config/settings.py backend/.env.example
  git commit -m "feat(backend): production security headers — HSTS, X-Frame-Options, content-type nosniff, cookie flags"
  ```
