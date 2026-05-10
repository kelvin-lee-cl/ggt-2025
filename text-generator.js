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
        const framework = document.getElementById('promptingFramework').value;
        const tone = document.getElementById('textTone').value;
        const language = document.getElementById('textLanguage').value;

        if (framework === 'none') {
            // Use traditional form inputs - validate required fields
            const prompt = document.getElementById('textPrompt').value;
            const type = document.getElementById('textType').value;
            const length = document.getElementById('textLength').value;

            if (!prompt.trim()) {
                showAlert('Please enter a prompt for text generation.', 'warning');
                return;
            }

            generateText(prompt, type, length, tone, language, framework);
        } else {
            // Use framework-based generation - no additional validation needed
            generateText('', '', '', tone, language, framework);
        }
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
            prompt: framework === 'none' ? prompt : `Framework: ${framework}`,
            structuredPrompt: structuredPrompt,
            type: framework === 'none' ? type : 'framework-generated',
            length: framework === 'none' ? length : 'variable',
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
    const basicInputFields = document.getElementById('basicInputFields');
    const selectedFramework = frameworkSelect.value;

    if (selectedFramework === 'none') {
        frameworkGuide.style.display = 'none';
        customFrameworkInput.style.display = 'none';
        basicInputFields.style.display = 'block';
        return;
    }

    // Hide basic input fields when framework is selected
    basicInputFields.style.display = 'none';

    // Show framework guide
    frameworkGuide.style.display = 'block';
    customFrameworkInput.style.display = 'block';

    // Update guide content
    const guide = getFrameworkGuide(selectedFramework);
    document.getElementById('frameworkTitle').textContent = guide.title;
    document.getElementById('frameworkDescription').innerHTML = guide.description;
    document.getElementById('frameworkUsage').textContent = guide.whenToUse;

    // Load framework template (editable)
    const customText = document.getElementById('customFrameworkText');
    customText.value = guide.template;
    customText.readOnly = false; // Allow editing of the template

    // Update prompt preview
    updatePromptPreview();
}

function updatePromptPreview() {
    const tone = document.getElementById('textTone').value;
    const language = document.getElementById('textLanguage').value;
    const framework = document.getElementById('promptingFramework').value;
    const promptPreview = document.getElementById('promptPreview');

    if (framework && framework !== 'none') {
        // Check if user has customized the framework template
        const customFrameworkText = document.getElementById('customFrameworkText');
        if (customFrameworkText && customFrameworkText.value.trim()) {
            // Use the custom framework text with placeholders filled
            const preview = customFrameworkText.value
                .replace('{tone}', tone)
                .replace('{language}', language);
            promptPreview.textContent = preview;
        } else {
            // Use the default framework template
            const preview = createStructuredPrompt('', '', '', tone, language, framework);
            promptPreview.textContent = preview;
        }
    } else {
        // Show composed prompt when no framework is selected
        const originalPrompt = document.getElementById('textPrompt').value;
        const type = document.getElementById('textType').value;
        const length = document.getElementById('textLength').value;

        if (!originalPrompt.trim()) {
            promptPreview.textContent = 'Enter your prompt above to see the preview...';
            return;
        }

        const composed = `${originalPrompt}\n\nPlease generate a ${type} in a ${tone} tone, approximately ${length} words, written in ${language}.`;
        promptPreview.textContent = composed;
    }
}

