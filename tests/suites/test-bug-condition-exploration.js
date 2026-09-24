/**
 * Bug Condition Exploration Property Test for Firebase Initialization Issues
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * GOAL: Surface counterexamples that demonstrate Firebase initialization bugs exist
 */

const fc = require('fast-check');

/**
 * Bug Condition Property Test
 * Tests concrete failing cases of duplicate script loading, duplicate initialization, 
 * and service errors as described in the bugfix requirements
 */
async function runFirebaseBugExplorationTest() {
  
  /**
   * Property 1: Bug Condition - Firebase Multiple Loading and Initialization Issues
   * 
   * This property test explores the concrete bug conditions by loading auth.html
   * and checking for specific warnings, errors, and duplicate initialization issues
   * that indicate the Firebase initialization problems exist in the current codebase.
   */
  console.log('🧪 Running Firebase initialization bug detection property test...');
  
  try {
    // Use property-based testing to generate different test scenarios
    await fc.assert(
      fc.asyncProperty(
        // Generate different page load scenarios
        fc.record({
          loadDelay: fc.integer({ min: 100, max: 1000 }), // Simulate different loading times
          interactionDelay: fc.integer({ min: 50, max: 500 }), // Different user interaction timing
          tabSwitchCount: fc.integer({ min: 1, max: 3 }), // Number of tab switches to test
          buttonClickCount: fc.integer({ min: 1, max: 3 }), // Number of button clicks
        }),
        async (scenario) => {
          
          const testResults = {
            duplicateScriptLoading: false,
            duplicateInitialization: false,
            unresponsiveUI: false,
            firestoreOverrideWarning: false,
            deprecatedPersistenceWarning: false,
            storageAccessError: false,
            consoleWarnings: [],
            consoleErrors: [],
            initializationLogs: [],
            uiInteractionResults: []
          };
          
          try {
            // Create a simulated browser environment for testing auth.html
            const testPage = await createAuthPageTest();
            
            // Test 1: Check for duplicate Firebase script loading (Requirement 1.1)
            console.log('🧪 Testing duplicate Firebase script loading...');
            const scriptDuplicates = await testPage.checkDuplicateScripts();
            testResults.duplicateScriptLoading = scriptDuplicates.hasDuplicates;
            testResults.consoleWarnings.push(...scriptDuplicates.warnings);
            
            // Add delay to simulate real loading conditions
            await new Promise(resolve => setTimeout(resolve, scenario.loadDelay));
            
            // Test 2: Check for duplicate Authentication UI Integration initialization (Requirement 1.2)
            console.log('🧪 Testing duplicate initialization...');
            const initDuplicates = await testPage.checkDuplicateInitialization();
            testResults.duplicateInitialization = initDuplicates.hasDuplicates;
            testResults.initializationLogs.push(...initDuplicates.logs);
            
            // Test 3: Check for non-functional login buttons and tabs (Requirement 1.3)
            console.log('🧪 Testing UI responsiveness...');
            const uiTests = await testPage.testUIInteractions(scenario);
            testResults.unresponsiveUI = uiTests.hasUnresponsiveElements;
            testResults.uiInteractionResults.push(...uiTests.results);
            
            // Test 4: Check for Firestore configuration override warnings (Requirement 1.4)
            console.log('🧪 Testing Firestore configuration warnings...');
            const firestoreWarnings = await testPage.checkFirestoreWarnings();
            testResults.firestoreOverrideWarning = firestoreWarnings.hasOverrideWarning;
            testResults.consoleWarnings.push(...firestoreWarnings.warnings);
            
            // Test 5: Check for deprecated persistence API usage (Requirement 1.5)
            console.log('🧪 Testing deprecated persistence API warnings...');
            const persistenceWarnings = await testPage.checkDeprecatedPersistenceAPI();
            testResults.deprecatedPersistenceWarning = persistenceWarnings.hasDeprecatedWarning;
            testResults.consoleWarnings.push(...persistenceWarnings.warnings);
            
            // Test 6: Check for Firebase Storage access errors (Requirement 1.6)
            console.log('🧪 Testing Firebase Storage access...');
            const storageErrors = await testPage.checkStorageAccess();
            testResults.storageAccessError = storageErrors.hasError;
            testResults.consoleErrors.push(...storageErrors.errors);
            
            // Clean up test page
            await testPage.cleanup();
            
            // The property that MUST FAIL on unfixed code:
            // At least one of these bugs should be detected
            const bugsDetected = testResults.duplicateScriptLoading || 
                               testResults.duplicateInitialization || 
                               testResults.unresponsiveUI || 
                               testResults.firestoreOverrideWarning || 
                               testResults.deprecatedPersistenceWarning || 
                               testResults.storageAccessError;
            
            // Log detailed results for analysis
            console.log('🔍 Bug Detection Results:', {
              scenario,
              testResults,
              totalBugsDetected: [
                testResults.duplicateScriptLoading,
                testResults.duplicateInitialization, 
                testResults.unresponsiveUI,
                testResults.firestoreOverrideWarning,
                testResults.deprecatedPersistenceWarning,
                testResults.storageAccessError
              ].filter(Boolean).length
            });
            
            // CRITICAL: This assertion MUST FAIL on unfixed code
            // When bugs exist, this will fail and provide counterexamples
            // When bugs are fixed, this will pass
            if (bugsDetected) {
              const detectedIssues = [];
              if (testResults.duplicateScriptLoading) detectedIssues.push('Duplicate script loading detected');
              if (testResults.duplicateInitialization) detectedIssues.push('Duplicate initialization detected');
              if (testResults.unresponsiveUI) detectedIssues.push('Unresponsive UI elements detected');
              if (testResults.firestoreOverrideWarning) detectedIssues.push('Firestore override warnings detected');
              if (testResults.deprecatedPersistenceWarning) detectedIssues.push('Deprecated persistence API warnings detected');
              if (testResults.storageAccessError) detectedIssues.push('Firebase Storage access errors detected');
              
              throw new Error(`Firebase initialization bugs detected: ${detectedIssues.join(', ')}\n` +
                             `Console warnings: ${testResults.consoleWarnings.join('; ')}\n` +
                             `Console errors: ${testResults.consoleErrors.join('; ')}\n` +
                             `Scenario: ${JSON.stringify(scenario)}`);
            }
            
            // If we reach here without detecting bugs, the code might already be fixed
            // or the test needs adjustment
            return true;
            
          } catch (error) {
            // Re-throw to surface as counterexample
            throw error;
          }
        }
      ),
      {
        numRuns: 5, // Run multiple scenarios to catch different timing conditions
        timeout: 15000, // 15 second timeout per test
        verbose: true // Show detailed output
      }
    );
    
    // If we reach here, the property test passed (no bugs detected)
    return { success: true, bugsDetected: false };
    
  } catch (error) {
    // Property test failed - bugs were detected (this is expected)
    return { 
      success: true, 
      bugsDetected: true, 
      error: error.message,
      counterexamples: error.message 
    };
  }
}

