// Firebase Configuration
// Replace these values with your actual Firebase project configuration

const firebaseConfig = {
    apiKey: "AIzaSyDd77LjKa3wuaumWHtYhN_3tsVpD99juK0",
    authDomain: "ggt-2025.firebaseapp.com",
    projectId: "ggt-2025",
    storageBucket: "ggt-2025.firebasestorage.app",
    messagingSenderId: "822726025795",
    appId: "1:822726025795:web:4e059a32a26e5bc336eaf6",
    measurementId: "G-72DQBYXSVN"
};

// Firebase Collections Structure:
// 
// studentProgress: {
//   - userId: string
//   - lessonId: string
//   - action: string (lesson_started, lesson_completed, lesson_restarted, quiz_taken, exercise_submitted)
//   - data: object (additional data like quiz scores, exercise content)
//   - timestamp: string (ISO date)
// }
//
// userProgress: {
//   - userId: string
//   - lessons: {
//     lesson1: { status: 'completed', completedAt: '2024-01-01T00:00:00.000Z' },
//     lesson2: { status: 'in-progress', startedAt: '2024-01-01T00:00:00.000Z' }
//   }
//   - createdAt: string
//   - lastUpdated: string
// }

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}