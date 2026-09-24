/**
 * Firebase Script Loading Deduplication Manager
 * Implements centralized script loading with proper dependency ordering
 * Prevents duplicate Firebase script inclusion and provides loading state tracking
 * Version: 1.0 - Bugfix for Task 3.1
 */

// Global flag to track Firebase libraries loading state
window.firebaseLibrariesLoaded = window.firebaseLibrariesLoaded || false;
window.firebaseScriptLoader = window.firebaseScriptLoader || {};

// Firebase version configuration
const FIREBASE_VERSION = '10.13.0';
const FIREBASE_CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

// Firebase script configuration with proper dependency ordering
const FIREBASE_SCRIPTS = [
  {
    name: 'app',
    url: `${FIREBASE_CDN_BASE}/firebase-app-compat.js`,
    dependencies: [],
    required: true
  },
  {
    name: 'auth',
    url: `${FIREBASE_CDN_BASE}/firebase-auth-compat.js`,
    dependencies: ['app'],
    required: true
  },
  {
    name: 'firestore',
    url: `${FIREBASE_CDN_BASE}/firebase-firestore-compat.js`,
    dependencies: ['app'],
    required: true
  },
  {
    name: 'storage',
    url: `${FIREBASE_CDN_BASE}/firebase-storage-compat.js`,
    dependencies: ['app'],
    required: false // Optional service
  }
];

// Script loading state tracking
const scriptLoadingState = {
  loaded: new Set(),
  loading: new Set(),
  failed: new Set(),
  
  isLoaded(scriptName) {
    return this.loaded.has(scriptName);
  },
  
  isLoading(scriptName) {
    return this.loading.has(scriptName);
  },
  
  hasFailed(scriptName) {
    return this.failed.has(scriptName);
  },
  
  markLoading(scriptName) {
    this.loading.add(scriptName);
  },
  
  markLoaded(scriptName) {
    this.loading.delete(scriptName);
    this.loaded.add(scriptName);
  },
  
  markFailed(scriptName) {
    this.loading.delete(scriptName);
    this.failed.add(scriptName);
  }
};

/**
 * Load a single Firebase script with deduplication guards
 * @param {Object} scriptConfig - Script configuration object
 * @returns {Promise<void>} - Promise that resolves when script is loaded
 */
function loadFirebaseScript(scriptConfig) {
  const { name, url } = scriptConfig;
  
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (scriptLoadingState.isLoaded(name)) {
      console.log(`♻️ Firebase ${name} script already loaded, skipping`);
      resolve();
      return;
    }
    
    // Check if script is currently loading
    if (scriptLoadingState.isLoading(name)) {
      console.log(`⏳ Firebase ${name} script already loading, waiting...`);
      
      // Wait for the ongoing load to complete
      const checkInterval = setInterval(() => {
        if (scriptLoadingState.isLoaded(name)) {
          clearInterval(checkInterval);
          resolve();
        } else if (scriptLoadingState.hasFailed(name)) {
          clearInterval(checkInterval);
          reject(new Error(`Firebase ${name} script failed to load`));
        }
      }, 100);
      return;
    }
    
    // Check if script has previously failed
    if (scriptLoadingState.hasFailed(name)) {
      console.warn(`⚠️ Firebase ${name} script previously failed, retrying...`);
      scriptLoadingState.failed.delete(name);
    }
    
    console.log(`📦 Loading Firebase ${name} script from: ${url}`);
    scriptLoadingState.markLoading(name);
    
    // Create script element
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // Handle successful loading
    script.onload = () => {
      scriptLoadingState.markLoaded(name);
      console.log(`✅ Firebase ${name} script loaded successfully`);
      resolve();
    };
    
    // Handle loading errors
    script.onerror = (error) => {
      scriptLoadingState.markFailed(name);
      console.error(`❌ Failed to load Firebase ${name} script:`, error);
      reject(new Error(`Failed to load Firebase ${name} script from ${url}`));
    };
    
    // Add script to document head
    document.head.appendChild(script);
  });
}

/**
 * Check if all dependencies for a script are loaded
 * @param {Array<string>} dependencies - Array of dependency script names
 * @returns {boolean} - True if all dependencies are loaded
 */
function checkDependencies(dependencies) {
  return dependencies.every(dep => scriptLoadingState.isLoaded(dep));
}

/**
 * Wait for dependencies to load
 * @param {Array<string>} dependencies - Array of dependency script names
 * @returns {Promise<void>} - Promise that resolves when all dependencies are loaded
 */
