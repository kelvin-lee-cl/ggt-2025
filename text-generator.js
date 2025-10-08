// Text generator functionality using Deepseek API

let generatedTexts = [];
let currentGeneratedText = '';

document.addEventListener('DOMContentLoaded', function () {
    initializeTextGenerator();
});

function initializeTextGenerator() {
    const form = document.getElementById('textGeneratorForm');
    form.addEventListener('submit', handleTextGeneration);

    // Add event listeners for prompt preview updates
    document.getElementById('textPrompt').addEventListener('input', updatePromptPreview);
    document.getElementById('textType').addEventListener('change', updatePromptPreview);
    document.getElementById('textLength').addEventListener('change', updatePromptPreview);
    document.getElementById('textTone').addEventListener('change', updatePromptPreview);
    document.getElementById('textLanguage').addEventListener('change', updatePromptPreview);

    loadGeneratedTexts();
    loadApiKey('deepseek');

    // Show/hide API config section based on admin status
    updateApiConfigVisibility();
}

function handleTextGeneration(event) {
    event.preventDefault();

    requireAuth(() => {
        const prompt = document.getElementById('textPrompt').value;
        const type = document.getElementById('textType').value;
        const length = document.getElementById('textLength').value;
        const tone = document.getElementById('textTone').value;
        const language = document.getElementById('textLanguage').value;
        const framework = document.getElementById('promptingFramework').value;

        generateText(prompt, type, length, tone, language, framework);
    });
}

