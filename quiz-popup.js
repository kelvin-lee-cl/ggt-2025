// Quiz Popup System for Lesson Pages
class QuizPopup {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.score = 0;
        this.quizData = null;
    }

    // Initialize quiz with lesson-specific questions
    initQuiz(lessonId) {
        this.quizData = this.getQuizData(lessonId);
        this.questions = this.quizData.questions;
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.score = 0;
        this.showQuiz();
    }

    // Get quiz data based on lesson ID
    getQuizData(lessonId) {
        const quizDatabase = {
            'lesson1': {
                title: 'Lesson 1: Introduction Quiz',
                questions: [
                    {
                        question: 'What is the primary purpose of this educational platform?',
                        options: [
                            'To provide entertainment',
                            'To facilitate interactive learning with AI tools',
                            'To replace traditional classrooms',
                            'To sell educational products'
                        ],
                        correct: 1,
                        explanation: 'The platform is designed to facilitate interactive learning with AI-powered tools.'
                    },
                    {
                        question: 'Which AI tools are available on this platform?',
                        options: [
                            'Only text generation',
                            'Only image generation',
                            'Both text and image generation',
                            'No AI tools available'
                        ],
                        correct: 2,
                        explanation: 'The platform offers both text generation and image generation AI tools.'
                    },
                    {
                        question: 'How many languages does this platform support?',
                        options: [
                            'One language only',
                            'Two languages',
                            'Three languages',
                            'Four languages'
                        ],
                        correct: 2,
                        explanation: 'The platform supports English, Traditional Chinese, and Simplified Chinese.'
                    },
                    {
                        question: 'What is the main benefit of using AI tools in education?',
                        options: [
                            'To replace teachers',
                            'To enhance learning experiences and creativity',
                            'To reduce study time',
                            'To make learning easier'
                        ],
                        correct: 1,
                        explanation: 'AI tools enhance learning experiences and boost creativity in educational settings.'
                    },
                    {
                        question: 'Which feature allows students to track their progress?',
                        options: [
                            'Admin dashboard only',
                            'Progress tracking system',
                            'Email notifications',
                            'Social media integration'
                        ],
                        correct: 1,
                        explanation: 'The platform includes a comprehensive progress tracking system for students.'
                    }
                ]
            },
            'lesson2': {
                title: 'Lesson 2: Advanced Topics Quiz',
                questions: [
                    {
                        question: 'What is the most important aspect of advanced learning?',
                        options: [
                            'Memorizing facts',
                            'Understanding concepts deeply',
                            'Completing assignments quickly',
                            'Following instructions exactly'
                        ],
                        correct: 1,
                        explanation: 'Advanced learning requires deep understanding of concepts rather than just memorization.'
                    },
                    {
                        question: 'How should students approach complex topics?',
                        options: [
                            'Skip difficult parts',
                            'Break them down into smaller parts',
                            'Ask someone else to explain',
                            'Focus only on easy parts'
                        ],
                        correct: 1,
                        explanation: 'Complex topics should be broken down into manageable smaller parts for better understanding.'
                    },
                    {
                        question: 'What role does critical thinking play in advanced learning?',
                        options: [
                            'No role at all',
                            'Minimal role',
                            'Essential role',
                            'Optional role'
                        ],
                        correct: 2,
                        explanation: 'Critical thinking is essential for advanced learning and problem-solving.'
                    },
                    {
                        question: 'Which method is most effective for retaining advanced knowledge?',
                        options: [
                            'Reading once',
                            'Active practice and application',
                            'Listening to lectures',
                            'Taking notes only'
                        ],
                        correct: 1,
                        explanation: 'Active practice and application are most effective for retaining advanced knowledge.'
                    },
                    {
                        question: 'What should students do when they encounter difficulties?',
                        options: [
                            'Give up immediately',
                            'Seek help and persist',
                            'Ignore the problem',
                            'Blame external factors'
                        ],
                        correct: 1,
                        explanation: 'Students should seek help and persist when encountering difficulties in learning.'
                    }
                ]
            },
            'lesson3': {
                title: 'Lesson 3: Practical Applications Quiz',
                questions: [
                    {
                        question: 'What is the primary goal of practical applications?',
                        options: [
                            'To test theoretical knowledge',
                            'To apply learning in real-world scenarios',
                            'To complete assignments',
                            'To get good grades'
                        ],
                        correct: 1,
                        explanation: 'Practical applications help students apply their learning in real-world scenarios.'
                    },
                    {
                        question: 'Which skill is most important for practical applications?',
                        options: [
                            'Memorization',
                            'Problem-solving',
                            'Speed',
                            'Perfectionism'
                        ],
                        correct: 1,
                        explanation: 'Problem-solving skills are crucial for successful practical applications.'
                    },
                    {
                        question: 'How should students approach real-world problems?',
                        options: [
                            'Use only textbook methods',
                            'Apply creative and flexible thinking',
                            'Follow instructions exactly',
                            'Avoid difficult problems'
                        ],
                        correct: 1,
                        explanation: 'Real-world problems require creative and flexible thinking approaches.'
                    },
                    {
                        question: 'What is the benefit of hands-on practice?',
                        options: [
                            'It saves time',
                            'It reinforces learning and builds confidence',
                            'It\'s easier than theory',
                            'It requires less effort'
                        ],
                        correct: 1,
                        explanation: 'Hands-on practice reinforces learning and builds confidence in practical skills.'
                    },
                    {
                        question: 'Which approach is best for learning from mistakes?',
                        options: [
                            'Ignore mistakes',
                            'Analyze and learn from them',
                            'Blame others',
                            'Avoid making mistakes'
                        ],
                        correct: 1,
                        explanation: 'Analyzing and learning from mistakes is essential for improvement and growth.'
                    }
                ]
            }
        };

        return quizDatabase[lessonId] || quizDatabase['lesson1'];
    }

    // Show quiz popup
    showQuiz() {
        console.log('Showing quiz popup...');

        // Remove any existing quiz modal
        const existingModal = document.getElementById('quizModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.id = 'quizModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-question-circle me-2"></i>${this.quizData.title}
                        </h5>
                        <button type="button" class="btn-close" onclick="quizPopup.closeQuiz()"></button>
                    </div>
                    <div class="modal-body" id="quizContent">
                        ${this.renderQuestion()}
                    </div>
                    <div class="modal-footer">
                        <div class="d-flex justify-content-between w-100">
                            <span class="text-muted">Question ${this.currentQuestion + 1} of ${this.questions.length}</span>
                            <div>
                                <button class="btn btn-secondary me-2" onclick="quizPopup.closeQuiz()">Cancel</button>
                                <button class="btn btn-primary" id="nextBtn" onclick="quizPopup.nextQuestion()" disabled>Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'quizBackdrop';
        document.body.appendChild(backdrop);

        document.body.appendChild(modal);

        // Add body class to prevent scrolling
        document.body.classList.add('modal-open');
    }

    // Render current question
    renderQuestion() {
        const question = this.questions[this.currentQuestion];
        return `
            <div class="quiz-question">
                <h6 class="mb-3">${question.question}</h6>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" onclick="quizPopup.selectAnswer(${index})" data-answer="${index}">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="quizAnswer" value="${index}" id="option${index}">
                                <label class="form-check-label" for="option${index}">
                                    ${option}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Select answer
    selectAnswer(answerIndex) {
        // Remove previous selection
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add selection to current option
        const selectedOption = document.querySelector(`[data-answer="${answerIndex}"]`);
        selectedOption.classList.add('selected');

        // Check the radio button
        document.getElementById(`option${answerIndex}`).checked = true;

        // Enable next button
        document.getElementById('nextBtn').disabled = false;

        // Store answer
        this.userAnswers[this.currentQuestion] = answerIndex;
    }

    // Next question
    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            document.getElementById('quizContent').innerHTML = this.renderQuestion();
            document.getElementById('nextBtn').disabled = true;

            // Update footer
            const footer = document.querySelector('.modal-footer .text-muted');
            footer.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;

            if (this.currentQuestion === this.questions.length - 1) {
                document.getElementById('nextBtn').textContent = 'Finish Quiz';
            }
        } else {
            this.finishQuiz();
        }
    }

    // Finish quiz and show results
    finishQuiz() {
        this.calculateScore();
        this.showResults();
    }

    // Calculate score
    calculateScore() {
        this.score = 0;
        this.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correct) {
                this.score++;
            }
        });
    }

    // Show results
    showResults() {
        const percentage = Math.round((this.score / this.questions.length) * 100);
        const isPassing = percentage >= 70;

        document.getElementById('quizContent').innerHTML = `
            <div class="quiz-results text-center">
                <div class="mb-4">
                    <i class="fas fa-${isPassing ? 'trophy' : 'redo'} fa-3x text-${isPassing ? 'success' : 'warning'} mb-3"></i>
                    <h4 class="text-${isPassing ? 'success' : 'warning'}">${isPassing ? 'Congratulations!' : 'Keep Learning!'}</h4>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Your Score</h5>
                                <h2 class="text-primary">${this.score}/${this.questions.length}</h2>
                                <p class="text-muted">${percentage}%</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Status</h5>
                                <h4 class="text-${isPassing ? 'success' : 'warning'}">${isPassing ? 'Passed' : 'Needs Improvement'}</h4>
                                <p class="text-muted">${isPassing ? 'Great job!' : 'Review the material'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="quiz-review">
                    <h5 class="mb-3">Question Review</h5>
                    ${this.questions.map((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correct;
            return `
                            <div class="card mb-3">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="mb-0">Question ${index + 1}</h6>
                                        <span class="badge bg-${isCorrect ? 'success' : 'danger'}">
                                            ${isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>
                                    <p class="mb-2">${question.question}</p>
                                    <div class="mb-2">
                                        <strong>Your Answer:</strong> ${question.options[userAnswer] || 'Not answered'}
                                    </div>
                                    <div class="mb-2">
                                        <strong>Correct Answer:</strong> ${question.options[question.correct]}
                                    </div>
                                    <div class="text-muted">
                                        <strong>Explanation:</strong> ${question.explanation}
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        // Update footer
        document.querySelector('.modal-footer').innerHTML = `
            <div class="d-flex justify-content-between w-100">
                <button class="btn btn-outline-secondary" onclick="quizPopup.retakeQuiz()">
                    <i class="fas fa-redo me-2"></i>Retake Quiz
                </button>
                <div>
                    <button class="btn btn-secondary me-2" onclick="quizPopup.closeQuiz()">Close</button>
                    <button class="btn btn-primary" onclick="quizPopup.submitResults()">
                        <i class="fas fa-save me-2"></i>Save Results
                    </button>
                </div>
            </div>
        `;

        // Save results to localStorage
        this.saveResults(percentage, isPassing);
    }

    // Save quiz results
    saveResults(percentage, isPassing) {
        const results = {
            lessonId: this.quizData.title,
            score: this.score,
            total: this.questions.length,
            percentage: percentage,
            passed: isPassing,
            timestamp: new Date().toISOString(),
            answers: this.userAnswers
        };

        // Save to localStorage
        const quizHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        quizHistory.push(results);
        localStorage.setItem('quizHistory', JSON.stringify(quizHistory));

        // Update student progress
        if (typeof updateStudentProgress === 'function') {
            updateStudentProgress('quiz_completed', {
                lessonId: this.quizData.title,
                score: percentage,
                passed: isPassing
            });
        }
    }

    // Retake quiz
    retakeQuiz() {
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.score = 0;
        document.getElementById('quizContent').innerHTML = this.renderQuestion();
        document.querySelector('.modal-footer').innerHTML = `
            <div class="d-flex justify-content-between w-100">
                <span class="text-muted">Question ${this.currentQuestion + 1} of ${this.questions.length}</span>
                <div>
                    <button class="btn btn-secondary me-2" onclick="quizPopup.closeQuiz()">Cancel</button>
                    <button class="btn btn-primary" id="nextBtn" onclick="quizPopup.nextQuestion()" disabled>Next</button>
                </div>
            </div>
        `;
    }

    // Submit results
    submitResults() {
        showAlert('Quiz results saved successfully!', 'success');
        this.closeQuiz();
    }

    // Close quiz
    closeQuiz() {
        const modal = document.getElementById('quizModal');
        const backdrop = document.getElementById('quizBackdrop');

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

// Initialize quiz popup
const quizPopup = new QuizPopup();

// Function to start quiz (called from lesson pages)
function startQuiz(lessonId) {
    console.log('startQuiz called with lessonId:', lessonId);
    if (typeof quizPopup !== 'undefined') {
        quizPopup.initQuiz(lessonId);
    } else {
        console.error('quizPopup not defined');
    }
}

// Make sure the function is globally accessible
window.startQuiz = startQuiz;
