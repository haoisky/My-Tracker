// --- 3D Background Setup (Three.js) ---
let scene, camera, renderer, particles;

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create particles (dust motes)
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xA3B18A, // Sage green particles
        size: 0.02,
        transparent: true,
        opacity: 0.7
    });
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Simple ambient light
    const ambientLight = new THREE.AmbientLight(0xDAD7CD, 0.5); // Beige light
    scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate3D();
}

// Animation loop for 3D background
function animate3D() {
    requestAnimationFrame(animate3D);

    // Add subtle rotation to the particles for a "living" background
    if (particles) {
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0001;
    }

    renderer.render(scene, camera);
}

// --- Lofi Music Setup (Tone.js) ---
        let lofiSynth, lofiMelody, musicPlaying = false;
        const musicToggleBtn = document.getElementById('music-toggle');

        function initMusic() {
            // More "chill" effects: Reverb and a simple Delay
            const reverb = new Tone.Reverb(1.5).toDestination();
            const delay = new Tone.FeedbackDelay("8n", 0.4).connect(reverb);

            // A softer synth (FMSynth) instead of the harsh "fatsawtooth"
            lofiSynth = new Tone.FMSynth({
                harmonicity: 1.5,
                modulationIndex: 1.2,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.7 }
            }).connect(delay);
            
            // A much more soothing, repetitive lofi-style melody (Cmaj7, Fmaj7)
            const melody = [
                'C4', null, 'E4', 'G4', 'B4', null, 'G4', 'E4',
                'F3', null, 'A3', 'C4', 'E4', null, 'C4', 'A3'
            ];

            lofiMelody = new Tone.Sequence((time, note) => {
                if (note) {
                    lofiSynth.triggerAttackRelease(note, '8n', time);
                }
            }, melody, '8n'); // 8n = eighth note, makes it flow better

            // Set transport settings
            Tone.Transport.bpm.value = 80; // Slow, chill BPM
            Tone.Transport.loop = true;
            Tone.Transport.loopEnd = '4m'; // Loop every 4 measures
            
            lofiMelody.start(0);
        }

        musicToggleBtn.addEventListener('click', async () => {
            if (!musicPlaying) {
                // Start music
                if (Tone.context.state !== 'running') {
                    await Tone.start();
                }
                if (!lofiSynth) {
                    initMusic(); // Initialize only when first clicked
                }
                Tone.Transport.start();
                musicToggleBtn.textContent = 'Mute 🎵';
                musicPlaying = true;
            } else {
                // Stop music
                Tone.Transport.stop();
                musicToggleBtn.textContent = 'Need to Relax? 🎧';
                musicPlaying = false;
            }
        });


