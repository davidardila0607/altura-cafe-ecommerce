import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  ViewTransitionInfo,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { movimientoReducido } from './core/utils/medios';

/**
 * Transición suave entre rutas (View Transitions API).
 * Cuando solo cambian los query params (filtros del catálogo: la grilla anima su propio
 * reordenamiento) o el usuario prefiere movimiento reducido, la transición queda sin animación
 * con la clase "transicion-instantanea" en <html>. No se usa skipTransition(): en modo
 * desarrollo el router registra como error de consola el rechazo de la transición omitida.
 * En navegadores sin la API, Angular navega sin animación.
 */
function rutaFinal(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return snapshot.firstChild ? rutaFinal(snapshot.firstChild) : snapshot;
}

function alCrearTransicion({ transition, from, to }: ViewTransitionInfo): void {
  const reducido = movimientoReducido();
  const mismaRuta = rutaFinal(from).routeConfig === rutaFinal(to).routeConfig;

  if (reducido || mismaRuta) {
    const raiz = document.documentElement;
    raiz.classList.add('transicion-instantanea');
    transition.finished.finally(() => raiz.classList.remove('transicion-instantanea'));
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: alCrearTransicion }),
      withComponentInputBinding(),
    ),
  ],
};
