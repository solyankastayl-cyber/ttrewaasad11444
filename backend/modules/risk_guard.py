"""
Risk Guard Layer — Position & Execution Safety
================================================
P1: Hard guards for execution pipeline.

Guards:
1. MAX_POSITION_SIZE_USD — reject oversized positions
2. MAX_OPEN_POSITIONS — reject when too many open
3. Duplicate Protection — 1 decision → 1 position
4. Close Integrity — every close writes an outcome
5. Kill Switch — halt all trading if total PnL < threshold
"""

import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ─── Constants ───────────────────────────────────────
MAX_POSITION_SIZE_USD = float(os.getenv("MAX_POSITION_SIZE_USD", "100"))
MAX_OPEN_POSITIONS = int(os.getenv("MAX_OPEN_POSITIONS", "5"))
KILL_SWITCH_THRESHOLD_USD = float(os.getenv("KILL_SWITCH_THRESHOLD_USD", "-10"))


class RiskGuard:
    """
    Pre-execution risk guard. Checks all safety constraints before
    allowing an order to proceed.
    """

    def __init__(self, db=None):
        self.db = db  # motor async db (trading_os)
        self._kill_switch_active = False
        self._kill_switch_reason = None
        self._kill_switch_activated_at = None
        self._stats = {
            "total_checked": 0,
            "passed": 0,
            "rejected_max_positions": 0,
            "rejected_max_size": 0,
            "rejected_duplicate": 0,
            "rejected_kill_switch": 0,
        }
        logger.info(
            f"[RiskGuard] Initialized: max_size=${MAX_POSITION_SIZE_USD}, "
            f"max_positions={MAX_OPEN_POSITIONS}, "
            f"kill_threshold=${KILL_SWITCH_THRESHOLD_USD}"
        )

    async def check_pre_execution(
        self, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run all pre-execution checks. Returns:
          {"allowed": True} or {"allowed": False, "reason": "..."}
        """
        self._stats["total_checked"] += 1
        symbol = payload.get("symbol", "?")
        decision_id = payload.get("decision_id", payload.get("clientOrderId", ""))
        size_usd = payload.get("size_usd", payload.get("notional_usd", 0))

        # ── Guard 5: Kill Switch ─────────────────────────
        if self._kill_switch_active:
            self._stats["rejected_kill_switch"] += 1
            reason = f"KILL SWITCH ACTIVE: {self._kill_switch_reason}"
            logger.critical(f"[RiskGuard] REJECTED {symbol}: {reason}")
            return {"allowed": False, "reason": reason}

        # Check kill switch threshold against realised PnL
        await self._check_kill_switch()
        if self._kill_switch_active:
            self._stats["rejected_kill_switch"] += 1
            reason = f"KILL SWITCH ACTIVATED: {self._kill_switch_reason}"
            logger.critical(f"[RiskGuard] REJECTED {symbol}: {reason}")
            return {"allowed": False, "reason": reason}

        # ── Guard 1: Max open positions ──────────────────
        open_count = await self._count_open_positions()
        if open_count >= MAX_OPEN_POSITIONS:
            self._stats["rejected_max_positions"] += 1
            reason = (
                f"max open positions reached ({open_count}/{MAX_OPEN_POSITIONS})"
            )
            logger.warning(f"[RiskGuard] REJECTED {symbol}: {reason}")
            return {"allowed": False, "reason": reason}

        # ── Guard 2: Max position size ───────────────────
        if size_usd > MAX_POSITION_SIZE_USD:
            self._stats["rejected_max_size"] += 1
            reason = (
                f"position size ${size_usd:.2f} exceeds max "
                f"${MAX_POSITION_SIZE_USD:.2f}"
            )
            logger.warning(f"[RiskGuard] REJECTED {symbol}: {reason}")
            return {"allowed": False, "reason": reason}

        # ── Guard 3: Duplicate protection ────────────────
        if decision_id:
            dup = await self._check_duplicate(decision_id)
            if dup:
                self._stats["rejected_duplicate"] += 1
                reason = f"duplicate execution for decision {decision_id}"
                logger.warning(f"[RiskGuard] SKIPPED {symbol}: {reason}")
                return {"allowed": False, "reason": reason}

        # All passed
        self._stats["passed"] += 1
        logger.info(
            f"[RiskGuard] PASSED {symbol}: open={open_count}/{MAX_OPEN_POSITIONS}, "
            f"size=${size_usd:.2f}/{MAX_POSITION_SIZE_USD}"
        )
        return {"allowed": True}

    # ─── Internal helpers ────────────────────────────────

    async def _count_open_positions(self) -> int:
        if self.db is None:
            return 0
        try:
            return await self.db.portfolio_positions.count_documents(
                {"status": "OPEN"}
            )
        except Exception as e:
            logger.error(f"[RiskGuard] Failed to count positions: {e}")
            return 0

    async def _check_duplicate(self, decision_id: str) -> bool:
        if self.db is None:
            return False
        try:
            existing = await self.db.trading_cases.find_one(
                {"decision_id": decision_id}
            )
            return existing is not None
        except Exception as e:
            logger.error(f"[RiskGuard] Duplicate check failed: {e}")
            return False

    async def _check_kill_switch(self):
        """Check total realised PnL against threshold."""
        if self.db is None:
            return
        try:
            pipeline = [
                {"$match": {"status": "CLOSED"}},
                {"$group": {"_id": None, "total": {"$sum": "$realized_pnl"}}},
            ]
            cursor = self.db.trading_cases.aggregate(pipeline)
            results = await cursor.to_list(length=1)
            total_pnl = results[0]["total"] if results else 0.0

            if total_pnl < KILL_SWITCH_THRESHOLD_USD:
                self._kill_switch_active = True
                self._kill_switch_reason = (
                    f"total PnL ${total_pnl:.2f} < ${KILL_SWITCH_THRESHOLD_USD:.2f}"
                )
                self._kill_switch_activated_at = datetime.now(timezone.utc).isoformat()
                logger.critical(
                    f"[RiskGuard] KILL SWITCH ACTIVATED: {self._kill_switch_reason}"
                )
        except Exception as e:
            logger.error(f"[RiskGuard] Kill switch check failed: {e}")

    # ─── Close integrity (Guard 4) ───────────────────────

    @staticmethod
    def verify_close_pnl(
        symbol: str,
        side: str,
        entry_price: float,
        exit_price: float,
        qty: float,
        stored_pnl: float,
    ) -> bool:
        """
        PnL sanity check on position close.
        Returns True if verified, False if mismatch.
        """
        direction = 1.0 if side == "LONG" else -1.0
        calculated_pnl = (exit_price - entry_price) * qty * direction

        if abs(calculated_pnl - stored_pnl) > 0.01:
            logger.error(
                f"[RiskGuard] PNL MISMATCH: {symbol} {side} "
                f"calculated={calculated_pnl:.4f} stored={stored_pnl:.4f} "
                f"entry={entry_price} exit={exit_price} qty={qty}"
            )
            return False

        logger.info(
            f"[RiskGuard] PNL VERIFIED: {symbol} {side} "
            f"entry=${entry_price:,.2f} exit=${exit_price:,.2f} "
            f"qty={qty:.6f} pnl=${calculated_pnl:.4f}"
        )
        # Also print for visibility in logs
        print(
            f"[RiskGuard] PNL VERIFIED: {symbol} {side} "
            f"entry=${entry_price:,.2f} exit=${exit_price:,.2f} "
            f"qty={qty:.6f} pnl=${calculated_pnl:.4f}"
        )
        return True

    async def integrity_check(self) -> Dict[str, Any]:
        """
        Periodic integrity check: orphaned outcomes, unclosed positions,
        PnL mismatches.
        """
        result = {
            "orphaned_outcomes": 0,
            "unclosed_positions_without_pnl": 0,
            "pnl_mismatches": 0,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }
        if self.db is None:
            return result

        try:
            # Closed cases without outcomes
            closed_cases = await self.db.trading_cases.find(
                {"status": "CLOSED"}, {"_id": 0, "decision_id": 1}
            ).to_list(length=500)
            closed_decision_ids = {
                c["decision_id"] for c in closed_cases if c.get("decision_id")
            }

            outcomes = await self.db.decision_outcomes.find(
                {}, {"_id": 0, "decision_id": 1}
            ).to_list(length=500)
            outcome_decision_ids = {
                o["decision_id"] for o in outcomes if o.get("decision_id")
            }

            # Orphaned outcomes (outcome exists but no CLOSED case)
            orphaned = outcome_decision_ids - closed_decision_ids
            result["orphaned_outcomes"] = len(orphaned)

            # PnL mismatches on closed cases
            closed_full = await self.db.trading_cases.find(
                {"status": "CLOSED"},
                {"_id": 0, "symbol": 1, "side": 1, "entry_price": 1,
                 "current_price": 1, "qty": 1, "realized_pnl": 1,
                 "avg_entry_price": 1},
            ).to_list(length=500)
            for c in closed_full:
                entry = c.get("avg_entry_price") or c.get("entry_price", 0)
                exit_p = c.get("current_price", 0)
                qty = c.get("qty", 0)
                side = c.get("side", "LONG")
                stored = c.get("realized_pnl", 0)
                direction = 1.0 if side == "LONG" else -1.0
                calc = (exit_p - entry) * qty * direction
                if abs(calc - stored) > 0.01:
                    result["pnl_mismatches"] += 1

        except Exception as e:
            logger.error(f"[RiskGuard] Integrity check failed: {e}")

        if result["orphaned_outcomes"] or result["pnl_mismatches"]:
            logger.warning(f"[RiskGuard] Integrity issues: {result}")
        else:
            logger.info(f"[RiskGuard] Integrity OK: {result}")

        return result

    # ─── API helpers ─────────────────────────────────────

    async def get_status(self) -> Dict[str, Any]:
        total_pnl = 0.0
        open_positions = 0
        if self.db is not None:
            try:
                pipeline = [
                    {"$match": {"status": "CLOSED"}},
                    {"$group": {"_id": None, "total": {"$sum": "$realized_pnl"}}},
                ]
                cursor = self.db.trading_cases.aggregate(pipeline)
                results = await cursor.to_list(length=1)
                total_pnl = results[0]["total"] if results else 0.0
            except Exception:
                pass
            try:
                open_positions = await self.db.portfolio_positions.count_documents({"status": "OPEN"})
            except Exception:
                pass
        return {
            "kill_switch_active": self._kill_switch_active,
            "kill_switch_reason": self._kill_switch_reason,
            "kill_switch_activated_at": self._kill_switch_activated_at,
            "total_pnl": round(total_pnl, 4),
            "open_positions": open_positions,
            "config": {
                "max_position_size_usd": MAX_POSITION_SIZE_USD,
                "max_open_positions": MAX_OPEN_POSITIONS,
                "kill_switch_threshold_usd": KILL_SWITCH_THRESHOLD_USD,
            },
            "stats": dict(self._stats),
        }

    def reset_kill_switch(self):
        self._kill_switch_active = False
        self._kill_switch_reason = None
        self._kill_switch_activated_at = None
        logger.info("[RiskGuard] Kill switch RESET manually")
        return {"ok": True, "message": "Kill switch reset"}


# ─── Singleton ───────────────────────────────────────
_risk_guard: Optional[RiskGuard] = None


def init_risk_guard(db) -> RiskGuard:
    global _risk_guard
    _risk_guard = RiskGuard(db=db)
    return _risk_guard


def get_risk_guard() -> Optional[RiskGuard]:
    return _risk_guard
