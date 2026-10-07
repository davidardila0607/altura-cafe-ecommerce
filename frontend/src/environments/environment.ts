// Entorno de producción (ng build, configuración "production").
// Antes de compilar para desplegar, cambia apiBaseUrl por la URL pública de la API,
// terminada en /api (por ejemplo, la que da Railway). Ver DEPLOY.md en la raíz del repositorio.
// La API debe tener esa URL del frontend en Cors__AllowedOrigins__0.
export const environment = {
  apiBaseUrl: 'https://TU-API.up.railway.app/api',
  // Base de entrega de Cloudinary (el cloud name no es un secreto).
  cloudinaryBase: 'https://res.cloudinary.com/otxg5mih/image/upload',
};
