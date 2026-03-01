import requests
import sys
from datetime import datetime
import json

class IDEALLabAPITester:
    def __init__(self, base_url="https://equipment-tracker-59.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        # Add authorization if available
        if use_admin and self.admin_token:
            req_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=req_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_initialization(self):
        """Test database initialization"""
        success, response = self.run_test(
            "Initialize Database",
            "POST",
            "init",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@ideal.iitk.ac.in", "password": "admin"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.token = response['token']  # Set as default token
            print(f"   Admin token acquired: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "richik24@iitk.ac.in", "password": "password123"}
        )
        if success and 'token' in response:
            self.user_token = response['token']
            print(f"   User token acquired: {self.user_token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Me",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test admin dashboard stats"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            use_admin=True
        )
        if success:
            print(f"   Stats: {json.dumps(response, indent=2)[:200]}...")
            # Check for expected counts
            users_count = response.get('total_users', 0)
            assets_count = response.get('total_assets', 0)
            print(f"   Users: {users_count}, Assets: {assets_count}")
            # Expected: 6 users (admin + 5 real users), 40 assets
            if users_count == 6:
                print(f"✅ Correct user count: {users_count}")
            else:
                print(f"⚠️ Expected 6 users, found {users_count}")
            
            if assets_count >= 35:  # Should be around 40, allowing some variance
                print(f"✅ Asset count looks good: {assets_count}")  
            else:
                print(f"⚠️ Expected ~40 assets, found {assets_count}")
        return success

    def test_user_dashboard_stats(self):
        """Test user dashboard stats with user token"""
        # Temporarily switch to user token
        temp_token = self.token
        self.token = self.user_token
        success, response = self.run_test(
            "User Dashboard Stats",
            "GET",
            "dashboard/user-stats",
            200
        )
        self.token = temp_token  # Restore admin token
        return success

    def test_get_users(self):
        """Test get all users"""
        success, response = self.run_test(
            "Get Users",
            "GET",
            "users",
            200,
            use_admin=True
        )
        if success:
            print(f"   Found {len(response)} users")
        return success

    def test_get_assets(self):
        """Test get all assets"""
        success, response = self.run_test(
            "Get Assets",
            "GET",
            "assets",
            200,
            use_admin=True
        )
        if success:
            print(f"   Found {len(response)} assets")
        return success

    def test_get_my_assets(self):
        """Test get user's assets"""
        # Switch to user token
        temp_token = self.token
        self.token = self.user_token
        success, response = self.run_test(
            "Get My Assets",
            "GET",
            "assets/my",
            200
        )
        self.token = temp_token
        if success:
            print(f"   User has {len(response)} assets")
        return success

    def test_get_service_requests(self):
        """Test get service requests"""
        success, response = self.run_test(
            "Get Service Requests",
            "GET",
            "service-requests",
            200,
            use_admin=True
        )
        return success

    def test_get_consumables(self):
        """Test get consumables"""
        success, response = self.run_test(
            "Get Consumables",
            "GET",
            "consumables",
            200,
            use_admin=True
        )
        return success

    def test_get_activity_logs(self):
        """Test get activity logs"""
        success, response = self.run_test(
            "Get Activity Logs",
            "GET",
            "activity-logs",
            200,
            use_admin=True
        )
        return success

    def test_notifications(self):
        """Test get notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        return success

    def test_create_user(self):
        """Test creating a new user"""
        user_data = {
            "name": "Test User",
            "email": "test@iitk.ac.in",
            "roll_no": "210099",
            "programme": "BTech Test",
            "password": "password123",
            "role": "user"
        }
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=user_data,
            use_admin=True
        )
        return success

def main():
    print("🧪 IDEAL Lab Inventory Management System - API Testing")
    print("=" * 60)
    
    # Setup
    tester = IDEALLabAPITester()
    
    # Test Core Authentication & Setup
    print("\n📋 Phase 1: Database Initialization & Authentication")
    tester.test_initialization()
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping critical tests")
        return 1
    
    if not tester.test_user_login():
        print("⚠️ User login failed, continuing with admin tests only")
    
    # Test Authentication
    print("\n🔐 Phase 2: Authentication Tests")
    tester.test_get_me()
    
    # Test Dashboard APIs
    print("\n📊 Phase 3: Dashboard Tests")
    tester.test_dashboard_stats()
    tester.test_user_dashboard_stats()
    
    # Test Core CRUD Operations
    print("\n👥 Phase 4: User Management Tests")
    tester.test_get_users()
    tester.test_create_user()
    
    # Test Asset Management
    print("\n📦 Phase 5: Asset Management Tests")
    tester.test_get_assets()
    tester.test_get_my_assets()
    
    # Test Service Management
    print("\n🔧 Phase 6: Service Management Tests")
    tester.test_get_service_requests()
    tester.test_get_consumables()
    
    # Test Audit & Notifications
    print("\n📝 Phase 7: Audit & Notification Tests")
    tester.test_get_activity_logs()
    tester.test_notifications()

    # Print final results
    print(f"\n📊 FINAL RESULTS")
    print("=" * 40)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())