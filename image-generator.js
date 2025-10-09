// Image generator functionality using Recraft API

let generatedImages = [];

document.addEventListener('DOMContentLoaded', function () {
    initializeImageGenerator();
});

function initializeImageGenerator() {
    const form = document.getElementById('imageGeneratorForm');
    form.addEventListener('submit', handleImageGeneration);

    loadGeneratedImages();
    loadApiKey('recraft');
}

function handleImageGeneration(event) {
    event.preventDefault();

    requireAuth(() => {
        const prompt = document.getElementById('imagePrompt').value;
        const style = document.getElementById('imageStyle').value;
        const size = document.getElementById('imageSize').value;

        generateImage(prompt, style, size);
    });
}

async function generateImage(prompt, style, size) {
    const submitBtn = document.querySelector('#imageGeneratorForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    showLoading(submitBtn);

    try {
        // Call via Netlify proxy to satisfy CSP and hide key
        const response = await callRecraftProxy(prompt, style, size, true);

        // Add to generated images
        const imageData = {
            id: Date.now(),
            prompt: prompt,
            style: style,
            size: size,
            imageUrl: response.imageUrl,
            timestamp: new Date().toISOString()
        };

        generatedImages.unshift(imageData);
        saveGeneratedImages();
        displayGeneratedImages();

        // Update student progress
        updateStudentProgress('ai_tool_used', { tool: 'image' });

        showAlert('Image generated successfully!', 'success');

    } catch (error) {
        console.error('Image generation failed:', error);
        showAlert(`Image generation failed: ${error.message}`, 'danger');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

async function callRecraftProxy(prompt, style, size, debug = false) {
    const response = await fetch('/.netlify/functions/recraft-image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size, debug })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Proxy request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!data || !data.imageUrl) {
        throw new Error('Invalid proxy response');
    }
    // Optional client-side debug log
    if (data.debug) {
        console.log('[Recraft Debug]', data.debug);
    }
    return { imageUrl: data.imageUrl, success: true };
}

function displayGeneratedImages() {
    const gallery = document.getElementById('imageGallery');

    if (generatedImages.length === 0) {
        gallery.innerHTML = `
            <div class="col-12 text-center text-muted">
                <i class="fas fa-images fa-3x mb-3"></i>
                <p>No images generated yet. Create your first image above!</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = generatedImages.map(image => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <img src="${image.imageUrl}" class="card-img-top" alt="Generated image" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h6 class="card-title">${image.prompt.substring(0, 50)}${image.prompt.length > 50 ? '...' : ''}</h6>
                    <p class="card-text small text-muted">
                        <strong>Style:</strong> ${image.style} | <strong>Size:</strong> ${image.size}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${new Date(image.timestamp).toLocaleDateString()}</small>
                        <div>
                            <button class="btn btn-sm btn-outline-primary" onclick="downloadImage('${image.imageUrl}', '${image.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteImage(${image.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function downloadImage(imageUrl, imageId) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${imageId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteImage(imageId) {
    if (confirm('Are you sure you want to delete this image?')) {
        generatedImages = generatedImages.filter(img => img.id !== imageId);
        saveGeneratedImages();
        displayGeneratedImages();
        showAlert('Image deleted successfully.', 'info');
    }
}

function saveGeneratedImages() {
    localStorage.setItem('generated_images', JSON.stringify(generatedImages));
}

function loadGeneratedImages() {
    const saved = localStorage.getItem('generated_images');
    if (saved) {
        generatedImages = JSON.parse(saved);
        displayGeneratedImages();
    }
}

async function saveApiKey(service) {
    const apiKey = document.getElementById('recraftApiKey').value;
    if (apiKey.trim()) {
        try {
            const serverSuccess = await setRecraftServerApiKey(apiKey.trim());
            if (serverSuccess) {
                showAlert('API key saved successfully on server for all users!', 'success');
            } else {
                localStorage.setItem(`${service}_api_key`, apiKey.trim());
                showAlert('API key saved locally (server unavailable).', 'warning');
            }
            document.getElementById('recraftApiKey').value = '';
        } catch (error) {
            localStorage.setItem(`${service}_api_key`, apiKey.trim());
            showAlert('API key saved locally (server error).', 'warning');
            document.getElementById('recraftApiKey').value = '';
        }
    } else {
        showAlert('Please enter a valid API key.', 'warning');
    }
}

function loadApiKey(service) {
    const savedKey = localStorage.getItem(`${service}_api_key`);
    if (savedKey) {
        document.getElementById('recraftApiKey').value = savedKey;
    }
}

// Real Recraft API integration (uncomment and modify as needed)
// Server key helpers (mirror text-generator.js pattern)
async function getRecraftServerApiKey() {
    try {
        const response = await fetch('/.netlify/functions/get-recraft-api-key', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('Error fetching Recraft API key from server:', error);
        const shared = localStorage.getItem('shared_recraft_api_key');
        const userKey = localStorage.getItem('recraft_api_key');
        return shared || userKey;
    }
}

async function setRecraftServerApiKey(apiKey) {
    try {
        const response = await fetch('/.netlify/functions/set-recraft-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKey, adminToken: 'admin-token-2024' })
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            // Also keep a local shared copy for fallback
            localStorage.setItem('shared_recraft_api_key', apiKey);
        }
        return !!data.success;
    } catch (error) {
        console.error('Error setting Recraft API key on server:', error);
        return false;
    }
}
