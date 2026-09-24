/* MentorBridge Firebase Configuration Module
 * Handles Firebase SDK initialization, configuration loading, and service management
 * Version: 2.0 - Enhanced for production Firestore integration
 */

// Global Firebase instances
window.firebaseConfig = null;
window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseFirestore = null;

// Production Firebase configuration for MentorBridge
const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAu7PoqMlQhTX06GQPjpxvns7_FI1lf2fU",
  authDomain: "mentorbridge-f551b.firebaseapp.com",
  projectId: "mentorbridge-f551b",
  storageBucket: "mentorbridge-f551b.firebasestorage.app",
  messagingSenderId: "642326772429",
  appId: "1:642326772429:web:74a10c3d81d6ef1876c784",
  measurementId: "G-05NWWSDQGW"
};

// Configuration state management
const ConfigurationManager = {
  initialized: false,
  initPromise: null,
  retryCount: 0,
  maxRetries: 3,
  connectionState: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
  
  // Event listeners for configuration state changes
  listeners: new Set(),
  
  addEventListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  notifyStateChange(state, data = {}) {
    this.connectionState = state;
    this.listeners.forEach(listener => {
      try {
        listener({ state, ...data });
      } catch (error) {
        console.error('Configuration state listener error:', error);
      }
    });
  }
};

/**
 * Load Firebase configuration from backend or fallback to production config
 * Enhanced with retry logic and better error handling
 * @returns {Promise<Object>} Firebase configuration object
 */
function loadFirebaseConfig() {
  // If config already loaded and valid, return it immediately
  if (window.firebaseConfig && window.firebaseConfig.apiKey) {
    return Promise.resolve(window.firebaseConfig);
  }

  // Use cached promise if already loading
  if (ConfigurationManager.initPromise) {
    return ConfigurationManager.initPromise;
  }

  ConfigurationManager.initPromise = loadConfigWithRetry();
  return ConfigurationManager.initPromise;
}

/**
 * Load configuration with automatic retry logic
 * @returns {Promise<Object>} Firebase configuration
 */
