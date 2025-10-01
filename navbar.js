// Inject shared navbar into pages
(function injectNavbar() {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    fetch('partials/navbar.html', { cache: 'no-store' })
        .then(res => res.text())
        .then(html => {
            root.innerHTML = html;
            // Re-bind auth events after injection
            if (typeof setupEventListeners === 'function') {
                try {
                    setupEventListeners();
                } catch (_) { }
            }
            // Apply current language after injection
            if (typeof initializeLanguage === 'function') {
                try {
                    updateLanguageUI();
                    translatePage();
                } catch (_) { }
            }
            // Update auth UI if available
            if (typeof updateAuthUI === 'function') {
                try { updateAuthUI(); } catch (_) { }
            }
            // Apply current theme after injection
            if (typeof initializeTheme === 'function') {
                try {
                    initializeTheme();
                } catch (_) { }
            }
        })
        .catch(err => console.warn('Failed to load navbar:', err));
})();

