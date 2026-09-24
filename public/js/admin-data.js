/**
 * MentorBridge Admin — Firestore & API data layer
 */
(function (global) {
  'use strict';

  var db = null;
  var ready = false;

  function formatDate(ts) {
    if (!ts) return '—';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatRelative(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    var diff = Date.now() - d.getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return formatDate(ts);
  }

  function monthKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  async function init() {
    if (ready && db) return db;

    if (global.firebaseService) {
      await global.firebaseService.initialize();
      db = global.firebaseService.getDb();
    } else if (global.firebase && firebase.apps && firebase.apps.length) {
      db = firebase.firestore();
    } else if (typeof initializeFirebaseConfig === 'function') {
      await initializeFirebaseConfig();
      db = global.firebaseFirestore || (firebase.apps.length ? firebase.firestore() : null);
    }

    if (global.mentorBridgeAuth && !global.mentorBridgeAuth.initialized) {
      await global.mentorBridgeAuth.initialize();
    }

    ready = !!db;
    return db;
  }

  async function fetchAllUsers() {
    await init();
    if (!db) return { users: [], source: 'unavailable' };

    try {
      var snap = await db.collection('users').limit(500).get();
      var users = [];
      snap.forEach(function (doc) {
        users.push({ id: doc.id, uid: doc.id, ...doc.data() });
      });
      return { users: users, source: 'firestore' };
    } catch (e) {
      console.warn('Firestore users fetch failed:', e.message);
      return fetchUsersFromApi();
    }
  }

  async function fetchUsersFromApi() {
    try {
      var res = await fetch('/api/users/students');
      var data = await res.json();
      var students = (data.students || []).map(function (s) {
        return {
          id: s.id,
          name: s.name,
          email: s.email || '',
          role: 'student',
          accountStatus: 'active',
          createdAt: s.created_at || s.createdAt
        };
      });
      return { users: students, source: 'api-fallback' };
    } catch (e) {
      return { users: [], source: 'empty' };
    }
  }

  async function fetchKPIs() {
    var result = await fetchAllUsers();
    var users = result.users;
    var now = new Date();
    var thisMonth = monthKey(now);
    var lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var lastMonth = monthKey(lastMonthDate);

    var mentees = users.filter(function (u) { return u.role === 'student'; });
    var mentors = users.filter(function (u) { return u.role === 'mentor'; });
    var pending = users.filter(function (u) {
      return u.role === 'mentor' && (
        u.accountStatus === 'pending' ||
        u.mentorApprovalStatus === 'pending' ||
        u.approvalStatus === 'pending'
      );
    });

    function countInMonth(list, key) {
      return list.filter(function (u) {
        if (!u.createdAt) return false;
        var d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return monthKey(d) === key;
      }).length;
    }

    var menteesThis = countInMonth(mentees, thisMonth);
    var menteesLast = countInMonth(mentees, lastMonth);
    var mentorsThis = countInMonth(mentors, thisMonth);
    var mentorsLast = countInMonth(mentors, lastMonth);

    var sessions = await fetchSessions();
    var activeSessions = sessions.filter(function (s) {
      return s.status === 'accepted' || s.status === 'upcoming' || s.status === 'scheduled';
    });
    var completed = sessions.filter(function (s) { return s.status === 'completed'; });

    return {
      source: result.source,
      mentees: { total: mentees.length, trend: trendPct(menteesThis, menteesLast), thisMonth: menteesThis, lastMonth: menteesLast },
      mentors: { total: mentors.length, trend: trendPct(mentorsThis, mentorsLast), thisMonth: mentorsThis, lastMonth: mentorsLast },
      activeMentorships: { total: activeSessions.length, trend: null },
      completedPrograms: { total: completed.length, trend: null },
      pendingApplications: { total: pending.length, trend: null },
      users: users,
      pendingMentors: pending
    };
  }

  function trendPct(current, previous) {
    if (previous === 0 && current === 0) return { value: 0, direction: 'neutral' };
    if (previous === 0) return { value: 100, direction: 'up' };
    var pct = Math.round(((current - previous) / previous) * 100);
    return {
      value: Math.abs(pct),
      direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
    };
  }

  async function fetchSessions() {
    await init();
    if (db) {
      try {
        var snap = await db.collection('sessions').limit(200).get();
        var list = [];
        snap.forEach(function (doc) { list.push({ id: doc.id, ...doc.data() }); });
        return list;
      } catch (e) {
        console.warn('Firestore sessions:', e.message);
      }
    }
    try {
      var res = await fetch('/api/sessions');
      var data = await res.json();
      return data.sessions || [];
    } catch (e) {
      return [];
    }
  }

  async function fetchUpcomingSessions() {
    var sessions = await fetchSessions();
    var now = new Date();
    return sessions
      .filter(function (s) {
        if (s.status === 'cancelled' || s.status === 'completed') return false;
        var dateStr = s.date || s.scheduledDate || s.scheduledAt;
        if (!dateStr) return s.status === 'upcoming' || s.status === 'scheduled';
        var d = new Date(dateStr);
        return d >= now || isNaN(d.getTime());
      })
      .sort(function (a, b) {
        var da = new Date(a.date || a.scheduledDate || 0);
        var db_ = new Date(b.date || b.scheduledDate || 0);
        return da - db_;
      })
      .slice(0, 8);
  }

  async function fetchPendingMentors() {
    var kpis = await fetchKPIs();
    return kpis.pendingMentors || [];
  }

  async function approveMentor(uid) {
    await init();
    if (!db) throw new Error('Database unavailable');

    await db.collection('users').doc(uid).update({
      accountStatus: 'active',
      mentorApprovalStatus: 'approved',
      approvalStatus: 'approved',
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function fetchRecentMentees(limit) {
    limit = limit || 8;
    var result = await fetchAllUsers();
    return result.users
      .filter(function (u) { return u.role === 'student'; })
      .sort(function (a, b) {
        var da = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        var db_ = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db_ - da;
      })
      .slice(0, limit);
  }

  async function fetchGrowthData(months) {
    months = months || 6;
    var result = await fetchAllUsers();
    var users = result.users;
    var labels = [];
    var menteeCounts = [];
    var mentorCounts = [];
    var now = new Date();

    for (var i = months - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = monthKey(d);
      labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
      menteeCounts.push(users.filter(function (u) {
        if (u.role !== 'student' || !u.createdAt) return false;
        var cd = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return monthKey(cd) <= key;
      }).length);
      mentorCounts.push(users.filter(function (u) {
        if (u.role !== 'mentor' || !u.createdAt) return false;
        var cd = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return monthKey(cd) <= key;
      }).length);
    }

    return { labels: labels, mentees: menteeCounts, mentors: mentorCounts, source: result.source };
  }

  async function fetchActivityFeed(limit) {
    limit = limit || 10;
    await init();
    var events = [];

    if (db) {
      try {
        var notifSnap = await db.collection('notifications').orderBy('createdAt', 'desc').limit(limit).get();
        notifSnap.forEach(function (doc) {
          var n = doc.data();
          events.push({
            type: 'notification',
            icon: '🔔',
            text: n.title || n.message || n.body || 'Platform notification',
            time: n.createdAt
          });
        });
      } catch (e) { /* index may not exist */ }
    }

    var users = (await fetchAllUsers()).users;
    users
      .filter(function (u) { return u.createdAt; })
      .sort(function (a, b) {
        var da = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        var db_ = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return db_ - da;
      })
      .slice(0, 5)
      .forEach(function (u) {
        events.push({
          type: 'signup',
          icon: u.role === 'mentor' ? '🏆' : '🎓',
          text: (u.name || u.email) + ' joined as ' + (u.role === 'mentor' ? 'mentor' : 'mentee'),
          time: u.createdAt
        });
      });

    var pending = users.filter(function (u) {
      return u.role === 'mentor' && (u.mentorApprovalStatus === 'pending' || u.accountStatus === 'pending');
    });
    pending.slice(0, 3).forEach(function (u) {
      events.push({
        type: 'application',
        icon: '📋',
        text: 'Mentor application from ' + (u.name || u.email),
        time: u.createdAt
      });
    });

    events.sort(function (a, b) {
      var da = a.time && a.time.toDate ? a.time.toDate() : new Date(a.time || 0);
      var db_ = b.time && b.time.toDate ? b.time.toDate() : new Date(b.time || 0);
      return db_ - da;
    });

    return events.slice(0, limit);
  }

  async function fetchSystemOverview() {
    var sessions = await fetchSessions();
    var users = (await fetchAllUsers()).users;
    var activeUsers = users.filter(function (u) { return u.accountStatus !== 'suspended'; }).length;

    return {
      uptime: 'Monitoring not configured', // TODO: wire to /api/health or hosting metrics
      totalSessions: sessions.length,
      activeUsers: activeUsers,
      storageUsed: 'Not available', // TODO: Firebase Storage metrics
      live: true
    };
  }

  async function searchPlatform(query) {
    query = (query || '').trim().toLowerCase();
    if (!query) return [];
    var users = (await fetchAllUsers()).users;
    var sessions = await fetchSessions();
    var results = [];

    users.forEach(function (u) {
      var hay = ((u.name || '') + ' ' + (u.email || '')).toLowerCase();
      if (hay.indexOf(query) !== -1) {
        results.push({ type: 'user', label: u.name || u.email, sub: u.role, href: u.role === 'mentor' ? '/admin/mentors' : '/admin/mentees' });
      }
    });

    sessions.forEach(function (s) {
      var hay = ((s.title || '') + ' ' + (s.topic || '') + ' ' + (s.mentorName || '')).toLowerCase();
      if (hay.indexOf(query) !== -1) {
        results.push({ type: 'session', label: s.title || s.topic || 'Session', sub: s.date || '', href: '/admin/sessions' });
      }
    });

    return results.slice(0, 8);
  }

  global.AdminData = {
    init: init,
    formatDate: formatDate,
    formatRelative: formatRelative,
    fetchKPIs: fetchKPIs,
    fetchPendingMentors: fetchPendingMentors,
    fetchSessions: fetchSessions,
    fetchUpcomingSessions: fetchUpcomingSessions,
    fetchRecentMentees: fetchRecentMentees,
    fetchGrowthData: fetchGrowthData,
    fetchActivityFeed: fetchActivityFeed,
    fetchSystemOverview: fetchSystemOverview,
    fetchAllUsers: fetchAllUsers,
    approveMentor: approveMentor,
    searchPlatform: searchPlatform
  };
})(window);
