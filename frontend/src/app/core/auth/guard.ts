import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth } from './auth';
import { Permiso } from './permisos';

/**
 * Guard funcional (canMatch) por permiso: la ruta solo "existe" para quien tiene el permiso.
 * Sin permiso (o sin sesión) redirige a /admin/ingresar. Como es canMatch, el código de la
 * zona protegida ni siquiera se descarga si no se puede entrar.
 */
export function requierePermiso(permiso: Permiso): CanMatchFn {
  return () => {
    const auth = inject(Auth);
    return auth.tienePermiso(permiso) ? true : inject(Router).parseUrl('/admin/ingresar');
  };
}
