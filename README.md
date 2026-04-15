# FOMO-Trade v1.2 — Trading Terminal with Decision Operating System

> Automated cryptocurrency trading terminal with real-time market data, paper trading execution, risk management, and decision analytics.

---

## Status

| Component | Status |
|-----------|--------|
| System | **LIVE** (paper trading mode) |
| Execution | **Real Coinbase prices** |
| PnL | **Honest, verified** (sanity-checked on every close) |
| Flow integrity | **100%** (decision -> execution -> position -> outcome) |
| Risk guards | **Active** (6 guards operational) |
| Price source | **Coinbase API** (public, no key) |

---

## Current State (April 2026)

### Completed Tasks

| Priority | Task | Status |
|----------|------|--------|
| P0 | Execution Price Fix (fake -> real Coinbase prices) | DONE |
| P0 | UI layout fixes (overlapping elements, light theme) | DONE |
| P1 | Risk Validation Layer (5 guards + slippage guard) | DONE |
| P2 | Decision Quality & Feedback Layer | DONE |
| P2.5 | Data Correction Layer (PnL verification, slippage investigation, audit logging) | DONE |

### Key Metrics from Latest Run

```
total_trades      = 10
win_rate          = 60%
LONG  win_rate    = 100%
SHORT win_rate    = 0%   (legitimate -- bullish market, not a bug)
avg_slippage      = $337 (market drift between signal generation and execution, not bug)
profit_factor     = 74   (unreliable -- dataset too small, need 50+ trades)
best_bucket       = 0.5-0.6 confidence (100% win rate)
worst_bucket      = 0.6-0.7 confidence (42.9% win rate)
```

### Next Tasks (P3 — Future)

- Controlled Strategy Improvement (NOT to be started until 50+ trades accumulated)
- Confidence calibration (R2 layer needs data)
- WebSocket reconnection improvement
- Historical PnL dashboard with real price tracking
- Auto-close positions when stop-loss/take-profit hit (real prices)

---

## Architecture

### Tech Stack

- **Backend**: Python 3.11, FastAPI, Motor (async MongoDB), asyncio
- **Frontend**: React (CRA), Tailwind CSS, Shadcn/UI
- **Database**: MongoDB (3 databases)
- **Price Data**: Coinbase REST API (real-time, public, no key)
- **Charts**: TradingView widget integration
- **Deployment**: Supervisor (backend port 8001, frontend port 3000), Kubernetes ingress `/api` -> backend

### System Flow

```
Signal Generator (SimpleMA) 
  -> Pending Decision (MongoDB)
    -> Operator Approve/Reject
      -> Execution Bridge -> Execution Queue (MongoDB)
        -> Execution Worker
          -> Risk Guard (6 checks)
            -> Paper Adapter (Coinbase price)
              -> Trading Case + Portfolio Position
                -> Price Monitoring + Auto-Close
                  -> Decision Outcome (analytics)
```

---

## Backend Structure (`/app/backend/`)

### Core Files
| File | Purpose |
|------|---------|
| `server.py` | Main FastAPI app (~3100 lines). Routes, lifespan, module wiring |
| `requirements.txt` | Python dependencies |

### Custom Modules (P0-P2.5)
| Module | Purpose |
|--------|---------|
| `modules/risk_guard.py` | **P1**: 6 risk guards (max size, max positions, duplicate, close integrity, kill switch, slippage) |
| `modules/decision_quality.py` | **P2**: Analytics engine (win rate, profit factor, confidence calibration, slippage, losses) |

### Execution Pipeline (`modules/execution_reality/`)
| File | Purpose |
|------|---------|
| `queue_v2/execution_handler.py` | Order execution with DRY_RUN/PAPER/REAL modes. Risk guard pre-checks, Coinbase price enrichment, slippage guard, audit logging |
| `queue_v2/execution_queue_worker.py` | Background worker that picks jobs from MongoDB queue and executes them |
| `queue_v2/execution_submit_simulator.py` | Paper trading order simulator (creates positions from orders) |
| `queue_v2/execution_queue_repository.py` | MongoDB queue repository (enqueue/dequeue/ack) |
| `queue_routes.py`, `queue_v2_routes.py` | Queue management API routes |
| `routes.py` | Execution reality controller routes |
| `events/` | Execution event models and tracking |
| `guards/` | Execution guards (pre/post) |
| `reconciliation/` | Position reconciliation |
| `rate_limit/` | Rate limiting for execution |
| `reliability/` | Reliability/retry logic |
| `latency/` | Latency tracking |

