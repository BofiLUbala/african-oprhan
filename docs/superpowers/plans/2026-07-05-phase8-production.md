# Phase 8: Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Orphenlina deployable to production — Docker containers, complete apiFetch migration, and server-side search on the children endpoint.

**Architecture:** Three improvements: (1) finish the Phase 7 apiFetch migration for remaining raw `fetch()` data-loading calls; (2) add `?search=` query param to the Django children endpoint + a search input in the frontend children screen; (3) a production-ready Docker Compose stack (Django/gunicorn, React/nginx, shared volume for media).

**Tech Stack:** Django 4.2 + gunicorn, React 18 + Vite (built static files served by nginx), Docker + Docker Compose

## Global Constraints

- `const API = 'http://localhost:8000/api'` in frontend — do not change
- All secrets from environment variables — never hardcode
- No external libraries beyond those already in `requirements.txt` (search uses Django ORM `Q` objects, no new packages)
- `App.jsx` is a monolith — do not split into multiple files
- Docker setup must NOT break the existing `npm run dev` / `manage.py runserver` local dev workflow
- `.env` files must never be committed; `.env.example` must document all new variables

---

### Task 1: Complete apiFetch migration — remaining raw fetch calls

**Files:**
- Modify: `frontend/src/App.jsx`

**Context:**
The Phase 7 migration replaced all calls that had explicit `if (res.status === 401)` guards. However, several data-loading `fetch()` calls still use the old pattern of reading `localStorage.getItem('access_token')` manually and making a raw `fetch()` with no 401 handling. These calls silently return stale/empty data when the token expires. `apiFetch` is already defined at module scope (line 6).

**Calls to migrate** — find each by grepping for the pattern `localStorage.getItem('access_token')` followed by a raw `fetch()`. The key sites are in `DashboardShell` data-loading effects (approximately):

- ~line 900: startup fetch of `${API}/enfants/` in a `useEffect`
- ~line 1491: `Promise.all` fetching `${API}/enfants/` and `${API}/assignments/`
- ~line 1506: `${API}/enfants/?orphanage_id=${subKey}` and `${API}/assignments/`
- ~line 1535: `${API}/dons/`
- ~line 1545: `${API}/revenus/` and `${API}/depenses/`
- ~line 1562: `${API}/parrainages/enfants-disponibles/`
- ~line 1609: `${API}/orphanages/${myDocOrp.id}/documents/` (with no 401 handling)
- ~line 1769: same pattern for document loading
- ~line 1860: `${API}/orphanages/${orphanageId}/assign-ambassador/` POST
- ~line 2113, 2143: `${API}/orphanages/` GET/POST

**Migration pattern for data-loading effects:**

```js
// BEFORE
const token = localStorage.getItem('access_token')
if (!token) return
fetch(`${API}/dons/`, { headers: { Authorization: `Bearer ${token}` } })
  .then(r => r.ok ? r.json() : [])
  .then(data => setDonations(data))

// AFTER
apiFetch(`${API}/dons/`, {}, onLogout)
  .then(r => r && r.ok ? r.json() : [])
  .then(data => setDonations(data))
```

For `Promise.all` patterns:
```js
// BEFORE
const token = localStorage.getItem('access_token')
if (!token) return
Promise.all([
  fetch(`${API}/enfants/`, { headers: { Authorization: `Bearer ${token}` } }),
  fetch(`${API}/assignments/`, { headers: { Authorization: `Bearer ${token}` } }),
]).then(([r1, r2]) => Promise.all([r1.ok ? r1.json() : [], r2.ok ? r2.json() : []]))
.then(([children, assignments]) => { ... })

// AFTER
Promise.all([
  apiFetch(`${API}/enfants/`, {}, onLogout),
  apiFetch(`${API}/assignments/`, {}, onLogout),
]).then(([r1, r2]) => Promise.all([r1 && r1.ok ? r1.json() : [], r2 && r2.ok ? r2.json() : []]))
.then(([children, assignments]) => { ... })
```

