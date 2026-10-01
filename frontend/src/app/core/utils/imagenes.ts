/** Transformaciones de Cloudinary para las imágenes de las cards. */
const TRANSFORMACION_CARD = 'f_auto,q_auto,w_600';

/**
 * Inserta `f_auto,q_auto,w_600` después de `/upload/` en una URL de Cloudinary
 * (formato y calidad automáticos, 600 px de ancho).
 * Devuelve la URL sin cambios si no es de Cloudinary o si ya tiene esa transformación.
 */
export function optimizarImagenCloudinary(
  url: string | null | undefined,
  transformacion = TRANSFORMACION_CARD,
): string | null {
  if (!url) {
    return null;
  }

  const marcador = '/upload/';
  const indice = url.indexOf(marcador);

  if (!url.includes('res.cloudinary.com') || indice === -1) {
    return url;
  }

  const resto = url.slice(indice + marcador.length);
  if (resto.startsWith(`${transformacion}/`)) {
    return url;
  }

  return `${url.slice(0, indice + marcador.length)}${transformacion}/${resto}`;
}

/** Normaliza texto para búsquedas: minúsculas y sin tildes ("Volcán" → "volcan"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