### Exchange Adapters (`modules/exchange/`)
| File | Purpose |
|------|---------|
| `paper_adapter_v2.py` | Paper exchange with real Coinbase prices. `get_mark_price()` and `update_mark_prices()` use Coinbase API |
| `paper_adapter.py` | Original paper adapter (backup) |
| `binance_adapter.py` | Binance spot adapter |
| `binance_futures_adapter.py` | Binance futures adapter |
| `binance_testnet_adapter.py` | Binance testnet adapter |
| `binance_demo_adapter.py` | Demo mode adapter |
| `adapter_factory.py` | Creates adapters based on config |
| `order_manager.py` | Manages order lifecycle |
| `order_builder.py` | Builds exchange-specific order payloads |
| `sync_service.py` | Syncs exchange positions to MongoDB |
| `fill_sync_service.py` | Syncs fills from exchange |
| `service.py`, `service_v2.py` | Exchange service orchestration |
| `routes.py` | Exchange API routes |

### Execution Bridge (`modules/execution/`)
| File | Purpose |
|------|---------|
| `bridge.py` | Decision-to-execution bridge. Converts signals to order payloads, enqueues to execution queue. Propagates `signal_price`, `size_usd`, `decision_id` |
| `order_state/` | Order state machine |
| `order_routing/` | Smart order routing |
| `slippage/` | Slippage estimation |
| `failover/` | Failover handling |
| `reconciliation/` | Post-execution reconciliation |

### Trading Cases (`modules/trading_cases/`)
| File | Purpose |
|------|---------|
| `service.py` | Trading case lifecycle: open, update, close. PnL calculation (direction-aware), risk guard PnL sanity check on close, decision outcome writing |
| `repository.py` | MongoDB CRUD for trading cases |
| `models.py` | TradingCase Pydantic model |
| `routes.py` | API routes (CRUD, close, list active) |

### Market Data (`modules/data/`)
| File | Purpose |
|------|---------|
| `coinbase_provider.py` | Coinbase REST API client. `get_ticker()`, `get_candles()`. Public API, no key needed |
| `coinbase_auto_init.py` | Auto-initializes Coinbase prices on startup |

### Market Data Engine (`modules/market_data/`)
| File | Purpose |
|------|---------|
| `price_service.py` | Price service with caching |
| `market_data_engine.py` | Market data orchestration |
| `ws_price_feed.py` | WebSocket price feeds |
| `candle_builder.py` | Candle aggregation |
| `candle_repository.py` | Candle storage |
| `ingestion_service.py` | Data ingestion pipeline |
| `routes.py` | Market data API routes |

### Live Market Data (`modules/market_data_live/`)
| File | Purpose |
|------|---------|
| `binance_ws_feed.py` | Binance WebSocket real-time feed |
| `binance_rest_client.py` | Binance REST client |
| `market_data_service.py` | Live market data service |

### Runtime / Decision Engine (`modules/runtime/`)
| File | Purpose |
|------|---------|
| `service.py` | Core runtime: generate decisions, approve/reject, execute signals. Main `approve_decision()` flow |
| `daemon.py` | Background daemon for auto-generation |
| `controller.py` | Runtime controller (start/stop/status) |
| `routes.py` | API routes (start, stop, decisions, approve, reject, trade-this) |
| `repository.py` | Runtime config repository |
| `models.py` | Runtime models |
| `signal_provider.py` | Signal data provider |
| `signal_adapter.py` | Signal format adapter |
| `decision_trace.py` | Decision tracing |
| `truth_validator.py` | Validates decision truth |

### Signal Generator (`modules/signal_generator/`)
| File | Purpose |
|------|---------|
| `simple_ma_generator.py` | Simple Moving Average signal generator (20-period MA crossover) |
| `runner.py` | Signal generation runner |

