// Exercise Submission System with Firebase Integration
class ExerciseSubmission {
    constructor() {
        this.db = null;
        this.storage = null;
        this.auth = null;
        this.initializeFirebase();
    }

    // Initialize Firebase (demo mode for localhost)
    initializeFirebase() {
        try {
            // Prefer the shared Firebase instances if already initialized by script.js
            if (window.firebaseDb && window.firebaseAuth && typeof firebase !== 'undefined') {
                this.db = window.firebaseDb;
                this.auth = window.firebaseAuth;
                // storage may not be pre-initialized
                if (firebase.storage) {
                    this.storage = firebase.storage();
                }
                return;
            }
        } catch (e) { /* fall through */ }

        // Fallbacks
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0' ||
            window.location.hostname.includes('localhost');

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            // Use existing app
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            if (firebase.storage) this.storage = firebase.storage();
        } else if (isLocalhost) {
            // Use real Firebase on localhost as well
            this.setupRealFirebase();
        }
    }

    // Setup demo Firebase for localhost
    setupDemoFirebase() {
        // Mock Firebase functions for localhost
        this.db = {
            collection: (name) => ({
                add: (data) => {
                    console.log('Demo Firebase: Adding to', name, data);
                    return Promise.resolve({ id: 'demo-id-' + Date.now() });
                },
                doc: (id) => ({
                    set: (data) => {
                        console.log('Demo Firebase: Setting doc', id, data);
                        return Promise.resolve();
                    }
                })
            })
        };

        this.storage = {
            ref: (path) => ({
                put: (file) => {
                    console.log('Demo Firebase Storage: Uploading', path, file.name);
                    return Promise.resolve({
                        ref: {
                            getDownloadURL: () => Promise.resolve('demo-url-' + Date.now())
                        }
                    });
                }
            })
        };

        this.auth = {
            currentUser: {
                uid: 'demo-user-id',
                email: 'student@gmail.com'
            }
        };
    }

    // Setup real Firebase for production
    setupRealFirebase() {
        if (typeof firebase !== 'undefined') {
            // Expect firebase to be already initialized by page scripts
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            this.auth = firebase.auth();
        }
    }

    getSubmissionMode(lessonId) {
        if (lessonId === 'lesson13' || lessonId === 'lesson14' || lessonId === 'lesson15' || lessonId === 'lesson16') {
            return 'imageSingle';
        }
        if (lessonId === 'lesson17') return 'textOnly';
        if (lessonId === 'lesson18') return 'imageSix';
        if (lessonId === 'lesson19') return 'imageMulti';
        if (lessonId === 'lesson20' || lessonId === 'lesson22' || lessonId === 'lesson23') return 'linkOnly';
        return 'default';
    }

    escapeHtml(s) {
        if (!s) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Windows / some browsers omit File.type; still allow common raster previews */
    isLikelyImageFile(f) {
        if (!f) return false;
        if (f.type && f.type.startsWith('image/')) return true;
        const name = (f.name || '').toLowerCase();
        return /\.(png|jpe?g|gif|webp|bmp|ico|avif)$/i.test(name);
    }

    clearImagePreviewRow(rowEl) {
        if (!rowEl) return;
        rowEl.querySelectorAll('img[data-preview-blob]').forEach((img) => {
            const u = img.getAttribute('data-preview-blob');
            if (u) {
                try {
                    URL.revokeObjectURL(u);
                } catch (e) { /* ignore */ }
            }
        });
        rowEl.innerHTML = '';
    }

    fillImagePreviewRow(rowEl, files) {
        this.clearImagePreviewRow(rowEl);
        const panel = rowEl && rowEl.closest('.image-preview-panel');
        if (!rowEl) return;
        if (!files || !files.length) {
            if (panel) panel.style.display = 'none';
            return;
        }
        const list = files.length !== undefined ? Array.from(files) : files;
        for (let i = 0; i < list.length; i++) {
            const f = list[i];
            if (!this.isLikelyImageFile(f)) continue;
            const url = URL.createObjectURL(f);
            const box = document.createElement('div');
            box.className = 'text-center';
            const cap = document.createElement('div');
            cap.className = 'small text-muted text-truncate';
            cap.style.maxWidth = '180px';
            cap.textContent = f.name || `Image ${i + 1}`;
            const img = document.createElement('img');
            img.src = url;
            img.setAttribute('data-preview-blob', url);
            img.className = 'img-fluid rounded border';
            img.style.maxHeight = '180px';
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
            img.alt = 'Preview';
            box.appendChild(cap);
            box.appendChild(img);
            rowEl.appendChild(box);
        }
        if (panel) panel.style.display = rowEl.children.length > 0 ? 'block' : 'none';
    }

    revokeAllPreviewsInModal() {
        const modal = document.getElementById('exerciseModal');
        if (!modal) return;
        modal.querySelectorAll('img[data-preview-blob]').forEach((img) => {
            const u = img.getAttribute('data-preview-blob');
            if (u) {
                try {
                    URL.revokeObjectURL(u);
                } catch (e) { /* ignore */ }
            }
        });
    }

    async loadLessonSubmissionHints(lessonId) {
        try {
            const response = await fetch('lessons.json');
            const data = await response.json();
            const lesson = data.lessons.find((l) => l.id === lessonId);
            const sub = lesson && lesson.sections && lesson.sections.find((s) => s.type === 'exercise-instructions');
            const rows = (sub && sub.content) || [];
            const titleRow = rows.find((r) => r.field === 'Exercise Title');
            const imgRow = rows.find((r) => r.field === 'Image Submission');
            const textRow = rows.find((r) => r.field === 'Text Submission');
            const linkRow = rows.find((r) => r.field === 'link');
            return {
                titleHint: titleRow ? titleRow.value : '',
                imageHint: imgRow ? imgRow.value : '',
                textHint: textRow ? textRow.value : '',
                linkHint: linkRow ? linkRow.value : ''
            };
        } catch (e) {
            console.warn('Could not load lesson hints', e);
            return { titleHint: '', imageHint: '', textHint: '', linkHint: '' };
        }
    }

    showPostSubmitImageGallery(imageUrls, heading) {
        const modal = document.getElementById('exerciseModal');
        if (!modal) return;
        this.revokeAllPreviewsInModal();
        const safeHeading = this.escapeHtml(heading || 'Uploaded images');
        const imgs = (imageUrls || []).map((url, i) => {
            const u = this.escapeHtml(url);
            return `<div class="col-6 col-md-4 mb-2"><div class="small text-muted mb-1">Image ${i + 1}</div><img src="${u}" alt="" class="img-fluid rounded border" style="max-height: 140px; object-fit: contain; width: 100%;"></div>`;
        }).join('');
        const body = modal.querySelector('.modal-body');
        const footer = modal.querySelector('.modal-footer');
        if (body) {
            body.innerHTML = `
                <div class="alert alert-success mb-3"><i class="fas fa-check-circle me-2"></i>Submission saved.</div>
                <h6 class="mb-3">${safeHeading}</h6>
                <div class="row">${imgs}</div>
                <p class="text-muted small mt-3 mb-0">Total: ${imageUrls.length} image(s).</p>
            `;
        }
        if (footer) {
            footer.innerHTML = `
                <button type="button" class="btn btn-primary" onclick="exerciseSubmission.closeModal()">Close</button>
            `;
        }
    }

    // Show exercise submission modal
    async showExerciseModal(lessonId) {
        console.log('Showing exercise modal for lesson:', lessonId);

        const existingModal = document.getElementById('exerciseModal');
        const existingBackdrop = document.getElementById('exerciseBackdrop');
        if (existingModal) {
            existingModal.remove();
        }
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        const mode = this.getSubmissionMode(lessonId);
        const needsHints = mode !== 'default';
        let titleHint = '';
        let imageHint = '';
        let textHint = '';
        let linkHint = '';
        if (needsHints) {
            const hints = await this.loadLessonSubmissionHints(lessonId);
            titleHint = hints.titleHint;
            imageHint = hints.imageHint;
            textHint = hints.textHint;
            linkHint = hints.linkHint;
        }

        let submissionBlock = '';
        let submissionContentStyle = 'display: none;';
        let includeDefaultFields = mode === 'default';

        if (mode === 'imageSingle') {
            submissionContentStyle = 'display: block;';
            submissionBlock = `
                <label for="imageFile" class="form-label">Image Submission</label>
                ${imageHint ? `<div class="form-text mb-2">${this.escapeHtml(imageHint)}</div>` : ''}
                <input type="file" class="form-control" id="imageFile" accept="image/*">
                <div class="form-text">Upload an image file (JPG, PNG, GIF supported)</div>
                <div class="image-preview-panel mt-3 border rounded p-2 bg-light" style="display: none;">
                    <div class="fw-semibold small mb-2">Preview</div>
                    <div id="imagePreviewRowSingle" class="d-flex flex-wrap gap-3 justify-content-start align-items-start"></div>
                </div>`;
        } else if (mode === 'textOnly') {
            submissionContentStyle = 'display: block;';
            submissionBlock = `
                <label for="textContent" class="form-label">Text Submission</label>
                ${textHint ? `<div class="form-text mb-2">${this.escapeHtml(textHint)}</div>` : ''}
                <textarea class="form-control" id="textContent" rows="12" placeholder="Paste your topic sentence and story here..."></textarea>`;
        } else if (mode === 'imageSix') {
            submissionContentStyle = 'display: block;';
            submissionBlock = `
                <label for="imageFiles" class="form-label">Image Submission (exactly 6)</label>
                ${imageHint ? `<div class="form-text mb-2">${this.escapeHtml(imageHint)}</div>` : ''}
                <input type="file" class="form-control" id="imageFiles" accept="image/*" multiple>
                <p class="form-text mt-2 mb-0" id="imageSixCount">Selected: 0 / 6 images (choose all six in one selection)</p>
                <div class="image-preview-panel mt-3 border rounded p-2 bg-light" style="display: none;">
                    <div class="fw-semibold small mb-2">Preview</div>
                    <div id="imagePreviewRowSix" class="d-flex flex-wrap gap-3 justify-content-start align-items-start"></div>
                </div>`;
        } else if (mode === 'imageMulti') {
            submissionContentStyle = 'display: block;';
            submissionBlock = `
                <label for="imageFilesMulti" class="form-label">Image Submission</label>
                ${imageHint ? `<div class="form-text mb-2">${this.escapeHtml(imageHint)}</div>` : ''}
                <input type="file" class="form-control" id="imageFilesMulti" accept="image/*" multiple>
                <p class="form-text mt-2 mb-0" id="imageMultiCount">Selected: 0 image(s)</p>
                <div class="image-preview-panel mt-3 border rounded p-2 bg-light" style="display: none;">
                    <div class="fw-semibold small mb-2">Preview</div>
                    <div id="imagePreviewRowMulti" class="d-flex flex-wrap gap-3 justify-content-start align-items-start"></div>
                </div>`;
        } else if (mode === 'linkOnly') {
            submissionContentStyle = 'display: block;';
            submissionBlock = `
                <label for="linkUrl" class="form-label">URL / Link</label>
                ${linkHint ? `<div class="form-text mb-2">${this.escapeHtml(linkHint)}</div>` : ''}
                <input type="text" class="form-control" id="linkUrl" placeholder="https://...">`;
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.id = 'exerciseModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-paper-plane me-2"></i>Submit Exercise
                        </h5>
                        <button type="button" class="btn-close" onclick="exerciseSubmission.closeModal()"></button>
                    </div>
                    <div class="modal-body">
                        <form id="exerciseForm">
                            <div class="mb-3">
                                <label for="exerciseTitle" class="form-label">Exercise Title</label>
                                ${titleHint ? `<div class="form-text mb-2">${this.escapeHtml(titleHint)}</div>` : ''}
                                <input type="text" class="form-control" id="exerciseTitle" placeholder="Enter exercise title" required>
                            </div>
                            ${includeDefaultFields ? `
                            <div class="mb-3">
                                <label for="exerciseDescription" class="form-label">Reflective Writing</label>
                                <textarea class="form-control" id="exerciseDescription" rows="3" placeholder="Write your reflection here"></textarea>
                            </div>

                            <div class="mb-3" id="submissionTypeRow">
                                <label class="form-label">Submission Type</label>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card submission-type-card" data-type="text">
                                            <div class="card-body text-center">
                                                <i class="fas fa-file-text fa-2x mb-2"></i>
                                                <h6>Text Submission</h6>
                                                <small class="text-muted">Submit written content</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card submission-type-card" data-type="link">
                                            <div class="card-body text-center">
                                                <i class="fas fa-link fa-2x mb-2"></i>
                                                <h6>Link Submission</h6>
                                                <small class="text-muted">Submit a URL or link</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card submission-type-card" data-type="image">
                                            <div class="card-body text-center">
                                                <i class="fas fa-image fa-2x mb-2"></i>
                                                <h6>Image Submission</h6>
                                                <small class="text-muted">Upload an image file</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <div id="submissionContent" class="mb-3" style="${submissionContentStyle}">
                                ${submissionBlock || '<!-- Dynamic content based on submission type -->'}
                            </div>

                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="exerciseSubmission.closeModal()">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submitBtn" onclick="exerciseSubmission.submitExercise('${lessonId}')" disabled>Submit Exercise</button>
                    </div>
                </div>
            </div>
        `;

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'exerciseBackdrop';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        document.body.appendChild(backdrop);

        document.body.appendChild(modal);

        document.body.classList.add('modal-open');

        const submitBtn = document.getElementById('submitBtn');
        const titleInput = document.getElementById('exerciseTitle');

        if (mode === 'imageSingle') {
            submitBtn.dataset.type = 'image';
            const imageInput = document.getElementById('imageFile');
            const previewRow = document.getElementById('imagePreviewRowSingle');
            const update = () => {
                submitBtn.disabled = !(titleInput.value.trim() && imageInput.files && imageInput.files.length > 0);
            };
            titleInput.addEventListener('input', update);
            imageInput.addEventListener('change', () => {
                this.fillImagePreviewRow(previewRow, imageInput.files);
                update();
            });
        } else if (mode === 'textOnly') {
            submitBtn.dataset.type = 'text';
            const textEl = document.getElementById('textContent');
            const update = () => {
                submitBtn.disabled = !(titleInput.value.trim() && textEl.value.trim());
            };
            titleInput.addEventListener('input', update);
            textEl.addEventListener('input', update);
        } else if (mode === 'imageSix') {
            submitBtn.dataset.type = 'image';
            const imageInput = document.getElementById('imageFiles');
            const countEl = document.getElementById('imageSixCount');
            const previewRow = document.getElementById('imagePreviewRowSix');
            const update = () => {
                const n = imageInput.files ? imageInput.files.length : 0;
                if (countEl) {
                    countEl.textContent = `Selected: ${n} / 6 images (choose all six in one selection)`;
                }
                submitBtn.disabled = !(titleInput.value.trim() && n === 6);
            };
            titleInput.addEventListener('input', update);
            imageInput.addEventListener('change', () => {
                this.fillImagePreviewRow(previewRow, imageInput.files);
                update();
            });
        } else if (mode === 'imageMulti') {
            submitBtn.dataset.type = 'image';
            const imageInput = document.getElementById('imageFilesMulti');
            const countEl = document.getElementById('imageMultiCount');
            const previewRow = document.getElementById('imagePreviewRowMulti');
            const update = () => {
                const n = imageInput.files ? imageInput.files.length : 0;
                if (countEl) {
                    countEl.textContent = `Selected: ${n} image(s)`;
                }
                submitBtn.disabled = !(titleInput.value.trim() && n >= 1);
            };
            titleInput.addEventListener('input', update);
            imageInput.addEventListener('change', () => {
                this.fillImagePreviewRow(previewRow, imageInput.files);
                update();
            });
        } else if (mode === 'linkOnly') {
            submitBtn.dataset.type = 'link';
            const linkEl = document.getElementById('linkUrl');
            const update = () => {
                submitBtn.disabled = !(titleInput.value.trim() && linkEl.value.trim());
            };
            titleInput.addEventListener('input', update);
            linkEl.addEventListener('input', update);
        } else {
            document.querySelectorAll('.submission-type-card').forEach((card) => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.submission-type-card').forEach((c) => c.classList.remove('border-primary'));
                    card.classList.add('border-primary');
                    this.showSubmissionContent(card.dataset.type);
                });
            });
        }
    }

    // Show submission content based on type
    showSubmissionContent(type) {
        this.revokeAllPreviewsInModal();
        const contentDiv = document.getElementById('submissionContent');
        const submitBtn = document.getElementById('submitBtn');

        let content = '';

        switch (type) {
            case 'text':
                content = `
                    <label for="textContent" class="form-label">Text Content</label>
                    <textarea class="form-control" id="textContent" rows="8" placeholder="Enter your text content here..."></textarea>
                `;
                break;
            case 'link':
                content = `
                    <label for="linkUrl" class="form-label">URL/Link</label>
                    <input type="url" class="form-control" id="linkUrl" placeholder="https://example.com">
                    <div class="form-text">Enter the URL you want to submit</div>
                `;
                break;
            case 'image':
                content = `
                    <label for="imageFile" class="form-label">Image File</label>
                    <input type="file" class="form-control" id="imageFile" accept="image/*">
                    <div class="form-text">Upload an image file (JPG, PNG, GIF supported)</div>
                    <div class="image-preview-panel mt-3 border rounded p-2 bg-light" style="display: none;">
                        <div class="fw-semibold small mb-2">Preview</div>
                        <div id="imagePreviewRowDefault" class="d-flex flex-wrap gap-3 justify-content-start align-items-start"></div>
                    </div>
                `;
                break;
        }

        contentDiv.innerHTML = content;
        contentDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.dataset.type = type;

        if (type === 'image') {
            const imageInput = document.getElementById('imageFile');
            const previewRow = document.getElementById('imagePreviewRowDefault');
            if (imageInput && previewRow) {
                imageInput.addEventListener('change', () => {
                    this.fillImagePreviewRow(previewRow, imageInput.files);
                });
            }
        }
    }

    // Submit exercise
    async submitExercise(lessonId) {
        const submitBtn = document.getElementById('submitBtn');
        if (!submitBtn) return;
        const type = submitBtn.dataset.type;

        if (!type) {
            showAlert('Please select a submission type', 'warning');
            return;
        }

        const title = document.getElementById('exerciseTitle').value;
        const descEl = document.getElementById('exerciseDescription');
        const description = descEl ? descEl.value : '';

        if (!title.trim()) {
            showAlert('Please enter an exercise title', 'warning');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';

        try {
            let submissionData = {
                title: title,
                description: description,
                lessonId: lessonId,
                type: type,
                timestamp: new Date().toISOString(),
                userId: this.auth.currentUser.uid,
                userEmail: this.auth.currentUser.email
            };

            switch (type) {
                case 'text': {
                    const textEl = document.getElementById('textContent');
                    const textContent = textEl ? textEl.value : '';
                    if (!textContent.trim()) {
                        showAlert('Please enter text content', 'warning');
                        return;
                    }
                    submissionData.content = textContent;
                    break;
                }

                case 'link': {
                    const linkUrl = document.getElementById('linkUrl').value;
                    if (!linkUrl.trim()) {
                        showAlert('Please enter a URL', 'warning');
                        return;
                    }
                    submissionData.url = linkUrl;
                    break;
                }

                case 'image': {
                    if (lessonId === 'lesson18') {
                        const input = document.getElementById('imageFiles');
                        const files = input && input.files ? input.files : null;
                        if (!files || files.length !== 6) {
                            showAlert('Please select exactly 6 image files in one selection.', 'warning');
                            return;
                        }
                        const imageUrls = [];
                        for (let i = 0; i < 6; i++) {
                            imageUrls.push(await this.uploadImage(files[i], `_${i}`));
                        }
                        submissionData.imageUrls = imageUrls;
                        submissionData.imageCount = 6;
                        submissionData.multiImage = true;
                        submissionData.fileName = `${files.length} images`;
                        break;
                    }
                    if (lessonId === 'lesson19') {
                        const input = document.getElementById('imageFilesMulti');
                        const files = input && input.files ? Array.from(input.files) : [];
                        if (files.length < 1) {
                            showAlert('Please select at least one image.', 'warning');
                            return;
                        }
                        const imageUrls = [];
                        for (let i = 0; i < files.length; i++) {
                            imageUrls.push(await this.uploadImage(files[i], `_${i}`));
                        }
                        submissionData.imageUrls = imageUrls;
                        submissionData.imageCount = imageUrls.length;
                        submissionData.multiImage = true;
                        submissionData.fileName = `${files.length} images`;
                        break;
                    }
                    const imageInput = document.getElementById('imageFile');
                    const imageFile = imageInput && imageInput.files ? imageInput.files[0] : null;
                    if (!imageFile) {
                        showAlert('Please select an image file', 'warning');
                        return;
                    }
                    const imageUrl = await this.uploadImage(imageFile);
                    submissionData.imageUrl = imageUrl;
                    submissionData.fileName = imageFile.name;
                    submissionData.fileSize = imageFile.size;
                    break;
                }
            }

            await this.saveSubmission(submissionData);

            try { if (typeof window.recordExerciseSubmission === 'function') window.recordExerciseSubmission(lessonId); } catch (e) { }

            if (lessonId === 'lesson18' && submissionData.imageUrls && submissionData.imageUrls.length === 6) {
                this.showPostSubmitImageGallery(submissionData.imageUrls, 'Your 6 submitted images');
            } else if (lessonId === 'lesson19' && submissionData.imageUrls && submissionData.imageUrls.length > 0) {
                this.showPostSubmitImageGallery(submissionData.imageUrls, 'Your submitted images');
            } else {
                showAlert('Exercise submitted successfully!', 'success');
                this.closeModal();
            }
        } catch (error) {
            console.error('Error submitting exercise:', error);
            showAlert('Error submitting exercise. Please try again.', 'danger');
        } finally {
            const sb = document.getElementById('submitBtn');
            if (sb) {
                sb.disabled = false;
                sb.innerHTML = 'Submit Exercise';
            }
        }
    }

    // Upload image to Firebase Storage
    async uploadImage(file, uniqueSuffix = '') {
        const fileName = `exercises/${Date.now()}${uniqueSuffix}_${file.name}`;
        const storageRef = this.storage.ref(fileName);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }

    // Save submission to Firebase
    async saveSubmission(data) {
        const submissionsRef = this.db.collection('exerciseSubmissions');
        const docRef = await submissionsRef.add({
            ...data,
            timestamp: new Date().toISOString(),
            userId: this.auth.currentUser.uid,
            userEmail: this.auth.currentUser.email
        });

        // Send notification
        await this.sendSubmissionNotification(data);

        return docRef.id;
    }

    // Send notification when submission is made
    async sendSubmissionNotification(submissionData) {
        try {
            const response = await fetch('/.netlify/functions/send-submission-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentEmail: this.auth.currentUser.email,
                    studentName: this.auth.currentUser.displayName || this.auth.currentUser.email,
                    lessonId: submissionData.lessonId,
                    submissionType: submissionData.type,
                    submissionData: {
                        title: submissionData.title,
                        content: submissionData.content,
                        files: submissionData.files || [],
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                console.warn('Notification failed:', await response.text());
            } else {
                console.log('Notification sent successfully');
            }
        } catch (error) {
            console.warn('Failed to send notification:', error);
        }
    }


    // Close modal
    closeModal() {
        this.revokeAllPreviewsInModal();
        const modal = document.getElementById('exerciseModal');
        const backdrop = document.getElementById('exerciseBackdrop');

        if (modal) {
            modal.remove();
        }
        if (backdrop) {
            backdrop.remove();
        }

        // Remove body class
        document.body.classList.remove('modal-open');
    }
}

// Initialize exercise submission (lazy singleton to avoid TDZ/load-order issues)
var exerciseSubmission = null;
function getExerciseSubmissionInstance() {
    if (!window.exerciseSubmission) {
        window.exerciseSubmission = new ExerciseSubmission();
    }
    return window.exerciseSubmission;
}

// Function to start exercise submission (called from lesson pages)
function startExerciseSubmission(lessonId) {
    console.log('startExerciseSubmission called with lessonId:', lessonId);
    try {
        const inst = getExerciseSubmissionInstance();
        inst.showExerciseModal(lessonId).catch((e) => {
            console.error('showExerciseModal failed', e);
            if (typeof showAlert === 'function') {
                showAlert('Could not open the submission form. Please try again.', 'danger');
            }
        });
    } catch (e) {
        console.error('exerciseSubmission not initialized', e);
    }
}

// Make sure the function is globally accessible
window.startExerciseSubmission = startExerciseSubmission;
