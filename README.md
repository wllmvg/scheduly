# Scheduly
 
**Convierte tu horario académico PDF en un calendario digital listo para importar.**
 
Scheduly toma el horario oficial de la Universidad de Santander (UDES) en formato PDF y genera automáticamente un archivo `.ICS` compatible con Google Calendar, Apple Calendar y Outlook. Cada clase se convierte en un evento recurrente semanal con un recordatorio 30 minutos antes.
 
---
 
## Características
 
- **Extracción automática** de la grilla de horario desde el PDF oficial UDES
- **Detección de franjas horarias** con conversión AM/PM a formato 24h
- **Fusión de bloques consecutivos** de una misma materia en un único evento
- **Fechas de inicio y fin por asignatura** leídas directamente del PDF (soporte para cursos con rangos distintos al semestre general)
- **Recordatorios automáticos** de 30 minutos antes de cada clase
- **Compatible** con Google Calendar, Apple Calendar, Outlook y cualquier app que soporte `.ICS` (RFC 5545)
- **Sin almacenamiento**: el PDF nunca se guarda en el servidor
- **Contador de horarios procesados** en tiempo real vía Supabase
---
 
## Estructura del proyecto
 
```
scheduly/
├── backend/                  # API Flask (Python)
│   ├── api/
│   │   └── process.py        # Endpoints Flask: /api/process, /api/stats
│   ├── processor/
│   │   └── scheduly.py       # Lógica central: extracción PDF → generación ICS
│   ├── requirements.txt
│   ├── runtime.txt           # python-3.12
│   └── .env.example
├── frontend/                 # SPA React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Navbar, Hero, Footer, UploadZone, Loader...
│   │   ├── pages/            # Home, Features, Result, Credits
│   │   ├── services/
│   │   │   └── api.ts        # Cliente Axios hacia el backend
│   │   └── context/
│   │       └── SchedulyContext.tsx
│   ├── public/
│   │   └── scheduly-icon.svg
│   ├── vercel.json
│   └── package.json
├── vercel.json               # Configuración raíz para Vercel (serverless Python)
└── LICENSE                   # Apache 2.0
```
 
---
 
## Instalación y uso local
 
### Requisitos previos
 
- Python 3.12+
- Node.js 18+
### Backend
 
```bash
cd backend
 
# Instalar dependencias
pip install -r requirements.txt
 
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase (opcional, solo para el contador)
 
# Iniciar el servidor de desarrollo
python api/process.py
# http://localhost:5000
```
 
### Frontend
 
```bash
cd frontend
 
# Instalar dependencias
npm install
 
# Configurar la URL del backend
echo "VITE_API_URL=http://localhost:5000" > .env
 
# Iniciar el servidor de desarrollo
npm run dev
# http://localhost:5173
```
 
---
 
## API
 
### `GET /`
 
Comprueba que el servidor está activo.
 
**Respuesta:**
```json
{ "success": true, "message": "Scheduly API running" }
```
 
---
 
### `POST /api/process`
 
Recibe el PDF del horario y devuelve un archivo `.ICS`.
 
**Cuerpo (multipart/form-data):**
 
| Campo | Tipo | Descripción          |
|-------|------|----------------------|
| file  | File | PDF del horario UDES |
 
**Respuesta exitosa:** archivo `horario.ics` (MIME: `text/calendar`)
 
**Errores:**
```json
{ "success": false, "message": "No file provided" }      // 400
{ "success": false, "message": "Only PDF files allowed" } // 400
{ "success": false, "message": "<detalle del error>" }    // 500
```
 
---
 
### `GET /api/stats`
 
Devuelve el total de horarios procesados (requiere Supabase configurado).
 
**Respuesta:**
```json
{ "count": 142 }
```
 
---
 
## Variables de entorno
 
### Backend (`backend/.env`)
 
| Variable       | Descripción                                     | Requerida |
|----------------|-------------------------------------------------|-----------|
| `SUPABASE_URL` | URL del proyecto Supabase para el contador      | No        |
| `SUPABASE_KEY` | API Key de Supabase (anon key)                  | No        |
| `FLASK_ENV`    | Entorno de Flask (`development` / `production`) | No        |
 
Sin Supabase configurado, el contador devuelve `0` sin romper el flujo.
 
### Frontend (`frontend/.env`)
 
| Variable       | Descripción          | Por defecto             |
|----------------|----------------------|-------------------------|
| `VITE_API_URL` | URL base del backend | `http://localhost:5000` |
 
---
 
## Stack tecnológico
 
### Backend
 
| Tecnología | Versión | Uso                           |
|------------|---------|-------------------------------|
| Python     | 3.12    | Lenguaje principal            |
| Flask      | 3.1.1   | Framework web / API           |
| flask-cors | 6.0.1   | Control de CORS               |
| pdfplumber | 0.11.7  | Extracción de tablas del PDF  |
| gunicorn   | 23.0.0  | Servidor WSGI para producción |
| requests   | 2.32.3  | Llamadas a Supabase           |
 
### Frontend
 
| Tecnología       | Versión | Uso                         |
|------------------|---------|-----------------------------|
| React            | 19      | UI                          |
| TypeScript       | 6.0     | Tipado estático             |
| Vite             | 8       | Bundler / dev server        |
| Tailwind CSS     | 4       | Estilos                     |
| Framer Motion    | 12      | Animaciones                 |
| React Router DOM | 7       | Enrutamiento SPA            |
| Axios            | 1.17    | Cliente HTTP                |
| react-dropzone   | 15      | Drag & drop de archivos     |
| lucide-react     | 1.18    | Iconos                      |
 
---
 
## Despliegue
 
El proyecto está configurado para desplegarse en **Vercel** (frontend) y **Render** (backend).
 
### Frontend en Vercel
 
```bash
cd frontend
npm run build
# El directorio dist/ es el output estático
```
 
El archivo `frontend/vercel.json` incluye la configuración de rutas necesaria para el enrutamiento SPA.
 
### Backend en Render (o similar)
 
El archivo `backend/runtime.txt` especifica Python 3.12. El comando de inicio es:
 
```bash
gunicorn api.process:app
```
 
Configura las variables `SUPABASE_URL` y `SUPABASE_KEY` en las variables de entorno de tu servicio.
 
---
 
## Cómo funciona la conversión
 
El procesamiento ocurre en tres etapas dentro de `backend/processor/scheduly.py`:
 
1. **Extracción de la grilla** (`extraer_eventos`): recorre todas las páginas del PDF buscando tablas con columnas de días de la semana (Lunes–Domingo). Cada celda puede contener una o más clases con el formato `372905-B: ANTEPROYECTO Aula: 4-301`.
2. **Extracción de fechas por asignatura** (`extraer_fechas_por_codigo`): lee la tabla inferior del PDF que relaciona cada código de grupo con su rango de fechas `YYYY-MM-DD a YYYY-MM-DD`. Permite que materias con rangos distintos al semestre general sean mapeadas correctamente.
3. **Generación del ICS** (`generar_ics`): produce eventos `VEVENT` con `RRULE:FREQ=WEEKLY;UNTIL=...` para cada clase, incluyendo un `VALARM` con trigger de −30 minutos.
---
 
## Licencia
 
Distribuido bajo la licencia **Apache 2.0**. Ver el archivo [LICENSE](./LICENSE) para más detalles.
