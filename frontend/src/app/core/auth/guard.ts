import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth } from './auth';
import { Permiso } from './permisos';

/**
 * Guard funcional (canMatch) por permiso: la ruta solo "existe" para quien tiene el permiso.
 * - Sin sesión: lleva a /login?volver=<ruta pedida> para regresar después de iniciar sesión.
 * - Con sesión pero sin permiso (rol Cliente): lleva a /login?permiso=denegado, que muestra
 *   "No tienes permiso…".
 * Como es canMatch, el código de la zona protegida ni siquiera se descarga si no se puede entrar.
 */
/**
 * Guard (canMatch) para rutas que solo piden haber iniciado sesión, como /carrito.
 * Sin sesión lleva a /login?volver=<ruta pedida>.
 */
export const requiereSesion: CanMatchFn = (_ruta, segmentos) => {
  const auth = inject(Auth);
  if (auth.autenticado()) {
    return true;
  }
  const volver = '/' + segmentos.map((s) => s.path).join('/');
  return inject(Router).createUrlTree(['/login'], { queryParams: { volver } });
};

export function requierePermiso(permiso: Permiso): CanMatchFn {
  return (_ruta, segmentos) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.tienePermiso(permiso)) {
      return true;
    }
    if (!auth.autenticado()) {
      const volver = '/' + segmentos.map((s) => s.path).join('/');
      return router.createUrlTree(['/login'], { queryParams: { volver } });
    }
    return router.createUrlTree(['/login'], { queryParams: { permiso: 'denegado' } });
  };
}
