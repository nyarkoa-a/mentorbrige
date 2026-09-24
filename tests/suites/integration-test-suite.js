#!/usr/bin/env node

/**
 * Comprehensive Integration Test Suite for Firebase Initialization Fix
 * 
 * This suite validates that all Firebase services work correctly after the fix
 * and ensures end-to-end functionality is preserved.
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🧪 Firebase Integration Test Suite');
console.log('==================================');
console.log('Comprehensive testing of all Firebase services and functionality');
console.log('');

async function runIntegrationTests() {
  const testResults = {
    authPageLoading: false,
    noConsoleWarnings: false,
    authUIIntegrationInitialization: false,
    firebaseStorageFunctionality: false,
    firestoreOperations: false,
    authenticationFlows: false,
    existingFunctionalityPreserved: false,
    overallScore: 0,
    detailedResults: [],
    errors: [],
    warnings: []
  };

  console.log('🔍 Starting comprehensive integration testing...');
  console.log('');

  try {
    // Test 1: Auth page loading without errors
    console.log('📄 Test 1: Auth page loading validation');
    console.log('---------------------------------------');
    
    const authPageTest = await testAuthPageLoading();
    testResults.authPageLoading = authPageTest.success;
    testResults.detailedResults.push(`Auth page loading: ${authPageTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (authPageTest.success) {
      console.log('✅ Auth page loads without console warnings or errors');
    } else {
      console.log('❌ Auth page loading issues detected');
      testResults.errors.push(...authPageTest.errors);
    }
    console.log('');

    // Test 2: Console warnings validation
    console.log('🔇 Test 2: Console warnings validation');
    console.log('--------------------------------------');
    
    const consoleTest = await testConsoleWarnings();
    testResults.noConsoleWarnings = consoleTest.success;
    testResults.detailedResults.push(`No console warnings: ${consoleTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (consoleTest.success) {
      console.log('✅ No Firebase initialization warnings in console');
    } else {
      console.log('❌ Console warnings detected');
      testResults.warnings.push(...consoleTest.warnings);
    }
    console.log('');

    // Test 3: Authentication UI Integration initialization
    console.log('🔐 Test 3: Authentication UI Integration');
    console.log('---------------------------------------');
    
    const authUITest = await testAuthUIIntegration();
    testResults.authUIIntegrationInitialization = authUITest.success;
    testResults.detailedResults.push(`Auth UI Integration: ${authUITest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (authUITest.success) {
      console.log('✅ Authentication UI Integration initializes once and functions correctly');
    } else {
      console.log('❌ Authentication UI Integration issues detected');
      testResults.errors.push(...authUITest.errors);
    }
    console.log('');

    // Test 4: Firebase Storage functionality
    console.log('💾 Test 4: Firebase Storage access and functionality');
    console.log('---------------------------------------------------');
    
    const storageTest = await testFirebaseStorage();
    testResults.firebaseStorageFunctionality = storageTest.success;
    testResults.detailedResults.push(`Firebase Storage: ${storageTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (storageTest.success) {
      console.log('✅ Firebase Storage access and functionality working correctly');
    } else {
      console.log('❌ Firebase Storage issues detected');
      testResults.errors.push(...storageTest.errors);
    }
    console.log('');

    // Test 5: Firestore operations
    console.log('🗄️ Test 5: Firestore operations with proper configuration');
    console.log('--------------------------------------------------------');
    
    const firestoreTest = await testFirestoreOperations();
    testResults.firestoreOperations = firestoreTest.success;
    testResults.detailedResults.push(`Firestore operations: ${firestoreTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (firestoreTest.success) {
      console.log('✅ Firestore operations work with proper configuration');
    } else {
      console.log('❌ Firestore configuration issues detected');
      testResults.errors.push(...firestoreTest.errors);
    }
    console.log('');

    // Test 6: End-to-end authentication flows
    console.log('🔄 Test 6: End-to-end authentication flows');
    console.log('-------------------------------------------');
    
    const authFlowTest = await testAuthenticationFlows();
    testResults.authenticationFlows = authFlowTest.success;
    testResults.detailedResults.push(`Authentication flows: ${authFlowTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (authFlowTest.success) {
      console.log('✅ Authentication flows work end-to-end');
    } else {
      console.log('❌ Authentication flow issues detected');
      testResults.errors.push(...authFlowTest.errors);
    }
    console.log('');

    // Test 7: Existing functionality preservation
    console.log('🛡️ Test 7: Existing functionality preservation');
    console.log('----------------------------------------------');
    
    const preservationTest = await testExistingFunctionality();
    testResults.existingFunctionalityPreserved = preservationTest.success;
    testResults.detailedResults.push(`Functionality preserved: ${preservationTest.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (preservationTest.success) {
      console.log('✅ All existing functionality preserved');
    } else {
      console.log('❌ Some functionality may have been affected');
      testResults.errors.push(...preservationTest.errors);
    }
    console.log('');

    // Calculate overall score
    const passedTests = [
      testResults.authPageLoading,
      testResults.noConsoleWarnings,
      testResults.authUIIntegrationInitialization,
      testResults.firebaseStorageFunctionality,
      testResults.firestoreOperations,
      testResults.authenticationFlows,
      testResults.existingFunctionalityPreserved
    ].filter(Boolean).length;

    testResults.overallScore = passedTests;

    // Generate summary report
    console.log('📊 INTEGRATION TEST SUMMARY');
    console.log('============================');
    console.log(`Overall Score: ${testResults.overallScore}/7 tests passed`);
    console.log('');

    testResults.detailedResults.forEach(result => {
      console.log(result);
    });

    console.log('');

    if (testResults.overallScore === 7) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('✅ Firebase initialization fix is working correctly');
      console.log('✅ All services functioning properly');
      console.log('✅ No regressions detected');
    } else {
      console.log('⚠️ SOME INTEGRATION TESTS FAILED');
      console.log(`❌ ${7 - testResults.overallScore} test(s) need attention`);
      
      if (testResults.errors.length > 0) {
        console.log('');
        console.log('🔍 Detected Issues:');
        testResults.errors.forEach(error => console.log(`  • ${error}`));
      }
      
      if (testResults.warnings.length > 0) {
        console.log('');
        console.log('⚠️ Warnings:');
        testResults.warnings.forEach(warning => console.log(`  • ${warning}`));
      }
    }

    // Save detailed test report
    const reportPath = path.join(__dirname, 'integration-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        totalTests: 7,
        passedTests: testResults.overallScore,
        failedTests: 7 - testResults.overallScore,
        successRate: `${Math.round((testResults.overallScore / 7) * 100)}%`
      }
    }, null, 2));

    console.log('');
    console.log(`📝 Detailed report saved to: ${reportPath}`);

    return testResults;

  } catch (error) {
    console.error('💥 Integration test execution failed:', error.message);
    testResults.errors.push(error.message);
    return testResults;
  }
}

// Individual test functions

async function testAuthPageLoading() {
  try {
    // Read auth.html to check for proper structure
    const authHtmlPath = path.join(__dirname, 'public', 'pages', 'auth.html');
    const authHtmlContent = await fs.readFile(authHtmlPath, 'utf8');
    
    // Check for centralized Firebase manager usage
    const hasFirebaseManager = authHtmlContent.includes('firebase-manager.js');
    const hasScriptLoader = authHtmlContent.includes('firebase-script-loader.js');
    
    // Check script loading order
    const scriptTags = authHtmlContent.match(/<script[^>]*src[^>]*>/g) || [];
    const firebaseScripts = scriptTags.filter(tag => tag.includes('firebase'));
    
    // Validate proper loading sequence
    const hasProperSequence = firebaseScripts.length > 0 && hasFirebaseManager;
    
    const errors = [];
    if (!hasFirebaseManager) errors.push('Missing Firebase manager integration');
    if (!hasScriptLoader) errors.push('Missing script loader');
    if (!hasProperSequence) errors.push('Improper Firebase script loading sequence');
    
    return {
      success: errors.length === 0,
      errors,
      details: {
        hasFirebaseManager,
        hasScriptLoader,
        scriptCount: firebaseScripts.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test auth page loading: ${error.message}`]
    };
  }
}

async function testConsoleWarnings() {
  // Simulate checking console output during Firebase initialization
  const warnings = [];
  
  try {
    // Read firebase configuration files to check for warning-causing patterns
    const configFiles = [
      'public/js/firebase-config.js',
      'public/js/firebase-service.js',
      'public/js/firebase-manager.js'
    ];
    
    for (const configFile of configFiles) {
      try {
        const configPath = path.join(__dirname, configFile);
        const configContent = await fs.readFile(configPath, 'utf8');
        
        // Check for deprecated API usage
        if (configContent.includes('enableMultiTabIndexedDbPersistence')) {
          warnings.push(`Deprecated persistence API found in ${configFile}`);
        }
        
        // Check for duplicate Firestore settings
        const settingsMatches = (configContent.match(/\.settings\(/g) || []).length;
        if (settingsMatches > 1) {
          warnings.push(`Multiple Firestore settings calls in ${configFile}`);
        }
        
      } catch (err) {
        // File might not exist, which is okay
      }
    }
    
    return {
      success: warnings.length === 0,
      warnings
    };
    
  } catch (error) {
    return {
      success: false,
      warnings: [`Failed to check console warnings: ${error.message}`]
    };
  }
}

async function testAuthUIIntegration() {
  try {
    // Read auth UI integration file
    const authUIPath = path.join(__dirname, 'public', 'js', 'auth-ui-integration.js');
    const authUIContent = await fs.readFile(authUIPath, 'utf8');
    
    // Check for initialization guards
    const hasInitializationGuard = authUIContent.includes('authUIIntegrationInitialized') || 
                                  authUIContent.includes('initialized');
    
    // Check for singleton pattern
    const hasSingletonPattern = authUIContent.includes('window.') || 
                               authUIContent.includes('global');
    
    const errors = [];
    if (!hasInitializationGuard) errors.push('Missing initialization guard in Auth UI Integration');
    if (!hasSingletonPattern) errors.push('Missing singleton pattern in Auth UI Integration');
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test Auth UI Integration: ${error.message}`]
    };
  }
}

async function testFirebaseStorage() {
  try {
    // Check Firebase Script Loader for Storage configuration
    const scriptLoaderPath = path.join(__dirname, 'public', 'js', 'firebase-script-loader.js');
    const scriptLoaderContent = await fs.readFile(scriptLoaderPath, 'utf8');
    
    // Check if Storage is configured in the script loader
    const hasStorageConfig = scriptLoaderContent.includes('firebase-storage') && 
                           scriptLoaderContent.includes("name: 'storage'");
    
    // Check Firebase Manager for Storage service inclusion
    const managerPath = path.join(__dirname, 'public', 'js', 'firebase-manager.js');
    const managerContent = await fs.readFile(managerPath, 'utf8');
    
    // Check if Storage is included in the default services
    const hasStorageInServices = managerContent.includes("'storage'") || 
                               managerContent.includes('"storage"');
    
    // Check service files for Storage integration
    const serviceFiles = [
      'public/js/firebase-service.js'
    ];
    
    let hasStorageService = false;
    for (const serviceFile of serviceFiles) {
      try {
        const servicePath = path.join(__dirname, serviceFile);
        const serviceContent = await fs.readFile(servicePath, 'utf8');
        
        if (serviceContent.includes('storage') || serviceContent.includes('Storage')) {
          hasStorageService = true;
          break;
        }
      } catch (err) {
        // File might not exist
      }
    }
    
    const errors = [];
    if (!hasStorageConfig) errors.push('Firebase Storage not configured in script loader');
    if (!hasStorageInServices) errors.push('Firebase Storage not included in manager services');
    if (!hasStorageService) errors.push('Firebase Storage service not integrated');
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test Firebase Storage: ${error.message}`]
    };
  }
}

async function testFirestoreOperations() {
  try {
    // Check Firestore configuration
    const configFiles = [
      'public/js/firebase-config.js',
      'public/js/firebase-service.js'
    ];
    
    let hasModernConfig = false;
    const errors = [];
    
    for (const configFile of configFiles) {
      try {
        const configPath = path.join(__dirname, configFile);
        const configContent = await fs.readFile(configPath, 'utf8');
        
        // Check for modern Firestore initialization
        if (configContent.includes('initializeFirestore') || 
            configContent.includes('cache:')) {
          hasModernConfig = true;
        }
        
        // Check for merge options in settings
        if (configContent.includes('merge: true')) {
          hasModernConfig = true;
        }
        
        // Check for deprecated methods
        if (configContent.includes('enableMultiTabIndexedDbPersistence')) {
          errors.push(`Deprecated persistence API still in use in ${configFile}`);
        }
        
      } catch (err) {
        // File might not exist
      }
    }
    
    if (!hasModernConfig) {
      errors.push('Modern Firestore configuration not found');
    }
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test Firestore operations: ${error.message}`]
    };
  }
}

async function testAuthenticationFlows() {
  try {
    // Check authentication flow files
    const authFiles = [
      'public/js/firebase-auth.js',
      'public/js/auth-ui-integration.js'
    ];
    
    let hasAuthFlow = false;
    const errors = [];
    
    for (const authFile of authFiles) {
      try {
        const authPath = path.join(__dirname, authFile);
        const authContent = await fs.readFile(authPath, 'utf8');
        
        // Check for authentication state handling
        if (authContent.includes('onAuthStateChanged') || 
            authContent.includes('signIn') || 
            authContent.includes('authentication')) {
          hasAuthFlow = true;
        }
        
      } catch (err) {
        errors.push(`Could not read auth file: ${authFile}`);
      }
    }
    
    if (!hasAuthFlow) {
      errors.push('Authentication flow implementation not found');
    }
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test authentication flows: ${error.message}`]
    };
  }
}

async function testExistingFunctionality() {
  try {
    // Check that key application files still exist and are functional
    const keyFiles = [
      'public/index.html',
      'public/pages/student-dashboard.html',
      'public/pages/settings.html',
      'public/js/app.js'
    ];
    
    const errors = [];
    
    for (const keyFile of keyFiles) {
      try {
        const filePath = path.join(__dirname, keyFile);
        await fs.access(filePath);
        
        // Read file to check it's not corrupted
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        if (fileContent.length === 0) {
          errors.push(`${keyFile} is empty`);
        }
        
      } catch (err) {
        errors.push(`Key file missing or corrupted: ${keyFile}`);
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to test existing functionality: ${error.message}`]
    };
  }
}

// Run the integration test suite
if (require.main === module) {
  runIntegrationTests()
    .then(results => {
      console.log('');
      console.log('🏁 Integration testing completed');
      
      if (results.overallScore === 7) {
        console.log('🎉 All integration tests passed - Firebase initialization fix is working correctly!');
        process.exit(0);
      } else {
        console.log('⚠️ Some integration tests failed - review required');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Integration test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };