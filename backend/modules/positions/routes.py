"""
Position Routes
Sprint A5: API for position tracking, sync, and close
"""

import logging
from fastapi import APIRouter, HTTPException

from modules.positions.service_locator import get_position_sync_service
from modules.exchange.service_v2 import get_exchange_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/positions", tags=["positions"])

# DB will be accessed via service_locator pattern
_db = None

def init_positions_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        raise RuntimeError("Positions DB not initialized")
    return _db


@router.get("")
async def get_positions():
    """
    Get all open positions.
    
    Returns:
        List of positions from portfolio_positions collection
    """
    try:
        db = get_db()
        rows = await db.portfolio_positions.find({"status": "OPEN"}).to_list(length=100)
        
        for r in rows:
            r.pop("_id", None)
        
        return rows
    except Exception as e:
        logger.error(f"[PositionRoutes] Get positions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
async def sync_positions():
    """
    Manually trigger position sync from exchange.
    
    Returns:
        {"ok": bool, "count": int}
    """
    try:
        service = get_position_sync_service()
        result = await service.sync_positions()
        return result
    except Exception as e:
        logger.error(f"[PositionRoutes] Sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{symbol}/close")
async def close_position(symbol: str):
    """
    Close position for symbol (MARKET order).
    
    Returns:
        {"ok": bool, "exchange_order_id": str, "status": str}
    """
    try:
        exchange_service = get_exchange_service()
        adapter = exchange_service.adapter
        
        result = adapter.close_position(symbol)
        
        if not result.get("ok"):
            raise HTTPException(status_code=400, detail=result.get("error", "Close failed"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PositionRoutes] Close position failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
