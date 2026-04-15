# FOMO-Trade Architecture — v1.2

## System Design Philosophy

**Decision Operating System** — not just a trading bot, but a complete decision-making system with:
- **Signal generation** (input)
- **Risk evaluation** (processing)
- **Execution** (output)
- **Outcome tracking** (feedback loop)
- **Adaptation** (learning — currently locked)

---

## Core Components

### 1. Signal Generation Layer

**Purpose:** Generate trading signals from market data

**Components:**
- **TA Engine** (P2 - currently stuck/slow)
  - Complex multi-timeframe analysis
  - Pattern recognition
  - Status: Bypassed via SimpleMA

- **SimpleMAGenerator** (Active)
  - MA5 crossover logic
  - 10s polling interval
  - 5min cooldown per symbol
  - Confidence: 0.6 (fixed baseline)

**Flow:**
```
MarketData → SimpleMAGenerator → Signal → RuntimeService.create_decision()
```

---

### 2. Decision Layer (RuntimeService)

**Purpose:** Orchestrate decision lifecycle from signal to execution

**Key Responsibilities:**
- Accept signals from generators
- Apply Risk Engine (R1 + R2)
- Apply AutoSafety (kill switch)
- Create decisions in MongoDB
- Handle approvals
- Submit to execution layer

**Risk Pipeline:**
```
Signal → R1 (Dynamic sizing) → R2 (Adaptive - LOCKED) → AutoSafety → Decision
```

**R1 - Dynamic Risk Engine:**
- Confidence-based sizing
- Volatility adjustment
- Drawdown protection
- Portfolio heat limits

**R2 - Adaptive Risk (DISABLED):**
- Context-aware dampening
- Historical performance feedback
- **Status:** Locked for first 50 trades

**AutoSafety:**
- Kill switch
- Max drawdown halt
- **Status:** Inactive by default

---

### 3. Execution Layer

**Purpose:** Execute approved decisions via queue-based workers

**Architecture:**
```
ExecutionBridge → ExecutionQueue → Workers (2x) → ExecutionHandler
                                                          ↓
                                                  PAPER Mode Simulator
                                                          ↓
                                                  Position Creation
```

**ExecutionBridge:**
- Entry point from RuntimeService
- Creates execution jobs with idempotency keys
- Submits to queue (MongoDB `execution_jobs` collection)

**ExecutionQueue:**
- MongoDB-backed job queue
- FIFO processing
- Job states: `pending` → `in_flight` → `acked` | `retry_wait` | `failed_terminal`
- Retry logic: 3 attempts, 30s backoff

**ExecutionWorkers (2x):**
- Poll queue every 2s
- Lease jobs with timeout
- Process via ExecutionHandler
- Update heartbeats

**ExecutionHandler:**
- Modes: DRY_RUN, PAPER, REAL
- **PAPER mode (active):**
  - Enriches payload with real market price
  - Simulates fill via ExecutionSubmitSimulator
  - Calls _handle_fill() → creates position

---

### 4. Position Management Layer

**Purpose:** Track open/closed positions and outcomes

**TradingCaseService:**
- Create position on FILLED
- Update position state
- Close position (manual or auto)
- Write outcome on close

**TradingCaseRepository:**
- MongoDB persistence (`trading_cases` collection)
- In-memory cache for fast access

**Flow:**
```
ExecutionWorker._handle_fill() → TradingCaseService.create_case()
                                           ↓
                                  MongoDB.trading_cases
                                           ↓
                             (Wait for close signal)
                                           ↓
                       TradingCaseService.close_case()
                                           ↓
                              _write_decision_outcome()
                                           ↓
                             MongoDB.decision_outcomes
```

---

### 5. Observability Layer

**Purpose:** Monitor system health and flow integrity

**Endpoints:**

**`GET /api/system/status`:**
```json
{
  "decisions": { "total": N, "approved": N, "pending": N },
  "positions": { "total": N, "active": N, "closed": N },
  "flow_integrity": {
    "overall_pct": X,
    "last_10_pct": Y,
    "last_20_pct": Z
  },
  "adaptation_disabled": true
}
```

**`GET /api/system/recent-trades`:**
```json
{
  "recent_trades": [
    { "symbol": "BTCUSDT", "pnl_usd": X, "is_win": bool }
  ]
}
```

---

## Data Flow (Complete Cycle)

