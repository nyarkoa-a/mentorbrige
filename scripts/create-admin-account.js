/**
 * Script to create admin account for MentorBridge
 * Run this in the browser console on your auth page
 */

async function createAdminAccount() {
  const adminCredentials = {
    email: 'admin@mentorbridge.com',
    password: '1234admin',
    name: 'MentorBridge Admin',
    role: 'admin'
  };

  console.log('🔧 Creating admin account...');

  try {
    // Check if Firebase Auth is available
    if (!window.mentorBridgeAuth) {
      throw new Error('MentorBridge Auth service not available. Please run this on the auth page.');
    }

    console.log('📝 Registering admin user with Firebase Auth...');
    
    // Register the user with Firebase Authentication
    const registrationData = {
      email: adminCredentials.email,
      password: adminCredentials.password,
      profile: {
        name: adminCredentials.name,
        role: adminCredentials.role,
        createdAt: new Date().toISOString(),
        isAdmin: true,
        adminAccessKey: 'mb-admin-2026' // Store for reference
      }
    };

    const result = await window.mentorBridgeAuth.registerUser(registrationData);
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', adminCredentials.email);
    console.log('🔑 Password:', adminCredentials.password);
    console.log('🗝️ Admin Key:', 'mb-admin-2026');
    console.log('👤 User ID:', result.user.uid);
    
    return {
      success: true,
      credentials: adminCredentials,
      userId: result.user.uid
    };

  } catch (error) {
    console.error('❌ Failed to create admin account:', error.message);
    
    // If user already exists, that's actually good news
    if (error.message.includes('email-already-in-use')) {
      console.log('ℹ️ Admin account already exists with this email.');
      return {
        success: true,
        message: 'Account already exists',
        credentials: adminCredentials
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-run if not in module context
if (typeof window !== 'undefined') {
  console.log('🚀 Admin Account Creator loaded. Call createAdminAccount() to create the account.');
  
  // Make function available globally
  window.createAdminAccount = createAdminAccount;
}

// For Node.js exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAdminAccount };
}