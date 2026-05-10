exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { studentEmail, studentName, lessonId, submissionType, submissionData } = JSON.parse(event.body);

        // Create notification payload
        const notificationPayload = {
            studentEmail,
            studentName,
            lessonId,
            submissionType,
            submissionData,
            timestamp: new Date().toISOString(),
            platform: 'GGT Educational Hub',
            notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        console.log('Notification received:', notificationPayload);

        // Send webhook to third party if configured
        const webhookUrl = process.env.THIRD_PARTY_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY || 'default-key'}`
                    },
                    body: JSON.stringify(notificationPayload)
                });

                if (!response.ok) {
                    console.warn('Webhook failed:', response.status, await response.text());
                } else {
                    console.log('Webhook sent successfully');
                }
            } catch (webhookError) {
                console.warn('Webhook error:', webhookError);
            }
        } else {
            console.log('No webhook URL configured, notification logged only');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Notification processed successfully',
                notificationId: notificationPayload.notificationId,
                timestamp: new Date().toISOString(),
                payload: notificationPayload
            })
        };

    } catch (error) {
        console.error('Error sending notification:', error);
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