async function generateText(prompt, type, length, tone, language, framework) {
    const submitBtn = document.querySelector('#textGeneratorForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    showLoading(submitBtn);

    try {
        // Get API key from server
        const apiKey = await getServerApiKey();

        if (!apiKey) {
            throw new Error('API key not configured. Please contact an administrator to set up the Deepseek API key.');
        }

        // Create structured prompt based on framework
        const structuredPrompt = createStructuredPrompt(prompt, type, length, tone, language, framework);

        // Call real Deepseek API
        const response = await callDeepseekAPI(structuredPrompt, type, length, tone, apiKey);

        // Store the generated text
        currentGeneratedText = response.text;

        // Add to generated texts history
        const textData = {
            id: Date.now(),
            prompt: prompt,
            structuredPrompt: structuredPrompt,
            type: type,
            length: length,
            tone: tone,
            framework: framework,
            text: response.text,
            timestamp: new Date().toISOString()
        };

        generatedTexts.unshift(textData);
        saveGeneratedTexts();
        displayGeneratedText();
        displayTextHistory();

        // Update student progress
        updateStudentProgress('ai_tool_used', { tool: 'text' });

        showAlert('Text generated successfully!', 'success');

    } catch (error) {
        console.error('Text generation failed:', error);
        showAlert(`Text generation failed: ${error.message}`, 'danger');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

function showFrameworkGuide() {
    const frameworkSelect = document.getElementById('promptingFramework');
    const frameworkGuide = document.getElementById('frameworkGuide');
    const customFrameworkInput = document.getElementById('customFrameworkInput');
    const selectedFramework = frameworkSelect.value;

    if (selectedFramework === 'none') {
        frameworkGuide.style.display = 'none';
        customFrameworkInput.style.display = 'none';
        return;
    }

    // Show framework guide
    frameworkGuide.style.display = 'block';
    customFrameworkInput.style.display = 'block';

    // Update guide content
    const guide = getFrameworkGuide(selectedFramework);
    document.getElementById('frameworkTitle').textContent = guide.title;
    document.getElementById('frameworkDescription').textContent = guide.description;
    document.getElementById('frameworkUsage').textContent = guide.whenToUse;

    // Load custom framework text
    const customText = document.getElementById('customFrameworkText');
    customText.value = guide.template;

    // Update prompt preview
    updatePromptPreview();
}

function updatePromptPreview() {
    const originalPrompt = document.getElementById('textPrompt').value;
    const type = document.getElementById('textType').value;
    const length = document.getElementById('textLength').value;
    const tone = document.getElementById('textTone').value;
    const language = document.getElementById('textLanguage').value;
    const customFrameworkText = document.getElementById('customFrameworkText');
    const promptPreview = document.getElementById('promptPreview');

    if (!originalPrompt.trim()) {
        promptPreview.textContent = 'Enter your prompt above to see the preview...';
        return;
    }

    if (customFrameworkText && customFrameworkText.value.trim()) {
        const preview = customFrameworkText.value
            .replace('{originalPrompt}', originalPrompt)
            .replace('{type}', type)
            .replace('{length}', length)
            .replace('{tone}', tone)
            .replace('{language}', language);
        promptPreview.textContent = preview;
    } else {
        // Show composed prompt when no framework is selected
        const composed = `${originalPrompt}\n\nPlease generate a ${type} in a ${tone} tone, approximately ${length} words, written in ${language}.`;
        promptPreview.textContent = composed;
    }
}

function getFrameworkGuide(framework) {
    const guides = {
        'pps': {
            title: 'Persona-Problem-Solution (PPS) Framework',
            description: 'Structures prompts by defining the AI\'s role (Persona), the specific challenge (Problem), and the desired output (Solution).',
            whenToUse: 'Best for role-specific tasks, expert consultations, and when you need the AI to adopt a particular perspective or expertise.',
            template: 'Persona: You are a {type} expert with deep knowledge in this field.\nProblem: {originalPrompt}\nSolution: Please provide a comprehensive {type} that addresses this problem with a {tone} tone, approximately {length} words, written in {language}.'
        },
        'ctc': {
            title: 'Context-Task-Constraints (CTC) Framework',
            description: 'Provides background context, defines the specific task, and sets clear boundaries or constraints.',
            whenToUse: 'Ideal for complex projects, when you need to set specific parameters, or when working with detailed requirements.',
            template: 'Context: You are an expert in {type} writing with extensive experience in creating high-quality content.\nTask: Create a {type} based on the following request: {originalPrompt}\nConstraints: Use a {tone} tone, aim for approximately {length} words, write in {language}, and ensure the content is well-structured and engaging.'
        },
        'clear': {
            title: 'CLEAR Framework',
            description: 'Context-Logic-Expectations-Action-Restrictions approach for comprehensive prompt structuring.',
            whenToUse: 'Perfect for research tasks, analysis projects, and when you need to explain the reasoning behind your request.',
            template: 'Context: You are a professional {type} writer with expertise in creating compelling content.\nLogic: The request requires a well-crafted {type} that effectively communicates the intended message.\nExpectations: The output should be a comprehensive {type} that addresses the user\'s request.\nAction: Create a {type} based on: {originalPrompt}\nRestrictions: Use a {tone} tone, approximately {length} words, and maintain professional quality.'
        },
        'smart': {
            title: 'SMART Framework',
            description: 'Specific-Measurable-Achievable-Relevant-Time-bound approach for goal-oriented prompts.',
            whenToUse: 'Excellent for project planning, goal setting, and when you need measurable outcomes.',
            template: 'Specific: Create a {type} based on: {originalPrompt}\nMeasurable: The content should be approximately {length} words.\nAchievable: Use your expertise to create high-quality content.\nRelevant: Focus on the specific request and maintain relevance.\nTime-bound: Provide a complete, well-structured {type} with a {tone} tone.'
        },
        'quest': {
            title: 'QUEST Framework',
            description: 'Question-Understanding-Expectation-Scope-Time approach for research and inquiry-based tasks.',
            whenToUse: 'Best for research projects, investigative tasks, and when you need to explore a topic thoroughly.',
            template: 'Question: How can I create an effective {type} based on: {originalPrompt}?\nUnderstanding: You need a {type} with a {tone} tone, approximately {length} words.\nExpectation: A well-structured, engaging {type} that addresses the request.\nScope: Focus on the specific request while maintaining quality and relevance.\nTime: Provide a complete response that meets all requirements.'
        },
        'guide': {
            title: 'GUIDE Framework',
            description: 'Goal-Understanding-Information-Direction-Evaluation approach for comprehensive guidance.',
            whenToUse: 'Ideal for mentoring tasks, educational content, and when you need step-by-step guidance.',
            template: 'Goal: Create a high-quality {type} based on: {originalPrompt}\nUnderstanding: You are an expert {type} writer with extensive experience.\nInformation: The content should be approximately {length} words with a {tone} tone.\nDirection: Structure the {type} with clear organization and engaging content.\nEvaluation: Ensure the output meets professional standards and addresses the request effectively.'
        },
        'focus': {
            title: 'FOCUS Framework',
            description: 'Function-Outcome-Criteria-Underlying Assumptions-Strategy approach for strategic thinking.',
            whenToUse: 'Perfect for strategic planning, decision-making tasks, and when you need to consider multiple perspectives.',
            template: 'Function: Create a {type} that effectively communicates the intended message.\nOutcome: A well-structured {type} based on: {originalPrompt}\nCriteria: Use a {tone} tone, approximately {length} words, and maintain high quality.\nUnderlying Assumptions: The content should be relevant, engaging, and professionally written.\nStrategy: Create a comprehensive {type} that addresses all aspects of the request.'
        },
        'idea': {
            title: 'IDEA Framework',
            description: 'Intent-Details-Examples-Adjustments approach for iterative development.',
            whenToUse: 'Great for creative projects, iterative development, and when you need flexibility in the process.',
            template: 'Intent: Create an effective {type} based on: {originalPrompt}\nDetails: The content should be approximately {length} words with a {tone} tone.\nExamples: Use professional writing standards and engaging content structure.\nAdjustments: Ensure the {type} meets all requirements and maintains quality throughout.'
        },
        'risen': {
            title: 'RISEN Framework',
            description: 'Requirement-Information-Strategy-Evaluation-Negotiation approach for complex projects.',
            whenToUse: 'Best for complex projects, negotiations, and when you need to balance multiple requirements.',
            template: 'Requirement: Create a {type} based on: {originalPrompt}\nInformation: The content should be approximately {length} words with a {tone} tone.\nStrategy: Use professional writing techniques and engaging content structure.\nEvaluation: Ensure the output meets quality standards and addresses the request.\nNegotiation: Adapt the content to best serve the user\'s needs while maintaining professional standards.'
        },
        'rhodes': {
            title: 'RHODES Framework',
            description: 'Research-Hypothesis-Objectives-Development-Execution-Synthesis approach for scientific methodology.',
            whenToUse: 'Perfect for research projects, scientific writing, and when you need a systematic approach.',
            template: 'Research: Analyze the request: {originalPrompt}\nHypothesis: A well-crafted {type} will effectively address this request.\nObjectives: Create a {type} that is approximately {length} words with a {tone} tone.\nDevelopment: Structure the content with clear organization and engaging elements.\nExecution: Write a comprehensive {type} that meets all requirements.\nSynthesis: Ensure the final output effectively addresses the original request.'
        },
        'create': {
            title: 'CREATE Framework',
            description: 'Conceptualize-Research-Experiment-Analyze-Transform-Evaluate approach for innovation.',
            whenToUse: 'Ideal for creative projects, innovation tasks, and when you need to explore new approaches.',
            template: 'Conceptualize: Develop a {type} based on: {originalPrompt}\nResearch: Consider the best approach for a {tone} tone, approximately {length} words.\nExperiment: Use different writing techniques to create engaging content.\nAnalyze: Evaluate the effectiveness of the content structure and approach.\nTransform: Refine the {type} to meet all requirements and maintain quality.\nEvaluate: Ensure the final output effectively addresses the user\'s request.'
        }
    };

    return guides[framework] || guides['pps'];
}

function createStructuredPrompt(originalPrompt, type, length, tone, language, framework) {
    if (framework === 'none') {
        // Compose a clear prompt that includes type, length, tone, and language
        return `${originalPrompt}\n\nPlease generate a ${type} in a ${tone} tone, approximately ${length} words, written in ${language}.`;
    }

    // Check if user has customized the framework
    const customFrameworkText = document.getElementById('customFrameworkText');
    if (customFrameworkText && customFrameworkText.value.trim()) {
        return customFrameworkText.value
            .replace('{originalPrompt}', originalPrompt)
            .replace('{type}', type)
            .replace('{length}', length)
            .replace('{tone}', tone)
            .replace('{language}', language);
    }

    const frameworkTemplates = {
        'pps': `Persona: You are a ${type} expert with deep knowledge in this field.
Problem: ${originalPrompt}
Solution: Please provide a comprehensive ${type} that addresses this problem with a ${tone} tone, approximately ${length} words, written in ${language}.`,

        'ctc': `Context: You are an expert in ${type} writing with extensive experience in creating high-quality content.
Task: Create a ${type} based on the following request: ${originalPrompt}
Constraints: Use a ${tone} tone, aim for approximately ${length} words, write in ${language}, and ensure the content is well-structured and engaging.`,

        'clear': `Context: You are a professional ${type} writer with expertise in creating compelling content.
Logic: The request requires a well-crafted ${type} that effectively communicates the intended message.
Expectations: The output should be a comprehensive ${type} that addresses the user's request.
Action: Create a ${type} based on: ${originalPrompt}
Restrictions: Use a ${tone} tone, approximately ${length} words, write in ${language}, and maintain professional quality.`,

        'smart': `Specific: Create a ${type} based on: ${originalPrompt}
Measurable: The content should be approximately ${length} words.
Achievable: Use your expertise to create high-quality content.
Relevant: Focus on the specific request and maintain relevance.
Time-bound: Provide a complete, well-structured ${type} with a ${tone} tone, written in ${language}.`,

        'quest': `Question: How can I create an effective ${type} based on: ${originalPrompt}?
Understanding: You need a ${type} with a ${tone} tone, approximately ${length} words, written in ${language}.
Expectation: A well-structured, engaging ${type} that addresses the request.
Scope: Focus on the specific request while maintaining quality and relevance.
Time: Provide a complete response that meets all requirements.`,

        'guide': `Goal: Create a high-quality ${type} based on: ${originalPrompt}
Understanding: You are an expert ${type} writer with extensive experience.
Information: The content should be approximately ${length} words with a ${tone} tone, written in ${language}.
Direction: Structure the ${type} with clear organization and engaging content.
Evaluation: Ensure the output meets professional standards and addresses the request effectively.`,

        'focus': `Function: Create a ${type} that effectively communicates the intended message.
Outcome: A well-structured ${type} based on: ${originalPrompt}
Criteria: Use a ${tone} tone, approximately ${length} words, write in ${language}, and maintain high quality.
Underlying Assumptions: The content should be relevant, engaging, and professionally written.
Strategy: Create a comprehensive ${type} that addresses all aspects of the request.`,

        'idea': `Intent: Create an effective ${type} based on: ${originalPrompt}
Details: The content should be approximately ${length} words with a ${tone} tone, written in ${language}.
Examples: Use professional writing standards and engaging content structure.
Adjustments: Ensure the ${type} meets all requirements and maintains quality throughout.`,

        'risen': `Requirement: Create a ${type} based on: ${originalPrompt}
Information: The content should be approximately ${length} words with a ${tone} tone, written in ${language}.
Strategy: Use professional writing techniques and engaging content structure.
Evaluation: Ensure the output meets quality standards and addresses the request.
Negotiation: Adapt the content to best serve the user's needs while maintaining professional standards.`,

        'rhodes': `Research: Analyze the request: ${originalPrompt}
Hypothesis: A well-crafted ${type} will effectively address this request.
Objectives: Create a ${type} that is approximately ${length} words with a ${tone} tone, written in ${language}.
Development: Structure the content with clear organization and engaging elements.
Execution: Write a comprehensive ${type} that meets all requirements.
Synthesis: Ensure the final output effectively addresses the original request.`,

        'create': `Conceptualize: Develop a ${type} based on: ${originalPrompt}
Research: Consider the best approach for a ${tone} tone, approximately ${length} words, written in ${language}.
Experiment: Use different writing techniques to create engaging content.
Analyze: Evaluate the effectiveness of the content structure and approach.
Transform: Refine the ${type} to meet all requirements and maintain quality.
Evaluate: Ensure the final output effectively addresses the user's request.`
    };

    return frameworkTemplates[framework] || originalPrompt;
}

async function simulateDeepseekAPICall(prompt, type, length, tone, apiKey) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate sample text based on parameters
    const sampleTexts = {
        essay: `Based on your prompt: "${prompt}"\n\nThis is a sample essay generated by AI. The content would be tailored to your specific request, incorporating the ${tone} tone you requested. The essay would be approximately ${length} words and would provide comprehensive coverage of the topic.\n\nIn a real implementation, this would be actual AI-generated content from the Deepseek API. The text would be coherent, well-structured, and relevant to your prompt.\n\nKey points that would be covered:\n- Introduction to the topic\n- Main arguments and supporting evidence\n- Analysis and discussion\n- Conclusion with summary\n\nThe generated content would be original and tailored to your specific requirements.`,

        summary: `Summary of: "${prompt}"\n\nKey Points:\n• Main concept or topic overview\n• Important details and supporting information\n• Key takeaways and conclusions\n• Relevant statistics or data points\n\nThis summary provides a concise overview in a ${tone} tone, suitable for ${length} length requirements.`,

        creative: `Creative Writing: "${prompt}"\n\nOnce upon a time, in a world where ${prompt.toLowerCase()}...\n\nThe story unfolds with vivid descriptions and engaging narrative elements. Characters come to life through dialogue and action, creating an immersive experience for the reader.\n\nIn this creative piece, the ${tone} tone creates a unique atmosphere that draws readers into the narrative. The story develops naturally, building tension and resolution as it progresses.\n\nThe creative elements include:\n- Rich descriptive language\n- Character development\n- Plot progression\n- Thematic elements\n\nThis creative work demonstrates the power of storytelling and imagination.`,

        technical: `Technical Documentation: "${prompt}"\n\n## Overview\nThis technical document provides detailed information about ${prompt}.\n\n## Methodology\n1. Analysis of current state\n2. Identification of key components\n3. Implementation strategy\n4. Testing and validation\n\n## Implementation Details\n- Technical specifications\n- System requirements\n- Performance metrics\n- Security considerations\n\n## Conclusion\nThis technical approach ensures reliable and efficient implementation of the requested solution.`,

        email: `Subject: ${prompt}\n\nDear [Recipient],\n\nI hope this message finds you well. I am writing to discuss ${prompt}.\n\nKey points to address:\n- Primary objective or request\n- Supporting details and context\n- Next steps or call to action\n- Timeline and expectations\n\nI look forward to your response and would be happy to discuss this further at your convenience.\n\nBest regards,\n[Your Name]`,

        report: `Executive Summary\n\nThis report addresses ${prompt} and provides comprehensive analysis and recommendations.\n\n## Key Findings\n- Primary observations and data points\n- Trends and patterns identified\n- Areas of concern or opportunity\n- Comparative analysis\n\n## Recommendations\n1. Immediate actions required\n2. Medium-term strategic initiatives\n3. Long-term planning considerations\n4. Resource requirements\n\n## Conclusion\nThis analysis provides a foundation for informed decision-making and strategic planning.`
    };

    return {
        text: sampleTexts[type] || sampleTexts.essay,
        success: true
    };
}

function displayGeneratedText() {
    const resultsDiv = document.getElementById('generatedTextResults');
    const contentDiv = document.getElementById('generatedTextContent');
    const originalPromptDiv = document.getElementById('originalPromptDisplay');
    const structuredPromptDiv = document.getElementById('structuredPromptDisplay');
    const structuredPromptContent = document.getElementById('structuredPromptContent');

    // Display the original/composed prompt
    if (generatedTexts.length > 0) {
        const latestText = generatedTexts[0];
        // When no framework, show the composed prompt (what was sent to AI)
        if (latestText.framework === 'none' && latestText.structuredPrompt) {
            originalPromptDiv.textContent = latestText.structuredPrompt;
        } else {
            originalPromptDiv.textContent = latestText.prompt;
        }

        // Show structured prompt if framework was used
        if (latestText.framework && latestText.framework !== 'none' && latestText.structuredPrompt) {
            structuredPromptContent.textContent = latestText.structuredPrompt;
            structuredPromptDiv.style.display = 'block';
        } else {
            structuredPromptDiv.style.display = 'none';
        }
    }

    contentDiv.textContent = currentGeneratedText;
    resultsDiv.style.display = 'block';

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function displayTextHistory() {
    const historyList = document.getElementById('textHistoryList');

    if (generatedTexts.length === 0) {
        historyList.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-history fa-2x mb-3"></i>
                <p>No text generated yet. Create your first content above!</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = generatedTexts.slice(0, 5).map(text => `
        <div class="d-flex justify-content-between align-items-center p-3 border rounded mb-2">
            <div>
                <h6 class="mb-1">${text.prompt.substring(0, 50)}${text.prompt.length > 50 ? '...' : ''}</h6>
                <small class="text-muted">${text.type} • ${text.tone} • ${text.length}</small>
            </div>
            <div class="text-end">
                <small class="text-muted">${new Date(text.timestamp).toLocaleDateString()}</small>
                <div class="mt-1">
                    <button class="btn btn-sm btn-outline-primary" onclick="loadTextFromHistory(${text.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTextFromHistory(${text.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadTextFromHistory(textId) {
    const textData = generatedTexts.find(t => t.id === textId);
    if (textData) {
        currentGeneratedText = textData.text;
        displayGeneratedText();
        showAlert('Text loaded from history.', 'info');
    }
}

function deleteTextFromHistory(textId) {
    if (confirm('Are you sure you want to delete this text from history?')) {
        generatedTexts = generatedTexts.filter(t => t.id !== textId);
        saveGeneratedTexts();
        displayTextHistory();
        showAlert('Text deleted from history.', 'info');
    }
}

function copyToClipboard() {
    if (currentGeneratedText) {
        navigator.clipboard.writeText(currentGeneratedText).then(() => {
            showAlert('Text copied to clipboard!', 'success');
        }).catch(() => {
            showAlert('Failed to copy text to clipboard.', 'danger');
        });
    }
}

function downloadText() {
    if (currentGeneratedText) {
        const blob = new Blob([currentGeneratedText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-text-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showAlert('Text downloaded successfully!', 'success');
    }
}

function saveGeneratedTexts() {
    localStorage.setItem('generated_texts', JSON.stringify(generatedTexts));
}

function loadGeneratedTexts() {
    const saved = localStorage.getItem('generated_texts');
    if (saved) {
        generatedTexts = JSON.parse(saved);
        displayTextHistory();
    }
}

async function saveApiKey(service) {
    const apiKey = document.getElementById('deepseekApiKey').value;
    if (apiKey.trim()) {
        try {
            // Try to save to server first
            const serverSuccess = await setServerApiKey(apiKey.trim());

            if (serverSuccess) {
                showAlert('API key saved successfully on server for all users!', 'success');
            } else {
                // Fallback to local storage
                localStorage.setItem(`shared_${service}_api_key`, apiKey.trim());
                showAlert('API key saved locally (server unavailable).', 'warning');
            }

            document.getElementById('deepseekApiKey').value = '';
        } catch (error) {
            // Fallback to local storage
            localStorage.setItem(`shared_${service}_api_key`, apiKey.trim());
            showAlert('API key saved locally (server error).', 'warning');
            document.getElementById('deepseekApiKey').value = '';
        }
    } else {
        showAlert('Please enter a valid API key.', 'warning');
    }
}

function loadApiKey(service) {
    const savedKey = localStorage.getItem(`shared_${service}_api_key`);
    if (savedKey) {
        document.getElementById('deepseekApiKey').value = savedKey;
    }
}

function updateApiConfigVisibility() {
    const apiConfigSection = document.getElementById('apiConfigSection');
    if (apiConfigSection) {
        // Check if current user is admin
        const isAdmin = currentUser && currentUser.email &&
            (currentUser.email === 'admin@example.com' ||
                currentUser.email.includes('admin') ||
                localStorage.getItem('isAdmin') === 'true');

        if (isAdmin) {
            apiConfigSection.style.display = 'block';
        } else {
            apiConfigSection.style.display = 'none';
        }
    }
}

// Get API key from server
async function getServerApiKey() {
    try {
        const response = await fetch('/.netlify/functions/get-api-key', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('Error fetching API key from server:', error);
        // Fallback to local storage
        const sharedApiKey = localStorage.getItem('shared_deepseek_api_key');
        const userApiKey = localStorage.getItem('deepseek_api_key');
        return sharedApiKey || userApiKey;
    }
}

// Set API key on server (admin only)
async function setServerApiKey(apiKey) {
    try {
        const response = await fetch('/.netlify/functions/set-api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: apiKey,
                adminToken: 'admin-token-2024' // In production, use proper authentication
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error setting API key on server:', error);
        return false;
    }
}

// Real Deepseek API integration
async function callDeepseekAPI(prompt, type, length, tone, apiKey) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI assistant. Generate ${type} content in a ${tone} tone, approximately ${length} words.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
        text: data.choices[0].message.content,
        success: true
    };
}
