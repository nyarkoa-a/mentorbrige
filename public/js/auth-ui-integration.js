/* MentorBridge Authentication UI Integration Service
 * Handles real-time authentication state synchronization with UI elements
 * Version: 1.0 - Complete Firebase Auth integration with loading states
 */

/**
 * Authentication UI Integration Service
 * Manages UI updates, navigation changes, and loading states based on auth state
 */
class AuthUIIntegrationService {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.userProfile = null;
    this.authState = 'unknown'; // 'unknown', 'authenticated', 'unauthenticated', 'loading'
    this.loadingStates = new Map(); // Track loading states for different operations
    this.uiElements = new Map(); // Cache UI elements for performance
    this.roleBasedElements = new Map(); // Track elements that change based on user role
    this.navigationItems = new Map(); // Track navigation items and their permissions
    
    // Notification queue management with enhanced interface
    this.notificationQueue = [];
    this.maxNotifications = 3;
    this.notificationCounter = 0;
    this.persistentNotifications = new Set(); // Track persistent notifications
    this._shouldClearPersistent = false; // Flag for persistent clearing
    
    // NotificationMessage interface implementation
    this.NotificationMessage = {
      createNotification: (type, content, actions = [], persistent = false) => ({
        id: `notification-${++this.notificationCounter}`,
        type: type, // 'success' | 'error' | 'warning' | 'info'
        content: content, // string | HTMLElement
        actions: actions, // UIAction[]
        persistent: persistent, // boolean
        timestamp: new Date()
      })
    };
    
    // Redirect configuration for post-authentication
    this.redirectConfig = {
      student: '/pages/student-dashboard.html',
      mentor: '/pages/mentor-dashboard.html', 
      admin: '/admin/dashboard',
      default: '/pages/student-dashboard.html'
    };
    
    // Guard to prevent duplicate redirect timers
    this._redirectScheduled = false;
    
    // Configuration for different authentication operations
    this.operationConfig = {
      login: { loadingText: 'Signing in...', successMessage: 'Welcome back!' },
      register: { loadingText: 'Creating account...', successMessage: 'Account created successfully!' },
      logout: { loadingText: 'Signing out...', successMessage: 'Signed out successfully' },
      passwordReset: { loadingText: 'Sending reset email...', successMessage: 'Reset email sent!' },
      profileUpdate: { loadingText: 'Updating profile...', successMessage: 'Profile updated!' }
    };
    
    // Bind methods to preserve context
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
    this.updateNavigationForRole = this.updateNavigationForRole.bind(this);
    
