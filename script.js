// Main JavaScript for Educational Hub

// Global variables
let currentUser = null;
let studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'light';
const languages = ['en', 'zh-tw', 'zh-cn'];
let __isFirebaseSigningIn = false; // guard to prevent concurrent popup sign-ins

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeFirebaseAuth();
    loadUserData();
    setupEventListeners();
    animateOnScroll();
    initializeScrollHighlighting();
    initializeLanguage();
    initializeTheme();
    if (typeof loadHomepageSlider === 'function') {
        setTimeout(loadHomepageSlider, 300);
        setTimeout(loadHomepageSlider, 1500);
    }

    // Login gate button wires to Firebase Google Sign-In
    const gateBtn = document.getElementById('loginGateLoginBtn');
    if (gateBtn) {
        gateBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof firebaseGoogleLogin === 'function') {
                firebaseGoogleLogin();
            }
        });
    }
});

// Initialize Firebase Authentication (Google Sign-In)
function initializeFirebaseAuth() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded');
            // retry a few times in case SDK loads slightly later on slower networks
            window.__firebaseInitRetries = (window.__firebaseInitRetries || 0) + 1;
            if (window.__firebaseInitRetries <= 10) {
                return setTimeout(initializeFirebaseAuth, 300);
            }
            return;
        }
        if (!firebase.apps || !firebase.apps.length) {
            if (typeof firebaseConfig === 'undefined') {
                console.warn('firebaseConfig not found');
                return;
            }
            firebase.initializeApp(firebaseConfig);
        }
        const auth = firebase.auth();
        try {
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .catch(e => console.warn('Auth persistence not set', e));
        } catch (e) { console.warn('Auth persistence not set', e); }
        const db = firebase.firestore();
        try {
            // Improve connectivity behind proxies/VPNs
            if (!window.__dbSettingsApplied) {
                db.settings({ experimentalAutoDetectLongPolling: true, useFetchStreams: false });
                window.__dbSettingsApplied = true;
            }
        } catch (e) { /* ignore for compat */ }
        window.firebaseAuth = auth;
        window.firebaseDb = db;

        // Complete redirect-based sign-in if we came back from provider
        if (typeof auth.getRedirectResult === 'function') {
            auth.getRedirectResult().catch(err => {
                console.warn('getRedirectResult error', err);
            });
        }
        auth.onAuthStateChanged(async user => {
            if (user) {
                currentUser = {
                    email: user.email,
                    user_metadata: { full_name: user.displayName || user.email },
                    uid: user.uid
                };
                // Ensure per-user progress doc exists
                try {
                    const userRef = db.collection('userProgress').doc(user.uid);
                    const snap = await userRef.get();
                    if (!snap.exists) {
                        await userRef.set({ userId: user.uid, email: user.email, lessons: {}, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() });
                    }
                } catch (e) { console.warn('Init userProgress failed', e); }
            } else {
                currentUser = null;
            }
            updateAuthUI();
        });
    } catch (e) {
        console.error('Failed to initialize Firebase Auth:', e);
    }
}

async function firebaseGoogleLogin() {
    try {
        if (__isFirebaseSigningIn) {
            return; // prevent concurrent popups
        }
        __isFirebaseSigningIn = true;
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn ? loginBtn.innerHTML : '';
        if (loginBtn) {
            showLoading(loginBtn);
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        try { provider.setCustomParameters({ prompt: 'select_account' }); } catch (e) { /* ignore */ }
        try {
            await firebase.auth().signInWithPopup(provider);
        } catch (popupError) {
            // Common popup issues: cancelled request, popup blocked. Fallback to redirect.
            const code = popupError && (popupError.code || popupError.message || '').toString();
            const isPopupIssue = code.includes('auth/popup-blocked') || code.includes('auth/cancelled-popup-request');
            if (isPopupIssue) {
                try {
                    await firebase.auth().signInWithRedirect(provider);
                    return;
                } catch (redirectError) {
                    throw redirectError;
                }
            }
            throw popupError;
        }
    } catch (e) {
        console.error('Google sign-in failed:', e);
        showAlert('Google sign-in failed. Please try again.', 'danger');
    } finally {
        __isFirebaseSigningIn = false;
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            hideLoading(loginBtn, 'Login');
            if (originalText) loginBtn.innerHTML = originalText;
        }
    }
}

