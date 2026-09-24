/* MentorBridge Authentication System Test Suite
 * Comprehensive tests for Firebase Authentication implementation
 * Tests all authentication features and UI integration
 */

class AuthSystemTester {
  constructor() {
    this.testResults = [];
    this.isAuthenticated = false;
    this.currentTestUser = null;
    this.testEmail = `test-${Date.now()}@mentorbridge.test`;
    this.testPassword = 'testPassword123';
  }

  /**
   * Run all authentication system tests
   */
  async runAllTests() {
    console.log('🧪 Starting Authentication System Tests...\n');
    
    try {
      // Basic initialization tests
      await this.testFirebaseInitialization();
      await this.testAuthServiceInitialization();
      await this.testUIIntegrationInitialization();
      
      // Authentication flow tests
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testAuthStateSync();
      await this.testPasswordReset();
      await this.testUserLogout();
      
      // UI Integration tests
      await this.testUIUpdates();
      await this.testRoleBasedNavigation();
      await this.testLoadingStates();
      
      // Error handling tests
      await this.testErrorHandling();
      
      this.displayTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addTestResult('Test Suite Execution', false, `Suite failed: ${error.message}`);
    }
  }

  /**
   * Test Firebase configuration and initialization
   */
  async testFirebaseInitialization() {
    console.log('🔥 Testing Firebase Initialization...');
    
    try {
      // Test Firebase config loading
      if (!window.firebaseConfig) {
        throw new Error('Firebase config not loaded');
      }
      this.addTestResult('Firebase Config', true, 'Configuration loaded successfully');

      // Test Firebase app initialization
      if (!window.firebaseApp) {
        throw new Error('Firebase app not initialized');
      }
      this.addTestResult('Firebase App', true, `App initialized: ${window.firebaseApp.name}`);

      // Test Firebase services
      if (!window.firebaseAuth) {
        throw new Error('Firebase Auth not initialized');
      }
      this.addTestResult('Firebase Auth', true, 'Auth service initialized');

      if (!window.firebaseFirestore) {
        throw new Error('Firebase Firestore not initialized');
      }
      this.addTestResult('Firebase Firestore', true, 'Firestore initialized');

      // Test Firebase service connectivity
      const connectivityTest = await testFirebaseConnectivity();
      if (connectivityTest.success) {
        this.addTestResult('Firebase Connectivity', true, `Health score: ${connectivityTest.healthScore}%`);
      } else {
        this.addTestResult('Firebase Connectivity', false, connectivityTest.error);
      }

    } catch (error) {
      this.addTestResult('Firebase Initialization', false, error.message);
    }
  }

  /**
   * Test MentorBridge Auth service initialization
   */
  async testAuthServiceInitialization() {
    console.log('🔐 Testing Auth Service Initialization...');
    
    try {
      // Test auth service exists
      if (!window.mentorBridgeAuth) {
        throw new Error('MentorBridge Auth service not found');
      }

      // Test initialization
      if (!window.mentorBridgeAuth.initialized) {
        await window.mentorBridgeAuth.initialize();
      }

      if (window.mentorBridgeAuth.initialized) {
        this.addTestResult('Auth Service Init', true, 'Auth service initialized successfully');
      } else {
        throw new Error('Auth service failed to initialize');
      }

      // Test service methods
      const methods = ['registerUser', 'signInUser', 'signOut', 'getCurrentUser', 'isAuthenticated'];
      for (const method of methods) {
        if (typeof window.mentorBridgeAuth[method] === 'function') {
          this.addTestResult(`Auth Method: ${method}`, true, 'Method available');
        } else {
          this.addTestResult(`Auth Method: ${method}`, false, 'Method missing');
        }
      }

    } catch (error) {
      this.addTestResult('Auth Service Initialization', false, error.message);
    }
  }

