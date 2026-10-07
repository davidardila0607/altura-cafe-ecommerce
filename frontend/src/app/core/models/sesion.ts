import { DatosToken } from '../auth/token';

/** Respuesta de POST /api/auth/Login cuando el correo y la contraseña son correctos. */
export interface RespuestaLogin {
  token: string;
}

/** Respuesta de POST /api/auth/Register (y del 400 "El usuario ya existe."). */
export interface RespuestaRegistro {
  mensaje: string;
}

/** Sesión iniciada: los datos del token más el propio token (se guarda en localStorage). */
export interface Sesion extends DatosToken {
  token: string;
}