- [ ] **Step 1: Find remaining raw fetch calls**

  ```
  grep -n "localStorage.getItem('access_token')" frontend/src/App.jsx
  ```
  These are the sites to migrate. Ignore the startup `checkAuth` block (~line 73) and the login handler — those legitimately read the token directly.

- [ ] **Step 2: Migrate each site**

  For each site found, read ±15 lines of context and apply the appropriate pattern above using Edit.

- [ ] **Step 3: Verify**

  ```
  grep -c "localStorage.getItem('access_token')" frontend/src/App.jsx
  ```
  Should print `2` or fewer (only the startup auth-check block and login handler).

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/App.jsx
  git commit -m "feat(frontend): complete apiFetch migration — remove remaining raw fetch with manual token reads"
  ```

---

### Task 2: Server-side search on the children endpoint + frontend search input

**Files:**
- Modify: `backend/children/views.py` (the `child_list` function, ~line 49)
- Modify: `frontend/src/App.jsx` (the registered-children screen, ~line 5659)

**Backend — add `?search=` query param:**

In `child_list` (line 49), after the queryset `enfants` is built (around line 67, just before serialization), add:

```python
search = request.query_params.get('search', '').strip()
if search:
    from django.db.models import Q
    enfants = enfants.filter(
        Q(first_name__icontains=search) |
        Q(last_name__icontains=search) |
        Q(uid__icontains=search)
    )
```

The `Q` import is already at the top of `views.py` — do not re-import.

**Frontend — add search input above the children grid:**

Find the registered-children screen by searching for `ecr-stat-value` (around line 5659). There is a stats bar, then the children grid rendered as cards. Above the grid, add a search input:

```jsx
{/* Search input — add above the children grid, inside the section wrapper */}
<div className="ecr-search-row">
  <input
    className="ecr-search-input"
    type="text"
    placeholder="Rechercher par nom ou code..."
    value={childSearch}
    onChange={e => setChildSearch(e.target.value)}
  />
