/* MentorBridge Firebase Authentication Service
 * Comprehensive authentication system with real Firebase Auth integration
 * Version: 2.0 - Production ready with full feature support
 */

/**
 * Enhanced Firebase Authentication Service
 * Handles user registration, login, profile management, and session persistence
 */
class MentorBridgeAuth {
  constructor() {
    this.initialized = false;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.userProfile = null;
    this.authStateListeners = new Set();
    this.initPromise = null;
    
    // Session persistence configuration
    this.sessionConfig = {
      persistSession: true,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenThreshold: 5 * 60 * 1000 // 5 minutes
    };
    
    // Bind methods to preserve 'this' context
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
    this._validateUserProfile = this._validateUserProfile.bind(this);
  }

  /**
   * Initialize the authentication service
   * @returns {Promise<MentorBridgeAuth>} Initialized auth service
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  /**
   * Core initialization logic
   * @returns {Promise<MentorBridgeAuth>} Auth service instance
   */
  async _performInitialization() {
    try {
      console.log('🔐 Initializing MentorBridge Authentication...');

      // Wait for Firebase service to be initialized
      if (!window.firebaseService) {
        throw new Error('Firebase service not available. Please include firebase-service.js');
      }

      await window.firebaseService.initialize();
      
      // Get Firebase services
      this.auth = window.firebaseService.getAuth();
      this.db = window.firebaseService.getDb();

      if (!this.auth || !this.db) {
        throw new Error('Firebase Auth or Firestore not properly initialized');
      }

      // Configure Auth persistence
      await this._configureAuthPersistence();

      // Set up auth state listener
      this._setupAuthStateListener();

      // Initialize session management
      this._initializeSessionManagement();

      this.initialized = true;
      console.log('✅ MentorBridge Authentication initialized successfully');

      return this;

    } catch (error) {
      console.error('❌ Authentication initialization failed:', error);
      throw new Error(`Authentication initialization failed: ${error.message}`);
    }
  }

  /**
   * Configure Firebase Auth persistence settings
   * @returns {Promise<void>}
   */
  async _configureAuthPersistence() {
    try {
      // Set persistence to LOCAL for session persistence across browser restarts
      await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      console.log('✅ Auth persistence configured to LOCAL');
    } catch (error) {
      console.warn('⚠️ Failed to configure auth persistence:', error.message);
      // Continue initialization even if persistence configuration fails
    }
  }

  /**
   * Set up Firebase Auth state listener
   */
  _setupAuthStateListener() {
    this.auth.onAuthStateChanged(this._handleAuthStateChange);
    console.log('👤 Auth state listener configured');
  }

  /**
   * Handle Firebase Auth state changes
   * @param {firebase.User|null} user Firebase user object or null
   */
  async _handleAuthStateChange(user) {
    const previousUser = this.currentUser;
    this.currentUser = user;

    if (user) {
      console.log('👤 User signed in:', user.email);
      
      // Load user profile from Firestore — retry once on failure
      try {
        await this._loadUserProfile(user.uid);
      } catch (profileError) {
        console.warn('⚠️ Failed to load user profile (attempt 1):', profileError.message);
        // Retry after a short delay before giving up
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          await this._loadUserProfile(user.uid);
          console.log('✅ User profile loaded on retry');
        } catch (retryError) {
          console.warn('⚠️ Failed to load user profile (attempt 2):', retryError.message);
          // Profile unavailable — notify listeners anyway so the UI doesn't hang.
          // The redirect guards in auth-ui-integration will handle the missing profile.
          this.userProfile = null;
        }
      }
    } else {
      console.log('👤 User signed out');
      this.userProfile = null;
    }

    // Always notify all listeners, even when profile load failed.
    // Listeners should handle a null profile gracefully.
    const authEvent = {
      user: user,
      profile: this.userProfile,
      previousUser: previousUser,
      timestamp: new Date().toISOString()
    };

