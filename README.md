# Charlas CEEBI

Frontend y backend para realizar las consultas de los talleres y las microcharlas del CEEBI.

- Primero, ejecutar `npm i`
- Para generar el frontend, utilizar `npm run build`
- Para ejecutar el backend, `npm run api` o una herramienta como `pm2 start "npm run api" --name charlasCEEBI`

Asegurarse de tener el archivo `api/.env` con el contenido:
````dotenv
SUPABASE_URL=https://your-supabase-url.com
SUPABASE_KEY=your-supabase-key
````