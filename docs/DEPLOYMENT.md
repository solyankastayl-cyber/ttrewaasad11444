# FOMO-Trade Deployment Guide

## Quick Deploy (5 Minutes)

### Prerequisites Check

```bash
# Verify installations
python3 --version  # Should be 3.11+
node --version     # Should be 18+
mongod --version   # MongoDB running
```

---

## Option 1: Fresh Deployment

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/fomo-trade.git
cd fomo-trade
```

### 2. Run Bootstrap

```bash
./scripts/bootstrap.sh
```

This will:
- Install Python dependencies (`requirements.txt`)
- Install Node dependencies (`package.json`)
- Create `.env` files from templates
- Verify MongoDB connection

### 3. Start Services

```bash
# Start all services (managed by supervisor)
supervisorctl start all

# Verify status
supervisorctl status
```

Expected output:
```
backend    RUNNING   pid XXXX, uptime 0:00:05
frontend   RUNNING   pid YYYY, uptime 0:00:05
```

### 4. Verify Deployment

```bash
# Check system status
curl http://localhost:8001/api/system/status

# Access frontend
open http://localhost:3000
```

---

## Option 2: From Current State (Continuation)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/fomo-trade.git
cd fomo-trade
```

### 2. Restore Database (Optional)

If you have a MongoDB backup:

```bash
# Restore from dump
mongorestore --db trading_os /path/to/dump/trading_os
```

**Or start fresh** (MongoDB will auto-create collections).

### 3. Run Bootstrap

```bash
./scripts/bootstrap.sh
```

### 4. Verify Current State

```bash
# Check flow integrity
curl http://localhost:8001/api/system/status | jq '.flow_integrity'

# Should see:
# {
#   "overall_pct": X,
#   "last_10_pct": ~90-100,
#   "last_20_pct": Y
# }

# Check auto-decisions
curl http://localhost:8001/api/runtime/decisions | jq '.decisions[] | select(.auto_generated==true)'
```

---

## Configuration

### Environment Variables

Edit `/app/backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
EXECUTION_MODE="PAPER"
DISABLE_ADAPTATION="true"
```

**Important:**
- Keep `EXECUTION_MODE="PAPER"` until 50+ validated trades
- Keep `DISABLE_ADAPTATION="true"` for baseline phase

### Supervisor Config

Located at: `/etc/supervisor/conf.d/supervisord.conf`

**Do not modify** unless you know what you're doing.

---

## Monitoring

### Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.out.log
```

### System Status

```bash
# Flow integrity + metrics
curl http://localhost:8001/api/system/status

# Recent closed trades
curl http://localhost:8001/api/system/recent-trades
```

### Database

```bash
# Connect to MongoDB
mongo trading_os

# Check collections
> show collections
pending_decisions
execution_jobs
trading_cases
decision_outcomes

# Count auto-decisions
> db.pending_decisions.count({ auto_generated: true })
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check supervisor logs
supervisorctl tail backend stderr

# Check if ports are free
lsof -i :8001  # Backend
lsof -i :3000  # Frontend
```

### MongoDB Connection Failed

```bash
# Verify MongoDB is running
systemctl status mongod

# Check connection
mongo --eval "db.adminCommand('ping')"

# Update MONGO_URL in .env if needed
```

### Auto-Signal Generator Not Working

```bash
# Check if generator is running
tail -f /var/log/supervisor/backend.out.log | grep SimpleMA

# Should see:
# [SimpleMA] generate_signal called: price=$74XXX.XX
# [SimpleMA] MA5=$74XXX.XX, price=$74XXX.XX
```

### Flow Integrity Low

```bash
# Check last 10 approved decisions
curl http://localhost:8001/api/system/status | jq '.flow_integrity.last_10_pct'

# If <90%: Check execution logs
tail -n 100 /var/log/supervisor/backend.err.log | grep "Worker.*error"
```

---

## Testing

### E2E Flow Test

```bash
python /app/scripts/test_flow.py
```

Expected output:
```
[Step 1] Creating test decision... ✅
[Step 2] Approving decision... ✅
[Step 3] Waiting for execution... ✅
[Step 4] Checking execution status... ✅
[Step 5] Checking position creation... ✅
[Step 6] Closing position... ✅
[Step 7] Checking outcome... ✅

E2E FLOW TEST: ✅ PASSED
```

### Manual Approval Test

```bash
# Wait for auto-decision (5 min cooldown)
watch -n 5 'curl -s http://localhost:8001/api/runtime/decisions | jq ".decisions[] | select(.auto_generated==true and .status==\"PENDING\")" | head -5'

# Copy decision_id, then approve
curl -X POST http://localhost:8001/api/runtime/decisions/{decision_id}/approve

# Verify position created (wait 3s)
sleep 3
curl http://localhost:8001/api/system/status | jq '.flow_integrity.last_10_pct'
```

---

## Production Considerations

### Before Going Live (REAL mode)

- [ ] **DO NOT** set `EXECUTION_MODE="REAL"` yet
- [ ] Complete 50+ paper trades
- [ ] Verify flow integrity >95%
- [ ] Fix entry price issue (if not resolved)
- [ ] Add API authentication
- [ ] Configure exchange API keys (encrypted)
- [ ] Set up monitoring/alerts
- [ ] Test with small capital first

### Security Checklist

- [ ] Change MongoDB to require auth
- [ ] Set `CORS_ORIGINS` to specific domain
- [ ] Add rate limiting
- [ ] Enable HTTPS only
- [ ] Rotate API keys regularly
- [ ] Set up audit logging

---

## Backup & Restore

### Backup MongoDB

```bash
# Full backup
mongodump --db trading_os --out /backup/$(date +%Y%m%d)

# Backup specific collections
mongodump --db trading_os --collection trading_cases --out /backup/
```

### Restore MongoDB

```bash
# Full restore
mongorestore --db trading_os /backup/20260415/trading_os/

# Restore specific collection
mongorestore --db trading_os --collection trading_cases /backup/trading_cases.bson
```

---

## Scaling

### Add More Execution Workers

Edit `/app/backend/modules/execution_reality/queue_v2/execution_worker_manager.py`:

```python
# Line ~45
worker_count: int = 4  # Increase from 2
```

Restart backend:
```bash
supervisorctl restart backend
```

### Multi-Symbol Support

Currently hardcoded to `BTCUSDT`. To add symbols:

1. Update SignalGeneratorRunner to loop over symbols
2. Add per-symbol cooldown tracking
3. Update risk engine for symbol-specific limits

---

## Health Checks

### Automated Monitoring

Create cron job for health checks:

```bash
# Add to crontab
*/5 * * * * curl -s http://localhost:8001/api/system/status | jq '.flow_integrity.last_10_pct' > /tmp/flow_integrity.log
```

Set up alerts if flow integrity drops below 90%.

---

## Contact & Support

- **GitHub Issues:** Open issue with logs
- **Documentation:** `/app/docs/`
- **Current State:** `/app/docs/CURRENT_STATE.md`

---

**Last Updated:** April 15, 2026  
**Deployment Version:** 1.2.0
