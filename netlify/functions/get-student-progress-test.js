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
                    message: 'Please provide a valid API key in Authorization header or query parameter',
                    validKeys: ['admin-token-2024', 'secure-admin-key', 'third-party-api-key']
                })
            };
        }

        // For testing without Firebase Admin SDK, return mock data
        const mockData = {
            success: true,
            summary: {
                totalStudents: 3,
                totalSubmissions: 15,
                averageCompletionRate: 75,
                lastUpdated: new Date().toISOString()
            },
            students: [
                {
                    userId: "user1",
                    email: "student1@example.com",
                    lessons: {
                        "lesson1": { "status": "completed", "completedAt": "2024-01-10T09:00:00.000Z" },
                        "lesson2": { "status": "in-progress", "startedAt": "2024-01-12T14:00:00.000Z" }
                    },
                    totalLessons: 2,
                    completedLessons: 1,
                    completionRate: 50,
                    submissions: [
                        {
                            id: "sub1",
                            lessonId: "lesson1",
                            type: "text",
                            title: "Assignment 1",
                            timestamp: "2024-01-10T09:30:00.000Z"
                        }
                    ],
                    totalSubmissions: 1,
                    progressHistory: []
                },
                {
                    userId: "user2",
                    email: "student2@example.com",
                    lessons: {
                        "lesson1": { "status": "completed", "completedAt": "2024-01-09T10:00:00.000Z" },
                        "lesson2": { "status": "completed", "completedAt": "2024-01-11T15:00:00.000Z" },
                        "lesson3": { "status": "in-progress", "startedAt": "2024-01-13T09:00:00.000Z" }
                    },
                    totalLessons: 3,
                    completedLessons: 2,
                    completionRate: 67,
                    submissions: [
                        {
                            id: "sub2",
                            lessonId: "lesson1",
                            type: "image",
                            title: "Creative Project",
                            timestamp: "2024-01-09T10:30:00.000Z"
                        },
                        {
                            id: "sub3",
                            lessonId: "lesson2",
                            type: "text",
                            title: "Essay Assignment",
                            timestamp: "2024-01-11T15:30:00.000Z"
                        }
                    ],
                    totalSubmissions: 2,
                    progressHistory: []
                }
            ],
            timestamp: new Date().toISOString(),
            note: "This is mock data for testing. Set up Firebase Admin SDK for real data."
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockData)
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