async function firebaseLogout() {
    try {
        await firebase.auth().signOut();
        showAlert('You have been logged out successfully.', 'info');
    } catch (e) {
        console.error('Logout failed:', e);
        showAlert('Logout failed. Please try again.', 'danger');
    }
}

// ---- Firebase lesson progress helpers ----
async function recordQuizResult(lessonId, correctAnswers, totalQuestions) {
    try {
        if (!window.firebaseDb || !currentUser) return;
        const db = window.firebaseDb;
        const userId = currentUser.uid;
        const passed = correctAnswers >= 3 && totalQuestions >= 5;
        const batch = db.batch();

        const quizRef = db.collection('quizResults').doc();
        batch.set(quizRef, {
            userId,
            email: currentUser.email,
            lessonId,
            correct: correctAnswers,
            total: totalQuestions,
            passed,
            timestamp: new Date().toISOString()
        });

        const userRef = db.collection('userProgress').doc(userId);
        batch.set(userRef, {
            lessons: {
                [lessonId]: {
                    quiz: { correct: correctAnswers, total: totalQuestions, passed, updatedAt: new Date().toISOString() }
                }
            },
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        await batch.commit();
        await evaluateAndMarkCompleted(lessonId);
    } catch (e) {
        console.error('recordQuizResult failed', e);
    }
}

async function recordExerciseSubmission(lessonId) {
    try {
        if (!window.firebaseDb || !currentUser) return;
        const db = window.firebaseDb;
        const userId = currentUser.uid;
        await db.collection('userProgress').doc(userId).set({
            lessons: {
                [lessonId]: {
                    exercise: { submitted: true, submittedAt: new Date().toISOString() }
                }
            },
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        await evaluateAndMarkCompleted(lessonId);
    } catch (e) {
        console.error('recordExerciseSubmission failed', e);
    }
}

async function evaluateAndMarkCompleted(lessonId) {
    try {
        if (!window.firebaseDb || !currentUser) return;
        const db = window.firebaseDb;
        const userRef = db.collection('userProgress').doc(currentUser.uid);
        const snap = await userRef.get();
        const data = snap.exists ? snap.data() : null;
        const lesson = data && data.lessons ? data.lessons[lessonId] : null;
        const exerciseSubmitted = lesson && lesson.exercise ? lesson.exercise.submitted === true : false;
        const alreadyCompleted = lesson && lesson.status === 'completed';

        // Rule: Exercise submission alone completes the lesson
        if (!alreadyCompleted && exerciseSubmitted) {
            await userRef.set({
                lessons: {
                    [lessonId]: {
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    }
                },
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            if (typeof showAlert === 'function') showAlert('Lesson completed! Great job!', 'success');
        }
    } catch (e) {
        console.error('evaluateAndMarkCompleted failed', e);
    }
}

// expose helpers
window.recordQuizResult = recordQuizResult;
window.recordExerciseSubmission = recordExerciseSubmission;

// ----- Homepage Slider (Firebase-backed) -----
async function loadHomepageSlider() {
    try {
        const sliderSection = document.getElementById('hero-slider');
        const carouselInner = document.getElementById('carouselInner');
        const indicators = document.getElementById('carouselIndicators');
        const manageBtn = document.getElementById('manageSliderBtn');
        if (!carouselInner || !indicators) return;

        // Show manage button only to admins
        const isAdmin = !!(currentUser && isAdminUser(currentUser.email));
        if (isAdmin && manageBtn) {
            manageBtn.style.display = '';
            manageBtn.onclick = openSliderManager;
        } else if (manageBtn) {
            manageBtn.style.display = 'none';
        }

        // Always show the slider section for both public and authenticated users
        if (sliderSection) sliderSection.style.display = '';

        // Fetch slides from Firestore collection 'homepageSlides'
        let slides = [];
        try {
            if (window.firebaseDb) {
                const snap = await window.firebaseDb.collection('homepageSlides').orderBy('order', 'asc').get();
                slides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
        } catch (e) {
            console.warn('Failed to load slides from Firestore, falling back to defaults', e);
        }

        if (!slides || slides.length === 0) {
            // No slides: hide the entire slider section
            if (sliderSection) sliderSection.style.display = 'none';
            indicators.innerHTML = '';
            carouselInner.innerHTML = '';
            return;
        }

        if (sliderSection) sliderSection.style.display = '';

        // Render indicators and slides
        indicators.innerHTML = '';
        carouselInner.innerHTML = '';
        slides.forEach((slide, idx) => {
            const indicator = document.createElement('button');
            indicator.type = 'button';
            indicator.setAttribute('data-bs-target', '#homepageCarousel');
            indicator.setAttribute('data-bs-slide-to', String(idx));
            if (idx === 0) indicator.className = 'active';
            indicator.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
            indicator.setAttribute('aria-label', 'Slide ' + (idx + 1));
            indicators.appendChild(indicator);

            const item = document.createElement('div');
            item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
            const a = document.createElement('a');
            a.href = slide.linkUrl || '#';
            a.target = (slide.linkUrl || '').startsWith('http') ? '_blank' : '';
            const img = document.createElement('img');
            img.src = slide.imageUrl;
            img.alt = 'Slide image';
            img.className = 'd-block w-100 homepage-slide-img';
            a.appendChild(img);
            item.appendChild(a);
            carouselInner.appendChild(item);
        });
    } catch (e) {
        console.error('loadHomepageSlider failed', e);
    }
}

function openSliderManager() {
    if (!(currentUser && isAdminUser(currentUser.email))) {
        showAlert('Admins only', 'warning');
        return;
    }
    const modalEl = document.getElementById('sliderManagerModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    // Bind form handlers once
    bindSliderManagerHandlers();
    // Load existing slides into table
    refreshSlidesTable();
    modal.show();
}

async function saveSlide(slide) {
    try {
        if (!window.firebaseDb) throw new Error('Firestore unavailable');
        const col = window.firebaseDb.collection('homepageSlides');
        // Build payload without undefined values and never persist 'id' as a field
        const payload = {};
        if (typeof slide.imageUrl === 'string') payload.imageUrl = slide.imageUrl;
        if (typeof slide.linkUrl === 'string') payload.linkUrl = slide.linkUrl;
        if (typeof slide.order === 'number' && !Number.isNaN(slide.order)) payload.order = slide.order;

        if (slide.id) {
            await col.doc(slide.id).set(payload, { merge: true });
        } else {
            await col.add(payload);
        }
        showAlert('Slide saved', 'success');
        setTimeout(loadHomepageSlider, 300);
    } catch (e) {
        console.error('saveSlide failed', e);
        showAlert('Failed to save slide', 'danger');
    }
}

async function deleteSlide(id) {
    try {
        if (!id) return;
        if (!window.firebaseDb) throw new Error('Firestore unavailable');
        await window.firebaseDb.collection('homepageSlides').doc(id).delete();
        showAlert('Slide removed', 'info');
        setTimeout(loadHomepageSlider, 300);
    } catch (e) {
        console.error('deleteSlide failed', e);
        showAlert('Failed to remove slide', 'danger');
    }
}

function bindSliderManagerHandlers() {
    if (bindSliderManagerHandlers._bound) return;
    bindSliderManagerHandlers._bound = true;
    const form = document.getElementById('sliderForm');
    const resetBtn = document.getElementById('resetSlideBtn');
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('imageFile');
    const imageUrlInput = document.getElementById('imageUrl');

    function clearForm() {
        (document.getElementById('slideId') || {}).value = '';
        (document.getElementById('imageUrl') || {}).value = '';
        (document.getElementById('linkUrl') || {}).value = '';
        (document.getElementById('order') || {}).value = '1';
        if (fileInput) fileInput.value = '';
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = (document.getElementById('slideId') || {}).value || undefined;
            const imageUrl = (document.getElementById('imageUrl') || {}).value || '';
            const linkUrl = (document.getElementById('linkUrl') || {}).value || '';
            const order = parseInt((document.getElementById('order') || {}).value || '1', 10);
            await saveSlide({ id, imageUrl, linkUrl, order });
            clearForm();
            refreshSlidesTable();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            clearForm();
        });
    }

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', async function () {
            try {
                const file = fileInput.files && fileInput.files[0];
                if (!file) return showAlert('Please choose an image file first', 'warning');
                if (!window.firebase || !window.firebase.storage) return showAlert('Firebase Storage not available', 'danger');
                if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
                    return showAlert('Please log in before uploading images.', 'warning');
                }
                const storage = firebase.storage();
                const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
                const path = 'homepageSlides/' + window.firebaseAuth.currentUser.uid + '/' + Date.now() + '-' + safeName;
                const ref = storage.ref().child(path);
                const metadata = { contentType: file.type || 'image/jpeg', cacheControl: 'public, max-age=31536000' };

                // Disable controls during upload
                uploadBtn.disabled = true;
                const saveBtn = document.getElementById('saveSlideBtn');
                if (saveBtn) saveBtn.disabled = true;

                const task = ref.put(file, metadata);
                task.on('state_changed', function () { /* could show progress if desired */ }, function (error) {
                    console.error('Upload error', error);
                    uploadBtn.disabled = false;
                    if (saveBtn) saveBtn.disabled = false;
                    showAlert('Image upload failed', 'danger');
                }, async function () {
                    try {
                        const url = await ref.getDownloadURL();
                        if (imageUrlInput) imageUrlInput.value = url;
                        showAlert('Image uploaded', 'success');
                    } finally {
                        uploadBtn.disabled = false;
                        if (saveBtn) saveBtn.disabled = false;
                    }
                });
            } catch (e) {
                console.error('Upload failed', e);
                uploadBtn.disabled = false;
                const saveBtn = document.getElementById('saveSlideBtn');
                if (saveBtn) saveBtn.disabled = false;
                showAlert('Image upload failed', 'danger');
            }
        });
    }
}

async function refreshSlidesTable() {
    try {
        const tbody = document.getElementById('slidesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Loading...</td></tr>';
        let slides = [];
        if (window.firebaseDb) {
            const snap = await window.firebaseDb.collection('homepageSlides').orderBy('order', 'asc').get();
            slides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        if (!slides.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No slides yet</td></tr>';
            return;
        }
        tbody.innerHTML = slides.map(function (s) {
            const safeLink = (s.linkUrl || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<tr>' +
                '<td><img src="' + s.imageUrl + '" alt="" style="width:120px;height:40px;object-fit:cover"></td>' +
                '<td><a href="' + safeLink + '" target="_blank">' + safeLink + '</a></td>' +
                '<td>' + (s.order || 0) + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-outline-secondary me-1" data-action="edit" data-id="' + s.id + '"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger" data-action="remove" data-id="' + s.id + '"><i class="fas fa-trash"></i></button>' +
                '</td>' +
                '</tr>';
        }).join('');

        // Wire actions
        tbody.querySelectorAll('button[data-action]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                if (action === 'remove') {
                    await deleteSlide(id);
                    refreshSlidesTable();
                    return;
                }
                if (action === 'edit') {
                    // Load doc and fill form
                    try {
                        const doc = await window.firebaseDb.collection('homepageSlides').doc(id).get();
                        if (doc.exists) {
                            const data = doc.data();
                            (document.getElementById('slideId') || {}).value = id;
                            (document.getElementById('imageUrl') || {}).value = data.imageUrl || '';
                            (document.getElementById('linkUrl') || {}).value = data.linkUrl || '';
                            (document.getElementById('order') || {}).value = (data.order != null ? data.order : 1);
                        }
                    } catch (e) { /* ignore */ }
                }
            });
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('refreshSlidesTable failed', e);
    }
}


// Update authentication UI
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminLink = document.getElementById('adminLink');
    const profileLink = document.getElementById('profileLink');
    const loginGate = document.getElementById('loginGate');
    const appContent = document.getElementById('appContent');
    const welcomeSection = document.getElementById('welcome-section');
    const heroSlider = document.getElementById('hero-slider');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';

        // Show admin link for admin users
        if (currentUser.email && isAdminUser(currentUser.email) && adminLink) {
            adminLink.style.display = 'block';
        }
        // Show live diagnostics only to admins
        try {
            const diag = document.getElementById('live-diag');
            if (diag) {
                diag.style.display = isAdminUser(currentUser.email) ? '' : 'none';
            }
        } catch (_) { }
        if (profileLink) profileLink.style.display = 'block';

        // Show app content, hide login gate and welcome section for authenticated users
        if (loginGate) loginGate.style.display = 'none';
        if (appContent) appContent.style.display = '';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (heroSlider) heroSlider.style.display = '';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        try {
            const diag = document.getElementById('live-diag');
            if (diag) diag.style.display = 'none';
        } catch (_) { }

        // Show welcome section and slider for public view, hide app content, show login gate
        if (welcomeSection) welcomeSection.style.display = '';
        if (heroSlider) heroSlider.style.display = '';
        if (loginGate) loginGate.style.display = '';
        if (appContent) appContent.style.display = 'none';

        // Clear all nav highlights when logged out
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    // Update API config visibility for text generator
    if (typeof updateApiConfigVisibility === 'function') {
        updateApiConfigVisibility();
    }
}

// Check if user is admin
function isAdminUser(email) {
    const adminEmails = [
        'admin@futureleadersunion.com',
        'admin@educationalhub.com',
        'teacher@educationalhub.com'
    ];
    return adminEmails.includes(email.toLowerCase());
}

// Setup event listeners
function setupEventListeners() {
    // Check if we're running locally
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0' ||
        window.location.hostname.includes('localhost');

    // Login button -> Firebase Google Sign-In
    const loginBtnEl = document.getElementById('loginBtn');
    if (loginBtnEl) {
        loginBtnEl.addEventListener('click', function (e) {
            e.preventDefault();
            firebaseGoogleLogin();
        });
    }

    // Logout button -> Firebase signOut
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (logoutBtnEl) {
        logoutBtnEl.addEventListener('click', function (e) {
            e.preventDefault();
            firebaseLogout();
        });
    }


    // Smooth scrolling for navigation links (ignore bare '#')
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href.trim().length <= 1) {
                return; // let default do nothing for '#'
            }
            const target = document.querySelector(href);
            if (!target) {
                return;
            }
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Protect key navigation links to require login
    function guardLink(selector) {
        document.querySelectorAll(selector).forEach(a => {
            a.addEventListener('click', function (e) {
                const href = this.getAttribute('href') || '';
                if (!currentUser) {
                    e.preventDefault();
                    showAlert('Please log in to continue.', 'warning');
                    if (typeof firebaseGoogleLogin === 'function') {
                        firebaseGoogleLogin();
                    }
                    return false;
                }
            });
        });
    }

    guardLink('a[href="image-generator.html"]');
    guardLink('a[href="text-generator.html"]');
    guardLink('a[href="upload.html"]');
    guardLink('a[href^="quiz.html"]');
    guardLink('a[href^="lesson.html"]');
    guardLink('a[href="profile.html"]');
}

// Load user data
function loadUserData() {
    if (currentUser) {
        // Initialize student progress if not exists
        if (!studentProgress[currentUser.email]) {
            studentProgress[currentUser.email] = {
                name: currentUser.user_metadata?.full_name || currentUser.email,
                email: currentUser.email,
                lessonsCompleted: [],
                assignmentsSubmitted: [],
                quizScores: {},
                aiToolsUsed: {
                    imageGeneration: 0,
                    textGeneration: 0
                },
                lastActivity: new Date().toISOString()
            };
            saveStudentProgress();
        }
    }
}

// Save student progress to localStorage
function saveStudentProgress() {
    localStorage.setItem('studentProgress', JSON.stringify(studentProgress));
}

// Scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Animate elements on scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });

    document.querySelectorAll('.card, .hero-section').forEach(el => {
        observer.observe(el);
    });
}

