/*
 * ESTE ES TU BACKEND SEGURO (Serverless Function)
 * Vercel automáticamente lo ejecutará en un servidor.
 * La clave de API NUNCA se envía al navegador del usuario.
 */

export const config = {
  runtime: 'edge', // Optimizado para velocidad
};

export default async function (req) {
  // 1. Obtener el cuerpo de la solicitud (historial de chat, etc.) del frontend
  const requestBody = await req.json();

  // 2. Leer la clave de API secreta desde las Variables de Entorno
  //    Esta clave SÓLO existe en el servidor.
  const apiKey = process.env.GEMINI_API_KEY;
  
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
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Manejar errores
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
