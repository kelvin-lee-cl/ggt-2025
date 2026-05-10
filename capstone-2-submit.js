const CAPSTONE_ID = 'capstone2';
const STORAGE_KEY = 'capstoneLinkSubmissions';
const MAX_BYTES = 8 * 1024 * 1024;
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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('capstone2Form');
    const fileInput = document.getElementById('stickerImage');
    const previewWrap = document.getElementById('capstone2PreviewWrap');
    const previewImg = document.getElementById('capstone2Preview');

    if (fileInput && previewImg && previewWrap) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                previewWrap.classList.add('d-none');
                previewImg.removeAttribute('src');
                return;
            }
            const url = URL.createObjectURL(file);
            previewImg.onload = () => URL.revokeObjectURL(url);
            previewImg.src = url;
            previewWrap.classList.remove('d-none');
        });
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    const recent = document.getElementById('capstone2RecentSubmissions');
    if (recent) {
        recent.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove-capstone2]');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (id) removeCapstone2Submission(id);
        });
    }

    loadRecentSubmissions();
    if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
        window.firebaseAuth.onAuthStateChanged(() => loadRecentSubmissions());
    }
});

function validateNotes(raw) {
    const t = (raw || '').trim();
    if (t.length < MIN_NOTES_LEN) {
        return { ok: false, message: `Please write at least ${MIN_NOTES_LEN} characters about how AI helped your workflow.` };
    }
    return { ok: true, text: t };
}

async function uploadStickerImage(file, uid) {
    if (typeof firebase === 'undefined' || !firebase.storage) {
        throw new Error('File storage is not available. Try refreshing the page.');
    }
    const storage = firebase.storage();
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const path = `capstoneSubmissions/capstone2/${uid}/${Date.now()}-${safeName}`;
    const ref = storage.ref().child(path);
    const metadata = { contentType: file.type || 'application/octet-stream', cacheControl: 'public, max-age=31536000' };
    const snapshot = await ref.put(file, metadata);
    return snapshot.ref.getDownloadURL();
}

function handleSubmit(event) {
    event.preventDefault();

    const fileInput = document.getElementById('stickerImage');
    const notesInput = document.getElementById('aiWorkflowNotes');
    const submitBtn = document.getElementById('capstone2SubmitBtn');
    const file = fileInput && fileInput.files && fileInput.files[0];

    const notesCheck = validateNotes(notesInput && notesInput.value);
    if (!notesCheck.ok) {
        showAlert(notesCheck.message, 'warning');
        return;
    }

    if (!file) {
        showAlert('Please choose an image file.', 'warning');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showAlert('Please upload an image file (PNG, JPG, GIF, or WebP).', 'warning');
        return;
    }

    if (file.size > MAX_BYTES) {
        showAlert('Image is too large. Maximum size is 8 MB.', 'warning');
        return;
    }

    requireAuth(async () => {
        const authUser = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!authUser || !authUser.uid) {
            showAlert('Could not verify your account. Please sign in again.', 'warning');
            return;
        }

        const originalHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading…';
        }

        try {
            const imageUrl = await uploadStickerImage(file, authUser.uid);
            const submissionId = genSubmissionId();
            const submissions = loadSubmissionsWithIds();
            submissions.push({
                id: submissionId,
                capstoneId: CAPSTONE_ID,
                imageUrl,
                imageFileName: file.name,
                aiWorkflowNotes: notesCheck.text,
                timestamp: new Date().toISOString(),
                studentEmail: currentUser.email
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));

            updateStudentProgress('assignment_submitted', {
                title: 'Capstone 2 — Stickers, Memes & GIF (image + AI notes)',
                type: 'capstone-stickers',
                assignmentId: submissionId
            });

            showAlert('Your work was submitted.', 'success');
            if (fileInput) fileInput.value = '';
            if (notesInput) notesInput.value = '';
            const previewWrap = document.getElementById('capstone2PreviewWrap');
            const previewImg = document.getElementById('capstone2Preview');
            if (previewWrap) previewWrap.classList.add('d-none');
            if (previewImg) {
                previewImg.removeAttribute('src');
            }
            loadRecentSubmissions();
        } catch (e) {
            console.error('Capstone 2 submit failed', e);
            showAlert(e.message || 'Upload failed. Check your connection and try again.', 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
            }
        }
    });
}

function loadRecentSubmissions() {
    const container = document.getElementById('capstone2RecentSubmissions');
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
                    <div class="mb-2">
                        <a href="${escapeHtml(s.imageUrl)}" target="_blank" rel="noopener noreferrer">
                            <img src="${escapeHtml(s.imageUrl)}" alt="Submission" class="img-fluid rounded border" style="max-height: 160px; max-width: 100%; object-fit: contain;">
                        </a>
                    </div>
                    <small class="text-muted d-block mb-1">${new Date(s.timestamp).toLocaleString()}</small>
                    ${s.imageFileName ? `<small class="text-muted d-block">${escapeHtml(s.imageFileName)}</small>` : ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" data-remove-capstone2 data-id="${escapeHtml(s.id)}" title="Remove this submission">
                    <i class="fas fa-times me-1"></i>Remove
                </button>
            </div>
            <div class="small text-body-secondary border-top pt-2 mt-2" style="white-space: pre-wrap;">${escapeHtml(s.aiWorkflowNotes || '')}</div>
        </div>
    `
        )
        .join('');
}

function removeCapstone2Submission(id) {
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