// Navigation highlighting based on scroll position using Intersection Observer
function initializeScrollHighlighting() {
    const sections = [
        { id: 'lessons', navSelector: '[data-section="lessons"]', order: 1 },
        { id: 'tools', navSelector: '[data-section="tools"]', order: 2 },
        { id: 'classwork', navSelector: '[data-section="classwork"]', order: 3 }
    ];

    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    let activeSection = null;
    let lastActiveNav = null;
    let isUpdating = false;
    let lastScrollY = 0;
    let scrollDirection = 'down';

    function updateActiveNav(sectionId) {
        if (isUpdating) return;
        isUpdating = true;

        // Don't highlight nav links if user is not logged in
        if (!currentUser) {
            isUpdating = false;
            return;
        }

        // Find the corresponding nav link
        const targetSection = sections.find(s => s.id === sectionId);
        if (!targetSection) {
            isUpdating = false;
            return;
        }

        const activeNav = document.querySelector(targetSection.navSelector);
        if (!activeNav || activeNav === lastActiveNav) {
            isUpdating = false;
            return;
        }

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to the new nav item with smooth transition
        activeNav.classList.add('active');
        lastActiveNav = activeNav;

        // Reset updating flag after a short delay
        setTimeout(() => {
            isUpdating = false;
        }, 100);
    }

    // Track scroll direction
    function updateScrollDirection() {
        const currentScrollY = window.scrollY;
        scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = currentScrollY;
    }

    // Create intersection observer with stable settings
    const observer = new IntersectionObserver((entries) => {
        updateScrollDirection();

        // Find the most visible section with stable logic
        let mostVisibleSection = null;
        let maxVisibility = 0;

        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                const section = sections.find(s => s.id === entry.target.id);
                if (section && entry.intersectionRatio > maxVisibility) {
                    maxVisibility = entry.intersectionRatio;
                    mostVisibleSection = entry.target.id;
                }
            }
        });

        // Only update if we have a significantly different section
        if (mostVisibleSection && mostVisibleSection !== activeSection) {
            // Add hysteresis to prevent back and forth
            const currentSection = sections.find(s => s.id === activeSection);
            const newSection = sections.find(s => s.id === mostVisibleSection);

            if (!currentSection || !newSection) {
                activeSection = mostVisibleSection;
                updateActiveNav(mostVisibleSection);
            } else {
                // Only change if the new section is significantly more visible
                // or if we're scrolling in the expected direction
                const shouldChange =
                    (scrollDirection === 'down' && newSection.order > currentSection.order) ||
                    (scrollDirection === 'up' && newSection.order < currentSection.order) ||
                    maxVisibility > 0.7; // Very visible section

                if (shouldChange) {
                    activeSection = mostVisibleSection;
                    updateActiveNav(mostVisibleSection);
                }
            }
        }
    }, {
        root: null,
        rootMargin: '-10% 0px -10% 0px', // Larger margin for more stable detection
        threshold: [0, 0.3, 0.6, 1.0] // Fewer, more stable thresholds
    });

    // Observe all sections
    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
            observer.observe(element);
        }
    });

    // Initial setup: only highlight if user is logged in
    setTimeout(() => {
        if (!activeSection && currentUser) {
            const firstNav = document.querySelector('[data-section="lessons"]');
            if (firstNav) {
                firstNav.classList.add('active');
                lastActiveNav = firstNav;
            }
        }
    }, 100);
}