    this._notifyAuthStateListeners(authEvent);
  }

  /**
   * Initialize session management features
   */
  _initializeSessionManagement() {
    // Set up periodic token refresh check
    if (this.sessionConfig.persistSession) {
      setInterval(() => {
        this._checkTokenRefresh();
      }, this.sessionConfig.refreshTokenThreshold);
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentUser) {
        this._checkTokenRefresh();
      }
    });

    console.log('⏰ Session management initialized');
  }

  /**
   * Check if authentication token needs refresh
   * @returns {Promise<void>}
   */
  async _checkTokenRefresh() {
    if (!this.currentUser) return;

    try {
      // Force token refresh to ensure valid session
      await this.currentUser.getIdToken(true);
    } catch (error) {
      console.warn('⚠️ Token refresh failed:', error.message);
      // If token refresh fails, user might need to re-authenticate
      if (error.code === 'auth/user-token-expired') {
        await this.signOut();
      }
    }
  }

  /**
   * Load user profile from Firestore
   * @param {string} uid User ID
   * @returns {Promise<void>}
   */
  async _loadUserProfile(uid) {
    try {
      const profileDoc = await this.db.collection('users').doc(uid).get();
      
      if (profileDoc.exists) {
        this.userProfile = {
          uid,
          ...profileDoc.data()
        };
        console.log('📋 User profile loaded:', this.userProfile.role || 'unknown role');
      } else {
        console.log('📋 No user profile found, user may need to complete registration');
        this.userProfile = null;
      }
    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      throw new Error(`Failed to load user profile: ${error.message}`);
    }
  }

  /**
   * Register a new user with email and password
   * @param {Object} registrationData User registration data
   * @returns {Promise<Object>} Registration result
   */
  async registerUser({ email, password, profile }) {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    try {
      console.log('📝 Registering new user:', email);

      // Validate input data
      this._validateRegistrationData({ email, password, profile });

      // Create Firebase user account
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('✅ Firebase user created:', user.uid);

      // Send email verification
      await this.sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile = await this.createUserProfile(user, profile);

      // Update display name if provided
      if (profile.name) {
        await user.updateProfile({ displayName: profile.name });
      }

      return {
        success: true,
        user: user,
        profile: userProfile,
        emailVerificationSent: true,
        message: 'Registration successful. Please check your email for verification.'
      };

    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      // Handle specific Firebase Auth errors
      const errorMessage = this._getAuthErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in user with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} Sign-in result
   */
  async signInUser(email, password) {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    try {
      console.log('🔑 Signing in user:', email);

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Attempt sign in
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Load profile so session/redirect have the correct role
      try {
        await this._loadUserProfile(user.uid);
      } catch (profileError) {
        console.warn('⚠️ Profile load failed during sign-in:', profileError.message);
      }

      const profile = this.userProfile || {
        role: 'student',
        email: user.email,
        name: user.displayName || ''
      };

      console.log('✅ User signed in successfully:', user.email);

      return {
        success: true,
        user: user,
        profile: profile,
        emailVerified: user.emailVerified,
        canResendVerification: !user.emailVerified,
        message: user.emailVerified
          ? 'Sign in successful'
          : 'Sign in successful. Please verify your email when you can.'
      };

    } catch (error) {
      console.error('❌ Sign in failed:', error);
      
      const errorMessage = this._getAuthErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign in with Google OAuth popup
   * @param {string} role - Role for new users: 'student' or 'mentor' (defaults to 'student')
   * @returns {Promise<Object>} Sign-in result
   */
  async signInWithGoogle(role = 'student') {
    if (!this.initialized) throw new Error('Authentication service not initialized');
    // Normalise role — only student/mentor are valid for OAuth sign-up
    const safeRole = role === 'mentor' ? 'mentor' : 'student';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;

      // Check whether this user already has a Firestore profile
      const profileDoc = await this.db.collection('users').doc(user.uid).get();
      const isNew = !profileDoc.exists;

      if (isNew) {
        // Brand-new Google user — create profile with the role chosen on the auth page
        await this.createUserProfile(user, {
          name: user.displayName || user.email.split('@')[0],
          role: safeRole
        });
      }

      return { success: true, user, isNew, role: isNew ? safeRole : profileDoc.data()?.role };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true };
      }
      throw new Error(this._getAuthErrorMessage(error));
    }
  }

  /**
   * Sign in with Apple OAuth popup
   * @param {string} role - Role for new users: 'student' or 'mentor' (defaults to 'student')
   * @returns {Promise<Object>} Sign-in result
   */
  async signInWithApple(role = 'student') {
    if (!this.initialized) throw new Error('Authentication service not initialized');
    const safeRole = role === 'mentor' ? 'mentor' : 'student';
    try {
      const provider = new firebase.auth.OAuthProvider('apple.com');
      provider.addScope('name');
      provider.addScope('email');
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;

      const profileDoc = await this.db.collection('users').doc(user.uid).get();
      const isNew = !profileDoc.exists;

      if (isNew) {
        // Apple only sends name on the very first sign-in — use it while we have it
        const displayName = user.displayName
          || result.additionalUserInfo?.profile?.name
          || user.email?.split('@')[0]
          || 'Apple User';
        await this.createUserProfile(user, {
          name: displayName,
          role: safeRole
        });
      }

      return { success: true, user, isNew, role: isNew ? safeRole : profileDoc.data()?.role };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true };
      }
      throw new Error(this._getAuthErrorMessage(error));
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    try {
      console.log('🚪 Signing out user...');
      await this.auth.signOut();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * @param {string} email User email
   * @returns {Promise<Object>} Reset result
   */
  async sendPasswordResetEmail(email) {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    try {
      if (!email || !this._validateEmail(email)) {
        throw new Error('Valid email address is required');
      }

      console.log('📧 Sending password reset email to:', email);
      await this.auth.sendPasswordResetEmail(email);
      
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };

    } catch (error) {
      console.error('❌ Password reset failed:', error);
      
      const errorMessage = this._getAuthErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Send email verification to user
   * @param {firebase.User} user Firebase user object
   * @returns {Promise<void>}
   */
  async sendEmailVerification(user = null) {
    const targetUser = user || this.currentUser;
    
    if (!targetUser) {
      throw new Error('No user available for email verification');
    }

    if (targetUser.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified'
      };
    }

    try {
      console.log('📧 Sending email verification to:', targetUser.email);
      await targetUser.sendEmailVerification();
      
      return {
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      };

    } catch (error) {
      console.error('❌ Email verification failed:', error);
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Create user profile in Firestore
   * @param {firebase.User} user Firebase user object
   * @param {Object} profileData Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createUserProfile(user, profileData) {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    try {
      // Validate profile data
      const validatedProfile = this._validateUserProfile(profileData);

      const userProfile = {
        uid: user.uid,
        email: user.email,
        ...validatedProfile,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        emailVerified: user.emailVerified || false,
        accountStatus: 'active'
      };

      console.log('📋 Creating user profile:', { uid: user.uid, role: profileData.role });

      // Save to Firestore
      await this.db.collection('users').doc(user.uid).set(userProfile);
      
      // Update local profile
      this.userProfile = {
        ...userProfile,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      console.log('✅ User profile created successfully');
      return this.userProfile;

    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {Object} updates Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(updates) {
    if (!this.initialized) {
      throw new Error('Authentication service not initialized');
    }

    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Validate updates
      const validatedUpdates = this._validateUserProfile(updates, false);

      const profileUpdates = {
        ...validatedUpdates,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      console.log('📋 Updating user profile:', this.currentUser.uid);

      // Update in Firestore
      await this.db.collection('users').doc(this.currentUser.uid).update(profileUpdates);

      // Update local profile
      this.userProfile = {
        ...this.userProfile,
        ...profileUpdates,
        lastUpdated: new Date()
      };

      console.log('✅ User profile updated successfully');
      return this.userProfile;

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  /**
   * Get current user profile
   * @returns {Object|null} User profile or null
   */
  getUserProfile() {
    return this.userProfile;
  }

  /**
   * Get current Firebase user
   * @returns {firebase.User|null} Firebase user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Get user role from profile
   * @returns {string|null} User role or null
   */
  getUserRole() {
    return this.userProfile?.role || null;
  }

  /**
   * Check if user has specific role
   * @param {string} role Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    return this.getUserRole() === role;
  }

  /**
   * Check if user is admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Check if user is mentor
   * @returns {boolean} True if user is mentor
   */
  isMentor() {
    return this.hasRole('mentor');
  }

  /**
   * Check if user is student
   * @returns {boolean} True if user is student
   */
  isStudent() {
    return this.hasRole('student');
  }

  /**
   * Add authentication state listener
   * @param {Function} callback Callback function
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.authStateListeners.add(callback);

    // Immediately call with current state
    callback({
      user: this.currentUser,
      profile: this.userProfile
    });

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all auth state listeners
   * @param {Object} authEvent Authentication event data
   */
  _notifyAuthStateListeners(authEvent) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(authEvent);
      } catch (error) {
        console.error('❌ Error in auth state listener:', error);
      }
    });
  }
  /**
   * Validate registration data
   * @param {Object} data Registration data
   * @throws {Error} If validation fails
   */
  _validateRegistrationData({ email, password, profile }) {
    // Validate email
    if (!email || !this._validateEmail(email)) {
      throw new Error('Valid email address is required');
    }

    // Validate password
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate profile
    if (!profile) {
      throw new Error('Profile information is required');
    }

    if (!profile.role || !['student', 'mentor', 'admin'].includes(profile.role)) {
      throw new Error('Valid role is required (student, mentor, or admin)');
    }

    if (!profile.name || profile.name.trim().length < 2) {
      throw new Error('Full name is required');
    }
  }

  /**
   * Validate user profile data
   * @param {Object} profile Profile data
   * @param {boolean} isNew Whether this is a new profile
   * @returns {Object} Validated profile data
   */
  _validateUserProfile(profile, isNew = true) {
    const validated = {};

    // Required fields for new profiles
    if (isNew) {
      if (!profile.role || !['student', 'mentor', 'admin'].includes(profile.role)) {
        throw new Error('Valid role is required');
      }
      validated.role = profile.role;

      if (!profile.name || profile.name.trim().length < 2) {
        throw new Error('Full name is required');
      }
      validated.name = profile.name.trim();
    }

    // Optional fields
    if (profile.name && (!isNew || profile.name !== validated.name)) {
      validated.name = profile.name.trim();
    }

    if (profile.bio) {
      validated.bio = profile.bio.trim();
    }

    if (profile.university) {
      validated.university = profile.university.trim();
    }

    if (profile.programme) {
      validated.programme = profile.programme.trim();
    }

    if (profile.year && typeof profile.year === 'number') {
      validated.year = profile.year;
    }

    if (profile.skills && Array.isArray(profile.skills)) {
      validated.skills = profile.skills.filter(skill => skill && skill.trim());
    }

    if (profile.interests && Array.isArray(profile.interests)) {
      validated.interests = profile.interests.filter(interest => interest && interest.trim());
    }

    if (profile.industries && Array.isArray(profile.industries)) {
      validated.industries = profile.industries.filter(industry => industry && industry.trim());
    }

    if (profile.linkedinUrl && this._validateUrl(profile.linkedinUrl)) {
      validated.linkedinUrl = profile.linkedinUrl;
    }

    if (profile.availability) {
      validated.availability = profile.availability;
    }

    // Mentor-specific fields
    if (profile.title) {
      validated.title = profile.title.trim();
    }

    if (profile.industry) {
      validated.industry = profile.industry.trim();
    }

    if (profile.expertise && Array.isArray(profile.expertise)) {
      validated.expertise = profile.expertise.filter(e => e && e.trim());
    }

    if (profile.experience) {
      validated.experience = profile.experience;
    }

    // Student-specific fields
    if (profile.goal) {
      validated.goal = profile.goal.trim();
    }

    return validated;
  }

  /**
   * Validate email address
   * @param {string} email Email to validate
   * @returns {boolean} True if valid
   */
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   * @param {string} url URL to validate
   * @returns {boolean} True if valid
   */
  _validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly error message from Firebase Auth error
   * @param {Error} error Firebase error
   * @returns {string} User-friendly error message
   */
  _getAuthErrorMessage(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'An account with this email address already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-login-credentials': 'Incorrect email or password. If you have not set up admin yet, visit /admin/setup.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'auth/invalid-action-code': 'The verification code is invalid or expired.',
      'auth/expired-action-code': 'The verification code has expired.',
      'auth/user-token-expired': 'Your session has expired. Please sign in again.'
    };

    return errorMessages[error.code] || error.message || 'An unknown error occurred.';
  }
}

// Create global authentication service instance
window.mentorBridgeAuth = new MentorBridgeAuth();

// Backward compatibility functions for existing code
async function initFirebase() {
  console.log('🔄 Initializing Firebase (legacy function)...');
  await window.mentorBridgeAuth.initialize();
  
  // Set global references for backward compatibility
  window.firebaseAuth = window.mentorBridgeAuth.auth;
  window.firebaseDb = window.mentorBridgeAuth.db;
  window.firebaseInitialized = true;
}

function getAuth() {
  return window.mentorBridgeAuth?.auth || null;
}

function getDb() {
  return window.mentorBridgeAuth?.db || null;
}

// Legacy function wrappers for backward compatibility
function registerUser(email, password, role = 'student') {
  console.warn('registerUser() is deprecated. Use mentorBridgeAuth.registerUser() instead.');
  const profile = { role, name: email.split('@')[0] }; // Basic profile
  return window.mentorBridgeAuth.registerUser({ email, password, profile });
}

function signInUser(email, password) {
  console.warn('signInUser() is deprecated. Use mentorBridgeAuth.signInUser() instead.');
  return window.mentorBridgeAuth.signInUser(email, password);
}

function signOutUser() {
  console.warn('signOutUser() is deprecated. Use mentorBridgeAuth.signOut() instead.');
  return window.mentorBridgeAuth.signOut();
}

function sendPasswordResetEmail(email) {
  console.warn('sendPasswordResetEmail() is deprecated. Use mentorBridgeAuth.sendPasswordResetEmail() instead.');
  return window.mentorBridgeAuth.sendPasswordResetEmail(email);
}

function sendEmailVerification(user) {
  console.warn('sendEmailVerification() is deprecated. Use mentorBridgeAuth.sendEmailVerification() instead.');
  return window.mentorBridgeAuth.sendEmailVerification(user);
}

function getCurrentUser() {
  console.warn('getCurrentUser() is deprecated. Use mentorBridgeAuth.getCurrentUser() instead.');
  return window.mentorBridgeAuth.getCurrentUser();
}

function isAuthenticated() {
  console.warn('isAuthenticated() is deprecated. Use mentorBridgeAuth.isAuthenticated() instead.');
  return window.mentorBridgeAuth.isAuthenticated();
}

function getUserRole() {
  console.warn('getUserRole() is deprecated. Use mentorBridgeAuth.getUserRole() instead.');
  return window.mentorBridgeAuth.getUserRole();
}

function observeAuthState(callback) {
  console.warn('observeAuthState() is deprecated. Use mentorBridgeAuth.onAuthStateChanged() instead.');
  return window.mentorBridgeAuth.onAuthStateChanged(callback);
}

function createUserProfile(user, profile) {
  console.warn('createUserProfile() is deprecated. Use mentorBridgeAuth.createUserProfile() instead.');
  return window.mentorBridgeAuth.createUserProfile(user, profile);
}

function getUserProfile(uid) {
  console.warn('getUserProfile() is deprecated. Use mentorBridgeAuth.getUserProfile() instead.');
  if (uid === window.mentorBridgeAuth.currentUser?.uid) {
    return Promise.resolve(window.mentorBridgeAuth.userProfile);
  }
  
  const db = getDb();
  if (!db) {
    return Promise.reject(new Error('Firestore not initialized'));
  }
  return db.collection('users').doc(uid).get();
}

// Demo mode functions (deprecated)
function isDemoMode() {
  console.warn('isDemoMode() is deprecated. Demo mode is no longer supported.');
  return false;
}

function demoSignIn() {
  throw new Error('Demo mode is no longer supported. Please use real Firebase authentication.');
}

function demoRegister() {
  throw new Error('Demo mode is no longer supported. Please use real Firebase authentication.');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeAuth,
    initFirebase,
    getAuth,
    getDb,
    registerUser,
    signInUser,
    signOutUser,
    sendPasswordResetEmail,
    sendEmailVerification,
    getCurrentUser,
    isAuthenticated,
    getUserRole,
    observeAuthState,
    createUserProfile,
    getUserProfile
  };
}