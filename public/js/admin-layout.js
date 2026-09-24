/**
 * MentorBridge Admin — shared layout (sidebar, header, mobile)
 */
(function (global) {
  'use strict';

  var NAV = [
    { section: 'Admin' },
    { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z' },
    { id: 'mentees', label: 'Mentees', href: '/admin/mentees', icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z' },
    { id: 'mentors', label: 'Mentors', href: '/admin/mentors', icon: 'M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z' },
    { id: 'applications', label: 'Mentor Applications', href: '/admin/applications', icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H13V16H8Z', badge: 'pendingBadge' },
    { id: 'sessions', label: 'Sessions', href: '/admin/sessions', icon: 'M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z' },
    { id: 'payments', label: 'Payments', href: '/admin/payments', icon: 'M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z' },
    { id: 'reports', label: 'Reports', href: '/admin/reports', icon: 'M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21M16,8H12V13H16V8M10,8H6V15H10V8Z' },
    { id: 'settings', label: 'Settings', href: '/admin/settings', icon: 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z' },
    { divider: true },
    { id: 'help', label: 'Help & Support', href: '/admin/help', icon: 'M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.75 16,10A4,4 0 0,0 12,6Z' }
  ];

  function svgIcon(path) {
    return '<svg class="adm-nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="' + path + '"/></svg>';
  }

  function renderSidebar(activeId, session, pendingCount) {
    var html = '<aside class="adm-sidebar" id="admSidebar">';
    html += '<a class="adm-brand" href="/admin/dashboard"><img src="/assets/logo.png" alt="MentorBridge" /><span>MentorBridge</span></a>';
    html += '<div class="adm-nav">';

    NAV.forEach(function (item) {
      if (item.section) {
        html += '<div class="adm-section-label">' + item.section + '</div>';
        return;
      }
      if (item.divider) {
        html += '<div class="adm-nav-divider"></div>';
        return;
      }
      var active = item.id === activeId ? ' active' : '';
      html += '<a href="' + item.href + '" class="' + active.trim() + '">';
      html += svgIcon(item.icon);
      html += item.label;
      if (item.badge && pendingCount > 0) {
        html += '<span class="adm-nav-badge" id="' + item.badge + '">' + pendingCount + '</span>';
      }
      html += '</a>';
    });

    html += '</div>';

    var initials = global.AdminAuth.getInitials(session.name);
    html += '<div class="adm-sidebar-foot">';
    html += '<div class="adm-profile-chip">';
    html += '<div class="adm-avatar" id="admSidebarAvatar">' + initials + '</div>';
    html += '<div><strong id="admSidebarName">' + (session.name || 'Admin') + '</strong><span>Administrator</span></div>';
    html += '</div>';
    html += '<button type="button" class="adm-logout-btn" id="admLogoutBtn">Log out</button>';
    html += '</div></aside>';
    return html;
  }

  function renderHeader(opts) {
    opts = opts || {};
    var initials = global.AdminAuth.getInitials(opts.session && opts.session.name);
    var updated = new Date().toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    return (
      '<header class="adm-header">' +
        '<div class="adm-header-left">' +
          '<button type="button" class="adm-menu-btn" id="admMenuBtn" aria-label="Open menu">☰</button>' +
          '<div>' +
            '<h1 class="adm-page-title">' + (opts.title || 'Dashboard') + '</h1>' +
            '<p class="adm-page-sub">' + (opts.subtitle || 'Overview of MentorBridge platform — Last updated: ' + updated) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="adm-header-right">' +
          (opts.hideSearch ? '' :
            '<div class="adm-search"><span>🔍</span><input type="search" id="admGlobalSearch" placeholder="Search mentees, mentors, sessions…" aria-label="Search" /></div>') +
          '<button type="button" class="adm-bell" id="admNotifBell" aria-label="Notifications">' +
            '🔔<span class="adm-bell-count" id="admNotifCount" style="display:none">0</span>' +
          '</button>' +
          '<div class="adm-avatar" id="admHeaderAvatar" title="Admin profile">' + initials + '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function mountLayout(options) {
    options = options || {};
    var session = global.AdminAuth.guardAdminPage({ requireAdmin: true });
    if (!session) return null;

    var mount = document.getElementById('adm-app');
    if (!mount) return null;

    var pendingCount = options.pendingCount || 0;
    mount.innerHTML =
      '<div class="adm-overlay" id="admOverlay"></div>' +
      '<div class="adm-shell">' +
        renderSidebar(options.activeNav || 'dashboard', session, pendingCount) +
        '<div class="adm-main">' +
          renderHeader({ title: options.title, subtitle: options.subtitle, session: session, hideSearch: options.hideSearch }) +
          '<div class="adm-content" id="admContent">' + (options.content || '') + '</div>' +
        '</div>' +
      '</div>';

    bindChrome(session);
    return session;
  }

  function bindChrome(session) {
    var menuBtn = document.getElementById('admMenuBtn');
    var sidebar = document.getElementById('admSidebar');
    var overlay = document.getElementById('admOverlay');
    var logoutBtn = document.getElementById('admLogoutBtn');

    if (menuBtn && sidebar && overlay) {
      menuBtn.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (confirm('Log out of the admin panel?')) {
          global.AdminAuth.logout();
        }
      });
    }

    var search = document.getElementById('admGlobalSearch');
    if (search && global.AdminData) {
      var timer;
      search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(async function () {
          var q = search.value.trim();
          if (q.length < 2) return;
          var results = await global.AdminData.searchPlatform(q);
          if (results.length && results[0].href) {
            /* future: dropdown; for now navigate on Enter */
          }
        }, 300);
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && search.value.trim().length >= 2) {
          global.AdminData.searchPlatform(search.value.trim()).then(function (results) {
            if (results[0]) window.location.href = results[0].href;
          });
        }
      });
    }

    var bell = document.getElementById('admNotifBell');
    if (bell) {
      bell.addEventListener('click', function () {
        window.location.href = '/pages/notifications.html';
      });
    }

    var avatar = document.getElementById('admHeaderAvatar');
    if (avatar) {
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('click', function () {
        window.location.href = '/admin/settings';
      });
    }
  }

  function updatePendingBadge(count) {
    var el = document.getElementById('pendingBadge');
    if (!el) return;
    if (count > 0) {
      el.textContent = count;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  global.AdminLayout = {
    mountLayout: mountLayout,
    updatePendingBadge: updatePendingBadge,
    NAV: NAV
  };
})(window);