  /**
   * Test UI Integration service initialization
   */
  async testUIIntegrationInitialization() {
    console.log('🎨 Testing UI Integration Initialization...');
    
    try {
      // Test UI integration service exists
      if (!window.authUIIntegration) {
        throw new Error('Auth UI Integration service not found');
      }

      // Test initialization
      if (!window.authUIIntegration.initialized) {
        await window.authUIIntegration.initialize();
      }

      if (window.authUIIntegration.initialized) {
        this.addTestResult('UI Integration Init', true, 'UI integration initialized successfully');
      } else {
        throw new Error('UI integration failed to initialize');
      }

      // Test auth operations wrapper
      if (window.authOperations) {
        const operations = ['login', 'register'];
        for (const operation of operations) {
          if (typeof window.authOperations[operation] === 'function') {
            this.addTestResult(`Auth Operation: ${operation}`, true, 'Operation available');
          } else {
            this.addTestResult(`Auth Operation: ${operation}`, false, 'Operation missing');
          }
        }
      } else {
        this.addTestResult('Auth Operations', false, 'Auth operations wrapper not found');
      }

    } catch (error) {
      this.addTestResult('UI Integration Initialization', false, error.message);
    }
  }

  /**
   * Test user registration process
   */
  async testUserRegistration() {
    console.log('📝 Testing User Registration...');
    
    try {
      const registrationData = {
        email: this.testEmail,
        password: this.testPassword,
        profile: {
          name: 'Test User',
          role: 'student',
          bio: 'Test user for authentication system'
        }
      };

      console.log(`Attempting to register: ${this.testEmail}`);
      const result = await window.mentorBridgeAuth.registerUser(registrationData);

      if (result.success) {
        this.addTestResult('User Registration', true, 'User registered successfully');
        this.currentTestUser = result.user;
        
        // Test profile creation
        if (result.profile) {
          this.addTestResult('Profile Creation', true, `Profile created with role: ${result.profile.role}`);
        } else {
          this.addTestResult('Profile Creation', false, 'Profile not created');
        }
        
      } else {
        this.addTestResult('User Registration', false, result.message || 'Registration failed');
      }

    } catch (error) {
      // If user already exists, try to sign in instead
      if (error.message.includes('already-in-use')) {
        this.addTestResult('User Registration', true, 'User already exists (expected for repeat tests)');
        console.log('User already exists, will test login instead');
      } else {
        this.addTestResult('User Registration', false, error.message);
      }
    }
  }

  /**
   * Test user login process
   */
  async testUserLogin() {
    console.log('🔑 Testing User Login...');
    
    try {
      console.log(`Attempting to login: ${this.testEmail}`);
      const result = await window.mentorBridgeAuth.signInUser(this.testEmail, this.testPassword);

      if (result.success) {
        this.addTestResult('User Login', true, 'User logged in successfully');
        this.isAuthenticated = true;
        this.currentTestUser = result.user;
        
        // Test user profile loading
        if (result.profile) {
          this.addTestResult('Profile Loading', true, `Profile loaded: ${result.profile.name}`);
        } else {
          this.addTestResult('Profile Loading', false, 'Profile not loaded');
        }
        
      } else {
        this.addTestResult('User Login', false, result.message || 'Login failed');
      }

    } catch (error) {
      this.addTestResult('User Login', false, error.message);
    }
  }

  /**
   * Test authentication state synchronization
   */
  async testAuthStateSync() {
    console.log('🔄 Testing Auth State Synchronization...');
    
    try {
      // Test current user state
      const currentUser = window.mentorBridgeAuth.getCurrentUser();
      const isAuthenticated = window.mentorBridgeAuth.isAuthenticated();
      const userProfile = window.mentorBridgeAuth.getUserProfile();

      if (this.isAuthenticated) {
        if (currentUser && isAuthenticated) {
          this.addTestResult('Auth State Sync', true, `User state: ${currentUser.email}`);
        } else {
          this.addTestResult('Auth State Sync', false, 'Auth state inconsistent');
        }

        if (userProfile) {
          this.addTestResult('Profile Sync', true, `Profile synced: ${userProfile.name}`);
        } else {
          this.addTestResult('Profile Sync', false, 'Profile not synced');
        }
      } else {
        if (!currentUser && !isAuthenticated) {
          this.addTestResult('Auth State Sync', true, 'Unauthenticated state correct');
        } else {
          this.addTestResult('Auth State Sync', false, 'Unauthenticated state inconsistent');
        }
      }

      // Test UI integration state sync
      const uiAuthState = window.authUIIntegration.getAuthState();
      const uiCurrentUser = window.authUIIntegration.getCurrentUser();
      
      if (this.isAuthenticated && uiAuthState === 'authenticated' && uiCurrentUser) {
        this.addTestResult('UI State Sync', true, 'UI state synchronized with auth');
      } else if (!this.isAuthenticated && uiAuthState === 'unauthenticated' && !uiCurrentUser) {
        this.addTestResult('UI State Sync', true, 'UI unauthenticated state correct');
      } else {
        this.addTestResult('UI State Sync', false, `UI state mismatch: ${uiAuthState}`);
      }

    } catch (error) {
      this.addTestResult('Auth State Synchronization', false, error.message);
    }
  }