// Utility function to show loading state
function showLoading(element) {
    element.innerHTML = '<span class="loading"></span> Loading...';
    element.disabled = true;
}

// Utility function to hide loading state
function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    // Remove any existing alerts first
    const existingAlert = document.getElementById('pageAlert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.id = 'pageAlert';
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 9999 !important;
        max-width: 500px !important;
        width: 90% !important;
        margin: 0 !important;
        padding: 12px 16px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border: none !important;
        border-radius: 8px !important;
        pointer-events: auto !important;
    `;
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="flex-grow-1">
                ${message}
            </div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" style="pointer-events: auto;"></button>
        </div>
    `;

    // Create a dedicated container for alerts if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 9998 !important;
        `;
        document.body.appendChild(alertContainer);
    }

    alertContainer.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
                // Clean up empty alert container
                const container = document.getElementById('alertContainer');
                if (container && container.children.length === 0) {
                    container.remove();
                }
            }, 150); // Wait for fade animation
        }
    }, 5000);
}

// Update student progress
function updateStudentProgress(activity, data = {}) {
    console.log('updateStudentProgress called:', activity, data);

    if (!currentUser) {
        console.error('updateStudentProgress: No currentUser');
        return;
    }

    const userEmail = currentUser.email;
    if (!studentProgress[userEmail]) {
        studentProgress[userEmail] = {
            name: currentUser.user_metadata?.full_name || currentUser.email,
            email: currentUser.email,
            lessonsCompleted: [],
            assignmentsSubmitted: [],
            quizScores: {},
            aiToolsUsed: {
                imageGeneration: 0,
                textGeneration: 0
            },
            lastActivity: new Date().toISOString()
        };
    }

    switch (activity) {
        case 'lesson_completed':
            if (!studentProgress[userEmail].lessonsCompleted.includes(data.lessonId)) {
                studentProgress[userEmail].lessonsCompleted.push(data.lessonId);
            }
            break;
        case 'assignment_submitted':
            studentProgress[userEmail].assignmentsSubmitted.push({
                id: Date.now(),
                title: data.title,
                type: data.type,
                timestamp: new Date().toISOString()
            });
            break;
        case 'quiz_completed':
            studentProgress[userEmail].quizScores[data.quizId] = {
                score: data.score,
                total: data.total,
                timestamp: new Date().toISOString()
            };
            break;
        case 'ai_tool_used':
            if (data.tool === 'image') {
                studentProgress[userEmail].aiToolsUsed.imageGeneration++;
            } else if (data.tool === 'text') {
                studentProgress[userEmail].aiToolsUsed.textGeneration++;
            }
            break;
    }

    studentProgress[userEmail].lastActivity = new Date().toISOString();
    saveStudentProgress();
    console.log('Local progress updated:', studentProgress[userEmail]);

    // Persist to Firestore userProgress when available
    try {
        console.log('Checking Firebase availability:', {
            firebaseDb: !!window.firebaseDb,
            currentUser: !!currentUser,
            firebase: typeof firebase !== 'undefined'
        });

        if (window.firebaseDb && currentUser && typeof firebase !== 'undefined') {
            const userRef = window.firebaseDb.collection('userProgress').doc(currentUser.uid);
            const updatePayload = { lastUpdated: new Date().toISOString() };

            if (activity === 'lesson_completed' && data.lessonId) {
                updatePayload[`lessons.${data.lessonId}.status`] = 'completed';
                updatePayload[`lessons.${data.lessonId}.completedAt`] = new Date().toISOString();
            }

            if (activity === 'quiz_completed' && data.quizId) {
                updatePayload[`quizzes.${data.quizId}`] = {
                    score: data.score,
                    total: data.total,
                    percentage: data.percentage !== undefined ? data.percentage : Math.round((data.score / Math.max(1, data.total)) * 100),
                    timestamp: new Date().toISOString()
                };
                // Optionally mark lesson in-progress/completed when quiz passes threshold
                if (data.lessonId) {
                    updatePayload[`lessons.${data.lessonId}.status`] = (data.percentage || 0) >= 70 ? 'completed' : (data.status || 'in-progress');
                    updatePayload[`lessons.${data.lessonId}.lastQuizAt`] = new Date().toISOString();
                }
            }

            console.log('Writing to Firestore:', updatePayload);

            window.firebaseDb.runTransaction(async (tx) => {
                const doc = await tx.get(userRef);
                if (doc.exists) {
                    tx.set(userRef, updatePayload, { merge: true });
                } else {
                    tx.set(userRef, { userId: currentUser.uid, email: currentUser.email, ...updatePayload }, { merge: true });
                }
            }).then(() => {
                console.log('Firestore update successful');
            }).catch((error) => {
                console.error('Firestore transaction failed, trying fallback:', error);
                // Fallback to non-transaction merge
                userRef.set(updatePayload, { merge: true }).then(() => {
                    console.log('Firestore fallback update successful');
                }).catch((fallbackError) => {
                    console.error('Firestore fallback also failed:', fallbackError);
                });
            });
        } else {
            console.warn('Firebase not available for persistence');
        }
    } catch (e) {
        console.error('Error in Firestore persistence:', e);
    }
}

// Export student progress to CSV
function exportStudentProgress() {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-progress-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate CSV content
function generateCSVContent() {
    const headers = [
        'Student Name',
        'Email',
        'Lessons Completed',
        'Assignments Submitted',
        'Quiz Average Score',
        'AI Tools Used (Images)',
        'AI Tools Used (Text)',
        'Last Activity'
    ];

    const rows = Object.values(studentProgress).map(student => {
        const quizScores = Object.values(student.quizScores);
        const averageScore = quizScores.length > 0
            ? (quizScores.reduce((sum, quiz) => sum + (quiz.score / quiz.total), 0) / quizScores.length * 100).toFixed(2)
            : 'N/A';

        return [
            student.name,
            student.email,
            student.lessonsCompleted.length,
            student.assignmentsSubmitted.length,
            averageScore,
            student.aiToolsUsed.imageGeneration,
            student.aiToolsUsed.textGeneration,
            new Date(student.lastActivity).toLocaleDateString()
        ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// File upload handling
function handleFileUpload(input, callback) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        callback(e.target.result, file);
    };
    reader.readAsDataURL(file);
}

// Validate file type
function validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// API call helper
async function makeAPICall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Check authentication before protected actions
function requireAuth(callback) {
    if (!currentUser) {
        showAlert('Please log in to access this feature.', 'warning');
        firebaseGoogleLogin && firebaseGoogleLogin();
        return;
    }
    callback();
}

// Language switching functionality
function initializeLanguage() {
    updateLanguageUI();
    translatePage();
}

function toggleLanguage() {
    const currentIndex = languages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    currentLanguage = languages[nextIndex];
    localStorage.setItem('language', currentLanguage);
    updateLanguageUI();
    translatePage();
}

function updateLanguageUI() {
    const languageText = document.getElementById('languageText');
    if (languageText) {
        switch (currentLanguage) {
            case 'en':
                languageText.textContent = '中文';
                break;
            case 'zh-tw':
                languageText.textContent = '简体';
                break;
            case 'zh-cn':
                languageText.textContent = 'English';
                break;
        }
    }
}

function translatePage() {
    const elements = document.querySelectorAll('[data-en][data-zh-tw][data-zh-cn]');
    elements.forEach(element => {
        let text;
        switch (currentLanguage) {
            case 'en':
                text = element.getAttribute('data-en');
                break;
            case 'zh-tw':
                text = element.getAttribute('data-zh-tw');
                break;
            case 'zh-cn':
                text = element.getAttribute('data-zh-cn');
                break;
        }
        if (text) {
            // Support explicit \n in data-* attributes for line breaks
            const hasBreaks = /\\n/.test(text);
            if (hasBreaks) {
                element.innerHTML = text.replace(/\\n/g, '<br>');
            } else {
                element.textContent = text;
            }
        }
    });

    // Update page title
    switch (currentLanguage) {
        case 'en':
            document.title = 'Girls Go Tech AI Application - Learning Platform';
            break;
        case 'zh-tw':
            document.title = 'Girls Go Tech AI Application - Learning Platform';
            break;
        case 'zh-cn':
            document.title = 'Girls Go Tech AI Application - Learning Platform';
            break;
    }
}


// Theme Management Functions
function initializeTheme() {
    applyTheme(currentTheme);
    updateThemeUI();
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    updateThemeUI();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
}

function updateThemeUI() {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    if (themeIcon && themeText) {
        if (currentTheme === 'dark') {
            themeIcon.className = 'fas fa-sun me-1';
            themeText.textContent = 'Light';
        } else {
            themeIcon.className = 'fas fa-moon me-1';
            themeText.textContent = 'Dark';
        }
    }
}
