/**
 * Firebase Initialization Manager - Centralized coordination for all Firebase services
 * Coordinates script loading, configuration, and service initialization
 * Version: 1.0 - Bugfix for Firebase initialization issues
 */

/**
 * Centralized Firebase Initialization Manager
 * Singleton class that coordinates all Firebase initialization activities
 */
class FirebaseInitializationManager {
  constructor() {
    if (FirebaseInitializationManager.instance) {
      return FirebaseInitializationManager.instance;
    }

    this.initialized = false;
    this.initializationPromise = null;
    this.initializationState = {
      scriptsLoaded: false,
      configLoaded: false,
      servicesInitialized: false,
      authInitialized: false,
      uiIntegrationInitialized: false
    };
    
    this.listeners = new Set();
    this.retryCount = 0;
    this.maxRetries = 3;
    
    
    FirebaseInitializationManager.instance = this;
  }

  /**
   * Initialize all Firebase components in correct order
   * @param {Object} options - Initialization options
   * @returns {Promise<FirebaseInitializationManager>}
   */
  async initialize(options = {}) {
    if (this.initialized) {
      console.log('♻️ Firebase Manager already initialized');
      return this;
    }

    if (this.initializationPromise) {
      console.log('⏳ Firebase Manager initialization already in progress');
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization(options);
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization with proper error handling
   * @param {Object} options - Initialization options
   * @returns {Promise<FirebaseInitializationManager>}
   */
  async _performInitialization(options) {
    try {
      console.log('🔥 Starting Firebase Manager initialization...');
      this._notifyStateChange('initializing', { phase: 'starting' });

      // Phase 1: Load Firebase Scripts (if needed)
      await this._initializeScripts(options);
      
      // Phase 2: Load Firebase Configuration
      await this._initializeConfiguration();
      
      // Phase 3: Initialize Firebase Services
      await this._initializeServices();
      
      // Phase 4: Initialize Authentication
      await this._initializeAuthentication();
      
      // Phase 5: Initialize UI Integration (if requested)
      if (options.initializeUI !== false) {
        await this._initializeUIIntegration();
      }

      this.initialized = true;
      console.log('🎉 Firebase Manager initialization completed successfully');
      this._notifyStateChange('initialized', { 
        state: this.initializationState,
        timestamp: new Date().toISOString()
      });
      
      return this;

    } catch (error) {
      console.error('❌ Firebase Manager initialization failed:', error);
      this._notifyStateChange('error', { 
        error: error.message,
        phase: 'initialization',
        retryCount: this.retryCount
      });
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount - 1) * 1000; // Exponential backoff
        
        console.warn(`Retrying Firebase initialization in ${delay}ms (attempt ${this.retryCount + 1}/${this.maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset promise to allow retry
        this.initializationPromise = null;
        return this.initialize(options);
      }
      
      throw new Error(`Firebase Manager initialization failed after ${this.maxRetries + 1} attempts: ${error.message}`);
    }
  }

  /**
   * Initialize Firebase Scripts
   * @param {Object} options - Script loading options
   */
  async _initializeScripts(options) {
    if (this.initializationState.scriptsLoaded || window.firebaseLibrariesLoaded) {
      console.log('♻️ Firebase scripts already loaded');
      this.initializationState.scriptsLoaded = true;
      return;
    }

    console.log('📦 Loading Firebase scripts...');
    this._notifyStateChange('loading_scripts', { phase: 'scripts' });

    if (window.firebaseScriptLoader) {
      const scriptServices = options.services || ['app', 'auth', 'firestore', 'storage'];
      const result = await window.firebaseScriptLoader.loadFirebaseScripts(scriptServices);
      
      if (result.success) {
        this.initializationState.scriptsLoaded = true;
        console.log('✅ Firebase scripts loaded successfully');
      } else {
        throw new Error(`Script loading failed: ${result.scriptsFailed.map(f => f.name).join(', ')}`);
      }
    } else {
      // Scripts loaded via HTML - just verify they're available
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not available. Scripts not loaded properly.');
      }
      this.initializationState.scriptsLoaded = true;
      console.log('✅ Firebase scripts verified');
    }
  }

  /**
   * Initialize Firebase Configuration
   */
  async _initializeConfiguration() {
    if (this.initializationState.configLoaded) {
      console.log('♻️ Firebase config already loaded');
      return;
    }

    console.log('⚙️ Loading Firebase configuration...');
    this._notifyStateChange('loading_config', { phase: 'configuration' });

    if (typeof initializeFirebaseConfig !== 'function') {
      throw new Error('initializeFirebaseConfig function not available');
    }

    await initializeFirebaseConfig();
    this.initializationState.configLoaded = true;
    console.log('✅ Firebase configuration loaded');
  }

  /**
   * Initialize Firebase Services
   */
  async _initializeServices() {
    if (this.initializationState.servicesInitialized) {
      console.log('♻️ Firebase services already initialized');
      return;
    }

    console.log('🔧 Initializing Firebase services...');
    this._notifyStateChange('loading_services', { phase: 'services' });

    if (!window.firebaseService) {
      throw new Error('Firebase service not available');
    }

    await window.firebaseService.initialize();
    this.initializationState.servicesInitialized = true;
    console.log('✅ Firebase services initialized');
  }

  /**
   * Initialize Firebase Authentication
   */
  async _initializeAuthentication() {
    if (this.initializationState.authInitialized) {
      console.log('♻️ Firebase auth already initialized');
      return;
    }

    console.log('🔐 Initializing Firebase authentication...');
    this._notifyStateChange('loading_auth', { phase: 'authentication' });

    if (window.mentorBridgeAuth && typeof window.mentorBridgeAuth.initialize === 'function') {
      await window.mentorBridgeAuth.initialize();
      this.initializationState.authInitialized = true;
      console.log('✅ Firebase authentication initialized');
    } else {
      console.warn('⚠️ MentorBridge Auth not available, skipping auth initialization');
    }
  }

  /**
   * Initialize UI Integration
   */
  async _initializeUIIntegration() {
    if (this.initializationState.uiIntegrationInitialized || window.authUIIntegrationInitialized) {
      console.log('♻️ UI integration already initialized');
      this.initializationState.uiIntegrationInitialized = true;
      return;
    }

    console.log('🔗 Initializing UI integration...');
    this._notifyStateChange('loading_ui', { phase: 'ui_integration' });

    if (window.authUIIntegration && typeof window.authUIIntegration.initialize === 'function') {
      await window.authUIIntegration.initialize();
      this.initializationState.uiIntegrationInitialized = true;
      window.authUIIntegrationInitialized = true;
      console.log('✅ UI integration initialized');
    } else {
      console.warn('⚠️ Auth UI Integration not available, skipping UI initialization');
    }
  }

  /**
   * Get current initialization status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      initializationState: { ...this.initializationState },
      retryCount: this.retryCount,
      isInitializing: !!this.initializationPromise && !this.initialized
    };
  }

  /**
   * Check if all components are ready
   * @returns {boolean} True if all components are initialized
   */
  isReady() {
    return this.initialized && 
           this.initializationState.scriptsLoaded &&
           this.initializationState.configLoaded &&
           this.initializationState.servicesInitialized;
  }

  /**
   * Add state change listener
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  onStateChange(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.listeners.add(listener);

    // Immediately notify with current state
    listener({
      type: 'current_state',
      initialized: this.initialized,
      state: { ...this.initializationState },
      timestamp: new Date().toISOString()
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  _notifyStateChange(type, data = {}) {
    const event = {
      type,
      initialized: this.initialized,
      state: { ...this.initializationState },
      timestamp: new Date().toISOString(),
      ...data
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in Firebase Manager state listener:', error);
      }
    });
  }

  /**
   * Reinitialize the Firebase Manager
   * @param {Object} options - Initialization options
   * @returns {Promise<FirebaseInitializationManager>}
   */
  async reinitialize(options = {}) {
    console.log('🔄 Reinitializing Firebase Manager...');
    
    // Reset state
    this.initialized = false;
    this.initializationPromise = null;
    this.initializationState = {
      scriptsLoaded: false,
      configLoaded: false,
      servicesInitialized: false,
      authInitialized: false,
      uiIntegrationInitialized: false
    };
    this.retryCount = 0;

    // Clear global state flags
    window.firebaseLibrariesLoaded = false;
    window.authUIIntegrationInitialized = false;

    // Reinitialize
    return this.initialize(options);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('🧹 Cleaning up Firebase Manager...');
    
    this.listeners.clear();
    this.initialized = false;
    this.initializationPromise = null;
    
    // Cleanup services
    if (window.firebaseService && typeof window.firebaseService.cleanup === 'function') {
      window.firebaseService.cleanup();
    }

    this._notifyStateChange('cleanup');
  }
}

// Create and expose global instance
const firebaseManager = new FirebaseInitializationManager();
window.firebaseManager = firebaseManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FirebaseInitializationManager,
    firebaseManager
  };
}

console.log('📦 Firebase Initialization Manager loaded');