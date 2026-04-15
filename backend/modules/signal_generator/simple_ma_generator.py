"""
Simple MA Signal Generator
===========================

Минимальный генератор сигналов на основе MA20.

Логика:
  price > MA20 → LONG
  price < MA20 → SHORT

Без TA-магии. Только для авто-потока решений.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from collections import deque

logger = logging.getLogger(__name__)


class SimpleMAGenerator:
    """
    Простейший генератор сигналов: price vs MA20.
    
    - Хранит последние 20 цен в памяти
    - Генерит сигнал только если цена пересекает MA
    - Фиксированный confidence = 0.6
    """
    
    def __init__(self, symbol: str = "BTCUSDT", ma_period: int = 5):
        """
        Args:
            symbol: Trading pair
            ma_period: MA период (default 5 для быстрого тестирования)
        """
        self.symbol = symbol
        self.ma_period = ma_period
        
        # Price history (последние N цен)
        self.prices: deque = deque(maxlen=ma_period)
        
        # Last signal side (для предотвращения дублей)
        self.last_signal_side: Optional[str] = None
        
        logger.info(
            f"✅ SimpleMAGenerator initialized: symbol={symbol}, MA={ma_period}"
        )
    
    def add_price(self, price: float) -> None:
        """Добавить новую цену в историю."""
        self.prices.append(price)
    
    def calculate_ma(self) -> Optional[float]:
        """Рассчитать MA из текущей истории."""
        if len(self.prices) < self.ma_period:
            return None  # Недостаточно данных
        
        return sum(self.prices) / len(self.prices)
    
    def generate_signal(self, current_price: float) -> Optional[Dict[str, Any]]:
        """
        Генерировать сигнал на основе текущей цены.
        
        Args:
            current_price: Текущая рыночная цена
        
        Returns:
            Signal dict или None если нет сигнала
        """
        import sys
        print(f"[SimpleMA] generate_signal called: price=${current_price:.2f}, history_len={len(self.prices)}", file=sys.stderr, flush=True)
        
        # Добавить цену в историю
        self.add_price(current_price)
        
        # Рассчитать MA
        ma = self.calculate_ma()
        
        if ma is None:
            print(f"[SimpleMA] Not enough data: {len(self.prices)}/{self.ma_period}", file=sys.stderr, flush=True)
            logger.debug(
                f"[SimpleMA] Not enough data: {len(self.prices)}/{self.ma_period}"
            )
            return None
        
        print(f"[SimpleMA] MA20=${ma:.2f}, price=${current_price:.2f}", file=sys.stderr, flush=True)
        
        # Определить сторону
        if current_price > ma:
            signal_side = "BUY"
        elif current_price < ma:
            signal_side = "SELL"
        else:
            print("[SimpleMA] price == MA, no signal", file=sys.stderr, flush=True)
            return None  # Цена == MA, нет сигнала
        
        # Анти-дубль: не генерить если та же сторона
        if signal_side == self.last_signal_side:
            print(f"[SimpleMA] Same side as last: {signal_side}, skipping", file=sys.stderr, flush=True)
            logger.debug(
                f"[SimpleMA] Same side as last signal: {signal_side}, skipping"
            )
            return None
        
        # Обновить last signal
        self.last_signal_side = signal_side
        
        # Создать сигнал
        signal = {
            "symbol": self.symbol,
            "side": signal_side,
            "confidence": 0.6,  # Фиксированный
            "strategy": "SIMPLE_MA",
            "timeframe": "1m",
            "entry_price": current_price,
            "ma_value": ma,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"[SimpleMA] ✅ SIGNAL GENERATED: {signal_side} @ ${current_price:.2f}", file=sys.stderr, flush=True)
        
        logger.info(
            f"🎯 [SimpleMA] Signal generated: {signal_side} @ ${current_price:.2f} "
            f"(MA20=${ma:.2f})"
        )
        
        return signal


# Singleton instance
_generator: Optional[SimpleMAGenerator] = None


def get_generator(symbol: str = "BTCUSDT") -> SimpleMAGenerator:
    """Get or create singleton generator."""
    global _generator
    if _generator is None:
        _generator = SimpleMAGenerator(symbol=symbol)
    return _generator
