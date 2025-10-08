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

    // Simple diagnostics on GET for debugging
    if (event.httpMethod === 'GET') {
        const qs = event.queryStringParameters || {};
        const debug = qs.debug === '1' || qs.debug === 'true';
        const apiKeyPresent = Boolean(process.env.RECRAFT_API_KEY);
        const modelEnv = process.env.RECRAFT_IMAGE_MODEL || null;
        const body = debug ? {
            status: 'ok',
            expects: 'POST',
            apiKeyPresent,
            modelEnv,
            message: 'Use POST to generate images. Append ?debug=1 for this diagnostics response.'
        } : { error: 'Method not allowed', expects: 'POST' };
        return { statusCode: debug ? 200 : 405, headers, body: JSON.stringify(body) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed', expects: 'POST' }) };
    }

    try {
        const { prompt, style, size, model: modelFromRequest, debug: debugFlag } = JSON.parse(event.body || '{}');
        const qs = event.queryStringParameters || {};
        const debug = debugFlag === true || qs.debug === '1' || qs.debug === 'true';
        if (!prompt || !size) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'prompt and size are required' }) };
        }

        const apiKey = process.env.RECRAFT_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server API key missing' }) };
        }

        // Try multiple strategies depending on whether a model is available
        const model = modelFromRequest || process.env.RECRAFT_IMAGE_MODEL;

        // Normalize size – Recraft may reject smaller sizes like 512x512
        const requestedSize = (size || '').toLowerCase();
        const allowedDefault = '1024x1024';
        const normalizedSize = requestedSize && requestedSize.includes('1024') ? requestedSize : allowedDefault;

        const tryRequests = [];
        const basePrompt = `${prompt}\n\nStyle: ${style || 'realistic'}`;
        const common = { size: normalizedSize, n: 1, response_format: 'url' };

        if (model) {
            // Prefer OpenAI-compatible generations with model
            tryRequests.push({
                url: 'https://external.api.recraft.ai/v1/images/generations',
                body: { model, prompt: basePrompt, ...common }
            });
        }

        // Fallbacks without model
        tryRequests.push(
            {
                url: 'https://external.api.recraft.ai/v1/images/generations',
                body: { prompt: basePrompt, ...common }
            },
            {
                url: 'https://external.api.recraft.ai/v1/images',
                body: { prompt: basePrompt, ...common }
            }
        );

        let data;
        let lastStatus = 0;
        let lastText = '';
        const attempts = [];
        for (const req of tryRequests) {
            const resp = await fetch(req.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req.body)
            });

            if (resp.ok) {
                data = await resp.json();
                attempts.push({ url: req.url, status: resp.status, ok: true });
                break;
            }
            lastStatus = resp.status;
            lastText = await resp.text().catch(() => '');
            attempts.push({ url: req.url, status: lastStatus, ok: false, text: lastText?.slice(0, 500) });

            // If size was invalid, retry once with 1024x1024 explicitly
            if (lastStatus === 400 && /invalid image size/i.test(lastText) && req.body.size !== allowedDefault) {
                const retryBody = { ...req.body, size: allowedDefault };
                const retryResp = await fetch(req.url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(retryBody)
                });
                if (retryResp.ok) {
                    data = await retryResp.json();
                    attempts.push({ url: req.url, status: retryResp.status, ok: true, note: 'retry with 1024x1024' });
                    break;
                } else {
                    const retryText = await retryResp.text().catch(() => '');
                    attempts.push({ url: req.url, status: retryResp.status, ok: false, text: retryText?.slice(0, 500), note: 'retry with 1024x1024' });
                }
            }
        }

        if (!data) {
            return { statusCode: lastStatus || 500, headers, body: JSON.stringify({ error: 'Recraft error', details: lastText || 'All attempts failed', debug: debug ? { attempts, modelUsed: model || null, requestedSize, normalizedSize } : undefined }) };
        }
        const first = data && (data.data?.[0] || data.output?.[0] || data.result?.[0]);
        if (!first) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'Unexpected API response' }) };
        }

        if (first.url) {
            return { statusCode: 200, headers, body: JSON.stringify({ imageUrl: first.url, success: true, debug: debug ? { attempts, modelUsed: model || null, requestedSize, normalizedSize } : undefined }) };
        }

        if (first.b64_json) {
            // Return as data URL to keep it simple client-side
            return { statusCode: 200, headers, body: JSON.stringify({ imageUrl: `data:image/png;base64,${first.b64_json}`, success: true, debug: debug ? { attempts, modelUsed: model || null, requestedSize, normalizedSize } : undefined }) };
        }

        return { statusCode: 502, headers, body: JSON.stringify({ error: 'No image in response' }) };
    } catch (err) {
        console.error('Proxy error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};


