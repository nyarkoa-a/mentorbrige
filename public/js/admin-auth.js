/**
 * MentorBridge Admin — authentication guard & session helpers
 */
(function (global) {
  'use strict';

  var ROUTES = {
    signIn: '/pages/auth.html',
    adminLogin: '/admin/login',
    menteeDashboard: '/mentee/dashboard',
    mentorDashboard: '/mentor/dashboard',
    adminDashboard: '/admin/dashboard'
  };

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('mb_session') || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveSession(data) {
    sessionStorage.setItem('mb_session', JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem('mb_session');
  }

  function redirect(url) {
    window.location.replace(url);
  }

  /**
   * Protect admin pages — call early in <head> or at start of body script
   * @param {Object} options
   * @param {boolean} options.requireAdmin - if true, only admin role allowed
   */
  function guardAdminPage(options) {
    options = options || {};
    var session = getSession();
    var role = session && session.role;

    if (!session || !role) {
      redirect(ROUTES.signIn + '?tab=login');
      return null;
    }

    if (role === 'student' || role === 'mentee') {
      redirect(ROUTES.menteeDashboard);
      return null;
    }

    if (role === 'mentor') {
      redirect(ROUTES.mentorDashboard);
      return null;
    }

    if (options.requireAdmin !== false && role !== 'admin') {
      redirect(ROUTES.signIn + '?tab=login');
      return null;
    }

    return session;
  }

  async function logout() {
    clearSession();
    if (global.mentorBridgeAuth && typeof global.mentorBridgeAuth.signOut === 'function') {
      try {
        await global.mentorBridgeAuth.signOut();
      } catch (e) {
        console.warn('Firebase sign-out:', e.message);
      }
    } else if (global.firebase && firebase.auth) {
      try {
        await firebase.auth().signOut();
      } catch (e) { /* ignore */ }
    }
    redirect(ROUTES.signIn + '?tab=login');
  }

  function getInitials(name) {
    if (!name) return 'AD';
    return name.trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  global.AdminAuth = {
    ROUTES: ROUTES,
    getSession: getSession,
    saveSession: saveSession,
    clearSession: clearSession,
    guardAdminPage: guardAdminPage,
    logout: logout,
    getInitials: getInitials
  };
})(window);
