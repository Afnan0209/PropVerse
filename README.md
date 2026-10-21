# PropVerse

PropVerse is a role-based property-management application. The frontend is React 18 with Vite and React Router; the API is FastAPI with MySQL. Authentication uses short-lived JWTs, bcrypt password hashes, and server-side role checks.

## Architecture

- `src/` contains the React application, role-driven screen configuration, and authenticated API client.
- `backend/main.py` registers the FastAPI routers and CORS policy.
- `backend/auth.py` verifies passwords, issues JWTs, and provides role dependencies.
- `backend/routers/` contains authentication, admin, manager, staff, owner, and tenant routes.
- `backend/database.py` creates a configurable connection pool for each database role.
- `schema.sql` creates tables, views, and triggers in an already-created MySQL database.
- `db_users.sql` configures the least-privilege database accounts.
- `backend/seed.py` inserts demo users and sample properties, leases, payments, and maintenance requests.

Owners and tenants can access only data scoped to their verified token profile. Admin and manager owner/tenant screens are read-only. Lease creation is restricted to managers, and maintenance requests can be submitted by tenants with an active lease.

## Database setup

Use MySQL 8 or a compatible hosted MySQL service. Create an empty database named `propverse` in the provider console or with an account that has database-creation privileges. The application schema deliberately does not create or select a database.

Run the files in this order:

1. Select the `propverse` database and run [`schema.sql`](./schema.sql).
2. In [`db_users.sql`](./db_users.sql), replace each `REPLACE_WITH_..._PASSWORD` placeholder with a strong unique password, then run the script using a MySQL account allowed to create users and grants.
3. Copy and configure the backend environment settings below.
4. From the `backend` directory, run `python seed.py` to insert demo data. The script prints the demo application logins when it completes.

For a local MySQL server from Windows Command Prompt:

```bat
mysql -u root -p -e "CREATE DATABASE propverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p propverse < schema.sql
mysql -u root -p < db_users.sql
```

On Linux/macOS, use the same MySQL commands in a shell. For a hosted provider, create the database and run each SQL file in its SQL console after selecting that database. The SQL schema file itself contains no database creation or user-management statements.

## Environment variables

Copy [`.env.example`](./.env.example) and replace all placeholders. Never commit `.env` files or real secrets.

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | MySQL host (default `localhost`) |
| `DB_PORT` | MySQL port (default `3306`) |
| `DB_NAME` | Database name (default `propverse`) |
| `DB_POOL_SIZE` | Connections per role pool (default `3`) |
| `ADMIN_USER`, `ADMIN_PASS` | Admin database account used by login and profile lookups |
| `MANAGER_USER`, `MANAGER_PASS` | Least-privilege manager database account |
| `STAFF_USER`, `STAFF_PASS` | Maintenance staff database account |
| `OWNER_USER`, `OWNER_PASS` | Read-only owner database account |
| `TENANT_USER`, `TENANT_PASS` | Tenant database account |
| `DB_SSL_CA` | Optional path to the MySQL TLS CA certificate |
| `JWT_SECRET` | Long, random signing secret; generate a different value for every deployment |
| `JWT_EXPIRE_MINUTES` | Access-token lifetime (default `60`) |
| `CORS_ORIGINS` | Comma-separated allowed browser origins (default `http://localhost:5173`) |
| `VITE_API_URL` | Frontend API base URL; this is the only frontend environment variable |

When running the backend locally, place the configured file at `backend/.env`. For Vite, place a copy at the repository root as `.env` and set `VITE_API_URL`. In production configure the backend variables in the hosting provider and set `VITE_API_URL` to the deployed API origin in the frontend build environment. Add the deployed frontend origin to `CORS_ORIGINS`.

## Run locally

### Windows

In PowerShell or Command Prompt:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
# Edit .env with the database credentials and a unique JWT_SECRET.
python seed.py
python -m uvicorn main:app --reload --port 8000
```

In a second terminal:

```powershell
npm install
Copy-Item .env.example .env
# Set VITE_API_URL=http://localhost:8000 in the root .env.
npm run dev
```

### Linux/macOS

In one terminal:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with the database credentials and a unique JWT_SECRET.
python seed.py
python -m uvicorn main:app --reload --port 8000
```

In a second terminal:

```sh
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000 in the root .env.
npm run dev
```

Open <http://localhost:5173>. The backend health endpoint is <http://localhost:8000/>.

## Demo-only application credentials

These seeded credentials are for local demonstration only. Change or remove them before exposing any deployment to users.

| Role | Username(s) | Password |
| --- | --- | --- |
| Admin | `pv_admin` | `AdminDemo!2026` |
| Manager | `pv_manager` | `ManagerDemo!2026` |
| Staff | `pv_staff` | `StaffDemo!2026` |
| Owner | `owner_asha`, `owner_dev`, `owner_meera` | `OwnerDemo!2026` |
| Tenant | `tenant_aarav`, `tenant_isha`, `tenant_rohan`, `tenant_kavya`, `tenant_vivek` | `TenantDemo!2026` |

## Frontend screens

The role-driven screens are configured in [`src/config/views.js`](./src/config/views.js). Admin and manager owner/tenant lists are marked read-only; the manager lease workflow and tenant maintenance request form are role-specific. The login page displays backend connectivity and indicates when the API is waking up.

Netlify deployment is configured in [`netlify.toml`](./netlify.toml) to build with `npm run build`, publish `dist`, and route SPA paths to `index.html`.
