import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FOTOS_SITIO } from '../../../core/data/contenido-marca';
import { cargarGsap } from '../../../core/utils/gsap';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';
import { movimientoReducido, navegadorCompleto } from '../../../core/utils/medios';
import { Magnetico } from '../../../shared/movimiento/magnetico';

/**
 * Hero "Valle": la palabra Altura vive entre las capas de la montaña.
 *
 * Entrada (CSS, una vez): las crestas suben en cascada y las letras aparecen una por una.
 * Scroll (GSAP): cada capa baja a distinta velocidad mientras el hero sale de la pantalla.
 * Las capas lejanas bajan más (parecen moverse más lento), así se siente la profundidad, y
 * la palabra se hunde detrás de las crestas cercanas.
 */
@Component({
  selector: 'app-hero',
  imports: [RouterLink, Magnetico],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  protected readonly letras = [...'Altura'];
  protected readonly foto = FOTOS_SITIO.origen;
  protected readonly src = urlSitio(this.foto.publicId, 1600);
  protected readonly srcset = srcsetSitio(this.foto.publicId, [640, 960, 1280, 1600, 2000]);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(async () => {
      if (!navegadorCompleto()) {
        return;
      }
      const { gsap } = await cargarGsap();
      // matchMedia de GSAP: el parallax solo existe sin movimiento reducido, y si la
      // preferencia cambia, GSAP deshace todo lo que se creó dentro.
      const medios = gsap.matchMedia();
      medios.add('(prefers-reduced-motion: no-preference)', () => {
        const alSalir = { trigger: this.host, start: 'top top', end: 'bottom top', scrub: true };
        // yPercent = desplazamiento en % de la altura de cada capa.
        const capas: [string, number][] = [
          ['.cielo', 30],
          ['.capa-1', 24],
          ['.palabra', 70],
          ['.capa-2', 16],
          ['.capa-3', 8],
        ];
        for (const [selector, yPercent] of capas) {
          gsap.to(this.host.querySelector(selector), { yPercent, ease: 'none', scrollTrigger: alSalir });
        }
        gsap.to(this.host.querySelector('.contenido'), { opacity: 0, y: -60, ease: 'none', scrollTrigger: { ...alSalir, end: '60% top' } });
      });
      destroyRef.onDestroy(() => medios.revert());
    });
  }

  /** "Ver el proceso": baja a la sección del proceso y le pasa el foco (lectores de pantalla). */
  protected irAlProceso(): void {
    const destino = document.getElementById('proceso');
    if (!destino) {
      return;
    }
    destino.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'start' });
    destino.focus({ preventScroll: true });
  }
}
