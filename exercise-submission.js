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

    // Show exercise submission modal
    showExerciseModal(lessonId) {
        console.log('Showing exercise modal for lesson:', lessonId);

        // Remove any existing exercise modal
        const existingModal = document.getElementById('exerciseModal');
        const existingBackdrop = document.getElementById('exerciseBackdrop');
        if (existingModal) {
            existingModal.remove();
        }
        if (existingBackdrop) {
            existingBackdrop.remove();
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
                                <input type="text" class="form-control" id="exerciseTitle" placeholder="Enter exercise title" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="exerciseDescription" class="form-label">Reflective Writing</label>
                                <textarea class="form-control" id="exerciseDescription" rows="3" placeholder="Write your reflection here"></textarea>
                            </div>

                            <div class="mb-3">
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

                            <div id="submissionContent" class="mb-3" style="display: none;">
                                <!-- Dynamic content based on submission type -->
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

        // Add backdrop with darker overlay
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'exerciseBackdrop';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Darker backdrop
        document.body.appendChild(backdrop);

        document.body.appendChild(modal);

        // Add body class to prevent scrolling
        document.body.classList.add('modal-open');

        // Add event listeners for submission type selection
        document.querySelectorAll('.submission-type-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.submission-type-card').forEach(c => c.classList.remove('border-primary'));
                card.classList.add('border-primary');
                this.showSubmissionContent(card.dataset.type);
            });
        });
    }

    // Show submission content based on type
    showSubmissionContent(type) {
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
                `;
                break;
        }

        contentDiv.innerHTML = content;
        contentDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.dataset.type = type;
    }

    // Submit exercise
    async submitExercise(lessonId) {
        const submitBtn = document.getElementById('submitBtn');
        const type = submitBtn.dataset.type;

        if (!type) {
            showAlert('Please select a submission type', 'warning');
            return;
        }

        const title = document.getElementById('exerciseTitle').value;
        const description = document.getElementById('exerciseDescription').value;

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

            // Handle different submission types
            switch (type) {
                case 'text':
                    const textContent = document.getElementById('textContent').value;
                    if (!textContent.trim()) {
                        showAlert('Please enter text content', 'warning');
                        return;
                    }
                    submissionData.content = textContent;
                    break;

                case 'link':
                    const linkUrl = document.getElementById('linkUrl').value;
                    if (!linkUrl.trim()) {
                        showAlert('Please enter a URL', 'warning');
                        return;
                    }
                    submissionData.url = linkUrl;
                    break;

                case 'image':
                    const imageFile = document.getElementById('imageFile').files[0];
                    if (!imageFile) {
                        showAlert('Please select an image file', 'warning');
                        return;
                    }

                    // Upload image to Firebase Storage
                    const imageUrl = await this.uploadImage(imageFile);
                    submissionData.imageUrl = imageUrl;
                    submissionData.fileName = imageFile.name;
                    submissionData.fileSize = imageFile.size;
                    break;
            }

            // Save to Firebase
            await this.saveSubmission(submissionData);

            // Record exercise submission for completion logic
            try { if (typeof window.recordExerciseSubmission === 'function') window.recordExerciseSubmission(lessonId); } catch (e) { }
            showAlert('Exercise submitted successfully!', 'success');
            this.closeModal();

        } catch (error) {
            console.error('Error submitting exercise:', error);
            showAlert('Error submitting exercise. Please try again.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Exercise';
        }
    }

    // Upload image to Firebase Storage
    async uploadImage(file) {
        const fileName = `exercises/${Date.now()}_${file.name}`;
        const storageRef = this.storage.ref(fileName);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }

    // Save submission to Firebase
    async saveSubmission(data) {
        const submissionsRef = this.db.collection('exerciseSubmissions');
        return await submissionsRef.add(data);
    }

    // Close modal
    closeModal() {
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
        inst.showExerciseModal(lessonId);
    } catch (e) {
        console.error('exerciseSubmission not initialized', e);
    }
}

// Make sure the function is globally accessible
window.startExerciseSubmission = startExerciseSubmission;
