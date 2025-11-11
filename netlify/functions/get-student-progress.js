exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Authentication check
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const apiKey = authHeader?.replace('Bearer ', '') || event.queryStringParameters?.apiKey;

        const validApiKeys = [
            'admin-token-2024',
            'secure-admin-key',
            'third-party-api-key',
            process.env.THIRD_PARTY_API_KEY
        ].filter(Boolean);

        if (!apiKey || !validApiKeys.includes(apiKey)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'Unauthorized: Invalid API key',
                    message: 'Please provide a valid API key in Authorization header or query parameter'
                })
            };
        }

        // Initialize Firebase Admin SDK
        const admin = require('firebase-admin');

        if (!admin.apps.length) {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : null;

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: 'ggt-2025'
                });
            } else {
                // Fallback to default credentials
                admin.initializeApp({
                    projectId: 'ggt-2025'
                });
            }
        }

        const db = admin.firestore();

        // Get all student data
        const [userProgressSnapshot, submissionsSnapshot, studentProgressSnapshot] = await Promise.all([
            db.collection('userProgress').get(),
            db.collection('exerciseSubmissions').get(),
            db.collection('studentProgress').get()
        ]);

        // Process user progress data
        const students = [];
        userProgressSnapshot.forEach(doc => {
            const data = doc.data();
            students.push({
                userId: doc.id,
                email: data.email,
                lessons: data.lessons || {},
                createdAt: data.createdAt,
                lastUpdated: data.lastUpdated,
                totalLessons: Object.keys(data.lessons || {}).length,
                completedLessons: Object.values(data.lessons || {}).filter(lesson => lesson.status === 'completed').length
            });
        });

        // Process submissions data
        const submissionsByUser = {};
        submissionsSnapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            if (!submissionsByUser[userId]) {
                submissionsByUser[userId] = [];
            }
            submissionsByUser[userId].push({
                id: doc.id,
                lessonId: data.lessonId,
                type: data.type,
                title: data.title,
                timestamp: data.timestamp,
                content: data.content || null
            });
        });

        // Process student progress data
        const progressByUser = {};
        studentProgressSnapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            if (!progressByUser[userId]) {
                progressByUser[userId] = [];
            }
            progressByUser[userId].push({
                id: doc.id,
                lessonId: data.lessonId,
                action: data.action,
                data: data.data,
                timestamp: data.timestamp
            });
        });

        // Combine all data
        const completeStudentData = students.map(student => ({
            ...student,
            submissions: submissionsByUser[student.userId] || [],
            totalSubmissions: (submissionsByUser[student.userId] || []).length,
            progressHistory: progressByUser[student.userId] || [],
            completionRate: student.totalLessons > 0 ?
                Math.round((student.completedLessons / student.totalLessons) * 100) : 0
        }));

        // Calculate summary statistics
        const summary = {
            totalStudents: students.length,
            totalSubmissions: submissionsSnapshot.size,
            averageCompletionRate: students.length > 0 ?
                Math.round(students.reduce((sum, s) => sum + s.completedLessons, 0) / students.length) : 0,
            lastUpdated: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                summary,
                students: completeStudentData,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error fetching student progress:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

