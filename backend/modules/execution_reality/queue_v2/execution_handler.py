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
        
        if self.mode not in ["DRY_RUN", "REAL"]:
            raise ValueError(f"Invalid EXECUTION_MODE: {self.mode}. Must be DRY_RUN or REAL")
        
        # Валидация зависимостей
        if self.mode == "DRY_RUN" and not self.simulator:
            raise ValueError("DRY_RUN mode requires simulator")
        
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
    
    def get_mode(self) -> str:
        """Get current execution mode."""
        return self.mode
