#!/usr/bin/env node

/**
 * Test Runner for Bug Condition Exploration
 * Runs the property-based test to detect Firebase initialization bugs
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Bug Condition Exploration Test');
console.log('=========================================');
console.log('CRITICAL: This test MUST FAIL on unfixed code');
console.log('Failure confirms the bugs exist and provides counterexamples');
console.log('');

// Import and run the test directly
async function runBugExplorationTest() {
  try {
    // Import the test module
    const { createAuthPageTest, runFirebaseBugExplorationTest } = require('../suites/test-bug-condition-exploration.js');
    
    console.log('🔍 Starting Firebase initialization bug detection...');
    
    // Run the property-based test
    const propertyTestResult = await runFirebaseBugExplorationTest();
    
    if (propertyTestResult.bugsDetected) {
      console.log('🎯 EXPECTED RESULT: Bugs detected through property-based testing');
      console.log('Counterexamples:', propertyTestResult.counterexamples);
      
      return { 
        success: true, 
        bugsDetected: true, 
        counterexamples: [propertyTestResult.counterexamples],
        testMethod: 'property-based'
      };
    }
    
    // If property test didn't detect bugs, run manual scenario test
    console.log('🔍 Running additional manual scenario test...');
    const testScenario = {
      loadDelay: 500,
      interactionDelay: 200,
      tabSwitchCount: 2,
      buttonClickCount: 2
    };
    
    console.log('📋 Test scenario:', testScenario);
    
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
    
    // Create test page environment
    const testPage = await createAuthPageTest();
    
    console.log('');
    console.log('🧪 Running bug detection tests...');
    console.log('');
    
    // Test 1: Check for duplicate Firebase script loading (Requirement 1.1)
    console.log('🔎 [1/6] Testing duplicate Firebase script loading...');
    const scriptDuplicates = await testPage.checkDuplicateScripts();
    testResults.duplicateScriptLoading = scriptDuplicates.hasDuplicates;
    testResults.consoleWarnings.push(...scriptDuplicates.warnings);
    console.log(`   Result: ${scriptDuplicates.hasDuplicates ? '❌ DUPLICATES DETECTED' : '✅ No duplicates'}`);
    if (scriptDuplicates.warnings.length > 0) {
      console.log(`   Warnings: ${scriptDuplicates.warnings.join('; ')}`);
    }
    
    // Add delay to simulate real loading conditions
    await new Promise(resolve => setTimeout(resolve, testScenario.loadDelay));
    
    // Test 2: Check for duplicate Authentication UI Integration initialization (Requirement 1.2)
    console.log('🔎 [2/6] Testing duplicate initialization...');
    const initDuplicates = await testPage.checkDuplicateInitialization();
    testResults.duplicateInitialization = initDuplicates.hasDuplicates;
    testResults.initializationLogs.push(...initDuplicates.logs);
    console.log(`   Result: ${initDuplicates.hasDuplicates ? '❌ DUPLICATE INIT DETECTED' : '✅ Single initialization'}`);
    if (initDuplicates.logs.length > 0) {
      console.log(`   Details: ${initDuplicates.logs.join('; ')}`);
    }
    
    // Test 3: Check for non-functional login buttons and tabs (Requirement 1.3)
    console.log('🔎 [3/6] Testing UI responsiveness...');
    const uiTests = await testPage.testUIInteractions(testScenario);
    testResults.unresponsiveUI = uiTests.hasUnresponsiveElements;
    testResults.uiInteractionResults.push(...uiTests.results);
    console.log(`   Result: ${uiTests.hasUnresponsiveElements ? '❌ UNRESPONSIVE UI DETECTED' : '✅ UI responsive'}`);
    if (uiTests.results.length > 0) {
      console.log(`   Interactions: ${uiTests.results.slice(0, 3).join('; ')}${uiTests.results.length > 3 ? '...' : ''}`);
    }
    
    // Test 4: Check for Firestore configuration override warnings (Requirement 1.4)
    console.log('🔎 [4/6] Testing Firestore configuration warnings...');
    const firestoreWarnings = await testPage.checkFirestoreWarnings();
    testResults.firestoreOverrideWarning = firestoreWarnings.hasOverrideWarning;
    testResults.consoleWarnings.push(...firestoreWarnings.warnings);
    console.log(`   Result: ${firestoreWarnings.hasOverrideWarning ? '❌ OVERRIDE WARNINGS DETECTED' : '✅ No override warnings'}`);
    if (firestoreWarnings.warnings.length > 0) {
      console.log(`   Warnings: ${firestoreWarnings.warnings.join('; ')}`);
    }
    
    // Test 5: Check for deprecated persistence API usage (Requirement 1.5)
    console.log('🔎 [5/6] Testing deprecated persistence API warnings...');
    const persistenceWarnings = await testPage.checkDeprecatedPersistenceAPI();
    testResults.deprecatedPersistenceWarning = persistenceWarnings.hasDeprecatedWarning;
    testResults.consoleWarnings.push(...persistenceWarnings.warnings);
    console.log(`   Result: ${persistenceWarnings.hasDeprecatedWarning ? '❌ DEPRECATED API DETECTED' : '✅ Modern APIs used'}`);
    if (persistenceWarnings.warnings.length > 0) {
      console.log(`   Warnings: ${persistenceWarnings.warnings.join('; ')}`);
    }
    
    // Test 6: Check for Firebase Storage access errors (Requirement 1.6)
    console.log('🔎 [6/6] Testing Firebase Storage access...');
    const storageErrors = await testPage.checkStorageAccess();
    testResults.storageAccessError = storageErrors.hasError;
    testResults.consoleErrors.push(...storageErrors.errors);
    console.log(`   Result: ${storageErrors.hasError ? '❌ STORAGE ACCESS ERRORS DETECTED' : '✅ Storage access working'}`);
    if (storageErrors.errors.length > 0) {
      console.log(`   Errors: ${storageErrors.errors.join('; ')}`);
    }
    
    // Clean up test page
    await testPage.cleanup();
    
    console.log('');
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    
    // Count detected bugs
    const bugsDetected = [
      testResults.duplicateScriptLoading,
      testResults.duplicateInitialization, 
      testResults.unresponsiveUI,
      testResults.firestoreOverrideWarning,
      testResults.deprecatedPersistenceWarning,
      testResults.storageAccessError
    ].filter(Boolean).length;
    
    console.log(`Total bugs detected: ${bugsDetected}/6`);
    console.log('');
    
    // Report individual bugs
    const bugNames = [
      'Duplicate script loading',
      'Duplicate initialization', 
      'Unresponsive UI elements',
      'Firestore override warnings',
      'Deprecated persistence API',
      'Storage access errors'
    ];
    
    const bugStates = [
      testResults.duplicateScriptLoading,
      testResults.duplicateInitialization,
      testResults.unresponsiveUI,
      testResults.firestoreOverrideWarning,
      testResults.deprecatedPersistenceWarning,
      testResults.storageAccessError
    ];
    
    bugNames.forEach((name, index) => {
      console.log(`${bugStates[index] ? '❌' : '✅'} ${name}`);
    });
    
    console.log('');
    
    if (bugsDetected > 0) {
      console.log('🎯 EXPECTED RESULT: TEST FAILED (bugs detected)');
      console.log('This confirms the Firebase initialization bugs exist in the current code.');
      console.log('');
      console.log('Counterexamples found:');
      
      const detectedIssues = [];
      if (testResults.duplicateScriptLoading) detectedIssues.push('• Duplicate Firebase scripts detected');
      if (testResults.duplicateInitialization) detectedIssues.push('• Multiple initialization detected');
      if (testResults.unresponsiveUI) detectedIssues.push('• Unresponsive UI elements detected');
      if (testResults.firestoreOverrideWarning) detectedIssues.push('• Firestore configuration conflicts detected');
      if (testResults.deprecatedPersistenceWarning) detectedIssues.push('• Deprecated persistence API usage detected');
      if (testResults.storageAccessError) detectedIssues.push('• Firebase Storage access errors detected');
      
      detectedIssues.forEach(issue => console.log(issue));
      
      if (testResults.consoleWarnings.length > 0) {
        console.log('');
        console.log('Console warnings captured:');
        testResults.consoleWarnings.slice(0, 5).forEach(warning => console.log(`• ${warning}`));
        if (testResults.consoleWarnings.length > 5) {
          console.log(`• ... and ${testResults.consoleWarnings.length - 5} more warnings`);
        }
      }
      
      if (testResults.consoleErrors.length > 0) {
        console.log('');
        console.log('Console errors captured:');
        testResults.consoleErrors.slice(0, 3).forEach(error => console.log(`• ${error}`));
        if (testResults.consoleErrors.length > 3) {
          console.log(`• ... and ${testResults.consoleErrors.length - 3} more errors`);
        }
      }
      
      console.log('');
      console.log('✅ Bug condition exploration test PASSED');
      console.log('(The test correctly detected the bugs that need to be fixed)');
      
      // Document the counterexamples for the bugfix process
      const counterexampleReport = {
        testScenario,
        bugsDetected,
        bugDetails: {
          duplicateScriptLoading: testResults.duplicateScriptLoading,
          duplicateInitialization: testResults.duplicateInitialization,
          unresponsiveUI: testResults.unresponsiveUI,
          firestoreOverrideWarning: testResults.firestoreOverrideWarning,
          deprecatedPersistenceWarning: testResults.deprecatedPersistenceWarning,
          storageAccessError: testResults.storageAccessError
        },
        warnings: testResults.consoleWarnings,
        errors: testResults.consoleErrors,
        timestamp: new Date().toISOString()
      };
      
      // Save counterexample report
      const fs = require('fs').promises;
      const reportPath = path.join(__dirname, '../reports/bug-exploration-counterexamples.json');
      await fs.writeFile(
        reportPath, 
        JSON.stringify(counterexampleReport, null, 2)
      );
      
      console.log(`📝 Counterexamples documented in: ${reportPath}`);
      
      return { success: true, bugsDetected, counterexamples: detectedIssues };
      
    } else {
      console.log('⚠️  UNEXPECTED RESULT: No bugs detected');
      console.log('This might indicate:');
      console.log('1. The bugs have already been fixed');
      console.log('2. The test needs adjustment to detect the bugs');
      console.log('3. The root cause analysis might be incorrect');
      console.log('');
      console.log('❌ Bug condition exploration test FAILED');
      console.log('(Expected to detect bugs but none were found)');
      
      return { success: false, bugsDetected: 0, counterexamples: [] };
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 TEST EXECUTION ERROR');
    console.error('======================');
    console.error('Error during bug exploration test execution:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    
    return { success: false, error: error.message };
  }
}

// Run the test
runBugExplorationTest()
  .then(result => {
    console.log('');
    console.log('🏁 Test execution completed');
    
    if (result.success && result.bugsDetected > 0) {
      console.log(`✅ Successfully detected ${result.bugsDetected} Firebase initialization bugs`);
      process.exit(0); // Success - bugs detected as expected
    } else if (result.success && result.bugsDetected === 0) {
      console.log('⚠️  No bugs detected - this may require investigation');
      process.exit(1); // Unexpected - should have detected bugs
    } else {
      console.log('❌ Test execution failed');
      process.exit(1); // Test failed to run
    }
  })
  .catch(error => {
    console.error('');
    console.error('💥 FATAL ERROR');
    console.error('==============');
    console.error('Failed to run bug exploration test:');
    console.error(error.message);
    process.exit(1);
  });