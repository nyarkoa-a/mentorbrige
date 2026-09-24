/* Firebase Service Management Module
 * Enhanced service layer for Firebase integration with comprehensive error handling
 * Version: 2.0 - Production ready with advanced features
 */

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.initPromise = null;
    this.connectionStatus = 'disconnected';
    this.listeners = new Set();
    this.connectionMonitor = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Service state tracking
    this.serviceState = {
      app: false,
      auth: false,
      firestore: false,
      storage: false,
      analytics: false
    };
    
    // Bind methods to preserve 'this' context
    this._handleConnectionStateChange = this._handleConnectionStateChange.bind(this);
    this._performHealthCheck = this._performHealthCheck.bind(this);
  }

  /**
   * Initialize Firebase services with enhanced error handling and retry logic
   * @returns {Promise<FirebaseService>} Initialized Firebase service instance
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitializationWithRetry();
    return this.initPromise;
  }

  /**
   * Perform initialization with automatic retry logic
   * @returns {Promise<FirebaseService>} Service instance
   */
  async _performInitializationWithRetry() {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this._performInitialization();
      } catch (error) {
        console.warn(`Firebase initialization attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          this.connectionStatus = 'error';
          this._notifyConnectionStatusChange('error', { error: error.message });
          throw new Error(`Firebase initialization failed after ${this.maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Exponential backoff for retries
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying Firebase initialization in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Core initialization logic with comprehensive service setup
   * @returns {Promise<FirebaseService>} Service instance
   */
  async _performInitialization() {
    try {
      this._notifyConnectionStatusChange('connecting');
      
      // Load and initialize Firebase configuration
      const config = await initializeFirebaseConfig();
      console.log('🔥 Firebase configuration loaded, initializing services...');
      
      // Verify Firebase SDK availability
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please include Firebase scripts.');
      }

      // Get initialized Firebase services from firebase-config.js
      this.auth = getFirebaseAuth();
      this.db = getFirestore();
      
      // Verify services are properly initialized
      if (!this.auth || !this.db) {
        throw new Error('Firebase services not properly initialized by firebase-config.js');
      }

      // Update service state tracking
      this.serviceState.app = !!window.firebaseApp;
      this.serviceState.auth = !!this.auth;
      this.serviceState.firestore = !!this.db;
      
      // Configure Firestore-specific settings
      await this._configureFirestoreSettings();

      // Initialize Firebase Storage if needed
      try {
        if (firebase.storage) {
          this.storage = firebase.storage();
          this.serviceState.storage = true;
          console.log('✅ Firebase Storage initialized');
        } else {
          console.warn('⚠️ Firebase Storage script not loaded - storage functionality unavailable');
          this.serviceState.storage = false;
        }
      } catch (storageError) {
        console.warn('⚠️ Firebase Storage initialization failed:', storageError.message);
        this.serviceState.storage = false;
      }

      // Initialize Firebase Analytics if available
      try {
        if (firebase.analytics && config.measurementId) {
          firebase.analytics();
          this.serviceState.analytics = true;
          console.log('📊 Firebase Analytics initialized');
        }
      } catch (analyticsError) {
        console.warn('⚠️ Firebase Analytics initialization failed:', analyticsError.message);
      }

      // Set up authentication state listener
      this._setupAuthStateListener();

      // Set up connection monitoring
      this._setupConnectionMonitoring();

      this.initialized = true;
      this.connectionStatus = 'connected';
      
      console.log('🎉 Firebase services initialized successfully');
      console.log('Service states:', this.serviceState);
      
      this._notifyConnectionStatusChange('connected', { 
        services: this.serviceState,
        config: config 
      });
      
      return this;

    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.connectionStatus = 'error';
      this._notifyConnectionStatusChange('error', { error: error.message });
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * Configure Firestore-specific settings and optimizations
   * @returns {Promise<void>}
   */
  async _configureFirestoreSettings() {
    if (!this.db) {
      console.warn('⚠️ Cannot configure Firestore: not initialized');
      return;
    }

    try {
      // Enable network first for better real-time performance
      await this.db.enableNetwork();
      console.log('🌐 Firestore network enabled');
    } catch (networkError) {
      console.warn('⚠️ Firestore network enable failed:', networkError.message);
    }
  }

  /**
   * Set up Firebase Auth state listener for automatic user session management
   */
  _setupAuthStateListener() {
    if (!this.auth) {
      console.warn('⚠️ Cannot setup auth listener: Firebase Auth not initialized');
      return;
    }

    this.auth.onAuthStateChanged((user) => {
      const authEvent = {
        type: 'auth_state_changed',
        user: user ? {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        } : null
      };
      
      this._notifyConnectionStatusChange(user ? 'authenticated' : 'unauthenticated', authEvent);
      console.log('👤 Auth state changed:', user ? `Logged in: ${user.email}` : 'Logged out');
    });
  }

  /**
   * Set up comprehensive connection monitoring with health checks
   */
  _setupConnectionMonitoring() {
    if (!this.db) {
      console.warn('⚠️ Cannot setup connection monitoring: Firestore not initialized');
      return;
    }

    // Listen to connection state changes from firebase-config.js
    if (typeof onFirebaseConnectionStateChange === 'function') {
      onFirebaseConnectionStateChange(this._handleConnectionStateChange);
    }

    // Periodic health check with exponential backoff on failures
    this.connectionMonitor = setInterval(this._performHealthCheck, 30000);
    
    console.log('🔍 Connection monitoring enabled');
  }

  /**
   * Handle connection state changes from firebase-config.js
   * @param {Object} event Connection state event
   */
  _handleConnectionStateChange(event) {
    if (event.state === 'connected' && this.connectionStatus !== 'connected') {
      this.connectionStatus = 'connected';
      this._notifyConnectionStatusChange('connected', event);
    } else if (event.state === 'error') {
      this.connectionStatus = 'error';
      this._notifyConnectionStatusChange('error', event);
    }
  }

  /**
   * Perform comprehensive health check on Firebase services
   * @returns {Promise<void>}
   */
  async _performHealthCheck() {
    if (!this.initialized) return;

    try {
      // Test Firestore connectivity with minimal read operation
      const healthRef = this.db.collection('_health').doc('check');
      await healthRef.get();
      
      if (this.connectionStatus !== 'connected') {
        this.connectionStatus = 'connected';
        this._notifyConnectionStatusChange('connected', { 
          type: 'health_check_success',
          timestamp: new Date().toISOString()
        });
      }
      
      // Reset retry count on successful health check
      this.retryCount = 0;
      
    } catch (error) {
      console.warn('🔍 Health check failed:', error.message);
      
      // Don't immediately mark as disconnected for permission errors
      if (error.code !== 'permission-denied') {
        if (this.connectionStatus !== 'disconnected') {
          this.connectionStatus = 'disconnected';
          this._notifyConnectionStatusChange('disconnected', { 
            type: 'health_check_failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  /**
   * Get Firebase Auth instance with initialization check
   * @returns {firebase.auth.Auth} Firebase Auth instance
   */
  getAuth() {
    if (!this.initialized) {
      throw new Error('Firebase service not initialized. Call initialize() first.');
    }
    if (!this.auth) {
      throw new Error('Firebase Auth not available. Check initialization.');
    }
    return this.auth;
  }

  /**
   * Get Firestore database instance with initialization check
   * @returns {firebase.firestore.Firestore} Firestore instance
   */
  getDb() {
    if (!this.initialized) {
      throw new Error('Firebase service not initialized. Call initialize() first.');
    }
    if (!this.db) {
      throw new Error('Firebase Firestore not available. Check initialization.');
    }
    return this.db;
  }

  /**
   * Get Firebase Storage instance with better error handling
   * @returns {firebase.storage.Storage} Storage instance
   */
  getStorage() {
    if (!this.initialized) {
      throw new Error('Firebase service not initialized. Call initialize() first.');
    }
    if (!this.storage) {
      if (!firebase.storage) {
        throw new Error('Firebase Storage not available. Storage script not loaded. Include firebase-storage-compat.js script.');
      } else {
        throw new Error('Firebase Storage not initialized. Check initialization process.');
      }
    }
    return this.storage;
  }

  /**
   * Get connection status with detailed state information
   * @returns {Object} Connection status object
   */
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      initialized: this.initialized,
      services: { ...this.serviceState },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if Firebase is properly initialized with all required services
   * @returns {Object} Detailed initialization status
   */
  isInitialized() {
    return {
      initialized: this.initialized,
      services: { ...this.serviceState },
      requiredServices: ['app', 'auth', 'firestore'],
      allRequiredAvailable: this.serviceState.app && this.serviceState.auth && this.serviceState.firestore
    };
  }

  /**
   * Add connection status listener with enhanced event details
   * @param {Function} callback Callback function to call on status change
   * @returns {Function} Unsubscribe function
   */
  onConnectionStatusChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.listeners.add(callback);
    
    // Immediately notify with current status
    callback({
      status: this.connectionStatus,
      services: { ...this.serviceState },
      initialized: this.initialized,
      type: 'initial_status'
    });
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Enhanced notification system for connection status changes
   * @param {string} status New connection status
   * @param {Object} additionalData Additional event data
   */
  _notifyConnectionStatusChange(status, additionalData = {}) {
    const eventData = {
      status,
      previousStatus: this.connectionStatus,
      services: { ...this.serviceState },
      initialized: this.initialized,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    this.listeners.forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error('❌ Error in connection status listener:', error);
      }
    });
  }

  /**
   * Enhanced Firebase connectivity test with detailed service analysis
   * @returns {Promise<Object>} Comprehensive connectivity test results
   */
  async testConnection() {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Firebase service not initialized',
        services: this.serviceState
      };
    }

    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {},
      overallHealth: 'unknown'
    };

    // Test Firebase App
    try {
      const app = getFirebaseApp();
      testResults.services.app = {
        status: 'connected',
        name: app.name,
        projectId: app.options.projectId
      };
    } catch (appError) {
      testResults.services.app = { status: 'error', error: appError.message };
      testResults.success = false;
    }

    // Test Firebase Auth
    try {
      if (this.auth) {
        const currentUser = this.auth.currentUser;
        testResults.services.auth = {
          status: 'connected',
          currentUser: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified
          } : null
        };
      } else {
        throw new Error('Auth service not initialized');
      }
    } catch (authError) {
      testResults.services.auth = { status: 'error', error: authError.message };
    }

    // Test Firestore with actual connectivity check
    try {
      if (this.db) {
        // Use serverTimestamp to ensure we're actually connecting to server
        const testDoc = {
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          test: true
        };
        
        // Try to write to a test collection (will fail with permission-denied if rules are working)
        try {
          await this.db.collection('_connection_test').add(testDoc);
          testResults.services.firestore = {
            status: 'connected',
            writeAccess: true,
            note: 'Full access - check security rules'
          };
        } catch (writeError) {
          if (writeError.code === 'permission-denied') {
            // This is actually good - security rules are working
            testResults.services.firestore = {
              status: 'connected',
              writeAccess: false,
              securityRules: 'active',
              note: 'Connection successful, security rules active'
            };
          } else {
            throw writeError;
          }
        }
      } else {
        throw new Error('Firestore service not initialized');
      }
    } catch (firestoreError) {
      testResults.services.firestore = { status: 'error', error: firestoreError.message };
      testResults.success = false;
    }

    // Calculate overall health score
    const connectedServices = Object.values(testResults.services)
      .filter(service => service.status === 'connected').length;
    const totalServices = Object.keys(testResults.services).length;
    
    if (totalServices > 0) {
      const healthScore = Math.round((connectedServices / totalServices) * 100);
      testResults.healthScore = healthScore;
      testResults.overallHealth = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'fair' : 'poor';
    }

    console.log(`🔍 Firebase connection test completed: ${connectedServices}/${totalServices} services connected`, testResults);
    return testResults;
  }

  /**
   * Perform graceful cleanup of resources and listeners
   */
  cleanup() {
    console.log('🧹 Cleaning up Firebase service...');
    
    // Clear connection monitor
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }
    
    // Clear all listeners
    this.listeners.clear();
    
    // Reset state
    this.initialized = false;
    this.connectionStatus = 'disconnected';
    this.serviceState = {
      app: false,
      auth: false,
      firestore: false,
      storage: false,
      analytics: false
    };
    
    console.log('✅ Firebase service cleanup completed');
  }

  /**
   * Reinitialize Firebase service (useful after cleanup or errors)
   * @returns {Promise<FirebaseService>} Reinitialized service instance
   */
  async reinitialize() {
    console.log('🔄 Reinitializing Firebase service...');
    
    // Clean up current state
    this.cleanup();
    
    // Reset promises
    this.initPromise = null;
    
    // Reinitialize
    return this.initialize();
  }
}

// Create global Firebase service instance
window.firebaseService = new FirebaseService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseService;
}