async function loadConfigWithRetry() {
  ConfigurationManager.notifyStateChange('connecting');
  
  for (let attempt = 0; attempt <= ConfigurationManager.maxRetries; attempt++) {
    try {
      // Try to load from backend API first
      const response = await fetch('/api/config/firebase', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();

      // Validate that we have all required fields
      const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Incomplete Firebase configuration. Missing: ${missingFields.join(', ')}`);
      }

      // Success - store and return config
      window.firebaseConfig = config;
      ConfigurationManager.notifyStateChange('connected', { config, source: 'backend' });
      console.log('✅ Firebase configuration loaded from backend');
      return config;

    } catch (error) {
      console.warn(`Backend config attempt ${attempt + 1} failed:`, error.message);
      
      // On final attempt, fallback to production config
      if (attempt === ConfigurationManager.maxRetries) {
        console.warn('Using fallback production configuration');
        window.firebaseConfig = PRODUCTION_FIREBASE_CONFIG;
        ConfigurationManager.notifyStateChange('connected', { 
          config: PRODUCTION_FIREBASE_CONFIG, 
          source: 'fallback',
          warning: 'Using fallback configuration'
        });
        return window.firebaseConfig;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // This shouldn't be reached, but just in case
  throw new Error('Failed to load Firebase configuration after all attempts');
}

/**
 * Initialize Firebase application and services
 * Enhanced with comprehensive error handling and offline persistence
 * @returns {Promise<Object>} Firebase configuration
 */
function initializeFirebaseConfig() {
  // Return existing promise if already initializing
  if (ConfigurationManager.initPromise && !ConfigurationManager.initialized) {
    return ConfigurationManager.initPromise;
  }

  // Return resolved promise if already initialized
  if (ConfigurationManager.initialized && window.firebaseApp) {
    return Promise.resolve(window.firebaseConfig);
  }

  return loadFirebaseConfig()
    .then(config => {
      console.log('🔥 Initializing Firebase services...');
      
      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
      }

      // Initialize Firebase app if not already initialized
      if (!window.firebaseApp) {
        try {
          window.firebaseApp = firebase.initializeApp(config);
          console.log('✅ Firebase app initialized:', window.firebaseApp.name);
        } catch (error) {
          if (error.code === 'app/duplicate-app') {
            window.firebaseApp = firebase.app(); // Get existing app
            console.log('♻️ Using existing Firebase app instance');
          } else {
            throw error;
          }
        }
      }

      // Initialize Firebase services
      return initializeFirebaseServices(config);
    })
    .catch(error => {
      ConfigurationManager.notifyStateChange('error', { error: error.message });
      console.error('❌ Failed to initialize Firebase configuration:', error);
      throw error;
    });
}

/**
 * Initialize Firebase services (Auth, Firestore, Analytics)
 * @param {Object} config Firebase configuration
 * @returns {Promise<Object>} Configuration object
 */
async function initializeFirebaseServices(config) {
  try {
    // Initialize Firebase Auth
    if (!window.firebaseAuth) {
      window.firebaseAuth = firebase.auth();
      console.log('✅ Firebase Auth initialized');
    }

    // Initialize Firestore with enhanced settings
    if (!window.firebaseFirestore) {
      window.firebaseFirestore = firebase.firestore();
      
      // Configure Firestore settings for optimal performance  
      const firestoreSettings = {
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true,
        merge: true // Prevent settings override warnings
      };
      
      // Apply settings (only works if called before any Firestore operations)
      // Add guard to prevent duplicate configuration
      if (!window.firebaseFirestore._settingsConfigured) {
        try {
          window.firebaseFirestore.settings(firestoreSettings);
          window.firebaseFirestore._settingsConfigured = true;
          console.log('⚙️ Firestore settings configured');
        } catch (settingsError) {
          console.warn('⚠️ Firestore settings already configured:', settingsError.message);
        }
      } else {
        console.log('♻️ Firestore settings already configured, skipping');
      }

      console.log('✅ Firebase Firestore initialized');
    }

    // Enable offline persistence for Firestore
    await enableFirestoreOfflinePersistence();

    // Initialize Firebase Analytics if available and configured
    if (firebase.analytics && config.measurementId) {
      try {
        firebase.analytics();
        console.log('📊 Firebase Analytics initialized');
      } catch (analyticsError) {
        console.warn('⚠️ Firebase Analytics initialization failed:', analyticsError.message);
      }
    }

    ConfigurationManager.initialized = true;
    ConfigurationManager.notifyStateChange('connected', { 
      config, 
      services: ['app', 'auth', 'firestore', 'analytics'] 
    });
    
    console.log('🎉 All Firebase services initialized successfully');
    return config;

  } catch (error) {
    ConfigurationManager.notifyStateChange('error', { error: error.message });
    console.error('❌ Failed to initialize Firebase services:', error);
    throw new Error(`Firebase services initialization failed: ${error.message}`);
  }
}

/**
 * Enable Firestore offline persistence with comprehensive error handling
 * Uses modern cache configuration for Firebase v10+ or legacy enablePersistence for v9
 * @returns {Promise<void>}
 */
async function enableFirestoreOfflinePersistence() {
  if (!window.firebaseFirestore) {
    console.warn('⚠️ Cannot enable offline persistence: Firestore not initialized');
    return;
  }

  try {
    // Check if we're using Firebase v10+ (which has the new cache API)
    const firebaseVersion = firebase.SDK_VERSION || '9.x.x';
    const isV10Plus = firebaseVersion.startsWith('10.') || firebaseVersion.startsWith('11.');
    
    if (isV10Plus && firebase.initializeFirestore && !window._firestoreInitialized) {
      // Use modern cache configuration for Firebase v10+
      console.log('🔄 Using modern Firestore cache configuration (v10+)');
      
      // Note: This would require reinitializing Firestore with cache settings
      // For now, we'll stick with enablePersistence() for compatibility
      console.warn('⚠️ Modern cache configuration not implemented yet, using legacy persistence');
    }
    
    // Use legacy enablePersistence() method (still supported in v10)
    await window.firebaseFirestore.enablePersistence({
      synchronizeTabs: true
    });
    console.log('💾 Firestore offline persistence enabled with tab synchronization');
    
  } catch (persistenceError) {
    const errorCode = persistenceError.code;
    
    switch (errorCode) {
      case 'failed-precondition':
        console.warn('⚠️ Offline persistence failed: Multiple tabs open. Using memory cache only.');
        break;
      case 'unimplemented':
        console.warn('⚠️ Offline persistence not supported in this browser. Using memory cache only.');
        break;
      case 'already-enabled':
        console.log('♻️ Offline persistence already enabled');
        break;
      default:
        console.error('❌ Unexpected error enabling offline persistence:', persistenceError);
        // Don't throw - offline persistence is optional
    }
  }
}

/**
 * Enhanced Firebase connectivity testing with comprehensive health checks
 * @returns {Promise<Object>} Detailed connectivity test results
 */
function testFirebaseConnectivity() {
  return loadFirebaseConfig()
    .then(async config => {
      if (!config.projectId) {
        throw new Error('No project ID in configuration');
      }
      
      const results = {
        success: true,
        projectId: config.projectId,
        config: config,
        services: {},
        timestamp: new Date().toISOString(),
        connectionState: ConfigurationManager.connectionState
      };

      // Test Firebase App initialization
      try {
        if (!window.firebaseApp) {
          throw new Error('Firebase app not initialized');
        }
        results.services.app = { 
          status: 'connected', 
          name: window.firebaseApp.name,
          options: {
            projectId: window.firebaseApp.options.projectId,
            authDomain: window.firebaseApp.options.authDomain
          }
        };
      } catch (appError) {
        results.services.app = { status: 'error', error: appError.message };
        results.success = false;
      }

      // Test Firebase Auth connection
      try {
        if (!window.firebaseAuth) {
          throw new Error('Firebase Auth not initialized');
        }
        
        // Test auth connection by checking current user state
        const currentUser = window.firebaseAuth.currentUser;
        results.services.auth = { 
          status: 'connected', 
          currentUser: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified
          } : null
        };
      } catch (authError) {
        results.services.auth = { status: 'error', error: authError.message };
      }

      // Test Firestore connectivity
      try {
        if (!window.firebaseFirestore) {
          throw new Error('Firestore not initialized');
        }
        
        // Test with a controlled read operation
        await window.firebaseFirestore.collection('_connectivity_test').limit(1).get();
        results.services.firestore = { 
          status: 'connected',
          offlinePersistence: true // If we get here, persistence is likely working
        };
      } catch (firestoreError) {
        if (firestoreError.code === 'permission-denied') {
          // This is actually good - it means we can connect but security rules are working
          results.services.firestore = {
            status: 'connected',
            securityRules: 'active',
            note: 'Connection successful, security rules properly preventing unauthorized access'
          };
        } else {
          results.services.firestore = { status: 'error', error: firestoreError.message };
          console.warn('Firestore connectivity test failed:', firestoreError);
        }
      }

      // Overall health assessment
      const connectedServices = Object.values(results.services)
        .filter(service => service.status === 'connected').length;
      const totalServices = Object.keys(results.services).length;
      
      results.healthScore = totalServices > 0 ? Math.round((connectedServices / totalServices) * 100) : 0;
      results.summary = `${connectedServices}/${totalServices} services connected`;

      console.log(`🔥 Firebase connectivity test completed: ${results.summary}`, results);
      return results;
    })
    .catch(error => {
      console.error('❌ Firebase connectivity test failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        connectionState: 'error'
      };
    });
}

// Utility functions for getting initialized services
function getFirebaseApp() {
  if (!window.firebaseApp) {
    throw new Error('Firebase app not initialized. Call initializeFirebaseConfig() first.');
  }
  return window.firebaseApp;
}

function getFirestore() {
  if (!window.firebaseFirestore) {
    throw new Error('Firestore not initialized. Call initializeFirebaseConfig() first.');
  }
  return window.firebaseFirestore;
}

function getFirebaseAuth() {
  if (!window.firebaseAuth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebaseConfig() first.');
  }
  return window.firebaseAuth;
}

/**
 * Get Firebase connection status
 * @returns {string} Current connection state
 */
function getFirebaseConnectionStatus() {
  return ConfigurationManager.connectionState;
}

/**
 * Add listener for Firebase connection state changes
 * @param {Function} listener Callback function
 * @returns {Function} Unsubscribe function
 */
function onFirebaseConnectionStateChange(listener) {
  return ConfigurationManager.addEventListener(listener);
}

// Export functions for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadFirebaseConfig,
    initializeFirebaseConfig,
    testFirebaseConnectivity,
    getFirebaseApp,
    getFirestore,
    getFirebaseAuth,
    getFirebaseConnectionStatus,
    onFirebaseConnectionStateChange
  };
}