### Strategy & Risk
| Module | Purpose |
|--------|---------|
| `modules/strategy/` | Strategy allocation, Kelly criterion, portfolio math, signal ranking, correlation |
| `modules/strategy_engine/` | Strategy engine with kill switch and risk manager |
| `modules/risk/` | Risk engine, portfolio risk |
| `modules/risk_metrics/` | Sharpe ratio, drawdown, volatility, streak analysis, ruin probability |
| `modules/risk_budget/` | Risk budget allocation |
| `modules/dynamic_risk/` | Dynamic risk management |

### TA Engine (`modules/ta_engine/`)
Large technical analysis engine with:
- Pattern detection (chart patterns, fractals, harmonics)
- Multi-timeframe analysis
- Probability engine (v1, v2, v3)
- Fibonacci analysis
- Impulse/displacement detection
- Liquidity analysis
- Market state engine
- Visual rendering for charts
- Decision adjustment engine

### Research & Analytics
| Module | Purpose |
|--------|---------|
| `modules/research/` | Research framework (scenario, hypothesis, monte carlo, edge discovery, calibration) |
| `modules/research_analytics/` | Research data visualization (chart data, indicators, fractals, patterns) |
| `modules/research_loop/` | Research feedback loop (failure patterns, factor weight adjustment, adaptive promotion) |
| `modules/research_memory/` | Research memory persistence |
| `modules/analytics/` | General analytics service |

### Prediction Engine (`modules/prediction/`)
- Prediction engine (v1, v2, v3) with regime detection
- Calibration engine with confidence scoring
- Backtest runner and resolution engine
- Stability analysis
- Trade setup generator

### Portfolio Management
| Module | Purpose |
|--------|---------|
| `modules/portfolio/` | Portfolio management (PnL, drawdown, equity, heat, capital allocation) |
| `modules/portfolio_accounts/` | Account-level aggregation (positions, balances, margin) |
| `modules/portfolio_overlay/` | Portfolio overlay analysis |
| `modules/portfolio_backtester/` | Portfolio backtesting |
| `modules/portfolio_intelligence/` | Portfolio construction intelligence |
| `modules/positions/` | Position management (sync, protection, control) |
| `modules/shadow_portfolio/` | Shadow portfolio for paper trading |

### Adaptive Intelligence
| Module | Purpose |
|--------|---------|
| `modules/adaptive_intelligence/` | Adaptive strategy (edge decay detector, parameter optimizer, factor weight optimizer) |
| `modules/adaptive/` | Adaptive state, actions, policy, audit |
| `modules/adaptation/` | Adaptation service (config, repository) |
| `modules/learning/` | Learning service |
| `modules/meta_layer/` | Meta-strategy layer (registry, scoring, allocation, policy) |
| `modules/meta_strategy/` | Meta-strategy service |

### Alpha & Hypothesis
| Module | Purpose |
|--------|---------|
| `modules/alpha_factory/` | Alpha generation (factor discovery, evaluation, graph, policy) |
| `modules/alpha_factory_v2/` | V2 alpha factory (scoring, validation, survival, decay) |
| `modules/alpha_ecology/` | Alpha ecosystem (crowding, redundancy, correlation, survival, decay) |
| `modules/alpha_interactions/` | Alpha interaction patterns (synergy, cancellation, conflict, reinforcement) |
| `modules/alpha_combination/` | Alpha combination optimization |
| `modules/alpha_registry/` | Alpha registration and similarity |
| `modules/alpha_tournament/` | Alpha competition engine |
| `modules/hypothesis_engine/` | Hypothesis generation (scoring, conflict resolution) |
| `modules/hypothesis_competition/` | Hypothesis pool, ranking, capital allocation, outcome tracking |

### Market Intelligence
| Module | Purpose |
|--------|---------|
| `modules/market_intelligence/` | Market scanning, indicator engine, signal engine |
| `modules/fractal_intelligence/` | Fractal context analysis (BTC, SPX, DXY adapters) |
| `modules/fractal_market_intelligence/` | Fractal market patterns |
| `modules/fractal_similarity/` | Fractal similarity matching |
| `modules/exchange_intelligence/` | Exchange data (funding, OI, volume, liquidations, flow) |
| `modules/cross_asset_intelligence/` | Cross-asset bridges (DXY-SPX, SPX-BTC, macro) |
| `modules/microstructure_intelligence_v2/` | Orderbook pressure, liquidity vacuum, liquidation cascade |
| `modules/microstructure_live/` | Live microstructure (trade stream, orderbook state) |
| `modules/microstructure_lab/` | Microstructure research |
| `modules/regime_intelligence_v2/` | Regime detection, context, transitions, strategy mapping |
| `modules/regime_memory/` | Regime memory persistence |
| `modules/regime_graph/` | Regime graph analysis |
| `modules/macro_context/` | Macro context engine |

