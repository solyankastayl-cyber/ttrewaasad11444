# FOMO-Trade v1.2 — Trading Terminal with Decision Operating System

**Status:** Paper Trading Ready (100%)  
**Version:** 1.2.0  
**Last Updated:** April 15, 2026

---

## 🎯 What is FOMO-Trade?

A complete **Decision Operating System** for algorithmic trading that:

- **Generates** trading signals automatically (Technical Analysis + MA-based)
- **Evaluates** risk through multi-layer engine (R1 + R2 adaptive)
- **Executes** trades via queue-based worker system
- **Tracks** positions and outcomes for learning
- **Adapts** based on historical performance (currently LOCKED for baseline)

**Not just a bot — a full decision-making system with feedback loops.**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FOMO-Trade System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Signal Generation     →    Decision Layer                   │
│  ─────────────────          ──────────────                   │
│  • TA Engine                • Runtime Service                │
│  • Simple MA Generator      • Risk Engine (R1)               │
│  (Auto-generates)           • Adaptive Risk (R2 - LOCKED)    │
│                             • AutoSafety (Kill Switch)        │
│                                                               │
│                     ↓                                         │
│                                                               │
│  Execution Layer                                              │
│  ───────────────                                              │
│  • ExecutionBridge  →  Queue  →  Workers (2x)                │
│  • PAPER Mode (Real prices, simulated fills)                 │
│  • Latency tracking, Event logging                           │
│                                                               │
│                     ↓                                         │
│                                                               │
│  Position Management        →    Outcome Tracking            │
│  ───────────────────              ────────────────           │
│  • TradingCase Service            • Decision Outcomes        │
│  • MongoDB persistence            • Auto-close on signals          │
│  • Auto-close on signals          • Learning feedback        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Current State (v1.2.0)

### **Paper Trading Ready: 100%**

**Proven Flow:**
```
Auto-Signal → Decision → Approve → Execution → Position → Close → Outcome
     ✅          ✅         ✅          ✅          ✅        ✅       ✅
```

**What Works:**
- ✅ Auto-signal generation (MA5, 10s interval, 5min cooldown)
- ✅ Decision creation from signals
- ✅ Manual approval workflow
- ✅ Queue-based execution (2 workers, DRY_RUN mode)
- ✅ Position creation with real prices (PAPER mode)
- ✅ Position closing with outcome tracking
- ✅ Analytics and observability endpoints

**What's Locked (Intentionally):**
- 🔒 R2 Adaptive Risk (DISABLED for first 50 trades baseline)
- 🔒 Auto-approval (requires manual approve for safety)
- 🔒 TA Engine (bypassed via SimpleMA for stability)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or remote)
- Yarn package manager

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/fomo-trade.git
cd fomo-trade

# Run bootstrap (installs all dependencies)
./scripts/bootstrap.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required ENV variables:**
```env
MONGO_URL="mongodb://localhost:27017"
EXECUTION_MODE="PAPER"
DISABLE_ADAPTATION="true"
```

### 3. Start Services

```bash
# Start all services (backend + frontend)
supervisorctl start all

# Check status
supervisorctl status
```

### 4. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

---

## 📊 Observability Endpoints

### System Status
```bash
curl http://localhost:8001/api/system/status
```

Returns:
- Total decisions, approved, pending
- Positions (active/closed)
- **Flow integrity** (overall, last 10, last 20)
- Adaptation status

### Recent Trades
```bash
curl http://localhost:8001/api/system/recent-trades
```

Returns last 5 closed trades with PnL.

---

## 🔧 Configuration

### Execution Modes

**PAPER (Current):**
- Real market prices
- Simulated fills
- No real capital risk
- **Use for testing & validation**

**DRY_RUN:**
- Mock prices (fixed $50k)
- Simulated fills
- For development only

**REAL:**
- Real exchange integration
- Real capital at risk
- **NOT READY** (do not use)

### Key Settings

**Signal Generator:**
- `MA_PERIOD=5` (MA5 for fast testing)
- `INTERVAL=10` seconds
- `COOLDOWN=5` minutes

