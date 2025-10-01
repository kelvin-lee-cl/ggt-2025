// Quiz functionality for Q&A assessments

let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let quizData = {};

// Quiz questions data
const quizQuestions = {
    lesson1: {
        title: "Lesson 1: Basic Concepts Quiz",
        questions: [
            {
                question: "What is the primary purpose of HTML?",
                options: [
                    "To style web pages",
                    "To structure web content",
                    "To add interactivity",
                    "To create databases"
                ],
                correct: 1
            },
            {
                question: "Which CSS property is used to change text color?",
                options: [
                    "text-color",
                    "color",
                    "font-color",
                    "text-style"
                ],
                correct: 1
            },
            {
                question: "What does CSS stand for?",
                options: [
                    "Computer Style Sheets",
                    "Cascading Style Sheets",
                    "Creative Style Sheets",
                    "Colorful Style Sheets"
                ],
                correct: 1
            },
            {
                question: "Which HTML tag is used to create a hyperlink?",
                options: [
                    "<link>",
                    "<a>",
                    "<href>",
                    "<url>"
                ],
                correct: 1
            },
            {
                question: "What is the correct way to include an external CSS file?",
                options: [
                    "<style src='style.css'>",
                    "<link rel='stylesheet' href='style.css'>",
                    "<css src='style.css'>",
                    "<import src='style.css'>"
                ],
                correct: 1
            }
        ]
    },
    lesson2: {
        title: "Lesson 2: Advanced Topics Quiz",
        questions: [
            {
                question: "What is JavaScript primarily used for?",
                options: [
                    "Styling web pages",
                    "Adding interactivity to web pages",
                    "Creating databases",
                    "Designing layouts"
                ],
                correct: 1
            },
            {
                question: "Which method is used to add an element to the end of an array?",
                options: [
                    "push()",
                    "add()",
                    "append()",
                    "insert()"
                ],
                correct: 0
            },
            {
                question: "What is the purpose of the 'this' keyword in JavaScript?",
                options: [
                    "To refer to the current object",
                    "To create new variables",
                    "To import modules",
                    "To define functions"
                ],
                correct: 0
            },
            {
                question: "Which of the following is NOT a JavaScript data type?",
                options: [
                    "string",
                    "number",
                    "boolean",
                    "float"
                ],
                correct: 3
            },
            {
                question: "What does DOM stand for?",
                options: [
                    "Document Object Model",
                    "Data Object Management",
                    "Dynamic Object Method",
                    "Document Order Management"
                ],
                correct: 0
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function () {
    initializeQuizPage();
});

function initializeQuizPage() {
    // Quiz functionality is handled by the functions below
}

function startQuiz(quizId) {
    requireAuth(() => {
        currentQuiz = quizId;
        quizData = quizQuestions[quizId];
        currentQuestionIndex = 0;
        userAnswers = {};

        document.getElementById('quizSelection').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';

        document.getElementById('quizTitle').textContent = quizData.title;
        loadQuestion();
    });
}

function loadQuestion() {
    const question = quizData.questions[currentQuestionIndex];
    const questionContainer = document.getElementById('questionContainer');

    // Update progress
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    document.getElementById('quizProgress').style.width = progress + '%';
    document.getElementById('questionCounter').textContent =
        `Question ${currentQuestionIndex + 1} of ${quizData.questions.length}`;

    // Create question HTML
    questionContainer.innerHTML = `
        <div class="quiz-question">
            <h5 class="mb-4">${question.question}</h5>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <div class="quiz-option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
                         onclick="selectAnswer(${index})">
                        <div class="d-flex align-items-center">
                            <div class="form-check me-3">
                                <input class="form-check-input" type="radio" name="question${currentQuestionIndex}" 
                                       value="${index}" ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
                            </div>
                            <div>${option}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === quizData.questions.length - 1) {
        nextBtn.innerHTML = 'Submit Quiz<i class="fas fa-check ms-2"></i>';
        nextBtn.onclick = submitQuiz;
    } else {
        nextBtn.innerHTML = 'Next<i class="fas fa-arrow-right ms-2"></i>';
        nextBtn.onclick = nextQuestion;
    }
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    loadQuestion(); // Reload to update selection
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function submitQuiz() {
    requireAuth(() => {
        const score = calculateScore();
        const percentage = Math.round((score / quizData.questions.length) * 100);

        // Update student progress
        updateStudentProgress('quiz_completed', {
            quizId: currentQuiz,
            score: score,
            total: quizData.questions.length
        });

        // Show results
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';

        document.getElementById('finalScore').textContent = `Your Score: ${score}/${quizData.questions.length} (${percentage}%)`;

        let message = '';
        if (percentage >= 90) {
            message = 'Excellent work! You have a strong understanding of the material.';
        } else if (percentage >= 80) {
            message = 'Good job! You have a solid grasp of the concepts.';
        } else if (percentage >= 70) {
            message = 'Not bad! Consider reviewing some topics for better understanding.';
        } else {
            message = 'Keep studying! Review the material and try again.';
        }

        document.getElementById('scoreMessage').textContent = message;
    });
}

function calculateScore() {
    let score = 0;
    quizData.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            score++;
        }
    });
    return score;
}

function retakeQuiz() {
    startQuiz(currentQuiz);
}

function backToSelection() {
    document.getElementById('quizSelection').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
}
