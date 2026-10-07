/**
 * Lectura de los datos (claims) del JWT que firma la API.
 *
 * Un JWT son tres textos en Base64URL separados por puntos: cabecera.datos.firma.
 * La parte central es un JSON con los claims. .NET usa como nombre de cada claim una URI
 * larga (ClaimTypes.Name, ClaimTypes.Role…), así que aquí se traducen a nombres simples.
 * El frontend solo LEE el token: quien comprueba la firma es la API en cada petición.
 */
const CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_NOMBRE = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export interface DatosToken {
  id: number;
  nombre: string;
  email: string;
  /** Un usuario puede tener uno o varios roles; la API manda un texto o una lista. */
  roles: string[];
  /** Momento de expiración en milisegundos (como Date.now()). */
  expira: number;
}

export function leerToken(token: string): DatosToken {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  // atob devuelve bytes; TextDecoder los convierte en texto UTF-8 (nombres con tildes).
  const bytes = Uint8Array.from(atob(base64), (letra) => letra.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;

  const rol = claims[CLAIM_ROL];
  return {
    id: Number(claims[CLAIM_ID]),
    nombre: String(claims[CLAIM_NOMBRE] ?? ''),
    email: String(claims[CLAIM_EMAIL] ?? ''),
    roles: Array.isArray(rol) ? rol.map(String) : rol ? [String(rol)] : [],
    expira: Number(claims['exp']) * 1000,
  };
}
