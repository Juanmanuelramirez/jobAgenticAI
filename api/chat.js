/*
 * =======================================
 * ARCHIVO DE PROXY SEGURO (BACKEND)
 * =======================================
 *
 * ESTE ES TU BACKEND SEGURO (Serverless Function para Vercel/Netlify)
 * Se debe colocar en una carpeta /api en la raíz de tu proyecto.
 *
 * CÓMO FUNCIONA:
 * 1. El frontend (script.js) llama a '/api/chat'.
 * 2. Vercel/Netlify ejecutan este archivo en un servidor.
 * 3. Este script lee la clave de API secreta desde las "Variables de Entorno"
 * (que tú configuras en el panel de Vercel/Netlify).
 * 4. Llama a la API de Gemini DESDE EL SERVIDOR, adjuntando la clave.
 * 5. Devuelve la respuesta de Gemini al frontend.
 *
 * RESULTADO: La clave de API NUNCA se envía al navegador del usuario.
 */

export const config = {
  runtime: 'edge', // Optimizado para velocidad y streaming
};

export default async function (req) {
  // 1. Obtener el cuerpo de la solicitud (historial de chat, etc.) del frontend
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Leer la clave de API secreta desde las Variables de Entorno
  //    Esta clave SÓLO existe en el servidor.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  try {
    // 3. Llamar a la API de Gemini DESDE EL SERVIDOR
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody), // Pasar el cuerpo del frontend
    });

    const data = await geminiResponse.json();

    // 4. Devolver la respuesta de Gemini al frontend
    return new Response(JSON.stringify(data), {
      status: geminiResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Manejar errores de red o de la API
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
