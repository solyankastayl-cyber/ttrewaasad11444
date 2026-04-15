# FOMO-Trade v1.2 — PRD

## Original Problem Statement
Clone, analyze, and deploy FOMO-Trade v1.2 from GitHub. Fix P0 issue: execution uses fake/mock prices instead of real market prices. Fix UI layout issues (overlapping elements, dark/light theme, invisible headings). Implement P1 Position & Risk Validation Layer.

## Architecture
- **Stack**: FastAPI (Python) + React + MongoDB + Shadcn/UI
- **Backend**: 3000+ line server.py, 140+ modules (TA engine, execution pipeline, risk management, etc.)
- **Frontend**: 5600+ files, trading terminal with tabbed workspaces
- **Data**: MongoDB (3 databases: test_database, trading_os, trading_db)
- **Price Source**: Coinbase public API (real-time, no key needed)

## What's Been Implemented

### P0 — Deployment & Real Prices (Apr 15, 2026)
1. Full deployment — Backend on port 8001, Frontend on port 3000 (supervisor)
2. P0 Fix: Real execution prices — ExecutionHandler._enrich_paper_payload() uses CoinbaseProvider
3. PaperAdapter price fix — get_mark_price() and update_mark_prices() use Coinbase
4. Demo seed fix — Seeds trading cases with real Coinbase prices
5. EXECUTION_MODE=PAPER — Changed from DRY_RUN to enable price enrichment
6. Position persistence — PaperAdapter loads/saves positions to MongoDB
7. Sync safety — Position sync no longer destructively closes positions

### UI Fixes (Apr 15, 2026)
8. Fixed overlapping elements in TradeWorkspace and PositionsWorkspace layouts
9. Reverted dark-mode implementation back to native light theme with dark cards
10. Fixed invisible text-white headings on light backgrounds

### P1 — Position & Risk Validation Layer (Apr 15, 2026)
11. Created `/app/backend/modules/risk_guard.py` with all 5 guards:
    - **Guard 1**: Max Position Size ($100) — rejects oversized orders
    - **Guard 2**: Max Open Positions (5) — rejects when too many open
    - **Guard 3**: Duplicate Protection — 1 decision → 1 position
    - **Guard 4**: Close Integrity — PnL sanity check on every case close
    - **Guard 5**: Kill Switch — halts all trading if total PnL < -$10
12. RiskGuard initialized in server.py lifespan with Motor async DB
13. Pre-execution checks wired into ExecutionHandler.execute_order()
14. PnL sanity check injected into TradingCaseService.close_case()
15. `size_usd` propagated from decision → signal → bridge → execution payload
16. API endpoints:
    - `GET /api/runtime/risk-status` — returns guard config, stats, integrity
    - `POST /api/runtime/risk-reset` — manually resets kill switch

### P2 — Decision Quality & Feedback Layer (Apr 15, 2026)
17. Created `/app/backend/modules/decision_quality.py` with full analytics
18. Added `GET /api/analytics/decision-quality` endpoint
19. Created `DecisionQualityPanel.jsx` (4 blocks: Core Metrics, Confidence, Direction, Losses)
20. Wired into AnalyticsWorkspace with `useDecisionQuality` hook (15s auto-refresh)

## Test Results
- All 5 guards tested and passing (test script: `/app/backend/tests/test_risk_guard.py`)
- 10/10 closed cases PnL verified (0 mismatches)
- Integrity check clean (0 orphaned outcomes, 0 PnL mismatches)
- Backend: healthy, frontend: healthy

## Prioritized Backlog
### P0 (Done)
- [x] Real execution prices from Coinbase
- [x] UI layout fixes
- [x] Light theme enforcement

### P1 (Done)
- [x] Position & Risk Validation Layer (all 5 guards)

### P2
- [x] Decision Quality & Feedback Layer (analytics, API, UI blocks)
- [ ] WebSocket reconnection logic improvement
- [ ] Prediction and Tech Analysis page load performance optimization
- [ ] Error boundaries for better UX on API failures
- [ ] Multi-symbol execution support (beyond BTC/ETH/SOL)
- [ ] Historical PnL dashboard with real price tracking
- [ ] Auto-close positions when stop-loss/take-profit hit (real prices)
