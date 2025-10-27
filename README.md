# **Asesor de Empleo con IA (v2.0 \- Con Subida de Archivos)**

Este es un agente de IA para la búsqueda de empleos que actúa como un "headhunter" experto. El agente **acepta la subida de tu CV en formato PDF, DOCX o TXT**, lo procesa en el backend, busca empleos en tiempo real, identifica brechas de habilidades y te asesora.

## **Características**

* **Subida de Archivos:** Procesa CVs en formato .pdf, .docx, y .txt directamente.  
* **Backend con Node.js:** Utiliza un backend de Vercel (Node.js) para extraer texto de los archivos usando pdf-parse y mammoth.  
* **Agente de IA Proactivo:** Utiliza la API de Gemini con Google Search para encontrar empleos reales.  
* **Análisis de Brechas (Gap Analysis):** Compara tu CV con las descripciones de trabajo.  
* **Asesor de CV:** Un modo "Criticar mi CV" que te da feedback accionable.  
* **Multilingüe:** Soporta Español e Inglés.  
* **Arquitectura Segura:** La clave de API de Gemini vive *únicamente* en las variables de entorno del servidor de Vercel.

## **🚀 Configuración y Ejecución**

Esta nueva arquitectura **requiere un backend de Node.js** y no puede ejecutarse simplemente con http-server. La forma recomendada de ejecutarla localmente es con vercel dev.

### **1\. Requisitos Previos**

* [Node.js](https://nodejs.org/) (versión 18 o superior)  
* [Vercel CLI](https://vercel.com/docs/cli) (para desarrollo local)  
* Una clave de API de Google Gemini.

### **2\. Desarrollo Local (con Vercel CLI)**

1. **Clona el repositorio.**  
2. **Instala las dependencias del backend:**

```

npm install

```

5.   
   **Crea tu archivo de entorno local (¡CRÍTICO\!)**  
   * Crea un archivo llamado .env.local en la raíz del proyecto.  
   * Este archivo **es ignorado por Git** (.gitignore) para que nunca expongas tu clave.  
   * Añade tu clave de API de Gemini:

```

# .env.local (SÓLO PARA DESARROLLO LOCAL)
GEMINI_API_KEY="TU_API_KEY_AQUI"

```

8.   
   **Ejecuta el servidor de desarrollo de Vercel:**

```

vercel dev

```

11.   
    Abre tu navegador y ve a la URL que te proporciona vercel dev (normalmente http://localhost:3000). El comando vercel dev ejecuta tu frontend y tu backend (/api/chat.js) juntos, leyendo la clave desde .env.local.

### **3\. Despliegue en Producción (Vercel)**

1. **Sube tu Proyecto a GitHub:**  
   * Asegúrate de que tu .gitignore esté impidiendo que .env.local y node\_modules se suban.  
   * Incluye todos los archivos: index.html, style.css, script.js, api/chat.js, package.json, package-lock.json, README.md, y .gitignore.  
2. **Importa tu Proyecto en Vercel:**  
   * Importa tu repositorio de GitHub como un nuevo proyecto en Vercel.  
   * Vercel detectará el package.json y lo configurará como un proyecto "Vercel Functions (Node.js)".  
3. **Configura las Variables de Entorno (El Secreto):**  
   * En el panel de tu proyecto en Vercel, ve a "Settings" \-\> "Environment Variables".  
   * Crea una nueva variable llamada:  
     * **Nombre:** GEMINI\_API\_KEY  
     * **Valor:** Pega tu clave de API secreta de Gemini aquí.  
   * Guarda los cambios.  
4. **Despliega:**  
   * Vercel instalará las dependencias de package.json (formidable, pdf-parse, mammoth) y desplegará tu backend.  
   * Tu proyecto estará desplegado de forma segura.
