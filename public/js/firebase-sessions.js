/* MentorBridge Firebase Sessions Service
 * Complete session management with Firebase integration
 * Version: 2.0 - Production Firebase sessions
 */

class MentorBridgeSessions {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.sessionListeners = new Map();
    this.sessionCache = new Map();
    
    // Session status types
    this.SessionStatus = {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      DECLINED: 'declined',
      SCHEDULED: 'scheduled',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      NO_SHOW: 'no_show'
    };

    // Session types
    this.SessionTypes = {
      ONE_ON_ONE: 'one_on_one',
      GROUP: 'group',
      WORKSHOP: 'workshop',
      CONSULTATION: 'consultation'
    };

    // Bind methods
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
  }

  /**
   * Initialize the sessions service
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      console.log('📅 Initializing MentorBridge Sessions...');

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
        await this._setupSessionListeners();
      }

      this.initialized = true;
      console.log('✅ Sessions service initialized');
      return this;

    } catch (error) {
      console.error('❌ Sessions initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication state changes
   */
  async _handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      await this._setupSessionListeners();
    } else {
      this._cleanupListeners();
      this.sessionCache.clear();
    }
  }

  /**
   * Set up real-time listeners for user's sessions
   */
  async _setupSessionListeners() {
    if (!this.currentUser) return;

    try {
      console.log('👂 Setting up session listeners for:', this.currentUser.uid);

      // Listen for sessions where user is mentor or student
      const mentorSessionsQuery = this.db.collection('sessions')
        .where('mentorId', '==', this.currentUser.uid)
        .orderBy('requestedAt', 'desc');

      const studentSessionsQuery = this.db.collection('sessions')
        .where('studentId', '==', this.currentUser.uid)
        .orderBy('requestedAt', 'desc');

      // Set up listeners
      const mentorUnsubscribe = mentorSessionsQuery.onSnapshot((snapshot) => {
        this._handleSessionsSnapshot(snapshot, 'mentor');
      });

      const studentUnsubscribe = studentSessionsQuery.onSnapshot((snapshot) => {
        this._handleSessionsSnapshot(snapshot, 'student');
      });

      this.sessionListeners.set('mentorSessions', mentorUnsubscribe);
      this.sessionListeners.set('studentSessions', studentUnsubscribe);

    } catch (error) {
      console.error('❌ Failed to setup session listeners:', error);
    }
  }

  /**
   * Handle sessions snapshot updates
   */
  _handleSessionsSnapshot(snapshot, role) {
    const sessions = [];

    snapshot.forEach((doc) => {
      const session = {
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        scheduledAt: doc.data().scheduledAt?.toDate() || null,
        completedAt: doc.data().completedAt?.toDate() || null,
        cancelledAt: doc.data().cancelledAt?.toDate() || null
      };
      sessions.push(session);
      this.sessionCache.set(doc.id, session);
    });

    console.log(`📅 Updated ${role} sessions: ${sessions.length} items`);

    // Trigger session update event
    this._dispatchEvent('sessionsUpdated', { 
      sessions: Array.from(this.sessionCache.values()),
      role 
    });
  }

  // ================================================================
  // SESSION MANAGEMENT
  // ================================================================

  /**
   * Request a new session with a mentor
   */
  async requestSession({
    mentorId,
    sessionType = this.SessionTypes.ONE_ON_ONE,
    topic,
    description,
    preferredTimes = [],
    duration = 60,
    location = 'virtual'
  }) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      console.log('📅 Requesting session with mentor:', mentorId);

      // Get mentor and student details
      const mentorDoc = await this.db.collection('users').doc(mentorId).get();
      const studentDoc = await this.db.collection('users').doc(this.currentUser.uid).get();

      if (!mentorDoc.exists) {
        throw new Error('Mentor not found');
      }

      if (!studentDoc.exists) {
        throw new Error('Student profile not found');
      }

      const mentorData = mentorDoc.data();
      const studentData = studentDoc.data();

      const session = {
        mentorId: mentorId,
        studentId: this.currentUser.uid,
        mentorName: mentorData.name || 'Unknown Mentor',
        studentName: studentData.name || 'Unknown Student',
        mentorEmail: mentorData.email || '',
        studentEmail: studentData.email || '',
        sessionType: sessionType,
        topic: topic,
        description: description || '',
        preferredTimes: preferredTimes.map(time => 
          firebase.firestore.Timestamp.fromDate(new Date(time))
        ),
        duration: duration,
        location: location,
        status: this.SessionStatus.PENDING,
        requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
        scheduledAt: null,
        completedAt: null,
        cancelledAt: null,
        notes: '',
        feedback: null,
        rating: null,
        metadata: {
          requestedBy: this.currentUser.uid,
          platform: 'web'
        }
      };

      const docRef = await this.db.collection('sessions').add(session);
      
      console.log('✅ Session requested:', docRef.id);

      // Create notification for mentor
      if (window.mentorBridgeNotifications) {
        await window.mentorBridgeNotifications.notifySessionRequest(
          mentorId,
          this.currentUser.uid,
          {
            sessionId: docRef.id,
            studentName: studentData.name,
            topic: topic,
            requestedTime: preferredTimes[0] || null
          }
        );
      }

      return {
        id: docRef.id,
        ...session,
        requestedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to request session:', error);
      throw error;
    }
  }

  /**
   * Accept a session request (mentor only)
   */
  async acceptSession(sessionId, scheduledTime, notes = '') {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      console.log('✅ Accepting session:', sessionId);

      // Get session details
      const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify user is the mentor
      if (sessionData.mentorId !== this.currentUser.uid) {
        throw new Error('Only the mentor can accept this session');
      }

      // Update session
      const updates = {
        status: this.SessionStatus.ACCEPTED,
        scheduledAt: firebase.firestore.Timestamp.fromDate(new Date(scheduledTime)),
        notes: notes,
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('sessions').doc(sessionId).update(updates);

      console.log('✅ Session accepted:', sessionId);

      // Create notification for student
      if (window.mentorBridgeNotifications) {
        await window.mentorBridgeNotifications.notifySessionAccepted(
          sessionData.studentId,
          this.currentUser.uid,
          {
            sessionId: sessionId,
            mentorName: sessionData.mentorName,
            scheduledTime: scheduledTime
          }
        );
      }

      return {
        id: sessionId,
        ...sessionData,
        ...updates,
        scheduledAt: new Date(scheduledTime),
        acceptedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to accept session:', error);
      throw error;
    }
  }

  /**
   * Decline a session request (mentor only)
   */
  async declineSession(sessionId, reason = '') {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      console.log('❌ Declining session:', sessionId);

      // Get session details
      const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify user is the mentor
      if (sessionData.mentorId !== this.currentUser.uid) {
        throw new Error('Only the mentor can decline this session');
      }

      // Update session
      const updates = {
        status: this.SessionStatus.DECLINED,
        declineReason: reason,
        declinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('sessions').doc(sessionId).update(updates);

      console.log('❌ Session declined:', sessionId);

      // Create notification for student
      if (window.mentorBridgeNotifications) {
        await window.mentorBridgeNotifications.createNotification({
          userId: sessionData.studentId,
          type: window.NotificationTypes.SESSION_DECLINED,
          title: 'Session Declined',
          message: `${sessionData.mentorName} declined your session request${reason ? ': ' + reason : ''}`,
          priority: 'normal',
          data: {
            sessionId: sessionId,
            mentorId: this.currentUser.uid,
            reason: reason
          }
        });
      }

      return {
        id: sessionId,
        ...sessionData,
        ...updates,
        declinedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to decline session:', error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId, feedback = '', rating = null, notes = '') {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      console.log('✅ Completing session:', sessionId);

      // Get session details
      const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify user is participant
      if (sessionData.mentorId !== this.currentUser.uid && sessionData.studentId !== this.currentUser.uid) {
        throw new Error('Only session participants can complete the session');
      }

      // Update session
      const updates = {
        status: this.SessionStatus.COMPLETED,
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Add feedback based on user role
      if (sessionData.studentId === this.currentUser.uid) {
        updates.studentFeedback = feedback;
        updates.studentRating = rating;
      } else {
        updates.mentorFeedback = feedback;
        updates.mentorNotes = notes;
      }

      await this.db.collection('sessions').doc(sessionId).update(updates);

      console.log('✅ Session completed:', sessionId);

      return {
        id: sessionId,
        ...sessionData,
        ...updates,
        completedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId, reason = '') {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      console.log('🚫 Cancelling session:', sessionId);

      // Get session details
      const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();

      // Verify user is participant
      if (sessionData.mentorId !== this.currentUser.uid && sessionData.studentId !== this.currentUser.uid) {
        throw new Error('Only session participants can cancel the session');
      }

      // Update session
      const updates = {
        status: this.SessionStatus.CANCELLED,
        cancelReason: reason,
        cancelledBy: this.currentUser.uid,
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('sessions').doc(sessionId).update(updates);

      console.log('🚫 Session cancelled:', sessionId);

      // Notify the other participant
      const otherUserId = sessionData.mentorId === this.currentUser.uid 
        ? sessionData.studentId 
        : sessionData.mentorId;
      
      const otherUserName = sessionData.mentorId === this.currentUser.uid 
        ? sessionData.studentName 
        : sessionData.mentorName;

      if (window.mentorBridgeNotifications) {
        await window.mentorBridgeNotifications.createNotification({
          userId: otherUserId,
          type: window.NotificationTypes.SYSTEM,
          title: 'Session Cancelled',
          message: `${otherUserName} cancelled the session${reason ? ': ' + reason : ''}`,
          priority: 'high',
          data: {
            sessionId: sessionId,
            cancelledBy: this.currentUser.uid,
            reason: reason
          }
        });
      }

      return {
        id: sessionId,
        ...sessionData,
        ...updates,
        cancelledAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to cancel session:', error);
      throw error;
    }
  }

  // ================================================================
  // QUERY METHODS
  // ================================================================

  /**
   * Get user's sessions with filters
   */
  async getSessions(filters = {}) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Sessions service not initialized or user not authenticated');
    }

    try {
      // Return cached sessions if available and no specific filters
      if (this.sessionCache.size > 0 && Object.keys(filters).length === 0) {
        return Array.from(this.sessionCache.values())
          .sort((a, b) => b.requestedAt - a.requestedAt);
      }

      let mentorQuery = this.db.collection('sessions')
        .where('mentorId', '==', this.currentUser.uid);

      let studentQuery = this.db.collection('sessions')
        .where('studentId', '==', this.currentUser.uid);

      // Apply filters
      if (filters.status) {
        mentorQuery = mentorQuery.where('status', '==', filters.status);
        studentQuery = studentQuery.where('status', '==', filters.status);
      }

      if (filters.role === 'mentor') {
        const snapshot = await mentorQuery.orderBy('requestedAt', 'desc').get();
        return this._processSessionsSnapshot(snapshot);
      } else if (filters.role === 'student') {
        const snapshot = await studentQuery.orderBy('requestedAt', 'desc').get();
        return this._processSessionsSnapshot(snapshot);
      }

      // Get both mentor and student sessions
      const [mentorSnapshot, studentSnapshot] = await Promise.all([
        mentorQuery.orderBy('requestedAt', 'desc').get(),
        studentQuery.orderBy('requestedAt', 'desc').get()
      ]);

      const mentorSessions = this._processSessionsSnapshot(mentorSnapshot);
      const studentSessions = this._processSessionsSnapshot(studentSnapshot);

      // Combine and sort
      return [...mentorSessions, ...studentSessions]
        .sort((a, b) => b.requestedAt - a.requestedAt);

    } catch (error) {
      console.error('❌ Failed to get sessions:', error);
      throw error;
    }
  }

  /**
   * Process sessions snapshot
   */
  _processSessionsSnapshot(snapshot) {
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate() || new Date(),
      scheduledAt: doc.data().scheduledAt?.toDate() || null,
      completedAt: doc.data().completedAt?.toDate() || null,
      cancelledAt: doc.data().cancelledAt?.toDate() || null
    }));
  }

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions() {
    const sessions = await this.getSessions({
      status: this.SessionStatus.ACCEPTED
    });

    const now = new Date();
    return sessions.filter(session => 
      session.scheduledAt && session.scheduledAt > now
    ).sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Get pending session requests
   */
  async getPendingSessions() {
    return this.getSessions({
      status: this.SessionStatus.PENDING
    });
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    try {
      // Check cache first
      if (this.sessionCache.has(sessionId)) {
        return this.sessionCache.get(sessionId);
      }

      // Fetch from Firestore
      const doc = await this.db.collection('sessions').doc(sessionId).get();
      
      if (doc.exists) {
        const session = {
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate() || new Date(),
          scheduledAt: doc.data().scheduledAt?.toDate() || null,
          completedAt: doc.data().completedAt?.toDate() || null,
          cancelledAt: doc.data().cancelledAt?.toDate() || null
        };

        this.sessionCache.set(sessionId, session);
        return session;
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get session:', error);
      throw error;
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Clean up listeners
   */
  _cleanupListeners() {
    this.sessionListeners.forEach(unsubscribe => unsubscribe());
    this.sessionListeners.clear();
  }

  /**
   * Dispatch custom events
   */
  _dispatchEvent(eventName, data) {
    const event = new CustomEvent(`mentorbridge-sessions-${eventName}`, {
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
    this.sessionCache.clear();
    this.initialized = false;
  }
}

// Create global sessions service instance
window.mentorBridgeSessions = new MentorBridgeSessions();

// Export session types for global access
window.SessionStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

window.SessionTypes = {
  ONE_ON_ONE: 'one_on_one',
  GROUP: 'group',
  WORKSHOP: 'workshop',
  CONSULTATION: 'consultation'
};

// Legacy compatibility functions
function initSessions() {
  console.log('🔄 Initializing sessions (legacy function)...');
  return window.mentorBridgeSessions.initialize();
}

function requestSession(data) {
  console.warn('requestSession() is deprecated. Use mentorBridgeSessions.requestSession() instead.');
  return window.mentorBridgeSessions.requestSession(data);
}

function getSessions() {
  console.warn('getSessions() is deprecated. Use mentorBridgeSessions.getSessions() instead.');
  return window.mentorBridgeSessions.getSessions();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeSessions,
    SessionStatus: window.SessionStatus,
    SessionTypes: window.SessionTypes,
    initSessions,
    requestSession,
    getSessions
  };
}