const CAPSTONE_ID = 'capstone1';
const STORAGE_KEY = 'capstoneLinkSubmissions';

function genSubmissionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Ensures every stored submission has an id (for remove). Persists if migration ran. */
function loadSubmissionsWithIds() {
    let submissions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let dirty = false;
    submissions = submissions.map((s) => {
        if (!s.id) {
            dirty = true;
            return { ...s, id: genSubmissionId() };
        }
        return s;
    });
    if (dirty) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    }
    return submissions;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('capstone1LinkForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    const recent = document.getElementById('capstone1RecentSubmissions');
    if (recent) {
        recent.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove-capstone1]');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (id) removeCapstone1Submission(id);
        });
    }

    loadRecentSubmissions();
    if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
        window.firebaseAuth.onAuthStateChanged(() => loadRecentSubmissions());
    }
});

function normalizeAndValidateBotUrl(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return { ok: false, message: 'Please paste your tutor link.', url: '' };

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return { ok: false, message: 'That does not look like a valid URL. Include https:// at the start.', url: '' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, message: 'The link must use http:// or https://.', url: '' };
    }

    return { ok: true, message: '', url: parsed.href };
}

function handleSubmit(event) {
    event.preventDefault();

    requireAuth(() => {
        const input = document.getElementById('botUrl');
        const { ok, message, url } = normalizeAndValidateBotUrl(input.value);
        if (!ok) {
            showAlert(message, 'warning');
            return;
        }

        const submissions = loadSubmissionsWithIds();
        const submissionId = genSubmissionId();
        submissions.push({
            id: submissionId,
            capstoneId: CAPSTONE_ID,
            botUrl: url,
            timestamp: new Date().toISOString(),
            studentEmail: currentUser.email
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

        updateStudentProgress('assignment_submitted', {
            title: 'Capstone 1 — AI Writing Tutor (bot link)',
            type: 'capstone-link',
            assignmentId: submissionId
        });

        showAlert('Your tutor link was submitted.', 'success');
        input.value = '';
        loadRecentSubmissions();
    });
}

function loadRecentSubmissions() {
    const container = document.getElementById('capstone1RecentSubmissions');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = '<p class="text-muted mb-0">Sign in to see your submissions.</p>';
        return;
    }

    const submissions = loadSubmissionsWithIds();
    const mine = submissions.filter(
        (s) => s.capstoneId === CAPSTONE_ID && s.studentEmail === currentUser.email
    );

    if (mine.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">No links submitted yet.</p>';
        return;
    }

    mine.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = mine
        .slice(0, 10)
        .map(
            (s) => `
        <div class="p-3 border rounded mb-2">
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
                <div class="flex-grow-1 min-w-0">
                    <div class="mb-1 text-break">
                        <a href="${escapeHtml(s.botUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.botUrl)}</a>
                    </div>
                    <small class="text-muted">${new Date(s.timestamp).toLocaleString()}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" data-remove-capstone1 data-id="${escapeHtml(s.id)}" title="Remove this submission">
                    <i class="fas fa-times me-1"></i>Remove
                </button>
            </div>
        </div>
    `
        )
        .join('');
}

function removeCapstone1Submission(id) {
    requireAuth(() => {
        const all = loadSubmissionsWithIds();
        const idx = all.findIndex((s) => s.id === id);
        if (idx === -1) {
            showAlert('That submission was not found.', 'warning');
            loadRecentSubmissions();
            return;
        }
        if (all[idx].studentEmail !== currentUser.email) {
            showAlert('You can only remove your own submissions.', 'warning');
            return;
        }
        const removedId = all[idx].id;
        all.splice(idx, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

        if (removedId && typeof studentProgress !== 'undefined' && currentUser.email) {
            const u = currentUser.email;
            const row = studentProgress[u];
            if (row && Array.isArray(row.assignmentsSubmitted)) {
                row.assignmentsSubmitted = row.assignmentsSubmitted.filter((a) => a.id !== removedId);
                row.lastActivity = new Date().toISOString();
                saveStudentProgress();
            }
        }

        showAlert('Submission removed.', 'info');
        loadRecentSubmissions();
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
