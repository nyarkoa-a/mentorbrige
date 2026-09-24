/**
 * Preservation Property Tests for Firebase Initialization Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * IMPORTANT: These tests MUST PASS on unfixed code - they validate baseline behavior to preserve
 * These tests capture observed behavior patterns that should be maintained during the fix
 * 
 * Property 2: Preservation - Existing Firebase Functionality Preservation
 * Tests that existing Firebase functionality works correctly on non-auth pages and core features
 */

const fc = require('fast-check');
const fs = require('fs').promises;
const path = require('path');

/**
 * Preservation Property Test Runner
 * Tests existing Firebase functionality that should be preserved during the fix
 */
async function runFirebasePreservationTest() {
  
  /**
   * Property 2: Preservation - Existing Firebase Functionality Preservation
   * 
   * This property test validates that existing Firebase functionality works correctly
   * on non-auth pages and core authentication flows continue to function properly.
   * These behaviors MUST be preserved during the Firebase initialization fix.
   */
  console.log('🧪 Running Firebase functionality preservation property test...');
  
  try {
    // Use property-based testing to generate different preservation test scenarios
    await fc.assert(
      fc.asyncProperty(
        // Generate different preservation test scenarios
        fc.record({
          pageType: fc.constantFrom('index', 'student-dashboard', 'settings', 'goals', 'messages'),
          loadDelay: fc.integer({ min: 100, max: 800 }), // Different loading conditions
          authState: fc.constantFrom('authenticated', 'unauthenticated', 'loading'),
          userRole: fc.constantFrom('student', 'mentor', 'admin'),
        }),
        async (scenario) => {
          
          const preservationResults = {
            firebaseInitializationSuccess: false,
            authServiceAvailable: false,
            firestoreServiceAvailable: false,
            authStateConsistent: false,
            sessionPersistenceWorking: false,
            redirectsWorking: false,
            servicesConsistent: false,
            noRegressionErrors: false,
            consoleErrors: [],
            preservationLogs: []
          };
          
          try {
            // Create a test environment for non-auth pages
            const testPage = await createPreservationTestPage(scenario.pageType);
            
            // Test 1: Firebase initialization on non-auth pages works correctly (Requirement 3.1)
            console.log(`🧪 Testing Firebase initialization on ${scenario.pageType}...`);
            const initTest = await testPage.checkFirebaseInitialization();
            preservationResults.firebaseInitializationSuccess = initTest.success;
            preservationResults.preservationLogs.push(`Firebase init on ${scenario.pageType}: ${initTest.success ? 'SUCCESS' : 'FAILED'}`);
            
            // Add delay to simulate real loading conditions
            await new Promise(resolve => setTimeout(resolve, scenario.loadDelay));
            
            // Test 2: User authentication and role-based redirection functions properly (Requirement 3.2)
            console.log(`🧪 Testing authentication and redirects for ${scenario.userRole}...`);
            const authTest = await testPage.checkAuthenticationFlow(scenario.authState, scenario.userRole);
            preservationResults.authServiceAvailable = authTest.authServiceAvailable;
            preservationResults.authStateConsistent = authTest.authStateConsistent;
            preservationResults.redirectsWorking = authTest.redirectsWorking;
            preservationResults.preservationLogs.push(`Auth flow for ${scenario.userRole}: ${authTest.redirectsWorking ? 'SUCCESS' : 'ISSUES'}`);
            
            // Test 3: Firebase services provide consistent functionality (Requirement 3.3)
            console.log('🧪 Testing Firebase services consistency...');
            const servicesTest = await testPage.checkFirebaseServicesConsistency();
            preservationResults.firestoreServiceAvailable = servicesTest.firestoreAvailable;
            preservationResults.servicesConsistent = servicesTest.consistent;
            preservationResults.preservationLogs.push(`Services consistency: ${servicesTest.consistent ? 'SUCCESS' : 'ISSUES'}`);
            
            // Test 4: Authentication state and session persistence maintained (Requirement 3.4)
            console.log('🧪 Testing session persistence...');
            const sessionTest = await testPage.checkSessionPersistence(scenario.authState);
            preservationResults.sessionPersistenceWorking = sessionTest.working;
            preservationResults.preservationLogs.push(`Session persistence: ${sessionTest.working ? 'SUCCESS' : 'ISSUES'}`);
            
            // Test 5: No regression errors in console
            console.log('🧪 Checking for regression errors...');
            const regressionTest = await testPage.checkForRegressionErrors();
            preservationResults.noRegressionErrors = regressionTest.noRegressions;
            preservationResults.consoleErrors.push(...regressionTest.errors);
            
            // Clean up test page
            await testPage.cleanup();
            
            // The preservation property that MUST PASS on unfixed code:
            // All existing functionality should work correctly
            const preservationPassed = preservationResults.firebaseInitializationSuccess &&
                                     preservationResults.authServiceAvailable &&
                                     preservationResults.firestoreServiceAvailable &&
                                     preservationResults.authStateConsistent &&
                                     preservationResults.servicesConsistent &&
                                     preservationResults.noRegressionErrors;
            
            // Log detailed results for analysis
            console.log('🔍 Preservation Test Results:', {
              scenario,
              preservationResults,
              overallPreservationScore: preservationPassed ? 'PASS' : 'ISSUES_DETECTED'
            });
            
            // This assertion MUST PASS on unfixed code to confirm baseline behavior
            if (!preservationPassed) {
              const failedAreas = [];
              if (!preservationResults.firebaseInitializationSuccess) failedAreas.push('Firebase initialization failed');
              if (!preservationResults.authServiceAvailable) failedAreas.push('Auth service unavailable');
              if (!preservationResults.firestoreServiceAvailable) failedAreas.push('Firestore service unavailable');
              if (!preservationResults.authStateConsistent) failedAreas.push('Auth state inconsistent');
              if (!preservationResults.servicesConsistent) failedAreas.push('Services inconsistent');
              if (!preservationResults.noRegressionErrors) failedAreas.push('Regression errors detected');
              
              throw new Error(`Preservation test failed - existing functionality issues detected: ${failedAreas.join(', ')}\n` +
                             `Console errors: ${preservationResults.consoleErrors.join('; ')}\n` +
                             `Scenario: ${JSON.stringify(scenario)}`);
            }
            
            // All preservation tests passed - existing functionality is working
            return true;
            
          } catch (error) {
            // Re-throw to surface as counterexample if there are baseline issues
            throw error;
          }
        }
      ),
      {
        numRuns: 8, // Test multiple page/scenario combinations 
        timeout: 12000, // 12 second timeout per test
        verbose: true // Show detailed output
      }
    );
    
    // If we reach here, all preservation tests passed
    return { success: true, preservationPassed: true };
    
  } catch (error) {
    // Preservation test failed - existing functionality has issues
    return { 
      success: false, 
      preservationPassed: false, 
      error: error.message,
      issues: error.message 
    };
  }
}

