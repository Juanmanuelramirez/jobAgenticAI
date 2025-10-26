# **Asesor de Empleo con IA**

Este es un agente de IA para la búsqueda de empleos que actúa como un "headhunter" experto. El agente analiza tu CV, busca activamente empleos en tiempo real usando Google Search, identifica las brechas de habilidades ("Gap Analysis") entre tu perfil y las vacantes, y te asesora sobre cómo mejorar tu CV.

## **Características**

* **Agente de IA Proactivo:** Utiliza la API de Gemini con Google Search para encontrar empleos reales.  
* **Análisis de Brechas (Gap Analysis):** Compara tu CV con las descripciones de trabajo e identifica las habilidades clave que te faltan.  
* **Asesor de CV:** Un modo "Criticar mi CV" que te da feedback accionable para mejorar tu perfil.  
* **Bucle de Iteración:** Puedes editar tu CV en tiempo real y "Re-Analizar" para obtener un nuevo conjunto de empleos y consejos.  
* **Multilingüe:** Soporta Español e Inglés.  
* **Arquitectura Segura:** Listo para despliegue en producción (Vercel/Netlify) con un proxy de API para proteger tu clave secreta.

## **🚀 Configuración y Ejecución**

Este proyecto tiene dos modos de ejecución: Local (para desarrollo) y Producción (para despliegue).

### **1\. Desarrollo Local**

Para ejecutar este proyecto localmente, necesitas un servidor web simple y tu clave de API de Google Gemini.

1. **Obtén tu Clave de API:**  
   * Ve a [Google AI Studio](https://aistudio.google.com/).  
   * Crea una nueva clave de API y cópiala.  
2. **Crea el Archivo de Configuración (¡CRÍTICO\!)**  
   * Crea un archivo llamado config.js en la raíz del proyecto (junto a index.html).  
   * Este archivo **es ignorado por Git** (gracias a .gitignore) para que nunca expongas tu clave.  
   * Añade el siguiente contenido, reemplazando "TU\_API\_KEY\_AQUI":

```

// config.js (SÓLO PARA DESARROLLO LOCAL)
const API_KEY = "TU_API_KEY_AQUI";

```

5.   
   **Ejecuta un Servidor Local**  
   * No puedes simplemente abrir index.html en tu navegador (debido a los módulos de JS). Necesitas un servidor. La forma más fácil es usando http-server:

```

# Si no tienes http-server, instálalo globalmente
npm install -g http-server

# Ejecuta el servidor en el directorio de tu proyecto
http-server -c-1

```

8.   
   Abre tu navegador y ve a http://localhost:8080. La aplicación detectará que estás en localhost y usará la clave de tu config.js.

### **2\. Despliegue en Producción (¡SEGURO\!)**

**NUNCA** subas tu archivo config.js ni tu clave de API a GitHub. Usaremos la arquitectura de "proxy" (serverless function) en Vercel o Netlify.

1. **Sube tu Proyecto a GitHub:**  
   * Asegúrate de que tu .gitignore esté impidiendo que config.js se suba.  
   * Incluye los archivos: index.html, style.css, script.js, api/chat.js, README.md, y .gitignore.  
2. **Crea una Cuenta en Vercel:**  
   * Regístrate en [Vercel](https://vercel.com/) y conecta tu cuenta de GitHub.  
   * Importa tu repositorio de GitHub como un nuevo proyecto en Vercel.  
3. **Configura las Variables de Entorno (El Secreto):**  
   * En el panel de tu proyecto en Vercel, ve a "Settings" \-\> "Environment Variables".  
   * Crea una nueva variable llamada:  
     * **Nombre:** GEMINI\_API\_KEY  
     * **Valor:** Pega tu clave de API secreta de Gemini aquí.  
   * Guarda los cambios.  
4. **Despliega:**  
   * Vercel detectará la carpeta /api y automáticamente desplegará tu archivo chat.js como una "Serverless Function" (un backend).  
   * El script.js detectará que *no* está en localhost y automáticamente llamará a /api/chat.  
   * El servidor /api/chat leerá la variable de entorno GEMINI\_API\_KEY de forma segura y llamará a Google.

¡Tu proyecto estará desplegado de forma segura y profesional\!