```
1. Market Data (Binance API)
       ↓
2. SimpleMAGenerator (MA5 logic)
       ↓
3. Signal { symbol, side, confidence=0.6 }
       ↓
4. RuntimeService.create_decision()
       ├─ R1: Dynamic sizing
       ├─ R2: DISABLED (baseline mode)
       └─ AutoSafety: Check
       ↓
5. MongoDB.pending_decisions { status: "PENDING" }
       ↓
6. [MANUAL APPROVE] (operator clicks button)
       ↓
7. RuntimeService.approve_decision()
       ↓
8. ExecutionBridge.submit()
       ↓
9. MongoDB.execution_jobs { status: "pending" }
       ↓
10. ExecutionWorker.lease_next() (polls queue)
       ↓
11. ExecutionHandler.execute_order() (PAPER mode)
       ├─ Enrich with real market price
       └─ ExecutionSubmitSimulator (simulated fill)
       ↓
12. ExecutionWorker._handle_fill()
       ↓
13. TradingCaseService.create_case()
       ↓
14. MongoDB.trading_cases { status: "ACTIVE" }
       ↓
15. [MANUAL CLOSE or AUTO SIGNAL]
       ↓
16. TradingCaseService.close_case(close_price)
       ├─ Calculate PnL
       └─ _write_decision_outcome()
       ↓
17. MongoDB.decision_outcomes { pnl_usd, is_win }
       ↓
18. Analytics / Learning Feedback (future)
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** MongoDB (Motor async driver)
- **Queue:** MongoDB-backed job queue
- **Market Data:** Binance API (REST)
- **Async:** asyncio, aiohttp

### Frontend
- **Framework:** React 18
- **UI Library:** Shadcn/UI
- **Styling:** Tailwind CSS
- **State:** React Context + hooks
- **Build:** Vite

### Infrastructure
- **Process Manager:** Supervisor
- **Reverse Proxy:** Nginx (handled by platform)
- **Environment:** Kubernetes (Emergent platform)

---

## Deployment Architecture

```
┌────────────────────────────────────────────────┐
│              Kubernetes Cluster                 │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Ingress (Nginx)                         │ │
│  │  ├─ /api/* → Backend (8001)              │ │
│  │  └─ /*     → Frontend (3000)             │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Backend Service (FastAPI)               │ │
│  │  ├─ RuntimeService                       │ │
│  │  ├─ ExecutionWorkers (2x)                │ │
│  │  ├─ SignalGeneratorRunner                │ │
│  │  └─ MarketData polling                   │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Frontend Service (React)                │ │
│  │  └─ Static build served by nginx         │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  MongoDB (Persistent Volume)             │ │
│  │  ├─ pending_decisions                    │ │
│  │  ├─ execution_jobs                       │ │
│  │  ├─ trading_cases                        │ │
│  │  └─ decision_outcomes                    │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## Security Considerations

### Current (PAPER mode)
- ✅ No real capital at risk
- ✅ MongoDB local (no external access)
- ✅ CORS: `*` (development only)
- ⚠️ No authentication on API endpoints

### Required for REAL mode
- [ ] API authentication (JWT)
- [ ] Encrypted API keys (vault)
- [ ] Rate limiting
- [ ] Audit logging
- [ ] CORS: whitelist only
- [ ] HTTPS only

---

## Performance Characteristics

### Throughput
- **Signal generation:** 1 per 5 minutes (cooldown limited)
- **Execution queue:** ~30 jobs/minute (2 workers)
- **Position management:** O(1) lookups via case_id

### Latency
- **Decision approval → execution:** <2s (queue polling)
- **Execution → position creation:** <500ms
- **Market data refresh:** 10s intervals

### Scalability
- **Horizontal:** Add more execution workers (config)
- **Vertical:** MongoDB indexes for large position sets
- **Current limits:** Designed for 1k decisions/day max

---

## Known Architectural Debt

1. **Entry price fallback**
   - Simulator uses $50k fallback instead of real market price
   - Impact: PnL inaccurate
   - Fix: Integrate MarketData directly in PAPER enrichment

2. **TA Engine async deadlock**
   - Complex TA analysis hangs
   - Workaround: SimpleMA bypass
   - Fix: Refactor TA worker with proper timeouts

3. **No auto-close logic**
   - Positions require manual close
   - Missing: Stop-loss, take-profit triggers
   - Planned: Auto-close on opposite signal

4. **Flow integrity tracking reactive**
   - Calculated on-demand via MongoDB queries
   - Better: Real-time event stream

---

## Future Architecture (v2.0)

### Planned Improvements
- **Event-driven architecture** (vs polling)
- **Redis-backed queue** (vs MongoDB)
- **WebSocket market data** (vs REST polling)
- **Distributed tracing** (OpenTelemetry)
- **Multi-symbol parallelization**
- **Real exchange integration** (Binance Spot API)

---

**Last Updated:** April 15, 2026  
**Version:** 1.2.0
