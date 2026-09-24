/* MentorBridge Firebase Persistent Application Data Service
 * Complete data persistence for goals, progress, settings, and application state
 * Version: 1.0 - Comprehensive data management
 */

class MentorBridgeData {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.dataCache = new Map();
    this.dataListeners = new Map();
    
    // Data types for organization
    this.DataTypes = {
      GOALS: 'goals',
      PROGRESS: 'progress', 
      SETTINGS: 'settings',
      PREFERENCES: 'preferences',
      ACHIEVEMENTS: 'achievements',
      RESOURCES: 'resources',
      ANALYTICS: 'analytics'
    };

    // Goal status types
    this.GoalStatus = {
      ACTIVE: 'active',
      COMPLETED: 'completed',
      PAUSED: 'paused',
      CANCELLED: 'cancelled'
    };

    // Bind methods
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
  }

  /**
   * Initialize the data service
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      console.log('💾 Initializing MentorBridge Data...');

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
        await this._setupDataListeners();
      }

      this.initialized = true;
      console.log('✅ Data service initialized');
      return this;

    } catch (error) {
      console.error('❌ Data initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication state changes
   */
  async _handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      await this._setupDataListeners();
    } else {
      this._cleanupListeners();
      this.dataCache.clear();
    }
  }

  /**
   * Set up real-time data listeners for current user
   */
  async _setupDataListeners() {
    if (!this.currentUser) return;

    try {
      // Clean up existing listeners
      this._cleanupListeners();

      console.log('👂 Setting up data listeners for:', this.currentUser.uid);

      // Listen for user's goals
      const goalsQuery = this.db.collection('goals')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('createdAt', 'desc');

      const goalsUnsubscribe = goalsQuery.onSnapshot((snapshot) => {
        this._handleDataSnapshot(snapshot, this.DataTypes.GOALS);
      });

      // Listen for user's settings
      const settingsDoc = this.db.collection('userSettings').doc(this.currentUser.uid);
      const settingsUnsubscribe = settingsDoc.onSnapshot((doc) => {
        if (doc.exists) {
          this._cacheData(this.DataTypes.SETTINGS, doc.data());
        }
      });

      this.dataListeners.set('goals', goalsUnsubscribe);
      this.dataListeners.set('settings', settingsUnsubscribe);

    } catch (error) {
      console.error('❌ Failed to setup data listeners:', error);
    }
  }

  /**
   * Handle data snapshot updates
   */
  _handleDataSnapshot(snapshot, dataType) {
    try {
      const items = [];

      snapshot.forEach((doc) => {
        const item = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        };
        items.push(item);
      });

      this._cacheData(dataType, items);
      console.log(`💾 Updated ${dataType}: ${items.length} items`);

    } catch (error) {
      console.error('❌ Error handling data snapshot:', error);
    }
  }

  // ================================================================
  // GOALS MANAGEMENT
  // ================================================================

  /**
   * Create a new goal
   */
  async createGoal(goalData) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      console.log('🎯 Creating new goal...');

      const goal = {
        userId: this.currentUser.uid,
        title: goalData.title,
        description: goalData.description || '',
        category: goalData.category || 'general',
        targetDate: goalData.targetDate ? firebase.firestore.Timestamp.fromDate(new Date(goalData.targetDate)) : null,
        status: this.GoalStatus.ACTIVE,
        progress: 0,
        milestones: goalData.milestones || [],
        priority: goalData.priority || 'medium',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: {
          createdBy: this.currentUser.uid,
          source: 'user_created'
        }
      };

      const docRef = await this.db.collection('goals').add(goal);
      
      console.log('✅ Goal created:', docRef.id);

      return {
        id: docRef.id,
        ...goal,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to create goal:', error);
      throw error;
    }
  }

  /**
   * Update goal
   */
  async updateGoal(goalId, updates) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Convert dates to Firestore timestamps
      if (updates.targetDate) {
        updateData.targetDate = firebase.firestore.Timestamp.fromDate(new Date(updates.targetDate));
      }

      await this.db.collection('goals').doc(goalId).update(updateData);
      
      console.log('✅ Goal updated:', goalId);

    } catch (error) {
      console.error('❌ Failed to update goal:', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId, progress, note = '') {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      const updateData = {
        progress: Math.max(0, Math.min(100, progress)),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (progress >= 100) {
        updateData.status = this.GoalStatus.COMPLETED;
        updateData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      if (note) {
        updateData[`progressNotes.${Date.now()}`] = {
          note: note,
          progress: progress,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
      }

      await this.db.collection('goals').doc(goalId).update(updateData);
      
      console.log('✅ Goal progress updated:', goalId, progress + '%');

    } catch (error) {
      console.error('❌ Failed to update goal progress:', error);
      throw error;
    }
  }

  /**
   * Get user goals
   */
  async getGoals(filters = {}) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      // Check cache first
      const cachedGoals = this.dataCache.get(this.DataTypes.GOALS);
      if (cachedGoals && !filters.forceRefresh) {
        return this._applyGoalFilters(cachedGoals, filters);
      }

      let query = this.db.collection('goals')
        .where('userId', '==', this.currentUser.uid);

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      query = query.orderBy('createdAt', 'desc');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        targetDate: doc.data().targetDate?.toDate() || null
      }));

      return goals;

    } catch (error) {
      console.error('❌ Failed to get goals:', error);
      throw error;
    }
  }

  /**
   * Apply filters to goals array
   */
  _applyGoalFilters(goals, filters) {
    let filtered = [...goals];

    if (filters.status) {
      filtered = filtered.filter(goal => goal.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(goal => goal.category === filters.category);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // ================================================================
  // SETTINGS MANAGEMENT
  // ================================================================

  /**
   * Save user settings
   */
  async saveSettings(settings) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      console.log('⚙️ Saving user settings...');

      const settingsData = {
        ...settings,
        userId: this.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('userSettings').doc(this.currentUser.uid).set(settingsData, { merge: true });
      
      // Update cache
      this._cacheData(this.DataTypes.SETTINGS, settingsData);
      
      console.log('✅ Settings saved');

    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getSettings() {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      // Check cache first
      const cachedSettings = this.dataCache.get(this.DataTypes.SETTINGS);
      if (cachedSettings) {
        return cachedSettings;
      }

      const doc = await this.db.collection('userSettings').doc(this.currentUser.uid).get();
      
      if (doc.exists) {
        const settings = doc.data();
        this._cacheData(this.DataTypes.SETTINGS, settings);
        return settings;
      } else {
        // Return default settings
        const defaultSettings = this._getDefaultSettings();
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }

    } catch (error) {
      console.error('❌ Failed to get settings:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  _getDefaultSettings() {
    return {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sessions: true,
        messages: true,
        system: true
      },
      privacy: {
        profileVisible: true,
        contactVisible: true,
        progressVisible: false
      },
      preferences: {
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h'
      }
    };
  }

  // ================================================================
  // ACHIEVEMENTS MANAGEMENT
  // ================================================================

  /**
   * Award achievement to user
   */
  async awardAchievement(achievementData) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      const achievement = {
        userId: this.currentUser.uid,
        type: achievementData.type,
        title: achievementData.title,
        description: achievementData.description,
        points: achievementData.points || 0,
        badge: achievementData.badge || null,
        awardedAt: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: achievementData.metadata || {}
      };

      await this.db.collection('achievements').add(achievement);
      
      // Send notification
      if (window.mentorBridgeNotifications) {
        await window.mentorBridgeNotifications.createNotification({
          type: window.NotificationTypes.SUCCESS,
          title: 'Achievement Unlocked! 🏆',
          message: `You earned: ${achievementData.title}`,
          data: { achievement: achievement }
        });
      }

      console.log('🏆 Achievement awarded:', achievementData.title);

    } catch (error) {
      console.error('❌ Failed to award achievement:', error);
      throw error;
    }
  }

  /**
   * Get user achievements
   */
  async getAchievements() {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      const snapshot = await this.db.collection('achievements')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('awardedAt', 'desc')
        .get();

      const achievements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        awardedAt: doc.data().awardedAt?.toDate() || new Date()
      }));

      return achievements;

    } catch (error) {
      console.error('❌ Failed to get achievements:', error);
      throw error;
    }
  }

  // ================================================================
  // ANALYTICS AND TRACKING
  // ================================================================

  /**
   * Track user activity
   */
  async trackActivity(activityData) {
    if (!this.initialized || !this.currentUser) {
      return; // Fail silently for analytics
    }

    try {
      const activity = {
        userId: this.currentUser.uid,
        action: activityData.action,
        category: activityData.category || 'general',
        data: activityData.data || {},
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        session: activityData.session || null,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        }
      };

      // Use subcollection for better performance
      await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activities').add(activity);

    } catch (error) {
      console.warn('⚠️ Analytics tracking failed:', error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Get user analytics summary
   */
  async getAnalyticsSummary(days = 30) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Data service not initialized or user not authenticated');
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('activities')
        .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(cutoffDate))
        .get();

      const activities = snapshot.docs.map(doc => doc.data());

      // Calculate summary statistics
      const summary = {
        totalActivities: activities.length,
        categoryCounts: {},
        actionCounts: {},
        dailyActivity: {},
        period: `${days} days`
      };

      activities.forEach(activity => {
        // Count by category
        summary.categoryCounts[activity.category] = (summary.categoryCounts[activity.category] || 0) + 1;
        
        // Count by action
        summary.actionCounts[activity.action] = (summary.actionCounts[activity.action] || 0) + 1;
        
        // Count by day
        const day = activity.timestamp.toDate().toDateString();
        summary.dailyActivity[day] = (summary.dailyActivity[day] || 0) + 1;
      });

      return summary;

    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error);
      throw error;
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Cache data locally
   */
  _cacheData(dataType, data) {
    this.dataCache.set(dataType, data);
  }

  /**
   * Get cached data
   */
  getCachedData(dataType) {
    return this.dataCache.get(dataType);
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.dataCache.clear();
  }

  /**
   * Clean up listeners
   */
  _cleanupListeners() {
    this.dataListeners.forEach(unsubscribe => unsubscribe());
    this.dataListeners.clear();
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create global data service instance
window.mentorBridgeData = new MentorBridgeData();

// Export enums for global access
window.DataTypes = {
  GOALS: 'goals',
  PROGRESS: 'progress',
  SETTINGS: 'settings',
  PREFERENCES: 'preferences',
  ACHIEVEMENTS: 'achievements',
  RESOURCES: 'resources',
  ANALYTICS: 'analytics'
};

window.GoalStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

// Legacy compatibility functions
function initData() {
  console.log('🔄 Initializing data (legacy function)...');
  return window.mentorBridgeData.initialize();
}

function saveUserSettings(settings) {
  console.warn('saveUserSettings() is deprecated. Use mentorBridgeData.saveSettings() instead.');
  return window.mentorBridgeData.saveSettings(settings);
}

function getUserSettings() {
  console.warn('getUserSettings() is deprecated. Use mentorBridgeData.getSettings() instead.');
  return window.mentorBridgeData.getSettings();
}

function createGoal(goalData) {
  console.warn('createGoal() is deprecated. Use mentorBridgeData.createGoal() instead.');
  return window.mentorBridgeData.createGoal(goalData);
}

function updateGoal(goalId, updates) {
  console.warn('updateGoal() is deprecated. Use mentorBridgeData.updateGoal() instead.');
  return window.mentorBridgeData.updateGoal(goalId, updates);
}

function getGoals(filters) {
  console.warn('getGoals() is deprecated. Use mentorBridgeData.getGoals() instead.');
  return window.mentorBridgeData.getGoals(filters);
}

function trackUserActivity(activity) {
  console.warn('trackUserActivity() is deprecated. Use mentorBridgeData.trackActivity() instead.');
  return window.mentorBridgeData.trackActivity(activity);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeData,
    DataTypes: window.DataTypes,
    GoalStatus: window.GoalStatus,
    initData,
    saveUserSettings,
    getUserSettings,
    createGoal,
    updateGoal,
    getGoals,
    trackUserActivity
  };
}