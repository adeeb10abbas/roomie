from fastapi import FastAPI

from routers import devices, users
from routers.profile.profiles import router as profiles_router

app = FastAPI()

app.include_router(users.router)
app.include_router(devices.router)
app.include_router(profiles_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Roomie API"}
