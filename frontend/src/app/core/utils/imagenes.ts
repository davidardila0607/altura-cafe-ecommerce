import { environment } from '../../../environments/environment';

/** Transformación de Cloudinary para las imágenes de las cards. */
const TRANSFORMACION_CARD = 'f_auto,q_auto,w_600';

/**
 * Las fotos de producto (1600×1600) dejan mucho fondo gris alrededor de la bolsa.
 * Cloudinary recorta primero el 86 % central (`w_0.86,h_0.86` son proporciones) y luego
 * aplica formato, calidad y ancho. Se hace en Cloudinary y no con CSS para que la bolsa
 * mida lo mismo en la card, en la vista rápida y durante el vuelo entre las dos.
 */
const RECORTE_BOLSA = 'c_crop,g_center,w_0.86,h_0.86';

/**
 * Inserta el recorte de la bolsa y una transformación de Cloudinary después de `/upload/`
 * (por defecto `f_auto,q_auto,w_600`: formato y calidad automáticos, 600 px de ancho).
 * Devuelve la URL sin cambios si no es de Cloudinary o si ya está transformada.
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
  if (resto.startsWith(`${RECORTE_BOLSA}/`)) {
    return url;
  }

  return `${url.slice(0, indice + marcador.length)}${RECORTE_BOLSA}/${transformacion}/${resto}`;
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
