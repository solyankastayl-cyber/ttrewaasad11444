"""
Execution Bridge
================
Sprint A2.3: Единственная точка входа для execution из Runtime/Strategy.

КРИТИЧНО:
- НЕ исполняет напрямую
- ВСЁ через ExecutionQueueV2
- Изолирует Runtime от execution деталей
"""

import logging
from typing import Dict, Any, Optional
from uuid import uuid4
import time

from modules.exchange.order_builder import build_order_request

logger = logging.getLogger(__name__)


class ExecutionBridge:
    """
    Execution facade для Runtime.
    
    Принимает trading signals → преобразует в execution jobs → enqueue.
    Runtime НЕ знает про OrderManager, Exchange, Workers.
    """

    def __init__(self, queue_repo=None):
        self.queue_repo = queue_repo
        if self.queue_repo is None:
            logger.warning("ExecutionBridge initialized without queue_repo - will fail on submit")

    async def submit(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit signal for execution.
        
        Args:
            signal: {
                "symbol": "BTCUSDT",
                "side": "BUY",
                "confidence": 0.75,
                "strategy": "CONTINUATION",
                "entry_price": 70000,
                "stop_price": 68000,
                "target_price": 73000
            }
        
        Returns:
            {"ok": bool, "job_id": str}
        """
        if self.queue_repo is None:
            return {
                "ok": False,
                "error": "ExecutionBridge queue_repo not initialized"
            }
        
        try:
            # Build order request
            qty_from_sizing = self._resolve_size(signal)
            
            # DEBUG: Log qty resolution
            logger.warning(f"[ExecutionBridge] Resolved qty={qty_from_sizing} from signal sizing (symbol={signal['symbol']})")
            
            order_request = build_order_request(
                symbol=signal["symbol"],
                side=signal["side"],
                qty=qty_from_sizing,
                order_type="MARKET",
            )
            
            # Sprint R1: Add sizing metadata to order payload for audit trail
            sizing = signal.get("sizing", {})
            if sizing:
                order_request["sizing_meta"] = {
                    "qty": sizing.get("qty"),
                    "notional_usd": sizing.get("notional_usd"),
                    "size_multiplier": sizing.get("size_multiplier"),
                    "debug": sizing.get("debug", {}),
                }
                order_request["sizing_applied"] = True
            else:
                order_request["sizing_applied"] = False
            
            # DEBUG: Confirm qty match
            logger.warning(f"[ExecutionBridge] ORDER qty={order_request['quantity']}, sizing.qty={sizing.get('qty')}, match={order_request['quantity'] == sizing.get('qty')}")
            
            # Create execution job
            job_id = str(uuid4())
            trace_id = str(uuid4())
            idempotency_key = f"runtime-{job_id}"
            
            # Paper Trading: Add decision metadata to payload
            enriched_payload = {
                **order_request,
                "decision_id": signal.get("decision_id"),
                "strategy": signal.get("strategy"),
                "timeframe": signal.get("timeframe"),
                "size_usd": signal.get("size_usd", 0),
                "signal_price": signal.get("entry_price", 0),
            }
            
            # Enqueue напрямую через ExecutionQueueRepository
            enqueue_result = await self.queue_repo.enqueue(
                job_id=job_id,
                idempotency_key=idempotency_key,
                trace_id=trace_id,
                symbol=signal["symbol"],
                exchange="binance",
                action="EXECUTE_ORDER",
                priority=80,  # ENTRY priority
                payload=enriched_payload,
                confidence=signal.get("confidence", 0.5)
            )
            
            if enqueue_result.get("accepted"):
                logger.info(
                    "EXECUTION_QUEUED symbol=%s side=%s job_id=%s",
                    signal["symbol"],
                    signal["side"],
                    job_id
                )
                return {
                    "ok": True,
                    "job_id": job_id
                }
            else:
                reason = enqueue_result.get("reason", "unknown")
                logger.warning(
                    "EXECUTION_REJECTED symbol=%s reason=%s",
                    signal["symbol"],
                    reason
                )
                return {
                    "ok": False,
                    "reason": reason,
                    "job_id": job_id
                }

        except Exception as e:
            logger.exception("ExecutionBridge.submit failed: %s", e)
            return {
                "ok": False,
                "error": str(e)
            }

    def _resolve_size(self, signal: Dict[str, Any]) -> float:
        """
        Resolve position size for signal.
        
        Sprint R1: Read qty from DynamicRiskEngine sizing
        Fallback: 0.001 if sizing not present (safety)
        """
        sizing = signal.get("sizing", {})
        qty = sizing.get("qty")
        
        if qty is None or qty <= 0:
            logger.warning(
                "ExecutionBridge._resolve_size: signal missing sizing.qty, using fallback 0.001"
            )
            return 0.001
        
        return float(qty)


# Singleton
_execution_bridge_instance: Optional[ExecutionBridge] = None


def init_execution_bridge(queue_repo) -> ExecutionBridge:
    """Initialize ExecutionBridge with queue_repo."""
    global _execution_bridge_instance
    _execution_bridge_instance = ExecutionBridge(queue_repo=queue_repo)
    return _execution_bridge_instance


def get_execution_bridge() -> ExecutionBridge:
    """Get ExecutionBridge singleton."""
    if _execution_bridge_instance is None:
        raise RuntimeError("ExecutionBridge not initialized - call init_execution_bridge() first")
    return _execution_bridge_instance
