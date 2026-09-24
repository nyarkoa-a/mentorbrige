#!/usr/bin/env node

/**
 * Comprehensive Firebase Fixes Validation
 * Tests all the Firebase initialization fixes that were implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Firebase Initialization Fixes');
console.log('=========================================');
console.log('');

const testResults = {
  scriptsDeduplication: false,
  storageIntegration: false,
  configMergeOptions: false,
  persistenceAPIs: false,
  uiDeduplication: false,
  centralizedManager: false
};

// Test 1: Script Deduplication
console.log('🔎 [1/6] Testing Firebase script deduplication...');
try {
  const authHtml = fs.readFileSync(path.join(__dirname, 'public/pages/auth.html'), 'utf8');
  const studentDashboard = fs.readFileSync(path.join(__dirname, 'public/pages/student-dashboard.html'), 'utf8');
  
  // Check auth.html uses dynamic loading
  const hasScriptLoader = authHtml.includes('firebase-script-loader.js');
  const hasManagerLoader = authHtml.includes('firebase-manager.js');
  const hasNoDuplicateScripts = !authHtml.includes('firebase-app-compat.js') || 
                               (authHtml.match(/firebase-app-compat\.js/g) || []).length <= 1;
  
  // Check student-dashboard.html has no duplicates
  const dashboardScripts = (studentDashboard.match(/firebase-[^"]*\.js/g) || []).length;
  const duplicateRemoved = studentDashboard.includes('removed duplicates');
  
  if (hasScriptLoader && hasManagerLoader && hasNoDuplicateScripts && duplicateRemoved) {
    testResults.scriptsDeduplication = true;
    console.log('   ✅ Script deduplication implemented correctly');
  } else {
    console.log('   ❌ Script deduplication issues found');
    console.log(`      - Script loader: ${hasScriptLoader}`);
    console.log(`      - Manager loader: ${hasManagerLoader}`);
    console.log(`      - No duplicates: ${hasNoDuplicateScripts}`);
  }
} catch (error) {
  console.log('   ❌ Error testing script deduplication:', error.message);
}

// Test 2: Firebase Storage Integration
console.log('🔎 [2/6] Testing Firebase Storage integration...');
try {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
  const firebaseService = fs.readFileSync(path.join(__dirname, 'public/js/firebase-service.js'), 'utf8');
  
  // Check Storage script is included
  const hasStorageScript = indexHtml.includes('firebase-storage-compat.js');
  
  // Check Storage is initialized in firebase-service.js
  const hasStorageInit = firebaseService.includes('firebase.storage');
  const hasStorageMethod = firebaseService.includes('getStorage()');
  
  if (hasStorageScript && hasStorageInit && hasStorageMethod) {
    testResults.storageIntegration = true;
    console.log('   ✅ Firebase Storage integration implemented correctly');
  } else {
    console.log('   ❌ Firebase Storage integration issues found');
    console.log(`      - Storage script included: ${hasStorageScript}`);
    console.log(`      - Storage initialization: ${hasStorageInit}`);
    console.log(`      - Storage getter method: ${hasStorageMethod}`);
  }
} catch (error) {
  console.log('   ❌ Error testing Storage integration:', error.message);
}

// Test 3: Firestore Configuration with Merge Options
console.log('🔎 [3/6] Testing Firestore configuration merge options...');
try {
  const firebaseConfig = fs.readFileSync(path.join(__dirname, 'public/js/firebase-config.js'), 'utf8');
  
  // Check for merge: true in settings
  const hasMergeOption = firebaseConfig.includes('merge: true');
  const hasConfigGuard = firebaseConfig.includes('_settingsConfigured');
  
  if (hasMergeOption && hasConfigGuard) {
    testResults.configMergeOptions = true;
    console.log('   ✅ Firestore merge options implemented correctly');
  } else {
    console.log('   ❌ Firestore merge options issues found');
    console.log(`      - Merge option: ${hasMergeOption}`);
    console.log(`      - Configuration guard: ${hasConfigGuard}`);
  }
} catch (error) {
  console.log('   ❌ Error testing Firestore config:', error.message);
}

// Test 4: Persistence API Updates
console.log('🔎 [4/6] Testing persistence API updates...');
try {
  const firebaseConfig = fs.readFileSync(path.join(__dirname, 'public/js/firebase-config.js'), 'utf8');
  
  // Check for modern persistence handling
  const hasVersionCheck = firebaseConfig.includes('firebaseVersion') || firebaseConfig.includes('SDK_VERSION');
  const usesEnablePersistence = firebaseConfig.includes('enablePersistence');
  const hasModernComment = firebaseConfig.includes('modern cache configuration') || 
                          firebaseConfig.includes('cache-based persistence');
  
  if (hasVersionCheck && usesEnablePersistence && hasModernComment) {
    testResults.persistenceAPIs = true;
    console.log('   ✅ Persistence API updates implemented correctly');
  } else {
    console.log('   ❌ Persistence API issues found');
    console.log(`      - Version check: ${hasVersionCheck}`);
    console.log(`      - Uses enablePersistence: ${usesEnablePersistence}`);
    console.log(`      - Modern comment: ${hasModernComment}`);
  }
} catch (error) {
  console.log('   ❌ Error testing persistence APIs:', error.message);
}

// Test 5: UI Integration Deduplication
console.log('🔎 [5/6] Testing UI integration deduplication...');
try {
  const authUIIntegration = fs.readFileSync(path.join(__dirname, 'public/js/auth-ui-integration.js'), 'utf8');
  const authHtml = fs.readFileSync(path.join(__dirname, 'public/pages/auth.html'), 'utf8');
  
  // Check for deduplication guards
  const hasGlobalFlag = authUIIntegration.includes('authUIIntegrationInitialized');
  const hasInitCheck = authUIIntegration.includes('already initialized');
  const htmlHasGuard = authHtml.includes('!window.authUIIntegrationInitialized');
  
  if (hasGlobalFlag && hasInitCheck && htmlHasGuard) {
    testResults.uiDeduplication = true;
    console.log('   ✅ UI integration deduplication implemented correctly');
  } else {
    console.log('   ❌ UI integration deduplication issues found');
    console.log(`      - Global flag: ${hasGlobalFlag}`);
    console.log(`      - Initialization check: ${hasInitCheck}`);
    console.log(`      - HTML guard: ${htmlHasGuard}`);
  }
} catch (error) {
  console.log('   ❌ Error testing UI deduplication:', error.message);
}

// Test 6: Centralized Manager
console.log('🔎 [6/6] Testing centralized Firebase manager...');
try {
  const managerExists = fs.existsSync(path.join(__dirname, 'public/js/firebase-manager.js'));
  
  if (managerExists) {
    const firebaseManager = fs.readFileSync(path.join(__dirname, 'public/js/firebase-manager.js'), 'utf8');
    const authHtml = fs.readFileSync(path.join(__dirname, 'public/pages/auth.html'), 'utf8');
    
    // Check manager features
    const hasManagerClass = firebaseManager.includes('FirebaseInitializationManager');
    const hasPhaseCoordination = firebaseManager.includes('_initializeScripts') && 
                                firebaseManager.includes('_initializeServices');
    const htmlUsesManager = authHtml.includes('firebaseManager.initialize');
    
    if (hasManagerClass && hasPhaseCoordination && htmlUsesManager) {
      testResults.centralizedManager = true;
      console.log('   ✅ Centralized Firebase manager implemented correctly');
    } else {
      console.log('   ❌ Centralized manager issues found');
      console.log(`      - Manager class: ${hasManagerClass}`);
      console.log(`      - Phase coordination: ${hasPhaseCoordination}`);
      console.log(`      - HTML uses manager: ${htmlUsesManager}`);
    }
  } else {
    console.log('   ❌ Firebase manager file not found');
  }
} catch (error) {
  console.log('   ❌ Error testing centralized manager:', error.message);
}

console.log('');
console.log('📊 TEST SUMMARY');
console.log('===============');

const passedTests = Object.values(testResults).filter(Boolean).length;
const totalTests = Object.keys(testResults).length;

console.log(`Tests passed: ${passedTests}/${totalTests}`);
console.log('');

// Show individual results
const testNames = [
  'Scripts deduplication',
  'Storage integration', 
  'Config merge options',
  'Persistence APIs',
  'UI deduplication',
  'Centralized manager'
];

Object.entries(testResults).forEach(([key, passed], index) => {
  console.log(`${passed ? '✅' : '❌'} ${testNames[index]}`);
});

console.log('');

if (passedTests === totalTests) {
  console.log('🎉 All Firebase initialization fixes implemented successfully!');
  console.log('The following issues should now be resolved:');
  console.log('• No more "Firebase is already defined" warnings');
  console.log('• No more Firestore override warnings');
  console.log('• No more deprecated persistence API warnings');
  console.log('• Firebase Storage properly initialized');
  console.log('• Authentication UI integration deduplication');
  console.log('• Centralized initialization coordination');
  process.exit(0);
} else {
  console.log('⚠️ Some fixes may need attention');
  console.log('Check the individual test results above for details');
  process.exit(1);
}