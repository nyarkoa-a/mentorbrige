#!/usr/bin/env node

/**
 * Test script for Firebase setup verification
 * This script tests the Firebase configuration and connection
 */

const path = require('path');
const rootDir = path.resolve(__dirname, '../../');
require('dotenv').config({ path: path.join(rootDir, '.env') });

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');
  
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID'
  ];

  const missing = [];
  const present = [];

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName}: NOT SET`);
    }
  });

  if (missing.length > 0) {
    console.error(`\n❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log(`\n✅ All ${present.length} environment variables are set correctly`);
  return true;
}

// Test backend config route
async function testBackendConfig() {
  console.log('\n🔍 Testing backend config route...');
  
  try {
    // Import the config router
    const configRouter = require(path.join(rootDir, 'backend/routes/config.js'));
    console.log('✅ Config route loaded successfully');
    
    // Mock request and response for testing
    const mockReq = {};
    const mockRes = {
      json: (data) => {
        console.log('✅ Config route response:', {
          projectId: data.projectId,
          authDomain: data.authDomain,
          hasApiKey: !!data.apiKey,
          hasAppId: !!data.appId
        });
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Config route error (${code}):`, data);
          return data;
        }
      })
    };

    // Test the route handler directly
    const handler = configRouter.stack.find(layer => layer.route && layer.route.path === '/firebase').route.stack[0].handle;
    handler(mockReq, mockRes);
    
    return true;
  } catch (error) {
    console.error('❌ Backend config test failed:', error.message);
    return false;
  }
}

// Test Firebase configuration structure
function testFirebaseConfigStructure() {
  console.log('\n🔍 Testing Firebase configuration structure...');
  
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };

  // Validate config structure
  const validations = [
    { key: 'apiKey', pattern: /^AIza[0-9A-Za-z-_]{35}$/, value: config.apiKey },
    { key: 'authDomain', pattern: /^[a-z0-9-]+\.firebaseapp\.com$/, value: config.authDomain },
    { key: 'projectId', pattern: /^[a-z0-9-]+$/, value: config.projectId },
    { key: 'storageBucket', pattern: /^[a-z0-9-]+\.(appspot\.com|firebasestorage\.app)$/, value: config.storageBucket },
    { key: 'messagingSenderId', pattern: /^[0-9]+$/, value: config.messagingSenderId },
    { key: 'appId', pattern: /^1:[0-9]+:web:[a-f0-9]+$/, value: config.appId },
    { key: 'measurementId', pattern: /^G-[A-Z0-9]+$/, value: config.measurementId }
  ];

  let allValid = true;
  validations.forEach(({ key, pattern, value }) => {
    if (pattern.test(value)) {
      console.log(`✅ ${key}: Valid format`);
    } else {
      console.log(`❌ ${key}: Invalid format - ${value}`);
      allValid = false;
    }
  });

  if (allValid) {
    console.log('\n✅ Firebase configuration structure is valid');
  } else {
    console.log('\n❌ Firebase configuration has format issues');
  }

  return allValid;
}

// Test package dependencies
function testPackageDependencies() {
  console.log('\n🔍 Testing package dependencies...');
  
  try {
    const packageJson = require(path.join(rootDir, 'package.json'));
    
    if (packageJson.dependencies && packageJson.dependencies.firebase) {
      console.log(`✅ Firebase SDK installed: ${packageJson.dependencies.firebase}`);
      return true;
    } else {
      console.log('❌ Firebase SDK not found in dependencies');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Firebase setup verification...\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Package Dependencies', fn: testPackageDependencies },
    { name: 'Firebase Config Structure', fn: testFirebaseConfigStructure },
    { name: 'Backend Config Route', fn: testBackendConfig }
  ];

  let allPassed = true;
  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      if (!result) allPassed = false;
    } catch (error) {
      console.error(`❌ Test "${test.name}" failed with error:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
      allPassed = false;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All tests passed! Firebase setup is ready.');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Open the application in a browser');
    console.log('3. Test Firebase authentication and database operations');
  } else {
    console.log('❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
  console.log('='.repeat(50));
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEnvironmentVariables, testBackendConfig, testFirebaseConfigStructure };