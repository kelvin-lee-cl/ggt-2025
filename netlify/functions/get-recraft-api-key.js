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
        // Get API key from environment variables
        const apiKey = process.env.RECRAFT_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'API key not configured on server'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                apiKey: apiKey,
                message: 'API key retrieved successfully'
            })
        };

    } catch (error) {
        console.error('Error retrieving Recraft API key:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};



