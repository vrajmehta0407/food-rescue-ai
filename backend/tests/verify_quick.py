import sys
import asyncio
import httpx
sys.path.insert(0, 'backend')
from app.main import app

async def main():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/health")
        print("Health status:", resp.status_code, resp.json())

        # Test listing surplus
        resp = await client.get("/api/v1/surplus-listings")
        print("Listings status:", resp.status_code, f"{len(resp.json())} items found")

        # Test impact analytics
        resp = await client.get("/api/v1/analytics/impact")
        print("Analytics status:", resp.status_code, resp.json()["metrics"])

if __name__ == "__main__":
    asyncio.run(main())

