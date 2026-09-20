# PropVerse Frontend (React + Vite)

Matched to the FastAPI backend routes:

| Workspace | Screen | Backend route |
|-----------|--------|---------------|
| Admin   | Properties          | `GET  /api/admin/property-overview` |
| Manager | Available units     | `GET  /api/manager/available-units` |
| Manager | New lease (form)    | `POST /api/manager/create-lease` |
| Staff   | Maintenance tickets | `GET  /api/staff/tickets` |

Each workspace also has an Overview page with figures worked out from its list.

## Run

```
# terminal 1 (backend folder)
venv\Scripts\python -m uvicorn main:app --reload --port 8000

# terminal 2 (frontend folder)
npm install
copy .env.example .env
npm run dev
```
Open http://localhost:5173

## Add a screen when you add a backend route

Edit `src/config/views.js` and add an entry with `path`, `columns` and `idKey`.
It appears in the sidebar automatically.
