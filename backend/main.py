from fastapi import FastAPI

from routers import devices, users
from routers.preferences.filter_preferences import router as filter_preferences_router
from routers.preferences.lifestyle_preferences import router as lifestyle_preferences_router
from routers.profile.profile_prompts import router as profile_prompts_router
from routers.profile.profiles import router as profiles_router

app = FastAPI()

app.include_router(users.router)
app.include_router(devices.router)
app.include_router(profiles_router)
app.include_router(profile_prompts_router)
app.include_router(lifestyle_preferences_router)
app.include_router(filter_preferences_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Roomie API"}
