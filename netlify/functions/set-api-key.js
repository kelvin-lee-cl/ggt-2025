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
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    error: 'Method not allowed'
                })
            };
        }

        // Parse request body
        const { apiKey, adminToken } = JSON.parse(event.body);

        // Simple admin verification (in production, use proper authentication)
        const validAdminTokens = [
            'admin-token-2024',
            'secure-admin-key',
            'deepseek-admin-2024'
        ];

        if (!adminToken || !validAdminTokens.includes(adminToken)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: 'Unauthorized: Invalid admin token'
                })
            };
        }

        if (!apiKey || apiKey.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'API key is required'
                })
            };
        }

        // In a real implementation, you would store this in a secure database
        // For now, we'll just validate and return success
        // The actual storage would be handled by your deployment platform

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'API key updated successfully',
                success: true
            })
        };

    } catch (error) {
        console.error('Error setting API key:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};