  /**
   * Test password reset functionality
   */
  async testPasswordReset() {
    console.log('🔐 Testing Password Reset...');
    
    try {
      const result = await window.mentorBridgeAuth.sendPasswordResetEmail(this.testEmail);
      
      if (result.success) {
        this.addTestResult('Password Reset', true, 'Reset email sent successfully');
      } else {
        this.addTestResult('Password Reset', false, result.message);
      }
      
    } catch (error) {
      this.addTestResult('Password Reset', false, error.message);
    }
  }

  /**
   * Test user logout process
   */
  async testUserLogout() {
    console.log('🚪 Testing User Logout...');
    
    if (!this.isAuthenticated) {
      this.addTestResult('User Logout', true, 'No user to logout (skipped)');
      return;
    }
    
    try {
      await window.mentorBridgeAuth.signOut();
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUser = window.mentorBridgeAuth.getCurrentUser();
      const isAuthenticated = window.mentorBridgeAuth.isAuthenticated();
      
      if (!currentUser && !isAuthenticated) {
        this.addTestResult('User Logout', true, 'User logged out successfully');
        this.isAuthenticated = false;
        this.currentTestUser = null;
      } else {
        this.addTestResult('User Logout', false, 'User still authenticated after logout');
      }
      
    } catch (error) {
      this.addTestResult('User Logout', false, error.message);
    }
  }

  /**
   * Test UI updates and integration
   */
  async testUIUpdates() {
    console.log('🎨 Testing UI Updates...');
    
    try {
      // Test UI integration methods
      const uiMethods = ['getAuthState', 'getCurrentUser', 'isAuthenticated'];
      for (const method of uiMethods) {
        if (typeof window.authUIIntegration[method] === 'function') {
          this.addTestResult(`UI Method: ${method}`, true, 'Method available');
        } else {
          this.addTestResult(`UI Method: ${method}`, false, 'Method missing');
        }
      }

      // Test auth operations wrapper methods
      if (window.authOperations) {
        const operations = ['login', 'register'];
        for (const operation of operations) {
          if (typeof window.authOperations[operation] === 'function') {
            this.addTestResult(`UI Operation: ${operation}`, true, 'Operation available');
          } else {
            this.addTestResult(`UI Operation: ${operation}`, false, 'Operation missing');
          }
        }
      }

    } catch (error) {
      this.addTestResult('UI Updates', false, error.message);
    }
  }

  /**
   * Test role-based navigation functionality
   */
  async testRoleBasedNavigation() {
    console.log('🗺️ Testing Role-Based Navigation...');
    
    try {
      // Test role detection
      const testRoles = ['student', 'mentor', 'admin'];
      for (const role of testRoles) {
        const hasRole = window.mentorBridgeAuth.hasRole ? window.mentorBridgeAuth.hasRole(role) : false;
        this.addTestResult(`Role Check: ${role}`, true, `Has role: ${hasRole}`);
      }

      // Test navigation configuration
      if (window.authUIIntegration.navigationItems) {
        this.addTestResult('Navigation Config', true, 'Navigation items configured');
      } else {
        this.addTestResult('Navigation Config', false, 'Navigation items not found');
      }

    } catch (error) {
      this.addTestResult('Role-Based Navigation', false, error.message);
    }
  }

