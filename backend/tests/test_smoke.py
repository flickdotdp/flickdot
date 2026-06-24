import pytest
import httpx
from httpx import AsyncClient

BASE_URL = "http://127.0.0.1:8000"

@pytest.mark.asyncio
async def test_system_health():
    async with AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/system/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "worker" in data
        assert "comfyui" in data

@pytest.mark.asyncio
async def test_get_queue_empty():
    async with AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/generations/queue")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

@pytest.mark.asyncio
async def test_gallery_pagination():
    async with AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/generations/gallery?page=1&size=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
