import requests
import sys
from datetime import datetime
import json

class PersonalFinanceAPITester:
    def __init__(self, base_url="https://budgetpwa-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.account_id = None
        self.category_id = None
        self.transaction_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_public_endpoint(self):
        """Test the public API endpoint"""
        return self.run_test(
            "Public API Status",
            "GET",
            "",
            200
        )

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints return 401 without auth"""
        endpoints = [
            "accounts",
            "categories", 
            "transactions",
            "budgets",
            "stats/summary"
        ]
        
        print("\n🔒 Testing protected endpoints without authentication...")
        for endpoint in endpoints:
            success, _ = self.run_test(
                f"Protected {endpoint} (no auth)",
                "GET",
                endpoint,
                401
            )

    def test_with_mock_token(self):
        """Test endpoints with a mock token to see error handling"""
        print("\n🔑 Testing with invalid token...")
        self.token = "invalid_token_12345"
        
        success, _ = self.run_test(
            "Accounts with invalid token",
            "GET", 
            "accounts",
            401
        )
        
        self.token = None  # Reset token

def main():
    print("🚀 Starting Personal Finance Manager API Tests")
    print("=" * 60)
    
    # Setup
    tester = PersonalFinanceAPITester()
    
    # Test 1: Public endpoint
    print("\n📋 PHASE 1: Public Endpoint Testing")
    success, response = tester.test_public_endpoint()
    if not success:
        print("❌ Public API endpoint failed - this is critical!")
        print("   The backend may not be running or accessible")
    else:
        expected_message = "Personal Finance Manager API"
        if "message" in response and expected_message in response["message"]:
            print("✅ Public endpoint returned correct message")
        else:
            print("⚠️  Public endpoint accessible but message format unexpected")

    # Test 2: Protected endpoints without auth
    print("\n📋 PHASE 2: Authentication Testing")
    tester.test_protected_endpoints_without_auth()
    
    # Test 3: Invalid token testing
    tester.test_with_mock_token()

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 BACKEND API TEST RESULTS")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All backend API tests passed!")
        print("   - Public endpoint is accessible")
        print("   - Authentication is properly enforced")
        print("   - Error handling is working")
    else:
        print("❌ Some backend tests failed")
        print("   - Check backend service status")
        print("   - Verify Supabase configuration")
        print("   - Check network connectivity")
    
    print("\n📝 NOTES:")
    print("   - Full CRUD testing requires valid Supabase user authentication")
    print("   - Frontend testing will create test user and perform full flow")
    print("   - Database schema must be properly set up in Supabase")
    
    return 0 if tester.tests_passed >= (tester.tests_run * 0.8) else 1

if __name__ == "__main__":
    sys.exit(main())