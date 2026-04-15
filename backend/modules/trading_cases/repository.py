"""
TradingCase Repository

In-memory storage for trading cases.
TODO: Migrate to MongoDB persistence.
"""

from typing import Dict, List, Optional
from .models import TradingCase


class TradingCaseRepository:
    """In-memory repository for trading cases + MongoDB persistence."""
    
    def __init__(self, db=None):
        """
        Initialize repository.
        
        Args:
            db: MongoDB database instance (optional for persistence)
        """
        self.cases: Dict[str, TradingCase] = {}
        self.db = db  # MongoDB instance for persistence
    
    def save(self, case: TradingCase) -> TradingCase:
        """Save or update a case (in-memory + MongoDB)."""
        self.cases[case.case_id] = case
        
        # Persist to MongoDB if db is available
        if self.db is not None:
            try:
                collection = self.db["trading_cases"]
                # Convert Pydantic model to dict for MongoDB
                case_dict = case.model_dump() if hasattr(case, 'model_dump') else case.dict()
                
                # Upsert (update or insert)
                collection.replace_one(
                    {"case_id": case.case_id},
                    case_dict,
                    upsert=True
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to persist case to MongoDB: {e}")
        
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


def init_repository(db):
    """Initialize repository singleton with MongoDB."""
    global _repository
    _repository = TradingCaseRepository(db=db)
    return _repository


def get_repository() -> TradingCaseRepository:
    """Get repository singleton."""
    global _repository
    if _repository is None:
        raise RuntimeError("TradingCaseRepository not initialized - call init_repository() first")
    return _repository