### Safety & Control
| Module | Purpose |
|--------|---------|
| `modules/safety_kill_switch/` | Global safety kill switch |
| `modules/circuit_breaker/` | Circuit breaker for cascading failures |
| `modules/auto_safety/` | Automated safety checks |
| `modules/policy_engine/` | Policy enforcement engine |
| `modules/validation_guardrails/` | Snooping, lookahead, execution validation |
| `modules/validation_governance/` | Validation governance service |
| `modules/validation_isolation/` | Validation context isolation |
| `modules/edge_guard/` | Edge validity guard |
| `modules/trade_throttle/` | Trade throttling |
| `modules/system_state_machine/` | System state management |

### System Infrastructure
| Module | Purpose |
|--------|---------|
| `modules/infrastructure/` | Retry policy, circuit breaker, dead letter queue, service timeout, stress test |
| `modules/system_intelligence/` | Decision orchestrator, regime switching, market state, health engine |
| `modules/system_timeline/` | System event timeline |
| `modules/system_chaos/` | Chaos engineering |
| `modules/admin_control_center/` | Admin control panel |
| `modules/admin_cockpit/` | Admin cockpit service |
| `modules/control_dashboard/` | Control dashboard (alerts, approval, audit) |
| `modules/control_backend/` | Control backend service |

### Other Modules
| Module | Purpose |
|--------|---------|
| `modules/signal_engine/` | Signal generation (trend, breakout, mean reversion, adaptive thresholds) |
| `modules/signal_explanation/` | Signal explanation engine |
| `modules/execution_brain/` | Execution intelligence (routing, optimization) |
| `modules/execution_simulator/` | Execution simulation (latency, slippage, fill engines) |
| `modules/execution_context/` | Execution context management |
| `modules/execution_gateway/` | Execution gateway |
| `modules/execution_logger/` | Execution audit logging |
| `modules/execution_reconciliation/` | Post-execution reconciliation |
| `modules/trading_decision/` | Trading decision layer (market state, position sizing, execution mode) |
| `modules/trading_engine/` | Trading engine (signal lifecycle, entry filter, market state) |
| `modules/trading_core/` | Core trading (portfolio engine, decision engine, close service, performance) |
| `modules/trading_product/` | Trading product engine |
| `modules/entry_timing/` | Entry timing optimization (microstructure, multi-timeframe, backtest) |
| `modules/structural_bias/` | Structural market bias detection |
| `modules/decision_outcome/` | Decision outcome tracking |
| `modules/walk_forward/` | Walk-forward validation |
| `modules/cross_asset_walkforward/` | Cross-asset walk-forward |
| `modules/live_validation/` | Live validation engine |
| `modules/simulation_engine/` | Scenario simulation (shock, portfolio impact, stress grid) |
| `modules/capital_simulation/` | Capital simulation |
| `modules/capital_flow/` | Capital flow analysis |
| `modules/capital_allocation_v2/` | Capital allocation (cluster, factor, asset, strategy, budget constraints) |
| `modules/stress_testing/` | Stress testing engine |
| `modules/institutional_risk/` | Institutional risk (VaR, tail risk, correlation spike, crisis) |
| `modules/liquidity_impact/` | Liquidity impact analysis |
| `modules/market_reality/` | Market reality engine |
| `modules/market_structure/` | Market structure (breadth, dominance) |
| `modules/reflexivity_engine/` | Reflexivity detection |
| `modules/feature_factory/` | Feature generation (base, mutation, quality) |
| `modules/calibration/` | Calibration (edge classifier, failure map, degradation) |
| `modules/chart_composer/` | Chart composition and presets |
| `modules/visual_objects/` | Visual object rendering |
| `modules/ideas/` | Idea generation engine |
| `modules/idea/` | Idea management (CRUD) |
| `modules/scanner/` | Asset scanning and ranking |
| `modules/orchestrator/` | Execution orchestration (final gate) |
| `modules/pilot_mode/` | Pilot/demo mode |
| `modules/production_scheduler/` | Production job scheduling |
| `modules/event_bus/` | Event pub/sub system |
| `modules/ws_hub/` | WebSocket hub (broadcasting, routing) |
| `modules/realtime_streams/` | Real-time stream management |
| `modules/audit/` | Full audit trail (decisions, executions, strategies, learning) |
| `modules/frontend_readiness/` | Frontend readiness checks |
| `modules/broker_adapters/` | Multi-broker adapters (Binance, Bybit, Coinbase, mock) |
| `modules/exchanges/` | Multi-exchange support (Binance, OKX, Bybit, WebSocket) |
| `modules/exchange_config/` | Exchange configuration |
| `modules/exchange_sync/` | Exchange state sync |
| `modules/strategy_brain/` | Strategy brain (state, registry, regime switch, allocation, fractal hints) |
| `modules/strategy_lifecycle/` | Strategy lifecycle management |
| `modules/strategy_discovery/` | Strategy discovery (similarity, robustness, confidence) |
| `modules/strategy_governance/` | Strategy governance |
| `modules/self_healing/` | System self-healing |
| `modules/multi_asset/` | Multi-asset (universe, clustering, symbol ranking) |
| `modules/hierarchical_allocator/` | Hierarchical capital allocation |
| `modules/meta_alpha_portfolio/` | Meta-alpha portfolio construction |
| `modules/experiment_tracker/` | Experiment tracking |
| `modules/edge_lab/` | Edge research lab |
| `modules/autopsy_engine/` | Trade autopsy (post-mortem analysis) |
| `modules/market_simulation/` | Market simulation |
| `modules/production_routes.py` | Production route registration |
| `modules/live_execution_routes.py` | Live execution routes |

