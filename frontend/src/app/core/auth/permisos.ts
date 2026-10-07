/*
 * Mapa de permisos del frontend: qué roles pueden hacer qué.
 * Debe coincidir con las políticas del backend (backend/Seguridad/Politicas.cs).
 *
 * Para dar acceso a un rol nuevo (por ejemplo "Editor") basta con agregarlo a la lista
 * del permiso: ni el guard, ni las rutas, ni los componentes cambian.
 */
export const PERMISOS = {
  'inventario.gestionar': ['Administrador'],
  // Ver usuarios y cambiar su rol (política GestionUsuarios).
  'usuarios.gestionar': ['Administrador'],
} as const satisfies Record<string, readonly string[]>;

export type Permiso = keyof typeof PERMISOS;
