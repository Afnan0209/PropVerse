import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import admin, auth, manager, owner, staff, tenant

app = FastAPI(title="PropVerse API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(manager.router)
app.include_router(staff.router)
app.include_router(owner.router)
app.include_router(tenant.router)


@app.get("/")
def health_check():
    return {"status": "online", "message": "PropVerse Backend is running!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
