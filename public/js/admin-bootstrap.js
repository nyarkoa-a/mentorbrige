/** Shared admin page bootstrap */
function admHead(title) {
  document.write(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    '<title>' + title + ' | MentorBridge Admin</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"/>' +
    '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>' +
    '<link rel="stylesheet" href="/css/admin.css"/>' +
    '<script src="/js/admin-auth.js"><\/script>' +
    '<script>(function(){AdminAuth.guardAdminPage();})();<\/script>' +
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"><\/script>' +
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"><\/script>' +
    '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"><\/script>' +
    '<script src="/js/firebase-config.js"><\/script>' +
    '<script src="/js/firebase-service.js"><\/script>' +
    '<script src="/js/firebase-auth.js"><\/script>' +
    '</head><body class="adm-body"><div id="adm-app"></div>' +
    '<script src="/js/admin-data.js"><\/script>' +
    '<script src="/js/admin-layout.js"><\/script>' +
    '<script src="/js/admin-page.js"><\/script>'
  );
}
