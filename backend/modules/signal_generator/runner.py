"""
Signal Generator Runner
========================

Lightweight loop для автогенерации сигналов.

Запускается один раз при старте сервера.
Работает параллельно с RuntimeDaemon.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class SignalGeneratorRunner:
    """
    Автогенератор сигналов в фоне.
    
    - Запрашивает текущую цену каждые 30-60 сек
    - Генерит сигнал через SimpleMAGenerator
    - Создает decision через RuntimeService
    - Cooldown 5 минут на symbol (анти-спам)
    """
    
    def __init__(self, runtime_service, market_data_service, interval_seconds: int = 30):
        """
        Args:
            runtime_service: RuntimeService instance
            market_data_service: MarketDataService instance
            interval_seconds: Частота проверки (default 30s)
        """
        self.runtime_service = runtime_service
        self.market_data = market_data_service
        self.interval = interval_seconds
        
        # Cooldown tracking (symbol → last_decision_time)
        self.cooldowns = {}
        self.cooldown_minutes = 5
        
        # Control
        self._task: Optional[asyncio.Task] = None
        self._running = False
        
        logger.info(
            f"✅ SignalGeneratorRunner initialized: interval={interval_seconds}s, "
            f"cooldown={self.cooldown_minutes}m"
        )
    
    async def start(self):
        """Start background loop."""
        if self._running:
            logger.warning("[SignalRunner] Already running")
            return
        
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("[SignalRunner] Started")
    
    async def stop(self):
        """Stop background loop."""
        if not self._running:
            return
        
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        logger.info("[SignalRunner] Stopped")
    
    def _check_cooldown(self, symbol: str) -> bool:
        """
        Проверить cooldown для symbol.
        
        Returns:
            True если можно создать decision, False если cooldown активен
        """
        if symbol not in self.cooldowns:
            return True
        
        last_time = self.cooldowns[symbol]
        elapsed = datetime.now(timezone.utc) - last_time
        
        if elapsed.total_seconds() < (self.cooldown_minutes * 60):
            return False
        
        return True
    
    def _update_cooldown(self, symbol: str):
        """Обновить cooldown timestamp для symbol."""
        self.cooldowns[symbol] = datetime.now(timezone.utc)
    
    async def _loop(self):
        """Main generator loop."""
        import sys
        print("[SignalRunner] _loop() STARTING...", file=sys.stderr, flush=True)
        
        from modules.signal_generator.simple_ma_generator import get_generator
        
        generator = get_generator(symbol="BTCUSDT")
        
        print(f"[SignalRunner] Generator created: {generator}", file=sys.stderr, flush=True)
        
        logger.info("[SignalRunner] Loop started")
        
        iteration = 0
        
        while self._running:
            iteration += 1
            print(f"[SignalRunner] Iteration {iteration} starting...", file=sys.stderr, flush=True)
            
            try:
                # Get current market price
                symbol = "BTCUSDT"
                
                if not self.market_data:
                    logger.debug("[SignalRunner] No market data service")
                    await asyncio.sleep(self.interval)
                    continue
                
                current_price = await self.market_data.get_last_price(symbol, timeframe="4h")
                
                if current_price is None:
                    logger.debug(f"[SignalRunner] No price data for {symbol}")
                    await asyncio.sleep(self.interval)
                    continue
                
                # Generate signal
                signal = generator.generate_signal(current_price)
                
                if signal is None:
                    # No signal (недостаточно данных или та же сторона)
                    await asyncio.sleep(self.interval)
                    continue
                
                # Check cooldown
                if not self._check_cooldown(symbol):
                    logger.debug(
                        f"[SignalRunner] Cooldown active for {symbol}, skipping"
                    )
                    await asyncio.sleep(self.interval)
                    continue
                
                # Create decision через RuntimeService
                logger.info(
                    f"[SignalRunner] Creating decision from signal: "
                    f"{signal['side']} @ ${signal['entry_price']:.2f}"
                )
                
                # Используем существующий pipeline
                decision = await self._create_decision_from_signal(signal)
                
                if decision:
                    # Update cooldown
                    self._update_cooldown(symbol)
                    logger.info(
                        f"✅ [SignalRunner] Decision created: {decision.get('decision_id')}"
                    )
                
            except asyncio.CancelledError:
                logger.info("[SignalRunner] Loop cancelled")
                break
            except Exception as e:
                logger.error(f"[SignalRunner] Loop error: {e}", exc_info=True)
            
            # Sleep
            await asyncio.sleep(self.interval)
    
    async def _create_decision_from_signal(self, signal: dict) -> Optional[dict]:
        """
        Создать decision из сигнала через RuntimeService.
        
        Использует СУЩЕСТВУЮЩИЙ pipeline (не обходит архитектуру).
        """
        try:
            # Проверяем есть ли метод create_decision в RuntimeService
            if not hasattr(self.runtime_service, 'create_decision'):
                # Fallback: создать decision напрямую в БД (минимальный вариант)
                return await self._create_decision_direct(signal)
            
            # Используем RuntimeService method если есть
            decision = await self.runtime_service.create_decision(signal)
            return decision
            
        except Exception as e:
            logger.error(f"[SignalRunner] Failed to create decision: {e}")
            return None
    
    async def _create_decision_direct(self, signal: dict) -> Optional[dict]:
        """
        Fallback: создать decision напрямую в БД.
        
        Используется если RuntimeService не имеет create_decision метода.
        """
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            import os
            import uuid
            
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            client = AsyncIOMotorClient(mongo_url)
            db = client["trading_os"]
            
            decision_id = f"auto-{uuid.uuid4().hex[:12]}"
            
            decision = {
                "decision_id": decision_id,
                "symbol": signal["symbol"],
                "side": signal["side"],
                "strategy": signal["strategy"],
                "confidence": signal["confidence"],
                "entry_price": signal.get("entry_price", 0.0),
                "stop_price": None,  # Можно добавить позже
                "target_price": None,
                "size_usd": 500,  # Фиксированный размер для auto-signals
                "thesis": f"Auto-generated {signal['strategy']} signal",
                "timeframe": signal.get("timeframe", "1m"),
                "status": "PENDING",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "auto_generated": True
            }
            
            await db["pending_decisions"].insert_one(decision)
            
            return decision
            
        except Exception as e:
            logger.error(f"[SignalRunner] Direct decision creation failed: {e}")
            return None


# Singleton
_runner: Optional[SignalGeneratorRunner] = None


def get_runner(runtime_service, market_data_service) -> SignalGeneratorRunner:
    """Get or create singleton runner."""
    global _runner
    if _runner is None:
        _runner = SignalGeneratorRunner(
            runtime_service=runtime_service,
            market_data_service=market_data_service,
            interval_seconds=10  # 10 секунд для быстрого накопления данных
        )
    return _runner