// --- Dashboard Logic ---
// We wrap everything in DOMContentLoaded to make sure all HTML elements are ready
document.addEventListener('DOMContentLoaded', () => {

    // --- State Variables ---
    let encodingCount = 0;
    let encodingGoal = 350;
    let capstoneTasks = []; // Array of {id, name, status, category}

    // --- DOM Elements ---
    const countEl = document.getElementById('encoding-count');
    const goalEl = document.getElementById('encoding-goal');
    const progressEl = document.getElementById('encoding-progress');
    const messageEl = document.getElementById('encoding-message');
    
    const taskForm = document.getElementById('add-task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskStatusInput = document.getElementById('task-status');
    const taskCategoryInput = document.getElementById('task-category');
    const taskListEl = document.getElementById('task-list');

    const capstoneProgressText = document.getElementById('capstone-progress-text');
    const capstoneProgressBar = document.getElementById('capstone-progress-bar');
    
    const focusTextEl = document.getElementById('focus-text');
    const reflectionTextEl = document.getElementById('reflection-text');
    const manualSetValueEl = document.getElementById('manual-set-value');
    
    const musicToggleBtn = document.getElementById('music-toggle');

    // Gemini Feature Elements
    const analyzeReflectionBtn = document.getElementById('analyze-reflection-btn');
    const analysisOutputEl = document.getElementById('analysis-output');

    // --- Event Listeners ---
    
    // Load all data when the page opens
    init3D(); // Start the 3D background
    loadData();
    updateEncodingUI();
    renderTasks();
    
    // Auto-save for text areas
    focusTextEl.addEventListener('input', saveData);
    reflectionTextEl.addEventListener('input', saveData);
    goalEl.addEventListener('input', () => {
        encodingGoal = parseInt(goalEl.value) || 350;
        updateEncodingUI();
        saveData();
    });
    
    // Listener for "Add Task" form
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addCapstoneTaskFromForm();
    });

    // Gemini Feature Listener
    analyzeReflectionBtn.addEventListener('click', handleAnalyzeReflection);
    
    // Music Toggle Listener
    musicToggleBtn.addEventListener('click', () => {
        if (!musicPlaying) {
            startMusic();
            musicToggleBtn.textContent = 'Pause Music ⏸️';
        } else {
            stopMusic();
            musicToggleBtn.textContent = 'Play Music 🎧';
        }
    });
        // --- Encoding Tracker Functions (GLOBAL SCOPE) ---
    // These functions need to be in the global scope to be called by 'onclick' attributes
    
    window.addEncoding = (num) => {
        encodingCount += num;
        updateEncodingUI();
        saveData();
    };

    window.setEncoding = () => {
        encodingCount = parseInt(manualSetValueEl.value) || 0;
        manualSetValueEl.value = ''; // Clear input after setting
        updateEncodingUI();
        saveData();
    };

    window.resetEncoding = () => {
        encodingCount = 0;
        updateEncodingUI();
        saveData();
    };

    // --- Capstone Task Functions (GLOBAL SCOPE) ---

    window.clearDoneTasks = () => {
        capstoneTasks = capstoneTasks.filter(task => task.status !== 'Done');
        renderTasks();
        saveData();
    };
    
    window.deleteCapstoneTask = (id) => {
        capstoneTasks = capstoneTasks.filter(task => task.id !== id);
        renderTasks();
        saveData();
    };

    window.toggleTaskStatus = (id) => {
        const task = capstoneTasks.find(task => task.id === id);
        if (task) {
            if (task.status === 'Not Started') {
                task.status = 'In Progress';
            } else if (task.status === 'In Progress') {
                task.status = 'Done';
            } else {
                task.status = 'Not Started';
            }
        }
        renderTasks();
        saveData();
    };
    
    window.generateSubtasks = async (taskId, taskName) => {
        const task = capstoneTasks.find(t => t.id === taskId);
        if (!task) return;

        const originalCategory = task.category;
        task.category = "Generating sub-tasks... ✨";
        renderTasks();

        const systemPrompt = "You are a helpful project management assistant. You break down complex tasks into 3-5 simple, actionable sub-tasks. Respond with *only* the sub-tasks, separated by newlines. Do not add any preamble like 'Here are the sub-tasks:'.";
        const userQuery = `Break down this capstone project task: "${taskName}"`;

        try {
            const generatedText = await callGeminiAPI(systemPrompt, userQuery);
            const subtasks = generatedText.split('\n').filter(t => t.trim() !== '');

            subtasks.forEach(subtaskName => {
                addCapstoneTask(`- ${subtaskName.trim()}`, 'Not Started', `Sub-task of '${taskName}'`);
            });
            
            task.category = originalCategory;
            renderTasks();

        } catch (error) {
            console.error("Failed to generate subtasks:", error);
            task.category = "Error generating sub-tasks.";
            renderTasks();
            setTimeout(() => {
                task.category = originalCategory;
                renderTasks();
            }, 3000);
        }
    };


    // --- Internal Logic Functions (Scoped) ---

    function updateEncodingUI() {
        encodingGoal = parseInt(goalEl.value) || 350;
        countEl.textContent = encodingCount;
        
        let percentage = 0;
        if (encodingGoal > 0) {
            percentage = (encodingCount / encodingGoal) * 100;
        }
        if (percentage > 100) percentage = 100;
        if (percentage < 0) percentage = 0;
        
        progressEl.style.width = `${percentage}%`;

        if (encodingCount === 0) {
            messageEl.textContent = "Let's get started! ✨";
        } else if (encodingCount >= encodingGoal) {
            messageEl.textContent = "Quota reached! Great job! 🎉";
        } else if (encodingCount > encodingGoal / 2) {
            messageEl.textContent = "You're more than halfway there! 👏";
        } else {
             messageEl.textContent = "Keep going! 💪";
        }
    }
    
    function addCapstoneTaskFromForm() {
        const name = taskNameInput.value.trim();
        const status = taskStatusInput.value;
        const category = taskCategoryInput.value.trim();

        if (!name) return;
        addCapstoneTask(name, status, category || 'General');
        
        taskNameInput.value = '';
        taskCategoryInput.value = '';
        taskStatusInput.value = 'Not Started';
    }

    function addCapstoneTask(name, status, category) {
        const newTask = {
            id: Date.now(),
            name: name,
            status: status,
            category: category
        };
        capstoneTasks.push(newTask);
        renderTasks();
        saveData();
    }
    
    function renderTasks() {
        taskListEl.innerHTML = '';

        if (capstoneTasks.length === 0) {
            taskListEl.innerHTML = `<p class="text-center text-sage-green p-4">No tasks yet. Add one! 🍃</p>`;
        } else {
            capstoneTasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-item';
                
                let statusColor = '';
                if (task.status === 'Done') {
                    statusColor = 'bg-green-300 text-green-800';
                } else if (task.status === 'In Progress') {
                    statusColor = 'bg-yellow-300 text-yellow-800';
                } else {
                    statusColor = 'bg-gray-300 text-gray-800';
                }
                
                const taskNameClass = task.status === 'Done' ? 'line-through text-gray-400' : '';

                taskEl.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold truncate ${taskNameClass}" title="${task.name}">${task.name}</p>
                        <p class="text-sm text-sage-green">${task.category}</p>
                    </div>
                    <div class="flex items-center space-x-3 ml-4">
                        <button onclick="generateSubtasks(${task.id}, '${task.name}')" class="text-purple-300 hover:text-purple-200 text-xl" title="✨ Generate Sub-tasks">✨</button>
                        <span class="badge ${statusColor} cursor-pointer" onclick="toggleTaskStatus(${task.id})">${task.status}</span>
                        <button onclick="deleteCapstoneTask(${task.id})" class="text-red-400 hover:text-red-300 text-xl" title="Delete Task">&times;</button>
                    </div>
                `;
                taskListEl.appendChild(taskEl);
            });
        }
        
        updateOverallProgress();
    }
    
    function updateOverallProgress() {
        const totalTasks = capstoneTasks.length;
        const doneTasks = capstoneTasks.filter(task => task.status === 'Done').length;
        
        capstoneProgressText.textContent = `${doneTasks} / ${totalTasks} tasks complete`;
        
        let percentage = 0;
        if (totalTasks > 0) {
            percentage = (doneTasks / totalTasks) * 100;
        }
        
        capstoneProgressBar.style.width = `${percentage}%`;
    }

    // --- Data Persistence (localStorage) ---
    function saveData() {
        localStorage.setItem('encodingCount', encodingCount.toString());
        localStorage.setItem('encodingGoal', encodingGoal.toString());
        localStorage.setItem('capstoneTasks', JSON.stringify(capstoneTasks));
        localStorage.setItem('focusText', focusTextEl.value);
        localStorage.setItem('reflectionText', reflectionTextEl.value);
    }
    
    function loadData() {
        encodingCount = parseInt(localStorage.getItem('encodingCount')) || 0;
        encodingGoal = parseInt(localStorage.getItem('encodingGoal')) || 350;
        capstoneTasks = JSON.parse(localStorage.getItem('capstoneTasks')) || [];
        focusTextEl.value = localStorage.getItem('focusText') || '';
        reflectionTextEl.value = localStorage.getItem('reflectionText') || '';
        goalEl.value = encodingGoal;
    }

    // --- ✨✨ GEMINI API FEATURES ✨✨ ---

    async function callGeminiAPI(systemPrompt, userQuery) {
        const apiKey = ""; // Leave this as-is, Canvas will handle it
        const apiUrl = `https://generativanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let response;
        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries) {
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    const candidate = result.candidates?.[0];
                    if (candidate && candidate.content?.parts?.[0]?.text) {
                        return candidate.content.parts[0].text;
                    } else {
                        throw new Error("Invalid response structure from Gemini API.");
                    }
                } else if (response.status === 429 || response.status >= 500) {
                    const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                } else {
                    const errorResult = await response.json();
                    console.error("Gemini API Error:", errorResult);
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                if (retries >= maxRetries - 1) {
                    throw error;
                }
                retries++;
            }
        }
        throw new Error("Max retries reached. Failed to call Gemini API.");
    }

    async function handleAnalyzeReflection() {
        const focusText = focusTextEl.value.trim();
        const reflectionText = reflectionTextEl.value.trim();

        if (!focusText && !reflectionText) {
            analysisOutputEl.textContent = "Please write a focus or reflection first.";
            return;
        }

        analyzeReflectionBtn.disabled = true;
        analyzeReflectionBtn.textContent = "Analyzing... ✨";
        analysisOutputEl.textContent = "";

        const systemPrompt = "You are a kind, insightful personal coach. You read a user's daily focus and reflection. Respond with one short, encouraging, and insightful sentence (1-2 lines max) that acknowledges their effort or provides a gentle perspective. Be warm and supportive. Do not use quotes. Respond in English.";
        const userQuery = `My focus was: "${focusText}". My reflection is: "${reflectionText}". What's your insight?`;

        try {
            const generatedText = await callGeminiAPI(systemPrompt, userQuery);
            analysisOutputEl.textContent = generatedText;
        } catch (error) {
            console.error("Failed to analyze reflection:", error);
            analysisOutputEl.textContent = "Sorry, couldn't get an analysis right now.";
        } finally {
            analyzeReflectionBtn.disabled = false;
            analyzeReflectionBtn.textContent = "✨ Analyze My Day";
        }
    }
}); // End of DOMContentLoaded