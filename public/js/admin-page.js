/**
 * MentorBridge Admin — reusable list/detail page helper
 */
(function (global) {
  'use strict';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  async function mountListPage(config) {
    var kpis = await global.AdminData.fetchKPIs().catch(function () {
      return { pendingApplications: { total: 0 } };
    });

    global.AdminLayout.mountLayout({
      activeNav: config.activeNav,
      title: config.title,
      subtitle: config.subtitle,
      pendingCount: kpis.pendingApplications.total,
      content: config.contentHtml || '<div id="admPageBody"><p class="adm-kpi-loading">Loading…</p></div>'
    });

    if (typeof config.load === 'function') {
      await config.load(document.getElementById('admPageBody'));
    }
  }

  function usersTable(users, columns) {
    if (!users.length) {
      return '<div class="adm-empty">No records found.</div>';
    }
    var heads = columns.map(function (c) { return '<th>' + c.label + '</th>'; }).join('');
    var rows = users.map(function (u) {
      return '<tr>' + columns.map(function (c) {
        return '<td>' + (typeof c.render === 'function' ? c.render(u) : esc(u[c.key])) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<table class="adm-table"><thead><tr>' + heads + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  global.AdminPage = {
    mountListPage: mountListPage,
    usersTable: usersTable,
    esc: esc
  };
})(window);