---

## Frontend Structure (`/app/frontend/src/`)

### Pages (`pages/`)
| Page | Route | Description |
|------|-------|-------------|
| `Trading/` | `/trading` | Main trading terminal (tabs: Trade, Positions, Decisions, Analytics) |
| `TechAnalysis/` | `/tech-analysis` | Technical analysis page |
| `Exchange/` | `/exchange` | Exchange page |
| `Intelligence/` | `/intelligence` | Market intelligence |
| `OnchainV3/` | `/onchain` | On-chain analytics |
| `fomo-ai/` | `/fomo-ai` | FOMO AI assistant |
| Various admin pages | `/admin/*` | Admin dashboard |

### Trading Terminal Components (`components/terminal/`)
| Directory | Purpose |
|-----------|---------|
| `workspaces/TradeWorkspace.jsx` | Trade tab (pending decisions, active cases, signal generation) |
| `workspaces/PositionsWorkspace.jsx` | Positions tab (open positions, exchange sync) |
| `workspaces/DecisionsWorkspace.jsx` | Decisions tab (decision trace, approval flow) |
| `workspaces/AnalyticsWorkspace.jsx` | Analytics tab (all analytics panels) |
| `analytics/DecisionQualityPanel.jsx` | **P2**: Decision quality (win rate, confidence, direction, losses) |
| `analytics/DecisionAnalyticsPanel.jsx` | Sprint 5 decision analytics |
| `analytics/DynamicRiskAnalyticsPanel.jsx` | Dynamic risk analytics |
| `analytics/ExecutionAnalyticsPanel.jsx` | Execution analytics |
| `analytics/SafetyAnalyticsPanel.jsx` | Safety analytics |
| `analytics/AdaptiveRiskAnalyticsPanel.jsx` | Adaptive risk (R2) analytics |
| `analytics/LearningInsightsPanel.jsx` | Learning insights |
| `hero/` | Terminal hero section |
| `positions/` | Position components |
| `trade-case/` | Trade case components |
| `execution/` | Execution components |
| `strategies/` | Strategy components |
| `guards/` | Guard components |
| `portfolio/` | Portfolio components |
| `risk/` | Risk components |

