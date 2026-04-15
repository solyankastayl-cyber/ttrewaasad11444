#!/usr/bin/env python3
"""
FOMO-Trade v1.2 Backend API Testing
===================================
Testing all backend endpoints for the trading terminal application.
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class FOMOTradeAPITester:
    def __init__(self, base_url="https://stack-inspector-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {"raw": response.text}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "name": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout")
            self.failed_tests.append({"name": name, "error": "timeout"})
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({"name": name, "error": str(e)})
            return False, {}

    def test_health_endpoint(self):
        """Test basic health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/admin/auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   🔑 Token acquired: {self.token[:20]}...")
            return True
        return False

    def test_system_status(self):
        """Test system status endpoint"""
        return self.run_test(
            "System Status",
            "GET",
            "api/system/status",
            200
        )

    def test_portfolio_state(self):
        """Test portfolio state endpoint"""
        return self.run_test(
            "Portfolio State",
            "GET",
            "api/portfolio/state",
            200
        )

    def test_positions(self):
        """Test positions endpoint - should return 3 open positions"""
        success, response = self.run_test(
            "Positions List",
            "GET",
            "api/positions",
            200
        )
        
        if success:
            positions = response if isinstance(response, list) else response.get('positions', [])
            print(f"   📊 Found {len(positions)} positions")
            
            # Check for expected symbols
            expected_symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
            found_symbols = [pos.get('symbol') for pos in positions if pos.get('symbol')]
            
            for symbol in expected_symbols:
                if symbol in found_symbols:
                    print(f"   ✅ Found expected position: {symbol}")
                else:
                    print(f"   ⚠️  Missing expected position: {symbol}")
            
            return len(positions) >= 3
        return False

    def test_decision_traces(self):
        """Test decision traces endpoint - should return 8 traces"""
        success, response = self.run_test(
            "Decision Traces",
            "GET",
            "api/trace/latest?limit=10",
            200
        )
        
        if success:
            traces = response.get('traces', [])
            print(f"   📈 Found {len(traces)} decision traces")
            
            if len(traces) >= 8:
                print(f"   ✅ Expected 8+ traces found")
                
                # Check trace statuses
                statuses = {}
                for trace in traces:
                    status = trace.get('final_status', 'UNKNOWN')
                    statuses[status] = statuses.get(status, 0) + 1
                
                print(f"   📊 Trace statuses: {statuses}")
                return True
            else:
                print(f"   ⚠️  Expected 8+ traces, found {len(traces)}")
                return False
        return False

    def test_execution_reality(self):
        """Test execution reality system state"""
        return self.run_test(
            "Execution Reality System State",
            "GET",
            "api/execution-reality/system/state",
            200
        )

    def test_dynamic_risk_stats(self):
        """Test dynamic risk stats"""
        return self.run_test(
            "Dynamic Risk Stats",
            "GET",
            "api/dynamic-risk/stats",
            200
        )

    def test_runtime_daemon_status(self):
        """Test runtime daemon status"""
        return self.run_test(
            "Runtime Daemon Status",
            "GET",
            "api/runtime/daemon/status",
            200
        )

    def test_market_data(self):
        """Test market data endpoints"""
        success, response = self.run_test(
            "Market Data Freshness",
            "GET",
            "api/market-data/freshness",
            200
        )
        return success

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 FOMO-Trade v1.2 Backend Test Summary")
        print(f"{'='*60}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                print(f"   - {test['name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run


def main():
    """Run all backend tests"""
    print("🚀 Starting FOMO-Trade v1.2 Backend API Tests")
    print("=" * 60)
    
    tester = FOMOTradeAPITester()
    
    # Core system tests
    print("\n🔧 CORE SYSTEM TESTS")
    tester.test_health_endpoint()
    
    # Authentication
    print("\n🔐 AUTHENTICATION TESTS")
    login_success = tester.test_admin_login()
    
    # System endpoints
    print("\n📊 SYSTEM STATUS TESTS")
    tester.test_system_status()
    tester.test_runtime_daemon_status()
    
    # Trading data tests
    print("\n💰 TRADING DATA TESTS")
    tester.test_portfolio_state()
    tester.test_positions()
    tester.test_decision_traces()
    
    # Execution system tests
    print("\n⚡ EXECUTION SYSTEM TESTS")
    tester.test_execution_reality()
    tester.test_dynamic_risk_stats()
    
    # Market data tests
    print("\n📈 MARKET DATA TESTS")
    tester.test_market_data()
    
    # Print final summary
    success = tester.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())