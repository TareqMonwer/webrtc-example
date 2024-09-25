from fastapi import APIRouter, WebSocket

from services.ws_connection_manger_svc import WsConnectionManagerSvc

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await WsConnectionManagerSvc.handle_call_connections(websocket)