### Hooks (`hooks/`)
| Hook | Purpose |
|------|---------|
| `analytics/useDecisionQuality.js` | **P2**: Fetches decision quality analytics (15s refresh) |
| `analytics/useDecisionAnalytics.js` | Sprint 5 decision analytics |
| `analytics/useExecutionAnalytics.js` | Execution analytics |
| `analytics/useSafetyAnalytics.js` | Safety analytics |
| `analytics/useLearningInsights.js` | Learning insights |
| `runtime/` | Runtime hooks (decisions, approve/reject) |
| `positions/` | Position hooks |
| `execution/` | Execution hooks |
| `portfolio/` | Portfolio hooks |
| `strategy/` | Strategy hooks |
| `adaptation/` | Adaptation hooks |
| `dynamic_risk/` | Dynamic risk hooks |
| `auto_safety/` | Auto safety hooks |
| `zap/` | ZAP hooks |

---

## Database Collections

### `trading_os` (Primary operational database)

| Collection | Documents | Purpose |
|------------|-----------|---------|
| `trading_cases` | ~60 | Trading positions (ACTIVE/CLOSED). Fields: `case_id`, `symbol`, `side`, `avg_entry_price`, `current_price`, `qty`, `realized_pnl`, `unrealized_pnl`, `status`, `decision_id`, `strategy` |
| `pending_decisions` | ~69 | Pending trading decisions. Fields: `decision_id`, `symbol`, `side`, `entry_price`, `confidence`, `size_usd`, `strategy`, `status` (PENDING/EXECUTED/REJECTED) |
| `execution_jobs` | ~18 | Execution queue. Fields: `jobId`, `status` (queued/acked/retry_wait/dead), `payload`, `retryCount` |
| `execution_events` | ~266 | Execution event log |
| `decision_outcomes` | ~10 | Trade outcomes for analytics. Fields: `decision_id`, `symbol`, `side`, `entry_price`, `exit_price`, `signal_price`, `qty`, `pnl_usd`, `pnl_pct`, `is_win`, `strategy` |
| `portfolio_positions` | 3 | Portfolio-level positions (OPEN/CLOSED) |
| `exchange_positions` | 3 | Exchange-level positions |
| `exchange_accounts` | 1 | Exchange account info |
| `exchange_balances` | 1 | Exchange balances |
| `exchange_sync_logs` | ~324 | Exchange sync audit logs |
| `execution_queue_audit` | ~68 | Queue operation audit |
| `candles` | ~3022 | OHLCV candle data |
| `decision_traces` | ~8 | Decision reasoning traces |
| `runtime_config` | 1 | Runtime configuration |
| `worker_heartbeats` | ~62 | Worker health heartbeats |
| `auto_safety_config` | 1 | Auto-safety configuration |
| `auto_safety_state` | 1 | Auto-safety state |

### `trading_db` (Exchange-specific)

| Collection | Purpose |
|------------|---------|
| `exchange_accounts` | Exchange account state |
| `exchange_positions` | Exchange position state |
| `fills` | Trade fills |
| `portfolio_snapshots` | Portfolio snapshots |
| `positions` | Legacy positions |

### `test_database` (Default/test)

| Collection | Purpose |
|------------|---------|
| `candles` | Test candle data (200 docs) |
| `pattern_outcomes` | Pattern outcome tracking (69 docs) |
| Various others | Test/dev data |

---

## API Endpoints

### Health & System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| GET | `/api/system/health` | Detailed system health |
| GET | `/api/system/db-health` | Database health check |
| GET | `/api/system/indexing-status` | Indexing status |

### Risk Guards (P1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/runtime/risk-status` | Risk guard status (config, stats, integrity, total_pnl, open_positions) |
| POST | `/api/runtime/risk-reset` | Reset kill switch |

### Decision Quality Analytics (P2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/decision-quality` | Full decision quality report (win rate, confidence, strategy, direction, slippage, losses) |

### Runtime / Decisions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/runtime/start` | Start runtime daemon |
| POST | `/api/runtime/stop` | Stop runtime daemon |
| GET | `/api/runtime/status` | Runtime status |
| GET | `/api/runtime/decisions/pending` | List pending decisions |
| POST | `/api/runtime/decisions/{id}/approve` | Approve a decision (triggers execution) |
| POST | `/api/runtime/decisions/{id}/reject` | Reject a decision |
| POST | `/api/trade-this` | Manual trade entry |