function getFrameworkGuide(framework) {
    const guides = {

        'clear': {
            title: 'CLEAR Framework',
            description: '<strong>Context</strong>: Provide background information that explains why you are looking for this information.\n<strong>Logic</strong>: Explain the reasoning behind your research and what you are trying to accomplish.\n<strong>Expectations</strong>: Clearly define what kind of answer you need, including specific details or structure.\n<strong>Action</strong>: Specify the task that needs to be performed, such as summarizing, comparing, or listing information.<br><strong>Restrictions</strong>: Mention any limitations, such as word count, tone, or type of sources to use.',
            whenToUse: 'Perfect for generating comprehensive content with clear reasoning and professional standards.',
            template: 'Context:\nAs secondary students, we want guidance on emerging careers related to {topic} (e.g., AI, environmental design).\n\nLogic:\nUnderstanding opportunities helps us prepare subject choices for senior forms.\n\nExpectations:\nList 3–5 career options, each with required skills, typical salary in Hong Kong, and recommended school subjects.\n\nAction:\nCreate an easy‑to‑read comparison summary.\n\nRestrictions:\nUse updated salary data (2022–2024) from reliable local sources. \n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'smart': {
            title: 'SMART Framework',
            description: '<strong>Specific</strong>: Clearly define what you need, avoiding vague or broad questions.\n<br><strong>Measurable</strong>: Ensure that the response can be evaluated based on defined success criteria.\n<br><strong>Achievable</strong>: Make sure the request is realistic and within the AI\'s capabilities.\n<br><strong>Relevant</strong>: Keep your request aligned with your goal or purpose.\n<br><strong>Time-bound</strong>: Include a timeframe, if applicable, to ensure timely and relevant information.',
            whenToUse: 'Excellent for generating goal-oriented content with clear objectives and measurable outcomes.',
            template: 'Specific: Plan and execute a social project addressing {topic} (e.g., mental health, recycling, elder care) in {language} with {tone} tone.\n\nMeasurable: Engage around 100 participants across multiple activities.\n\nAchievable: Use available school space, materials under HK$1 000, and volunteer manpower.\n\nRelevant: Aim for visible, positive community impact tied to {topic}.\n\nTime‑bound: Limit the project to a two‑day event — Day 1 for set‑up and activity launch, Day 2 for follow‑up, reflection, and sharing of outcomes.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'quest': {
            title: 'QUEST Framework',
            description: '<strong>Question</strong>: Start with a clear question or problem you need to answer.\n<br><strong>Understanding</strong>: Explain what you already know and what gaps exist in your knowledge.\n<br><strong>Expectation</strong>: Define what a good response looks like and what key points it should address.\n<br><strong>Scope</strong>: Determine the focus of your research, specifying what should be included or excluded.\n<br><strong>Time</strong>: Provide any relevant time constraints for information (e.g., recent studies only).',
            whenToUse: 'Best for research projects, investigative tasks, and when you need to explore a topic thoroughly.',
            template: 'Question: How do high‑achieving Hong Kong students balance intense academic expectations with mental health and personal interests?\n\nUnderstanding: I feel pressure from DSE expectations, parental ambitions, and peer competition. I wonder if other students feel this, how they cope, and whether it\'s possible to do well academically and have a life outside studying.\n\nExpectation: 1) Statistics on academic stress among Hong Kong secondary students; 2) time management strategies used by successful students; 3) how to communicate with parents about pressure; 4) extracurricular activities that support both wellbeing and university applications;"\n\nScope: Focus on Hong Kong\'s competitive education system and DSE context; include both high‑achievers and students with diverse goals; exclude burnout recovery (mental health crisis support); prioritise actionable strategies.\n\nTime: Include current data on Hong Kong student stress from 2022 onward; reference recent education reforms or new wellbeing initiatives.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'guide': {
            title: 'GUIDE Framework',
            description: '<strong>Goal</strong>: Clearly state what you are trying to achieve with your research.\n<br><strong>Understanding</strong>: Explain what prior knowledge you have on the topic.\n<br><strong>Information</strong>: List the key pieces of information that should be included in the response.\n<br><strong>Direction</strong>: Provide specific guidance on how you want the response to be structured or presented.\n<br><strong>Evaluation</strong>: Define how you will assess the quality of the response.',
            whenToUse: 'Ideal for mentoring tasks, educational content, and when you need step-by-step guidance.',
            template: 'Goal:\nTurn a hobby or passion into a structured project that I can develop, share, and feel proud of—without it becoming another source of stress.\n\nUnderstanding:\nI have interests (photography, writing, gaming, fashion design, etc.) but I\'m unsure how to develop them seriously while balancing school; I worry they\'re "not practical."\n\nInformation:\nHow to define realistic goals for your passion project (just for fun vs. building skills vs. sharing with others). Time management strategies for hobbies during busy school periods. Tools, resources, and communities related to your specific interest. How to get feedback and improve your craft\nWays to share your work (Instagram, blogs, school events, competitions)\nHow passion projects can strengthen university applications (without being forced). Stories from Hong Kong students who developed hobbies into meaningful pursuits\n\nDirection:\nCreate a customisable project roadmap (fill in your hobby, set milestones); include resource lists by hobby type; use monthly progress tracker format; write in {language} and {tone} tone.\n\nEvaluation:\nQuality check: Does this feel genuinely fun, not like another obligation? Can I do this within my real schedule? Are there Hong Kong examples I can relate to?\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'focus': {
            title: 'FOCUS Framework',
            description: '<strong>Function</strong>: Define the purpose or role the AI should play in answering your question.\n<br><strong>Outcome</strong>: Specify what the ideal response should include.\n<br><strong>Criteria</strong>: Identify key factors that will determine the quality of the answer.\n<br><strong>Underlying Assumptions</strong>: State any biases or assumptions that should be acknowledged.\n<br><strong>Strategy</strong>: Provide a research method or approach you prefer the AI to take.',
            whenToUse: 'Perfect for strategic planning, decision-making tasks, and when you need to consider multiple perspectives.',
            template: 'Function: Act as a study coach.\nOutcome: Provide 5 effective study techniques for exams.\nCriteria: Techniques should be easy to implement, science-backed, and engaging.\nUnderlying Assumptions: Students may struggle with focus or motivation.\nStrategy: Suggest active recall, spaced repetition, and visual aids; write in {language} and {tone} tone.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'idea': {
            title: 'IDEA Framework',
            description: '<strong>Intent</strong>: Define the purpose behind your research and what you aim to achieve.\n<br><strong>Details</strong>: Provide relevant background information and clarify what you already know.\n<br><strong>Examples</strong>: Include references or case studies that can help shape the response.\n<br><strong>Adjustments</strong>: Allow for refinement based on initial responses and new insights.',
            whenToUse: 'Great for creative projects, iterative development, and when you need flexibility in the process.',
            template: 'Intent: Examine parental and societal expectations influencing study and digital behavior in 13-15-year-old females; write it in {language} and {tone} tone.\n\nDetails: Family expectations often drive prolonged study hours coupled with monitoring or restrictions on digital use.\n\nExamples: Use cultural context of Hong Kong\'s education competitiveness.\n\nAdjustments: Consider comparing perspectives of students vs. parents.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'risen': {
            title: 'RISEN Framework',
            description: '<strong>Requirement</strong>: Clearly define what information or solution you are seeking.\n<br><strong>Information</strong>: Specify what background knowledge or supporting data is needed.\n<br><strong>Strategy</strong>: Describe the approach the AI should take to answer the question.\n<br><strong>Evaluation</strong>: Indicate how you will determine the accuracy or usefulness of the response.\n<br><strong>Negotiation</strong>: Leave room for flexibility in the response, allowing the AI to adjust its answer based on available information.',
            whenToUse: 'Best for complex projects, negotiations, and when you need to balance multiple requirements.',
            template: 'Requirement: Explore impacts of AI teacher replacement on student learning quality and social development; write it in {language} and {tone} tone.\n\nInformation: Research on classroom interaction, mentorship, and emotional support from teachers.\n\nStrategy: Propose mixed-methods study using surveys, interviews, and academic data.\n\nEvaluation: Use qualitative feedback and quantitative academic performance for analysis.\n\nNegotiation: Adjust focus if initial results show AI supplementing rather than replacing teachers.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result'
        },
        'rhodes': {
            title: 'RHODES Framework',
            description: '<strong>Research</strong>: Identify the topic or problem that needs investigation. Focus on key aspects and provide relevant background.\n<br><strong>Hypothesis</strong>: Create a testable statement that can be supported or disproven with evidence. Ensure it links two or more variables.\n<br><strong>Objectives</strong>: Define what you want to achieve. Clarify gaps in knowledge and outline measurable outcomes.\n<br><strong>Development</strong>: Plan the steps needed to explore the hypothesis. This may include gathering data, comparing sources, or reviewing literature.\n<br><strong>Execution</strong>: Carry out the research by analyzing data, collecting expert opinions, or testing different sources.\n<br><strong>Synthesis</strong>: Summarize insights, findings, and conclusions. Make sure the final response directly addresses the hypothesis.',
            whenToUse: 'Perfect for research projects, scientific writing, and when your research follows a hypothesis-based approach and you need a systematic approach.',
            template: 'Research: Investigate how social media usage influences self-esteem and body image, referencing engagement rates, common concerns, and prior studies.\n\nHypothesis: Higher engagement with visually-focused platforms correlates with lower self-esteem and more negative body image.\n\nObjectives: Measure usage, self-esteem, and body image; examine correlations; address local data gaps.\n\nDevelopment: Plan surveys/interviews, select validated scales, define timeline and ethics.\n\nExecution: Collect data from teenage girls, analyze correlations and trends.\n\nSynthesis: Summarize links between engagement and self-esteem; inform mental health and literacy programs.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result and write it in {language} and {tone} tone.'
        },
        'create': {
            title: 'CREATE Framework',
            description: '<strong>Conceptualize</strong>: Define the idea or challenge you want to explore. Outline the core problem and any initial thoughts.\n<br><strong>Research</strong>: Gather relevant background information, trends, and supporting data. Identify gaps in existing knowledge.\n<br><strong>Experiment</strong>: Test different approaches, methods, or solutions. This could involve brainstorming, prototyping, or analyzing various possibilities.\n<br><strong>Analyze</strong>: Evaluate the results of your experiments. Determine what worked, what didn\'t, and why.\n<br><strong>Transform</strong>: Refine and shape the idea based on your findings. Adapt and improve it into a structured plan or solution.\n<br><strong>Evaluate</strong>: Measure the success of your final approach. Assess whether it meets the original goal and consider future improvements.',
            whenToUse: 'Ideal for creative projects, innovation tasks, and when you need to explore new approaches.',
            template: 'You are a health and fitness expert specializing in stress reduction and sleep improvement through exercise.\n\nConceptualize: Define the challenge of poor sleep quality and high stress, and the goal to design an exercise routine addressing these issues.\n\nResearch: Use current scientific findings about exercise types (aerobic, yoga, stretching) that enhance sleep and reduce stress.\n\nExperiment: Propose and test variations in exercise types, intensity, and timing (morning vs. evening) to optimize sleep and stress outcomes.\n\nAnalyze: Evaluate effectiveness based on sleep improvement metrics and stress reduction indicators.\n\nTransform: Refine the routine into a practical weekly schedule combining best exercise modes and timings suited for stress relief and sleep enhancement.\n\nEvaluate: Include criteria to measure success and recommend future adjustments.\n\nProvide the entire exercise routine plan with clear steps and explanations in {language} and {tone} tone.\n\nRemark:\nRemove any visual and syntactical marker like ###, ***, ---, and etc in the generated result and write it in {language} and {tone} tone.'
        }
    };

    return guides[framework] || guides['pps'];
}