</div>
```

State and effect to add inside `DashboardShell` (near the other registeredChildren state):
```js
const [childSearch, setChildSearch] = useState('')
```

When the user types, debounce and re-fetch:
```js
useEffect(() => {
  const t = setTimeout(() => {
    // re-use existing loadRegisteredChildren logic with search param
    const url = childSearch.trim()
      ? `${API}/enfants/?search=${encodeURIComponent(childSearch.trim())}`
      : `${API}/enfants/`
    apiFetch(url, {}, onLogout)
      .then(r => r && r.ok ? r.json() : [])
      .then(data => setRegisteredChildren(data))
  }, 350)
  return () => clearTimeout(t)
}, [childSearch])
```

**CSS to add at end of `frontend/src/App.css`:**
```css
.ecr-search-row { margin-bottom: 16px; }
.ecr-search-input {
  width: 100%;
  max-width: 360px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-input);
  background: var(--bg-input);
  color: var(--text-body);
  font-size: 14px;
  outline: none;
}
.ecr-search-input:focus { border-color: #6366f1; }
```

- [ ] **Step 1: Add search filter to `child_list` in `backend/children/views.py`**

  Read lines 49–100 of `views.py` to find the exact code block before `return Response(serializer.data)`, then add the search filter using Edit.

- [ ] **Step 2: Test backend search**

  Start server and verify (manual curl or just check Django startup):
  ```bash
  cd backend && python manage.py check
  ```

- [ ] **Step 3: Add `childSearch` state to `DashboardShell`**

  Find the `useState([])` block for `registeredChildren` (~line 1251) and add `const [childSearch, setChildSearch] = useState('')` immediately after it.

- [ ] **Step 4: Add the search debounce `useEffect`**

  Find the existing `useEffect` that loads `registeredChildren` (the one that calls `${API}/enfants/` and calls `setRegisteredChildren(data)`). Add the new debounce effect AFTER it.

- [ ] **Step 5: Add the search input to the UI**

  Find the `ecr-stat-value` block (~line 5659) and the children grid that follows. Add the `ecr-search-row` div immediately above the children grid render.

- [ ] **Step 6: Add CSS**

  Append the `.ecr-search-row` and `.ecr-search-input` CSS to `frontend/src/App.css`.

- [ ] **Step 7: Commit**

  ```bash
  git add backend/children/views.py frontend/src/App.jsx frontend/src/App.css
  git commit -m "feat: server-side search on children endpoint + search input in registered-children screen"
  ```

---

### Task 3: Docker production deployment

**Files to create:**
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml` (at repo root)
- `nginx/default.conf`
- Update: `backend/.env.example` (add `ALLOWED_HOSTS` production value guidance)

**What to build:**

Three services:
1. **`backend`** — Django with gunicorn, reads all config from env vars
2. **`frontend`** — React built to static files, served by nginx
3. **`nginx`** (production) — reverse proxy: `/api/` and `/admin/` → backend, everything else → frontend

Note: `gunicorn` is not in `requirements.txt` yet — it must be added.

**`backend/Dockerfile`:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
```

**`frontend/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`frontend/nginx.conf`** (for the frontend container's internal nginx — SPA fallback):
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**`nginx/default.conf`** (the reverse-proxy nginx at repo root):
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        proxy_pass http://backend;
    }

    location /media/ {
        proxy_pass http://backend;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**`docker-compose.yml`:**
```yaml
version: '3.9'

services:
  backend:
    build: ./backend
    env_file: ./backend/.env
    volumes:
      - media_files:/app/media
      - static_files:/app/staticfiles
    depends_on: []
    restart: unless-stopped

  frontend:
    build: ./frontend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - static_files:/app/staticfiles:ro
      - media_files:/app/media:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  media_files:
  static_files:
```

**`requirements.txt`** — add `gunicorn` after the last entry.

**`backend/config/settings.py`** — add `STATIC_ROOT` for `collectstatic`:
```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
```
(Check if it already exists — if not, add it after `STATIC_URL`.)

**`backend/.env.example`** — add:
```
ALLOWED_HOSTS=localhost,yourdomain.com
```

- [ ] **Step 1: Add `gunicorn` to `requirements.txt`**

  Read the file, then append `gunicorn==21.2.0` on a new line.

- [ ] **Step 2: Add `STATIC_ROOT` to `settings.py` if missing**

  Check: `grep -n "STATIC_ROOT\|STATIC_URL" backend/config/settings.py`
  If `STATIC_ROOT` is absent, add `STATIC_ROOT = BASE_DIR / 'staticfiles'` after `STATIC_URL`.

- [ ] **Step 3: Create `backend/Dockerfile`**

  Write exactly the content above.

- [ ] **Step 4: Create `frontend/nginx.conf`**

  Write the SPA-fallback nginx config above.

- [ ] **Step 5: Create `frontend/Dockerfile`**

  Write exactly the content above.

- [ ] **Step 6: Create `nginx/` directory and `nginx/default.conf`**

  Write the reverse-proxy config above.

- [ ] **Step 7: Create `docker-compose.yml` at repo root**

  Write exactly the content above.

- [ ] **Step 8: Update `backend/.env.example`**

  Add the `ALLOWED_HOSTS` production guidance line.

- [ ] **Step 9: Verify syntax**

  ```bash
  docker compose config 2>&1 | head -20
  ```
  Must produce no errors (just the rendered YAML). If docker is not installed locally, run `python -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>&1` as a syntax fallback.

- [ ] **Step 10: Commit**

  ```bash
  git add backend/Dockerfile frontend/Dockerfile frontend/nginx.conf nginx/ docker-compose.yml backend/requirements.txt backend/config/settings.py backend/.env.example
  git commit -m "feat(deploy): Docker production stack — gunicorn backend, nginx frontend, reverse proxy"
  ```
