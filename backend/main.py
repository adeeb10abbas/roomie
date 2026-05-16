from fastapi import FastAPI

from routers import devices, users

app = FastAPI()

app.include_router(users.router)
app.include_router(devices.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Roomie API"}
