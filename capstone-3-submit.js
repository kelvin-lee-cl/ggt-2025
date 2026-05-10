const CAPSTONE_ID = 'capstone3';
const STORAGE_KEY = 'capstoneLinkSubmissions';
const MIN_NOTES_LEN = 40;

function genSubmissionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

/** HeyGen, YouTube, or Google Drive share / watch URLs */
function normalizeAndValidateVideoUrl(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
        return { ok: false, message: 'Please paste your video link.', url: '' };
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return { ok: false, message: 'That does not look like a valid URL. Include https:// at the start.', url: '' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, message: 'The link must use http:// or https://.', url: '' };
    }

    const host = parsed.hostname.toLowerCase();
    const isYoutube =
        host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com');
    const isDrive = host === 'drive.google.com' || host === 'docs.google.com';
    const isHeyGen = host === 'heygen.com' || host.endsWith('.heygen.com');

    if (!isYoutube && !isDrive && !isHeyGen) {
        return {
            ok: false,
            message: 'Use a share or watch link from HeyGen, YouTube, or Google Drive.',
            url: ''
        };
    }

    return { ok: true, url: parsed.href };
}

function validateNotes(raw) {
    const t = (raw || '').trim();
    if (t.length < MIN_NOTES_LEN) {
        return {
            ok: false,
            message: `Please write at least ${MIN_NOTES_LEN} characters in your making-of note.`
        };
    }
    return { ok: true, text: t };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('capstone3LinkForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    const recent = document.getElementById('capstone3RecentSubmissions');
    if (recent) {
        recent.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove-capstone3]');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (id) removeCapstone3Submission(id);
        });
    }

    loadRecentSubmissions();
    if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
        window.firebaseAuth.onAuthStateChanged(() => loadRecentSubmissions());
    }
});

function handleSubmit(event) {
    event.preventDefault();

    const urlInput = document.getElementById('videoUrl');
    const notesInput = document.getElementById('makingOfNotes');
    const submitBtn = document.getElementById('capstone3SubmitBtn');

    const urlCheck = normalizeAndValidateVideoUrl(urlInput && urlInput.value);
    if (!urlCheck.ok) {
        showAlert(urlCheck.message, 'warning');
        return;
    }

    const notesCheck = validateNotes(notesInput && notesInput.value);
    if (!notesCheck.ok) {
        showAlert(notesCheck.message, 'warning');
        return;
    }

    requireAuth(() => {
        const originalHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending…';
        }

        try {
            const submissionId = genSubmissionId();
            const submissions = loadSubmissionsWithIds();
            submissions.push({
                id: submissionId,
                capstoneId: CAPSTONE_ID,
                videoUrl: urlCheck.url,
                makingOfNotes: notesCheck.text,
                timestamp: new Date().toISOString(),
                studentEmail: currentUser.email
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

            updateStudentProgress('assignment_submitted', {
                title: 'Capstone 3 — 60 sec AI Avatar (video link + making-of)',
                type: 'capstone-avatar-link',
                assignmentId: submissionId
            });

            showAlert('Your submission was saved.', 'success');
            if (urlInput) urlInput.value = '';
            if (notesInput) notesInput.value = '';
            loadRecentSubmissions();
        } catch (e) {
            console.error('Capstone 3 submit failed', e);
            showAlert(e.message || 'Submission failed. Try again.', 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
            }
        }
    });
}

function loadRecentSubmissions() {
    const container = document.getElementById('capstone3RecentSubmissions');
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
        container.innerHTML = '<p class="text-muted mb-0">No submissions yet.</p>';
        return;
    }

    mine.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = mine
        .slice(0, 10)
        .map(
            (s) => `
        <div class="p-3 border rounded mb-2">
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <div class="flex-grow-1 min-w-0">
                    <div class="mb-1 text-break">
                        <a href="${escapeHtml(s.videoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.videoUrl)}</a>
                    </div>
                    <small class="text-muted">${new Date(s.timestamp).toLocaleString()}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" data-remove-capstone3 data-id="${escapeHtml(s.id)}" title="Remove this submission">
                    <i class="fas fa-times me-1"></i>Remove
                </button>
            </div>
            <div class="small text-body-secondary border-top pt-2 mt-2" style="white-space: pre-wrap;">${escapeHtml(s.makingOfNotes || '')}</div>
        </div>
    `
        )
        .join('');
}

function removeCapstone3Submission(id) {
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