    // Setup notification cleanup system
    this._setupNotificationCleanup();
  }

  /**
   * Initialize the authentication UI integration service
   * @returns {Promise<AuthUIIntegrationService>}
   */
  async initialize() {
    if (this.initialized) {
      console.log('♻️ Auth UI Integration already initialized, skipping');
      return this;
    }

    // Additional global deduplication check
    if (window.authUIIntegrationInitialized) {
      console.log('♻️ Auth UI Integration already initialized globally, skipping');
      this.initialized = true;
      return this;
    }

    try {
      console.log('🔗 Initializing Authentication UI Integration...');

      // Wait for Firebase Manager to be ready first
      if (window.firebaseManager) {
        let attempts = 0;
        const maxAttempts = 25; // Wait up to 5 seconds
        
        while (!window.firebaseManager.isReady() && attempts < maxAttempts) {
          console.log('⏳ Waiting for Firebase Manager to be ready...');
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
        
        if (!window.firebaseManager.isReady()) {
          console.warn('⚠️ Firebase Manager not ready, continuing anyway');
        }
      }

      // Wait for auth service to be initialized
      if (!window.mentorBridgeAuth || !window.mentorBridgeAuth.initialized) {
        console.log('⏳ Waiting for MentorBridge Auth to initialize...');
        await window.mentorBridgeAuth.initialize();
      }

      // Set up UI element caches
      this.cacheUIElements();
      
      // Configure navigation permissions
      this.setupNavigationRules();
      
      // Set up auth state listener
      this.setupAuthStateListener();
      
      // Handle initial page load authentication check
      await this.handleInitialAuthCheck();

      this.initialized = true;
      window.authUIIntegrationInitialized = true;
      console.log('✅ Authentication UI Integration initialized successfully');

      return this;

    } catch (error) {
      console.error('❌ Failed to initialize Authentication UI Integration:', error);
      throw new Error(`Authentication UI Integration initialization failed: ${error.message}`);
    }
  }
  /**
   * Cache UI elements for performance optimization
   */
  cacheUIElements() {
    // Navigation elements
    this.uiElements.set('nav-auth-buttons', document.querySelectorAll('.nav-actions .btn'));
    this.uiElements.set('login-button', document.querySelector('.btn[href*="auth"]'));
    this.uiElements.set('register-button', document.querySelector('.btn[href*="register"]'));
    
    // User profile elements (dashboard pages)
    this.uiElements.set('user-avatar', document.querySelector('.db-user-avatar, .db-header-avatar'));
    this.uiElements.set('user-name', document.querySelector('.db-user-info strong'));
    this.uiElements.set('user-role', document.querySelector('.db-user-info span'));
    this.uiElements.set('welcome-message', document.querySelector('.db-welcome h1'));
    this.uiElements.set('logout-button', document.querySelector('.db-logout-btn'));
    
    // Loading and message elements
    this.uiElements.set('auth-message', document.getElementById('authMessage'));
    this.uiElements.set('loading-overlay', document.querySelector('.auth-loading-overlay'));
    this.uiElements.set('auth-notifications-container', document.getElementById('authNotificationsContainer'));
    
    // Notification elements
    this.uiElements.set('notification-badge', document.querySelector('.db-notif-dot'));
    this.uiElements.set('notification-count', document.querySelector('.db-nav-badge'));
    
    // Form elements (auth pages)
    this.uiElements.set('auth-forms', document.querySelectorAll('.auth-panel form'));
    this.uiElements.set('auth-buttons', document.querySelectorAll('.btn[id^="btn"]'));
    
    console.log('📋 UI elements cached:', this.uiElements.size);
  }

  /**
   * Setup navigation rules and permissions for different user roles
   */
  setupNavigationRules() {
    // Define which navigation items are available for each role
    this.navigationItems.set('dashboard', {
      student: '/pages/student-dashboard.html',
      mentor: '/pages/mentor-dashboard.html', 
      admin: '/admin/dashboard',
      guest: null
    });
    
    this.navigationItems.set('messages', {
      student: '/pages/messages.html',
      mentor: '/pages/messages.html',
      admin: '/pages/messages.html',
      guest: null
    });
    
    this.navigationItems.set('sessions', {
      student: '/pages/sessions.html',
      mentor: '/pages/sessions.html',
      admin: '/pages/sessions.html',
      guest: null
    });
    
    this.navigationItems.set('profile', {
      student: '/pages/student-profile.html',
      mentor: '/pages/mentor-profile.html',
      admin: '/pages/settings.html',
      guest: null
    });
    
    this.navigationItems.set('settings', {
      student: '/pages/settings.html',
      mentor: '/pages/settings.html',
      admin: '/pages/settings.html',
      guest: null
    });
    
    console.log('🗺️ Navigation rules configured for roles:', Array.from(this.navigationItems.keys()));
  }
  /**
   * Set up Firebase Auth state listener
   */
  setupAuthStateListener() {
    if (!window.mentorBridgeAuth) {
      throw new Error('MentorBridge Auth service not available');
    }

    // Listen to auth state changes
    window.mentorBridgeAuth.onAuthStateChanged((authEvent) => {
      this.handleAuthStateChange(authEvent);
    });

    console.log('👂 Auth state listener configured');
  }

  /**
   * Handle authentication state changes
   * @param {Object} authEvent - Authentication event data
   */
  async handleAuthStateChange(authEvent) {
    const { user, profile, previousUser } = authEvent;
    
    console.log('🔄 Auth state change:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      userEmail: user?.email,
      userRole: profile?.role 
    });

    // Update internal state
    const wasAuthenticated = this.authState === 'authenticated';
    this.currentUser = user;
    this.userProfile = profile;
    
    if (user && profile) {
      this.authState = 'authenticated';
    } else if (user && !profile) {
      // Profile is missing even after firebase-auth.js retries.
      // Attempt one more Firestore fetch here before giving up.
      this.authState = 'loading';
      await this.updateUIForAuthState();
      try {
        const profileDoc = await window.mentorBridgeAuth.db
          .collection('users').doc(user.uid).get();
        if (profileDoc.exists) {
          this.userProfile = { uid: user.uid, ...profileDoc.data() };
          window.mentorBridgeAuth.userProfile = this.userProfile;
          this.authState = 'authenticated';
          console.log('✅ Profile recovered in auth-ui-integration');
        } else {
          // Newly registered user whose profile write hasn't propagated yet —
          // still redirect to the default dashboard so they aren't stuck.
          console.warn('⚠️ Profile document missing — using fallback redirect');
          this.authState = 'authenticated';
          this.userProfile = { uid: user.uid, role: 'student' }; // safe default
        }
      } catch (fetchError) {
        console.warn('⚠️ Profile recovery failed:', fetchError.message);
        // Use a safe default so the redirect still fires
        this.authState = 'authenticated';
        this.userProfile = { uid: user.uid, role: 'student' };
      }
    } else {
      this.authState = 'unauthenticated';
    }

    // Update UI immediately
    await this.updateUIForAuthState();
    
    // Handle specific state transitions
    if (!wasAuthenticated && this.authState === 'authenticated') {
      await this.handleUserSignIn();
    } else if (wasAuthenticated && this.authState === 'unauthenticated') {
      await this.handleUserSignOut();
    }

    // Clear any loading states
    this.clearOperationLoading();
  }

  /**
   * Handle initial authentication check on page load
   */
  async handleInitialAuthCheck() {
    this.setAuthState('loading');
    
    try {
      // Firebase auth state will be handled by the auth state listener
      // Just update UI for loading state initially
      await this.updateUIForAuthState();
      
    } catch (error) {
      console.error('❌ Initial auth check failed:', error);
      this.setAuthState('unauthenticated');
      await this.updateUIForAuthState();
    }
  }

  /**
   * Update UI elements based on current authentication state
   */
  async updateUIForAuthState() {
    switch (this.authState) {
      case 'loading':
        this.updateUIForLoading();
        break;
      case 'authenticated':
        await this.updateUIForAuthenticated();
        break;
      case 'unauthenticated':
        this.updateUIForUnauthenticated();
        break;
      default:
        console.warn('Unknown auth state:', this.authState);
    }
  }
  /**
   * Update UI for loading state
   */
  updateUIForLoading() {
    // Show loading indicators
    this.showLoadingState('Checking authentication...');
    
    // Disable interactive elements
    this.setElementsDisabled(this.uiElements.get('auth-buttons'), true);
    
    // Hide user-specific elements until auth is determined
    this.hideUserSpecificElements();
  }

  /**
   * Update UI for authenticated state
   */
  async updateUIForAuthenticated() {
    if (!this.currentUser || !this.userProfile) {
      return;
    }

    // Update user information in UI
    this.updateUserDisplayInfo();
    
    // Update navigation based on user role
    this.updateNavigationForRole(this.userProfile.role);
    
    // Show user-specific elements
    this.showUserSpecificElements();
    
    // Update page-specific elements
    this.updatePageSpecificElements();
    
    // Enable interactive elements
    this.setElementsDisabled(this.uiElements.get('auth-buttons'), false);
    
    // Hide loading indicators
    this.hideLoadingState();
    
    // Redirect if on auth page
    this.handlePostAuthRedirect();
  }

  /**
   * Update UI for unauthenticated state
   */
  updateUIForUnauthenticated() {
    // Hide user-specific elements
    this.hideUserSpecificElements();
    
    // Show login/register buttons
    this.showGuestElements();
    
    // Clear user information
    this.clearUserDisplayInfo();
    
    // Enable auth form elements
    this.setElementsDisabled(this.uiElements.get('auth-buttons'), false);
    
    // Hide loading indicators
    this.hideLoadingState();
    
    // Redirect to login if on protected page
    this.handleUnauthenticatedRedirect();
  }

  /**
   * Update user display information in UI
   */
  updateUserDisplayInfo() {
    if (!this.currentUser || !this.userProfile) return;

    // Update user avatar
    const initials = this.getUserInitials(this.userProfile.name);
    ['sidebarInitials', 'sidebarAvatar', 'headerAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = initials;
        el.title = this.userProfile.name || '';
      }
    });

    // Update user name
    const nameElement = this.uiElements.get('user-name');
    if (nameElement) {
      nameElement.textContent = this.userProfile.name;
    }

    // Update user role
    const roleElement = this.uiElements.get('user-role');
    if (roleElement) {
      const roleDisplay = this.formatRoleForDisplay(this.userProfile.role);
      roleElement.textContent = roleDisplay;
    }

    // Update welcome message
    const welcomeElement = this.uiElements.get('welcome-message');
    if (welcomeElement) {
      const timeBasedGreeting = this.getTimeBasedGreeting();
      welcomeElement.innerHTML = `${timeBasedGreeting}, ${this.userProfile.name.split(' ')[0]}! 👋`;
    }
  }
  /**
   * Update navigation for user role
   * @param {string} role - User role (student, mentor, admin)
   */
  updateNavigationForRole(role) {
    // Update dashboard navigation items
    const navLinks = document.querySelectorAll('.db-nav a[data-nav-item]');
    navLinks.forEach(link => {
      const navItem = link.dataset.navItem;
      const navigationConfig = this.navigationItems.get(navItem);
      
      if (navigationConfig && navigationConfig[role]) {
        link.href = navigationConfig[role];
        link.style.display = '';
      } else if (navigationConfig && !navigationConfig[role]) {
        // Hide navigation items not available for this role
        link.style.display = 'none';
      }
    });

    // Update main navigation (landing page)
    const mainNavButtons = this.uiElements.get('nav-auth-buttons');
    if (mainNavButtons) {
      mainNavButtons.forEach(button => {
        if (button.textContent.includes('Sign In') || button.textContent.includes('Get Started')) {
          button.style.display = 'none';
        }
      });
      
      // Add user menu if not exists
      this.addUserMenuToMainNav(role);
    }

    // Update page title based on role
    this.updatePageTitle(role);
  }

  /**
   * Show user-specific elements
   */
  showUserSpecificElements() {
    // Show logout button
    const logoutButton = this.uiElements.get('logout-button');
    if (logoutButton) {
      logoutButton.style.display = '';
      this.setupLogoutHandler(logoutButton);
    }

    // Show user info section
    const userInfo = document.querySelector('.db-user-row');
    if (userInfo) {
      userInfo.style.display = '';
    }

    // Show notification elements
    const notificationBadge = this.uiElements.get('notification-badge');
    if (notificationBadge && this.hasUnreadNotifications()) {
      notificationBadge.style.display = '';
    }
  }

  /**
   * Hide user-specific elements
   */
  hideUserSpecificElements() {
    // Hide logout button
    const logoutButton = this.uiElements.get('logout-button');
    if (logoutButton) {
      logoutButton.style.display = 'none';
    }

    // Hide user info section
    const userInfo = document.querySelector('.db-user-row');
    if (userInfo) {
      userInfo.style.display = 'none';
    }

    // Hide notification elements
    const notificationBadge = this.uiElements.get('notification-badge');
    if (notificationBadge) {
      notificationBadge.style.display = 'none';
    }
  }

  /**
   * Show elements for guest users
   */
  showGuestElements() {
    const navButtons = this.uiElements.get('nav-auth-buttons');
    if (navButtons) {
      navButtons.forEach(button => {
        if (button.textContent.includes('Sign In') || button.textContent.includes('Get Started')) {
          button.style.display = '';
        }
      });
    }
  }
  /**
   * Persist session for dashboard access control
   */
  persistSession() {
    if (!this.currentUser) return;

    const profile = this.userProfile || {};
    this.persistSessionFromAuthResult({
      user: this.currentUser,
      profile
    });
  }

  /**
   * Persist session from an auth/register result object
   * @param {Object} result - Auth result with user and profile
   */
  persistSessionFromAuthResult(result = {}) {
    const user = result.user;
    const profile = result.profile || {};
    if (!user) return;

    try {
      sessionStorage.setItem('mb_session', JSON.stringify({
        name: profile.name || user.displayName || '',
        email: user.email || profile.email || '',
        role: profile.role || 'student',
        uid: user.uid
      }));
    } catch (error) {
      console.warn('Failed to persist session:', error.message);
    }
  }

  /**
   * Handle user sign-in
   */
  async handleUserSignIn() {
    console.log('✅ User signed in successfully');

    this.persistSession();
    
    // Show success message
    this.showSuccessMessage('Welcome back! Redirecting to your dashboard...');
    
    // Update any cached user data
    await this.refreshUserData();
    
    // Trigger redirection to dashboard
    this.handlePostAuthRedirect();
    
    // Trigger custom event for other components
    this.dispatchAuthEvent('user-signed-in', {
      user: this.currentUser,
      profile: this.userProfile
    });
  }

  /**
   * Handle user sign-out
   */
  async handleUserSignOut() {
    console.log('👋 User signed out');
    
    // Clear any cached data
    this.clearUserData();
    
    // Show success message
    this.showSuccessMessage('Signed out successfully');
    
    // Trigger custom event
    this.dispatchAuthEvent('user-signed-out');
  }

  /**
   * Set loading state for specific operation (enhanced)
   * @param {string} operation - Operation name
   * @param {string} message - Loading message
   */
  setOperationLoading(operation, message) {
    // Use the enhanced setLoadingState method
    const config = this.operationConfig[operation];
    const loadingText = message || (config ? config.loadingText : 'Loading...');
    
    this.setLoadingState(operation, loadingText);
    
    // Disable relevant buttons
    const operationButton = document.getElementById(`btn${operation.charAt(0).toUpperCase() + operation.slice(1)}`);
    if (operationButton) {
      operationButton.disabled = true;
      operationButton.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
    }
  }

  /**
   * Clear loading state for specific operation (enhanced)
   * @param {string} operation - Operation name
   * @param {boolean} success - Whether operation was successful
   * @param {string} message - Custom message
   */
  clearOperationLoading(operation = null, success = true, message = null) {
    if (operation) {
      // Use the enhanced clearLoadingState method
      this.clearLoadingState(operation);
      
      const operationButton = document.getElementById(`btn${operation.charAt(0).toUpperCase() + operation.slice(1)}`);
      if (operationButton) {
        operationButton.disabled = false;
        
        // Reset button text based on operation
        const buttonTexts = {
          login: 'Sign In',
          register: 'Create Account', 
          logout: 'Sign Out',
          passwordReset: 'Send Reset Link'
        };
        operationButton.innerHTML = buttonTexts[operation] || 'Submit';
      }
      
      if (success && message) {
        this.showSuccessMessage(message);
      }
    } else {
      // Clear all loading states using enhanced method
      this.clearLoadingState();
    }
  }

  /**
   * Show loading state UI (enhanced)
   * @param {string} message - Loading message
   */
  showLoadingState(message = 'Loading...') {
    // Clear previous messages before showing loading state
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.color = '#4A1547';
      messageElement.style.display = 'block';
    }

    // Add loading spinner if available
    const loadingOverlay = this.uiElements.get('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  }
  /**
   * Hide loading state UI
   */
  hideLoadingState() {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.textContent = '';
      messageElement.style.display = 'none';
    }

    const loadingOverlay = this.uiElements.get('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Show success message (enhanced with notification queue)
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.color = '#238a53';
      messageElement.style.display = 'block';
      
      // Add to notification queue
      this.addNotificationToQueue({
        type: 'success',
        content: message,
        timestamp: new Date()
      });
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (messageElement.textContent === message) {
          this.hideLoadingState();
        }
      }, 3000);
    }
  }

  /**
   * Show error message (enhanced with notification queue)
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.color = 'var(--color-error, #c0392b)';
      messageElement.style.display = 'block';
      
      // Add to notification queue
      this.addNotificationToQueue({
        type: 'error',
        content: message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Make notification persistent until user navigates away or explicitly dismisses
   * @param {Element} container - Notification container
   * @private
   */
  _makeNotificationPersistent(container) {
    if (!container) return;
    
    // Mark as persistent
    container.dataset.persistent = 'true';
    
    // Add to persistent notifications tracking
    if (!this.persistentNotifications) {
      this.persistentNotifications = new Set();
    }
    this.persistentNotifications.add(container);
    
    // Setup cleanup on page navigation
    const handleBeforeUnload = () => {
      this.persistentNotifications.clear();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Setup cleanup when switching between auth modes
    const handleAuthModeSwitch = (event) => {
      // Only clear if switching to a different mode (not just clicking same mode)
      const targetMode = event.target.dataset.mode;
      const currentActiveMode = document.querySelector('.auth-mode-btn.active')?.dataset.mode;
      
      if (targetMode && targetMode !== currentActiveMode) {
        // Delay cleanup to allow for smooth transition
        setTimeout(() => {
          if (this.persistentNotifications && this.persistentNotifications.has(container)) {
            this.clearPreviousMessages();
          }
        }, 500);
      }
    };
    
    // Listen for auth mode changes
    const authModeButtons = document.querySelectorAll('.auth-mode-btn');
    authModeButtons.forEach(button => {
      button.removeEventListener('click', handleAuthModeSwitch); // Prevent duplicates
      button.addEventListener('click', handleAuthModeSwitch);
    });
    
    console.log('📌 Notification marked as persistent');
  }

  /**
   * Enhanced notification queue management for proper cleanup
   */
  _setupNotificationCleanup() {
    // Initialize persistent notifications tracking if not exists
    if (!this.persistentNotifications) {
      this.persistentNotifications = new Set();
    }
    
    // Clean up when auth state changes to unauthenticated
    window.addEventListener('auth-state-change', (event) => {
      if (event.detail.newState === 'unauthenticated') {
        // Clear all notifications on sign out
        setTimeout(() => {
          this.clearPreviousMessages();
        }, 100);
      }
    });
  }

  /**
   * Clear previous authentication messages from the UI
   * Enhanced to handle persistent notifications properly
   */
  clearPreviousMessages() {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.innerHTML = '';
      messageElement.style.display = 'none';
      messageElement.style.color = '';
    }
    
    // Clear notifications container
    const notificationsContainer = this.uiElements.get('auth-notifications-container') || 
                                   document.getElementById('authNotificationsContainer');
    if (notificationsContainer) {
      // Check for persistent notifications before clearing
      const persistentElements = notificationsContainer.querySelectorAll('[data-persistent="true"]');
      
      if (persistentElements.length === 0 || this._shouldClearPersistent) {
        notificationsContainer.innerHTML = '';
      } else {
        // Only clear non-persistent notifications
        const nonPersistent = notificationsContainer.querySelectorAll(':not([data-persistent="true"])');
        nonPersistent.forEach(element => element.remove());
      }
    }
    
    // Clear any persistent notification banners (with persistent handling)
    const existingNotifications = document.querySelectorAll(
      '.email-verification-notification, .email-verification-warning, .redirect-loading-notification'
    );
    
    existingNotifications.forEach(notification => {
      if (!notification.dataset.persistent || this._shouldClearPersistent) {
        notification.remove();
        
        // Remove from persistent tracking
        if (this.persistentNotifications && this.persistentNotifications.has(notification)) {
          this.persistentNotifications.delete(notification);
        }
      }
    });
    
    // Clear notification queue only if not preserving persistent
    if (this._shouldClearPersistent) {
      this.notificationQueue = [];
      if (this.persistentNotifications) {
        this.persistentNotifications.clear();
      }
    }
    
    // Reset the flag
    this._shouldClearPersistent = false;
    
    console.log('🧹 Previous messages cleared');
  }

  /**
   * Force clear all messages including persistent ones
   */
  clearAllMessages() {
    this._shouldClearPersistent = true;
    this.clearPreviousMessages();
  }

  /**
   * Set loading state with operation tracking
   * @param {string} operation - Operation identifier (optional)
   * @param {string} message - Loading message
   */
  setLoadingState(operation = 'default', message = 'Loading...') {
    // Track the loading operation
    this.loadingStates.set(operation, {
      active: true,
      message: message,
      startTime: Date.now()
    });
    
    // Update UI
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.color = '#4A1547';
      messageElement.style.display = 'block';
    }

    // Show loading overlay if available
    const loadingOverlay = this.uiElements.get('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    
    // Disable form controls to prevent duplicate operations
    this.setElementsDisabled(this.uiElements.get('auth-buttons'), true);
    
    console.log(`🔄 Loading state set for operation: ${operation} - ${message}`);
  }

  /**
   * Clear loading state for specific operation or all operations
   * @param {string} operation - Operation identifier (optional, clears all if not specified)
   */
  clearLoadingState(operation = null) {
    if (operation) {
      // Clear specific operation
      if (this.loadingStates.has(operation)) {
        this.loadingStates.delete(operation);
        console.log(`✅ Loading state cleared for operation: ${operation}`);
      }
    } else {
      // Clear all loading states
      this.loadingStates.clear();
      console.log('✅ All loading states cleared');
    }
    
    // If no more loading operations, hide loading UI
    if (this.loadingStates.size === 0) {
      this.hideLoadingState();
      
      // Re-enable form controls
      this.setElementsDisabled(this.uiElements.get('auth-buttons'), false);
    }
  }

  /**
   * Get dashboard URL for specific user role
   * @param {string} role - User role (student, mentor, admin)
   * @returns {string} Dashboard URL
   */
  getDashboardUrlForRole(role) {
    return this.redirectConfig[role] || this.redirectConfig.default;
  }

  /**
   * Check if current page is an authentication page
   * @param {string} path - Current page path
   * @returns {boolean} True if on auth page
   */
  isAuthPage(path) {
    const authPages = ['auth.html', 'login.html', 'register.html'];
    return authPages.some(page => path.includes(page));
  }

  /**
   * Append URL parameters to destination URL
   * @param {string} baseUrl - Base URL
   * @param {URLSearchParams} params - URL parameters to append
   * @returns {string} Final URL with parameters
   */
  appendUrlParams(baseUrl, params) {
    if (params.toString()) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return baseUrl + separator + params.toString();
    }
    return baseUrl;
  }

  /**
   * Enhanced notification queue management with proper interface support
   * @param {Object} notification - NotificationMessage object
   */
  addNotificationToQueue(notification) {
    // Create notification with unique ID and timestamp using the interface
    const notificationMessage = this.NotificationMessage.createNotification(
      notification.type || 'info',
      notification.content,
      notification.actions || [],
      notification.persistent || false
    );
    
    // Add additional properties from notification
    Object.assign(notificationMessage, notification);
    
    // Add to queue
    this.notificationQueue.push(notificationMessage);
    
    // Limit queue size
    if (this.notificationQueue.length > this.maxNotifications) {
      this.notificationQueue.shift(); // Remove oldest
    }
    
    console.log('📝 Notification added to queue:', notificationMessage.id);
    return notificationMessage;
  }

  /**
   * Validate notification placement to ensure UI consistency
   * @returns {boolean} True if notifications can be displayed properly
   */
  validateNotificationPlacement() {
    const messageElement = this.uiElements.get('auth-message');
    if (!messageElement) {
      console.warn('⚠️ Auth message element not found for notifications');
      return false;
    }
    
    // Check if element is visible and accessible
    const elementRect = messageElement.getBoundingClientRect();
    const isVisible = elementRect.width > 0 && elementRect.height > 0;
    
    if (!isVisible) {
      console.warn('⚠️ Auth message element not visible');
      return false;
    }
    
    return true;
  }

  /**
   * Show error with action buttons
   * @param {string} message - Error message
   * @param {Array} actions - Array of UIAction objects
   */
  showErrorWithActions(message, actions = []) {
    const messageElement = this.uiElements.get('auth-message');
    if (!messageElement) return;
    
    // Build actions HTML
    let actionsHtml = '';
    if (actions.length > 0) {
      actionsHtml = '<div style="margin-top: 0.75rem;">';
      actions.forEach((action, index) => {
        const styleClass = action.style === 'primary' ? 'btn btn-primary btn-sm' : 
                          action.style === 'danger' ? 'btn btn-danger btn-sm' : 
                          'btn btn-outline btn-sm';
        actionsHtml += `<button id="action-btn-${index}" class="${styleClass}" style="margin-right: 0.5rem;">${action.label}</button>`;
      });
      actionsHtml += '</div>';
    }
    
    messageElement.innerHTML = `
      <div style="background: rgba(192,57,43,.1); border: 1px solid rgba(192,57,43,.2); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.25rem; color: #c0392b;">❌</span>
          <div>
            <p style="color: #c0392b; margin: 0; font-size: 0.875rem; line-height: 1.5;">${message}</p>
            ${actionsHtml}
          </div>
        </div>
      </div>
    `;
    
    messageElement.style.display = 'block';
    
    // Attach event handlers to action buttons
    actions.forEach((action, index) => {
      const button = document.getElementById(`action-btn-${index}`);
      if (button && typeof action.action === 'function') {
        button.addEventListener('click', action.action);
      }
    });
  }

  /**
   * Create email verification notification HTML structure
   * @param {string} email - User email address
   * @param {string} role - User role (student, mentor, admin)
   * @returns {string} HTML string for the notification
   */
  createEmailVerificationNotificationHTML(email, role) {
    const roleDisplay = this.formatRoleForDisplay(role);
    
    return `
      <div class="email-verification-notification" role="alert" aria-live="assertive" aria-labelledby="verification-heading" aria-describedby="verification-body">
        <div class="notification-header">
          <span class="success-icon" role="img" aria-label="Success">✅</span>
          <h4 id="verification-heading">Account Created Successfully!</h4>
        </div>
        <div class="notification-body" id="verification-body">
          <p>We've sent a verification email to <strong>${email}</strong>.</p>
          <p>Next steps:</p>
          <ol>
            <li>Check your email (including spam folder)</li>
            <li>Click the verification link</li>
            <li>Return here and sign in to access your ${roleDisplay.toLowerCase()} dashboard</li>
          </ol>
        </div>
        <div class="notification-actions">
          <button class="btn btn-success btn-sm" id="resendVerificationBtn" type="button" aria-describedby="resend-verification-desc">
            Resend Verification Email
          </button>
          <span id="resend-verification-desc" class="sr-only">Resends verification email to your registered email address</span>
          <button class="btn btn-outline btn-sm" id="goToSignInBtn" type="button" aria-describedby="goto-signin-desc">
            Go to Sign In
          </button>
          <span id="goto-signin-desc" class="sr-only">Navigate to the sign in form</span>
        </div>
      </div>
    `;
  }

  /**
   * Create email verification warning HTML structure (for unverified login attempts)
   * @param {string} email - User email address
   * @param {boolean} canResend - Whether user can resend verification
   * @returns {string} HTML string for the warning
   */
  createEmailVerificationWarningHTML(email, canResend = true) {
    return `
      <div class="email-verification-warning" role="alert" aria-live="assertive">
        <div class="warning-header">
          <span class="warning-icon" role="img" aria-label="Warning">⚠️</span>
          <h4>Email Verification Required</h4>
        </div>
        <div class="warning-body">
          <p>Please verify your email address before signing in.</p>
          <p>Check your inbox for a verification email sent to <strong>${email}</strong>.</p>
          <p>After clicking the verification link, return here and sign in again.</p>
        </div>
        ${canResend ? `
        <div class="warning-actions">
          <button class="btn btn-warning btn-sm" id="resendVerificationLoginBtn" type="button">
            Resend Verification Email
          </button>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Create redirect loading notification HTML structure
   * @param {string} role - User role for personalized message
   * @returns {string} HTML string for the redirect notification
   */
  createRedirectLoadingNotificationHTML(role) {
    const roleDisplay = this.formatRoleForDisplay(role);
    
    return `
      <div class="redirect-loading-notification" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
        <div class="redirect-message">
          Welcome back! Redirecting to your ${roleDisplay.toLowerCase()} dashboard...
        </div>
      </div>
    `;
  }

  /**
   * Display notification in the notifications container with proper styling and accessibility
   * @param {string} htmlContent - HTML content for the notification
   * @param {Function} setupCallback - Callback to setup event handlers
   */
  displayNotificationInContainer(htmlContent, setupCallback = null) {
    // Get or create notifications container
    let container = document.getElementById('authNotificationsContainer');
    
    if (!container) {
      // Create container if it doesn't exist
      const messageElement = this.uiElements.get('auth-message');
      if (messageElement && messageElement.parentNode) {
        container = document.createElement('div');
        container.id = 'authNotificationsContainer';
        container.className = 'auth-notifications-container';
        container.setAttribute('aria-live', 'polite');
        messageElement.parentNode.insertBefore(container, messageElement.nextSibling);
      }
    }
    
    if (container) {
      // Clear previous notifications
      container.innerHTML = '';
      
      // Add new notification
      container.innerHTML = htmlContent;
      
      // Setup event handlers if provided
      if (setupCallback && typeof setupCallback === 'function') {
        setupCallback(container);
      }
      
      // Scroll notification into view if needed
      setTimeout(() => {
        container.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest' 
        });
      }, 100);
    }
    
    return container;
  }

  /**
   * Enhanced email verification success message with proper HTML structure
   * @param {string} email - User email
   * @param {string} role - User role
   */
  showEmailVerificationMessage(email, role) {
    // Clear previous messages
    this.clearPreviousMessages();
    
    // Create and display the notification
    const htmlContent = this.createEmailVerificationNotificationHTML(email, role);
    
    const container = this.displayNotificationInContainer(htmlContent, (container) => {
      // Setup resend verification button
      const resendBtn = container.querySelector('#resendVerificationBtn');
      if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
          try {
            // Disable button and show loading state
            resendBtn.textContent = 'Sending...';
            resendBtn.disabled = true;
            resendBtn.classList.add('loading');
            
            if (window.mentorBridgeAuth && window.mentorBridgeAuth.currentUser) {
              await window.mentorBridgeAuth.sendEmailVerification();
              resendBtn.textContent = 'Sent!';
              resendBtn.classList.remove('btn-success', 'loading');
              resendBtn.classList.add('btn-outline');
              
              // Show success feedback
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
                resendBtn.classList.remove('btn-outline');
                resendBtn.classList.add('btn-success');
              }, 3000);
            } else {
              resendBtn.textContent = 'Please sign in first';
              resendBtn.classList.remove('loading');
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
              }, 3000);
            }
          } catch (error) {
            console.error('Resend verification error:', error);
            resendBtn.textContent = 'Error sending email';
            resendBtn.classList.remove('btn-success', 'loading');
            resendBtn.classList.add('btn-warning');
            
            // Reset button after error display
            setTimeout(() => {
              resendBtn.textContent = 'Resend Verification Email';
              resendBtn.disabled = false;
              resendBtn.classList.remove('btn-warning');
              resendBtn.classList.add('btn-success');
            }, 3000);
          }
        });
      }
      
      // Setup "Go to Sign In" button with proper navigation handling
      const goToSignInBtn = container.querySelector('#goToSignInBtn');
      if (goToSignInBtn) {
        goToSignInBtn.addEventListener('click', () => {
          // Switch to sign in mode with smooth transition
          const signInBtn = document.querySelector('.auth-mode-btn[data-mode="signin"]');
          if (signInBtn) {
            signInBtn.click();
            
            // Focus on email input for better UX
            setTimeout(() => {
              const emailInput = document.querySelector('#siStudentEmail, #siMentorEmail');
              if (emailInput) {
                emailInput.focus();
                // Pre-fill with the registered email
                emailInput.value = email;
              }
            }, 100);
          }
          
          // Clear notifications after switching with proper timing
          setTimeout(() => {
            this.clearPreviousMessages();
          }, 300);
        });
      }
    });
    
    // Ensure notification persists until user navigates away
    this._makeNotificationPersistent(container);
    
    console.log('✅ Email verification notification displayed for:', email);
  }

  /**
   * Enhanced email not verified message with proper HTML structure
   * @param {string} email - User email
   * @param {boolean} canResend - Whether user can resend verification
   */
  showEmailNotVerifiedMessage(email, canResend = true) {
    // Clear previous messages
    this.clearPreviousMessages();
    
    // Create and display the warning
    const htmlContent = this.createEmailVerificationWarningHTML(email, canResend);
    
    const container = this.displayNotificationInContainer(htmlContent, (container) => {
      // Setup resend verification button for login
      if (canResend) {
        const resendBtn = container.querySelector('#resendVerificationLoginBtn');
        if (resendBtn) {
          resendBtn.addEventListener('click', async () => {
            try {
              // Disable button and show loading state
              resendBtn.textContent = 'Sending...';
              resendBtn.disabled = true;
              resendBtn.classList.add('loading');
              
              if (window.mentorBridgeAuth && window.mentorBridgeAuth.currentUser) {
                await window.mentorBridgeAuth.sendEmailVerification();
                resendBtn.textContent = 'Sent! Check your email';
                resendBtn.classList.remove('btn-warning', 'loading');
                resendBtn.classList.add('btn-success');
                
                // Extended timeout for email checking
                setTimeout(() => {
                  resendBtn.textContent = 'Resend Verification Email';
                  resendBtn.disabled = false;
                  resendBtn.classList.remove('btn-success');
                  resendBtn.classList.add('btn-warning');
                }, 5000);
              } else {
                resendBtn.textContent = 'Error - Please try signing in again';
                resendBtn.classList.remove('loading');
                setTimeout(() => {
                  resendBtn.textContent = 'Resend Verification Email';
                  resendBtn.disabled = false;
                }, 3000);
              }
            } catch (error) {
              console.error('Resend verification error:', error);
              resendBtn.textContent = 'Error sending email';
              resendBtn.classList.remove('loading');
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
              }, 3000);
            }
          });
        }
      }
    });
    
    // Ensure notification persists until resolved
    this._makeNotificationPersistent(container);
    
    console.log('⚠️ Email verification warning displayed for:', email);
  }

  /**
   * Show redirect loading notification with proper HTML structure
   * @param {string} role - User role for personalized message
   */
  showRedirectLoadingNotification(role) {
    // Clear previous messages
    this.clearPreviousMessages();
    
    // Create and display the redirect loading notification
    const htmlContent = this.createRedirectLoadingNotificationHTML(role);
    
    this.displayNotificationInContainer(htmlContent);
    
    console.log(`🔄 Redirect loading notification displayed for role: ${role}`);
  }

  /**
   * Show email verification success message (LEGACY - for backward compatibility)
   * @param {string} email - User email
   * @param {string} role - User role
   */
  showEmailVerificationMessage_Legacy(email, role) {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      const dashboardName = role === 'mentor' ? 'mentor' : role === 'admin' ? 'admin' : 'student';
      
      messageElement.innerHTML = `
        <div style="background: rgba(35,138,83,.1); border: 1px solid rgba(35,138,83,.2); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
          <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="font-size: 1.25rem;">✅</span>
            <div>
              <h4 style="color: #238a53; margin: 0 0 0.5rem 0; font-size: 1rem;">Account Created Successfully!</h4>
              <p style="color: #238a53; margin: 0 0 0.75rem 0; font-size: 0.875rem; line-height: 1.5;">
                We've sent a verification email to <strong>${email}</strong>. 
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p style="color: #238a53; margin: 0 0 0.75rem 0; font-size: 0.875rem; line-height: 1.5;">
                <strong>Next steps:</strong><br>
                1. Check your email (including spam folder)<br>
                2. Click the verification link<br>
                3. Return here and sign in to access your ${dashboardName} dashboard
              </p>
              <button id="resendVerificationBtn" style="background: #238a53; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; margin-right: 0.5rem;">
                Resend Verification Email
              </button>
              <button onclick="document.querySelector('.auth-mode-btn[data-mode=\\"signin\\"]').click()" style="background: transparent; color: #238a53; border: 1px solid #238a53; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      `;
      
      messageElement.style.display = 'block';

      // Set up resend verification button
      const resendBtn = document.getElementById('resendVerificationBtn');
      if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
          try {
            resendBtn.textContent = 'Sending...';
            resendBtn.disabled = true;
            
            if (window.mentorBridgeAuth.currentUser) {
              await window.mentorBridgeAuth.sendEmailVerification();
              resendBtn.textContent = 'Sent!';
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
              }, 3000);
            } else {
              resendBtn.textContent = 'Please sign in first';
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
              }, 3000);
            }
          } catch (error) {
            resendBtn.textContent = 'Error sending email';
            setTimeout(() => {
              resendBtn.textContent = 'Resend Verification Email';
              resendBtn.disabled = false;
            }, 3000);
          }
        });
      }
    }
  }

  showEmailNotVerifiedMessage_Legacy(email, canResend = true) {
    const messageElement = this.uiElements.get('auth-message');
    if (messageElement) {
      messageElement.innerHTML = `
        <div style="background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.3); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
          <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="font-size: 1.25rem;">⚠️</span>
            <div>
              <h4 style="color: #b45309; margin: 0 0 0.5rem 0; font-size: 1rem;">Email Verification Required</h4>
              <p style="color: #b45309; margin: 0 0 0.75rem 0; font-size: 0.875rem; line-height: 1.5;">
                Please verify your email address before signing in. Check your inbox for a verification email sent to <strong>${email}</strong>.
              </p>
              <p style="color: #b45309; margin: 0 0 0.75rem 0; font-size: 0.875rem; line-height: 1.5;">
                After clicking the verification link in the email, return here and sign in again.
              </p>
              ${canResend ? `
                <button id="resendVerificationLoginBtn" style="background: #d97706; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                  Resend Verification Email
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      messageElement.style.display = 'block';

      // Set up resend verification button for login
      if (canResend) {
        const resendBtn = document.getElementById('resendVerificationLoginBtn');
        if (resendBtn) {
          resendBtn.addEventListener('click', async () => {
            try {
              resendBtn.textContent = 'Sending...';
              resendBtn.disabled = true;
              
              if (window.mentorBridgeAuth.currentUser) {
                await window.mentorBridgeAuth.sendEmailVerification();
                resendBtn.textContent = 'Sent! Check your email';
                setTimeout(() => {
                  resendBtn.textContent = 'Resend Verification Email';
                  resendBtn.disabled = false;
                }, 5000);
              } else {
                resendBtn.textContent = 'Error - Please try signing in again';
                setTimeout(() => {
                  resendBtn.textContent = 'Resend Verification Email';
                  resendBtn.disabled = false;
                }, 3000);
              }
            } catch (error) {
              resendBtn.textContent = 'Error sending email';
              setTimeout(() => {
                resendBtn.textContent = 'Resend Verification Email';
                resendBtn.disabled = false;
              }, 3000);
            }
          });
        }
      }
    }
  }

  /**
   * Handle post-authentication redirect to appropriate dashboard (enhanced)
   * This method is called by the auth state change handler
   * Implements redirection timing (within 2 seconds) as per requirements
   */
  handlePostAuthRedirect() {
    // Guard: only schedule one redirect at a time
    if (this._redirectScheduled) {
      console.log('🚫 Redirect already scheduled, skipping duplicate');
      return;
    }

    const currentPath = window.location.pathname;
    
    console.log('🔄 handlePostAuthRedirect called:', {
      currentPath,
      isAuthPage: this.isAuthPage(currentPath),
      userProfile: this.userProfile,
      role: this.userProfile?.role
    });
    
    // Only redirect from auth pages
    if (!this.isAuthPage(currentPath)) {
      console.log('🚫 Not redirecting - not on auth page');
      return;
    }
    
    if (!this.userProfile?.role) {
      console.warn('⚠️ Cannot redirect - user role not available', this.userProfile);
      return;
    }
    
    const role = this.userProfile.role;
    const dashboardUrl = this.getDashboardUrlForRole(role);
    
    // Preserve URL parameters if needed
    const urlParams = new URLSearchParams(window.location.search);
    const finalUrl = this.appendUrlParams(dashboardUrl, urlParams);
    
    // Show redirect loading notification with redirect message display
    this.showRedirectLoadingNotification(role);
    
    console.log(`🔄 Redirecting ${role} to dashboard:`, finalUrl);
    
    // Mark redirect as scheduled to prevent duplicates
    this._redirectScheduled = true;

    // Redirect after delay for UX - within 2 seconds requirement (using 1.8s)
    setTimeout(() => {
      window.location.href = finalUrl;
    }, 1800);
  }

  /**
   * Handle redirect for unauthenticated users on protected pages
   */
  handleUnauthenticatedRedirect() {
    const currentPath = window.location.pathname;
    const protectedPages = [
      'dashboard.html',
      'student-dashboard.html', 
      'mentor-dashboard.html',
      'admin-dashboard.html',
      '/admin/dashboard',
      'messages.html',
      'sessions.html',
      'profile.html',
      'settings.html'
    ];

    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtectedPage) {
      // Show message and redirect to auth page
      this.showErrorMessage('Please sign in to access this page');
      setTimeout(() => {
        window.location.href = '/pages/auth.html';
      }, 2000);
    }
  }
  /**
   * Utility methods
   */

  /**
   * Get user initials from full name
   * @param {string} name - Full name
   * @returns {string} User initials
   */
  getUserInitials(name) {
    if (!name) return '??';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Format role for display
   * @param {string} role - User role
   * @returns {string} Formatted role
   */
  formatRoleForDisplay(role) {
    const roleDisplayMap = {
      student: 'Mentee',
      mentor: 'Mentor',
      admin: 'Administrator'
    };
    
    return roleDisplayMap[role] || role;
  }

  /**
   * Get time-based greeting
   * @returns {string} Greeting message
   */
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Set authentication state
   * @param {string} state - Auth state
   */
  setAuthState(state) {
    this.authState = state;
    console.log('🔄 Auth state changed to:', state);
  }

  /**
   * Disable/enable elements
   * @param {NodeList|Element} elements - Elements to disable/enable
   * @param {boolean} disabled - Whether to disable
   */
  setElementsDisabled(elements, disabled) {
    if (!elements) return;
    
    if (elements.length) {
      elements.forEach(el => {
        el.disabled = disabled;
      });
    } else {
      elements.disabled = disabled;
    }
  }

  /**
   * Clear user display information
   */
  clearUserDisplayInfo() {
    const nameElement = this.uiElements.get('user-name');
    if (nameElement) nameElement.textContent = '';
    
    const roleElement = this.uiElements.get('user-role');
    if (roleElement) roleElement.textContent = '';
    
    const welcomeElement = this.uiElements.get('welcome-message');
    if (welcomeElement) welcomeElement.textContent = '';
  }
  /**
   * Setup logout handler
   * @param {Element} logoutButton - Logout button element
   */
  setupLogoutHandler(logoutButton) {
    if (!logoutButton || logoutButton.dataset.handlerAdded) return;
    
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        this.setOperationLoading('logout');
        await window.mentorBridgeAuth.signOut();
        this.clearOperationLoading('logout', true, 'Signed out successfully');
      } catch (error) {
        this.clearOperationLoading('logout', false);
        this.showErrorMessage('Failed to sign out: ' + error.message);
      }
    });
    
    logoutButton.dataset.handlerAdded = 'true';
  }

  /**
   * Add user menu to main navigation
   * @param {string} role - User role
   */
  addUserMenuToMainNav(role) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions || navActions.querySelector('.user-menu')) return;
    
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <button class="user-menu-trigger btn btn-outline">
        <span class="user-initials">${this.getUserInitials(this.userProfile?.name)}</span>
        ${this.userProfile?.name?.split(' ')[0] || 'User'}
      </button>
      <div class="user-menu-dropdown hidden">
        <a href="${this.navigationItems.get('dashboard')[role]}" class="menu-item">Dashboard</a>
        <a href="${this.navigationItems.get('profile')[role]}" class="menu-item">Profile</a>
        <a href="${this.navigationItems.get('settings')[role]}" class="menu-item">Settings</a>
        <hr class="menu-divider">
        <button class="menu-item logout-menu-item">Sign Out</button>
      </div>
    `;
    
    navActions.appendChild(userMenu);
    
    // Setup dropdown behavior
    this.setupUserMenuDropdown(userMenu);
  }

  /**
   * Setup user menu dropdown behavior
   * @param {Element} userMenu - User menu element
   */
  setupUserMenuDropdown(userMenu) {
    const trigger = userMenu.querySelector('.user-menu-trigger');
    const dropdown = userMenu.querySelector('.user-menu-dropdown');
    const logoutItem = userMenu.querySelector('.logout-menu-item');
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });
    
    // Handle logout
    logoutItem.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.mentorBridgeAuth.signOut();
      } catch (error) {
        this.showErrorMessage('Failed to sign out: ' + error.message);
      }
    });
  }

  /**
   * Update page-specific elements
   */
  updatePageSpecificElements() {
    const currentPath = window.location.pathname;
    
    // Update page title
    if (currentPath.includes('dashboard')) {
      const role = this.userProfile?.role;
      document.title = `${this.formatRoleForDisplay(role)} Dashboard | MentorBridge`;
    }
  }

  /**
   * Update page title based on role
   * @param {string} role - User role
   */
  updatePageTitle(role) {
    const currentTitle = document.title;
    const roleDisplay = this.formatRoleForDisplay(role);
    
    if (currentTitle.includes('Dashboard')) {
      document.title = `${roleDisplay} Dashboard | MentorBridge`;
    }
  }
  /**
   * Check if user has unread notifications
   * @returns {boolean} Whether user has unread notifications
   */
  hasUnreadNotifications() {
    // This would typically check with a notification service
    // For now, return false as placeholder
    return false;
  }

  /**
   * Refresh user data from Firestore
   */
  async refreshUserData() {
    if (!this.currentUser) return;
    
    try {
      // The user profile should be automatically refreshed by the auth service
      // This is a placeholder for any additional data refresh needs
      console.log('🔄 Refreshing user data...');
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }

  /**
   * Clear cached user data
   */
  clearUserData() {
    this.currentUser = null;
    this.userProfile = null;

    try {
      sessionStorage.removeItem('mb_session');
    } catch (error) {
      console.warn('Failed to clear session:', error.message);
    }
    
    // Clear any cached UI elements
    this.clearUserDisplayInfo();
  }

  /**
   * Dispatch custom authentication event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  dispatchAuthEvent(eventType, data = {}) {
    const event = new CustomEvent(`mentorbridge-${eventType}`, {
      detail: {
        timestamp: new Date().toISOString(),
        authState: this.authState,
        user: this.currentUser,
        profile: this.userProfile,
        ...data
      }
    });
    
    document.dispatchEvent(event);
    console.log(`📡 Dispatched event: ${eventType}`, data);
  }

  // Public API methods

  /**
   * Get current authentication state
   * @returns {string} Current auth state
   */
  getAuthState() {
    return this.authState;
  }

  /**
   * Get current user
   * @returns {Object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current user profile
   * @returns {Object|null} Current user profile
   */
  getCurrentUserProfile() {
    return this.userProfile;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    return this.authState === 'authenticated';
  }

  /**
   * Check if authentication is loading
   * @returns {boolean} Whether auth is loading
   */
  isLoading() {
    return this.authState === 'loading' || this.loadingStates.size > 0;
  }
}
// Create global instance
window.authUIIntegration = new AuthUIIntegrationService();

// Enhanced authentication wrapper functions for UI integration
window.authOperations = {
  
  /**
   * Enhanced login with UI integration and email verification check
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role
   * @returns {Promise<Object>} Login result
   */
  async login(email, password, role = 'student') {
    try {
      window.authUIIntegration.setOperationLoading('login');
      
      const result = await window.mentorBridgeAuth.signInUser(email, password);
      
      if (result.success) {
        window.authUIIntegration.persistSessionFromAuthResult(result);
        window.authUIIntegration.clearOperationLoading('login', true, 'Welcome back! Redirecting to your dashboard...');
        if (result.emailVerified === false) {
          window.authUIIntegration.showEmailNotVerifiedMessage(email, result.canResendVerification);
        }
        return result;
      }

      window.authUIIntegration.clearOperationLoading('login', false);
      window.authUIIntegration.showErrorMessage(result.message || 'Login failed');
      return result;
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('login', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  },

  /**
   * Enhanced registration with UI integration and email verification
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} profile - User profile data
   * @returns {Promise<Object>} Registration result
   */
  async register(email, password, profile) {
    try {
      window.authUIIntegration.setOperationLoading('register');
      
      const result = await window.mentorBridgeAuth.registerUser({
        email,
        password,
        profile
      });
      
      if (result.success) {
        window.authUIIntegration.persistSessionFromAuthResult(result);
        // Show email verification success message
        window.authUIIntegration.showEmailVerificationMessage(email, profile.role);
        window.authUIIntegration.clearOperationLoading('register', true);
        return result;
      } else {
        window.authUIIntegration.clearOperationLoading('register', false);
        window.authUIIntegration.showErrorMessage('Registration failed');
        return result;
      }
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('register', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  },

  /**
   * Enhanced password reset with UI integration
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset result
   */
  async resetPassword(email) {
    try {
      window.authUIIntegration.setOperationLoading('passwordReset');
      
      const result = await window.mentorBridgeAuth.sendPasswordResetEmail(email);
      
      if (result.success) {
        window.authUIIntegration.clearOperationLoading('passwordReset', true, 'Reset email sent!');
        return result;
      }
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('passwordReset', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  },

  /**
   * Sign in with Google
   * @param {string} role - Role for new users: 'student' or 'mentor'
   * @returns {Promise<Object>}
   */
  async signInWithGoogle(role = 'student') {
    try {
      window.authUIIntegration.setOperationLoading('login', 'Signing in with Google...');
      const result = await window.mentorBridgeAuth.signInWithGoogle(role);
      if (result.cancelled) {
        window.authUIIntegration.clearOperationLoading('login', false);
        return result;
      }
      if (result.success) {
        window.authUIIntegration.clearOperationLoading('login', true, 'Signed in! Redirecting...');
      }
      return result;
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('login', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  },

  /**
   * Sign in with Apple
   * @param {string} role - Role for new users: 'student' or 'mentor'
   * @returns {Promise<Object>}
   */
  async signInWithApple(role = 'student') {
    try {
      window.authUIIntegration.setOperationLoading('login', 'Signing in with Apple...');
      const result = await window.mentorBridgeAuth.signInWithApple(role);
      if (result.cancelled) {
        window.authUIIntegration.clearOperationLoading('login', false);
        return result;
      }
      if (result.success) {
        window.authUIIntegration.clearOperationLoading('login', true, 'Signed in! Redirecting...');
      }
      return result;
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('login', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  },

  /**
   * Enhanced logout with UI integration
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      window.authUIIntegration.setOperationLoading('logout');
      await window.mentorBridgeAuth.signOut();
      window.authUIIntegration.clearOperationLoading('logout', true, 'Signed out successfully');
    } catch (error) {
      window.authUIIntegration.clearOperationLoading('logout', false);
      window.authUIIntegration.showErrorMessage(error.message);
      throw error;
    }
  }
};

// Global initialization state tracking for Auth UI Integration
window.authUIIntegrationInitialized = window.authUIIntegrationInitialized || false;

// Auto-initialize when DOM is ready (with deduplication guard)
if (!window.authUIIntegrationInitialized) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.authUIIntegrationInitialized) {
        console.log('🔗 Auto-initializing Auth UI Integration...');
        window.authUIIntegrationInitialized = true;
        window.authUIIntegration.initialize().catch(console.error);
      }
    });
  } else {
    console.log('🔗 Auto-initializing Auth UI Integration (DOM already ready)...');
    window.authUIIntegrationInitialized = true;
    window.authUIIntegration.initialize().catch(console.error);
  }
} else {
  console.log('♻️ Auth UI Integration already initialized, skipping auto-initialization');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AuthUIIntegrationService,
    authOperations: window.authOperations
  };
}