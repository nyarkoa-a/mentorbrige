/* MentorBridge Firebase Notifications Service
 * Real-time notification system with Firebase integration
 * Version: 2.0 - Production Firebase notifications
 */

class MentorBridgeNotifications {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.notificationListeners = new Map();
    this.notificationCache = new Map();
    
    // Notification types
    this.NotificationTypes = {
      SESSION_REQUEST: 'session_request',
      SESSION_ACCEPTED: 'session_accepted', 
      SESSION_DECLINED: 'session_declined',
      SESSION_REMINDER: 'session_reminder',
      MESSAGE: 'message',
      MENTOR_APPROVED: 'mentor_approved',
      MENTOR_REJECTED: 'mentor_rejected',
      SYSTEM: 'system',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      INFO: 'info'
    };

    // Notification priorities
    this.NotificationPriority = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };

    // Bind methods
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
  }

  /**
   * Initialize the notifications service
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      console.log('🔔 Initializing MentorBridge Notifications...');

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
        await this._setupNotificationListeners();
      }

      // Request notification permission
      await this._requestNotificationPermission();

      this.initialized = true;
      console.log('✅ Notifications service initialized');
      return this;

    } catch (error) {
      console.error('❌ Notifications initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication state changes
   */
  async _handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      await this._setupNotificationListeners();
    } else {
      this._cleanupListeners();
      this.notificationCache.clear();
    }
  }

  /**
   * Set up real-time listeners for user's notifications
   */
  async _setupNotificationListeners() {
    if (!this.currentUser) return;

    try {
      console.log('👂 Setting up notification listeners for:', this.currentUser.uid);

      // Listen for user's notifications
      const notificationsQuery = this.db.collection('notifications')
        .where('userId', '==', this.currentUser.uid)
        .where('deletedAt', '==', null)
        .orderBy('createdAt', 'desc')
        .limit(100);

      const unsubscribe = notificationsQuery.onSnapshot((snapshot) => {
        this._handleNotificationsSnapshot(snapshot);
      });

      this.notificationListeners.set('notifications', unsubscribe);

    } catch (error) {
      console.error('❌ Failed to setup notification listeners:', error);
    }
  }

  /**
   * Handle notifications snapshot updates
   */
  _handleNotificationsSnapshot(snapshot) {
    const notifications = [];
    let newNotifications = [];

    snapshot.docChanges().forEach((change) => {
      const notification = {
        id: change.doc.id,
        ...change.doc.data(),
        createdAt: change.doc.data().createdAt?.toDate() || new Date(),
        readAt: change.doc.data().readAt?.toDate() || null,
        deletedAt: change.doc.data().deletedAt?.toDate() || null
      };

      if (change.type === 'added') {
        // Check if this is a new notification
        if (!this.notificationCache.has(change.doc.id)) {
          newNotifications.push(notification);
        }
      }

      notifications.push(notification);
      this.notificationCache.set(change.doc.id, notification);
    });

    console.log(`🔔 Updated notifications: ${notifications.length} items`);

    // Show browser notifications for new notifications
    newNotifications.forEach(notification => {
      this._showBrowserNotification(notification);
    });

    // Trigger notification update event
    this._dispatchEvent('notificationsUpdated', { 
      notifications: Array.from(this.notificationCache.values())
        .sort((a, b) => b.createdAt - a.createdAt),
      newNotifications 
    });
  }

  // ================================================================
  // NOTIFICATION MANAGEMENT
  // ================================================================

  /**
   * Create a new notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    priority = this.NotificationPriority.NORMAL,
    data = {},
    actionUrl = null,
    expiresAt = null,
    sendBrowserNotification = true
  }) {
    if (!this.initialized) {
      throw new Error('Notifications service not initialized');
    }

    try {
      // Default to current user if no userId provided
      const targetUserId = userId || this.currentUser?.uid;
      if (!targetUserId) {
        throw new Error('No target user ID provided');
      }

      console.log('🔔 Creating notification for user:', targetUserId);

      const notification = {
        userId: targetUserId,
        type: type,
        title: title,
        message: message,
        priority: priority,
        data: data,
        actionUrl: actionUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        readAt: null,
        deletedAt: null,
        expiresAt: expiresAt ? firebase.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
        metadata: {
          createdBy: this.currentUser?.uid || 'system',
          source: 'mentorbridge_web'
        }
      };

      const docRef = await this.db.collection('notifications').add(notification);
      
      console.log('✅ Notification created:', docRef.id);

      const createdNotification = {
        id: docRef.id,
        ...notification,
        createdAt: new Date()
      };

      // Show browser notification if enabled and it's for current user
      if (sendBrowserNotification && targetUserId === this.currentUser?.uid) {
        this._showBrowserNotification(createdNotification);
      }

      return createdNotification;

    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for multiple users
   */
  async createBulkNotifications(userIds, notificationData) {
    if (!this.initialized) {
      throw new Error('Notifications service not initialized');
    }

    try {
      console.log('🔔 Creating bulk notifications for users:', userIds.length);

      const batch = this.db.batch();
      const notifications = [];

      userIds.forEach(userId => {
        const notification = {
          userId: userId,
          ...notificationData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          readAt: null,
          deletedAt: null,
          metadata: {
            createdBy: this.currentUser?.uid || 'system',
            source: 'mentorbridge_web'
          }
        };

        const docRef = this.db.collection('notifications').doc();
        batch.set(docRef, notification);

        notifications.push({
          id: docRef.id,
          ...notification,
          createdAt: new Date()
        });
      });

      await batch.commit();
      console.log('✅ Bulk notifications created:', notifications.length);

      return notifications;

    } catch (error) {
      console.error('❌ Failed to create bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user's notifications
   */
  async getNotifications(filters = {}) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Notifications service not initialized or user not authenticated');
    }

    try {
      // Return cached notifications if available and no specific filters
      if (this.notificationCache.size > 0 && Object.keys(filters).length === 0) {
        return Array.from(this.notificationCache.values())
          .sort((a, b) => b.createdAt - a.createdAt);
      }

      // Build query
      let query = this.db.collection('notifications')
        .where('userId', '==', this.currentUser.uid)
        .where('deletedAt', '==', null);

      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }

      if (filters.unreadOnly) {
        query = query.where('readAt', '==', null);
      }

      if (filters.priority) {
        query = query.where('priority', '==', filters.priority);
      }

      query = query.orderBy('createdAt', 'desc');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate() || null,
        deletedAt: doc.data().deletedAt?.toDate() || null
      }));

      return notifications;

    } catch (error) {
      console.error('❌ Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Notifications service not initialized or user not authenticated');
    }

    try {
      console.log('👁️ Marking notification as read:', notificationId);

      await this.db.collection('notifications').doc(notificationId).update({
        readAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update cache
      if (this.notificationCache.has(notificationId)) {
        const notification = this.notificationCache.get(notificationId);
        notification.readAt = new Date();
        this.notificationCache.set(notificationId, notification);
      }

      console.log('✅ Notification marked as read');

    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Notifications service not initialized or user not authenticated');
    }

    try {
      console.log('👁️ Marking all notifications as read');

      const unreadNotifications = await this.db.collection('notifications')
        .where('userId', '==', this.currentUser.uid)
        .where('readAt', '==', null)
        .where('deletedAt', '==', null)
        .get();

      const batch = this.db.batch();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();

      unreadNotifications.forEach(doc => {
        batch.update(doc.ref, { readAt: timestamp });
      });

      await batch.commit();

      // Update cache
      this.notificationCache.forEach(notification => {
        if (!notification.readAt) {
          notification.readAt = new Date();
        }
      });

      console.log('✅ All notifications marked as read');

    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification (soft delete)
   */
  async deleteNotification(notificationId) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Notifications service not initialized or user not authenticated');
    }

    try {
      console.log('🗑️ Deleting notification:', notificationId);

      await this.db.collection('notifications').doc(notificationId).update({
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Remove from cache
      this.notificationCache.delete(notificationId);

      console.log('✅ Notification deleted');

    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    if (!this.initialized || !this.currentUser) {
      return 0;
    }

    try {
      const unreadNotifications = Array.from(this.notificationCache.values())
        .filter(notification => !notification.readAt && !notification.deletedAt);

      return unreadNotifications.length;

    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  // ================================================================
  // BROWSER NOTIFICATIONS
  // ================================================================

  /**
   * Request notification permission from browser
   */
  async _requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show browser notification
   */
  _showBrowserNotification(notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const options = {
        body: notification.message,
        icon: '/assets/logo.png',
        badge: '/assets/logo.png',
        tag: notification.id,
        timestamp: notification.createdAt.getTime(),
        requireInteraction: notification.priority === this.NotificationPriority.URGENT,
        data: {
          notificationId: notification.id,
          actionUrl: notification.actionUrl,
          ...notification.data
        }
      };

      const browserNotification = new Notification(notification.title, options);

      // Handle notification click
      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        browserNotification.close();
        
        // Mark as read when clicked
        this.markAsRead(notification.id);
      };

      // Auto-close after delay
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

    } catch (error) {
      console.error('❌ Failed to show browser notification:', error);
    }
  }

  // ================================================================
  // CONVENIENCE METHODS
  // ================================================================

  /**
   * Create session-related notifications
   */
  async notifySessionRequest(mentorId, studentId, sessionData) {
    return this.createNotification({
      userId: mentorId,
      type: this.NotificationTypes.SESSION_REQUEST,
      title: 'New Session Request',
      message: `${sessionData.studentName} has requested a mentorship session`,
      priority: this.NotificationPriority.HIGH,
      data: {
        sessionId: sessionData.sessionId,
        studentId: studentId,
        requestedTime: sessionData.requestedTime
      },
      actionUrl: `/pages/sessions.html?session=${sessionData.sessionId}`
    });
  }

  async notifySessionAccepted(studentId, mentorId, sessionData) {
    return this.createNotification({
      userId: studentId,
      type: this.NotificationTypes.SESSION_ACCEPTED,
      title: 'Session Accepted!',
      message: `${sessionData.mentorName} has accepted your session request`,
      priority: this.NotificationPriority.HIGH,
      data: {
        sessionId: sessionData.sessionId,
        mentorId: mentorId,
        scheduledTime: sessionData.scheduledTime
      },
      actionUrl: `/pages/sessions.html?session=${sessionData.sessionId}`
    });
  }

  async notifyNewMessage(userId, senderId, messageData) {
    return this.createNotification({
      userId: userId,
      type: this.NotificationTypes.MESSAGE,
      title: `New message from ${messageData.senderName}`,
      message: messageData.preview,
      priority: this.NotificationPriority.NORMAL,
      data: {
        conversationId: messageData.conversationId,
        senderId: senderId
      },
      actionUrl: `/pages/messages.html?conversation=${messageData.conversationId}`
    });
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Clean up listeners
   */
  _cleanupListeners() {
    this.notificationListeners.forEach(unsubscribe => unsubscribe());
    this.notificationListeners.clear();
  }

  /**
   * Dispatch custom events
   */
  _dispatchEvent(eventName, data) {
    const event = new CustomEvent(`mentorbridge-notifications-${eventName}`, {
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
    this.notificationCache.clear();
    this.initialized = false;
  }
}

// Create global notifications service instance
window.mentorBridgeNotifications = new MentorBridgeNotifications();

// Export notification types for global access
window.NotificationTypes = {
  SESSION_REQUEST: 'session_request',
  SESSION_ACCEPTED: 'session_accepted',
  SESSION_DECLINED: 'session_declined',
  SESSION_REMINDER: 'session_reminder',
  MESSAGE: 'message',
  MENTOR_APPROVED: 'mentor_approved',
  MENTOR_REJECTED: 'mentor_rejected',
  SYSTEM: 'system',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

// Legacy compatibility functions
function initNotifications() {
  console.log('🔄 Initializing notifications (legacy function)...');
  return window.mentorBridgeNotifications.initialize();
}

function createNotification(data) {
  console.warn('createNotification() is deprecated. Use mentorBridgeNotifications.createNotification() instead.');
  return window.mentorBridgeNotifications.createNotification(data);
}

function getNotifications() {
  console.warn('getNotifications() is deprecated. Use mentorBridgeNotifications.getNotifications() instead.');
  return window.mentorBridgeNotifications.getNotifications();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeNotifications,
    NotificationTypes: window.NotificationTypes,
    initNotifications,
    createNotification,
    getNotifications
  };
}