from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routers.template_routers import router as templates_router
from routers.ws_routers import router as ws_routers


app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(templates_router)
app.include_router(ws_routers)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
