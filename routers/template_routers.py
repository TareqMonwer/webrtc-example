from fastapi import APIRouter, Request
from constants import templates


router = APIRouter()


@router.get("/")
async def read_item(request: Request):
    return templates.TemplateResponse(request=request, name="public_index.html")
