# list of  connected WebSocket clients
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from nanoid import generate as nanoid
from websockets import ConnectionClosedError

router = APIRouter()

connected_clients = {}


def get_socket_by_id(client_id):
    return connected_clients.get(client_id)


def remove_socket_by_id(client_id):
    if client_id in connected_clients:
        del connected_clients[client_id]
        print(f"socket {client_id} removed")


async def emit_message(socket, message):
    try:
        await socket.send_text(json.dumps(message))
    except ConnectionClosedError as e:
        print(f"Failed to send message to client {socket}: {e}")


async def handle_json_message(socket_id_old, socket, json_message):
    action = json_message.get("action")

    if action == "start":
        socket_id = nanoid()
        connected_clients[socket_id] = socket
        await emit_message(socket, {"action": "start", "id": socket_id})
    else:
        remote_id = json_message.get("data", {}).get("remoteId")

        if not remote_id:
            return

        remote_socket = get_socket_by_id(remote_id)
        if not remote_socket:
            print(f"Failed to find remote socket with id {remote_id}")
            return

        if action != "offer":
            json_message["data"].pop("remoteId", None)
        else:
            json_message["data"]["remoteId"] = socket_id_old

        await emit_message(remote_socket, json_message)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("New WebSocket connection established")
    socket_id = nanoid()
    connected_clients[socket_id] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            print(data)
            print(f"socket::message data={data}")

            try:
                json_message = json.loads(data)
                await handle_json_message(socket_id, websocket, json_message)
            except json.JSONDecodeError as e:
                print(f"Failed to parse message: {e}")
    except WebSocketDisconnect:
        print("socket::close")
        remove_socket_by_id(socket_id)
