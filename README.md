# **Asesor de Empleo con IA**

Este es un agente de IA para la búsqueda de empleos que actúa como un "headhunter" experto. El agente analiza tu CV, busca activamente empleos en tiempo real usando Google Search, identifica las brechas de habilidades ("Gap Analysis") entre tu perfil y las vacantes, y te asesora sobre cómo mejorar tu CV.

## **Características**

* **Agente de IA Proactivo:** Utiliza la API de Gemini con Google Search para encontrar empleos reales.  
* **Análisis de Brechas (Gap Analysis):** Compara tu CV con las descripciones de trabajo e identifica las habilidades clave que te faltan.  
* **Asesor de CV:** Un modo "Criticar mi CV" que te da feedback accionable para mejorar tu perfil.  
* **Bucle de Iteración:** Puedes editar tu CV en tiempo real y "Re-Analizar" para obtener un nuevo conjunto de empleos y consejos.  
* **Multilingüe:** Soporta Español e Inglés.

## **🚀 Configuración y Ejecución Local**

Para ejecutar este proyecto localmente, necesitas un servidor web simple (debido a la carga de módulos de JS) y, lo más importante, una clave de API de Google Gemini.

### **1\. Requisito Previo: Clave de API de Gemini**

1. Ve a [Google AI Studio](https://aistudio.google.com/).  
2. Inicia sesión y haz clic en "**Get API key**" (Obtener clave de API).  
3. Crea una nueva clave de API. Cópiala y guárdala de forma segura.

### **2\. Configuración del Proyecto**

1. **Clona el Repositorio:**

```

git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
cd TU_REPOSITORIO

```

4.   
   Crea el Archivo de Configuración (¡CRÍTICO\!)  
   Este proyecto utiliza un archivo config.js para almacenar tu clave de API de forma segura. Este archivo es ignorado por Git (gracias a .gitignore) para que nunca expongas tu clave.  
   Crea un archivo llamado config.js en la raíz del proyecto y añade el siguiente contenido, reemplazando "TU\_API\_KEY\_AQUI" con tu clave real:

```

// config.js
const API_KEY = "TU_API_KEY_AQUI";

```

7.   
   Ejecuta un Servidor Local  
   Debido a que usamos import de JavaScript (Módulos ES), no puedes simplemente abrir index.html en tu navegador. Necesitas un servidor local. La forma más fácil es usando http-server:

```

# Si no tienes http-server, instálalo globalmente
npm install -g http-server

# Ejecuta el servidor en el directorio de tu proyecto
http-server -c-1

```

10.   
    Abre tu navegador y ve a http://localhost:8080. ¡La aplicación debería funcionar\!

## **🔒 Despliegue en Producción (¡IMPORTANTE\!)**

**NUNCA DESPLIEGUES ESTE PROYECTO ESTÁTICAMENTE (COMO EN GITHUB PAGES) CON config.js**

Si lo haces, tu clave de API será visible para todo el mundo. La única manera segura de desplegar una aplicación como esta es usando un **backend proxy** (también conocido como *serverless function*).

### **Arquitectura Recomendada: Vercel o Netlify**

La idea es que tu frontend (el index.html) no llame a la API de Gemini directamente. En su lugar, llama a una función en tu propio servidor (un "proxy"), y es *ese servidor* el que añade la clave de API (que está guardada de forma segura como una variable de entorno) y luego llama a Gemini.

1. **Frontend (GitHub):** Tu index.html, style.css, script.js.  
2. **Llamada de JS:** El script.js se modifica para que no llame a https://generativelanguage.googleapis.com/..., sino a /api/chat.  
3. **Backend (Función Serverless de Vercel/Netlify):**  
   * Creas una función en api/chat.js.  
   * Esta función recibe la petición del frontend.  
   * Lee la clave de API de las **Variables de Entorno** (ej. process.env.GEMINI\_API\_KEY).  
   * Llama a la API de Gemini *desde el servidor*, añadiendo la clave secreta.  
   * Devuelve la respuesta de Gemini al frontend.

Esta arquitectura asegura que tu clave de API **nunca** se exponga al navegador del usuario.
