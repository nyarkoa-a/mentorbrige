/* MentorBridge Firebase Profiles Service
 * Complete user profile management with Firebase integration
 * Version: 2.0 - Production Firebase profiles
 */

class MentorBridgeProfiles {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.profileCache = new Map();
    this.profileListeners = new Map();
    
    // Profile completion levels
    this.ProfileCompletion = {
      BASIC: 'basic',
      INTERMEDIATE: 'intermediate',
      COMPLETE: 'complete',
      VERIFIED: 'verified'
    };

    // Bind methods
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
  }

  /**
   * Initialize the profiles service
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      console.log('👤 Initializing MentorBridge Profiles...');

      // Wait for Firebase services
      if (!window.firebaseService) {
        throw new Error('Firebase service not available');
      }

      await window.firebaseService.initialize();
      
      this.db = window.firebaseService.getDb();
      this.auth = window.firebaseService.getAuth();

      // Set up auth state listener
      this.auth.onAuthStateChanged(this._handleAuthStateChange);
      this.currentUser = this.auth.currentUser;

      if (this.currentUser) {
        await this._setupProfileListener();
      }

      this.initialized = true;
      console.log('✅ Profiles service initialized');
      return this;

    } catch (error) {
      console.error('❌ Profiles initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication state changes
   */
  async _handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      await this._setupProfileListener();
    } else {
      this._cleanupListeners();
      this.profileCache.clear();
    }
  }

  /**
   * Set up real-time listener for current user's profile
   */
  async _setupProfileListener() {
    if (!this.currentUser) return;

    try {
      console.log('👂 Setting up profile listener for:', this.currentUser.uid);

      // Listen for current user's profile
      const profileDoc = this.db.collection('users').doc(this.currentUser.uid);
      const unsubscribe = profileDoc.onSnapshot((doc) => {
        if (doc.exists) {
          const profile = {
            uid: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
          };
          
          this.profileCache.set(doc.id, profile);
          console.log('👤 Profile updated:', profile.name || profile.email);
          
          // Trigger profile update event
          this._dispatchEvent('profileUpdated', { profile });
        }
      });

      this.profileListeners.set('currentProfile', unsubscribe);

    } catch (error) {
      console.error('❌ Failed to setup profile listener:', error);
    }
  }

  // ================================================================
  // PROFILE MANAGEMENT
  // ================================================================

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile() {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Profiles service not initialized or user not authenticated');
    }

    try {
      // Return cached profile if available
      if (this.profileCache.has(this.currentUser.uid)) {
        return this.profileCache.get(this.currentUser.uid);
      }

      // Fetch from Firestore
      const doc = await this.db.collection('users').doc(this.currentUser.uid).get();
      
      if (doc.exists) {
        const profile = {
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        };

        this.profileCache.set(doc.id, profile);
        return profile;
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get current user profile:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Profiles service not initialized or user not authenticated');
    }

    try {
      console.log('👤 Updating profile for:', this.currentUser.uid);

      // Validate updates
      const validatedUpdates = this._validateProfileUpdates(updates);

      const profileUpdates = {
        ...validatedUpdates,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Update in Firestore
      await this.db.collection('users').doc(this.currentUser.uid).update(profileUpdates);

      console.log('✅ Profile updated successfully');

      // Get updated profile from cache (will be updated by listener)
      return this.getCurrentUserProfile();

    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId) {
    if (!this.initialized) {
      throw new Error('Profiles service not initialized');
    }

    try {
      // Check cache first
      if (this.profileCache.has(userId)) {
        return this.profileCache.get(userId);
      }

      // Fetch from Firestore
      const doc = await this.db.collection('users').doc(userId).get();
      
      if (doc.exists) {
        const profile = {
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        };

        // Cache profile (but with limited data for privacy)
        const publicProfile = this._getPublicProfileData(profile);
        this.profileCache.set(doc.id, publicProfile);
        
        return publicProfile;
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Search profiles by criteria
   */
  async searchProfiles(filters = {}) {
    if (!this.initialized) {
      throw new Error('Profiles service not initialized');
    }

    try {
      let query = this.db.collection('users')
        .where('accountStatus', '==', 'active');

      // Apply filters
      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }

      if (filters.university) {
        query = query.where('university', '==', filters.university);
      }

      if (filters.verified) {
        query = query.where('verified', '==', true);
      }

      // Add ordering
      query = query.orderBy('lastUpdated', 'desc');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const profiles = snapshot.docs.map(doc => {
        const profileData = {
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        };

        return this._getPublicProfileData(profileData);
      });

      // Apply text-based filters (can't be done in Firestore efficiently)
      let filteredProfiles = profiles;

      if (filters.skills && filters.skills.length > 0) {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.skills && profile.skills.some(skill => 
            filters.skills.some(filterSkill => 
              skill.toLowerCase().includes(filterSkill.toLowerCase())
            )
          )
        );
      }

      if (filters.industries && filters.industries.length > 0) {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.industries && profile.industries.some(industry => 
            filters.industries.some(filterIndustry => 
              industry.toLowerCase().includes(filterIndustry.toLowerCase())
            )
          )
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredProfiles = filteredProfiles.filter(profile => 
          (profile.name && profile.name.toLowerCase().includes(query)) ||
          (profile.bio && profile.bio.toLowerCase().includes(query)) ||
          (profile.title && profile.title.toLowerCase().includes(query))
        );
      }

      return filteredProfiles;

    } catch (error) {
      console.error('❌ Failed to search profiles:', error);
      throw error;
    }
  }

  /**
   * Get mentors with availability
   */
  async getAvailableMentors(filters = {}) {
    return this.searchProfiles({
      ...filters,
      role: 'mentor',
      verified: true
    });
  }

  /**
   * Get students seeking mentorship
   */
  async getStudentsSeekingMentorship(filters = {}) {
    return this.searchProfiles({
      ...filters,
      role: 'student'
    });
  }

  // ================================================================
  // PROFILE COMPLETION & VALIDATION
  // ================================================================

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile) {
    if (!profile) return 0;

    const requiredFields = {
      basic: ['name', 'email', 'role'],
      intermediate: ['bio', 'university'],
      advanced: ['skills', 'interests']
    };

    const roleSpecificFields = {
      mentor: ['title', 'experience', 'industries', 'availability'],
      student: ['programme', 'year', 'goals']
    };

    let totalFields = 0;
    let completedFields = 0;

    // Count basic fields
    requiredFields.basic.forEach(field => {
      totalFields++;
      if (profile[field] && profile[field].toString().trim().length > 0) {
        completedFields++;
      }
    });

    // Count intermediate fields
    requiredFields.intermediate.forEach(field => {
      totalFields++;
      if (profile[field] && profile[field].toString().trim().length > 0) {
        completedFields++;
      }
    });

    // Count advanced fields
    requiredFields.advanced.forEach(field => {
      totalFields++;
      if (profile[field] && Array.isArray(profile[field]) && profile[field].length > 0) {
        completedFields++;
      }
    });

    // Count role-specific fields
    if (profile.role && roleSpecificFields[profile.role]) {
      roleSpecificFields[profile.role].forEach(field => {
        totalFields++;
        if (profile[field] && (
          (Array.isArray(profile[field]) && profile[field].length > 0) ||
          (!Array.isArray(profile[field]) && profile[field].toString().trim().length > 0)
        )) {
          completedFields++;
        }
      });
    }

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Get profile completion status
   */
  getProfileCompletionStatus(profile) {
    const completionPercentage = this.calculateProfileCompletion(profile);

    if (completionPercentage >= 90) {
      return this.ProfileCompletion.COMPLETE;
    } else if (completionPercentage >= 60) {
      return this.ProfileCompletion.INTERMEDIATE;
    } else {
      return this.ProfileCompletion.BASIC;
    }
  }

  /**
   * Get missing profile fields
   */
  getMissingProfileFields(profile) {
    if (!profile) return [];

    const missing = [];

    // Basic fields
    if (!profile.name || profile.name.trim().length === 0) missing.push('name');
    if (!profile.bio || profile.bio.trim().length === 0) missing.push('bio');
    if (!profile.university || profile.university.trim().length === 0) missing.push('university');

    // Skills and interests
    if (!profile.skills || profile.skills.length === 0) missing.push('skills');
    if (!profile.interests || profile.interests.length === 0) missing.push('interests');

    // Role-specific fields
    if (profile.role === 'mentor') {
      if (!profile.title || profile.title.trim().length === 0) missing.push('title');
      if (!profile.experience || profile.experience.trim().length === 0) missing.push('experience');
      if (!profile.industries || profile.industries.length === 0) missing.push('industries');
      if (!profile.availability || profile.availability.trim().length === 0) missing.push('availability');
    } else if (profile.role === 'student') {
      if (!profile.programme || profile.programme.trim().length === 0) missing.push('programme');
      if (!profile.year) missing.push('year');
      if (!profile.goals || profile.goals.length === 0) missing.push('goals');
    }

    return missing;
  }

  // ================================================================
  // PROFILE PRIVACY & SECURITY
  // ================================================================

  /**
   * Get public profile data (filtered for privacy)
   */
  _getPublicProfileData(profile) {
    if (!profile) return null;

    const publicData = {
      uid: profile.uid,
      name: profile.name,
      role: profile.role,
      bio: profile.bio,
      university: profile.university,
      programme: profile.programme,
      year: profile.year,
      skills: profile.skills,
      interests: profile.interests,
      industries: profile.industries,
      title: profile.title,
      experience: profile.experience,
      availability: profile.availability,
      verified: profile.verified || false,
      profilePhoto: profile.profilePhoto,
      linkedinUrl: profile.linkedinUrl,
      createdAt: profile.createdAt,
      lastUpdated: profile.lastUpdated,
      profileCompletion: this.calculateProfileCompletion(profile)
    };

    // Remove undefined/null values
    Object.keys(publicData).forEach(key => {
      if (publicData[key] === undefined || publicData[key] === null) {
        delete publicData[key];
      }
    });

    return publicData;
  }

  /**
   * Validate profile updates
   */
  _validateProfileUpdates(updates) {
    const validated = {};

    // Name validation
    if (updates.name !== undefined) {
      if (typeof updates.name === 'string' && updates.name.trim().length >= 2) {
        validated.name = updates.name.trim();
      } else if (updates.name !== null) {
        throw new Error('Name must be at least 2 characters long');
      }
    }

    // Bio validation
    if (updates.bio !== undefined) {
      if (typeof updates.bio === 'string') {
        validated.bio = updates.bio.trim();
      }
    }

    // University validation
    if (updates.university !== undefined) {
      if (typeof updates.university === 'string') {
        validated.university = updates.university.trim();
      }
    }

    // Programme validation
    if (updates.programme !== undefined) {
      if (typeof updates.programme === 'string') {
        validated.programme = updates.programme.trim();
      }
    }

    // Year validation
    if (updates.year !== undefined) {
      if (typeof updates.year === 'number' && updates.year > 0) {
        validated.year = updates.year;
      } else if (updates.year !== null) {
        throw new Error('Year must be a positive number');
      }
    }

    // Skills validation
    if (updates.skills !== undefined) {
      if (Array.isArray(updates.skills)) {
        validated.skills = updates.skills
          .filter(skill => skill && typeof skill === 'string')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      }
    }

    // Interests validation
    if (updates.interests !== undefined) {
      if (Array.isArray(updates.interests)) {
        validated.interests = updates.interests
          .filter(interest => interest && typeof interest === 'string')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0);
      }
    }

    // Industries validation
    if (updates.industries !== undefined) {
      if (Array.isArray(updates.industries)) {
        validated.industries = updates.industries
          .filter(industry => industry && typeof industry === 'string')
          .map(industry => industry.trim())
          .filter(industry => industry.length > 0);
      }
    }

    // Title validation (mentor only)
    if (updates.title !== undefined) {
      if (typeof updates.title === 'string') {
        validated.title = updates.title.trim();
      }
    }

    // Experience validation (mentor only)
    if (updates.experience !== undefined) {
      if (typeof updates.experience === 'string') {
        validated.experience = updates.experience.trim();
      }
    }

    // Availability validation (mentor only)
    if (updates.availability !== undefined) {
      if (typeof updates.availability === 'string') {
        validated.availability = updates.availability.trim();
      }
    }

    // Goals validation (student only)
    if (updates.goals !== undefined) {
      if (Array.isArray(updates.goals)) {
        validated.goals = updates.goals
          .filter(goal => goal && typeof goal === 'string')
          .map(goal => goal.trim())
          .filter(goal => goal.length > 0);
      }
    }

    // LinkedIn URL validation
    if (updates.linkedinUrl !== undefined) {
      if (typeof updates.linkedinUrl === 'string' && updates.linkedinUrl.trim().length > 0) {
        const url = updates.linkedinUrl.trim();
        if (url.includes('linkedin.com/') || url === '') {
          validated.linkedinUrl = url;
        } else {
          throw new Error('Please enter a valid LinkedIn URL');
        }
      }
    }

    return validated;
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Clean up listeners
   */
  _cleanupListeners() {
    this.profileListeners.forEach(unsubscribe => unsubscribe());
    this.profileListeners.clear();
  }

  /**
   * Dispatch custom events
   */
  _dispatchEvent(eventName, data) {
    const event = new CustomEvent(`mentorbridge-profiles-${eventName}`, {
      detail: data
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Cleanup service
   */
  cleanup() {
    this._cleanupListeners();
    this.profileCache.clear();
    this.initialized = false;
  }
}

// Create global profiles service instance
window.mentorBridgeProfiles = new MentorBridgeProfiles();

// Export profile completion types for global access
window.ProfileCompletion = {
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  COMPLETE: 'complete',
  VERIFIED: 'verified'
};

// Legacy compatibility functions
function initProfiles() {
  console.log('🔄 Initializing profiles (legacy function)...');
  return window.mentorBridgeProfiles.initialize();
}

function getCurrentUserProfile() {
  console.warn('getCurrentUserProfile() is deprecated. Use mentorBridgeProfiles.getCurrentUserProfile() instead.');
  return window.mentorBridgeProfiles.getCurrentUserProfile();
}

function updateProfile(updates) {
  console.warn('updateProfile() is deprecated. Use mentorBridgeProfiles.updateProfile() instead.');
  return window.mentorBridgeProfiles.updateProfile(updates);
}

function getProfile(userId) {
  console.warn('getProfile() is deprecated. Use mentorBridgeProfiles.getProfile() instead.');
  return window.mentorBridgeProfiles.getProfile(userId);
}

function searchProfiles(filters) {
  console.warn('searchProfiles() is deprecated. Use mentorBridgeProfiles.searchProfiles() instead.');
  return window.mentorBridgeProfiles.searchProfiles(filters);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeProfiles,
    ProfileCompletion: window.ProfileCompletion,
    initProfiles,
    getCurrentUserProfile,
    updateProfile,
    getProfile,
    searchProfiles
  };
}