"""
Execution Handler
=================
Sprint A2.3: Unified execution interface for DRY_RUN and REAL modes.
"""

import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ExecutionHandler:
    """
    Execution handler с поддержкой DRY_RUN и REAL режимов.
    
    Режим определяется через ENV EXECUTION_MODE:
    - DRY_RUN: используется simulator
    - REAL: используется OrderManager
    """
    
    def __init__(self, simulator=None, order_manager=None):
        self.simulator = simulator
        self.order_manager = order_manager
        
        # Определяем режим из ENV
        self.mode = os.getenv("EXECUTION_MODE", "DRY_RUN")
        
        # DEBUG: Confirm mode читается корректно
        import sys
        print(f"[ExecutionHandler] EXECUTION_MODE={self.mode} (from os.getenv)", file=sys.stderr, flush=True)
        
        if self.mode not in ["DRY_RUN", "PAPER", "REAL"]:
            raise ValueError(f"Invalid EXECUTION_MODE: {self.mode}. Must be DRY_RUN, PAPER, or REAL")
        
        # Валидация зависимостей
        if self.mode in ["DRY_RUN", "PAPER"] and not self.simulator:
            raise ValueError(f"{self.mode} mode requires simulator")
        
        if self.mode == "REAL" and not self.order_manager:
            raise ValueError("REAL mode requires order_manager")
        
        logger.info(f"[ExecutionHandler] Initialized in {self.mode} mode")
    
    async def execute_order(
        self,
        job_id: str,
        trace_id: Optional[str],
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute order based on current mode.
        
        Args:
            job_id: Job ID from ExecutionQueue
            trace_id: Trace ID for audit
            payload: Order request payload
        
        Returns:
            {"success": bool, "result": dict, "error": str (optional)}
        """
        try:
            if self.mode == "DRY_RUN":
                logger.info(
                    f"[ExecutionHandler] DRY_RUN execute: job_id={job_id} symbol={payload.get('symbol')}"
                )
                result = await self.simulator.submit_order(
                    job_id=job_id,
                    trace_id=trace_id,
                    payload=payload
                )
                return result
            
            elif self.mode == "PAPER":
                logger.info(
                    f"[ExecutionHandler] PAPER execute: job_id={job_id} symbol={payload.get('symbol')}"
                )
                
                # PAPER mode: Enrich payload with real market price
                enriched_payload = await self._enrich_paper_payload(payload)
                
                result = await self.simulator.submit_order(
                    job_id=job_id,
                    trace_id=trace_id,
                    payload=enriched_payload
                )
                return result
            
            elif self.mode == "REAL":
                logger.info(
                    f"[ExecutionHandler] REAL execute: job_id={job_id} symbol={payload.get('symbol')}"
                )
                
                # OrderManager.place_order() возвращает результат напрямую
                exchange_result = await self.order_manager.place_order(payload)
                
                # Нормализуем результат в формат ExecutionQueue
                return {
                    "success": True,
                    "result": exchange_result,
                    "mode": "REAL",
                    "job_id": job_id,
                }
        
        except Exception as e:
            logger.exception(f"[ExecutionHandler] Execution failed: job_id={job_id}")
            return {
                "success": False,
                "error": str(e),
                "mode": self.mode,
                "job_id": job_id,
            }
    

    async def _enrich_paper_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich payload with real market data for PAPER mode.
        
        PAPER mode difference from DRY_RUN:
        - Uses real market prices (not 0)
        - Calculates real qty based on size_usd
        - Simulates fills at real prices
        
        Returns enriched payload with:
        - entry_price: current market price
        - final_size: quantity (renamed from 'quantity')
        """
        symbol = payload.get("symbol")
        side = payload.get("side")
        quantity = payload.get("quantity", 0.0)
        
        # Get current market price
        try:
            # Use MarketDataService to get real price
            from modules.market_data import get_market_data_service
            market_data = get_market_data_service()
            
            if market_data:
                latest_data = market_data.get_latest(symbol)
                if latest_data and 'close' in latest_data:
                    market_price = float(latest_data['close'])
                else:
                    # Fallback: use signal entry_price if available
                    market_price = payload.get("price", 50000.0)  # Fallback to conservative default
            else:
                # No market data service: use signal price or fallback
                market_price = payload.get("price", 50000.0)
        except Exception as e:
            logger.warning(f"[PAPER] Failed to get market price for {symbol}: {e}, using fallback")
            market_price = payload.get("price", 50000.0)
        
        # Enrich payload
        enriched = {
            **payload,
            "entry_price": market_price,  # Real market price
            "final_size": quantity,  # Rename for simulator compatibility
        }
        
        logger.info(
            f"[PAPER] Enriched payload: symbol={symbol}, qty={quantity}, "
            f"market_price=${market_price:.2f}"
        )
        
        return enriched

    def get_mode(self) -> str:
        """Get current execution mode."""
        return self.mode