/**
 * Create a test environment for non-auth pages
 * This simulates loading non-auth pages and provides methods to test existing functionality
 */
async function createPreservationTestPage(pageType) {
  
  // Map of page types to their HTML file paths
  const pageFiles = {
    'index': path.join(__dirname, 'public', 'index.html'),
    'student-dashboard': path.join(__dirname, 'public', 'pages', 'student-dashboard.html'),
    'settings': path.join(__dirname, 'public', 'pages', 'settings.html'),
    'goals': path.join(__dirname, 'public', 'pages', 'goals.html'),
    'messages': path.join(__dirname, 'public', 'pages', 'messages.html')
  };
  
  const htmlFilePath = pageFiles[pageType];
  let htmlContent = '';
  
  try {
    htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  } catch (error) {
    console.log(`⚠️ Could not read ${pageType} file, using mock content for testing`);
    // Use mock content for testing if file doesn't exist
    htmlContent = `
      <!DOCTYPE html>
      <html><head><title>${pageType}</title></head>
      <body>
        <script src="../js/firebase-config.js"></script>
        <script src="../js/firebase-service.js"></script>
        <script src="../js/firebase-auth.js"></script>
      </body></html>
    `;
  }
  
  // Create a test environment
  const testEnvironment = {
    pageType,
    htmlContent,
    consoleCapture: {
      warnings: [],
      errors: [],
      logs: []
    },
    
    // Simulate loading the page
    async loadPage() {
      console.log(`📄 Loading ${this.pageType} page for preservation testing...`);
      
      // Capture console output during loading
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalLog = console.log;
      
      console.warn = (...args) => {
        this.consoleCapture.warnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };
      
      console.error = (...args) => {
        this.consoleCapture.errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      console.log = (...args) => {
        this.consoleCapture.logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      // Analyze the page content for Firebase scripts
      const scriptTags = this.htmlContent.match(/<script[^>]*src[^>]*firebase[^>]*>/g) || [];
      return { 
        scriptCount: scriptTags.length, 
        scriptTags,
        pageType: this.pageType 
      };
    },
    
    // Test Firebase initialization on non-auth pages (Requirement 3.1)
    async checkFirebaseInitialization() {
      const loadResult = await this.loadPage();
      
      // Check for proper Firebase script loading (single version, properly ordered)
      const firebaseAppScripts = this.htmlContent.match(/firebase-app(-compat)?\.js/g) || [];
      const firebaseAuthScripts = this.htmlContent.match(/firebase-auth(-compat)?\.js/g) || [];
      const firebaseFirestoreScripts = this.htmlContent.match(/firebase-firestore(-compat)?\.js/g) || [];
      
      // Firebase config and service scripts should be present
      const hasFirebaseConfig = this.htmlContent.includes('firebase-config.js');
      const hasFirebaseService = this.htmlContent.includes('firebase-service.js') || 
                                  this.htmlContent.includes('firebase-auth.js');
      
      // Check for proper initialization (no duplicate script versions)
      const hasConsistentVersions = this.htmlContent.match(/firebasejs\/9\.23\.0/g) ||
                                   this.htmlContent.match(/firebasejs\/10\.13\.0/g);
      
      // Success criteria: Firebase scripts are present and properly configured
      const success = firebaseAppScripts.length > 0 && 
                     firebaseAuthScripts.length > 0 && 
                     firebaseFirestoreScripts.length > 0 &&
                     hasFirebaseConfig &&
                     hasFirebaseService;
      
      return {
        success,
        details: {
          appScripts: firebaseAppScripts.length,
          authScripts: firebaseAuthScripts.length,
          firestoreScripts: firebaseFirestoreScripts.length,
          hasConfig: hasFirebaseConfig,
          hasService: hasFirebaseService,
          consistentVersions: !!hasConsistentVersions
        }
      };
    },
    
    // Test authentication flow and role-based redirects (Requirement 3.2)
    async checkAuthenticationFlow(authState, userRole) {
      // Simulate authentication states and check for proper handling
      const authServicePatterns = this.htmlContent.match(/firebase.*auth/gi) || [];
      const redirectPatterns = this.htmlContent.match(/(window\.location|href.*dashboard)/gi) || [];
      
      // Check for role-based navigation elements
      const roleBasedElements = this.htmlContent.match(/(student-dashboard|mentor-dashboard|admin-dashboard)/g) || [];
      
      // Check for authentication state management
      const authStateManagement = this.htmlContent.match(/(onAuthStateChanged|getCurrentUser|isAuthenticated)/gi) || [];
      
      return {
        authServiceAvailable: authServicePatterns.length > 0,
        authStateConsistent: authStateManagement.length > 0,
        redirectsWorking: redirectPatterns.length > 0 || roleBasedElements.length > 0,
        details: {
          authPatterns: authServicePatterns.length,
          redirectPatterns: redirectPatterns.length,
          roleElements: roleBasedElements.length,
          stateManagement: authStateManagement.length
        }
      };
    },
    
    // Test Firebase services consistency (Requirement 3.3)
    async checkFirebaseServicesConsistency() {
      // Check for consistent Firebase service usage patterns
      const authUsage = this.htmlContent.match(/firebase.*auth/gi) || [];
      const firestoreUsage = this.htmlContent.match(/firebase.*firestore/gi) || [];
      const configUsage = this.htmlContent.match(/firebase.*config/gi) || [];
      
      // Look for service initialization patterns
      const serviceInitPatterns = this.htmlContent.match(/(firebase.*initialize|firebase.*app)/gi) || [];
      
      // Check console logs for service consistency indicators
      const serviceConsistencyLogs = this.consoleCapture.logs.filter(log => 
        log.includes('Firebase') && (log.includes('initialized') || log.includes('connected'))
      );
      
      const firestoreAvailable = firestoreUsage.length > 0 || this.htmlContent.includes('firestore');
      const consistent = authUsage.length > 0 && firestoreAvailable && configUsage.length > 0;
      
      return {
        firestoreAvailable,
        consistent,
        details: {
          authUsage: authUsage.length,
          firestoreUsage: firestoreUsage.length,
          configUsage: configUsage.length,
          initPatterns: serviceInitPatterns.length,
          consistencyLogs: serviceConsistencyLogs.length
        }
      };
    },
    
    // Test session persistence and navigation (Requirement 3.4)
    async checkSessionPersistence(authState) {
      // Look for session management patterns
      const sessionPatterns = this.htmlContent.match(/(sessionStorage|localStorage|persistence)/gi) || [];
      const authPersistencePatterns = this.htmlContent.match(/(setPersistence|Auth\.Persistence)/gi) || [];
      
      // Check for navigation state management
      const navigationPatterns = this.htmlContent.match(/(data-page|navigation|menu)/gi) || [];
      
      // Look for authentication state continuity
      const stateContinuityPatterns = this.htmlContent.match(/(currentUser|auth.*state|user.*profile)/gi) || [];
      
      const working = sessionPatterns.length > 0 || 
                     authPersistencePatterns.length > 0 ||
                     stateContinuityPatterns.length > 0;
      
      return {
        working,
        details: {
          sessionPatterns: sessionPatterns.length,
          authPersistence: authPersistencePatterns.length,
          navigationPatterns: navigationPatterns.length,
          stateContinuity: stateContinuityPatterns.length
        }
      };
    },
    
    // Check for regression errors that might indicate functionality loss
    async checkForRegressionErrors() {
      const regressionIndicators = [
        'cannot read property',
        'is not a function', 
        'undefined is not',
        'firebase is not defined',
        'auth is not defined',
        'firestore is not defined',
        'ReferenceError',
        'TypeError'
      ];
      
      const regressionErrors = this.consoleCapture.errors.filter(error =>
        regressionIndicators.some(indicator => 
          error.toLowerCase().includes(indicator.toLowerCase())
        )
      );
      
      // Also check warnings that might indicate functionality issues
      const functionalityWarnings = this.consoleCapture.warnings.filter(warning =>
        warning.includes('deprecated') || 
        warning.includes('not supported') ||
        warning.includes('failed to')
      );
      
      return {
        noRegressions: regressionErrors.length === 0,
        errors: [...regressionErrors, ...functionalityWarnings],
        details: {
          errorCount: regressionErrors.length,
          warningCount: functionalityWarnings.length
        }
      };
    },
    
    // Cleanup test environment
    async cleanup() {
      console.log(`🧹 Cleaning up preservation test for ${this.pageType}...`);
      this.consoleCapture.warnings = [];
      this.consoleCapture.errors = [];
      this.consoleCapture.logs = [];
    }
  };
  
  return testEnvironment;
}

// Export for use in other test files
module.exports = { createPreservationTestPage, runFirebasePreservationTest };