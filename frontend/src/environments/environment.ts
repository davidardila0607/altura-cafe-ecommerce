// Entorno de producción (ng build, configuración "production").
// apiBaseUrl NO se edita a mano: en Railway, el Dockerfile ejecuta herramientas/escribir-entorno.mjs
// antes de "ng build" y escribe aquí el valor de la variable API_URL (la URL pública de la API,
// terminada en /api). El marcador de abajo solo queda si se compila sin API_URL. Ver DEPLOY.md.
// La API debe tener la URL del frontend en Cors__AllowedOrigins__0.
export const environment = {
  apiBaseUrl: 'https://TU-API.up.railway.app/api',
  // Base de entrega de Cloudinary (el cloud name no es un secreto).
  cloudinaryBase: 'https://res.cloudinary.com/otxg5mih/image/upload',
};