function waitForDependencies(dependencies) {
  return new Promise((resolve, reject) => {
    if (checkDependencies(dependencies)) {
      resolve();
      return;
    }
    
    console.log(`⏳ Waiting for dependencies: ${dependencies.join(', ')}`);
    
    const checkInterval = setInterval(() => {
      if (checkDependencies(dependencies)) {
        clearInterval(checkInterval);
        resolve();
      } else {
        // Check if any dependency has failed
        const failedDeps = dependencies.filter(dep => scriptLoadingState.hasFailed(dep));
        if (failedDeps.length > 0) {
          clearInterval(checkInterval);
          reject(new Error(`Dependencies failed to load: ${failedDeps.join(', ')}`));
        }
      }
    }, 100);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`));
    }, 30000);
  });
}

/**
 * Load Firebase scripts in correct dependency order
 * @param {Array<string>} requiredScripts - Optional array of specific scripts to load
 * @returns {Promise<Object>} - Promise that resolves with loading results
 */
async function loadFirebaseScripts(requiredScripts = null) {
  // Check if Firebase libraries are already fully loaded
  if (window.firebaseLibrariesLoaded) {
    console.log('♻️ Firebase libraries already loaded, skipping script loading');
    return { success: true, message: 'Scripts already loaded', scriptsLoaded: Array.from(scriptLoadingState.loaded) };
  }
  
  console.log('🔥 Starting Firebase script loading process...');
  
  // Determine which scripts to load
  const scriptsToLoad = requiredScripts 
    ? FIREBASE_SCRIPTS.filter(script => requiredScripts.includes(script.name))
    : FIREBASE_SCRIPTS.filter(script => script.required);
  
  const loadingResults = {
    success: true,
    scriptsLoaded: [],
    scriptsFailed: [],
    totalScripts: scriptsToLoad.length,
    startTime: Date.now()
  };
  
  try {
    // Load scripts in dependency order
    for (const scriptConfig of scriptsToLoad) {
      try {
        // Wait for dependencies first
        if (scriptConfig.dependencies.length > 0) {
          await waitForDependencies(scriptConfig.dependencies);
        }
        
        // Load the script
        await loadFirebaseScript(scriptConfig);
        loadingResults.scriptsLoaded.push(scriptConfig.name);
        
      } catch (error) {
        console.error(`❌ Failed to load Firebase ${scriptConfig.name}:`, error.message);
        loadingResults.scriptsFailed.push({
          name: scriptConfig.name,
          error: error.message
        });
        
        // If a required script fails, mark overall loading as failed
        if (scriptConfig.required) {
          loadingResults.success = false;
        }
      }
    }
    
    // Mark Firebase libraries as loaded if all required scripts succeeded
    if (loadingResults.success) {
      window.firebaseLibrariesLoaded = true;
      console.log(`🎉 Firebase script loading completed successfully in ${Date.now() - loadingResults.startTime}ms`);
      console.log(`📊 Scripts loaded: ${loadingResults.scriptsLoaded.join(', ')}`);
    } else {
      console.error('❌ Firebase script loading failed - some required scripts could not be loaded');
    }
    
  } catch (error) {
    loadingResults.success = false;
    loadingResults.error = error.message;
    console.error('❌ Firebase script loading process failed:', error);
  }
  
  loadingResults.endTime = Date.now();
  loadingResults.duration = loadingResults.endTime - loadingResults.startTime;
  
  return loadingResults;
}

/**
 * Get the current Firebase script loading state
 * @returns {Object} - Current loading state
 */
function getLoadingState() {
  return {
    librariesLoaded: window.firebaseLibrariesLoaded,
    loaded: Array.from(scriptLoadingState.loaded),
    loading: Array.from(scriptLoadingState.loading),
    failed: Array.from(scriptLoadingState.failed),
    totalScripts: FIREBASE_SCRIPTS.length,
    requiredScripts: FIREBASE_SCRIPTS.filter(s => s.required).map(s => s.name)
  };
}

/**
 * Reset the Firebase script loading state (for testing/development)
 * WARNING: This should only be used in development environments
 */
function resetLoadingState() {
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.warn('🔄 Resetting Firebase script loading state (development only)');
    window.firebaseLibrariesLoaded = false;
    scriptLoadingState.loaded.clear();
    scriptLoadingState.loading.clear();
    scriptLoadingState.failed.clear();
  } else {
    console.error('❌ resetLoadingState() can only be called in development environments');
  }
}

// Expose functions to global scope
window.firebaseScriptLoader = {
  loadFirebaseScripts,
  getLoadingState,
  resetLoadingState,
  isLoaded: () => window.firebaseLibrariesLoaded
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadFirebaseScripts,
    getLoadingState,
    resetLoadingState
  };
}

console.log('📦 Firebase Script Loader initialized');