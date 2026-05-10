exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        const { apiKey, adminToken } = JSON.parse(event.body || '{}');

        const validAdminTokens = [
            'admin-token-2024',
            'secure-admin-key',
            'deepseek-admin-2024'
        ];

        if (!adminToken || !validAdminTokens.includes(adminToken)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized: Invalid admin token' })
            };
        }

        if (!apiKey || apiKey.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'API key is required' })
            };
        }

        // NOTE: On Netlify, securely store this key as an env var from the dashboard.
        // This endpoint only validates input in this repo template.

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'API key updated successfully', success: true })
        };

    } catch (error) {
        console.error('Error setting Recraft API key:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};