### Trading Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trading/cases/active` | List active trading cases |
| POST | `/api/trading/cases/{id}/close` | Close a trading case (with PnL sanity check) |

### Positions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/positions` | List exchange positions |

### Market Data / Coinbase
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/provider/coinbase/status` | Coinbase provider status |
| GET | `/api/provider/coinbase/health` | Coinbase health |
| GET | `/api/provider/coinbase/ticker/{symbol}` | Live ticker price |
| GET | `/api/provider/coinbase/candles/{symbol}` | OHLCV candles |
| GET | `/api/provider/list` | Available data providers |

### Technical Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ta/registry` | TA pattern registry |
| GET | `/api/ta/patterns` | Active patterns |
| POST | `/api/ta/analyze` | Run TA analysis |

### Charts & Market
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ui/candles` | Candle data for charts |
| GET | `/api/market/candles` | Market candle data |
| GET | `/api/market/chart/price-vs-expectation-v4` | Price vs expectation chart |

### Fractal Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fractal/summary/{asset}` | Fractal summary |
| GET | `/api/fractal/v2.1/chart` | Fractal chart data |
| GET | `/api/fractal/v2.1/signal` | Fractal signals |
| GET | `/api/fractal/v2.1/focus-pack` | Fractal focus pack |

### Forecast & Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast/{asset}` | Asset forecast |
| GET | `/api/meta-brain-v2/forecast-curve` | Meta-brain forecast curve |
| GET | `/api/prediction/snapshots` | Prediction snapshots |

### Dashboard & Frontend
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/frontend/dashboard` | Dashboard data |
| GET | `/api/ui/overview` | UI overview data |
| GET | `/api/alerts/feed` | Alert feed |
| GET | `/api/exchange/pressure` | Exchange pressure data |
| GET | `/api/advanced/signals-attribution` | Signal attribution |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/auth/login` | Admin login |
| GET | `/api/admin/auth/status` | Auth status |

### Additional Module Routes
60+ additional route files registered from modules (see `modules/*/routes.py`). Key ones:
- `/api/exchange/*` — Exchange operations
- `/api/strategy/*` — Strategy management
- `/api/portfolio/*` — Portfolio operations
- `/api/scanner/*` — Asset scanning
- `/api/research/*` — Research tools
- `/api/learning/*` — Learning system
- `/api/simulation/*` — Simulation engine
- `/api/validation/*` — Validation framework

---

## Configuration

### Backend `.env`
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
EXECUTION_MODE=PAPER
```

### Frontend `.env`
```
REACT_APP_BACKEND_URL=https://<domain>.preview.emergentagent.com
```

### Key Config Values
| Setting | Value | Description |
|---------|-------|-------------|
| `EXECUTION_MODE` | `PAPER` | Paper trading with real Coinbase prices |
| `MAX_POSITION_SIZE_USD` | $100 | Max single position size |
| `MAX_OPEN_POSITIONS` | 5 | Max concurrent open positions |
| `KILL_SWITCH_THRESHOLD_USD` | -$10 | Total PnL threshold to halt trading |
| `MAX_SLIPPAGE_PCT` | 1.0% | Max allowed slippage between signal and execution price |

---

## Risk Guards (P1 + P2.5)

| # | Guard | Rule | Response |
|---|-------|------|----------|
| 1 | Max Position Size | `size_usd > $100` | REJECT order |
| 2 | Max Open Positions | `open_positions >= 5` | REJECT order |
| 3 | Duplicate Protection | `decision_id` already has active case | REJECT order |
| 4 | Close Integrity | PnL math check: `|(calc_pnl - stored_pnl)| > $0.01` | LOG warning |
| 5 | Kill Switch | `total_realized_pnl < -$10` | HALT all trading |
| 6 | Slippage Guard | `|exec_price - signal_price| / signal_price > 1%` | REJECT order |

### PnL Calculation (Direction-Aware)
```python
# LONG: profit when price goes UP
pnl = (exit_price - entry_price) * qty

