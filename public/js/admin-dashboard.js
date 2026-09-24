/**
 * MentorBridge Admin Dashboard — main page controller
 */
(function () {
  'use strict';

  var growthChart = null;

  function kpiCard(id, icon, label, valueHtml, trendHtml) {
    return (
      '<div class="adm-kpi" id="' + id + '">' +
        '<div class="adm-kpi-header">' +
          '<div class="adm-kpi-icon">' + icon + '</div>' +
        '</div>' +
        '<strong class="adm-kpi-value">' + valueHtml + '</strong>' +
        '<span class="adm-kpi-label">' + label + '</span>' +
        (trendHtml || '') +
      '</div>'
    );
  }

  function trendLine(trend, source) {
    if (!trend || source === 'empty' || source === 'unavailable') {
      return '<span class="adm-kpi-trend neutral">—</span>';
    }
    var cls = trend.direction === 'up' ? 'up' : trend.direction === 'down' ? 'down' : 'neutral';
    var arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
    return '<span class="adm-kpi-trend ' + cls + '">' + arrow + ' ' + trend.value + '% vs last month</span>';
  }

  function dashboardContent() {
    return (
      '<div class="adm-kpi-row" id="admKpiRow">' +
        kpiCard('kpiMentees', '🎓', 'Total Mentees', '<span class="adm-kpi-loading">…</span>', '') +
        kpiCard('kpiMentors', '🏆', 'Total Mentors', '<span class="adm-kpi-loading">…</span>', '') +
        kpiCard('kpiActive', '🤝', 'Active Mentorships', '<span class="adm-kpi-loading">…</span>', '') +
        kpiCard('kpiPending', '📋', 'Pending Applications', '<span class="adm-kpi-loading">…</span>', '') +
      '</div>' +

      '<div class="adm-grid-2">' +
        '<div class="adm-card">' +
          '<div class="adm-card-head">' +
            '<h2>Platform Growth</h2>' +
            '<select class="adm-range-select" id="admChartRange" aria-label="Chart time range">' +
              '<option value="6" selected>Last 6 Months</option>' +
              '<option value="12">Last 12 Months</option>' +
            '</select>' +
          '</div>' +
          '<div class="adm-card-body"><div class="adm-chart-wrap"><canvas id="admGrowthChart"></canvas></div>' +
            '<p id="admChartSource" style="font-size:0.68rem;color:#6B7280;margin:0.5rem 0 0"></p></div>' +
        '</div>' +
        '<div class="adm-card">' +
          '<div class="adm-card-head"><h2>Quick Actions</h2></div>' +
          '<div class="adm-card-body">' +
            '<div class="adm-quick-grid">' +
              '<a class="adm-quick-btn" href="/admin/applications">✓ Verify Mentors</a>' +
              '<a class="adm-quick-btn" href="/admin/applications">📋 Review Applications</a>' +
              '<a class="adm-quick-btn" href="/admin/reports">📊 View Reports</a>' +
              '<a class="adm-quick-btn" href="/admin/sessions">📅 Manage Sessions</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="adm-grid-2">' +
        '<div class="adm-card">' +
          '<div class="adm-card-head"><h2>Pending Mentor Verification</h2>' +
            '<a class="adm-link" href="/admin/applications">View all</a></div>' +
          '<div class="adm-card-body" id="admPendingList"><p class="adm-kpi-loading">Loading…</p></div>' +
        '</div>' +
        '<div class="adm-card">' +
          '<div class="adm-card-head"><h2>Upcoming Sessions</h2>' +
            '<a class="adm-link" href="/admin/sessions">View all</a></div>' +
          '<div class="adm-card-body" id="admSessionsList"><p class="adm-kpi-loading">Loading…</p></div>' +
        '</div>' +
      '</div>' +

      '<div class="adm-grid-2">' +
        '<div class="adm-card">' +
          '<div class="adm-card-head"><h2>Recent Mentees</h2>' +
            '<a class="adm-link" href="/admin/mentees">View all</a></div>' +
          '<div class="adm-card-body adm-table-wrap" id="admMenteesTable"><p class="adm-kpi-loading">Loading…</p></div>' +
        '</div>' +
        '<div class="adm-card">' +
          '<div class="adm-card-head"><h2>Recent Activity</h2></div>' +
          '<div class="adm-card-body" id="admActivityFeed"><p class="adm-kpi-loading">Loading…</p></div>' +
        '</div>' +
      '</div>' +

      '<div class="adm-card">' +
        '<div class="adm-card-head"><h2>System Overview</h2>' +
          '<span class="adm-live"><span class="adm-live-dot"></span> Live</span></div>' +
        '<div class="adm-card-body" id="admSystemOverview"><p class="adm-kpi-loading">Loading…</p></div>' +
      '</div>'
    );
  }

  function setKpi(cardId, value, trend, source) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var valEl = card.querySelector('.adm-kpi-value');
    var label = card.querySelector('.adm-kpi-label');
    if (source === 'unavailable' || source === 'empty') {
      valEl.textContent = '—';
      valEl.className = 'adm-kpi-value';
      var note = document.createElement('span');
      note.className = 'adm-kpi-trend neutral';
      note.textContent = source === 'unavailable' ? 'Data unavailable' : 'No records yet';
      var old = card.querySelector('.adm-kpi-trend');
      if (old) old.remove();
      label.after(note);
      return;
    }
    valEl.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    valEl.className = 'adm-kpi-value';
    var existing = card.querySelector('.adm-kpi-trend');
    if (existing) existing.remove();
    if (trend) {
      label.insertAdjacentHTML('afterend', trendLine(trend, source));
    }
  }

  function renderPending(list) {
    var el = document.getElementById('admPendingList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="adm-empty">No pending mentor applications<small>Applications will appear here when mentors register.</small></div>';
      return;
    }
    el.innerHTML = list.slice(0, 5).map(function (m) {
      var exp = m.experience || m.yearsExperience || m.title || '—';
      return (
        '<div class="adm-list-item" data-uid="' + m.uid + '">' +
          '<div class="adm-item-main"><strong>' + esc(m.name || m.email) + '</strong>' +
          '<span>' + esc(m.title || 'Mentor') + ' · ' + esc(String(exp)) + ' · Applied ' + AdminData.formatDate(m.createdAt) + '</span></div>' +
          '<div class="adm-actions">' +
            '<button type="button" class="adm-btn adm-btn-primary adm-approve-btn" data-uid="' + m.uid + '">Approve</button>' +
            '<a class="adm-btn adm-btn-outline" href="/admin/mentor-detail?id=' + encodeURIComponent(m.uid) + '">Review</a>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    el.querySelectorAll('.adm-approve-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        btn.textContent = '…';
        try {
          await AdminData.approveMentor(btn.dataset.uid);
          btn.closest('.adm-list-item').remove();
          loadDashboard();
        } catch (e) {
          alert(e.message || 'Approval failed');
          btn.disabled = false;
          btn.textContent = 'Approve';
        }
      });
    });
  }

  function renderSessions(list) {
    var el = document.getElementById('admSessionsList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="adm-empty">No upcoming sessions.</div>';
      return;
    }
    el.innerHTML = list.slice(0, 5).map(function (s) {
      var dateStr = s.date || s.scheduledDate || '';
      var d = dateStr ? new Date(dateStr) : null;
      var day = d && !isNaN(d) ? d.getDate() : '—';
      var mon = d && !isNaN(d) ? d.toLocaleDateString('en-GB', { month: 'short' }) : '';
      return (
        '<div class="adm-list-item">' +
          '<div class="adm-date-chip"><strong>' + day + '</strong><span>' + mon + '</span></div>' +
          '<div class="adm-item-main"><strong>' + esc(s.title || s.topic || 'Session') + '</strong>' +
          '<span>' + esc(s.time || '') + ' · ' + esc(s.mentorName || s.mentorId || 'Mentor') + '</span></div>' +
          '<a class="adm-btn adm-btn-ghost" href="/admin/sessions">View</a>' +
        '</div>'
      );
    }).join('');
  }

  function renderMentees(list) {
    var el = document.getElementById('admMenteesTable');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="adm-empty">No mentees registered yet.</div>';
      return;
    }
    el.innerHTML =
      '<table class="adm-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (m) {
        var status = m.accountStatus === 'pending' ? 'Pending' : 'Active';
        var badge = status === 'Active' ? 'adm-badge-active' : 'adm-badge-pending';
        return '<tr><td>' + esc(m.name || '—') + '</td><td>' + esc(m.email || '—') + '</td><td>' +
          AdminData.formatDate(m.createdAt) + '</td><td><span class="adm-badge ' + badge + '">' + status + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderActivity(events) {
    var el = document.getElementById('admActivityFeed');
    if (!el) return;
    if (!events.length) {
      el.innerHTML = '<div class="adm-empty">No recent activity.</div>';
      return;
    }
    el.innerHTML = events.map(function (ev) {
      return (
        '<div class="adm-activity-item">' +
          '<div class="adm-activity-icon">' + ev.icon + '</div>' +
          '<div><div class="adm-activity-text">' + esc(ev.text) + '</div>' +
          '<div class="adm-activity-time">' + AdminData.formatRelative(ev.time) + '</div></div>' +
        '</div>'
      );
    }).join('');
  }

  function renderSystem(sys) {
    var el = document.getElementById('admSystemOverview');
    if (!el) return;
    el.innerHTML =
      '<div class="adm-sys-grid">' +
        '<div class="adm-sys-stat"><strong>' + esc(String(sys.uptime)) + '</strong><span>Server uptime</span></div>' +
        '<div class="adm-sys-stat"><strong>' + sys.totalSessions.toLocaleString() + '</strong><span>Total sessions</span></div>' +
        '<div class="adm-sys-stat"><strong>' + sys.activeUsers.toLocaleString() + '</strong><span>Active users</span></div>' +
        '<div class="adm-sys-stat"><strong>' + esc(String(sys.storageUsed)) + '</strong><span>Storage used</span></div>' +
      '</div>' +
      '<p style="font-size:0.68rem;color:#6B7280;margin:0.75rem 0 0">TODO: Connect uptime and storage metrics to hosting/monitoring backend.</p>';
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function renderChart(months) {
    var data = await AdminData.fetchGrowthData(months);
    var src = document.getElementById('admChartSource');
    if (src) {
      src.textContent = data.source === 'firestore' ? 'Source: Firestore users collection' :
        data.source === 'api-fallback' ? 'Source: API fallback (limited data)' : 'Source: no user records found';
    }
    var ctx = document.getElementById('admGrowthChart');
    if (!ctx || !window.Chart) return;
    if (growthChart) growthChart.destroy();
    growthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'Mentees', data: data.mentees, borderColor: '#1B62DE', backgroundColor: 'rgba(27,98,222,0.08)', tension: 0.35, fill: true },
          { label: 'Mentors', data: data.mentors, borderColor: '#4C7BE8', backgroundColor: 'rgba(76,123,232,0.06)', tension: 0.35, fill: true }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#E4E1DA' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  async function loadDashboard() {
    try {
      var kpis = await AdminData.fetchKPIs();
      AdminLayout.updatePendingBadge(kpis.pendingApplications.total);

      setKpi('kpiMentees', kpis.mentees.total, kpis.mentees.trend, kpis.source);
      setKpi('kpiMentors', kpis.mentors.total, kpis.mentors.trend, kpis.source);
      setKpi('kpiActive', kpis.activeMentorships.total, null, kpis.source);
      setKpi('kpiPending', kpis.pendingApplications.total, null, kpis.source);

      renderPending(kpis.pendingMentors);
      renderSessions(await AdminData.fetchUpcomingSessions());
      renderMentees(await AdminData.fetchRecentMentees(6));
      renderActivity(await AdminData.fetchActivityFeed(8));
      renderSystem(await AdminData.fetchSystemOverview());

      var notif = document.getElementById('admNotifCount');
      if (notif && kpis.pendingApplications.total > 0) {
        notif.textContent = kpis.pendingApplications.total;
        notif.style.display = 'flex';
      }
    } catch (e) {
      console.error('Dashboard load failed:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var kpis = await AdminData.fetchKPIs().catch(function () { return { pendingApplications: { total: 0 } }; });
    AdminLayout.mountLayout({
      activeNav: 'dashboard',
      title: 'Dashboard',
      pendingCount: kpis.pendingApplications ? kpis.pendingApplications.total : 0,
      content: dashboardContent()
    });

    var range = document.getElementById('admChartRange');
    await renderChart(6);
    if (range) {
      range.addEventListener('change', function () {
        renderChart(parseInt(range.value, 10));
      });
    }
    await loadDashboard();
  });
})();
