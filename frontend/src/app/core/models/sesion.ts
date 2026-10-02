/** Respuesta de POST /api/auth/login (`LoginResponseDto`). */
export interface RespuestaLogin {
  token: string;
  email: string;
  role: string;
}

/** Respuesta de GET /api/auth/me (`UsuarioActualDto`). */
export interface UsuarioActual {
  email: string;
  nombre: string;
  roles: string[];
}

/** Sesión del panel de administración (se guarda en sessionStorage). */
export interface Sesion extends UsuarioActual {
  token: string;
  /** Momento de expiración del token, en milisegundos (Date.now()). */
  expira: number;
}
