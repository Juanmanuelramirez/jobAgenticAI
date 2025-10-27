/*
 * =======================================
 * ARCHIVO DE PROXY SEGURO (BACKEND)
 * REESCRITO PARA SUBIDA DE ARCHIVOS
 * =======================================
 *
 * Este backend AHORA corre en el runtime de Node.js (NO en 'edge').
 * Se encarga de:
 * 1. Recibir la subida de archivos (multipart/form-data).
 * 2. Parsear el formulario.
 * 3. Usar 'pdf-parse' y 'mammoth' para EXTRAER texto del archivo CV.
 * 4. Construir el prompt para Gemini.
 * 5. Llamar a la API de Gemini y devolver la respuesta.
 *
 * Requiere 'npm install formidable pdf-parse mammoth'
 */

// Importar dependencias
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// --- Textos de Prompt (para construir el prompt en el backend) ---
const promptStrings = {
    es: {
        firstMessageCV: "Este es mi CV:\n\n---\n{cv}\n---\n\nPor favor, analiza mi CV, busca empleos relevantes y dime qué encuentras y qué habilidades clave podrían faltarme según las ofertas.",
        critiqueMessage: "Este es mi CV actual:\n\n---\n{cv}\n---\n\nPor favor, actúa *únicamente* como un reclutador experto y asesor de carrera. NO busques empleos. Dame una crítica constructiva y accionable de mi CV. ¿Qué puedo mejorar? ¿Qué frases son débiles? ¿Cómo puedo reformular mi experiencia para tener más impacto?",
    },
    en: {
        firstMessageCV: "This is my CV:\n\n---\n{cv}\n---\n\nPlease analyze my CV, search for relevant jobs, and tell me what you find and what key skills I might be missing based on the listings.",
        critiqueMessage: "This is my current CV:\n\n---\n{cv}\n---\n\nPlease act *only* as an expert recruiter and career coach. DO NOT search for jobs. Give me constructive, actionable feedback on my CV. What can I improve? What phrases are weak? How can I rephrase my experience for more impact?",
    }
};

// --- Helper: Función para parsear el texto del CV ---
async function parseCvText(file) {
    const mimeType = file.mimetype;
    const filePath = file.filepath;

    if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else if (mimeType === 'text/plain') { // .txt
        return fs.readFileSync(filePath, 'utf8');
    } else {
        throw new Error(`Unsupported file type: ${mimeType}. Please use PDF, DOCX, or TXT.`);
    }
}

// --- Helper: Función para llamar a Gemini ---
async function callGeminiAPI(payload) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('API key not configured on server');
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return geminiResponse;
}

// --- Handler Principal de la API ---
export default async function handler(req, res) {
    
    // --- RUTA 1: Mensaje de chat normal (JSON) ---
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        try {
            const requestBody = req.body; // Vercel parsea JSON automáticamente
            const geminiResponse = await callGeminiAPI(requestBody);
            const data = await geminiResponse.json();
            
            return res.status(geminiResponse.status).json(data);
            
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // --- RUTA 2: Subida de archivo (multipart/form-data) ---
    const form = new IncomingForm();

    try {
        const [fields, files] = await form.parse(req);
        
        const cvFile = files.cvFile?.[0];
        const chatHistoryStr = fields.chatHistory?.[0];
        const systemPromptStr = fields.systemPrompt?.[0];
        const lang = fields.lang?.[0] || 'es';
        const action = fields.action?.[0]; // 'analyze' o 'critique'

        if (!cvFile) {
            return res.status(400).json({ error: 'No CV file uploaded.' });
        }

        // 1. Extraer texto del CV
        let extractedCvText;
        try {
            extractedCvText = await parseCvText(cvFile);
        } catch (parseError) {
            return res.status(400).json({ error: parseError.message });
        }

        // 2. Construir el prompt del usuario
        let userMessage;
        const strings = promptStrings[lang] || promptStrings.es;
        if (action === 'critique') {
            userMessage = strings.critiqueMessage.replace('{cv}', extractedCvText);
        } else {
            userMessage = strings.firstMessageCV.replace('{cv}', extractedCvText);
        }

        // 3. Construir el payload de Gemini
        const chatHistory = JSON.parse(chatHistoryStr || '[]');
        const contents = [
            ...chatHistory,
            { role: "user", parts: [{ text: userMessage }] }
        ];
        
        const systemInstruction = { parts: [{ text: systemPromptStr }] };

        const payload = {
            contents: contents,
            systemInstruction: systemInstruction,
        };

        // Añadir herramienta de búsqueda si la acción es 'analyze'
        if (action === 'analyze') {
            payload.tools = [{ "google_search": {} }];
        }
        
        // 4. Llamar a la API de Gemini
        const geminiResponse = await callGeminiAPI(payload);
        const data = await geminiResponse.json();
        
        // 5. Devolver la respuesta
        return res.status(geminiResponse.status).json(data);

    } catch (error) {
        console.error('Error en el backend:', error);
        return res.status(500).json({ error: error.message });
    }
}