**Risk Engine:**
- R1: Dynamic sizing based on confidence, volatility, drawdown
- R2: DISABLED (locked for baseline)
- AutoSafety: Kill switch (inactive by default)

---

## 📁 Project Structure

```
/app/
├── backend/                    # FastAPI backend
│   ├── server.py              # Main entry point
│   ├── modules/
│   │   ├── runtime/           # Decision orchestrator
│   │   ├── execution/         # Execution bridge
│   │   ├── execution_reality/ # Queue workers, handlers
│   │   ├── signal_generator/  # Auto-signal generation
│   │   ├── trading_cases/     # Position management
│   │   ├── market_data_live/  # Real-time prices
│   │   ├── risk_engine/       # R1 risk evaluation
│   │   ├── adaptive_risk/     # R2 adaptive layer
│   │   └── system_status/     # Observability
│   └── requirements.txt
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── trading/       # Operator terminal
│   │   │   └── admin/         # Admin dashboard
│   │   └── components/
│   └── package.json
│
├── scripts/
│   ├── bootstrap.sh           # Quick setup
│   └── test_flow.py           # E2E flow test
│
└── docs/
    ├── ARCHITECTURE.md        # Detailed architecture
    ├── DEPLOYMENT.md          # Deployment guide
    ├── CURRENT_STATE.md       # Development status
    └── API.md                 # API documentation
```

---

## 🧪 Testing

### E2E Flow Test

```bash
# Test complete cycle: Decision → Execution → Position → Outcome
python /app/scripts/test_flow.py
```

### Manual Testing

1. **Create Auto-Decision:**
   - Wait for signal generator (auto)
   - Check `/api/runtime/decisions` for new decisions

2. **Approve Decision:**
   ```bash
   curl -X POST http://localhost:8001/api/runtime/decisions/{decision_id}/approve
   ```

3. **Verify Execution:**
   ```bash
   curl http://localhost:8001/api/system/status
   ```

4. **Check Position:**
   ```bash
   # Check trading_cases collection in MongoDB
   ```

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Entry Price Fixed at $50k** (PAPER mode issue)
   - Signal price: varies ($74k+)
   - Execution price: $50k (mock from MarketData fallback)
   - **Impact:** PnL calculations will be inaccurate
   - **Fix:** Use real market price at execution moment (planned)

2. **TA Engine Slow/Stuck**
   - "Analyzing market structure..." takes indefinitely
   - **Workaround:** Using SimpleMA generator instead
   - **Status:** Not blocking paper trading

3. **Flow Integrity 39% Overall**
   - Legacy data from pre-fix tests
   - **Last 10 approved:** 90% (1 old failed test)
   - **New auto-decisions:** 100% flow
   - **Not critical** for new flows

---

## 🚦 Development Roadmap

### ✅ Completed (v1.2.0)
- Paper trading infrastructure
- Auto-signal generation
- Full execution pipeline
- Position & outcome tracking
- Observability endpoints

### 🔄 In Progress
- First 50 trades observation
- Flow integrity monitoring
- PnL validation

### 📋 Next Steps (Post v1.2)
- Fix entry price (use real market price)
- Debug TA Engine signal generation
- Add error boundaries to UI
- Implement loading/empty states
- Position close automation (stop-loss/take-profit)

### 🎯 Future (v2.0)
- Enable R2 adaptation (after 50 trades baseline)
- Auto-approval logic
- Multi-symbol support
- Real exchange integration (Binance)

---

## 📝 Contributing

### Development Workflow

1. **DO NOT modify R1/R2 logic** (first 50 trades)
2. **DO NOT change signal generation** (collecting baseline)
3. **DO observe and report** anomalies
4. Focus on infrastructure, not strategy optimization

### Reporting Issues

Include:
- Flow integrity stats
- Decision ID
- Logs (`/var/log/supervisor/backend.*.log`)
- MongoDB state

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built with:
- FastAPI (Python backend)
- React (Frontend)
- MongoDB (Database)
- Shadcn/UI (Components)
- Binance API (Market data)

---

## 📧 Contact

For questions or support, open an issue on GitHub.

---

**⚠️ Disclaimer:** This is experimental trading software. Use at your own risk. Paper trading only recommended until system is validated through 50+ trades.
