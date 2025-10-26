/* ========================================
ARCHIVO JAVASCRIPT (LÓGICA)
========================================
*/

// --- Referencias del DOM ---
const cvTextarea = document.getElementById('cv-textarea');
const loadCvBtn = document.getElementById('load-cv-btn');
const critiqueCvBtn = document.getElementById('critique-cv-btn');
const chatWindow = document.getElementById('chat-window');
const userInputForm = document.getElementById('user-input-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loader = document.getElementById('loader');
const jobListingsContainer = document.getElementById('job-listings-container');
const jobListings = document.getElementById('job-listings');
const langBtnEs = document.getElementById('lang-btn-es');
const langBtnEn = document.getElementById('lang-btn-en');

// --- Estado de la Aplicación ---
let chatHistory = [];
let cvText = "";
let isAgentReady = false;
let currentLang = 'es'; // Idioma por defecto

// --- Configuración de la API de Gemini ---

// ARQUITECTURA: Verificamos si la API_KEY existe en el archivo 'config.js' (ignorado por Git)
// Esto es VITAL para la seguridad en GitHub.
let apiKey;
try {
    if (typeof API_KEY !== 'undefined') {
        apiKey = API_KEY;
    } else {
        throw new Error("API_KEY not found. Please create config.js");
    }
} catch (e) {
    console.error(e.message);
    // Mostrar un error al usuario en el chat, ya que la app no puede funcionar.
    addMessage('agent', 'Error de Configuración: No se encontró el archivo `config.js` con una `API_KEY`. Por favor, sigue las instrucciones del `README.md`.');
}

const apiUrl = '/api/chat'; // ¡Llamamos a nuestra propia API segura!


// --- Diccionario de Textos (i18n) ---
const uiStrings = {
    es: {
        title: "Asesor de Empleo con IA",
        cvTitle: "Tu Curriculum Vitae (CV) - Editable",
        cvSubtitle: "Pega tu CV aquí. Puedes editarlo en cualquier momento y re-analizar.",
        cvPlaceholder: "Pega tu CV completo aquí... (Ej: Juan Pérez, Desarrollador Web, Experiencia en JavaScript, Educación...)",
        analyzeBtn: "Analizar CV y Buscar Empleos",
        reAnalyzeBtn: "Re-Analizar y Buscar",
        critiqueBtn: "Criticar mi CV",
        welcomeMsg: "¡Hola! Soy tu asesor de IA para búsqueda de empleo. Pega tu CV a la izquierda y presiona 'Analizar' para comenzar.",
        loaderMsg: "El agente está pensando...",
        jobsFoundTitle: "Empleos Encontrados",
        noJobsFound: "No se encontraron empleos esta vez.",
        untitledLink: "Enlace sin título",
        chatPlaceholder: "Responde al agente aquí...",
        sendBtn: "Enviar",
        cvTooShort: "Por favor, pega un CV más completo (mínimo 50 caracteres) para que pueda analizarlo correctamente.",
        cvReceived: "¡CV recibido! Analizándolo y buscando empleos relevantes en internet. Esto puede tardar un momento...",
        firstMessageCV: "Este es mi CV:\n\n---\n{cv}\n---\n\nPor favor, analiza mi CV, busca empleos relevantes y dime qué encuentras y qué habilidades clave podrían faltarme según las ofertas.",
        critiqueMessage: "Este es mi CV actual:\n\n---\n{cv}\n---\n\nPor favor, actúa *únicamente* como un reclutador experto y asesor de carrera. NO busques empleos. Dame una crítica constructiva y accionable de mi CV. ¿Qué puedo mejorar? ¿Qué frases son débiles? ¿Cómo puedo reformular mi experiencia para tener más impacto?",
        apiError: "Lo siento, he encontrado un error al procesar tu solicitud. Inténtalo de nuevo.",
        connectionError: "He tenido un problema de conexión. Por favor, espera un momento y vuelve a intentarlo.",
        systemPrompt: `
Eres un "Asesor de IA" experto en reclutamiento y análisis de perfiles, como un headhunter de alto nivel. Tu tono es profesional, proactivo, servicial y estratégico.
Tu tarea es ayudar al usuario a encontrar las mejores ofertas de trabajo basadas en su CV y en la conversación, Y ayudarle a mejorar su CV.

**Tu Proceso Obligatorio (Debes seguirlo en cada respuesta, a menos que se te pida una crítica de CV):**

1.  **Analizar Contexto:** Revisa el CV del usuario (proporcionado en el mensaje) y TODO el historial de chat para entender sus habilidades, experiencia y las habilidades nuevas que ha confirmado.
2.  **Buscar Empleos:** Utiliza SIEMPRE tu herramienta de Google Search para encontrar ofertas de trabajo relevantes en tiempo real basadas en el análisis del contexto.
3.  **Análisis de Brechas (Gap Analysis):**
    * Compara las 3-5 ofertas de trabajo más relevantes que encontraste con las habilidades del CV del usuario Y las habilidades confirmadas en el chat.
    * **NUEVO (Asesoría de Headhunter):** No solo identifiques habilidades faltantes, sino también **sugiere cómo reformular la experiencia existente** en el CV para que coincida mejor con las descripciones de trabajo. (Ej: "Veo que pones 'Manejo de proyectos'. Para la vacante de 'Scrum Master', reformúlalo a 'Liderazgo de ceremonias Scrum y gestión de backlogs'").
4.  **Preguntar (Clave):** Si identificas habilidades CLAVE en las descripciones de los trabajos que NO están ni en el CV ni han sido confirmadas en el chat, DEBES preguntarle al usuario sobre ellas. Sé específico.
    * *Ejemplo Bueno:* "He notado que varias ofertas para 'Desarrollador Senior' piden experiencia con 'Kubernetes' y 'CI/CD'. ¿Tienes experiencia en estas áreas?"
5.  **Confirmar y Sugerir Actualización:** Si el usuario confirma una nueva habilidad (ej. "Sí, usé Kubernetes por 2 años"), primero confirma que la has "anotado" para futuras búsquedas. Segundo, DEBES sugerirle que **actualice su CV en el editor de texto de la izquierda** y presione "Re-Analizar".
    * *Ejemplo:* "¡Excelente! He tomado nota de tu experiencia con 'Kubernetes'. Te recomiendo **añadirlo ahora mismo a tu CV en el editor de la izquierda** y presionar 'Re-Analizar' para que busquemos empleos con tu perfil actualizado."
6.  **Responder:** Formula una respuesta conversacional que incluya:
    a) Un resumen de los empleos encontrados.
    b) Tus preguntas sobre las habilidades faltantes (el "Gap Analysis").
    c) Respuestas a cualquier pregunta directa que el usuario haya hecho.
    
**Mandatorio:** DEBES basar tu resumen de empleos y tu análisis de brechas (Gap Analysis) *directamente* en los resultados de la Búsqueda de Google.

**Regla Crítica para Enlaces:** Tu respuesta DEBE estar *directamente* basada en la información de los resultados de la búsqueda. Si no basas tu respuesta en los resultados de búsqueda, los enlaces de "Empleos Encontrados" (las URLs de las vacantes) NO aparecerán, y fallarás en tu tarea principal. El usuario NECESITA esos enlaces para poder aplicar.

**Regla de Formato de Enlaces (NUEVO):** Al final de tu resumen de empleos, DEBES incluir una lista de los 3-5 enlaces de vacantes más relevantes en formato Markdown, de esta forma:
* [Título del Empleo 1](httpsURL-real-de-la-vacante.com)
* [Título del Empleo 2](httpsURL-real-de-la-vacante.net)

**Formato de Respuesta:** Utiliza Markdown para formatear tu respuesta. Usa listas con viñetas (\`*\`) para preguntas o puntos clave, y \`**negrita**\` para resaltar habilidades o títulos de trabajo. Esto es crucial para la legibilidad.
`
    },
    en: {
        title: "AI Job Advisor",
        cvTitle: "Your Curriculum Vitae (CV) - Editable",
        cvSubtitle: "Paste your CV here. You can edit it anytime and re-analyze.",
        cvPlaceholder: "Paste your full CV here... (e.g., John Doe, Web Developer, JavaScript Experience, Education...)",
        analyzeBtn: "Analyze CV and Search Jobs",
        reAnalyzeBtn: "Re-Analyze and Search",
        critiqueBtn: "Critique my CV",
        welcomeMsg: "Hi! I'm your AI job advisor. Paste your CV on the left and press 'Analyze' to start.",
        loaderMsg: "The agent is thinking...",
        jobsFoundTitle: "Jobs Found",
        noJobsFound: "No jobs were found this time.",
        untitledLink: "Untitled Link",
        chatPlaceholder: "Reply to the agent here...",
        sendBtn: "Send",
        cvTooShort: "Please paste a more complete CV (minimum 50 characters) so I can analyze it correctly.",
        cvReceived: "CV received! Analyzing it and searching for relevant jobs online. This may take a moment...",
        firstMessageCV: "This is my CV:\n\n---\n{cv}\n---\n\nPlease analyze my CV, search for relevant jobs, and tell me what you find and what key skills I might be missing based on the listings.",
        critiqueMessage: "This is my current CV:\n\n---\n{cv}\n---\n\nPlease act *only* as an expert recruiter and career coach. DO NOT search for jobs. Give me constructive, actionable feedback on my CV. What can I improve? What phrases are weak? How can I rephrase my experience for more impact?",
        apiError: "Sorry, I've encountered an error while processing your request. Please try again.",
        connectionError: "I've had a connection issue. Please wait a moment and try again.",
        systemPrompt: `
You are an "AI Advisor" and expert headhunter. Your tone is professional, proactive, helpful, and strategic.
Your task is to help the user find the best job offers based on their CV and conversation, AND help them improve their CV.

**Your Mandatory Process (Follow on every reply, unless asked for a CV critique):**

1.  **Analyze Context:** Review the user's CV (provided in the message) and ALL chat history to understand their skills, experience, and new confirmed skills.
2.  **Search Jobs:** ALWAYS use your Google Search tool to find relevant job openings in real-time.
3.  **Gap Analysis:**
    * Compare the 3-5 most relevant job openings with the user's CV skills AND confirmed chat skills.
    * **NEW (Headhunter Advice):** Don't just identify missing skills, but also **suggest how to rephrase existing experience** on the CV to better match job descriptions. (e.g., "I see you listed 'Project Management'. For this 'Scrum Master' role, rephrase that to 'Led Scrum ceremonies and managed product backlogs'").
4.  **Ask (Key):** If you identify KEY skills in the job descriptions NOT in the CV or chat, you MUST ask. Be specific.
    * *Good Example:* "I noticed several listings for 'Senior Developer' require 'Kubernetes' and 'CI/CD'. Do you have experience here?"
5.  **Confirm and Suggest Update:** If the user confirms a new skill (e.g., "Yes, 2 years of Kubernetes"), first note it for future searches. Second, you MUST suggest they **update their CV in the text editor on the left** and press "Re-Analyze".
    * *Example:* "Excellent! I've noted your 'Kubernetes' experience. I recommend **adding that to your CV in the editor right now** and hitting 'Re-Analyze' so we can search with your updated profile."
6.  **Reply:** Formulate a conversational response including:
    a) A summary of jobs found.
    b) Your questions about missing skills (Gap Analysis).
    c) Answers to any direct user questions.
    
**Mandatory:** You MUST base your job summary and Gap Analysis *directly* on the Google Search results.

**Critical Link Rule:** Your response MUST be *directly* based on information from the search results. If you don't base your reply on the search results, the "Jobs Found" links (the job posting URLs) will NOT appear, and you will fail your primary task. The user NEEDS those links to apply.

**Link Format Rule (NEW):** At the end of your job summary, you MUST include a list of the 3-5 most relevant job links in Markdown format, like this:
* [Job Title 1](https://real-job-url.com)
* [Job Title 2](https://real-job-url.net)

**Response Format:** Use Markdown to format your response. Use bulleted lists (\`*\`) for questions or key points, and \`**bold**\` to highlight skills or job titles. This is crucial for readability.
`
    }
};

// --- Event Listeners ---
if (apiKey) { // Solo adjuntar listeners si la clave de API está presente
    langBtnEs.addEventListener('click', () => setLanguage('es'));
    langBtnEn.addEventListener('click', () => setLanguage('en'));
    loadCvBtn.addEventListener('click', handleCvLoad);
    critiqueCvBtn.addEventListener('click', handleCvCritique);
    userInputForm.addEventListener('submit', handleUserMessage);
}

// --- Handlers de Eventos ---

function handleCvLoad() {
    cvText = cvTextarea.value; // Siempre toma el valor actual
    if (cvText.trim().length < 50) {
        addMessage('agent', uiStrings[currentLang].cvTooShort);
        return;
    }

    if (!isAgentReady) { 
        resetChat(false); // No limpiar el mensaje de bienvenida
        addMessage('user', `CV Loaded: ${cvText.substring(0, 150)}... [CV remainder hidden for brevity]`);
    } else {
         addMessage('user', `[CV Actualizado] Re-analizando con el nuevo CV...`);
    }
    
    addMessage('agent', uiStrings[currentLang].cvReceived);
    setLoadingState(true);

    const firstMessage = uiStrings[currentLang].firstMessageCV.replace('{cv}', cvText);
    runAgent(firstMessage, true); // true = ejecutar búsqueda de empleos

    const btnSpan = loadCvBtn.querySelector('span');
    if (btnSpan) {
        btnSpan.textContent = uiStrings[currentLang].reAnalyzeBtn;
    }
}

function handleCvCritique() {
    cvText = cvTextarea.value;
     if (cvText.trim().length < 50) {
        addMessage('agent', uiStrings[currentLang].cvTooShort);
        return;
    }

    addMessage('user', `[Solicitud de Crítica de CV]`);
    setLoadingState(true);

    const critiqueMessage = uiStrings[currentLang].critiqueMessage.replace('{cv}', cvText);
    runAgent(critiqueMessage, false); // false = NO ejecutar búsqueda de empleos
}

function handleUserMessage(e) {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (userMessage && isAgentReady) {
        addMessage('user', userMessage);
        userInput.value = '';
        setLoadingState(true);
        
        runAgent(userMessage, true); // Chat normal siempre busca empleos
    }
}

// --- Funciones Principales ---

/**
 * Ejecuta el agente de IA llamando a la API de Gemini.
 * @param {string} userMessage - El mensaje del usuario para este turno.
 * @param {boolean} [runSearch=true] - Flag para correr Google Search.
 */
async function runAgent(userMessage, runSearch = true) {
    showLoader(true);
    jobListingsContainer.classList.add('hidden');
    jobListings.innerHTML = '';

    const contents = [
        ...chatHistory,
        { role: "user", parts: [{ text: userMessage }] }
    ];
    
    const systemPrompt = uiStrings[currentLang].systemPrompt;

    const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    if (runSearch) {
        payload.tools = [{ "google_search": {} }];
    }

    try {
        const response = await fetchWithBackoff(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error de API: ${response.statusText}`);
        }

        const result = await response.json();
        
        const candidate = result.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            const agentResponseText = candidate.content.parts[0].text;
            const groundingMetadata = candidate.groundingMetadata;

            chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            chatHistory.push({ role: "model", parts: [{ text: agentResponseText }] });

            addMessage('agent', agentResponseText);

            const combinedSources = [];
            const addedUris = new Set();

            if (runSearch && groundingMetadata && groundingMetadata.groundingAttributions) {
                groundingMetadata.groundingAttributions
                    .map(attr => attr.web)
                    .filter(web => web && web.uri && web.title)
                    .forEach(source => {
                        if (!addedUris.has(source.uri)) {
                            combinedSources.push({ uri: source.uri, title: source.title });
                            addedUris.add(source.uri);
                        }
                    });
            }

            const markdownLinks = extractMarkdownLinks(agentResponseText);
            markdownLinks.forEach(link => {
                if (!addedUris.has(link.uri)) {
                    combinedSources.push(link);
                    addedUris.add(link.uri);
                }
            });

            if(runSearch) {
                displayJobs(combinedSources);
            }

        } else {
            console.error("Respuesta inesperada de la API:", result);
            addMessage('agent', uiStrings[currentLang].apiError);
        }

    } catch (error) {
        console.error("Error al llamar a runAgent:", error);
        addMessage('agent', uiStrings[currentLang].connectionError);
    } finally {
        setLoadingState(false);
    }
}

// --- Funciones de Utilidad (UI y Estado) ---

/**
 * Habilita o deshabilita los controles de la UI durante la carga.
 * @param {boolean} isLoading - Estado de carga.
 */
function setLoadingState(isLoading) {
    showLoader(isLoading);
    userInput.disabled = isLoading;
    sendBtn.disabled = isLoading;
    critiqueCvBtn.disabled = isLoading;
    loadCvBtn.disabled = isLoading; // Deshabilitar ambos botones de CV
    isAgentReady = !isLoading;
    if (!isLoading) {
        userInput.focus();
    }
}

/**
 * Cambia el idioma de la UI y reinicia el chat.
 * @param {'es' | 'en'} lang - El idioma a establecer.
 */
function setLanguage(lang) {
    if (lang !== currentLang) {
        currentLang = lang;
        resetChat(true); // Limpiar completamente el chat
    }

    langBtnEs.classList.toggle('active', lang === 'es');
    langBtnEn.classList.toggle('active', lang === 'en');
    
    document.title = uiStrings[lang].title;
    document.documentElement.lang = lang; // Actualizar el lang del HTML

    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        const type = el.getAttribute('data-i18n-type');
        
        if (key && uiStrings[lang][key]) {
            const elKey = (el.id === 'load-cv-btn' && isAgentReady) ? 'reAnalyzeBtn' : key;
            
            if (type === 'placeholder') {
                el.placeholder = uiStrings[lang][elKey];
            } else if (el.tagName === 'SPAN') {
                el.textContent = uiStrings[lang][elKey];
            } else if (!el.querySelector('span')) { // Evitar sobrescribir botones
               el.textContent = uiStrings[lang][elKey];
            }
        }
    });
    
    const btnSpan = loadCvBtn.querySelector('span');
    if (btnSpan) {
        btnSpan.textContent = isAgentReady ? uiStrings[currentLang].reAnalyzeBtn : uiStrings[currentLang].analyzeBtn;
    }
}

/**
 * Reinicia el chat a su estado inicial.
 * @param {boolean} addWelcome - Si se debe añadir el mensaje de bienvenida.
 */
function resetChat(addWelcome = true) {
    chatHistory = [];
    cvText = "";
    isAgentReady = false;
    chatWindow.innerHTML = '';
    jobListings.innerHTML = '';
    jobListingsContainer.classList.add('hidden');
    userInput.disabled = true;
    sendBtn.disabled = true;
    critiqueCvBtn.disabled = true;
    loadCvBtn.disabled = false;
    
    const btnSpan = loadCvBtn.querySelector('span');
    if (btnSpan) {
        btnSpan.textContent = uiStrings[currentLang].analyzeBtn;
    }

    if(addWelcome) {
        addMessage('agent', uiStrings[currentLang].welcomeMsg);
    }
}

/**
 * Añade un mensaje a la ventana del chat.
 * @param {'user' | 'agent'} sender - Quién envía el mensaje.
 * @param {string} text - El contenido del mensaje.
 */
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const textContainer = document.createElement('div');
    textContainer.className = `max-w-xs lg:max-w-xl p-4 rounded-xl shadow-md text-sm ${sender === 'user' ? 'user-bubble' : 'agent-bubble'}`;

    if (sender === 'agent') {
        textContainer.innerHTML = marked.parse(text);
    } else {
        const sanitizedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        textContainer.innerHTML = `<p>${sanitizedText}</p>`;
    }

    messageDiv.appendChild(textContainer);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Extrae enlaces Markdown de un texto.
 * @param {string} text - El texto del agente.
 * @returns {Array<{uri: string, title: string}>}
 */
function extractMarkdownLinks(text) {
    const links = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        links.push({
            title: match[1],
            uri: match[2]
        });
    }
    return links;
}

/**
 * Muestra los trabajos encontrados en su contenedor.
 * @param {Array<{uri: string, title: string}>} sources - Las fuentes de la búsqueda.
 */
function displayJobs(sources) {
    jobListings.innerHTML = '';
    if (!sources || sources.length === 0) {
        jobListings.innerHTML = `<p class="text-sm text-gray-500">${uiStrings[currentLang].noJobsFound}</p>`;
        jobListingsContainer.classList.remove('hidden');
        return;
    }

    sources.forEach(source => {
        const jobLink = document.createElement('a');
        jobLink.href = source.uri;
        jobLink.target = '_blank';
        jobLink.rel = 'noopener noreferrer';
        jobLink.className = 'flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg transition duration-200 group border border-gray-200 shadow-sm';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'truncate text-sm font-medium text-indigo-700 group-hover:text-indigo-800';
        titleSpan.textContent = source.title || uiStrings[currentLang].untitledLink;
        
        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 group-hover:text-indigo-600 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>`;
        
        jobLink.appendChild(titleSpan);
        jobLink.innerHTML += iconSvg;
        
        jobListings.appendChild(jobLink);
    });
    jobListingsContainer.classList.remove('hidden');
}

/**
 * Muestra u oculta el indicador de carga.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
function showLoader(show) {
    loader.classList.toggle('hidden', !show);
}

/**
 * Función fetch con reintento y backoff exponencial.
 * @param {string} url - La URL de la API.
 * @param {object} options - Las opciones de fetch.
 * @param {number} maxRetries - Número máximo de reintentos.
 */
async function fetchWithBackoff(url, options, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 || response.status >= 500) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response;
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// --- Inicialización ---
if (apiKey) {
    setLanguage(currentLang); // Establecer el idioma inicial
}
