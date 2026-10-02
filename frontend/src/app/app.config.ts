import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
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
import { interceptorAuth } from './core/auth/interceptor';
import { movimientoReducido } from './core/utils/medios';

// Formato de precios en pesos colombianos ("$ 42.000") en toda la app, también en el panel.
registerLocaleData(localeEsCo, 'es-CO');

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
    // El interceptor agrega el token del panel de administración a las peticiones de la API.
    provideHttpClient(withFetch(), withInterceptors([interceptorAuth])),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: alCrearTransicion }),
      withComponentInputBinding(),
    ),
  ],
};
