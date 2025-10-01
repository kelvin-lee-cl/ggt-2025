// Main JavaScript for Educational Hub

// Global variables
let currentUser = null;
let studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'light';
const languages = ['en', 'zh-tw', 'zh-cn'];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeNetlifyIdentity();
    loadUserData();
    setupEventListeners();
    animateOnScroll();
    initializeLanguage();
    initializeTheme();
});

// Initialize Netlify Identity
function initializeNetlifyIdentity() {
    // Check if we're running locally
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0' ||
        window.location.hostname.includes('localhost');

    if (isLocalhost) {
        console.log("Running locally - using demo authentication");
        setupDemoAuth();
        return;
    }

    // Only use Netlify Identity in production
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            currentUser = user;
            updateAuthUI();
            console.log("Netlify Identity initialized");
        });

        window.netlifyIdentity.on("login", user => {
            currentUser = user;
            updateAuthUI();
            console.log("User logged in:", user);
            showAlert(`Welcome back, ${user.user_metadata?.full_name || user.email}!`, 'success');
        });

        window.netlifyIdentity.on("logout", () => {
            currentUser = null;
            updateAuthUI();
            console.log("User logged out");
            showAlert("You have been logged out successfully.", 'info');
        });
    } else {
        console.log("Netlify Identity not available - using demo mode");
        setupDemoAuth();
    }
}

// Demo authentication for local development
function setupDemoAuth() {
    // Check if user is already logged in (demo mode)
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
        currentUser = JSON.parse(demoUser);
        updateAuthUI();
    }
}

// Update authentication UI
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminLink = document.getElementById('adminLink');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';

        // Show admin link for admin users
        if (currentUser.email && isAdminUser(currentUser.email) && adminLink) {
            adminLink.style.display = 'block';
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Check if user is admin
function isAdminUser(email) {
    const adminEmails = [
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

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (isLocalhost || !window.netlifyIdentity) {
                // Demo mode - show login options
                showDemoLoginOptions();
            } else {
                window.netlifyIdentity.open();
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (isLocalhost || !window.netlifyIdentity) {
                // Demo mode logout
                demoLogout();
            } else {
                window.netlifyIdentity.logout();
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
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
    if (!currentUser) return;

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
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        }
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
            element.textContent = text;
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

// Demo authentication functions for local development
function showDemoLoginOptions() {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user-circle me-2"></i>Demo Login Options
                    </h5>
                    <button type="button" class="btn-close" onclick="closeDemoModal()"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Local Development Mode</strong><br>
                        You're running on localhost, so we're using demo authentication instead of Netlify Identity.
                    </div>
                    <p>Choose a demo account to login:</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="demoLogin('gmail')">
                            <i class="fab fa-google me-2"></i>Login with Gmail Demo
                        </button>
                        <button class="btn btn-info" onclick="demoLogin('outlook')">
                            <i class="fab fa-microsoft me-2"></i>Login with Outlook Demo
                        </button>
                        <button class="btn btn-success" onclick="demoLogin('admin')">
                            <i class="fas fa-user-shield me-2"></i>Login as Admin Demo
                        </button>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">
                            <strong>Demo Accounts:</strong><br>
                            • Gmail: student@gmail.com<br>
                            • Outlook: student@outlook.com<br>
                            • Admin: admin@educationalhub.com
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeDemoModal() {
    const modal = document.querySelector('.modal.show');
    if (modal) {
        modal.remove();
    }
}

function demoLogin(provider) {
    let user;
    switch (provider) {
        case 'gmail':
            user = {
                email: 'student@gmail.com',
                user_metadata: {
                    full_name: 'John Student'
                },
                app_metadata: {
                    provider: 'google'
                }
            };
            break;
        case 'outlook':
            user = {
                email: 'student@outlook.com',
                user_metadata: {
                    full_name: 'Jane Student'
                },
                app_metadata: {
                    provider: 'microsoft'
                }
            };
            break;
        case 'admin':
            user = {
                email: 'admin@educationalhub.com',
                user_metadata: {
                    full_name: 'Admin User'
                },
                app_metadata: {
                    provider: 'email'
                }
            };
            break;
    }

    // Store demo user
    localStorage.setItem('demoUser', JSON.stringify(user));
    currentUser = user;
    updateAuthUI();
    closeDemoModal();
    showAlert(`Welcome, ${user.user_metadata.full_name}!`, 'success');
}

function demoLogout() {
    localStorage.removeItem('demoUser');
    currentUser = null;
    updateAuthUI();
    showAlert("You have been logged out successfully.", 'info');
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
