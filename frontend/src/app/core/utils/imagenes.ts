import { environment } from '../../../environments/environment';

/** Transformación de Cloudinary para las imágenes de las cards. */
const TRANSFORMACION_CARD = 'f_auto,q_auto,w_600';

/**
 * Inserta una transformación de Cloudinary después de `/upload/`
 * (por defecto `f_auto,q_auto,w_600`: formato y calidad automáticos, 600 px de ancho).
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

/** `srcset` de una imagen de Cloudinary con varios anchos (f_auto,q_auto,w_N). */
export function srcsetCloudinary(url: string | null | undefined, anchos: readonly number[]): string | null {
  if (!url) {
    return null;
  }
  return anchos.map((ancho) => `${optimizarImagenCloudinary(url, `f_auto,q_auto,w_${ancho}`)} ${ancho}w`).join(', ');
}

/** URL de una fotografía del sitio subida a Cloudinary (carpeta "sitio"). */
export function urlSitio(publicId: string, ancho: number): string {
  return `${environment.cloudinaryBase}/f_auto,q_auto,w_${ancho}/${publicId}`;
}

/** `srcset` de una fotografía del sitio. */
export function srcsetSitio(publicId: string, anchos: readonly number[]): string {
  return anchos.map((ancho) => `${urlSitio(publicId, ancho)} ${ancho}w`).join(', ');
}
