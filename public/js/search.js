/**
 * MentorBridge Global Search Module
 * Search mentors, resources, and industries from any page
 */
const GlobalSearch = {
  debounceTimer: null,

  init() {
    const trigger = document.getElementById('globalSearchTrigger');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('globalSearchInput');
    const closeBtn = document.getElementById('searchClose');
    const results = document.getElementById('searchResults');

    if (!overlay || !input) return;

    const open = () => {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      input.focus();
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    if (trigger) trigger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape') close();
    });

    input.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(input.value.trim(), results), 250);
    });
  },

  async search(query, container) {
    if (!container) return;
    if (!query) {
      container.innerHTML = '<p class="search-hint">Search mentors, resources, or industries…</p>';
      return;
    }

    container.innerHTML = '<div class="skeleton skeleton-card" style="height:80px"></div>';

    try {
      const [mentorsRes, resourcesRes] = await Promise.all([
        fetch(`/api/mentors?search=${encodeURIComponent(query)}`),
        fetch(`/api/resources?search=${encodeURIComponent(query)}`)
      ]);
      const mentorsData = await mentorsRes.json();
      const resourcesData = await resourcesRes.json();
      const mentors = mentorsData.mentors || [];
      const resources = resourcesData.resources || [];
      const industries = [...new Set(mentors.flatMap(m => m.industries))]
        .filter(i => i.toLowerCase().includes(query.toLowerCase()));

      if (!mentors.length && !resources.length && !industries.length) {
        container.innerHTML = `<p class="search-hint">No results for "${query}"</p>`;
        return;
      }

      let html = '';
      if (mentors.length) {
        html += `<div class="search-group"><h4>Mentors</h4>${mentors.slice(0, 4).map(m => `
          <a class="search-result" href="/pages/mentor-profile.html?id=${m.id}">
            <img src="${m.photo}" alt="" class="avatar avatar-sm" />
            <div><strong>${m.name}</strong><span>${m.position} · ${m.company}</span></div>
          </a>`).join('')}</div>`;
      }
      if (resources.length) {
        html += `<div class="search-group"><h4>Resources</h4>${resources.slice(0, 3).map(r => `
          <a class="search-result" href="/pages/resource-centre.html">
            <div><strong>${r.title}</strong><span>${r.category}</span></div>
          </a>`).join('')}</div>`;
      }
      if (industries.length) {
        html += `<div class="search-group"><h4>Industries</h4>${industries.map(i => `
          <a class="search-result" href="/pages/mentor-directory.html?industry=${encodeURIComponent(i)}">
            <div><strong>${i}</strong><span>Browse mentors in this industry</span></div>
          </a>`).join('')}</div>`;
      }
      container.innerHTML = html;
    } catch {
      container.innerHTML = '<p class="search-hint">Search unavailable. Please try again.</p>';
    }
  }
};

window.GlobalSearch = GlobalSearch;
