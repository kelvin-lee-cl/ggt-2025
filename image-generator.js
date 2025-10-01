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
        const apiKey = localStorage.getItem('recraft_api_key');
        if (!apiKey) {
            throw new Error('Please configure your Recraft API key first.');
        }

        // Simulate API call to Recraft
        // In a real implementation, you would make an actual API call
        const response = await simulateRecraftAPICall(prompt, style, size, apiKey);

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

async function simulateRecraftAPICall(prompt, style, size, apiKey) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate API response
    return {
        imageUrl: `https://picsum.photos/${size.split('x')[0]}/${size.split('x')[1]}?random=${Date.now()}`,
        success: true
    };
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

function saveApiKey(service) {
    const apiKey = document.getElementById('recraftApiKey').value;
    if (apiKey.trim()) {
        localStorage.setItem(`${service}_api_key`, apiKey.trim());
        showAlert('API key saved successfully!', 'success');
        document.getElementById('recraftApiKey').value = '';
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
/*
async function callRecraftAPI(prompt, style, size, apiKey) {
    const response = await fetch('https://api.recraft.ai/v1/generate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt,
            style: style,
            size: size,
            num_images: 1
        })
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}
*/
