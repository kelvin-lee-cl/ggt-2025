// Upload functionality for classwork submissions

let selectedFiles = [];

document.addEventListener('DOMContentLoaded', function () {
    initializeUploadPage();
});

function initializeUploadPage() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');

    // File upload area click handler
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', handleFileSelection);

    // Drag and drop handlers
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleDrop);

    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmission);

    // Load recent submissions
    loadRecentSubmissions();
}

function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');

    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
}

function addFiles(files) {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    const validFiles = files.filter(file => {
        if (!validateFileType(file, allowedTypes)) {
            showAlert(`File "${file.name}" is not a supported format.`, 'warning');
            return false;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showAlert(`File "${file.name}" is too large. Maximum size is 10MB.`, 'warning');
            return false;
        }
        return true;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
}

function updateFileList() {
    const fileList = document.getElementById('fileList');

    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="d-flex align-items-center justify-content-between p-2 border rounded mb-2">
            <div class="d-flex align-items-center">
                <i class="fas fa-file me-2 text-primary"></i>
                <div>
                    <div class="fw-bold">${file.name}</div>
                    <small class="text-muted">${formatFileSize(file.size)}</small>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function handleFormSubmission(event) {
    event.preventDefault();

    requireAuth(() => {
        const title = document.getElementById('assignmentTitle').value;
        const type = document.getElementById('assignmentType').value;
        const description = document.getElementById('description').value;

        if (selectedFiles.length === 0) {
            showAlert('Please select at least one file to upload.', 'warning');
            return;
        }

        submitAssignment(title, type, description, selectedFiles);
    });
}

function submitAssignment(title, type, description, files) {
    const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    showLoading(submitBtn);

    // Simulate file upload process
    setTimeout(() => {
        // Update student progress
        updateStudentProgress('assignment_submitted', {
            title: title,
            type: type
        });

        // Save to localStorage for local storage
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const submission = {
            id: Date.now(),
            title: title,
            type: type,
            description: description,
            files: files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            })),
            timestamp: new Date().toISOString(),
            studentEmail: currentUser.email
        };

        submissions.push(submission);
        localStorage.setItem('submissions', JSON.stringify(submissions));

        hideLoading(submitBtn, originalText);
        showAlert('Assignment submitted successfully!', 'success');

        // Reset form
        document.getElementById('uploadForm').reset();
        selectedFiles = [];
        updateFileList();
        loadRecentSubmissions();
    }, 2000);
}

function loadRecentSubmissions() {
    if (!currentUser) return;

    const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
    const userSubmissions = submissions.filter(sub => sub.studentEmail === currentUser.email);

    const recentSubmissionsDiv = document.getElementById('recentSubmissions');

    if (userSubmissions.length === 0) {
        recentSubmissionsDiv.innerHTML = '<p class="text-muted">No submissions yet. Upload your first assignment!</p>';
        return;
    }

    recentSubmissionsDiv.innerHTML = userSubmissions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(submission => `
            <div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                <div>
                    <h6 class="mb-1">${submission.title}</h6>
                    <small class="text-muted">${submission.type} • ${submission.files.length} file(s)</small>
                </div>
                <div class="text-end">
                    <small class="text-muted">${new Date(submission.timestamp).toLocaleDateString()}</small>
                    <div>
                        <span class="badge bg-success">Submitted</span>
                    </div>
                </div>
            </div>
        `).join('');
}
