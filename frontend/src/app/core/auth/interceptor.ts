import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avisos } from '../services/avisos';
import { Auth } from './auth';

/**
 * Interceptor de autenticación (funcional):
 * 1. Si hay sesión, agrega "Authorization: Bearer <token>" SOLO a las peticiones de la API
 *    (nunca a Cloudinary ni a otros dominios) y solo si la petición no trae ya ese encabezado.
 * 2. Si la API responde 401 a una petición que llevaba la sesión: el token ya no sirve,
 *    se cierra la sesión y Auth lleva a /admin/ingresar.
 * 3. Si responde 403: el usuario no tiene permiso; se muestra un aviso.
 * El error se vuelve a lanzar para que cada pantalla pueda reaccionar (por ejemplo, el formulario).
 */
export const interceptorAuth: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(Auth);
  const avisos = inject(Avisos);
  const sesion = auth.sesion();
  const esDeLaApi = !!environment.apiBaseUrl && peticion.url.startsWith(environment.apiBaseUrl);
  const conSesion = esDeLaApi && !!sesion && !peticion.headers.has('Authorization');

  const enviada = conSesion
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${sesion.token}` } })
    : peticion;

  return siguiente(enviada).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && conSesion) {
        if (error.status === 401) {
          auth.cerrarSesion('expirada');
        } else if (error.status === 403) {
          avisos.error('No tienes permiso para esta acción.');
        }
      }
      return throwError(() => error);
    }),
  );
};