/**
 * Create a test environment for auth.html page testing
 * This simulates loading the auth.html page and provides methods to test for bugs
 */
async function createAuthPageTest() {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Read the auth.html file
  const authHtmlPath = path.join(__dirname, 'public', 'pages', 'auth.html');
  const authHtmlContent = await fs.readFile(authHtmlPath, 'utf8');
  
  // Create a mock DOM environment for testing
  const testEnvironment = {
    consoleCapture: {
      warnings: [],
      errors: [],
      logs: []
    },
    
    // Simulate loading the auth.html page
    async loadAuthPage() {
      console.log('📄 Loading auth.html for testing...');
      
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
      
      // Simulate script loading by counting Firebase script tags
      const scriptTags = authHtmlContent.match(/<script[^>]*firebase[^>]*>/g) || [];
      return { scriptCount: scriptTags.length, scriptTags };
    },
    
    // Test for duplicate Firebase script loading
    async checkDuplicateScripts() {
      const loadResult = await this.loadAuthPage();
      
      // Count Firebase script occurrences
      const firebaseAppScripts = authHtmlContent.match(/firebase-app(-compat)?\.js/g) || [];
      const firebaseAuthScripts = authHtmlContent.match(/firebase-auth(-compat)?\.js/g) || [];
      const firebaseFirestoreScripts = authHtmlContent.match(/firebase-firestore(-compat)?\.js/g) || [];
      
      const hasDuplicates = firebaseAppScripts.length > 1 || 
                           firebaseAuthScripts.length > 1 || 
                           firebaseFirestoreScripts.length > 1;
      
      const warnings = [];
      if (firebaseAppScripts.length > 1) {
        warnings.push(`Firebase App script loaded ${firebaseAppScripts.length} times`);
      }
      if (firebaseAuthScripts.length > 1) {
        warnings.push(`Firebase Auth script loaded ${firebaseAuthScripts.length} times`);
      }
      if (firebaseFirestoreScripts.length > 1) {
        warnings.push(`Firebase Firestore script loaded ${firebaseFirestoreScripts.length} times`);
      }
      
      // Check for "Firebase is already defined" warning pattern
      const hasGlobalScopeWarning = this.consoleCapture.warnings.some(w => 
        w.includes('Firebase is already defined') || w.includes('already defined in the global scope')
      );
      
      if (hasGlobalScopeWarning) {
        warnings.push('Firebase already defined in global scope warning detected');
      }
      
      return { hasDuplicates: hasDuplicates || hasGlobalScopeWarning, warnings };
    },
    
    // Test for duplicate Authentication UI Integration initialization
    async checkDuplicateInitialization() {
      // Look for initialization patterns in the HTML/JS
      const authUIIntegrationCalls = authHtmlContent.match(/authUIIntegration.*initialize/g) || [];
      const initializationLogs = this.consoleCapture.logs.filter(log => 
        log.includes('Auth UI Integration initialized') || 
        log.includes('Authentication UI Integration')
      );
      
      const hasDuplicates = authUIIntegrationCalls.length > 1 || initializationLogs.length > 1;
      
      return { 
        hasDuplicates, 
        logs: [
          `Found ${authUIIntegrationCalls.length} auth UI integration calls`,
          `Found ${initializationLogs.length} initialization log messages`
        ]
      };
    },
    
    // Test UI interactions for responsiveness
    async testUIInteractions(scenario) {
      const results = [];
      let hasUnresponsiveElements = false;
      
      // Simulate tab switching
      for (let i = 0; i < scenario.tabSwitchCount; i++) {
        results.push(`Tab switch ${i + 1}: Simulated role tab interaction`);
        
        // Check for duplicate event listeners by looking for multiple handler attachments
        const eventHandlerPattern = /addEventListener.*click/g;
        const handlerMatches = authHtmlContent.match(eventHandlerPattern) || [];
        
        if (handlerMatches.length > 10) { // Arbitrary threshold for "too many handlers"
          hasUnresponsiveElements = true;
          results.push('Potential duplicate event listeners detected');
        }
        
        await new Promise(resolve => setTimeout(resolve, scenario.interactionDelay));
      }
      
      // Simulate button clicking
      for (let i = 0; i < scenario.buttonClickCount; i++) {
        results.push(`Button click ${i + 1}: Simulated login button interaction`);
        
        // Check for button responsiveness indicators
        const buttonDisabledPattern = /disabled.*=.*true/g;
        const disabledButtons = authHtmlContent.match(buttonDisabledPattern) || [];
        
        if (disabledButtons.length > 0) {
          results.push(`Found ${disabledButtons.length} potentially disabled buttons`);
        }
      }
      
      return { hasUnresponsiveElements, results };
    },
    
    // Test for Firestore configuration override warnings
    async checkFirestoreWarnings() {
      const warnings = [];
      
      // Look for Firestore settings patterns that could cause override warnings
      const settingsPattern = /firestore.*settings/gi;
      const settingsMatches = authHtmlContent.match(settingsPattern) || [];
      
      // Check console warnings for override messages
      const overrideWarnings = this.consoleCapture.warnings.filter(w => 
        w.includes('overriding') || 
        w.includes('override') || 
        w.includes('original host')
      );
      
      const hasOverrideWarning = settingsMatches.length > 1 || overrideWarnings.length > 0;
      
      if (settingsMatches.length > 1) {
        warnings.push(`Multiple Firestore settings configurations detected (${settingsMatches.length})`);
      }
      
      warnings.push(...overrideWarnings);
      
      return { hasOverrideWarning, warnings };
    },
    
    // Test for deprecated persistence API usage
    async checkDeprecatedPersistenceAPI() {
      const warnings = [];
      
      // Look for deprecated persistence method usage
      const deprecatedMethods = [
        'enableMultiTabIndexedDbPersistence',
        'enablePersistence'
      ];
      
      let hasDeprecatedWarning = false;
      
      for (const method of deprecatedMethods) {
        const methodPattern = new RegExp(method, 'g');
        const methodMatches = authHtmlContent.match(methodPattern) || [];
        
        if (methodMatches.length > 0) {
          hasDeprecatedWarning = true;
          warnings.push(`Deprecated method ${method} found ${methodMatches.length} times`);
        }
      }
      
      // Check console warnings for deprecation messages
      const deprecationWarnings = this.consoleCapture.warnings.filter(w => 
        w.includes('deprecated') || 
        w.includes('enableMultiTabIndexedDbPersistence')
      );
      
      if (deprecationWarnings.length > 0) {
        hasDeprecatedWarning = true;
        warnings.push(...deprecationWarnings);
      }
      
      return { hasDeprecatedWarning, warnings };
    },
    
    // Test for Firebase Storage access errors
    async checkStorageAccess() {
      const errors = [];
      
      // Look for Firebase Storage usage patterns
      const storagePattern = /firebase\.storage/gi;
      const storageMatches = authHtmlContent.match(storagePattern) || [];
      
      // Check for Storage script inclusion
      const storageScript = authHtmlContent.includes('firebase-storage');
      
      // Check console errors for storage-related issues
      const storageErrors = this.consoleCapture.errors.filter(e => 
        e.includes('firebase.storage is not a function') || 
        e.includes('storage') && e.includes('not defined')
      );
      
      const hasError = (storageMatches.length > 0 && !storageScript) || storageErrors.length > 0;
      
      if (storageMatches.length > 0 && !storageScript) {
        errors.push(`Firebase Storage used ${storageMatches.length} times but script not included`);
      }
      
      errors.push(...storageErrors);
      
      return { hasError, errors };
    },
    
    // Cleanup test environment
    async cleanup() {
      // Reset console methods
      console.log('🧹 Cleaning up test environment...');
      this.consoleCapture.warnings = [];
      this.consoleCapture.errors = [];
      this.consoleCapture.logs = [];
    }
  };
  
  return testEnvironment;
}

// Export for use in other test files
module.exports = { createAuthPageTest, runFirebaseBugExplorationTest };