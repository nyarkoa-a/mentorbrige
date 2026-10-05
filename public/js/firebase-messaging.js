/* MentorBridge Firebase Real-time Messaging Service
 * Complete messaging system with real-time conversations and notifications
 * Version: 2.0 - Production Firebase integration
 */

class MentorBridgeMessaging {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.activeListeners = new Map();
    this.conversationCache = new Map();
    this.messageListeners = new Map();
    
    // Message types
    this.MessageTypes = {
      TEXT: 'text',
      SESSION_REQUEST: 'session_request',
      SESSION_ACCEPTED: 'session_accepted',
      SESSION_DECLINED: 'session_declined',
      SYSTEM: 'system'
    };

    // Bind methods
    this._handleAuthStateChange = this._handleAuthStateChange.bind(this);
  }

  /**
   * Initialize the messaging service
   */
  async initialize() {
    if (this.initialized) return this;

    try {
      console.log('💬 Initializing MentorBridge Messaging...');

      // Wait for Firebase services
      if (!window.firebaseService) {
        throw new Error('Firebase service not available');
      }

      await window.firebaseService.initialize();
      
      this.db = window.firebaseService.getDb();
      this.auth = window.firebaseService.getAuth();

      // Set up auth state listener
      this.auth.onAuthStateChanged(this._handleAuthStateChange);
      this._syncCurrentUser();

      if (this.currentUser) {
        await this._setupUserConversations();
      }

      this.initialized = true;
      console.log('✅ Messaging service initialized');
      return this;

    } catch (error) {
      console.error('❌ Messaging initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sync current user from Firebase Auth or sessionStorage
   */
  _syncCurrentUser() {
    if (this.auth && this.auth.currentUser) {
      this.currentUser = this.auth.currentUser;
      return this.currentUser;
    }
    try {
      const session = JSON.parse(sessionStorage.getItem('mb_session') || '{}');
      if (session && session.uid) {
        this.currentUser = {
          uid: session.uid,
          email: session.email || '',
          name: session.name || 'User',
          displayName: session.name || 'User',
          role: session.role || 'student'
        };
        return this.currentUser;
      }
    } catch (e) {}
    return this.currentUser;
  }

  /**
   * Handle authentication state changes
   */
  async _handleAuthStateChange(user) {
    this.currentUser = user || this._syncCurrentUser();

    if (this.currentUser) {
      await this._setupUserConversations();
    } else {
      this._cleanupListeners();
      this.conversationCache.clear();
    }
  }

  /**
   * Set up real-time listeners for user's conversations
   */
  async _setupUserConversations() {
    if (!this.currentUser) return;

    try {
      console.log('👂 Setting up conversation listeners for:', this.currentUser.uid);

      // Listen for user's conversations
      const conversationsQuery = this.db.collection('conversations')
        .where('participants', 'array-contains', this.currentUser.uid)
        .orderBy('lastMessageAt', 'desc');

      const unsubscribe = conversationsQuery.onSnapshot((snapshot) => {
        this._handleConversationsSnapshot(snapshot);
      });

      this.activeListeners.set('conversations', unsubscribe);

    } catch (error) {
      console.error('❌ Failed to setup conversation listeners:', error);
    }
  }

  /**
   * Handle conversations snapshot updates
   */
  _handleConversationsSnapshot(snapshot) {
    const conversations = [];

    snapshot.forEach((doc) => {
      const conversation = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      };
      conversations.push(conversation);
      this.conversationCache.set(doc.id, conversation);
    });

    console.log(`💬 Updated conversations: ${conversations.length} items`);

    // Trigger conversation list update event
    this._dispatchEvent('conversationsUpdated', { conversations });
  }

  // ================================================================
  // CONVERSATION MANAGEMENT
  // ================================================================

  /**
   * Create a new conversation between users
   */
  async createConversation(participantIds, initialMessage = null) {
    this._syncCurrentUser();
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      // Ensure current user is included in participants
      const participants = [...new Set([this.currentUser.uid, ...participantIds])];
      
      // Check if conversation already exists
      const existingConversation = await this._findExistingConversation(participants);
      if (existingConversation) {
        return existingConversation;
      }

      console.log('💬 Creating new conversation with participants:', participants);

      const conversation = {
        participants: participants,
        participantDetails: await this._getParticipantDetails(participants),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: initialMessage ? {
          text: initialMessage.text,
          senderId: this.currentUser.uid,
          type: initialMessage.type || this.MessageTypes.TEXT
        } : null,
        messageCount: 0,
        unreadCounts: participants.reduce((acc, uid) => {
          acc[uid] = 0;
          return acc;
        }, {}),
        metadata: {
          createdBy: this.currentUser.uid
        }
      };

      const docRef = await this.db.collection('conversations').add(conversation);
      
      const createdConversation = {
        id: docRef.id,
        ...conversation,
        createdAt: new Date(),
        lastMessageAt: new Date()
      };

      console.log('✅ Conversation created:', docRef.id);

      // Send initial message if provided
      if (initialMessage) {
        await this.sendMessage(docRef.id, initialMessage.text, initialMessage.type);
      }

      return createdConversation;

    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation between participants
   */
  async _findExistingConversation(participants) {
    try {
      const snapshot = await this.db.collection('conversations')
        .where('participants', '==', participants.sort())
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to find existing conversation:', error);
      return null;
    }
  }

  /**
   * Get participant details for conversation
   */
  async _getParticipantDetails(participantIds) {
    try {
      const details = {};
      
      for (const uid of participantIds) {
        const userDoc = await this.db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          details[uid] = {
            name: userData.name || 'Unknown User',
            email: userData.email || '',
            role: userData.role || 'user',
            profilePhoto: userData.profilePhoto || null
          };
        }
      }

      return details;
    } catch (error) {
      console.error('❌ Failed to get participant details:', error);
      return {};
    }
  }

  /**
   * Get user's conversations
   */
  async getConversations() {
    this._syncCurrentUser();
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      // Fetch from Firestore
      const snapshot = await this.db.collection('conversations')
        .where('participants', 'array-contains', this.currentUser.uid)
        .get();

      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      }));

      // Sort by lastMessageAt descending in memory (avoids requiring a composite index)
      conversations.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

      // Cache conversations
      conversations.forEach(conv => {
        this.conversationCache.set(conv.id, conv);
      });

      return conversations;

    } catch (error) {
      console.error('❌ Failed to get conversations:', error);
      throw error;
    }
  }

  // ================================================================
  // MESSAGE MANAGEMENT
  // ================================================================

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId, text, type = this.MessageTypes.TEXT, metadata = {}) {
    this._syncCurrentUser();
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      console.log('📤 Sending message to conversation:', conversationId);

      const message = {
        conversationId: conversationId,
        senderId: this.currentUser.uid,
        senderName: this.currentUser.displayName || this.currentUser.name || 'Unknown User',
        text: text,
        type: type,
        sentAt: firebase.firestore.FieldValue.serverTimestamp(),
        readBy: {
          [this.currentUser.uid]: firebase.firestore.FieldValue.serverTimestamp()
        },
        metadata: metadata
      };

      // Add message to messages collection
      const messageRef = await this.db.collection('messages').add(message);

      // Update conversation with last message info
      await this.db.collection('conversations').doc(conversationId).update({
        lastMessage: {
          text: text,
          senderId: this.currentUser.uid,
          senderName: message.senderName,
          type: type,
          sentAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        messageCount: firebase.firestore.FieldValue.increment(1),
        [`unreadCounts.${this.currentUser.uid}`]: 0 // Reset sender's unread count
      });

      // Update unread counts for other participants
      const conversation = await this.db.collection('conversations').doc(conversationId).get();
      if (conversation.exists) {
        const participants = conversation.data().participants || [];
        const updates = {};
        participants.forEach(uid => {
          if (uid !== this.currentUser.uid) {
            updates[`unreadCounts.${uid}`] = firebase.firestore.FieldValue.increment(1);
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await this.db.collection('conversations').doc(conversationId).update(updates);
        }
      }

      console.log('✅ Message sent:', messageRef.id);

      return {
        id: messageRef.id,
        ...message,
        sentAt: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation with real-time updates
   */
  listenToMessages(conversationId, callback, limit = 50) {
    this._syncCurrentUser();
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      console.log('👂 Setting up message listener for conversation:', conversationId);

      // Clean up existing listener for this conversation
      if (this.messageListeners.has(conversationId)) {
        this.messageListeners.get(conversationId)();
      }

      const messagesQuery = this.db.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('sentAt', 'desc')
        .limit(limit);

      const unsubscribe = messagesQuery.onSnapshot((snapshot) => {
        const messages = [];
        
        snapshot.forEach((doc) => {
          const message = {
            id: doc.id,
            ...doc.data(),
            sentAt: doc.data().sentAt?.toDate() || new Date()
          };
          messages.push(message);
        });

        // Reverse to show oldest first
        messages.reverse();

        console.log(`💬 Updated messages for ${conversationId}: ${messages.length} items`);
        callback(messages);
      });

      this.messageListeners.set(conversationId, unsubscribe);
      return unsubscribe;

    } catch (error) {
      console.error('❌ Failed to setup message listener:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, messageIds = []) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      console.log('👁️ Marking messages as read in conversation:', conversationId);

      const batch = this.db.batch();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();

      // Mark specific messages as read
      if (messageIds.length > 0) {
        messageIds.forEach(messageId => {
          const messageRef = this.db.collection('messages').doc(messageId);
          batch.update(messageRef, {
            [`readBy.${this.currentUser.uid}`]: timestamp
          });
        });
      } else {
        // Mark all unread messages in conversation as read
        const unreadMessages = await this.db.collection('messages')
          .where('conversationId', '==', conversationId)
          .where(`readBy.${this.currentUser.uid}`, '==', null)
          .get();

        unreadMessages.forEach(doc => {
          batch.update(doc.ref, {
            [`readBy.${this.currentUser.uid}`]: timestamp
          });
        });
      }

      // Reset unread count for this user
      const conversationRef = this.db.collection('conversations').doc(conversationId);
      batch.update(conversationRef, {
        [`unreadCounts.${this.currentUser.uid}`]: 0
      });

      await batch.commit();
      console.log('✅ Messages marked as read');

    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      throw error;
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Search conversations by participant name or message content
   */
  async searchConversations(query) {
    if (!this.initialized || !this.currentUser) {
      throw new Error('Messaging service not initialized or user not authenticated');
    }

    try {
      const conversations = await this.getConversations();
      const lowercaseQuery = query.toLowerCase();

      return conversations.filter(conv => {
        // Search in participant names
        const participantMatch = Object.values(conv.participantDetails || {})
          .some(participant => 
            participant.name?.toLowerCase().includes(lowercaseQuery)
          );

        // Search in last message
        const messageMatch = conv.lastMessage?.text
          ?.toLowerCase().includes(lowercaseQuery);

        return participantMatch || messageMatch;
      });

    } catch (error) {
      console.error('❌ Failed to search conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId) {
    try {
      // Check cache first
      if (this.conversationCache.has(conversationId)) {
        return this.conversationCache.get(conversationId);
      }

      // Fetch from Firestore
      const doc = await this.db.collection('conversations').doc(conversationId).get();
      
      if (doc.exists) {
        const conversation = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
        };

        this.conversationCache.set(conversationId, conversation);
        return conversation;
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get conversation:', error);
      throw error;
    }
  }

  /**
   * Clean up listeners
   */
  _cleanupListeners() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
    
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
  }

  /**
   * Dispatch custom events
   */
  _dispatchEvent(eventName, data) {
    const event = new CustomEvent(`mentorbridge-messaging-${eventName}`, {
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
    this.conversationCache.clear();
    this.initialized = false;
  }
}

// Create global messaging service instance
window.mentorBridgeMessaging = new MentorBridgeMessaging();

// Legacy compatibility functions
function initMessaging() {
  console.log('🔄 Initializing messaging (legacy function)...');
  return window.mentorBridgeMessaging.initialize();
}

function sendMessage(conversationId, text) {
  console.warn('sendMessage() is deprecated. Use mentorBridgeMessaging.sendMessage() instead.');
  return window.mentorBridgeMessaging.sendMessage(conversationId, text);
}

function getConversations() {
  console.warn('getConversations() is deprecated. Use mentorBridgeMessaging.getConversations() instead.');
  return window.mentorBridgeMessaging.getConversations();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MentorBridgeMessaging,
    initMessaging,
    sendMessage,
    getConversations
  };
}