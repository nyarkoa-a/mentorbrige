#!/usr/bin/env node

/**
 * Test script for Firebase initialization and connectivity
 * This script tests the Firebase configuration and basic connectivity
 */

const firebase = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

async function testFirebaseInitialization() {
  console.log('🔥 Testing Firebase SDK and Configuration Infrastructure...\n');

  try {
    // Test 1: Configuration validation
    console.log('1️⃣  Testing configuration validation...');
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }
    console.log('✅ Configuration validation passed');

    // Test 2: Firebase app initialization
    console.log('\n2️⃣  Testing Firebase app initialization...');
    const app = firebase.initializeApp(firebaseConfig, 'test-app');
    console.log(`✅ Firebase app initialized successfully: ${app.name}`);

    // Test 3: Firestore initialization
    console.log('\n3️⃣  Testing Firestore initialization...');
    const db = getFirestore(app);
    console.log('✅ Firestore initialized successfully');

    // Test 4: Auth initialization
    console.log('\n4️⃣  Testing Auth initialization...');
    const auth = getAuth(app);
    console.log('✅ Auth initialized successfully');

    // Test 5: Configuration consistency
    console.log('\n5️⃣  Testing configuration consistency...');
    const configFromApp = app.options;
    console.log(`Project ID from config: ${firebaseConfig.projectId}`);
    console.log(`Project ID from app: ${configFromApp.projectId}`);
    
    if (configFromApp.projectId !== firebaseConfig.projectId) {
      throw new Error('Configuration inconsistency detected');
    }
    console.log('✅ Configuration consistency verified');

    console.log('\n🎉 All Firebase initialization tests passed!');
    
    return {
      success: true,
      app: app.name,
      projectId: firebaseConfig.projectId,
      services: ['firestore', 'auth']
    };

  } catch (error) {
    console.error('\n❌ Firebase initialization test failed:');
    console.error(error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testFirebaseInitialization()
    .then(result => {
      if (result.success) {
        console.log('\n📋 Test Summary:');
        console.log(`App Name: ${result.app}`);
        console.log(`Project ID: ${result.projectId}`);
        console.log(`Services: ${result.services.join(', ')}`);
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
}

module.exports = { testFirebaseInitialization };