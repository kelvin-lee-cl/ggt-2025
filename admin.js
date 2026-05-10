// Admin dashboard functionality

document.addEventListener('DOMContentLoaded', function () {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    checkAdminAccess();
}

function checkAdminAccess() {
    if (!currentUser) {
        showAlert('Please log in to access the admin dashboard.', 'warning');
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        }
        return;
    }

    if (!isAdminUser(currentUser.email)) {
        showAlert('Access denied. Admin privileges required.', 'danger');
        document.getElementById('adminAccessCheck').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        return;
    }

    // User is admin, show dashboard
    document.getElementById('adminAccessCheck').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';

    loadAdminData();
}

function loadAdminData() {
    loadStatistics();
    loadStudentProgress();
    loadRecentActivity();
}

function loadStatistics() {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
    const submissions = JSON.parse(localStorage.getItem('submissions')) || {};

    const students = Object.values(studentProgress);
    const totalStudents = students.length;
    const totalSubmissions = Object.keys(submissions).length;

    let totalQuizzes = 0;
    let totalAITools = 0;

    students.forEach(student => {
        totalQuizzes += Object.keys(student.quizScores || {}).length;
        totalAITools += (student.aiToolsUsed?.imageGeneration || 0) + (student.aiToolsUsed?.textGeneration || 0);
    });

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalSubmissions').textContent = totalSubmissions;
    document.getElementById('totalQuizzes').textContent = totalQuizzes;
    document.getElementById('totalAITools').textContent = totalAITools;
}

function loadStudentProgress() {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
    const tableBody = document.getElementById('studentProgressTable');

    if (Object.keys(studentProgress).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-users fa-2x mb-3"></i>
                    <p>No student data available yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = Object.values(studentProgress).map(student => {
        const quizScores = Object.values(student.quizScores || {});
        const averageScore = quizScores.length > 0
            ? (quizScores.reduce((sum, quiz) => sum + (quiz.score / quiz.total), 0) / quizScores.length * 100).toFixed(1)
            : 'N/A';

        const totalAITools = (student.aiToolsUsed?.imageGeneration || 0) + (student.aiToolsUsed?.textGeneration || 0);
        const progressPercentage = calculateProgressPercentage(student);

        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>
                    <span class="badge bg-primary">${student.lessonsCompleted?.length || 0}</span>
                </td>
                <td>
                    <span class="badge bg-success">${student.assignmentsSubmitted?.length || 0}</span>
                </td>
                <td>
                    <span class="badge ${averageScore >= 80 ? 'bg-success' : averageScore >= 60 ? 'bg-warning' : 'bg-danger'}">
                        ${averageScore}%
                    </span>
                </td>
                <td>
                    <span class="badge bg-info">${totalAITools}</span>
                </td>
                <td>${new Date(student.lastActivity).toLocaleDateString()}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${progressPercentage}%">
                            ${progressPercentage}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function calculateProgressPercentage(student) {
    const lessonsCompleted = student.lessonsCompleted?.length || 0;
    const assignmentsSubmitted = student.assignmentsSubmitted?.length || 0;
    const quizzesCompleted = Object.keys(student.quizScores || {}).length;
    const aiToolsUsed = (student.aiToolsUsed?.imageGeneration || 0) + (student.aiToolsUsed?.textGeneration || 0);

    // Weighted scoring: lessons (40%), assignments (30%), quizzes (20%), AI tools (10%)
    const lessonScore = Math.min(lessonsCompleted * 20, 40); // Max 40 points
    const assignmentScore = Math.min(assignmentsSubmitted * 10, 30); // Max 30 points
    const quizScore = Math.min(quizzesCompleted * 10, 20); // Max 20 points
    const aiScore = Math.min(aiToolsUsed * 2, 10); // Max 10 points

    const totalScore = lessonScore + assignmentScore + quizScore + aiScore;
    return Math.min(Math.round(totalScore), 100);
}

function loadRecentActivity() {
    loadRecentSubmissions();
    loadRecentQuizResults();
}

function loadRecentSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
    const recentSubmissions = submissions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    const container = document.getElementById('recentSubmissionsList');

    if (recentSubmissions.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent submissions.</p>';
        return;
    }

    container.innerHTML = recentSubmissions.map(submission => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
            <div>
                <h6 class="mb-1">${submission.title}</h6>
                <small class="text-muted">${submission.studentEmail} • ${submission.type}</small>
            </div>
            <small class="text-muted">${new Date(submission.timestamp).toLocaleDateString()}</small>
        </div>
    `).join('');
}

function loadRecentQuizResults() {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};
    const recentResults = [];

    Object.values(studentProgress).forEach(student => {
        Object.entries(student.quizScores || {}).forEach(([quizId, result]) => {
            recentResults.push({
                studentName: student.name,
                studentEmail: student.email,
                quizId: quizId,
                score: result.score,
                total: result.total,
                percentage: Math.round((result.score / result.total) * 100),
                timestamp: result.timestamp
            });
        });
    });

    recentResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topResults = recentResults.slice(0, 5);

    const container = document.getElementById('recentQuizResults');

    if (topResults.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent quiz results.</p>';
        return;
    }

    container.innerHTML = topResults.map(result => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
            <div>
                <h6 class="mb-1">${result.studentName}</h6>
                <small class="text-muted">Quiz: ${result.quizId}</small>
            </div>
            <div class="text-end">
                <span class="badge ${result.percentage >= 80 ? 'bg-success' : result.percentage >= 60 ? 'bg-warning' : 'bg-danger'}">
                    ${result.percentage}%
                </span>
                <br>
                <small class="text-muted">${new Date(result.timestamp).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

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

    showAlert('Student progress exported successfully!', 'success');
}

function exportSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
    const jsonContent = JSON.stringify(submissions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showAlert('Submissions exported successfully!', 'success');
}

function generateCSVContent() {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress')) || {};

    const headers = [
        'Student Name',
        'Email',
        'Lessons Completed',
        'Assignments Submitted',
        'Quiz Average Score',
        'AI Tools Used (Images)',
        'AI Tools Used (Text)',
        'Total AI Tools Used',
        'Last Activity',
        'Progress Percentage'
    ];

    const rows = Object.values(studentProgress).map(student => {
        const quizScores = Object.values(student.quizScores || {});
        const averageScore = quizScores.length > 0
            ? (quizScores.reduce((sum, quiz) => sum + (quiz.score / quiz.total), 0) / quizScores.length * 100).toFixed(2)
            : 'N/A';

        const imageTools = student.aiToolsUsed?.imageGeneration || 0;
        const textTools = student.aiToolsUsed?.textGeneration || 0;
        const totalAITools = imageTools + textTools;
        const progressPercentage = calculateProgressPercentage(student);

        return [
            student.name,
            student.email,
            student.lessonsCompleted?.length || 0,
            student.assignmentsSubmitted?.length || 0,
            averageScore,
            imageTools,
            textTools,
            totalAITools,
            new Date(student.lastActivity).toLocaleDateString(),
            progressPercentage
        ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}