# SHORT: profit when price goes DOWN
pnl = (entry_price - exit_price) * qty
```

Verified correct for all 10 closed cases (4 SHORT, 6 LONG).

---

## Decision Quality Analytics (P2)

### Metrics Computed
- **Core**: total_trades, win_rate, avg_win, avg_loss, profit_factor
- **Confidence Calibration**: win_rate by 5 confidence buckets (0-0.5, 0.5-0.6, 0.6-0.7, 0.7-0.8, 0.8-1.0)
- **Strategy Breakdown**: per-strategy trades, win_rate, total_pnl, avg_pnl
- **Direction Analysis**: LONG vs SHORT (trades, win_rate, avg_pnl, total_pnl)
- **Hourly Analysis**: per-hour (0-23) trades, win_rate, avg_pnl
- **Slippage**: avg_slippage, max_slippage, distribution by buckets
- **Loss Explainability**: last 10 losses with full details

### UI Blocks (Analytics Tab)
1. Core Metrics — 5 cards (Total Trades, Win Rate, Avg Win, Avg Loss, Profit Factor)
2. Confidence Calibration — table with buckets
3. Direction Analysis — LONG vs SHORT side-by-side
4. Recent Losses — table with symbol, side, confidence, entry/exit, PnL, time

---

## Execution Audit Logging (P2.5)

Every PAPER execution logs:
```
EXECUTION AUDIT: symbol=BTCUSDT signal_price=$75,100.00 execution_price=$75,110.70 
  slippage=$10.70 slippage_pct=0.0142% price_source=coinbase 
  execution_timestamp=2026-04-15T22:11:26Z
```

---

## Known Issues / Insights

| Issue | Explanation | Action |
|-------|-------------|--------|
| SHORT 0% win rate | Not a bug. Market was bullish during test period. All SHORTs entered at lower execution price (due to slippage) and exited at higher price. | Verify with more data |
| Avg slippage $337 | Real market drift between signal generation time and approval/execution time. Not a bug. | Slippage guard active at 1% |
| Profit factor 74 | Unreliable — dataset too small (10 trades, 6 LONG wins). Need 50+ trades. | Accumulate data |
| Confidence not calibrated | Buckets show random win rates. Need 50+ trades per bucket. | Future P3 task |
| Position sync cycle | `sync_service` can sometimes clear demo positions if exchange state differs. | Monitored |

---

## Deployment

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+

### Quick Start
```bash
# Backend
cd /app/backend
pip install -r requirements.txt
python server.py  # Runs on port 8001

# Frontend
cd /app/frontend
yarn install
yarn start  # Runs on port 3000
```

### Environment Variables
1. Copy `.env.example` to `.env` in both `backend/` and `frontend/`
2. Set `MONGO_URL`, `DB_NAME`, `EXECUTION_MODE`
3. Set `REACT_APP_BACKEND_URL` to your backend URL

### Supervisor (Production)
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Seed Data
The system auto-generates demo positions on startup via `coinbase_auto_init.py` and the runtime daemon generates pending decisions when started.

---

## Development History

| Date | Phase | Changes |
|------|-------|---------|
| Apr 15, 2026 | P0 | Real Coinbase prices (replaced mock $50k), `EXECUTION_MODE=PAPER`, position persistence, sync safety |
| Apr 15, 2026 | P0 UI | Fixed layout overlaps, reverted dark mode to light theme, fixed invisible headings |
| Apr 15, 2026 | P1 | 5 risk guards (`risk_guard.py`), `/api/runtime/risk-status`, `/api/runtime/risk-reset` |
| Apr 15, 2026 | P2 | Decision quality analytics (`decision_quality.py`), `/api/analytics/decision-quality`, UI blocks |
| Apr 15, 2026 | P2.5 | SHORT PnL verified correct, slippage investigated (market drift), execution audit logging, slippage guard (1%), signal_price propagation |

---

## Test Reports

- `/app/test_reports/iteration_1.json` — Post-deployment testing
- `/app/test_reports/iteration_2.json` — Post-P0/UI fix testing
- `/app/backend/tests/test_risk_guard.py` — Risk guard comprehensive test (all 5 guards pass)

---

## License

Private repository. All rights reserved.
