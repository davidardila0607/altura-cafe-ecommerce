import { ApplicationRef } from '@angular/core';
import { movimientoReducido } from './medios';

/**
 * Ejecuta un cambio de estado dentro de una View Transition (si el navegador la soporta y
 * el usuario no pidió movimiento reducido): el DOM se actualiza de forma síncrona con
 * appRef.tick() para que la API capture el estado nuevo y anime el reordenamiento.
 * Devuelve una promesa que se resuelve cuando termina la animación (o de inmediato).
 */
export function conTransicion(appRef: ApplicationRef, actualizar: () => void): Promise<void> {
  if (movimientoReducido() || !('startViewTransition' in document)) {
    actualizar();
    return Promise.resolve();
  }

  const transicion = document.startViewTransition(() => {
    actualizar();
    appRef.tick();
  });

  // Si otra transición la interrumpe, "ready" se rechaza con AbortError: se captura.
  transicion.ready.catch(() => undefined);
  return transicion.finished.catch(() => undefined);
}