function createStructuredPrompt(originalPrompt, type, length, tone, language, framework) {
    if (framework === 'none') {
        // Compose a clear prompt that includes type, length, tone, and language
        return `${originalPrompt}\n\nPlease generate a ${type} in a ${tone} tone, approximately ${length} words, written in ${language}.`;
    }

    // Check if user has customized the framework template
    const customFrameworkText = document.getElementById('customFrameworkText');
    if (customFrameworkText && customFrameworkText.value.trim()) {
        return customFrameworkText.value
            .replace('{tone}', tone)
            .replace('{language}', language);
    }

    // Use framework templates as direct content generators
    const frameworkTemplates = {
        'pps': `Persona: You are a professional content creator and writing expert with deep knowledge across various fields.
Problem: Generate high-quality, engaging content that provides value to readers.
Solution: Create comprehensive, well-structured content with a ${tone} tone, written in ${language}. Focus on clarity, engagement, and practical value.`,

        'ctc': `Context: You are an expert content creator with extensive experience in writing high-quality, engaging content across various topics.
Task: Generate valuable, well-structured content that serves the reader's needs.
Constraints: Use a ${tone} tone, write in ${language}, and ensure the content is well-structured, engaging, and provides clear value to the reader.`,

        'clear': `Context:
As secondary students, we want guidance on emerging careers related to {topic} (e.g., AI, environmental design).
Logic:
Understanding opportunities helps us prepare subject choices for senior forms.
Expectations:
List 3–5 career options, each with required skills, typical salary in Hong Kong, and recommended school subjects.
Action:
Create an easy‑to‑read comparison summary.
Restrictions:
Use updated salary data (2022–2024) from reliable local sources. 

Remark:
Remove any visual and syntactical marker like ###, ***, ---, and etc in the generated result`,

        'smart': `Specific: Plan and execute a social project addressing {topic} (e.g., mental health, recycling, elder care) in ${language} with ${tone} tone.
Measurable: Engage around 100 participants across multiple activities.
Achievable: Use available school space, materials under HK$1 000, and volunteer manpower.
Relevant: Aim for visible, positive community impact tied to {topic}.
Time‑bound: Limit the project to a two‑day event — Day 1 for set‑up and activity launch, Day 2 for follow‑up, reflection, and sharing of outcomes.

Remark:
Remove any visual and syntactical marker like ###, ***, ---, and etc in the generated result`,

        'quest': `Question: How can I create the most valuable and engaging content for readers?
Understanding: You need to generate content with a ${tone} tone, written in ${language}.
Expectation: Well-structured, engaging content that provides clear value.
Scope: Focus on creating content that informs, engages, and serves reader needs.
Time: Provide a complete response that meets all quality standards.`,

        'guide': `Goal:
Turn a hobby or passion into a structured project that I can develop, share, and feel proud of—without it becoming another source of stress.
Understanding:
I have interests (photography, writing, gaming, fashion design, etc.) but I'm unsure how to develop them seriously while balancing school; I worry they're "not practical."
Information:
How to define realistic goals for your passion project (just for fun vs. building skills vs. sharing with others)
Time management strategies for hobbies during busy school periods
Tools, resources, and communities related to your specific interest
How to get feedback and improve your craft
Ways to share your work (Instagram, blogs, school events, competitions)
How passion projects can strengthen university applications (without being forced)
Stories from Hong Kong students who developed hobbies into meaningful pursuits
Direction:
Create a customisable project roadmap (fill in your hobby, set milestones); include resource lists by hobby type; use monthly progress tracker format.
Evaluation:
Quality check: Does this feel genuinely fun, not like another obligation? Can I do this within my real schedule? Are there Hong Kong examples I can relate to?`,

        'focus': `Function: Create content that effectively communicates valuable information.
Outcome: Well-structured, engaging content that serves reader needs.
Criteria: Use a ${tone} tone, write in ${language}, and maintain high quality.
Underlying Assumptions: The content should be relevant, engaging, and professionally written.
Strategy: Create comprehensive content that addresses reader needs effectively.`,

        'idea': `Intent: Examine parental and societal expectations influencing study and digital behavior in 13-15-year-old females.
Details: Family expectations often drive prolonged study hours coupled with monitoring or restrictions on digital use.
Examples: Use cultural context of Hong Kong's education competitiveness.
Adjustments: Consider comparing perspectives of students vs. parents.`,

        'risen': `Requirement: Explore impacts of AI teacher replacement on student learning quality and social development.
Information: Research on classroom interaction, mentorship, and emotional support from teachers.
Strategy: Propose mixed-methods study using surveys, interviews, and academic data.
Evaluation: Use qualitative feedback and quantitative academic performance for analysis.
Negotiation: Adjust focus if initial results show AI supplementing rather than replacing teachers.`,

        'rhodes': `Research: Investigate how social media usage influences self-esteem and body image, referencing engagement rates, common concerns, and prior studies.
Hypothesis: Higher engagement with visually-focused platforms correlates with lower self-esteem and more negative body image.
Objectives: Measure usage, self-esteem, and body image; examine correlations; address local data gaps.
Development: Plan surveys/interviews, select validated scales, define timeline and ethics.
Execution: Collect data from teenage girls, analyze correlations and trends.
Synthesis: Summarize links between engagement and self-esteem; inform mental health and literacy programs.`,

        'create': `You are a health and fitness expert specializing in stress reduction and sleep improvement through exercise.

Conceptualize: Define the challenge of poor sleep quality and high stress, and the goal to design an exercise routine addressing these issues.

Research: Use current scientific findings about exercise types (aerobic, yoga, stretching) that enhance sleep and reduce stress.

Experiment: Propose and test variations in exercise types, intensity, and timing (morning vs. evening) to optimize sleep and stress outcomes.

Analyze: Evaluate effectiveness based on sleep improvement metrics and stress reduction indicators.

Transform: Refine the routine into a practical weekly schedule combining best exercise modes and timings suited for stress relief and sleep enhancement.

Evaluate: Include criteria to measure success and recommend future adjustments.

Provide the entire exercise routine plan with clear steps and explanations.`
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
