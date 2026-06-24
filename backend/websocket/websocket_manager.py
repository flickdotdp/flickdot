import logging
import asyncio
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

from ..schemas.common import WebSocketMessage, WsEventType

logger = logging.getLogger("websocket")

class ConnectionManager:
    """
    Production-ready WebSocket manager for FastAPI.
    Handles real-time communication, routing, and subscription grouping.
    """

    def __init__(self):
        # Maps client_id to actual WebSocket object
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Maps project_id to a set of client_ids
        self.project_subscriptions: Dict[str, Set[str]] = {}
        
        # Maps generation_id to a set of client_ids
        self.generation_subscriptions: Dict[str, Set[str]] = {}
        
        # Concurrency protection
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept an incoming connection and register the client."""
        await websocket.accept()
        async with self.lock:
            self.active_connections[client_id] = websocket
        logger.info(f"WebSocket Client connected: {client_id}. Active: {len(self.active_connections)}")

    async def disconnect(self, client_id: str):
        """Deregister a client and clean up all their subscriptions."""
        async with self.lock:
            if client_id in self.active_connections:
                del self.active_connections[client_id]
                
            # Remove from project subscriptions
            for proj_id in list(self.project_subscriptions.keys()):
                if client_id in self.project_subscriptions[proj_id]:
                    self.project_subscriptions[proj_id].remove(client_id)
                if not self.project_subscriptions[proj_id]:
                    del self.project_subscriptions[proj_id]
                    
            # Remove from generation subscriptions
            for gen_id in list(self.generation_subscriptions.keys()):
                if client_id in self.generation_subscriptions[gen_id]:
                    self.generation_subscriptions[gen_id].remove(client_id)
                if not self.generation_subscriptions[gen_id]:
                    del self.generation_subscriptions[gen_id]
                    
        logger.info(f"WebSocket Client disconnected: {client_id}. Active: {len(self.active_connections)}")

    async def register_subscription(self, client_id: str, topic_type: str, topic_id: str):
        """Subscribe a client to a specific project or generation."""
        async with self.lock:
            if client_id not in self.active_connections:
                return
                
            if topic_type == "project":
                if topic_id not in self.project_subscriptions:
                    self.project_subscriptions[topic_id] = set()
                self.project_subscriptions[topic_id].add(client_id)
                
            elif topic_type == "generation":
                if topic_id not in self.generation_subscriptions:
                    self.generation_subscriptions[topic_id] = set()
                self.generation_subscriptions[topic_id].add(client_id)

    async def unregister_subscription(self, client_id: str, topic_type: str, topic_id: str):
        """Unsubscribe a client from a specific topic."""
        async with self.lock:
            if topic_type == "project" and topic_id in self.project_subscriptions:
                self.project_subscriptions[topic_id].discard(client_id)
            elif topic_type == "generation" and topic_id in self.generation_subscriptions:
                self.generation_subscriptions[topic_id].discard(client_id)

    # -------------------------------------------------------------------------
    # Publishing Methods
    # -------------------------------------------------------------------------

    async def send_to_client(self, client_id: str, message: WebSocketMessage[Any]):
        """Send a message to a specific client safely."""
        websocket = self.active_connections.get(client_id)
        if websocket:
            try:
                await websocket.send_text(message.model_dump_json())
            except Exception as e:
                logger.warning(f"Failed to send message to client {client_id}, disconnecting. Error: {e}")
                await self.disconnect(client_id)

    async def broadcast_to_all(self, message: WebSocketMessage[Any]):
        """Broadcast a message to all connected clients."""
        logger.debug(f"Broadcasting to all: {message.event.value}")
        msg_json = message.model_dump_json()
        
        # Create a copy of clients to avoid dict modification errors during iteration
        clients = list(self.active_connections.items())
        for client_id, websocket in clients:
            try:
                await websocket.send_text(msg_json)
            except Exception:
                await self.disconnect(client_id)

    async def broadcast_to_project(self, project_id: str, message: WebSocketMessage[Any]):
        """Broadcast to clients subscribed to a specific project."""
        msg_json = message.model_dump_json()
        subscribers = list(self.project_subscriptions.get(project_id, []))
        
        for client_id in subscribers:
            websocket = self.active_connections.get(client_id)
            if websocket:
                try:
                    await websocket.send_text(msg_json)
                except Exception:
                    await self.disconnect(client_id)

    async def broadcast_to_generation(self, generation_id: str, message: WebSocketMessage[Any]):
        """Broadcast to clients subscribed to a specific generation."""
        msg_json = message.model_dump_json()
        subscribers = list(self.generation_subscriptions.get(generation_id, []))
        
        for client_id in subscribers:
            websocket = self.active_connections.get(client_id)
            if websocket:
                try:
                    await websocket.send_text(msg_json)
                except Exception:
                    await self.disconnect(client_id)

    async def publish_event(self, event_type: str, payload: Any, target_type: str = "all", target_id: Optional[str] = None):
        """
        High-level helper to wrap payloads into the standardized WebSocketMessage schema
        and route them appropriately.
        """
        try:
            # We enforce WsEventType if it matches our enum, or default to string parsing
            enum_event = WsEventType(event_type) if event_type in [e.value for e in WsEventType] else event_type
        except ValueError:
            enum_event = event_type
            
        # Using Any to bypass strict generic Pydantic enforcement during dynamic runtime creation
        message = WebSocketMessage[Any](event=enum_event, payload=payload)
        
        if target_type == "all":
            await self.broadcast_to_all(message)
        elif target_type == "project" and target_id:
            await self.broadcast_to_project(target_id, message)
        elif target_type == "generation" and target_id:
            await self.broadcast_to_generation(target_id, message)
        elif target_type == "client" and target_id:
            await self.send_to_client(target_id, message)

    def get_stats(self) -> Dict[str, int]:
        """Return diagnostic statistics."""
        return {
            "active_connections": len(self.active_connections),
            "project_subscriptions": len(self.project_subscriptions),
            "generation_subscriptions": len(self.generation_subscriptions)
        }

# Global singleton instance
manager = ConnectionManager()
