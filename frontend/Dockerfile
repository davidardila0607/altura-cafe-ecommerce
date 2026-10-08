# Tienda de Altura (Angular 22) para Railway.
# Dos etapas: Node compila la aplicación; nginx sirve los archivos estáticos.
# Railway la usa sola si el servicio tiene Root Directory = frontend (busca un "Dockerfile" en esa carpeta).

# ===== 1. Compilar =====
FROM node:24-slim AS compilar
WORKDIR /app

# Sin la pregunta de estadísticas de Angular (el build no es interactivo).
ENV NG_CLI_ANALYTICS=false

# Primero solo las dependencias: si package-lock.json no cambia, Docker reutiliza "npm ci".
COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# URL pública de la API, terminada en /api. Railway la pasa al build porque se declara con ARG.
ARG API_URL
RUN node herramientas/escribir-entorno.mjs && npx ng build

# ===== 2. Servir =====
FROM nginx:1.27-alpine

# La imagen de nginx reemplaza ${PORT} en las plantillas de /etc/nginx/templates al arrancar.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=compilar /app/dist/altura-web/browser /usr/share/nginx/html

# Railway pone PORT; si no existe (por ejemplo, al probar la imagen en local), 8080.
ENV PORT=8080
EXPOSE 8080
