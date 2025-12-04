import requests
import sys
import json
from datetime import datetime

class FleetCareAPITester:
    def __init__(self, base_url="https://vehicle-tracker-110.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON response)")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_data}")
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - backend may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@fleetcare.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True, test_data
        return False, test_data

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_add_vehicle(self):
        """Test adding a single vehicle"""
        success, response = self.run_test(
            "Add Single Vehicle",
            "POST",
            "vehicles",
            200,
            data={"registration_number": "MH12AB1234"}
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_bulk_add_vehicles(self):
        """Test bulk adding vehicles"""
        success, response = self.run_test(
            "Bulk Add Vehicles",
            "POST",
            "vehicles/bulk",
            200,
            data={"registration_numbers": ["KA01CD5678", "TN09EF9012"]}
        )
        
        vehicle_ids = []
        if success and isinstance(response, list):
            vehicle_ids = [v['id'] for v in response if 'id' in v]
        
        return success, vehicle_ids

    def test_get_vehicles(self):
        """Test getting all vehicles"""
        success, response = self.run_test(
            "Get All Vehicles",
            "GET",
            "vehicles",
            200
        )
        return success, response if success else []

    def test_search_vehicles(self):
        """Test vehicle search"""
        success, response = self.run_test(
            "Search Vehicles",
            "GET",
            "vehicles?search=MH12",
            200
        )
        return success

    def test_get_vehicle_details(self, vehicle_id):
        """Test getting vehicle details"""
        success, response = self.run_test(
            "Get Vehicle Details",
            "GET",
            f"vehicles/{vehicle_id}",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            required_fields = ['total_vehicles', 'expiring_this_month', 'overdue']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Dashboard Stats Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Dashboard Stats Structure", True, "All required fields present")
        
        return success

    def test_get_notifications(self):
        """Test getting notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        return success, response if success else []

    def test_delete_vehicle(self, vehicle_id):
        """Test deleting a vehicle"""
        success, response = self.run_test(
            "Delete Vehicle",
            "DELETE",
            f"vehicles/{vehicle_id}",
            200
        )
        return success

    def test_google_auth(self):
        """Test Google OAuth authentication"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "id_token": "mock_firebase_token_12345",
            "email": f"google_user_{timestamp}@fleetcare.com",
            "name": f"Google User {timestamp}",
            "uid": f"google_uid_{timestamp}"
        }
        
        success, response = self.run_test(
            "Google OAuth Authentication",
            "POST",
            "auth/google",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            # Store token for subsequent tests
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True, test_data
        return False, test_data

    def test_get_settings(self):
        """Test getting user settings"""
        success, response = self.run_test(
            "Get User Settings",
            "GET",
            "settings",
            200
        )
        
        if success:
            required_fields = ['user_id', 'email_notifications', 'push_notifications', 'notification_days_before', 'notification_time']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Settings Structure", False, f"Missing fields: {missing_fields}")
                return False, response
            else:
                self.log_test("Settings Structure", True, "All required fields present")
        
        return success, response if success else {}

    def test_update_settings(self):
        """Test updating user settings"""
        update_data = {
            "email_notifications": False,
            "push_notifications": True,
            "notification_days_before": 7,
            "notification_time": "10:30"
        }
        
        success, response = self.run_test(
            "Update User Settings",
            "PATCH",
            "settings",
            200,
            data=update_data
        )
        return success

    def test_vehicle_refresh(self, vehicle_id):
        """Test refreshing vehicle data"""
        success, response = self.run_test(
            "Refresh Vehicle Data",
            "PUT",
            f"vehicles/{vehicle_id}/refresh",
            200
        )
        
        if success:
            # Check if response contains updated vehicle data
            required_fields = ['id', 'registration_number', 'updated_at']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Vehicle Refresh Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Vehicle Refresh Structure", True, "Vehicle data refreshed successfully")
        
        return success

def main():
    print("🚛 FleetCare API Testing Suite")
    print("=" * 50)
    
    tester = FleetCareAPITester()
    
    # Test signup and authentication flow
    print("\n📝 Testing Authentication Flow...")
    signup_success, user_data = tester.test_signup()
    if not signup_success:
        print("❌ Signup failed, stopping tests")
        return 1

    # Test login with the created user
    login_success = tester.test_login(user_data['email'], user_data['password'])
    if not login_success:
        print("❌ Login failed, stopping tests")
        return 1

    # Test get current user
    tester.test_get_me()

    # PRIORITY TESTS - New Features
    print("\n🔥 Testing NEW PRIORITY Features...")
    
    # Test Google OAuth (Priority #1)
    google_auth_success, google_user_data = tester.test_google_auth()
    
    # Test Settings endpoints (Priority #2)
    settings_get_success, settings_data = tester.test_get_settings()
    settings_update_success = tester.test_update_settings()

    # Test vehicle management
    print("\n🚗 Testing Vehicle Management...")
    
    # Add single vehicle
    add_success, vehicle_id = tester.test_add_vehicle()
    
    # Test Vehicle Refresh endpoint (Priority #3)
    if vehicle_id:
        refresh_success = tester.test_vehicle_refresh(vehicle_id)
    
    # Bulk add vehicles
    bulk_success, bulk_vehicle_ids = tester.test_bulk_add_vehicles()
    
    # Get all vehicles
    get_vehicles_success, vehicles = tester.test_get_vehicles()
    
    # Search vehicles
    tester.test_search_vehicles()
    
    # Get vehicle details
    if vehicle_id:
        tester.test_get_vehicle_details(vehicle_id)

    # Test dashboard
    print("\n📊 Testing Dashboard...")
    tester.test_dashboard_stats()

    # Test notifications
    print("\n🔔 Testing Notifications...")
    tester.test_get_notifications()

    # Test vehicle deletion
    print("\n🗑️ Testing Vehicle Deletion...")
    if vehicle_id:
        tester.test_delete_vehicle(vehicle_id)

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Highlight priority test results
    priority_tests = ["Google OAuth Authentication", "Get User Settings", "Update User Settings", "Refresh Vehicle Data"]
    priority_results = [test for test in tester.test_results if test['test'] in priority_tests]
    
    print(f"\n🔥 PRIORITY Tests Results:")
    for test in priority_results:
        status = "✅ PASS" if test['success'] else "❌ FAIL"
        print(f"   {status} - {test['test']}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        
        # Print failed tests
        failed_tests = [test for test in tester.test_results if not test['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())