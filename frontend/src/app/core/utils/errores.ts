import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensaje en español para un error de la API.
 * Usa el detalle que manda el backend cuando existe (por ejemplo, el 409 de café duplicado
 * o el { mensaje } de /api/auth) y, en los 400 de validación, junta los mensajes de cada campo.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
  const cuerpo = error.error as { detail?: string; mensaje?: string; errors?: Record<string, string[]> } | null;

  switch (error.status) {
    case 0:
      return 'No pudimos conectar con el servidor. Revisa que la API esté encendida.';
    case 400: {
      const mensajes = Object.values(cuerpo?.errors ?? {}).flat();
      return mensajes.length
        ? mensajes.join(' ')
        : (cuerpo?.mensaje ?? cuerpo?.detail ?? 'Revisa los datos del formulario.');
    }
    case 401:
      return 'Tu sesión terminó. Vuelve a ingresar.';
    case 403:
      return 'No tienes permiso para esta acción.';
    case 404:
      return 'No encontramos este registro: es posible que ya lo hayan eliminado.';
    case 409:
      return cuerpo?.detail ?? 'Ya existe un registro con esos datos.';
    default:
      return 'Ocurrió un error en el servidor. Intenta de nuevo.';
  }
}
