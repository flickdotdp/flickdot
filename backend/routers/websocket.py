import logging
import json
from typing import Optional
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from ..websocket.websocket_manager import manager as ws_manager

logger = logging.getLogger("api.websocket")

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"]
)

@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None, description="Optional persistent client ID")
):
    """
    Main WebSocket endpoint for the frontend.
    Handles connections, heartbeats, and topic subscriptions.
    """
    if not client_id:
        client_id = str(uuid.uuid4())
        
    await ws_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive text payload from the client
            data = await websocket.receive_text()
            
            try:
                payload = json.loads(data)
                action = payload.get("action")
                
                # Ping/Pong Heartbeat
                if action == "ping":
                    await websocket.send_json({"event": "pong", "timestamp": payload.get("timestamp")})
                    
                # Subscriptions: { "action": "subscribe", "type": "project", "id": "123" }
                elif action == "subscribe":
                    topic_type = payload.get("type")
                    topic_id = payload.get("id")
                    if topic_type and topic_id:
                        await ws_manager.register_subscription(client_id, topic_type, topic_id)
                        await websocket.send_json({"event": "subscribed", "type": topic_type, "id": topic_id})
                        
                # Unsubscriptions: { "action": "unsubscribe", "type": "project", "id": "123" }
                elif action == "unsubscribe":
                    topic_type = payload.get("type")
                    topic_id = payload.get("id")
                    if topic_type and topic_id:
                        await ws_manager.unregister_subscription(client_id, topic_type, topic_id)
                        await websocket.send_json({"event": "unsubscribed", "type": topic_type, "id": topic_id})
                else:
                    logger.warning(f"Unknown action '{action}' from client {client_id}")
                    
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from client {client_id}")
                await websocket.send_json({"event": "error", "message": "Invalid JSON format"})

    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected normally.")
        await ws_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        await ws_manager.disconnect(client_id)
