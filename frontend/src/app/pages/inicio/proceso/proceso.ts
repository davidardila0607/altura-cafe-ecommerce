import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { PASOS_PROCESO } from '../../../core/data/contenido-marca';
import { navegadorCompleto } from '../../../core/utils/medios';
import { cargarGsap, refrescarScroll } from '../../../core/utils/gsap';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';

/**
 * "De la montaña a tu taza": galería horizontal anclada al scroll.
 *
 * Técnica (sin "pin" de GSAP, solo CSS sticky):
 * - La sección mide 400vh de alto (clase .anclado) y su contenido es position: sticky,
 *   así que queda quieto en pantalla mientras se recorren esos 400vh.
 * - GSAP mueve la pista hacia la izquierda en proporción a ese recorrido (scrub), hasta que
 *   la última foto llega al borde derecho.
 * Solo se activa en pantallas de 900 px o más y sin movimiento reducido; si no, la pista es
 * una fila con scroll horizontal normal.
 */
@Component({
  selector: 'app-proceso',
  templateUrl: './proceso.html',
  styleUrl: './proceso.css',
})
export class Proceso {
  protected readonly pasos = PASOS_PROCESO.map((paso) => ({
    ...paso,
    src: urlSitio(paso.foto.publicId, 900),
    srcset: srcsetSitio(paso.foto.publicId, [480, 720, 960, 1280]),
  }));

  private readonly seccion = viewChild.required<ElementRef<HTMLElement>>('seccion');
  private readonly pista = viewChild.required<ElementRef<HTMLElement>>('pista');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(async () => {
      if (!navegadorCompleto()) {
        return;
      }
      const { gsap } = await cargarGsap();
      const seccion = this.seccion().nativeElement;
      const pista = this.pista().nativeElement;

      const medios = gsap.matchMedia();
      medios.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        seccion.classList.add('anclado');
        const recorrido = { trigger: seccion, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true };

        // Distancia horizontal = ancho total de la pista − ancho de la pantalla.
        gsap.to(pista, { x: () => -(pista.scrollWidth - window.innerWidth), ease: 'none', scrollTrigger: recorrido });
        // Las fotos se acercan un poco mientras pasan (de 115 % a 100 %).
        gsap.fromTo(pista.querySelectorAll('img'), { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: recorrido });

        refrescarScroll(); // la página creció: los demás ScrollTrigger recalculan sus posiciones
        return () => seccion.classList.remove('anclado');
      });
      destroyRef.onDestroy(() => medios.revert());
    });
  }
}