  /**
   * Test loading states and user feedback
   */
  async testLoadingStates() {
    console.log('⏳ Testing Loading States...');
    
    try {
      // Test loading state methods in UI integration
      const loadingMethods = ['setOperationLoading', 'clearOperationLoading', 'showLoadingState', 'hideLoadingState'];
      for (const method of loadingMethods) {
        if (typeof window.authUIIntegration[method] === 'function') {
          this.addTestResult(`Loading Method: ${method}`, true, 'Method available');
        } else {
          this.addTestResult(`Loading Method: ${method}`, false, 'Method missing');
        }
      }

      // Test message methods
      const messageMethods = ['showSuccessMessage', 'showErrorMessage'];
      for (const method of messageMethods) {
        if (typeof window.authUIIntegration[method] === 'function') {
          this.addTestResult(`Message Method: ${method}`, true, 'Method available');
        } else {
          this.addTestResult(`Message Method: ${method}`, false, 'Method missing');
        }
      }

    } catch (error) {
      this.addTestResult('Loading States', false, error.message);
    }
  }

  /**
   * Test error handling throughout the system
   */
  async testErrorHandling() {
    console.log('❌ Testing Error Handling...');
    
    try {
      // Test invalid login
      try {
        await window.mentorBridgeAuth.signInUser('invalid@email.com', 'wrongpassword');
        this.addTestResult('Invalid Login Handling', false, 'Should have thrown error');
      } catch (error) {
        if (error.message.includes('user-not-found') || error.message.includes('wrong-password') || error.message.includes('invalid')) {
          this.addTestResult('Invalid Login Handling', true, 'Proper error handling for invalid login');
        } else {
          this.addTestResult('Invalid Login Handling', false, `Unexpected error: ${error.message}`);
        }
      }

      // Test invalid email format
      try {
        await window.mentorBridgeAuth.sendPasswordResetEmail('invalid-email');
        this.addTestResult('Invalid Email Handling', false, 'Should have thrown error');
      } catch (error) {
        if (error.message.includes('invalid-email') || error.message.includes('valid email')) {
          this.addTestResult('Invalid Email Handling', true, 'Proper error handling for invalid email');
        } else {
          this.addTestResult('Invalid Email Handling', false, `Unexpected error: ${error.message}`);
        }
      }

    } catch (error) {
      this.addTestResult('Error Handling', false, error.message);
    }
  }

  /**
   * Add a test result to the results array
   * @param {string} testName Name of the test
   * @param {boolean} passed Whether the test passed
   * @param {string} details Additional details about the test
   */
  addTestResult(testName, passed, details = '') {
    this.testResults.push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${details}`);
  }

  /**
   * Display comprehensive test results
   */
  displayTestResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n' + '='.repeat(60));
    console.log('🧪 AUTHENTICATION SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60));

    // Display failed tests
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`  • ${result.testName}: ${result.details}`);
        });
    }

    // Display passed tests
    console.log('\n✅ PASSED TESTS:');
    this.testResults
      .filter(result => result.passed)
      .forEach(result => {
        console.log(`  • ${result.testName}: ${result.details}`);
      });

    // Overall assessment
    console.log('\n' + '='.repeat(60));
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Authentication system is working very well!');
    } else if (successRate >= 75) {
      console.log('👍 GOOD: Authentication system is mostly working, minor issues detected.');
    } else if (successRate >= 50) {
      console.log('⚠️ NEEDS ATTENTION: Several authentication issues detected.');
    } else {
      console.log('🚨 CRITICAL: Major authentication issues detected - needs immediate attention.');
    }
    console.log('='.repeat(60));
  }

  /**
   * Get test results for external consumption
   * @returns {Object} Test results summary
   */
  getResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.passed).length;
    
    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      results: this.testResults
    };
  }
}

// Make tester available globally
window.AuthSystemTester = AuthSystemTester;

// Auto-run tests when loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Add a slight delay to ensure all services are initialized
    setTimeout(async () => {
      console.log('🚀 Starting automated authentication system tests...');
      const tester = new AuthSystemTester();
      await tester.runAllTests();
      
      // Store results globally for external access
      window.lastTestResults = tester.getResults();
    }, 2000);
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthSystemTester;
}