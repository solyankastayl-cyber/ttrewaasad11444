"""
TradingCase Repository

In-memory storage for trading cases.
TODO: Migrate to MongoDB persistence.
"""

from typing import Dict, List, Optional
from .models import TradingCase


class TradingCaseRepository:
    """In-memory repository for trading cases."""
    
    def __init__(self):
        self.cases: Dict[str, TradingCase] = {}
    
    def save(self, case: TradingCase) -> TradingCase:
        """Save or update a case."""
        self.cases[case.case_id] = case
        return case
    
    def get(self, case_id: str) -> Optional[TradingCase]:
        """Get case by ID."""
        return self.cases.get(case_id)
    
    def get_all(self) -> List[TradingCase]:
        """Get all cases."""
        return list(self.cases.values())
    
    def get_active(self) -> List[TradingCase]:
        """Get all active cases."""
        return [c for c in self.cases.values() if c.status == "ACTIVE"]
    
    def get_closed(self) -> List[TradingCase]:
        """Get all closed cases."""
        return [c for c in self.cases.values() if c.status == "CLOSED"]
    
    def get_by_symbol(self, symbol: str) -> List[TradingCase]:
        """Get all cases for a symbol."""
        return [c for c in self.cases.values() if c.symbol == symbol]
    
    def delete(self, case_id: str) -> bool:
        """Delete a case."""
        if case_id in self.cases:
            del self.cases[case_id]
            return True
        return False


# Singleton instance
_repository: Optional[TradingCaseRepository] = None


def get_repository() -> TradingCaseRepository:
    """Get repository singleton."""
    global _repository
    if _repository is None:
        _repository = TradingCaseRepository()
    return _repository
