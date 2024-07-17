# CEEBI

_Frontend_ y _backend_ para realizar las consultas de los talleres y las microcharlas del CEEBI, descargar los certificados de asistencia y ver y realizar preguntas en las distintas charlas.

Para ejecutar localmente este proyecto hay que seguir los siguientes pasos:

- Clonar el repositorio.
- Dentro de una consola, ejecutar `npm i`.
- Para generar el _frontend_, utilizar `npm run build`.
- Para ejecutar el _backend_, `npm run api:build` y después `npm run api:start`.

Asegúrate de tener el archivo `.env` con el contenido:

```dotenv
SUPABASE_URL_2023=https://your-supabase-url.com
SUPABASE_KEY_2023=your-supabase-key
SUPABASE_URL_2024=https://your-supabase-url.com
SUPABASE_KEY_2024=your-supabase-key
BASE_URL=https://your-url.com
VITE_API_URL=https://your-url.com/api
API_PORT=3000
VITE_BUILD_KEY=your-vite-build-key
```
