/** Una fila de GET /api/usuarios (UsuarioAdminDto del backend). Nunca trae la contraseña. */
export interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  cafesCreados: number;
}

export type Rol = 'Administrador' | 'Cliente';
