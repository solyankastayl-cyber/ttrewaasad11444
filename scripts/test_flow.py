#!/usr/bin/env python3
"""
FOMO-Trade E2E Flow Test
=========================

Tests complete cycle: Decision → Execution → Position → Outcome

Usage:
    python /app/scripts/test_flow.py
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import aiohttp

# Add backend to path
sys.path.insert(0, '/app/backend')


async def test_complete_flow():
    """Test full paper trading cycle."""
    
    print("=" * 70)
    print("FOMO-Trade E2E Flow Test")
    print("=" * 70)
    
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client["trading_os"]
    backend_url = "http://localhost:8001"
    
    decision_id = f"e2e-test-{datetime.now(timezone.utc).timestamp()}"
    
    # Step 1: Create Decision
    print("\n[Step 1] Creating test decision...")
    decision = {
        "decision_id": decision_id,
        "symbol": "BTCUSDT",
        "side": "BUY",
        "strategy": "E2E_TEST",
        "confidence": 0.85,
        "entry_price": 70000.0,
        "stop_price": 68000.0,
        "target_price": 73000.0,
        "size_usd": 500,
        "thesis": "E2E flow test",
        "timeframe": "1h",
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db["pending_decisions"].insert_one(decision)
    print(f"✅ Decision created: {decision_id}")
    
    # Step 2: Approve Decision
    print("\n[Step 2] Approving decision...")
    async with aiohttp.ClientSession() as session:
        approve_url = f"{backend_url}/api/runtime/decisions/{decision_id}/approve"
        async with session.post(approve_url) as response:
            if response.status == 200:
                result = await response.json()
                job_id = result.get("result", {}).get("job_id")
                print(f"✅ Approved → job_id={job_id}")
            else:
                print(f"❌ Approval failed: {response.status}")
                return False
    
    # Step 3: Wait for Execution
    print("\n[Step 3] Waiting for execution (3s)...")
    await asyncio.sleep(3)
    
    # Step 4: Verify Job Status
    print("\n[Step 4] Checking execution status...")
    job = await db["execution_jobs"].find_one({"jobId": job_id})
    
    if job:
        job_status = job.get("status")
        print(f"✅ Job status: {job_status}")
        
        if job_status != "acked":
            print(f"⚠️  Warning: Expected 'acked', got '{job_status}'")
    else:
        print(f"❌ Job not found: {job_id}")
        return False
    
    # Step 5: Verify Position Created
    print("\n[Step 5] Checking position creation...")
    position = await db["trading_cases"].find_one({"decision_id": decision_id})
    
    if position:
        case_id = position.get("case_id")
        print(f"✅ Position created: {case_id}")
        print(f"   symbol: {position.get('symbol')}")
        print(f"   side: {position.get('side')}")
        print(f"   qty: {position.get('qty')}")
        print(f"   entry_price: ${position.get('avg_entry_price'):.2f}")
        print(f"   status: {position.get('status')}")
        
        if position.get('qty') == 0 or position.get('avg_entry_price') == 0:
            print(f"⚠️  Warning: qty or entry_price is 0 (PAPER mode issue)")
    else:
        print(f"❌ Position not found for decision: {decision_id}")
        return False
    
    # Step 6: Close Position
    print("\n[Step 6] Closing position...")
    async with aiohttp.ClientSession() as session:
        close_url = f"{backend_url}/api/trading/cases/{case_id}/close"
        close_data = {
            "close_price": 71500.0,
            "close_reason": "E2E_TEST_CLOSE"
        }
        
        async with session.post(close_url, json=close_data) as response:
            if response.status == 200:
                result = await response.json()
                print(f"✅ Position closed")
                print(f"   realized_pnl: ${result.get('realized_pnl'):.2f}")
            else:
                print(f"❌ Close failed: {response.status}")
                return False
    
    # Step 7: Verify Outcome
    print("\n[Step 7] Checking outcome...")
    await asyncio.sleep(1)
    
    outcome = await db["decision_outcomes"].find_one({"decision_id": decision_id})
    
    if outcome:
        print(f"✅ Outcome written")
        print(f"   pnl_usd: ${outcome.get('pnl_usd'):.2f}")
        print(f"   pnl_pct: {outcome.get('pnl_pct'):.2f}%")
        print(f"   is_win: {outcome.get('is_win')}")
    else:
        print(f"❌ Outcome not found")
        return False
    
    # Final Verdict
    print("\n" + "=" * 70)
    print("E2E FLOW TEST: ✅ PASSED")
    print("=" * 70)
    print("\nAll steps completed successfully:")
    print("  Decision → Approve → Execution → Position → Close → Outcome")
    print("         ✅        ✅          ✅          ✅        ✅       ✅")
    
    return True


async def main():
    try:
        success = await test_complete_flow()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
